-- Ration catalog. Lives in a migration (not seed.sql) so `supabase db push` and the
-- dashboard flow ship it too; a hosted project with an empty catalog would reject every
-- pickup line, check-in, donation and plan line on its item_id foreign key.
-- Numbers mirror lib/ration/catalog.ts exactly — keep the two in sync.
-- Safe to re-run: existing rows are updated in place.
insert into public.ration_items
  (id, name_en, name_ar, unit, qty_per_person, subsidized_price, market_price_estimate, eligibility)
values
  ('rice',          'Rice',             'أرز',              'kg',    5,    0.12, 0.6,  'all'),
  ('sugar',         'Sugar',            'سكر',              'kg',    1,    0.09, 0.4,  'all'),
  ('oil',           'Cooking oil',      'زيت طعام',         'liter', 3,    1.05, 1.8,  'all'),
  ('milk_powder',   'Milk powder',      'حليب بودرة',       'kg',    2.27, 1.05, 3.5,  'all'),
  ('milk_longlife', 'Long-life milk',   'حليب طويل الأمد',  'liter', 6,    0.300, 0.45, 'all'),
  ('tomato_paste',  'Tomato paste',     'معجون طماطم',      'can',   4,    0.27, 0.35, 'all'),
  ('lentils',       'Lentils',          'عدس',              'kg',    0.3,  0.27, 0.7,  'all'),
  ('chicken',       'Frozen chicken',   'دجاج مجمد',        'kg',    3,    0.600,  1.2,  'all'),
  ('dates',         'Dates',            'تمر',              'kg',    0.5,  0.5,  1.5,  'all'),
  ('infant_milk',   'Infant milk',      'حليب أطفال',       'can',   8,    0.9,  3.0,  'infant'),
  ('infant_food',   'Infant nutrients', 'مغذيات أطفال',     'can',   2,    0.9,  2.5,  'infant')
on conflict (id) do update set
  name_en = excluded.name_en,
  name_ar = excluded.name_ar,
  unit = excluded.unit,
  qty_per_person = excluded.qty_per_person,
  subsidized_price = excluded.subsidized_price,
  market_price_estimate = excluded.market_price_estimate,
  eligibility = excluded.eligibility;
