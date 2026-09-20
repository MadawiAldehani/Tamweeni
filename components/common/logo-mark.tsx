import { cn } from "@/lib/utils";

type LogoMarkProps = {
  /** Rendered size in px (the mark is square). */
  size?: number;
  className?: string;
};

/**
 * Tamweeni mark: a ration card with a check. Pure geometry, no text.
 * Keep in sync with scripts that generate the PWA icons — same shapes, same colors.
 */
export function LogoMark({ size = 32, className }: LogoMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
      className={cn("shrink-0", className)}
    >
      <rect width="512" height="512" rx="112" fill="#1F6F4A" />
      <rect x="112" y="160" width="288" height="192" rx="28" fill="#FFFFFF" />
      <rect x="152" y="208" width="140" height="20" rx="10" fill="#E8D9BF" />
      <rect x="152" y="248" width="208" height="20" rx="10" fill="#E8D9BF" />
      <rect x="152" y="288" width="96" height="20" rx="10" fill="#E8D9BF" />
      <circle cx="352" cy="296" r="36" fill="#1F6F4A" />
      <polyline
        points="334,296 347,309 371,283"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="12"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
