"use client";

import { MailCheck } from "lucide-react";
import { useState, type FormEvent } from "react";
import { z } from "zod";
import { FieldError } from "@/components/onboarding/field-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { DataStore } from "@/lib/data/types";
import { useT } from "@/lib/i18n/provider";

type SigninCardProps = {
  store: DataStore;
  /** True when /auth/callback bounced back with ?error=auth. */
  authError: boolean;
};

type Status = "idle" | "sending" | "sent" | "failed";

/** Supabase mode only: magic-link sign-in shown before the start chooser. */
export function SigninCard({ store, authError }: SigninCardProps) {
  const t = useT();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [invalid, setInvalid] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const parsed = z.email().safeParse(email.trim());
    setInvalid(!parsed.success);
    if (!parsed.success) return;
    setStatus("sending");
    try {
      await store.signInWithEmail(parsed.data, `${window.location.origin}/auth/callback?next=/`);
      setStatus("sent");
    } catch {
      setStatus("failed");
    }
  };

  if (status === "sent") {
    return (
      <div className="flex flex-col items-center gap-2 rounded-2xl bg-card p-5 text-center ring-1 ring-foreground/10">
        <MailCheck className="size-8 text-primary" aria-hidden="true" />
        <h2 className="text-lg font-semibold">{t("pages.onboarding.signin.sentTitle")}</h2>
        <p className="text-sm text-muted-foreground">
          <bdi>{t("pages.onboarding.signin.sentBody", { email: email.trim() })}</bdi>
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={(e) => void submit(e)} className="flex flex-col gap-4 rounded-2xl bg-card p-5 ring-1 ring-foreground/10">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold">{t("pages.onboarding.signin.title")}</h2>
        <p className="text-sm text-muted-foreground">{t("pages.onboarding.signin.body")}</p>
      </div>
      {authError ? (
        <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {t("pages.onboarding.signin.authError")}
        </p>
      ) : null}
      <div className="flex flex-col gap-2">
        <Label htmlFor="signin-email">{t("pages.onboarding.signin.emailLabel")}</Label>
        <Input
          id="signin-email"
          type="email"
          inputMode="email"
          autoComplete="email"
          dir="ltr"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t("pages.onboarding.signin.emailPlaceholder")}
          aria-invalid={invalid || undefined}
          aria-describedby={invalid ? "signin-email-error" : undefined}
          className="h-11 rounded-lg"
        />
        <FieldError id="signin-email-error" message={invalid ? t("pages.onboarding.signin.invalidEmail") : undefined} />
      </div>
      {status === "failed" ? (
        <p role="alert" className="text-sm text-destructive">{t("pages.onboarding.signin.failed")}</p>
      ) : null}
      <Button type="submit" size="lg" disabled={status === "sending"} className="pressable h-12 w-full rounded-xl text-base">
        {status === "sending" ? t("pages.onboarding.signin.sending") : t("pages.onboarding.signin.submit")}
      </Button>
    </form>
  );
}
