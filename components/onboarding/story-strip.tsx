"use client";

import { useEffect, type RefObject } from "react";
import { useT } from "@/lib/i18n/provider";
import { BEATS } from "./beats";
import { StoryCard } from "./story-card";

type StoryStripProps = {
  /** The page owns the ref so the dots can scroll a beat into view. */
  listRef: RefObject<HTMLUListElement | null>;
  onActiveChange: (index: number) => void;
};

/**
 * Snap-scrolling row of story beats. The 24px peek of the next card is the swipe affordance.
 * An IntersectionObserver reports which beat is mostly in view.
 */
export function StoryStrip({ listRef, onActiveChange }: StoryStripProps) {
  const t = useT();

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const index = Number((entry.target as HTMLElement).dataset.beat);
          if (Number.isFinite(index)) onActiveChange(index);
        }
      },
      { root: list, threshold: 0.6 },
    );
    for (const child of Array.from(list.children)) observer.observe(child);
    return () => observer.disconnect();
  }, [listRef, onActiveChange]);

  return (
    <section role="region" aria-roledescription="carousel" aria-label={t("pages.onboarding.storyLabel")}>
      <ul
        ref={listRef}
        className="no-scrollbar -mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth px-5 [scroll-padding-inline:1.25rem]"
      >
        {BEATS.map((beat, index) => (
          <li key={beat.id} data-beat={index} className="w-[calc(100%-1.5rem)] shrink-0 snap-center">
            <StoryCard beat={beat} />
          </li>
        ))}
      </ul>
    </section>
  );
}
