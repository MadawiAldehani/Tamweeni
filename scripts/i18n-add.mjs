// Add keys to BOTH dictionaries in one atomic write, so parallel editors don't clobber each other.
// Usage: node scripts/i18n-add.mjs '{"pages.home.greetingMorning":{"en":"Good morning","ar":"صباح الخير"}}' [--force]
import { readFileSync, writeFileSync } from "node:fs";

const [, , json, flag] = process.argv;
if (!json) {
  console.error("Pass a JSON object of { \"dot.path\": { en, ar } }");
  process.exit(1);
}
const entries = JSON.parse(json);
const force = flag === "--force";
const file = (name) => new URL(`../lib/i18n/dictionaries/${name}.json`, import.meta.url);
const dicts = { en: JSON.parse(readFileSync(file("en"), "utf8")), ar: JSON.parse(readFileSync(file("ar"), "utf8")) };

const set = (obj, path, value) => {
  const parts = path.split(".");
  let node = obj;
  for (const part of parts.slice(0, -1)) {
    if (typeof node[part] !== "object" || node[part] === null) node[part] = {};
    node = node[part];
  }
  const leaf = parts.at(-1);
  if (leaf in node && !force) return false;
  node[leaf] = value;
  return true;
};

let added = 0;
for (const [path, value] of Object.entries(entries)) {
  if (typeof value?.en !== "string" || typeof value?.ar !== "string") {
    console.error(`${path}: needs both "en" and "ar" strings`);
    process.exit(1);
  }
  const okEn = set(dicts.en, path, value.en);
  const okAr = set(dicts.ar, path, value.ar);
  if (okEn && okAr) added += 1;
  else console.warn(`${path}: already exists (use --force to overwrite)`);
}
writeFileSync(file("en"), JSON.stringify(dicts.en, null, 2) + "\n");
writeFileSync(file("ar"), JSON.stringify(dicts.ar, null, 2) + "\n");
console.log(`added ${added} key(s) to en.json and ar.json`);
