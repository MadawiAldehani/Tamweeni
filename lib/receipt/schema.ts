// Lenient validation for parsed receipts coming from the model or on-device OCR.
// Unknown item ids become null, numbers are clamped, and lines without text are dropped.
// No React here: shared by the API route and client code.
import { z } from "zod";
import { getItem, RATION_ITEM_IDS, type RationItemId, type RationUnit } from "@/lib/ration/catalog";
import type { ParsedLine, ParsedReceipt } from "@/lib/receipt/types";

const UNITS: readonly RationUnit[] = ["kg", "liter", "can"];

const ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";

/** Western digits and separators: "٠٫١٢٠" → "0.120", "١٬٠٠٠" → "1000". */
function latinDigits(text: string): string {
  return text
    .replace(/[٠-٩]/g, (d) => String(ARABIC_DIGITS.indexOf(d)))
    .replace(/٫/g, ".")
    .replace(/٬/g, "");
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string") {
    // A lone comma with no dot is a decimal comma ("1,050" KD), not a thousands separator.
    const text = latinDigits(value).trim();
    const decimalComma = !text.includes(".") && (text.match(/,/g) ?? []).length === 1;
    const cleaned = (decimalComma ? text.replace(",", ".") : text.replace(/,/g, "")).replace(/[^\d.\-]/g, "");
    const n = Number.parseFloat(cleaned);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function isItemId(value: unknown): value is RationItemId {
  return typeof value === "string" && (RATION_ITEM_IDS as readonly string[]).includes(value);
}

function isUnit(value: unknown): value is RationUnit {
  return typeof value === "string" && (UNITS as readonly string[]).includes(value);
}

/** Accepts "YYYY-MM-DD", "DD/MM/YYYY" or "YYYY/MM/DD" (Arabic digits and a trailing time are fine); anything else → null. */
export function normalizeReceiptDate(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const text = latinDigits(value).trim().split(/[T\s]/)[0] ?? "";
  let y: string | undefined;
  let m: string | undefined;
  let d: string | undefined;
  const iso = /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/.exec(text);
  const dmy = /^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/.exec(text);
  if (iso) [, y, m, d] = iso;
  else if (dmy) [, d, m, y] = dmy;
  if (!y || !m || !d) return null;
  const month = Number(m);
  const day = Number(d);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return `${y}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

const rawLineSchema = z.object({
  raw_text: z.preprocess((v) => (typeof v === "string" ? v.trim() : ""), z.string()),
  item_id: z.preprocess((v) => (isItemId(v) ? v : null), z.enum(RATION_ITEM_IDS).nullable()),
  qty: z.preprocess((v) => Math.max(0, toNumber(v) ?? 0), z.number().min(0)),
  unit: z.preprocess((v) => (isUnit(v) ? v : null), z.enum(UNITS).nullable()),
  unit_price: z.preprocess((v) => {
    const n = toNumber(v);
    return n === null || n < 0 ? null : n;
  }, z.number().min(0).nullable()),
  confidence: z.preprocess((v) => Math.min(1, Math.max(0, toNumber(v) ?? 0.5)), z.number().min(0).max(1)),
});

const lineSchema = rawLineSchema.transform((line): ParsedLine => ({
  raw_text: line.raw_text,
  item_id: line.item_id,
  qty: line.qty,
  // Quantities are expressed in the catalog unit, so a known item always uses its own unit.
  unit: line.item_id ? getItem(line.item_id).unit : (line.unit ?? "kg"),
  unit_price: line.unit_price,
  confidence: line.confidence,
}));

function hasRawText(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const raw = (value as { raw_text?: unknown }).raw_text;
  return typeof raw === "string" && raw.trim().length > 0;
}

/** Zod v4 schema producing a ParsedReceipt; tolerant of model and OCR noise. */
export const parsedReceiptSchema = z.object({
  store: z.preprocess((v) => {
    const text = typeof v === "string" ? v.trim() : "";
    return text.length > 0 ? text : null;
  }, z.string().nullable()),
  date: z.preprocess(normalizeReceiptDate, z.string().nullable()),
  lines: z.preprocess(
    (v) => (Array.isArray(v) ? v.filter(hasRawText) : v),
    z.array(lineSchema),
  ),
});

/** Validates loosely and normalises; throws a readable Error when the shape is hopeless. */
export function coerceParsedReceipt(input: unknown): ParsedReceipt {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("receipt: expected a JSON object with store, date and lines");
  }
  const result = parsedReceiptSchema.safeParse(input);
  if (!result.success) {
    const detail = result.error.issues
      .slice(0, 3)
      .map((issue) => `${issue.path.join(".") || "root"}: ${issue.message}`)
      .join("; ");
    throw new Error(`receipt: ${detail}`);
  }
  return result.data;
}
