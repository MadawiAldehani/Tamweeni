// Shared Recharts props so both charts read as one system. No React here.

export const CHART_HEIGHT = 220;

/** Series → CSS token. "entitled" is a reference track, not a series, so it stays neutral. */
export const SERIES_FILL = {
  entitled: "var(--chart-3)",
  collected: "var(--chart-1)",
  used: "var(--chart-2)",
} as const;

export type SeriesKey = keyof typeof SERIES_FILL;

/** Recessive tick text; fontFamily inherit so Arabic month names use the Arabic face. */
export const AXIS_TICK = {
  fontSize: 11,
  fill: "var(--muted-foreground)",
  fontFamily: "inherit",
} as const;

/** Direct value labels sit on the caps and wear the text token, never the series color. */
export const VALUE_LABEL = {
  fontSize: 11,
  fill: "var(--foreground)",
  fontFamily: "inherit",
} as const;

export const BAR_RADIUS: [number, number, number, number] = [4, 4, 0, 0];
export const BAR_MAX = 24;
export const BAR_GAP = 2;
/** Applied on both sides of each band; 12% leaves three 23px bars per month at 390px so labels fit. */
export const BAR_CATEGORY_GAP = "12%";

/** A soft wash under the hovered month so the mark visibly responds. */
export const CURSOR_FILL = { fill: "var(--muted)", fillOpacity: 0.6 } as const;
