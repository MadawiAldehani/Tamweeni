// SERVER ONLY. Reads ANTHROPIC_API_KEY and talks to the Claude API; never import this
// from client components or hooks (only from app/api/** route handlers).
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import { RATION_ITEM_IDS, RATION_ITEMS } from "@/lib/ration/catalog";
import { coerceParsedReceipt } from "@/lib/receipt/schema";
import type { ParsedReceipt } from "@/lib/receipt/types";

export type ReceiptMediaType = "image/jpeg" | "image/png" | "image/webp";

export type ReceiptImage = {
  bytes: Uint8Array;
  mediaType: ReceiptMediaType;
};

const MODEL = "claude-opus-5";
// Adaptive thinking shares this cap with the JSON answer; 16k keeps an 11-line receipt
// well clear of a max_tokens truncation while effort "low" keeps the thinking short.
const MAX_TOKENS = 16000;

// Plain schema for structured outputs (no transforms; lenient coercion happens afterwards).
const receiptOutputSchema = z.object({
  store: z.string().nullable(),
  date: z.string().nullable(),
  lines: z.array(
    z.object({
      raw_text: z.string(),
      item_id: z.enum(RATION_ITEM_IDS).nullable(),
      qty: z.number(),
      unit: z.enum(["kg", "liter", "can"]),
      unit_price: z.number().nullable(),
      confidence: z.number(),
    }),
  ),
});

const CATALOG_LIST = RATION_ITEMS.map(
  (item) => `- ${item.id}: ${item.name_en} / ${item.name_ar} (unit: ${item.unit})`,
).join("\n");

const SYSTEM_PROMPT = [
  "You read Kuwaiti co-op ration-branch receipts (فرع التموين). Receipts are usually Arabic, with brand names",
  "(e.g. أرز بسمتي, زيت دلال, حليب نيدو, حليب كي دي دي, معجون طماطم, دجاج مجمد, تمر, حليب أطفال, مغذيات أطفال).",
  "Map every line to the closest catalog item_id from this list, or null when it is not a ration item:",
  CATALOG_LIST,
  "Quantities must be in the catalog unit: multiply packs by pack size (e.g. '5 كجم × 7' → 35 kg; grams/1000;",
  "ml/1000; cans stay as count). unit_price is the price per catalog unit in KD when readable.",
  "confidence 0..1 per line. Return only the JSON object:",
  "{ store: string|null, date: 'YYYY-MM-DD'|null, lines: [{ raw_text, item_id, qty, unit, unit_price, confidence }] }",
].join("\n");

function toBase64(bytes: Uint8Array): string {
  return Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength).toString("base64");
}

function errorMessage(err: unknown): string {
  if (err instanceof Anthropic.APIError) return `API error ${err.status ?? ""} ${err.message}`.trim();
  if (err instanceof Error) return err.message;
  return "unknown error";
}

/** Sends the receipt image to Claude and returns a validated ParsedReceipt. Throws Error("claude: …"). */
export async function parseReceiptWithClaude(image: ReceiptImage): Promise<ParsedReceipt> {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error("claude: ANTHROPIC_API_KEY is not set");
  const client = new Anthropic();

  try {
    // Beta path so `fallbacks: "default"` re-runs a policy decline on Anthropic's recommended model.
    const response = await client.beta.messages.parse({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: image.mediaType, data: toBase64(image.bytes) } },
            { type: "text", text: "Read this receipt and return the JSON object." },
          ],
        },
      ],
      thinking: { type: "adaptive" },
      output_config: { effort: "low", format: betaZodOutputFormat(receiptOutputSchema) },
    });

    if (response.stop_reason === "refusal") {
      const why = response.stop_details?.explanation ?? "the model declined to read this image";
      throw new Error(why);
    }
    if (response.stop_reason === "max_tokens") throw new Error("response truncated (max_tokens)");

    let output: unknown = response.parsed_output;
    if (output === null || output === undefined) {
      const text = response.content.find((block) => block.type === "text");
      if (!text) throw new Error("no JSON in response");
      output = JSON.parse(text.text);
    }
    return coerceParsedReceipt(output);
  } catch (err) {
    throw new Error(`claude: ${errorMessage(err)}`);
  }
}
