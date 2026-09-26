"use client";

import { Users } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { EmptyState } from "@/components/common/empty-state";
import { PlanChecklist } from "@/components/plan/plan-checklist";
import { PlanEditor } from "@/components/plan/plan-editor";
import { AppHeader } from "@/components/shell/app-header";
import { PageContainer } from "@/components/shell/page-container";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useData } from "@/lib/data/provider";
import { currentMonth } from "@/lib/format";
import { useT } from "@/lib/i18n/provider";
import { hasPickupIn, planMonthFor, savedPlanFor } from "@/lib/plan/month";
import { suggestPickup } from "@/lib/ration/consumption";

type Mode = "edit" | "checklist";

export default function PlanPage() {
  const t = useT();
  const { snapshot, loading } = useData();
  // `now` fills in after mount so server and client render the same markup.
  const [now, setNow] = useState<Date | null>(null);
  const [mode, setMode] = useState<Mode | null>(null);

  useEffect(() => {
    setNow(new Date());
  }, []);

  const planMonth = useMemo(() => planMonthFor(snapshot, now ?? new Date()), [snapshot, now]);
  const suggestions = useMemo(() => suggestPickup(snapshot, now ?? new Date()), [snapshot, now]);
  const saved = savedPlanFor(snapshot, planMonth.month);
  const checkinReady = hasPickupIn(snapshot.pickups, currentMonth(now ?? undefined));
  // A saved plan opens on its checklist; the editor is one tap away.
  const view: Mode = mode ?? (saved ? "checklist" : "edit");

  return (
    <>
      <AppHeader title={t("pages.plan.title")} subtitle={t("pages.plan.subtitle")} />
      <PageContainer>
        {/* While the first snapshot loads, show nothing rather than flashing the empty state. */}
        {loading ? null : snapshot.members.length === 0 ? (
          <Card className="animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both">
            <CardContent>
              <EmptyState
                icon={Users}
                title={t("pages.plan.empty.title")}
                description={t("pages.plan.empty.description")}
                className="py-6"
                action={
                  <Button nativeButton={false} size="lg" className="pressable h-11 rounded-xl px-5" render={<Link href="/settings" />}>
                    {t("pages.plan.empty.action")}
                  </Button>
                }
              />
            </CardContent>
          </Card>
        ) : view === "checklist" && saved ? (
          <PlanChecklist plan={saved} household={snapshot.household} members={snapshot.members} onEdit={() => setMode("edit")} />
        ) : (
          <PlanEditor
            key={planMonth.month}
            planMonth={planMonth}
            suggestions={suggestions}
            saved={saved}
            checkinReady={checkinReady}
            onSaved={() => setMode("checklist")}
          />
        )}
      </PageContainer>
    </>
  );
}
