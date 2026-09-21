import type { TKey } from "@/lib/i18n/provider";

export type Greeting = { key: TKey; emoji: string };

/** Greeting by hour of day: morning 5–11, afternoon 12–16, evening otherwise. */
export function greetingFor(hour: number): Greeting {
  if (hour >= 5 && hour <= 11) return { key: "pages.home.greeting.morning", emoji: "🌤️" };
  if (hour >= 12 && hour <= 16) return { key: "pages.home.greeting.afternoon", emoji: "☀️" };
  return { key: "pages.home.greeting.evening", emoji: "🌙" };
}
