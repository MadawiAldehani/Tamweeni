"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import type { ReactNode } from "react";
import { Logo } from "@/components/common/logo";
import { useT } from "@/lib/i18n/provider";

type AppHeaderProps = {
  title: string;
  subtitle?: string;
  backHref?: string;
  /** Rendered at the inline-end side (e.g. a language toggle). */
  action?: ReactNode;
  /** Show the logo in place of the title. */
  showLogo?: boolean;
};

export function AppHeader({
  title,
  subtitle,
  backHref,
  action,
  showLogo = false,
}: AppHeaderProps) {
  const t = useT();

  return (
    <header className="pt-safe sticky top-0 z-30 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-md items-center gap-3 px-4 py-3">
        {backHref ? (
          <Link
            href={backHref}
            aria-label={t("common.back")}
            className="pressable -ms-2 flex size-11 shrink-0 items-center justify-center rounded-full text-foreground hover:bg-muted"
          >
            <ChevronLeft className="size-6 rtl:-scale-x-100" aria-hidden="true" />
          </Link>
        ) : null}

        <div className="min-w-0 flex-1">
          {showLogo ? (
            <>
              <h1 className="sr-only">{title}</h1>
              {/* Fade only, no movement: the sticky header stays anchored while the page cascades below. */}
              <div className="animate-in fade-in duration-300">
                <Logo size="sm" />
              </div>
            </>
          ) : (
            <>
              <h1 className="truncate text-xl font-semibold">{title}</h1>
              {subtitle ? (
                <p className="truncate text-sm text-muted-foreground">{subtitle}</p>
              ) : null}
            </>
          )}
        </div>

        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </header>
  );
}
