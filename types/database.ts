// Hand-written supabase-js Database type. Mirrors supabase/migrations/0001_init.sql
// column-for-column; update both together. Rows are plain strings/numbers because
// PostgREST serialises uuid/date/timestamptz/numeric as JSON strings and numbers.

type Relationship = {
  foreignKeyName: string;
  columns: string[];
  isOneToOne?: boolean;
  referencedRelation: string;
  referencedColumns: string[];
};

/** Insert makes database-defaulted columns optional; Update makes everything optional. */
type Table<Row, Defaulted extends keyof Row = never, Rels extends Relationship[] = []> = {
  Row: Row;
  Insert: Omit<Row, Defaulted> & Partial<Pick<Row, Defaulted>>;
  Update: Partial<Row>;
  Relationships: Rels;
};

type HouseholdFk<Name extends string> = [{ foreignKeyName: Name; columns: ["household_id"]; isOneToOne: false; referencedRelation: "households"; referencedColumns: ["id"] }];
type ItemFk<Name extends string> = { foreignKeyName: Name; columns: ["item_id"]; isOneToOne: false; referencedRelation: "ration_items"; referencedColumns: ["id"] };

export type RationItemRow = {
  id: string;
  name_en: string;
  name_ar: string;
  unit: "kg" | "liter" | "can";
  qty_per_person: number;
  subsidized_price: number;
  market_price_estimate: number;
  eligibility: "all" | "infant";
};

export type HouseholdRow = {
  id: string;
  owner_user_id: string | null;
  name: string;
  governorate: "capital" | "hawalli" | "farwaniya" | "ahmadi" | "jahra" | "mubarak_al_kabeer";
  coop_name: string;
  created_at: string;
};

export type MemberRow = { id: string; household_id: string; name: string; is_infant: boolean };

export type PickupRow = {
  id: string;
  household_id: string;
  month: string;
  pickup_date: string;
  source: "receipt" | "manual";
  receipt_image_path: string | null;
  ai_confidence: number | null;
  created_at: string;
};

export type PickupLineRow = { id: string; pickup_id: string; item_id: string; qty: number; unit_price: number | null };

export type PantryCheckinRow = {
  id: string;
  household_id: string;
  item_id: string;
  checkin_date: string;
  qty_remaining: number;
};

export type DonationRow = {
  id: string;
  household_id: string;
  item_id: string;
  qty: number;
  month: string;
  status: "pledged" | "collected";
  voucher_code: string;
  created_at: string;
};

export type PlanRow = { id: string; household_id: string; month: string; created_at: string };

export type PlanLineRow = { plan_id: string; item_id: string; planned_qty: number };

export type Database = {
  public: {
    Tables: {
      ration_items: Table<RationItemRow>;
      households: Table<HouseholdRow, "id" | "owner_user_id" | "created_at">;
      members: Table<MemberRow, "id" | "is_infant", HouseholdFk<"members_household_id_fkey">>;
      pickups: Table<PickupRow, "id" | "receipt_image_path" | "ai_confidence" | "created_at", HouseholdFk<"pickups_household_id_fkey">>;
      pickup_lines: Table<PickupLineRow, "id" | "unit_price", [
        { foreignKeyName: "pickup_lines_pickup_id_fkey"; columns: ["pickup_id"]; isOneToOne: false; referencedRelation: "pickups"; referencedColumns: ["id"] },
        ItemFk<"pickup_lines_item_id_fkey">,
      ]>;
      pantry_checkins: Table<PantryCheckinRow, "id", [...HouseholdFk<"pantry_checkins_household_id_fkey">, ItemFk<"pantry_checkins_item_id_fkey">]>;
      donations: Table<DonationRow, "id" | "status" | "created_at", [...HouseholdFk<"donations_household_id_fkey">, ItemFk<"donations_item_id_fkey">]>;
      plans: Table<PlanRow, "id" | "created_at", HouseholdFk<"plans_household_id_fkey">>;
      plan_lines: Table<PlanLineRow, never, [
        { foreignKeyName: "plan_lines_plan_id_fkey"; columns: ["plan_id"]; isOneToOne: false; referencedRelation: "plans"; referencedColumns: ["id"] },
        ItemFk<"plan_lines_item_id_fkey">,
      ]>;
    };
    Views: Record<never, never>;
    Functions: Record<never, never>;
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
};

export type Tables<Name extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][Name]["Row"];
export type TablesInsert<Name extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][Name]["Insert"];
