"use client";

import { Check, CircleHelp, X } from "lucide-react";
import { useEffect, useRef, type CSSProperties } from "react";

import { ItemIcon } from "@/components/common/item-icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { localized, useLanguage } from "@/lib/i18n/provider";
import { RATION_ITEMS, type RationItemId } from "@/lib/ration/catalog";
import { isExcluded, isInvalid, needsConfirmation, withItem, type ReviewLine as ReviewLineModel } from "@/lib/receipt/review";
import { cn } from "@/lib/utils";

type ReviewLineProps = {
  line: ReviewLineModel;
  index: number;
  /** A line the family just added: scroll it into view and open focus on the item picker. */
  autoFocus?: boolean;
  onChange: (line: ReviewLineModel) => void;
  onRemove: () => void;
};

/** Base UI Select needs a string value, so "not a ration item" is a sentinel. */
const NONE = "none";

/** One editable receipt line: item picker, quantity, price, the raw text and a confidence badge. */
export function ReviewLine({ line, index, autoFocus = false, onChange, onRemove }: ReviewLineProps) {
  const { t, locale } = useLanguage();
  const cardRef = useRef<HTMLDivElement>(null);
  const excluded = isExcluded(line);
  const unconfirmed = !excluded && needsConfirmation(line);
  const invalid = isInvalid(line);
  const highlighted = unconfirmed || invalid;

  useEffect(() => {
    if (!autoFocus) return;
    const card = cardRef.current;
    card?.scrollIntoView({ block: "center", behavior: "smooth" });
    card?.querySelector<HTMLElement>("[data-slot=select-trigger]")?.focus();
  }, [autoFocus]);
  const items = [
    { value: NONE, label: t("pages.scan.review.notRationItem") },
    ...RATION_ITEMS.map((item) => ({ value: item.id, label: localized(item, "name", locale) })),
  ];

  return (
    <Card
      ref={cardRef}
      style={{ "--i": index } as CSSProperties}
      className={cn("transition-colors", highlighted && "bg-warning/10 ring-warning/40", excluded && "opacity-60")}
    >
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-center gap-2.5">
          {line.item_id ? (
            <ItemIcon itemId={line.item_id} size={40} />
          ) : (
            <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <CircleHelp className="size-5" />
            </span>
          )}
          <Select
            items={items}
            value={line.item_id ?? NONE}
            onValueChange={(value) => onChange(withItem(line, value === NONE || value === null ? null : (value as RationItemId)))}
          >
            {/* data-[size=default]:h-8 outranks a plain h-11, so the 44px height is set on the same selector. */}
            <SelectTrigger aria-label={t("pages.scan.review.item")} className="h-11 min-w-0 flex-1 rounded-lg bg-card text-base data-[size=default]:h-11">
              <SelectValue placeholder={t("pages.scan.review.pickItem")} />
            </SelectTrigger>
            <SelectContent>
              {items.map((item) => (
                <SelectItem key={item.value} value={item.value} className="py-2">
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="ghost" size="icon" aria-label={t("pages.scan.review.removeLine")} className="size-11 shrink-0 rounded-full text-muted-foreground" onClick={onRemove}>
            <X className="size-5" />
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <label className="flex flex-col gap-1 text-xs text-muted-foreground">
            {t("pages.scan.review.qty")}
            <span className="relative">
              <Input
                type="number"
                inputMode="decimal"
                min={0}
                step="any"
                defaultValue={line.qty > 0 ? line.qty : ""}
                onChange={(e) => onChange({ ...line, qty: Math.max(0, Number(e.target.value) || 0) })}
                aria-invalid={invalid ? true : undefined}
                className="tabular h-11 rounded-lg bg-card pe-12 text-base"
              />
              <bdi className="pointer-events-none absolute inset-y-0 end-3 flex items-center text-sm text-muted-foreground">
                {t(`units.${line.unit}`)}
              </bdi>
            </span>
          </label>
          <label className="flex flex-col gap-1 text-xs text-muted-foreground">
            {t("pages.scan.review.unitPrice")}
            <Input
              // Uncontrolled: remount when the item changes so a catalog price snapped in by withItem() is shown.
              key={`${line.id}:${line.item_id ?? NONE}`}
              type="number"
              inputMode="decimal"
              min={0}
              step="0.001"
              defaultValue={line.unit_price ?? ""}
              onChange={(e) => onChange({ ...line, unit_price: e.target.value === "" ? null : Math.max(0, Number(e.target.value) || 0) })}
              className="tabular h-11 rounded-lg bg-card text-base"
            />
          </label>
        </div>

        {line.raw_text ? (
          <p className="truncate font-mono text-[11px] text-muted-foreground" title={t("pages.scan.review.rawText")}>
            <bdi>{line.raw_text}</bdi>
          </p>
        ) : null}

        <div className="flex min-h-8 flex-wrap items-center gap-2">
          {line.confirmed ? (
            <Badge variant="outline" className="border-primary/30 text-primary">
              <Check aria-hidden="true" />
              {t("pages.scan.review.confirmed")}
            </Badge>
          ) : (
            <Badge variant={unconfirmed ? "outline" : "secondary"} className={cn("tabular", unconfirmed && "border-warning/40 text-warning")}>
              <bdi>{t("pages.scan.review.confidence", { percent: Math.round(line.confidence * 100) })}</bdi>
            </Badge>
          )}
          {unconfirmed ? (
            <>
              <span className="text-xs font-medium text-warning">{t("pages.scan.review.pleaseConfirm")}</span>
              <Button size="sm" variant="outline" className="pressable ms-auto h-9 rounded-lg px-3" onClick={() => onChange({ ...line, confirmed: true })}>
                <Check aria-hidden="true" />
                {t("pages.scan.review.looksRight")}
              </Button>
            </>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
