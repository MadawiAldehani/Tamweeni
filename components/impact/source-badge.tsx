"use client";

import { Info } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/format";
import { useLanguage } from "@/lib/i18n/provider";
import type { ImpactStats } from "@/lib/impact/types";

/** Says plainly where the numbers come from: the pilot projection (sand) or live aggregates (green). */
export function SourceBadge({ stats }: { stats: ImpactStats }) {
  const { t, locale } = useLanguage();

  if (stats.source === "live") {
    return (
      <Badge variant="default" className="h-6 gap-1.5 px-2.5">
        <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-primary-foreground" />
        <bdi>{t("pages.impact.source.live", { date: formatDate(stats.updatedAt, locale) })}</bdi>
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" className="h-6 gap-1.5 px-2.5">
      <Info aria-label={t("pages.impact.source.info")} />
      {t("pages.impact.source.demo")}
    </Badge>
  );
}
