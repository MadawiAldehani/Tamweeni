"use client";

import { Check } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/** Toast-like confirmation that lives inside a card and fades out after a few seconds. */
export function useFlash(durationMs = 4000): [string | null, (message: string) => void] {
  const [message, setMessage] = useState<string | null>(null);
  const timer = useRef<number | null>(null);

  const flash = useCallback(
    (next: string) => {
      setMessage(next);
      if (timer.current) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setMessage(null), durationMs);
    },
    [durationMs],
  );

  useEffect(
    () => () => {
      if (timer.current) window.clearTimeout(timer.current);
    },
    [],
  );

  return [message, flash];
}

export function InlineNote({ message, className }: { message: string | null; className?: string }) {
  if (!message) return null;
  return (
    <p
      role="status"
      aria-live="polite"
      className={cn(
        "flex items-start gap-2 rounded-lg bg-primary/10 px-3 py-2 text-sm text-primary animate-in fade-in slide-in-from-top-1 duration-300",
        className,
      )}
    >
      <Check className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <span>{message}</span>
    </p>
  );
}
