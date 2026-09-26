"use client";

import { useEffect, useRef, useState } from "react";

export type ShareStatus = "idle" | "copied" | "failed";

/**
 * Shares text through the native sheet, falling back to the clipboard when the sheet is
 * missing or refuses (desktop browsers often reject text-only shares). Only a share the
 * family cancelled (AbortError) stays silent; a blocked clipboard reports "failed".
 */
export function usePlanShare(): { status: ShareStatus; share: (title: string, text: string) => Promise<void> } {
  const [status, setStatus] = useState<ShareStatus>("idle");
  const timer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    };
  }, []);

  const flash = (next: ShareStatus) => {
    setStatus(next);
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setStatus("idle"), 2000);
  };

  const share = async (title: string, text: string) => {
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({ title, text });
        return;
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(text);
      flash("copied");
    } catch {
      flash("failed");
    }
  };

  return { status, share };
}
