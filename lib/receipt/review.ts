// Pure helpers for the receipt review screen: parsed lines become editable rows,
// totals are derived from them, and only clean rows become pickup lines.
import type { PickupLineInput, PickupSource } from "@/lib/data/types";
import { getItem, type RationItemId } from "@/lib/ration/catalog";
import { subsidyValue, type MonthSummary } from "@/lib/ration/entitlement";
import type { ParseBackend, ParsedLine, ParsedReceipt } from "@/lib/receipt/types";

export type ReviewLine = ParsedLine & {
  id: string;
  /** The family pressed "Looks right" on a low-confidence line. */
  confirmed: boolean;
};

/** Where the lines came from; "manual" is the "I collected my full quota" path. */
export type ReviewSource = ParseBackend | "manual";

export type ReviewTotals = {
  count: number;
  subsidyKD: number;
  /** Sum of kg + liter quantities (cans excluded): a rough "how much is that" figure. */
  volumeQty: number;
};

/** Lines below this are highlighted until the family confirms them. */
export const CONFIDENCE_THRESHOLD = 0.7;

let counter = 0;
function newLineId(): string {
  counter += 1;
  return `line-${Date.now().toString(36)}-${counter}`;
}

export function toReviewLines(receipt: ParsedReceipt): ReviewLine[] {
  return receipt.lines.map((line) => ({ ...line, id: newLineId(), confirmed: false }));
}

/**
 * What is still outstanding this month as pre-filled, already-confirmed lines (manual entry).
 * Items already fully collected are left out, so a second "full quota" never double-counts.
 */
export function fromEntitlement(summary: MonthSummary): ReviewLine[] {
  return summary.items
    .filter((row) => row.entitledQty > 0 && row.remainingQty > 0)
    .map((row) => ({
      id: newLineId(),
      raw_text: "",
      item_id: row.item.id,
      qty: row.remainingQty,
      unit: row.item.unit,
      unit_price: row.item.subsidized_price,
      confidence: 1,
      confirmed: true,
    }));
}

export function blankLine(): ReviewLine {
  return { id: newLineId(), raw_text: "", item_id: null, qty: 0, unit: "kg", unit_price: null, confidence: 1, confirmed: true };
}

/** Changing the item snaps the unit and (when empty) the price to the catalog. */
export function withItem(line: ReviewLine, item_id: RationItemId | null): ReviewLine {
  if (!item_id) return { ...line, item_id: null };
  const item = getItem(item_id);
  return { ...line, item_id, unit: item.unit, unit_price: line.unit_price ?? item.subsidized_price };
}

export function lineSubsidyKD(line: ReviewLine): number {
  if (!line.item_id || line.qty <= 0) return 0;
  return subsidyValue(getItem(line.item_id), line.qty);
}

export function reviewTotals(lines: ReviewLine[]): ReviewTotals {
  const counted = lines.filter((line) => line.item_id && line.qty > 0);
  return {
    count: counted.length,
    subsidyKD: counted.reduce((sum, line) => sum + lineSubsidyKD(line), 0),
    volumeQty: counted.reduce((sum, line) => sum + (line.unit === "can" ? 0 : line.qty), 0),
  };
}

/** True when the row still needs the family's attention (highlighted in amber). */
export function needsConfirmation(line: ReviewLine): boolean {
  return !line.confirmed && line.confidence < CONFIDENCE_THRESHOLD;
}

/** A parsed line the family marked "not a ration item": kept for context, never saved. */
export function isExcluded(line: ReviewLine): boolean {
  return line.item_id === null && line.raw_text !== "";
}

/** True when the row blocks saving: a blank added line, or an item with nothing collected. */
export function isInvalid(line: ReviewLine): boolean {
  if (line.item_id === null) return line.raw_text === "";
  return !(line.qty > 0);
}

/** True when at least one line will be saved and nothing is blocking. */
export function isSavable(lines: ReviewLine[]): boolean {
  return lines.some((line) => line.item_id && line.qty > 0) && lines.every((line) => !isInvalid(line));
}

export function toPickupLines(lines: ReviewLine[]): PickupLineInput[] {
  return lines
    .filter((line): line is ReviewLine & { item_id: RationItemId } => line.item_id !== null && line.qty > 0)
    .map((line) => ({ item_id: line.item_id, qty: line.qty, unit_price: line.unit_price }));
}

export function pickupSourceFor(source: ReviewSource): PickupSource {
  return source === "manual" ? "manual" : "receipt";
}
