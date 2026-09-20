import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type ProgressRingProps = {
  /** Fraction complete, 0..1 (clamped). */
  value: number;
  /** Outer diameter in px. */
  size?: number;
  strokeWidth?: number;
  /** Colour of the background track; applied via currentColor. */
  trackClassName?: string;
  /** Colour of the filled arc; applied via currentColor. */
  progressClassName?: string;
  /** Rendered centered inside the ring. */
  children?: ReactNode;
  className?: string;
  /** Accessible name for the progressbar (pass a translated string). */
  label: string;
};

function clamp01(n: number) {
  if (Number.isNaN(n)) return 0;
  return Math.min(1, Math.max(0, n));
}

/** SVG ring that fills clockwise from 12 o'clock. Pure: no hooks, no text. */
export function ProgressRing({
  value,
  size = 120,
  strokeWidth = 10,
  trackClassName = "text-muted",
  progressClassName = "text-primary",
  children,
  className,
  label,
}: ProgressRingProps) {
  const fraction = clamp01(value);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - fraction);
  const percent = Math.round(fraction * 100);

  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      aria-label={label}
      className={cn("relative inline-flex shrink-0 items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
        aria-hidden="true"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className={trackClassName}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={progressClassName}
          style={{ transition: "stroke-dashoffset 600ms ease" }}
        />
      </svg>
      {children ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {children}
        </div>
      ) : null}
    </div>
  );
}
