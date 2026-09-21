"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

/**
 * Animates from the last shown number to `value` with requestAnimationFrame.
 * Starts at 0 on mount, restarts whenever `value` changes, and jumps straight
 * to `value` when the user prefers reduced motion.
 */
export function useCountUp(value: number, durationMs = 900): number {
  const [shown, setShown] = useState(0);
  const shownRef = useRef(0);

  useEffect(() => {
    const from = shownRef.current;
    let frame = 0;
    let start = 0;

    const settle = () => {
      shownRef.current = value;
      setShown(value);
    };

    if (prefersReducedMotion() || durationMs <= 0 || from === value) {
      frame = requestAnimationFrame(settle);
      return () => cancelAnimationFrame(frame);
    }

    const tick = (now: number) => {
      if (!start) start = now;
      const t = Math.min(1, (now - start) / durationMs);
      if (t >= 1) return settle();
      const next = from + (value - from) * easeOutCubic(t);
      shownRef.current = next;
      setShown(next);
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, durationMs]);

  return shown;
}

type CountUpProps = {
  value: number;
  /** Turns the in-flight number into text (use lib/format.ts helpers for KD). */
  format?: (n: number) => string;
  durationMs?: number;
  className?: string;
};

/** A big number that counts up to `value`. Tabular digits so the width stays steady. */
export function CountUp({
  value,
  format = (n) => String(Math.round(n)),
  durationMs,
  className,
}: CountUpProps) {
  const n = useCountUp(value, durationMs);
  return <span className={cn("tabular", className)}>{format(n)}</span>;
}
