import type { TKey } from "@/lib/i18n/translate";

export type BeatId = "see" | "take" | "donate";

export type Beat = {
  id: BeatId;
  titleKey: TKey;
  bodyKey: TKey;
};

/** The three-beat story: See → Take → Nothing goes to waste (beat id "donate" is kept for the illustration). Order matters; the dots index into it. */
export const BEATS: readonly Beat[] = [
  { id: "see", titleKey: "pages.onboarding.story.see.title", bodyKey: "pages.onboarding.story.see.body" },
  { id: "take", titleKey: "pages.onboarding.story.take.title", bodyKey: "pages.onboarding.story.take.body" },
  { id: "donate", titleKey: "pages.onboarding.story.donate.title", bodyKey: "pages.onboarding.story.donate.body" },
];
