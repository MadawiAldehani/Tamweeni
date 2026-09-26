// Mock-mode store: the whole Snapshot lives in memory and is written through to
// localStorage on every mutation. No env vars, no network — this is the demo path.
import { buildDemoSnapshot } from "@/lib/demo/seed";
import { generateVoucherCode } from "@/lib/ration/voucher";
import type { RationItemId } from "@/lib/ration/catalog";
import type {
  AuthUser, CheckinInput, DataStore, DonationInput, DonationStatus, HouseholdInput,
  MemberInput, PickupInput, PickupWithLines, PlanLine, Snapshot,
} from "@/lib/data/types";
import { EMPTY_SNAPSHOT } from "@/lib/data/types";

const STORAGE_KEY = "tamweeni.db.v1";
const LOCAL_USER: AuthUser = { id: "local", email: null };

/** Works in insecure contexts too (LAN demos over http lack crypto.randomUUID). */
function newId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return `local-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Cheap shape check so a corrupted or foreign value never crashes the app. */
function isSnapshot(value: unknown): value is Snapshot {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return "household" in v && Array.isArray(v.members) && Array.isArray(v.pickups);
}

/** localStorage may be missing (SSR) or throw (private mode, quota); treat it as optional. */
function storage(): Storage | null {
  try { return typeof window !== "undefined" ? window.localStorage : null; } catch { return null; }
}

function readStored(): Snapshot {
  try {
    const raw = storage()?.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(EMPTY_SNAPSHOT);
    const parsed: unknown = JSON.parse(raw);
    // Older/partial shapes still load: missing arrays fall back to empty ones.
    return isSnapshot(parsed) ? { ...structuredClone(EMPTY_SNAPSHOT), ...parsed } : structuredClone(EMPTY_SNAPSHOT);
  } catch {
    return structuredClone(EMPTY_SNAPSHOT);
  }
}

export class LocalStore implements DataStore {
  readonly mode = "local" as const;
  private db: Snapshot = readStored();

  /** Persists the in-memory copy; failures (quota, private mode) are silent — memory still works. */
  private commit(): void {
    try {
      storage()?.setItem(STORAGE_KEY, JSON.stringify(this.db));
    } catch { /* memory-only fallback */ }
  }

  /** Every mutation needs a household; throwing here surfaces onboarding bugs early. */
  private householdId(): string {
    const id = this.db.household?.id;
    if (!id) throw new Error("No household yet — complete onboarding first");
    return id;
  }

  async getUser(): Promise<AuthUser | null> {
    return this.db.household ? LOCAL_USER : null;
  }

  async signInWithEmail(): Promise<void> {} // magic links are a Supabase-only concept
  async signOut(): Promise<void> {}

  async loadSnapshot(): Promise<Snapshot> {
    return structuredClone(this.db);
  }

  async createHousehold(input: HouseholdInput): Promise<void> {
    const { members, ...fields } = input;
    this.db = {
      ...structuredClone(EMPTY_SNAPSHOT),
      household: { id: newId(), owner_user_id: "local", created_at: new Date().toISOString(), ...fields },
    };
    await this.setMembers(members);
  }

  async updateHousehold(patch: Partial<Omit<HouseholdInput, "members">>): Promise<void> {
    this.householdId();
    this.db.household = { ...this.db.household!, ...patch };
    this.commit();
  }

  /** Reconciles by id: existing ids are kept, new members get ids, absent ones are dropped. */
  async setMembers(members: MemberInput[]): Promise<void> {
    const household_id = this.householdId();
    const existing = new Set(this.db.members.map((m) => m.id));
    this.db.members = members.map((m) => ({
      id: m.id && existing.has(m.id) ? m.id : newId(), household_id, name: m.name.trim(), is_infant: m.is_infant,
    }));
    this.commit();
  }

  async createPickup(input: PickupInput): Promise<PickupWithLines> {
    const household_id = this.householdId();
    const id = newId();
    const { month, pickup_date, source, ai_confidence = null } = input;
    const pickup: PickupWithLines = {
      id, household_id, month, pickup_date, source, ai_confidence,
      receipt_image_path: null, // receipt_image is only uploaded in Supabase mode
      created_at: new Date().toISOString(),
      lines: input.lines.map((l) => ({ id: newId(), pickup_id: id, ...l })),
    };
    this.db.pickups.push(pickup);
    this.commit();
    return structuredClone(pickup);
  }

  async deletePickup(pickupId: string): Promise<void> {
    this.db.pickups = this.db.pickups.filter((p) => p.id !== pickupId); // lines are nested, so they go too
    this.commit();
  }

  async createCheckins(input: CheckinInput): Promise<void> {
    const household_id = this.householdId();
    for (const line of input.lines) {
      this.db.checkins.push({ id: newId(), household_id, checkin_date: input.checkin_date, ...line });
    }
    this.commit();
  }

  /** Upserts the month's plan, replacing its lines wholesale. */
  async savePlan(month: string, lines: PlanLine[] | { item_id: RationItemId; planned_qty: number }[]): Promise<void> {
    const household_id = this.householdId();
    const plan = this.db.plans.find((p) => p.month === month) ??
      { id: newId(), household_id, month, created_at: new Date().toISOString(), lines: [] };
    plan.lines = lines.map((l) => ({ plan_id: plan.id, item_id: l.item_id, planned_qty: l.planned_qty }));
    this.db.plans = [...this.db.plans.filter((p) => p.month !== month), plan];
    this.commit();
  }

  async createDonations(input: DonationInput): Promise<string> {
    const household_id = this.householdId();
    const voucher_code = generateVoucherCode();
    const created_at = new Date().toISOString();
    for (const line of input.lines) {
      this.db.donations.push({ id: newId(), household_id, month: input.month, status: "pledged", voucher_code, created_at, ...line });
    }
    this.commit();
    return voucher_code;
  }

  async setDonationStatus(voucherCode: string, status: DonationStatus): Promise<void> {
    this.db.donations = this.db.donations.map((d) => (d.voucher_code === voucherCode ? { ...d, status } : d));
    this.commit();
  }

  async loadDemoFamily(): Promise<void> {
    this.db = buildDemoSnapshot(new Date());
    this.commit();
  }

  async resetAll(): Promise<void> {
    this.db = structuredClone(EMPTY_SNAPSHOT);
    try { storage()?.removeItem(STORAGE_KEY); } catch { /* nothing to clear */ }
  }
}
