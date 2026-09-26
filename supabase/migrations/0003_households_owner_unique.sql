-- One household per user, enforced by the database. Without this a re-submitted onboarding
-- form could insert a second household and later loads would pick an arbitrary one.
drop index if exists public.households_owner_user_id_idx;
create unique index if not exists households_owner_user_id_key
  on public.households (owner_user_id)
  where owner_user_id is not null;
