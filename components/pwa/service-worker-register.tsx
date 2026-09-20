"use client";

import { useEffect } from "react";

/**
 * Registers /sw.js in production so the app is installable.
 * In development it unregisters any leftover worker so a stale build never haunts localhost.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    if (process.env.NODE_ENV !== "production") {
      navigator.serviceWorker
        .getRegistrations()
        .then((registrations) => Promise.all(registrations.map((r) => r.unregister())))
        .catch((error) => console.warn("Service worker cleanup failed", error));
      return;
    }

    navigator.serviceWorker
      .register("/sw.js")
      .catch((error) => console.warn("Service worker registration failed", error));
  }, []);

  return null;
}
