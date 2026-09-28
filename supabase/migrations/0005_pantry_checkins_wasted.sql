-- Families record what expired or was thrown away at the weekly pantry check-in, so
-- consumption becomes collected − remaining − wasted and Insights can show waste per item.
-- Defaults to 0 so every existing check-in stays valid.
alter table public.pantry_checkins
  add column if not exists qty_wasted numeric not null default 0 check (qty_wasted >= 0);

comment on column public.pantry_checkins.qty_wasted is
  'Quantity expired or thrown away since the pickup, in catalog units (kg / liter / can). 0 when the family recorded no waste.';
