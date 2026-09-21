"use client";

import { SaduPattern } from "@/components/common/sadu-pattern";
import { useT } from "@/lib/i18n/provider";
import type { Beat } from "./beats";
import { StoryIllustration } from "./story-illustration";

/** One beat of the onboarding story: illustration, title, body, Sadu band along the bottom. */
export function StoryCard({ beat }: { beat: Beat }) {
  const t = useT();

  return (
    <article className="relative flex min-h-[320px] flex-col items-center gap-5 overflow-hidden rounded-3xl bg-secondary/60 px-6 pt-7 pb-9 text-center">
      <div className="flex h-40 w-full items-center justify-center">
        <StoryIllustration beat={beat.id} />
      </div>
      <h2 className="text-xl font-semibold leading-snug">{t(beat.titleKey)}</h2>
      <p className="max-w-[28ch] text-sm leading-relaxed text-muted-foreground">{t(beat.bodyKey)}</p>
      <SaduPattern variant="band" className="absolute inset-x-0 bottom-0 text-primary/30" />
    </article>
  );
}
