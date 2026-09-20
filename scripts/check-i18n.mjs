// Fails when ar.json and en.json don't have exactly the same keys, or a value is empty.
import { readFileSync } from "node:fs";

const load = (name) =>
  JSON.parse(readFileSync(new URL(`../lib/i18n/dictionaries/${name}.json`, import.meta.url), "utf8"));

const leaves = (obj, prefix = "") =>
  Object.entries(obj).flatMap(([k, v]) =>
    typeof v === "object" && v !== null
      ? leaves(v, prefix ? `${prefix}.${k}` : k)
      : [[prefix ? `${prefix}.${k}` : k, v]],
  );

const en = new Map(leaves(load("en")));
const ar = new Map(leaves(load("ar")));

const missing = [...en.keys()].filter((k) => !ar.has(k));
const extra = [...ar.keys()].filter((k) => !en.has(k));
const empty = [...ar].filter(([, v]) => typeof v !== "string" || v.trim() === "").map(([k]) => k);
const placeholdersMismatch = [...en]
  .filter(([k]) => ar.has(k))
  .filter(([k, v]) => {
    const vars = (s) => (String(s).match(/\{\w+\}/g) ?? []).sort().join(",");
    return vars(v) !== vars(ar.get(k));
  })
  .map(([k]) => k);

let ok = true;
const report = (label, list) => {
  if (list.length) {
    ok = false;
    console.error(`${label} (${list.length}):\n  ${list.join("\n  ")}`);
  }
};
report("Missing in ar.json", missing);
report("Extra in ar.json (not in en.json)", extra);
report("Empty values in ar.json", empty);
report("Placeholder {vars} differ between en and ar", placeholdersMismatch);

if (ok) console.log(`i18n OK: ${en.size} keys in en and ar`);
process.exit(ok ? 0 : 1);
