"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";

import { ItemChart } from "@/components/insights/item-chart";
import { ItemChips } from "@/components/insights/item-chips";
import { MoneyChart } from "@/components/insights/money-chart";
import { WasteRiskList } from "@/components/insights/waste-risk-list";
import { WhereItWentCard } from "@/components/insights/where-it-went-card";
import { AppHeader } from "@/components/shell/app-header";
import { Skeleton } from "@/components/ui/skeleton";
import { PageContainer } from "@/components/shell/page-container";
import { useData } from "@/lib/data/provider";
import { useT } from "@/lib/i18n/provider";
import { monthlySeries, wasteRisk } from "@/lib/insights/series";
import { getItem, RATION_ITEMS, type RationItemId } from "@/lib/ration/catalog";
import { entitledQty } from "@/lib/ration/entitlement";

const at = (i: number) => ({ "--i": i }) as CSSProperties;

export default function InsightsPage() {
  const t = useT();
  const { snapshot, loading } = useData();
  // Dates and charts fill in after mount so server and client render the same markup,
  // and nothing draws against the empty snapshot while the store is still starting.
  const [now, setNow] = useState<Date | null>(null);
  const ready = now !== null && !loading;
  const [picked, setPicked] = useState<RationItemId | null>(null);

  useEffect(() => {
    setNow(new Date());
  }, []);

  const items = useMemo(() => {
    const entitled = RATION_ITEMS.filter((item) => entitledQty(item, snapshot.members) > 0);
    return entitled.length > 0 ? entitled : RATION_ITEMS.filter((item) => item.eligibility === "all");
  }, [snapshot.members]);

  const points = useMemo(() => (ready && now ? monthlySeries(snapshot, now) : []), [snapshot, now, ready]);
  const risk = useMemo(() => (ready && now ? wasteRisk(snapshot, now) : []), [snapshot, now, ready]);

  // Default to the item with the most left unused; rice until check-ins exist.
  const fallback = risk[0]?.item.id ?? "rice";
  const selected = picked && items.some((i) => i.id === picked) ? picked : fallback;

  return (
    <>
      <AppHeader title={t("pages.insights.title")} subtitle={t("pages.insights.subtitle")} />
      <PageContainer className="stagger flex flex-col gap-4">
        <div style={at(0)}>
          {ready ? <ItemChips items={items} selected={selected} onSelect={setPicked} /> : <Skeleton className="h-11 w-full rounded-full" />}
        </div>
        <div style={at(1)}>
          {ready ? <WhereItWentCard points={points} item={getItem(selected)} /> : <Skeleton className="h-56 w-full rounded-2xl" />}
        </div>
        <div style={at(2)}>
          <ItemChart points={points} item={getItem(selected)} ready={ready} />
        </div>
        <div style={at(3)}>
          <MoneyChart points={points} ready={ready} />
        </div>
        <div style={at(4)}>
          {ready ? <WasteRiskList rows={risk} /> : <Skeleton className="h-48 w-full rounded-2xl" />}
        </div>
        <p style={at(5)} className="px-1 text-center text-xs text-muted-foreground">
          {t("pages.insights.footnote")}
        </p>
      </PageContainer>
    </>
  );
}
