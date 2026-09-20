// Server-safe translation core: no React, no "use client". Import this from
// server components (metadata, layouts); use the hooks in ./provider on the client.
import en from "./dictionaries/en.json";
import ar from "./dictionaries/ar.json";
import type { Locale } from "./config";

/** Dot-path of every leaf string in en.json, e.g. "nav.home". */
type Leaves<T, Prefix extends string = ""> = T extends string
  ? Prefix
  : {
      [K in keyof T & string]: Leaves<
        T[K],
        Prefix extends "" ? K : `${Prefix}.${K}`
      >;
    }[keyof T & string];

export type TKey = Leaves<typeof en>;
export type TVars = Record<string, string | number>;

type Dictionary = Record<string, unknown>;
const dictionaries: Record<Locale, Dictionary> = { en, ar };

function lookup(dict: Dictionary, key: string): string | undefined {
  let node: unknown = dict;
  for (const part of key.split(".")) {
    if (node && typeof node === "object" && part in (node as object)) {
      node = (node as Dictionary)[part];
    } else {
      return undefined;
    }
  }
  return typeof node === "string" ? node : undefined;
}

function interpolate(template: string, vars?: TVars): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in vars ? String(vars[name]) : match,
  );
}

/** Translate a key; falls back to English, then to the key itself. */
export function translate(locale: Locale, key: TKey, vars?: TVars): string {
  const text = lookup(dictionaries[locale], key) ?? lookup(dictionaries.en, key) ?? key;
  return interpolate(text, vars);
}

/** Pick the localized field from an object with `name_en` / `name_ar` style keys. */
export function localized<T extends Record<string, unknown>>(
  obj: T,
  field: string,
  locale: Locale,
): string {
  const value = obj[`${field}_${locale}`] ?? obj[`${field}_en`];
  return typeof value === "string" ? value : "";
}
