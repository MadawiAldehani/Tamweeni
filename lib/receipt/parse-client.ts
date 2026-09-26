// Browser-side receipt parsing: try the optional Claude backend, fall back to free
// on-device OCR when the server has no ANTHROPIC_API_KEY (HTTP 501), errors, or we are offline.
import { prepareReceiptImage } from "@/lib/receipt/image";
import { matchReceiptText } from "@/lib/receipt/matcher";
import { recognizeReceiptText } from "@/lib/receipt/ocr";
import { coerceParsedReceipt } from "@/lib/receipt/schema";
import type { ParseBackend, ParsedLine, ParsedReceipt } from "@/lib/receipt/types";

export type ParseStage = "preparing" | "uploading" | "ai" | "ocr" | "matching";
export type ParseProgress = { stage: ParseStage; percent: number };

export type ParseResult = { receipt: ParsedReceipt; backend: ParseBackend };

const PARSE_ENDPOINT = "/api/receipt/parse";
const OCR_RANGE = { from: 30, to: 85 } as const;

/** POSTs the image; null when the request itself failed (offline, DNS, aborted). */
async function postToServer(image: Blob): Promise<Response | null> {
  const body = new FormData();
  body.append("image", image, "receipt.jpg");
  try {
    return await fetch(PARSE_ENDPOINT, { method: "POST", body });
  } catch {
    return null;
  }
}

async function parseOnDevice(image: Blob, onProgress?: (p: ParseProgress) => void): Promise<ParseResult> {
  onProgress?.({ stage: "ocr", percent: OCR_RANGE.from });
  const text = await recognizeReceiptText(image, (percent) => {
    const span = OCR_RANGE.to - OCR_RANGE.from;
    onProgress?.({ stage: "ocr", percent: Math.round(OCR_RANGE.from + (span * percent) / 100) });
  });
  onProgress?.({ stage: "matching", percent: 95 });
  return { receipt: matchReceiptText(text), backend: "ocr" };
}

/**
 * Parses a receipt photo into catalog lines.
 * Resolves with an empty `lines` array when nothing was recognised (the UI shows an
 * empty state). Any server answer other than a usable 200 (no key, bad key, quota,
 * model refusal, offline) falls back to free on-device OCR, so this only rejects when
 * OCR itself cannot run (worker or language data failed to load).
 */
export async function parseReceiptImage(
  file: Blob,
  onProgress?: (p: ParseProgress) => void,
): Promise<ParseResult> {
  onProgress?.({ stage: "preparing", percent: 10 });
  const image = await prepareReceiptImage(file);

  onProgress?.({ stage: "uploading", percent: 25 });
  const response = await postToServer(image);

  if (response === null || !response.ok) {
    return parseOnDevice(image, onProgress);
  }

  onProgress?.({ stage: "ai", percent: 90 });
  const json: unknown = await response.json().catch(() => null);
  const payload = json && typeof json === "object" ? (json as { receipt?: unknown }).receipt : undefined;
  try {
    return { receipt: coerceParsedReceipt(payload), backend: "claude" };
  } catch {
    // The model answered but not in a shape we can use: the phone can still read it.
    return parseOnDevice(image, onProgress);
  }
}

/** Mean confidence of the parsed lines (0..1, two decimals); null when there are none. */
export function averageConfidence(lines: ParsedLine[]): number | null {
  if (lines.length === 0) return null;
  const total = lines.reduce((sum, line) => sum + line.confidence, 0);
  return Math.round((total / lines.length) * 100) / 100;
}
