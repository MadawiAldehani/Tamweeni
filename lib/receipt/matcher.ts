// Rule-based mapping of OCR text to catalog items. Free and offline; the family confirms
// every line afterwards, so this only needs to be a good first guess.
import { getItem, type RationItemId } from "@/lib/ration/catalog";
import type { ParsedLine, ParsedReceipt } from "@/lib/receipt/types";

/** Keywords per item, checked in order — specific brands before generic words. */
const KEYWORDS: [RationItemId, string[]][] = [
  ["infant_milk", ["حليب اطفال", "حليب أطفال", "سيميلاك", "similac", "s26", "infant milk", "baby milk", "رضع"]],
  ["infant_food", ["مغذيات", "سيريلاك", "cerelac", "infant food", "baby food", "baby cereal"]],
  ["milk_powder", ["نيدو", "nido", "بودرة", "مجفف", "milk powder", "powder"]],
  ["milk_longlife", ["كي دي دي", "كي دي", "kdd", "طويل", "long life", "uht", "حليب سائل"]],
  ["tomato_paste", ["معجون", "طماطم", "tomato", "paste"]],
  ["lentils", ["عدس", "lentil"]],
  ["chicken", ["دجاج", "chicken", "صدور"]],
  ["dates", ["تمر", "dates"]],
  ["rice", ["ارز", "أرز", "رز", "بسمتي", "rice", "basmati"]],
  ["sugar", ["سكر", "sugar"]],
  ["oil", ["زيت", "دلال", "oil", "sunflower"]],
];

/** Fallback when a line only says "milk": long-life is the more common purchase. */
const GENERIC_MILK = ["حليب", "milk"];

const ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";

/** Western digits and separators, no diacritics, unified alef/yaa/taa-marbuta, single spaces. */
export function normalizeArabic(text: string): string {
  return text
    .replace(/[٠-٩]/g, (d) => String(ARABIC_DIGITS.indexOf(d)))
    .replace(/٫/g, ".")
    .replace(/٬/g, "")
    .replace(/[ً-ْـ]/g, "")
    .replace(/[إأآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function matchItem(line: string): { item_id: RationItemId | null; strength: number } {
  for (const [id, words] of KEYWORDS) {
    const hits = words.filter((w) => line.includes(normalizeArabic(w))).length;
    if (hits > 0) return { item_id: id, strength: Math.min(1, 0.6 + 0.2 * hits) };
  }
  if (GENERIC_MILK.some((w) => line.includes(normalizeArabic(w)))) {
    return { item_id: "milk_longlife", strength: 0.45 };
  }
  return { item_id: null, strength: 0 };
}

const PACK = /(\d+(?:[.,]\d+)?)\s*(كجم|كيلو|kg|لتر|ليتر|ltr|l\b|جم|غم|غ\b|g\b|gm|مل|ml)/i;

/** Pack size in the catalog unit (kg or liter); null when the line has none. */
function packSize(line: string): number | null {
  const m = PACK.exec(line);
  if (!m) return null;
  const n = Number(m[1].replace(",", "."));
  const u = m[2].toLowerCase();
  if (/^(جم|غم|غ|g|gm|مل|ml)$/.test(u)) return n / 1000;
  return n;
}

/** Numeric tokens as written, so "4.200" can still be told apart from "4.2". */
function tokens(line: string): string[] {
  return line.match(/\d+(?:[.,]\d+)?/g) ?? [];
}

/** Parses one OCR line into a ParsedLine, or null when it is clearly not an item. */
export function parseLine(raw: string): ParsedLine | null {
  const line = normalizeArabic(raw);
  const { item_id, strength } = matchItem(line);
  if (!item_id) return null;

  const item = getItem(item_id);
  const size = item.unit === "can" ? null : packSize(line);
  // The pack size is not a count or a price: drop it before looking at the other numbers.
  const rest = size ? line.replace(PACK, " ") : line;
  const toks = tokens(rest);
  const nums = toks.map((t) => Number(t.replace(",", ".")));
  // Kuwaiti prices carry three decimals (4.200 KD); detect that on the raw token.
  const priceIdx = toks.findIndex((t) => /[.,]\d{3}$/.test(t));
  const price = priceIdx >= 0 ? nums[priceIdx] : null;
  const packs = nums.filter((n, i) => Number.isInteger(n) && i !== priceIdx && n < 500).at(-1) ?? 1;
  const qty = size ? Number((packs * size).toFixed(2)) : packs;

  let confidence = strength;
  if (toks.length === 0) confidence -= 0.25;
  if (!size && item.unit !== "can") confidence -= 0.15;
  const unit_price = price !== null && qty > 0 ? Number((price / qty).toFixed(3)) : null;

  return { raw_text: raw.trim(), item_id, qty, unit: item.unit, unit_price, confidence: Math.max(0.2, Math.min(0.9, confidence)) };
}

const DATE = /(\d{4})[/-](\d{1,2})[/-](\d{1,2})|(\d{1,2})[/-](\d{1,2})[/-](\d{4})/;

/** Turns a block of OCR text into a ParsedReceipt (store and date best-effort). */
export function matchReceiptText(text: string): ParsedReceipt {
  const rawLines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const normalized = rawLines.map(normalizeArabic);

  const storeIndex = normalized.findIndex((l) => /جمعيه|co-?op|society|تعاوني/.test(l));
  const store = storeIndex >= 0 ? rawLines[storeIndex] : null;

  let date: string | null = null;
  for (const l of normalized) {
    const m = DATE.exec(l);
    if (!m) continue;
    const [y, mo, d] = m[1] ? [m[1], m[2], m[3]] : [m[6], m[5], m[4]];
    date = `${y}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}`;
    break;
  }

  const lines = rawLines.map(parseLine).filter((l): l is ParsedLine => l !== null);
  return { store, date, lines };
}
