"use client";

import { Check } from "lucide-react";
import { ItemIcon } from "@/components/common/item-icon";
import { SaduPattern } from "@/components/common/sadu-pattern";
import { useT } from "@/lib/i18n/provider";
import type { RationItemId } from "@/lib/ration/catalog";
import type { BeatId } from "./beats";

/** Beat 1: a ration card, same DNA as the LogoMark but bigger and tilted. */
function SeeIllustration() {
  return (
    <div className="relative">
      <div aria-hidden className="absolute -inset-6 rounded-full bg-card/70" />
      <div className="relative h-[108px] w-[168px] -rotate-3 overflow-hidden rounded-2xl bg-primary p-3 shadow-[0_12px_30px_-12px_rgba(31,111,74,0.5)] rtl:rotate-3">
        <SaduPattern variant="field" className="absolute inset-0 text-white/10" />
        <span aria-hidden className="absolute top-3 start-3 h-5 w-7 rounded-md bg-secondary" />
        <span aria-hidden className="absolute start-3 top-[40px] h-2 w-[64px] rounded-full bg-secondary/80" />
        <span aria-hidden className="absolute start-3 top-[54px] h-2 w-[96px] rounded-full bg-secondary/80" />
        <span aria-hidden className="absolute start-3 top-[68px] h-2 w-[44px] rounded-full bg-secondary/80" />
        <span aria-hidden className="absolute bottom-3 end-3 flex size-7 items-center justify-center rounded-full bg-white">
          <Check className="size-4 text-primary" />
        </span>
      </div>
    </div>
  );
}

const shelf: { id: RationItemId; taken: boolean }[] = [
  { id: "rice", taken: true },
  { id: "oil", taken: true },
  { id: "milk_powder", taken: false },
  { id: "chicken", taken: true },
  { id: "dates", taken: false },
];

/** Beat 2: five items on the shelf; three ticked, two left behind. */
function TakeIllustration() {
  return (
    <div aria-hidden className="flex items-center gap-3">
      {shelf.map(({ id, taken }) =>
        taken ? (
          <span key={id} className="relative">
            <ItemIcon itemId={id} size={44} />
            <span className="absolute -top-1 -end-1 flex size-5 items-center justify-center rounded-full bg-primary ring-2 ring-secondary">
              <Check className="size-3 text-white" strokeWidth={3} />
            </span>
          </span>
        ) : (
          <ItemIcon key={id} itemId={id} size={44} className="opacity-45" />
        ),
      )}
    </div>
  );
}

/** Beat 3: giving hands, a dotted path with two floating items, and the Food Bank. */
function DonateIllustration() {
  const t = useT();
  return (
    <div className="flex items-center gap-2">
      <span aria-hidden className="flex size-[72px] items-center justify-center rounded-full bg-warm/15 text-4xl">
        🤲
      </span>
      <span aria-hidden className="relative flex w-20 items-center justify-center border-t-2 border-dotted border-primary/40">
        <span className="float absolute -top-4 start-2">
          <ItemIcon itemId="rice" size={28} />
        </span>
        <span className="float absolute -top-4 end-2 [animation-delay:1.2s]">
          <ItemIcon itemId="dates" size={28} />
        </span>
      </span>
      <div className="flex flex-col items-center gap-1.5">
        <div aria-hidden className="grid h-12 w-14 grid-cols-2 place-items-center gap-1 rounded-t-xl bg-primary px-2 pt-2">
          <span className="size-2 rounded-sm bg-white/85" />
          <span className="size-2 rounded-sm bg-white/85" />
          <span className="size-2 rounded-sm bg-white/85" />
          <span className="size-2 rounded-sm bg-white/85" />
        </div>
        <span className="text-[11px] font-medium leading-tight">{t("pages.onboarding.story.foodBank")}</span>
      </div>
    </div>
  );
}

const illustrations: Record<BeatId, () => React.JSX.Element> = {
  see: SeeIllustration,
  take: TakeIllustration,
  donate: DonateIllustration,
};

/** Picks the illustration for a story beat. No images: emoji, shapes and primitives only. */
export function StoryIllustration({ beat }: { beat: BeatId }) {
  const Illustration = illustrations[beat];
  return <Illustration />;
}
