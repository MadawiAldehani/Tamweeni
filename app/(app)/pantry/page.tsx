"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";

import { PantryEmpty, PantryIntro } from "@/components/pantry/pantry-intro";
import { PantryItemSlider } from "@/components/pantry/pantry-item-slider";
import { buildPantryRows, daysSince, pickupsFor, usedByItem, usedVolume, type PantryValues, type UsedItem } from "@/components/pantry/pantry-math";
import { PantrySuccess } from "@/components/pantry/pantry-success";
import { PantrySummaryBar } from "@/components/pantry/pantry-summary-bar";
import { AppHeader } from "@/components/shell/app-header";
import { PageContainer } from "@/components/shell/page-container";
import { useData } from "@/lib/data/provider";
import { currentMonth, todayISO } from "@/lib/format";
import { useT } from "@/lib/i18n/provider";
import type { RationItemId } from "@/lib/ration/catalog";

const at = (i: number) => ({ "--i": i }) as CSSProperties;

/** Weekly pantry check-in: one slider per item collected this month, saved as check-ins. */
export default function PantryPage() {
  const t = useT();
  const { snapshot, loading, mutate } = useData();
  // `now` fills in after mount so server and client render the same markup.
  const [now, setNow] = useState<Date | null>(null);
  // Only the sliders the family has touched; everything else reads its row's initial value.
  const [values, setValues] = useState<PantryValues>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);
  const [savedUsed, setSavedUsed] = useState<UsedItem[] | null>(null);

  useEffect(() => {
    setNow(new Date());
  }, []);

  const month = currentMonth(now ?? undefined);
  const rows = useMemo(() => buildPantryRows(snapshot, month), [snapshot, month]);
  const pickups = useMemo(() => pickupsFor(snapshot.pickups, month), [snapshot.pickups, month]);
  const lastPickup = pickups.at(-1);
  const daysAgo = now && lastPickup ? daysSince(lastPickup.pickup_date, now) : null;

  const valueFor = (id: RationItemId, initial: number) => values[id] ?? initial;
  const setValue = (id: RationItemId, next: number) => setValues((all) => ({ ...all, [id]: next }));

  const save = async () => {
    if (saving || rows.length === 0) return;
    setSaving(true);
    setError(false);
    const lines = rows.map((row) => ({ item_id: row.item.id, qty_remaining: valueFor(row.item.id, row.initial) }));
    const used = usedByItem(rows, values);
    try {
      await mutate((s) => s.createCheckins({ checkin_date: todayISO(now ?? new Date()), lines }));
      setSavedUsed(used);
    } catch {
      setError(true);
      setSaving(false);
    }
  };

  return (
    <>
      <AppHeader title={t("pages.pantry.title")} subtitle={t("pages.pantry.subtitle")} backHref="/home" />
      {savedUsed ? (
        <PageContainer>
          <PantrySuccess used={savedUsed} now={now ?? new Date()} />
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
              onChange={(next) => setValue(row.item.id, next)}
            />
          ))}
          {/* Direct child of the flex column: a sticky element can only stick within its parent. */}
          <PantrySummaryBar
            style={at(8)}
            className="mt-1"
            count={rows.length}
            usedKg={usedVolume(rows, values)}
            saving={saving}
            error={error}
            onSave={save}
          />
        </PageContainer>
      )}
    </>
  );
}
