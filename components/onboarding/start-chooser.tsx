"use client";

import { ChevronRight, Loader2, Sparkles, UsersRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { useData } from "@/lib/data/provider";
import { useLanguage } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";

type ChoiceProps = {
  icon: ReactNode;
  title: string;
  caption: string;
  badge?: string;
  disabled?: boolean;
  onClick: () => void;
};

function Choice({ icon, title, caption, badge, disabled, onClick }: ChoiceProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "pressable flex w-full items-center gap-4 rounded-2xl bg-card p-4 text-start ring-1 ring-foreground/10 transition-colors",
        "disabled:opacity-60",
      )}
    >
      <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">{icon}</span>
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        {badge ? <span className="text-xs font-medium text-secondary-foreground/80">{badge}</span> : null}
        <span className="text-base font-semibold text-foreground">{title}</span>
        <span className="text-sm text-muted-foreground">{caption}</span>
      </span>
      <ChevronRight className="size-5 shrink-0 text-muted-foreground rtl:-scale-x-100" aria-hidden="true" />
    </button>
  );
}

type StartChooserProps = {
  /** Shown under the title in Supabase mode. */
  email: string | null;
  onSetup: () => void;
};

/** "Demo family or my own household?" — the fork every new visitor takes. */
export function StartChooser({ email, onSetup }: StartChooserProps) {
  const { t, locale } = useLanguage();
  const router = useRouter();
  const { isMock, mutate } = useData();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  const loadDemo = async () => {
    setBusy(true);
    setFailed(false);
    try {
      await mutate((s) => s.loadDemoFamily(locale));
      router.replace("/home");
    } catch {
      setFailed(true);
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-center text-lg font-semibold">{t("pages.onboarding.start.title")}</h2>
      {email ? (
        <p className="text-center text-sm text-muted-foreground">
          <bdi>{t("pages.onboarding.start.signedInAs", { email })}</bdi>
        </p>
      ) : null}
      <Choice
        icon={busy ? <Loader2 className="size-6 animate-spin" aria-hidden="true" /> : <Sparkles className="size-6" aria-hidden="true" />}
        title={busy ? t("pages.onboarding.start.demoLoading") : t("pages.onboarding.start.demoTitle")}
        caption={t("pages.onboarding.start.demoCaption")}
        badge={isMock ? t("pages.onboarding.start.demoBadge") : undefined}
        disabled={busy}
        onClick={() => void loadDemo()}
      />
      <Choice
        icon={<UsersRound className="size-6" aria-hidden="true" />}
        title={t("pages.onboarding.start.setupTitle")}
        caption={t("pages.onboarding.start.setupCaption")}
        disabled={busy}
        onClick={onSetup}
      />
      {failed ? (
        <p role="alert" className="text-center text-sm text-destructive">
          {t("common.somethingWentWrong")}
        </p>
      ) : null}
    </div>
  );
}
