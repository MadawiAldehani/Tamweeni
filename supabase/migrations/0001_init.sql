-- Tamweeni — initial schema.
--
-- One household per signed-in user (Supabase Auth). Everything else hangs off the
-- household: members, ration pickups (with their lines), pantry check-ins,
-- monthly plans (with their lines) and Food Bank donations.
--
-- Column names match lib/data/types.ts one-for-one so the app needs no mapping layer.
-- Row Level Security (RLS) keeps each family's data private: a user can only read
-- or write rows that belong to a household they own.

create extension if not exists "pgcrypto"; -- gen_random_uuid()

-- ------------------------------------------------------------------ catalog

-- The government ration list. Read-only reference data, upserted by migration 0002_ration_items.sql.
create table if not exists public.ration_items (
  id text primary key,
  name_en text not null,
  name_ar text not null,
  unit text not null check (unit in ('kg', 'liter', 'can')),
  qty_per_person numeric not null,
  subsidized_price numeric not null,
  market_price_estimate numeric not null,
  eligibility text not null check (eligibility in ('all', 'infant'))
);

-- --------------------------------------------------------------- households

create table if not exists public.households (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid references auth.users (id) on delete cascade,
  name text not null,
  governorate text not null check (
    governorate in ('capital', 'hawalli', 'farwaniya', 'ahmadi', 'jahra', 'mubarak_al_kabeer')
  ),
  coop_name text not null,
  created_at timestamptz not null default now()
);
create index if not exists households_owner_user_id_idx on public.households (owner_user_id);

-- Family members; infants (under two) unlock the infant items.
create table if not exists public.members (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  name text not null,
  is_infant boolean not null default false
);
create index if not exists members_household_id_idx on public.members (household_id);

-- ------------------------------------------------------------------ pickups

-- One visit to the co-op ration branch. `month` is the "YYYY-MM" it counts toward.
create table if not exists public.pickups (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  month text not null check (month ~ '^\d{4}-\d{2}$'),
  pickup_date date not null,
  source text not null check (source in ('receipt', 'manual')),
  receipt_image_path text,
  ai_confidence numeric,
  created_at timestamptz not null default now()
);
create index if not exists pickups_household_id_idx on public.pickups (household_id);
create index if not exists pickups_household_month_idx on public.pickups (household_id, month);

-- What was collected in that visit, one row per ration item.
create table if not exists public.pickup_lines (
  id uuid primary key default gen_random_uuid(),
  pickup_id uuid not null references public.pickups (id) on delete cascade,
  item_id text not null references public.ration_items (id),
  qty numeric not null,
  unit_price numeric
);
create index if not exists pickup_lines_pickup_id_idx on public.pickup_lines (pickup_id);

-- ------------------------------------------------------------------- pantry

-- "How much is left?" snapshots taken near the end of the month.
create table if not exists public.pantry_checkins (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  item_id text not null references public.ration_items (id),
  checkin_date date not null,
  qty_remaining numeric not null
);
create index if not exists pantry_checkins_household_id_idx on public.pantry_checkins (household_id);

-- ---------------------------------------------------------------- donations

-- Surplus pledged to the Kuwait Food Bank. All lines of one pledge share a voucher code.
create table if not exists public.donations (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  item_id text not null references public.ration_items (id),
  qty numeric not null,
  month text not null check (month ~ '^\d{4}-\d{2}$'),
  status text not null default 'pledged' check (status in ('pledged', 'collected')),
  voucher_code text not null,
  created_at timestamptz not null default now()
);
create index if not exists donations_household_id_idx on public.donations (household_id);
create index if not exists donations_household_month_idx on public.donations (household_id, month);

-- -------------------------------------------------------------------- plans

-- "Take only what we use": the family's intended quantities for a month.
create table if not exists public.plans (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  month text not null check (month ~ '^\d{4}-\d{2}$'),
  created_at timestamptz not null default now(),
  unique (household_id, month)
);
create index if not exists plans_household_id_idx on public.plans (household_id);

create table if not exists public.plan_lines (
  plan_id uuid not null references public.plans (id) on delete cascade,
  item_id text not null references public.ration_items (id),
  planned_qty numeric not null,
  primary key (plan_id, item_id)
);
create index if not exists plan_lines_plan_id_idx on public.plan_lines (plan_id);

-- ---------------------------------------------------------- row level security

alter table public.ration_items enable row level security;
alter table public.households enable row level security;
alter table public.members enable row level security;
alter table public.pickups enable row level security;
alter table public.pickup_lines enable row level security;
alter table public.pantry_checkins enable row level security;
alter table public.donations enable row level security;
alter table public.plans enable row level security;
alter table public.plan_lines enable row level security;

-- The catalog is public; anyone (even signed out) may read it. Nobody writes it via the API.
create policy "ration_items are readable by everyone"
  on public.ration_items for select to anon, authenticated using (true);

-- A user sees and edits only the households they own.
create policy "owners manage their households"
  on public.households for all to authenticated
  using (owner_user_id = auth.uid())
  with check (owner_user_id = auth.uid());

-- Child tables inherit access from the household they belong to.
create policy "owners manage members"
  on public.members for all to authenticated
  using (exists (select 1 from public.households h where h.id = members.household_id and h.owner_user_id = auth.uid()))
  with check (exists (select 1 from public.households h where h.id = members.household_id and h.owner_user_id = auth.uid()));

create policy "owners manage pickups"
  on public.pickups for all to authenticated
  using (exists (select 1 from public.households h where h.id = pickups.household_id and h.owner_user_id = auth.uid()))
  with check (exists (select 1 from public.households h where h.id = pickups.household_id and h.owner_user_id = auth.uid()));

create policy "owners manage pickup_lines"
  on public.pickup_lines for all to authenticated
  using (exists (
    select 1 from public.pickups p join public.households h on h.id = p.household_id
    where p.id = pickup_lines.pickup_id and h.owner_user_id = auth.uid()))
  with check (exists (
    select 1 from public.pickups p join public.households h on h.id = p.household_id
    where p.id = pickup_lines.pickup_id and h.owner_user_id = auth.uid()));

create policy "owners manage pantry_checkins"
  on public.pantry_checkins for all to authenticated
  using (exists (select 1 from public.households h where h.id = pantry_checkins.household_id and h.owner_user_id = auth.uid()))
  with check (exists (select 1 from public.households h where h.id = pantry_checkins.household_id and h.owner_user_id = auth.uid()));

create policy "owners manage donations"
  on public.donations for all to authenticated
  using (exists (select 1 from public.households h where h.id = donations.household_id and h.owner_user_id = auth.uid()))
  with check (exists (select 1 from public.households h where h.id = donations.household_id and h.owner_user_id = auth.uid()));

create policy "owners manage plans"
  on public.plans for all to authenticated
  using (exists (select 1 from public.households h where h.id = plans.household_id and h.owner_user_id = auth.uid()))
  with check (exists (select 1 from public.households h where h.id = plans.household_id and h.owner_user_id = auth.uid()));

create policy "owners manage plan_lines"
  on public.plan_lines for all to authenticated
  using (exists (
    select 1 from public.plans p join public.households h on h.id = p.household_id
    where p.id = plan_lines.plan_id and h.owner_user_id = auth.uid()))
  with check (exists (
    select 1 from public.plans p join public.households h on h.id = p.household_id
    where p.id = plan_lines.plan_id and h.owner_user_id = auth.uid()));

-- ------------------------------------------------------------------ storage

-- Receipt photos live in a private bucket, one folder per user: "<user id>/<uuid>.jpg".
insert into storage.buckets (id, name, public)
values ('receipts', 'receipts', false)
on conflict (id) do nothing;

create policy "users upload their own receipts"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'receipts' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "users read their own receipts"
  on storage.objects for select to authenticated
  using (bucket_id = 'receipts' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "users delete their own receipts"
  on storage.objects for delete to authenticated
  using (bucket_id = 'receipts' and (storage.foldername(name))[1] = auth.uid()::text);
