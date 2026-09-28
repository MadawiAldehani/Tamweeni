"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";

import { PantryEmpty, PantryIntro } from "@/components/pantry/pantry-intro";
import { PantryItemSlider } from "@/components/pantry/pantry-item-slider";
import {
  buildPantryRows, clampWaste, daysSince, pickupsFor, usedByItem, usedVolume, wastedVolume,
  type PantryRow, type PantryValues, type PantryWaste, type UsedItem,
} from "@/components/pantry/pantry-math";
import { PantrySuccess } from "@/components/pantry/pantry-success";
import { PantrySummaryBar } from "@/components/pantry/pantry-summary-bar";
import { AppHeader } from "@/components/shell/app-header";
import { PageContainer } from "@/components/shell/page-container";
import { useData } from "@/lib/data/provider";
import { currentMonth, todayISO } from "@/lib/format";
import { useT } from "@/lib/i18n/provider";
import type { RationItemId } from "@/lib/ration/catalog";

const at = (i: number) => ({ "--i": i }) as CSSProperties;

/** Weekly pantry check-in: one slider per item collected this month (plus optional waste), saved as check-ins. */
export default function PantryPage() {
  const t = useT();
  const { snapshot, loading, mutate } = useData();
  // `now` fills in after mount so server and client render the same markup.
  const [now, setNow] = useState<Date | null>(null);
  // Only the sliders the family has touched; everything else reads its row's initial value.
  const [values, setValues] = useState<PantryValues>({});
  // Optional per-item "expired or thrown away" quantities; untouched rows read the latest check-in's waste.
  const [waste, setWaste] = useState<PantryWaste>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);
  const [saved, setSaved] = useState<{ used: UsedItem[]; wastedKg: number } | null>(null);

  useEffect(() => {
    setNow(new Date());
  }, []);

  const month = currentMonth(now ?? undefined);
  const rows = useMemo(() => buildPantryRows(snapshot, month), [snapshot, month]);
  const pickups = useMemo(() => pickupsFor(snapshot.pickups, month), [snapshot.pickups, month]);
  const lastPickup = pickups.at(-1);
  const daysAgo = now && lastPickup ? daysSince(lastPickup.pickup_date, now) : null;

  const valueFor = (id: RationItemId, initial: number) => values[id] ?? initial;
  const wasteFor = (row: PantryRow) => clampWaste(row, valueFor(row.item.id, row.initial), waste[row.item.id] ?? row.initialWasted);
  /** Moving the slider also pulls the waste down so remaining + wasted never exceeds collected. */
  const setValue = (row: PantryRow, next: number) => {
    setValues((all) => ({ ...all, [row.item.id]: next }));
    setWaste((all) => ({ ...all, [row.item.id]: clampWaste(row, next, all[row.item.id] ?? row.initialWasted) }));
  };
  const setWasted = (row: PantryRow, next: number) =>
    setWaste((all) => ({ ...all, [row.item.id]: clampWaste(row, valueFor(row.item.id, row.initial), next) }));

  const save = async () => {
    if (saving || rows.length === 0) return;
    setSaving(true);
    setError(false);
    const lines = rows.map((row) => ({
      item_id: row.item.id, qty_remaining: valueFor(row.item.id, row.initial), qty_wasted: wasteFor(row),
    }));
    const used = usedByItem(rows, values, waste);
    const wastedKg = wastedVolume(rows, values, waste);
    try {
      await mutate((s) => s.createCheckins({ checkin_date: todayISO(now ?? new Date()), lines }));
      setSaved({ used, wastedKg });
    } catch {
      setError(true);
      setSaving(false);
    }
  };

  return (
    <>
      <AppHeader title={t("pages.pantry.title")} subtitle={t("pages.pantry.subtitle")} backHref="/home" />
      {saved ? (
        <PageContainer>
          <PantrySuccess used={saved.used} wastedKg={saved.wastedKg} now={now ?? new Date()} />
        </PageContainer>
      ) : rows.length === 0 ? (
        <PageContainer className="stagger flex flex-col gap-3">
          {/* While the first snapshot loads, show nothing rather than flashing the empty state. */}
          {loading ? null : <PantryEmpty />}
        </PageContainer>
      ) : (
        <PageContainer className="stagger flex flex-col gap-3">
          <PantryIntro style={at(0)} pickups={pickups} daysAgo={daysAgo} />
          {rows.map((row, i) => (
            <PantryItemSlider
              key={row.item.id}
              style={at(Math.min(i + 1, 7))}
              row={row}
              value={valueFor(row.item.id, row.initial)}
              onChange={(next) => setValue(row, next)}
              wasted={wasteFor(row)}
              onWastedChange={(next) => setWasted(row, next)}
            />
          ))}
          {/* Direct child of the flex column: a sticky element can only stick within its parent. */}
          <PantrySummaryBar
            style={at(8)}
            className="mt-1"
            count={rows.length}
            usedKg={usedVolume(rows, values, waste)}
            wastedKg={wastedVolume(rows, values, waste)}
            saving={saving}
            error={error}
            onSave={save}
          />
        </PageContainer>
      )}
    </>
  );
}
