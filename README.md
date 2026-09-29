# Tamweeni · تمويني

**See your ration. Take what you need. Nothing goes to waste.**

Tamweeni is a mobile-first web app (installable PWA) for Kuwaiti families that makes the
national food-ration system (التموين) smart. A family sees its monthly entitlement, records
what it actually collected at the co-op ration branch (فرع التموين) by photographing the
receipt, learns what it really uses through a one-minute weekly pantry check-in, and plans the
next pickup around that — taking only what it needs, so the rest stays in the system for
Kuwait. Leftovers a family will not use can optionally go to the Kuwait Food Bank
(البنك الكويتي للطعام). Aggregated and anonymised, the same data becomes the
first real picture of ration over-collection in Kuwait (`/impact`).

There is no integration with MOCI or the co-ops yet: everything runs in **shadow mode**
on the family's phone.

## Quick start (mock mode — no accounts, no keys)

```bash
npm install
npm run dev
```

Open the printed URL (usually `http://localhost:3000`), tap **Continue → Continue as demo
family**. Mock mode keeps all data in the browser's `localStorage` and never calls a
paid API. This is the mode to demo in.

`npm run build` must pass before you ship; `npm run lint` and `node scripts/check-i18n.mjs`
are the other two gates.

## The principle

Tamweeni never encourages a family to take more than it needs. The "surplus" in the pickup
plan is what the family leaves in the system — subsidy saved for the country. Donating is an
optional path for leftovers that already happened (items collected and not going to be used);
it is never derived from the plan and never a reason to collect more. Every screen, metric and
sentence should read that way.

## The 3-minute demo

1. **Onboarding** — swipe the three-beat story, switch to **العربية** to show RTL, continue
   as the demo family (Abdullah family, 7 members, one infant, two months of history).
2. **Home** — entitlement in kilos (subsidy value as a caption), the month ring, the pantry
   shelf, the insight sentence ("…used about 15 kg — try taking about 20 kg less").
3. **Scan receipt** — tap **Use the sample receipt**, watch it parse, correct a line,
   save. Home flips to 100 % collected and the "Next" tile becomes the pantry check-in.
4. **Pantry check-in** — slide a couple of items ("half", "all used"), save, see
   "what we learned".
5. **Plan pickup** — suggested quantities per item, the "You need 15 kg · Not taking 20 kg"
   bar (what you do not take stays in the system), save → the branch checklist with pack
   counts, **Share**.
6. **Leftovers (optional)** — items already collected that the family will not use can go to the
   Food Bank: donation slip with QR code, **Request pickup on WhatsApp**, history with
   "mark as collected".
7. **Insights** — entitled vs collected vs used per item, money view, waste-risk list.
8. **/impact** — the national page for judges (labelled "pilot projection" until live
   data exists).

Settings → **Load demo family** resets to the seeded state at any time.

## Setup for real data (optional)

Copy `.env.example` to `.env.local` and fill in what you have. The app picks the backend at
runtime: with `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` it uses
Supabase; without them it stays in mock mode.

**Supabase**

1. Create a project at supabase.com and enable email (magic link) auth.
2. Run `supabase/migrations/0001_init.sql` (tables + RLS + the private `receipts`
   storage bucket) and any later migrations in order — `0002_ration_items.sql` loads the ration
   catalog and `0004_receipts_bucket_limits.sql` caps the bucket at 5 MB / images only, so nothing
   else needs seeding (`supabase/seed.sql` is intentionally empty).
3. Set the magic-link redirect to `https://<your-domain>/auth/callback`.
4. Add `SUPABASE_SERVICE_ROLE_KEY` on the server only; `/api/impact` uses it to aggregate
   across households (it never reaches the browser).

**Receipt reading** works for free on the phone (Tesseract.js, Arabic + English, loaded
from a CDN on first use) plus a rule-based matcher in `lib/receipt/matcher.ts`. If you ever
set `ANTHROPIC_API_KEY`, `/api/receipt/parse` switches to a Claude vision model with
structured JSON output; unset, the route answers 501 and the phone does the work.

**Deploy** to Vercel with the same environment variables. The service worker is
network-first and never caches HTML, so deploys show up immediately.

## ⚠️ Verify these numbers before launch

Official source: MOCI publishes the price list "أصناف السلع التموينية وأسعارها 2026" at
https://www.moci.gov.kw/ar/important-links/asaar-o-anoaa-lmntgt-lghthy-ltmoyn/ (116 items,
prices only — no per-person quotas). Checked 28 Sept 2026: rice 0.120/kg, sugar 0.090/kg,
lentils 0.270/kg, oil 1.050/pack, milk powder 1.050/pack, tomato paste 0.270/bundle, chicken
0.555–0.630/kg (catalog uses 0.600), KDD/KDCOW 1 L milk 0.300 (a *discounted* item, not
subsidised), infant milk 0.435–2.560/can by brand. **Open questions:** the per-person quotas
(6.25 vs 5 kg rice, 2 vs 1 kg sugar) are not in the official PDF — confirm on your own card in
Sahel; dates do not appear on the 2026 list; the milk-powder and tomato-paste pack sizes need
checking against the 1.050 and 0.270 pack prices.

`lib/ration/catalog.ts` is the single source of truth for per-person quotas, subsidised
prices and market-price estimates. They were compiled from public sources in 2025 and may
be outdated (quotas were recently cut, e.g. rice 6.25 → 5 kg, sugar 2 → 1 kg). Check every
row against MOCI's current list, and re-run `npm run sample-receipt` if you change prices so
the demo receipt matches. `supabase/migrations/0002_ration_items.sql` mirrors the same rows for
the database (it is an upsert, so re-run it after editing the catalog).

Meal-equivalence factors (`lib/ration/meals.ts`) and branch pack sizes
(`lib/plan/packs.ts`) are approximations — edit freely.

## How the numbers work

- **Entitlement** = `qty_per_person × eligible members` per item (infant items count only
  members flagged as infants). **Subsidy value** = `qty × (market − subsidised price)`.
  → `lib/ration/entitlement.ts`
- **Usage** = `collected this month − remaining at the pantry check-in`, pro-rated to a
  full month when the check-in came early. **Suggested pickup** =
  `clamp(avg usage × 1.1 − pantry estimate, 0, entitlement)`, rounded to branch pack
  steps; with no check-ins yet the suggestion is the full entitlement and the item shows a
  "Learning" badge. → `lib/ration/consumption.ts` (the header comment explains every knob)
- **Past months as evidence**: each item on the Plan page shows last months' leftovers and
  donations under its suggestion; Insights has a "Past months" card (collected · used · left over
  · wasted · donated); Home shows a month-review card near month end. → `lib/insights/history.ts`,
  `lib/insights/series.ts`
- **Insight sentence / next step** rules → `lib/ration/insights.ts`
- **Over-collection** on `/impact` = `Σ(collected − used) / Σ collected` over household-
  months with a check-in. → `lib/impact/aggregate.ts` (live) and `lib/impact/demo.ts`
  (pilot projection)

## Project map

```
app/               routes: onboarding, (app)/{home,scan,plan,pantry,donate,insights,settings}, impact, api/
components/        one folder per screen + common/ (ItemIcon, Stepper, ProgressRing…) + ui/ (shadcn)
lib/data/          DataStore contract (types.ts) · local.ts (mock) · supabase.ts · provider.tsx
lib/ration/        catalog, entitlement, consumption, insights, meals, governorates
lib/receipt/       parse types, matcher (OCR → items), ocr (Tesseract), claude (optional), mock
lib/plan, lib/donate, lib/insights, lib/impact   screen-specific helpers (pure)
lib/i18n/          dictionaries/en.json + ar.json, provider (client), translate (server-safe)
lib/demo/seed.ts   the Abdullah demo family
supabase/          migrations (0002 = catalog upsert, 0004 = bucket limits) · seed.sql intentionally empty · types/database.ts mirrors the schema
public/demo/       the sample receipt (regenerate with npm run sample-receipt)
scripts/           check-i18n (parity gate), i18n-add (add keys to both files), icons, sample receipt
```

### Conventions

- Every user-facing string goes through `t("dot.key")`; keys are type-checked from
  `en.json`. Add keys with `node scripts/i18n-add.mjs '{"pages.x.y":{"en":"…","ar":"…"}}'`.
- Arabic flips the layout with `dir="rtl"`; only logical Tailwind classes (`ps-`, `me-`,
  `text-start`) are used, and directional icons carry `rtl:-scale-x-100`.
- Design tokens live in `app/globals.css` (cream `#FAF7F2`, green `#1F6F4A`, sand
  `#E8D9BF`, terracotta `#C97B4A` reserved for giving). Chart colours were validated
  for colour-vision deficiency.
- Files stay small (mostly < 150 lines) with named exports so they are easy to edit by hand.

## Not in this MVP

No MOCI / co-op / Sahel integration, no payments, no admin auth, no native apps, no push
notifications, no social features.
