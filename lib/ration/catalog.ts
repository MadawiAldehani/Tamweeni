/**
 * Single source of truth for quotas and prices. Verify against MOCI's current list before launch.
 *
 * Quantities are per person per month; prices are KD per unit. `market_price_estimate`
 * is a rough retail figure used only to show families the value of the subsidy.
 * No React here: this file is shared by server and client code.
 */

export const RATION_ITEM_IDS = [
  "rice",
  "sugar",
  "oil",
  "milk_powder",
  "milk_longlife",
  "tomato_paste",
  "lentils",
  "chicken",
  "dates",
  "infant_milk",
  "infant_food",
] as const;

export type RationItemId = (typeof RATION_ITEM_IDS)[number];
export type RationUnit = "kg" | "liter" | "can";
export type Eligibility = "all" | "infant";
/** Background tint used by ItemIcon; keeps the palette to green, sand, terracotta and cream. */
export type ItemTint = "green" | "sand" | "warm" | "cream";

export type RationItem = {
  id: RationItemId;
  name_en: string;
  name_ar: string;
  unit: RationUnit;
  qty_per_person: number;
  subsidized_price: number;
  market_price_estimate: number;
  eligibility: Eligibility;
  emoji: string;
  tint: ItemTint;
};

export const RATION_ITEMS: RationItem[] = [
  { id: "rice", name_en: "Rice", name_ar: "أرز", unit: "kg", qty_per_person: 5, subsidized_price: 0.12, market_price_estimate: 0.6, eligibility: "all", emoji: "🍚", tint: "sand" },
  { id: "sugar", name_en: "Sugar", name_ar: "سكر", unit: "kg", qty_per_person: 1, subsidized_price: 0.09, market_price_estimate: 0.4, eligibility: "all", emoji: "🧂", tint: "cream" },
  { id: "oil", name_en: "Cooking oil", name_ar: "زيت طعام", unit: "liter", qty_per_person: 3, subsidized_price: 1.05, market_price_estimate: 1.8, eligibility: "all", emoji: "🫒", tint: "green" },
  { id: "milk_powder", name_en: "Milk powder", name_ar: "حليب بودرة", unit: "kg", qty_per_person: 2.27, subsidized_price: 1.05, market_price_estimate: 3.5, eligibility: "all", emoji: "🥛", tint: "cream" },
  { id: "milk_longlife", name_en: "Long-life milk", name_ar: "حليب طويل الأمد", unit: "liter", qty_per_person: 6, subsidized_price: 0.25, market_price_estimate: 0.45, eligibility: "all", emoji: "🧃", tint: "sand" },
  // One tomato-paste "can" is 135 g.
  { id: "tomato_paste", name_en: "Tomato paste", name_ar: "معجون طماطم", unit: "can", qty_per_person: 4, subsidized_price: 0.27, market_price_estimate: 0.35, eligibility: "all", emoji: "🍅", tint: "warm" },
  { id: "lentils", name_en: "Lentils", name_ar: "عدس", unit: "kg", qty_per_person: 0.3, subsidized_price: 0.27, market_price_estimate: 0.7, eligibility: "all", emoji: "🫘", tint: "warm" },
  { id: "chicken", name_en: "Frozen chicken", name_ar: "دجاج مجمد", unit: "kg", qty_per_person: 3, subsidized_price: 0.5, market_price_estimate: 1.2, eligibility: "all", emoji: "🍗", tint: "sand" },
  { id: "dates", name_en: "Dates", name_ar: "تمر", unit: "kg", qty_per_person: 0.5, subsidized_price: 0.5, market_price_estimate: 1.5, eligibility: "all", emoji: "🌴", tint: "green" },
  { id: "infant_milk", name_en: "Infant milk", name_ar: "حليب أطفال", unit: "can", qty_per_person: 8, subsidized_price: 0.9, market_price_estimate: 3.0, eligibility: "infant", emoji: "🍼", tint: "cream" },
  { id: "infant_food", name_en: "Infant nutrients", name_ar: "مغذيات أطفال", unit: "can", qty_per_person: 2, subsidized_price: 0.9, market_price_estimate: 2.5, eligibility: "infant", emoji: "🥣", tint: "green" },
];

const byId = new Map<RationItemId, RationItem>(RATION_ITEMS.map((item) => [item.id, item]));

export function getItem(id: RationItemId): RationItem {
  const item = byId.get(id);
  if (!item) throw new Error(`Unknown ration item: ${id}`);
  return item;
}

/** KD saved per unit by buying at the co-op ration branch instead of retail. */
export function subsidyPerUnit(item: RationItem): number {
  return item.market_price_estimate - item.subsidized_price;
}
