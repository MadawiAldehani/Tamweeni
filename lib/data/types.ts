// Domain types and the storage contract. Two implementations exist:
// lib/data/local.ts (localStorage, "mock mode") and lib/data/supabase.ts.
// Field names mirror the Postgres columns in supabase/migrations so no mapping layer is needed.
import type { Locale } from "@/lib/i18n/config";
import type { RationItemId } from "@/lib/ration/catalog";
import type { Governorate } from "@/lib/ration/governorates";

export type Household = {
  id: string;
  owner_user_id: string | null;
  name: string;
  governorate: Governorate;
  coop_name: string;
  created_at: string;
};

export type Member = {
  id: string;
  household_id: string;
  name: string;
  /** Under two years old: unlocks the infant items. */
  is_infant: boolean;
};

export type PickupSource = "receipt" | "manual";

export type Pickup = {
  id: string;
  household_id: string;
  /** "YYYY-MM" the pickup counts toward. */
  month: string;
  /** "YYYY-MM-DD" */
  pickup_date: string;
  source: PickupSource;
  receipt_image_path: string | null;
  ai_confidence: number | null;
  created_at: string;
};

export type PickupLine = {
  id: string;
  pickup_id: string;
  item_id: RationItemId;
  qty: number;
  unit_price: number | null;
};

export type PickupWithLines = Pickup & { lines: PickupLine[] };

export type PantryCheckin = {
  id: string;
  household_id: string;
  item_id: RationItemId;
  /** "YYYY-MM-DD" */
  checkin_date: string;
  qty_remaining: number;
  /** Expired or thrown away since the pickup, in catalog units. Optional: older records have none. */
  qty_wasted?: number;
};

export type DonationStatus = "pledged" | "collected";

export type Donation = {
  id: string;
  household_id: string;
  item_id: RationItemId;
  qty: number;
  month: string;
  status: DonationStatus;
  /** Short code like "TW-7K3Q9"; every line of one pledge shares it. */
  voucher_code: string;
  created_at: string;
};

export type Plan = {
  id: string;
  household_id: string;
  month: string;
  created_at: string;
};

export type PlanLine = {
  plan_id: string;
  item_id: RationItemId;
  planned_qty: number;
};

export type PlanWithLines = Plan & { lines: PlanLine[] };

/** Everything the app knows about one household. Small enough to hold in memory. */
export type Snapshot = {
  household: Household | null;
  members: Member[];
  pickups: PickupWithLines[];
  checkins: PantryCheckin[];
  plans: PlanWithLines[];
  donations: Donation[];
};

export const EMPTY_SNAPSHOT: Snapshot = {
  household: null,
  members: [],
  pickups: [],
  checkins: [],
  plans: [],
  donations: [],
};

// ---------------------------------------------------------------- inputs

export type MemberInput = { id?: string; name: string; is_infant: boolean };

export type HouseholdInput = {
  name: string;
  governorate: Governorate;
  coop_name: string;
  members: MemberInput[];
};

export type PickupLineInput = { item_id: RationItemId; qty: number; unit_price: number | null };

export type PickupInput = {
  month: string;
  pickup_date: string;
  source: PickupSource;
  lines: PickupLineInput[];
  /** Uploaded to storage in Supabase mode; ignored in local mode. */
  receipt_image?: Blob | null;
  ai_confidence?: number | null;
};

export type CheckinInput = {
  checkin_date: string;
  lines: { item_id: RationItemId; qty_remaining: number; qty_wasted?: number }[];
};

export type DonationInput = {
  month: string;
  lines: { item_id: RationItemId; qty: number }[];
};

export type AuthUser = { id: string; email: string | null };

// ---------------------------------------------------------------- contract

export interface DataStore {
  readonly mode: "local" | "supabase";

  /** Local mode has no real auth: it returns a stable pseudo-user once a household exists. */
  getUser(): Promise<AuthUser | null>;
  /** Sends a magic link (Supabase) — no-op in local mode. */
  signInWithEmail(email: string, redirectTo: string): Promise<void>;
  signOut(): Promise<void>;

  /** Loads everything for the current user's household (household null when none yet). */
  loadSnapshot(): Promise<Snapshot>;

  createHousehold(input: HouseholdInput): Promise<void>;
  updateHousehold(patch: Partial<Omit<HouseholdInput, "members">>): Promise<void>;
  /** Replaces the member list; members with an id are updated, others created, missing ones deleted. */
  setMembers(members: MemberInput[]): Promise<void>;

  createPickup(input: PickupInput): Promise<PickupWithLines>;
  deletePickup(pickupId: string): Promise<void>;

  createCheckins(input: CheckinInput): Promise<void>;

  savePlan(month: string, lines: PlanLine[] | { item_id: RationItemId; planned_qty: number }[]): Promise<void>;

  /** Creates one pledged donation row per line, all sharing a fresh voucher code. Returns the code. */
  createDonations(input: DonationInput): Promise<string>;
  setDonationStatus(voucherCode: string, status: DonationStatus): Promise<void>;

  /** Replaces the current household with the seeded demo family (both modes), named in the family's language. */
  loadDemoFamily(locale?: Locale): Promise<void>;
  /** Deletes the household and all its data (local: clears storage). */
  resetAll(): Promise<void>;
}
