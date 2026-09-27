// Loads every pilot household as a Snapshot for the /impact aggregate. Server only
// (service-role client). Queries are scoped to the months the maths needs and paged,
// because PostgREST caps a single request at 1,000 rows and truncates silently.
import type { Snapshot } from "@/lib/data/types";
import type { RationItemId } from "@/lib/ration/catalog";
import { createServiceClient } from "@/lib/supabase/server";

const PAGE = 1000;

type Page<T> = PromiseLike<{ data: T[] | null; error: { message: string } | null }>;

/** Walks `.range()` pages until one comes back short, so no table is ever cut at 1,000 rows. */
export async function fetchAll<T>(page: (from: number, to: number) => Page<T>): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await page(from, from + PAGE - 1);
    if (error) throw new Error(error.message);
    rows.push(...(data ?? []));
    if (!data || data.length < PAGE) return rows;
  }
}

function byHousehold<T extends { household_id: string }>(rows: T[]): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const row of rows) map.set(row.household_id, [...(map.get(row.household_id) ?? []), row]);
  return map;
}

/**
 * `months` are the reporting window, newest first. Pickups are fetched for that window plus the
 * month after it (the attribution rule reads the next month's pickup as its upper bound); check-ins
 * from the first day of the oldest month; donations in full, since they are all-time totals.
 */
export async function loadSnapshots(months: string[], nextMonth: string): Promise<Snapshot[]> {
  const db = createServiceClient();
  const oldest = months.at(-1) ?? nextMonth;
  const [households, members, pickups, checkins, donations] = await Promise.all([
    fetchAll((from, to) => db.from("households").select("*").order("id").range(from, to)),
    fetchAll((from, to) => db.from("members").select("*").order("id").range(from, to)),
    fetchAll((from, to) =>
      db.from("pickups").select("*, pickup_lines(*)").in("month", [...months, nextMonth]).order("id").range(from, to),
    ),
    fetchAll((from, to) =>
      db.from("pantry_checkins").select("*").gte("checkin_date", `${oldest}-01`).order("id").range(from, to),
    ),
    fetchAll((from, to) => db.from("donations").select("*").order("id").range(from, to)),
  ]);

  const memberMap = byHousehold(members);
  const pickupMap = byHousehold(
    pickups.map(({ pickup_lines, ...p }) => ({
      ...p,
      lines: pickup_lines.map((l) => ({ ...l, item_id: l.item_id as RationItemId })),
    })),
  );
  const checkinMap = byHousehold(checkins.map((c) => ({ ...c, item_id: c.item_id as RationItemId })));
  const donationMap = byHousehold(donations.map((d) => ({ ...d, item_id: d.item_id as RationItemId })));

  return households.map((household) => ({
    household,
    members: memberMap.get(household.id) ?? [],
    pickups: pickupMap.get(household.id) ?? [],
    checkins: checkinMap.get(household.id) ?? [],
    plans: [],
    donations: donationMap.get(household.id) ?? [],
  }));
}
