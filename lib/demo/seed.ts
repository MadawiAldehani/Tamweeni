// The Al-Sabah demo family: two past months of full-quota pickups with pantry
// check-ins, one collected donation, and a clean current month. Deterministic:
// the same `now` and ids always produce byte-identical output.
import { RATION_ITEMS, type RationItemId } from "@/lib/ration/catalog";
import { entitledQty } from "@/lib/ration/entitlement";
import { addMonths, currentMonth } from "@/lib/format";
import type {
  Donation,
  Member,
  PantryCheckin,
  PickupWithLines,
  Snapshot,
} from "@/lib/data/types";

const MEMBER_NAMES = ["Fahad", "Noura", "Abdullah", "Sara", "Yousef", "Dana", "Lulwa"] as const;

/**
 * What was left on the 27th of each past month (never above what was collected).
 * Usage is pro-rated from 24 days to a full month (× ~1.29), so every leftover stays
 * above ~23 % of the quota; otherwise the model would show a family using more than
 * its entitlement. milk_powder is two 2.27 kg tins.
 */
const REMAINING_LAST_MONTH: Record<RationItemId, number> = {
  rice: 20,
  sugar: 5,
  oil: 6,
  milk_powder: 4.54,
  milk_longlife: 12,
  tomato_paste: 16,
  lentils: 1.5,
  chicken: 6,
  dates: 2,
  infant_milk: 2,
  infant_food: 0.5,
};

/** Two months ago differs slightly so usage charts aren't flat. */
const REMAINING_TWO_MONTHS_AGO: Record<RationItemId, number> = {
  ...REMAINING_LAST_MONTH,
  rice: 21,
  sugar: 5.5,
  chicken: 7,
};

function isoDay(month: string, day: number): string {
  return `${month}-${String(day).padStart(2, "0")}`;
}

function isoTimestamp(month: string, day: number): string {
  return `${isoDay(month, day)}T09:00:00.000Z`;
}

/** Avoids 2.27 × 7 = 15.889999… style noise in the seeded quantities. */
function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function buildMembers(householdId: string): Member[] {
  return MEMBER_NAMES.map((name, index) => ({
    id: `demo-m${index + 1}`,
    household_id: householdId,
    name,
    is_infant: name === "Lulwa",
  }));
}

function buildPickup(householdId: string, members: Member[], month: string, slot: string): PickupWithLines {
  const id = `demo-pickup-${slot}`;
  return {
    id,
    household_id: householdId,
    month,
    pickup_date: isoDay(month, 3),
    source: "receipt",
    receipt_image_path: null,
    ai_confidence: 0.92,
    created_at: isoTimestamp(month, 3),
    lines: RATION_ITEMS.map((item) => ({
      id: `${id}-${item.id}`,
      pickup_id: id,
      item_id: item.id,
      qty: round2(entitledQty(item, members)),
      unit_price: item.subsidized_price,
    })),
  };
}

function buildCheckins(
  householdId: string,
  month: string,
  slot: string,
  remaining: Record<RationItemId, number>,
): PantryCheckin[] {
  return RATION_ITEMS.map((item) => ({
    id: `demo-checkin-${slot}-${item.id}`,
    household_id: householdId,
    item_id: item.id,
    checkin_date: isoDay(month, 27),
    qty_remaining: remaining[item.id],
  }));
}

export function buildDemoSnapshot(
  now: Date,
  ids?: { householdId?: string; ownerUserId?: string | null },
): Snapshot {
  const householdId = ids?.householdId ?? "demo-household";
  const thisMonth = currentMonth(now);
  const m1 = addMonths(thisMonth, -1);
  const m2 = addMonths(thisMonth, -2);
  const members = buildMembers(householdId);

  const donation: Donation = {
    id: "demo-donation-m1-rice",
    household_id: householdId,
    item_id: "rice",
    qty: 20,
    month: m1,
    status: "collected",
    voucher_code: "TW-DEMO1",
    created_at: isoTimestamp(m1, 10),
  };

  return {
    household: {
      id: householdId,
      owner_user_id: ids?.ownerUserId ?? null,
      name: "Al-Sabah family",
      governorate: "hawalli",
      coop_name: "Salmiya Co-op",
      created_at: isoTimestamp(m2, 1),
    },
    members,
    pickups: [buildPickup(householdId, members, m2, "m2"), buildPickup(householdId, members, m1, "m1")],
    checkins: [
      ...buildCheckins(householdId, m2, "m2", REMAINING_TWO_MONTHS_AGO),
      ...buildCheckins(householdId, m1, "m1", REMAINING_LAST_MONTH),
    ],
    plans: [],
    donations: [donation],
  };
}
