// POST /api/receipt/parse — multipart "image" → { receipt, backend: "claude" }.
// Without ANTHROPIC_API_KEY it answers 501 { backend: "none" } so the client falls back to on-device OCR.
import { NextResponse } from "next/server";
import { parseReceiptWithClaude, type ReceiptMediaType } from "@/lib/receipt/claude";

export const runtime = "nodejs";
export const maxDuration = 60;

/** The Claude API per-image limit; the client downscales well below this anyway. */
const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES: readonly ReceiptMediaType[] = ["image/jpeg", "image/png", "image/webp"];

/** Cheap in-memory throttle so a leaked URL cannot burn the founder's credits in a loop. */
const RATE_LIMIT = { max: 10, windowMs: 10 * 60 * 1000 } as const;
const hits = new Map<string, number[]>();

function isRateLimited(key: string, now = Date.now()): boolean {
  const recent = (hits.get(key) ?? []).filter((ts) => now - ts < RATE_LIMIT.windowMs);
  if (recent.length >= RATE_LIMIT.max) {
    hits.set(key, recent);
    return true;
  }
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 1000) hits.clear(); // never let the map grow unbounded
  return false;
}

function isAllowedType(type: string): type is ReceiptMediaType {
  return (ALLOWED_TYPES as readonly string[]).includes(type);
}

function invalidImage(): NextResponse {
  return NextResponse.json({ error: "invalid_image" }, { status: 400 });
}

export async function POST(req: Request): Promise<NextResponse> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ backend: "none" }, { status: 501 });
  }

  // Only our own pages may spend on the model: browsers mark other origins as cross-site.
  if (req.headers.get("sec-fetch-site") === "cross-site") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const caller = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (isRateLimited(caller)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return invalidImage();
  }

  const image = form.get("image");
  if (!(image instanceof Blob) || image.size === 0 || image.size > MAX_BYTES || !isAllowedType(image.type)) {
    return invalidImage();
  }

  try {
    const bytes = new Uint8Array(await image.arrayBuffer());
    const receipt = await parseReceiptWithClaude({ bytes, mediaType: image.type });
    return NextResponse.json({ receipt, backend: "claude" });
  } catch (err) {
    // Message only: never the stack, never the key.
    console.error("[api/receipt/parse]", err instanceof Error ? err.message : "unknown error");
    return NextResponse.json({ error: "parse_failed" }, { status: 502 });
  }
}
