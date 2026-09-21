import { getItem, type ItemTint, type RationItemId } from "@/lib/ration/catalog";
import { cn } from "@/lib/utils";

type ItemIconProps = {
  itemId: RationItemId;
  /** Circle diameter in px; the emoji scales with it. */
  size?: number;
  className?: string;
  /** Translated item name. When given the icon is announced; otherwise it is decorative. */
  label?: string;
};

const tintClass: Record<ItemTint, string> = {
  green: "bg-accent",
  sand: "bg-secondary",
  warm: "bg-warm/15",
  cream: "bg-muted",
};

/** A ration item's emoji on a soft tinted circle. Pure: no hooks, no text of its own. */
export function ItemIcon({ itemId, size = 40, className, label }: ItemIconProps) {
  const item = getItem(itemId);

  return (
    <span
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cn(
        "inline-flex shrink-0 select-none items-center justify-center rounded-full leading-none",
        tintClass[item.tint],
        className,
      )}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.5) }}
    >
      {item.emoji}
    </span>
  );
}
