"use client";

import { Bot, Cpu, FileText, PencilLine, type LucideIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useT } from "@/lib/i18n/provider";
import type { TKey } from "@/lib/i18n/provider";
import type { ReviewSource } from "@/lib/receipt/review";

type ReceiptMetaProps = {
  source: ReviewSource;
  store: string;
  date: string;
  onStoreChange: (store: string) => void;
  onDateChange: (date: string) => void;
};

const SOURCE_BADGE: Record<ReviewSource, { icon: LucideIcon; key: TKey }> = {
  sample: { icon: FileText, key: "pages.scan.review.backend.sample" },
  ocr: { icon: Cpu, key: "pages.scan.review.backend.ocr" },
  claude: { icon: Bot, key: "pages.scan.review.backend.claude" },
  manual: { icon: PencilLine, key: "pages.scan.review.backend.manual" },
};

/** Store name and pickup date, with a badge saying where the lines came from. */
export function ReceiptMeta({ source, store, date, onStoreChange, onDateChange }: ReceiptMetaProps) {
  const t = useT();
  const badge = SOURCE_BADGE[source];

  return (
    <Card>
      <CardContent className="flex flex-col gap-3">
        <Badge variant="secondary" className="h-6 self-start px-2.5">
          <badge.icon aria-hidden="true" />
          {t(badge.key)}
        </Badge>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="receipt-store">{t("pages.scan.review.store")}</Label>
          <Input
            id="receipt-store"
            value={store}
            onChange={(e) => onStoreChange(e.target.value)}
            placeholder={t("pages.scan.review.storePlaceholder")}
            autoComplete="off"
            className="h-11 rounded-lg bg-card"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="receipt-date">{t("pages.scan.review.date")}</Label>
          <Input
            id="receipt-date"
            type="date"
            value={date}
            onChange={(e) => onDateChange(e.target.value)}
            className="tabular h-11 rounded-lg bg-card"
          />
        </div>
      </CardContent>
    </Card>
  );
}
