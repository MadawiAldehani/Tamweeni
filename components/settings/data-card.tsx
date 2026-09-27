"use client";

import { Database, LogOut, RotateCcw, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ConfirmDialog } from "@/components/settings/confirm-dialog";
import { InlineNote, useFlash } from "@/components/settings/inline-note";
import { useStoreUserEmail } from "@/components/settings/use-store-user";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useData } from "@/lib/data/provider";
import { useLanguage } from "@/lib/i18n/provider";

type Pending = "demo" | "reset" | null;

export function DataCard() {
  const { t, locale } = useLanguage();
  const router = useRouter();
  const { store, mutate } = useData();
  const [dialog, setDialog] = useState<Pending>(null);
  const [busy, setBusy] = useState<Pending | "signout">(null);
  const [note, flash] = useFlash();

  const email = useStoreUserEmail(store);
  const isSupabase = store?.mode === "supabase";

  const modeLabel = !isSupabase
    ? t("pages.settings.data.demoMode")
    : email
      ? t("pages.settings.data.supabaseMode", { email })
      : t("pages.settings.data.supabaseModeNoEmail");

  const loadDemo = async () => {
    setBusy("demo");
    try {
      await mutate((s) => s.loadDemoFamily(locale));
      setDialog(null);
      flash(t("pages.settings.data.loadDemoDone"));
    } finally {
      setBusy(null);
    }
  };

  const reset = async () => {
    setBusy("reset");
    try {
      await mutate((s) => s.resetAll());
      setDialog(null);
      router.replace("/onboarding");
    } finally {
      setBusy(null);
    }
  };

  // Through mutate() so the snapshot is reloaded: the old account's data must not linger in memory.
  const signOut = async () => {
    setBusy("signout");
    try {
      await mutate((s) => s.signOut());
      router.replace("/onboarding");
    } finally {
      setBusy(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="size-4 text-muted-foreground" aria-hidden="true" />
          {t("pages.settings.data.title")}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Badge variant={isSupabase ? "default" : "secondary"} className="h-auto self-start py-1 whitespace-normal">
          <bdi>{modeLabel}</bdi>
        </Badge>

        <div className="flex flex-col gap-2">
          <Button
            type="button"
            variant="outline"
            size="lg"
            disabled={busy !== null}
            onClick={() => setDialog("demo")}
            className="pressable h-12 justify-start rounded-xl text-base"
          >
            <Sparkles data-icon="inline-start" className="size-5 text-primary" aria-hidden="true" />
            {t("pages.settings.data.loadDemo")}
          </Button>

          <Button
            type="button"
            variant="outline"
            size="lg"
            disabled={busy !== null}
            onClick={() => setDialog("reset")}
            className="pressable h-12 justify-start rounded-xl text-base text-destructive hover:text-destructive"
          >
            <RotateCcw data-icon="inline-start" className="size-5 rtl:-scale-x-100" aria-hidden="true" />
            {t("pages.settings.data.reset")}
          </Button>

          {isSupabase ? (
            <Button
              type="button"
              variant="outline"
              size="lg"
              disabled={busy !== null}
              onClick={() => void signOut()}
              className="pressable h-12 justify-start rounded-xl text-base"
            >
              <LogOut data-icon="inline-start" className="size-5 rtl:-scale-x-100" aria-hidden="true" />
              {busy === "signout" ? t("pages.settings.data.working") : t("pages.settings.data.signOut")}
            </Button>
          ) : null}
        </div>

        <InlineNote message={note} />
      </CardContent>

      <ConfirmDialog
        open={dialog === "demo"}
        onOpenChange={(open) => setDialog(open ? "demo" : null)}
        title={t("pages.settings.data.loadDemoTitle")}
        body={t("pages.settings.data.loadDemoBody")}
        confirmLabel={t("pages.settings.data.loadDemoConfirm")}
        busy={busy === "demo"}
        onConfirm={loadDemo}
      />
      <ConfirmDialog
        open={dialog === "reset"}
        onOpenChange={(open) => setDialog(open ? "reset" : null)}
        title={t("pages.settings.data.resetTitle")}
        body={t("pages.settings.data.resetBody")}
        confirmLabel={t("pages.settings.data.resetConfirm")}
        destructive
        busy={busy === "reset"}
        onConfirm={reset}
      />
    </Card>
  );
}
