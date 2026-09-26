import type { RationItemId, RationUnit } from "@/lib/ration/catalog";

/** One line of a receipt after parsing, before the family confirms it. */
export type ParsedLine = {
  raw_text: string;
  item_id: RationItemId | null;
  /** Quantity in the catalog unit of item_id (kg, liter or can). */
  qty: number;
  unit: RationUnit;
  unit_price: number | null;
  /** 0..1 — lines under 0.7 are highlighted for confirmation. */
  confidence: number;
};

export type ParsedReceipt = {
  store: string | null;
  /** "YYYY-MM-DD" or null when unreadable. */
  date: string | null;
  lines: ParsedLine[];
};

export type ParseBackend = "sample" | "ocr" | "claude";
