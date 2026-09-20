"use client";

import { LogoMark } from "@/components/common/logo-mark";
import { useT } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";

type LogoSize = "sm" | "md" | "lg";

const sizes: Record<
  LogoSize,
  { mark: number; word: string; arabic: string; gap: string }
> = {
  sm: { mark: 28, word: "text-base", arabic: "text-xs", gap: "gap-2" },
  md: { mark: 40, word: "text-xl", arabic: "text-sm", gap: "gap-3" },
  lg: { mark: 64, word: "text-3xl", arabic: "text-base", gap: "gap-4" },
};

type LogoProps = {
  size?: LogoSize;
  className?: string;
};

/** Mark on the inline-start side, wordmark with the Arabic name beneath it. */
export function Logo({ size = "md", className }: LogoProps) {
  const t = useT();
  const s = sizes[size];

  return (
    <div className={cn("flex items-center", s.gap, className)}>
      <LogoMark size={s.mark} />
      <div className="flex flex-col leading-tight">
        <span className={cn("font-semibold tracking-tight text-primary", s.word)}>
          {t("app.name")}
        </span>
        <span lang="ar" className={cn("font-ar text-muted-foreground", s.arabic)}>
          {t("app.nameArabic")}
        </span>
      </div>
    </div>
  );
}
