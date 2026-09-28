"use client";

import { Users } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState, type CSSProperties } from "react";

import { EmptyState } from "@/components/common/empty-state";
import { DonatePicker } from "@/components/donate/donate-picker";
import { DonationHistory } from "@/components/donate/donation-history";
import { PledgeSuccess } from "@/components/donate/pledge-success";
import { VoucherCard } from "@/components/donate/voucher-card";
import { WhatsAppPickupButton } from "@/components/donate/whatsapp-button";
import { AppHeader } from "@/components/shell/app-header";
import { PageContainer } from "@/components/shell/page-container";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useData } from "@/lib/data/provider";
import type { DonationStatus } from "@/lib/data/types";
import { donationPrefill, type DonationDraftLine } from "@/lib/donate/prefill";
import { useT } from "@/lib/i18n/provider";
import { sadaqaTotals } from "@/lib/ration/meals";

const at = (i: number) => ({ "--i": i }) as CSSProperties;

/** Swaps the query string without a navigation; Next patches replaceState, so useSearchParams follows. */
function replaceUrl(search: string) {
  window.history.replaceState(null, "", `/donate${search}`);
}

/** useSearchParams needs a Suspense boundary above it for the static prerender. */
export default function DonatePage() {
  return (
    <Suspense fallback={null}>
      <DonateScreen />
    </Suspense>
  );
}

function DonateScreen() {
  const t = useT();
  const { snapshot, loading, mutate } = useData();
  // The view follows the URL, so the bottom-nav Donate tab (a soft navigation to /donate) returns to the picker.
  const searchParams = useSearchParams();
  const voucherCode = searchParams.get("voucher");
  const planParam = searchParams.get("plan");
  // `now` fills in after mount so server and client render the same markup.
  const [now, setNow] = useState<Date | null>(null);
  // The code the family pledged in this visit: only that voucher gets the "thank you" header.
  const [pledgedCode, setPledgedCode] = useState<string | null>(null);

  useEffect(() => {
    setNow(new Date());
  }, []);

  // Quantities come from the saved plan for the month (entitled − planned − already pledged); no plan → manual pick.
  const prefill = useMemo(() => donationPrefill(snapshot, now ?? new Date(), planParam), [snapshot, now, planParam]);
  // Remount the picker whenever what can be given changes: first load, a pledge, a new plan.
  const pickerKey = `${prefill.month}:${prefill.source}:${prefill.lines.map((l) => `${l.item.id}=${l.qty}/${l.maxQty}`).join(",")}`;

  const openVoucher = (code: string) => {
    replaceUrl(`?voucher=${encodeURIComponent(code)}`);
    window.scrollTo({ top: 0 });
  };
  const openPicker = () => replaceUrl("");
  const setStatus = (code: string, next: DonationStatus) => mutate((s) => s.setDonationStatus(code, next));
  const pledge = async (month: string, lines: DonationDraftLine[]) => {
    const code = await mutate((s) =>
      s.createDonations({ month, lines: lines.map(({ item, qty }) => ({ item_id: item.id, qty })) }),
    );
    setPledgedCode(code);
    openVoucher(code);
  };

  const household = snapshot.household;
  const voucherDonations = voucherCode ? snapshot.donations.filter((d) => d.voucher_code === voucherCode) : [];
  const voucher = voucherCode && household && voucherDonations.length > 0 ? { code: voucherCode, household } : null;
  const justPledged = voucher !== null && voucher.code === pledgedCode;

  return (
    <>
      <AppHeader
        title={t("pages.donate.title")}
        subtitle={t("pages.donate.subtitle")}
        backHref={voucher && !justPledged ? "/donate" : undefined}
      />
      <PageContainer>
        {/* While the first snapshot loads, show nothing rather than flashing the empty state. */}
        {loading ? null : snapshot.members.length === 0 ? (
          <Card className="animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both">
            <CardContent>
              <EmptyState
                icon={Users}
                title={t("pages.donate.empty.title")}
                description={t("pages.donate.empty.description")}
                className="py-6"
                action={
                  <Button nativeButton={false} size="lg" className="pressable h-11 rounded-xl px-5" render={<Link href="/settings" />}>
                    {t("pages.donate.empty.action")}
                  </Button>
                }
              />
            </CardContent>
          </Card>
        ) : voucher ? (
          <div className="stagger flex flex-col gap-4">
            {justPledged ? <PledgeSuccess meals={sadaqaTotals(voucherDonations).meals} style={at(0)} /> : null}
            <VoucherCard
              code={voucher.code}
              donations={voucherDonations}
              household={voucher.household}
              status={voucherDonations[0].status}
              onToggleStatus={(next) => void setStatus(voucher.code, next)}
            />
            <div style={at(2)}>
              <WhatsAppPickupButton code={voucher.code} donations={voucherDonations} household={voucher.household} />
            </div>
            <div style={at(3)} className="flex flex-col gap-2">
              <Button nativeButton={false} size="lg" className="pressable h-12 rounded-xl text-base" render={<Link href="/home" />}>
                {t("pages.donate.success.backHome")}
              </Button>
              <Button variant="ghost" size="lg" className="pressable h-11 rounded-xl text-base" onClick={openPicker}>
                {t(justPledged ? "pages.donate.success.donateMore" : "pages.donate.voucher.backToPledges")}
              </Button>
            </div>
          </div>
        ) : (
          <>
            <DonatePicker key={pickerKey} prefill={prefill} onPledge={pledge} />
            {/* DonationHistory owns its heading and renders nothing when the family has not pledged yet. */}
            <div className="mt-8 animate-in fade-in duration-500 fill-mode-both">
              <DonationHistory donations={snapshot.donations} onOpenVoucher={openVoucher} onToggleStatus={(code, next) => void setStatus(code, next)} />
            </div>
          </>
        )}
      </PageContainer>
    </>
  );
}
