// Supabase-backed store: same contract as lib/data/local.ts, but rows live in Postgres
// behind RLS and receipt photos in the private "receipts" bucket. Runs in the browser.
import { getSupabaseBrowserClient, type TamweeniClient } from "@/lib/supabase/client";
import { buildDemoSnapshot } from "@/lib/demo/seed";
import { generateVoucherCode } from "@/lib/ration/voucher";
import type { RationItemId } from "@/lib/ration/catalog";
import type {
  AuthUser, CheckinInput, DataStore, DonationInput, DonationStatus, Household, HouseholdInput,
  MemberInput, PickupInput, PickupLine, PickupWithLines, PlanLine, PlanWithLines, Snapshot,
} from "@/lib/data/types";
import { EMPTY_SNAPSHOT } from "@/lib/data/types";

type Failure = { message: string } | null;

/** Turns a Supabase error into a readable exception; otherwise no-op. */
function check(result: { error: Failure }): void {
  if (result.error) throw new Error(result.error.message);
}

/** Like check(), for queries whose data must exist (inserts with select, single rows). */
function must<T>(result: { data: T; error: Failure }): NonNullable<T> {
  check(result);
  if (result.data == null) throw new Error("Supabase returned no data");
  return result.data as NonNullable<T>;
}

/** Postgres ids are uuids; the fallback covers LAN demos over plain http (no crypto.randomUUID). */
function uuid(): string {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const hex = Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/** Copy of a row without the given keys (the seed's nested lines and its non-uuid ids). */
function strip<T extends object, K extends keyof T>(row: T, ...keys: K[]): Omit<T, K> {
  const copy = { ...row };
  for (const key of keys) delete copy[key];
  return copy;
}

export class SupabaseStore implements DataStore {
  readonly mode = "supabase" as const;
  private readonly client: TamweeniClient = getSupabaseBrowserClient();
  /** Cached after the first lookup; cleared whenever the household is replaced or deleted. */
  private cachedHouseholdId: string | null = null;

  async getUser(): Promise<AuthUser | null> {
    const { data } = await this.client.auth.getUser(); // "session missing" is not an error here: it means signed out
    return data.user ? { id: data.user.id, email: data.user.email ?? null } : null;
  }

  async signInWithEmail(email: string, redirectTo: string): Promise<void> {
    check(await this.client.auth.signInWithOtp({ email, options: { emailRedirectTo: redirectTo } }));
  }

  async signOut(): Promise<void> {
    check(await this.client.auth.signOut());
    this.cachedHouseholdId = null;
  }

  private async requireUser(): Promise<AuthUser> {
    const user = await this.getUser();
    if (!user) throw new Error("Not signed in");
    return user;
  }

  private async findHousehold(userId: string): Promise<Household | null> {
    const result = await this.client.from("households").select("*").eq("owner_user_id", userId).limit(1).maybeSingle();
    check(result);
    return result.data;
  }

  private async householdId(): Promise<string> {
    if (this.cachedHouseholdId) return this.cachedHouseholdId;
    const household = await this.findHousehold((await this.requireUser()).id);
    if (!household) throw new Error("No household yet — complete onboarding first");
    this.cachedHouseholdId = household.id;
    return household.id;
  }

  async loadSnapshot(): Promise<Snapshot> {
    const user = await this.getUser();
    const household = user ? await this.findHousehold(user.id) : null;
    if (!household) return structuredClone(EMPTY_SNAPSHOT);
    this.cachedHouseholdId = household.id;
    const [members, pickups, checkins, plans, donations] = await Promise.all([
      this.client.from("members").select("*").eq("household_id", household.id),
      this.client.from("pickups").select("*, pickup_lines(*)").eq("household_id", household.id).order("pickup_date"),
      this.client.from("pantry_checkins").select("*").eq("household_id", household.id).order("checkin_date"),
      this.client.from("plans").select("*, plan_lines(*)").eq("household_id", household.id),
      this.client.from("donations").select("*").eq("household_id", household.id).order("created_at"),
    ]);
    return {
      household,
      members: must(members),
      pickups: must(pickups).map(({ pickup_lines, ...p }) => ({ ...p, lines: pickup_lines as PickupLine[] })),
      checkins: must(checkins).map((c) => ({ ...c, item_id: c.item_id as RationItemId })),
      plans: must(plans).map(({ plan_lines, ...p }) => ({ ...p, lines: plan_lines as PlanLine[] })) as PlanWithLines[],
      donations: must(donations).map((d) => ({ ...d, item_id: d.item_id as RationItemId })),
    };
  }

  /** Idempotent: a re-submitted onboarding form updates the existing household instead of adding a second. */
  async createHousehold(input: HouseholdInput): Promise<void> {
    const user = await this.requireUser();
    const { members, ...fields } = input;
    const existing = await this.findHousehold(user.id);
    if (existing) {
      this.cachedHouseholdId = existing.id;
      check(await this.client.from("households").update(fields).eq("id", existing.id));
    } else {
      const row = { ...fields, owner_user_id: user.id };
      const household = must(await this.client.from("households").insert(row).select("id").single());
      this.cachedHouseholdId = household.id;
    }
    await this.setMembers(members);
  }

  async updateHousehold(patch: Partial<Omit<HouseholdInput, "members">>): Promise<void> {
    check(await this.client.from("households").update(patch).eq("id", await this.householdId()));
  }

  /** Reconciles by id: known ids are updated in place, new members inserted, absent ones deleted. */
  async setMembers(members: MemberInput[]): Promise<void> {
    const household_id = await this.householdId();
    const existing = must(await this.client.from("members").select("id").eq("household_id", household_id));
    const known = new Set(existing.map((m) => m.id));
    const rows = members.map((m) => ({
      id: m.id && known.has(m.id) ? m.id : uuid(), household_id, name: m.name.trim(), is_infant: m.is_infant,
    }));
    if (rows.length) check(await this.client.from("members").upsert(rows));
    const kept = new Set(rows.map((r) => r.id));
    const gone = [...known].filter((id) => !kept.has(id));
    if (gone.length) check(await this.client.from("members").delete().in("id", gone));
  }

  async createPickup(input: PickupInput): Promise<PickupWithLines> {
    const user = await this.requireUser();
    const household_id = await this.householdId();
    let receipt_image_path: string | null = null;
    if (input.receipt_image) {
      const path = `${user.id}/${uuid()}.jpg`;
      const upload = await this.client.storage.from("receipts").upload(path, input.receipt_image, {
        contentType: input.receipt_image.type || "image/jpeg", upsert: false,
      });
      receipt_image_path = must(upload).path;
    }
    const { month, pickup_date, source, ai_confidence = null } = input;
    const pickup = must(await this.client.from("pickups")
      .insert({ household_id, month, pickup_date, source, receipt_image_path, ai_confidence }).select("*").single());
    const lines = must(await this.client.from("pickup_lines")
      .insert(input.lines.map((l) => ({ pickup_id: pickup.id, ...l }))).select("*"));
    return { ...pickup, lines: lines as PickupLine[] };
  }

  async deletePickup(pickupId: string): Promise<void> {
    const row = await this.client.from("pickups").select("receipt_image_path").eq("id", pickupId).maybeSingle();
    check(row);
    if (row.data?.receipt_image_path) await this.removeReceipts([row.data.receipt_image_path]);
    check(await this.client.from("pickups").delete().eq("id", pickupId)); // lines cascade in Postgres
  }

  /** Storage has no cascades: receipt photos go by hand. Best effort — rows are the source of truth. */
  private async removeReceipts(paths: string[]): Promise<void> {
    if (!paths.length) return;
    const { error } = await this.client.storage.from("receipts").remove(paths);
    if (error) console.warn("Receipt cleanup failed", error.message);
  }

  async createCheckins(input: CheckinInput): Promise<void> {
    const household_id = await this.householdId();
    const rows = input.lines.map((l) => ({ household_id, checkin_date: input.checkin_date, ...l }));
    check(await this.client.from("pantry_checkins").insert(rows));
  }

  /** Upserts the month's plan (unique on household + month) and replaces its lines wholesale. */
  async savePlan(month: string, lines: PlanLine[] | { item_id: RationItemId; planned_qty: number }[]): Promise<void> {
    const household_id = await this.householdId();
    const plan = must(await this.client.from("plans")
      .upsert({ household_id, month }, { onConflict: "household_id,month" }).select("id").single());
    check(await this.client.from("plan_lines").delete().eq("plan_id", plan.id));
    const rows = lines.map((l) => ({ plan_id: plan.id, item_id: l.item_id, planned_qty: l.planned_qty }));
    if (rows.length) check(await this.client.from("plan_lines").insert(rows));
  }

  async createDonations(input: DonationInput): Promise<string> {
    const household_id = await this.householdId();
    const voucher_code = generateVoucherCode();
    const rows = input.lines.map((l) => ({ household_id, month: input.month, voucher_code, status: "pledged" as const, ...l }));
    check(await this.client.from("donations").insert(rows));
    return voucher_code;
  }

  async setDonationStatus(voucherCode: string, status: DonationStatus): Promise<void> {
    const household_id = await this.householdId();
    check(await this.client.from("donations").update({ status }).eq("household_id", household_id).eq("voucher_code", voucherCode));
  }

  /** Replaces the user's household with the seeded Al-Sabah family, minting real uuids for every row. */
  async loadDemoFamily(): Promise<void> {
    const user = await this.requireUser();
    await this.resetAll();
    const demo = buildDemoSnapshot(new Date(), { householdId: uuid(), ownerUserId: user.id });
    const household = demo.household!;
    const memberIds = new Map(demo.members.map((m) => [m.id, uuid()]));
    const pickupIds = new Map(demo.pickups.map((p) => [p.id, uuid()]));
    const planIds = new Map(demo.plans.map((p) => [p.id, uuid()]));
    const c = this.client;
    check(await c.from("households").insert(household));
    check(await c.from("members").insert(demo.members.map((m) => ({ ...m, id: memberIds.get(m.id)! }))));
    check(await c.from("pickups").insert(demo.pickups.map((p) => ({ ...strip(p, "lines"), id: pickupIds.get(p.id)! }))));
    check(await c.from("pickup_lines").insert(demo.pickups.flatMap((p) =>
      p.lines.map((l) => ({ ...strip(l, "id"), pickup_id: pickupIds.get(p.id)! })))));
    check(await c.from("pantry_checkins").insert(demo.checkins.map((ci) => strip(ci, "id"))));
    check(await c.from("donations").insert(demo.donations.map((d) => strip(d, "id"))));
    if (demo.plans.length) {
      check(await c.from("plans").insert(demo.plans.map((p) => ({ ...strip(p, "lines"), id: planIds.get(p.id)! }))));
      check(await c.from("plan_lines").insert(demo.plans.flatMap((p) =>
        p.lines.map((l) => ({ ...l, plan_id: planIds.get(p.id)! })))));
    }
    this.cachedHouseholdId = household.id;
  }

  /** Deletes the household (child rows cascade) and the user's receipt photos. */
  async resetAll(): Promise<void> {
    const user = await this.requireUser();
    const { data: files } = await this.client.storage.from("receipts").list(user.id);
    await this.removeReceipts((files ?? []).map((f) => `${user.id}/${f.name}`));
    check(await this.client.from("households").delete().eq("owner_user_id", user.id));
    this.cachedHouseholdId = null;
  }
}
