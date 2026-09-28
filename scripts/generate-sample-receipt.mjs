// Renders public/demo/receipt-sample.jpg: a realistic co-op ration-branch receipt for the
// demo family of 7 (one infant). The canned parse in lib/receipt/mock.ts mirrors these lines.
// Run: npm run sample-receipt   (needs the macOS/Linux system Arabic fonts that librsvg picks up)
import sharp from "sharp";
import { fileURLToPath } from "node:url";

const W = 560;
const AR = "Geeza Pro, Noto Sans Arabic, Arial";
const MONO = "Menlo, Courier New, monospace";

// [arabic label, packs, pack price KD]  — pack prices = subsidized unit price × pack size
const LINES = [
  ["أرز بسمتي 5 كجم", 7, 0.6],
  ["سكر 1 كجم", 7, 0.09],
  ["زيت دلال 3 لتر", 7, 3.15],
  ["حليب نيدو 2.27 كجم", 7, 2.3835],
  ["حليب كي دي دي 1 لتر", 42, 0.3],
  ["معجون طماطم 135 جم", 28, 0.27],
  ["عدس 300 جم", 7, 0.081],
  ["دجاج مجمد 1 كجم", 21, 0.6],
  ["تمر 500 جم", 7, 0.25],
  ["حليب أطفال 400 جم", 8, 0.9],
  ["مغذيات أطفال", 2, 0.9],
];

const kd = (n) => n.toFixed(3);
const total = LINES.reduce((s, [, q, p]) => s + q * p, 0);

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
let y = 70;
const rows = [];
const text = (x, str, opts = {}) => {
  const { size = 22, font = AR, anchor = "start", dir = "rtl", weight = "normal", fill = "#1c1c1c" } = opts;
  rows.push(
    `<text x="${x}" y="${y}" font-family="${font}" font-size="${size}" text-anchor="${anchor}" direction="${dir}" font-weight="${weight}" fill="${fill}">${esc(str)}</text>`,
  );
};
const rule = () => {
  y += 14;
  rows.push(`<line x1="36" y1="${y}" x2="${W - 36}" y2="${y}" stroke="#555" stroke-width="2" stroke-dasharray="6 6"/>`);
  y += 30;
};

text(W / 2, "جمعية السالمية التعاونية", { size: 30, anchor: "middle", weight: "bold" });
y += 36; text(W / 2, "SALMIYA CO-OPERATIVE SOCIETY", { size: 18, font: MONO, anchor: "middle", dir: "ltr" });
y += 34; text(W / 2, "فرع التموين", { size: 24, anchor: "middle" });
rule();
text(W - 36, "التاريخ: 2026/09/03   الوقت: 10:42", { size: 20 });
y += 32; text(W - 36, "البطاقة التموينية: ****4821   الأفراد: 7", { size: 20 });
rule();
text(W - 36, "الصنف", { size: 20, weight: "bold" });
text(150, "الكمية", { size: 20, weight: "bold", anchor: "middle" });
text(60, "المبلغ", { size: 20, weight: "bold", anchor: "middle" });
y += 12; rule();
for (const [label, packs, price] of LINES) {
  text(W - 36, label, { size: 22 });
  text(150, String(packs), { size: 22, font: MONO, anchor: "middle", dir: "ltr" });
  text(60, kd(packs * price), { size: 22, font: MONO, anchor: "middle", dir: "ltr" });
  y += 40;
}
rule();
text(W - 36, "الإجمالي", { size: 26, weight: "bold" });
text(120, `KD ${kd(total)}`, { size: 26, font: MONO, anchor: "middle", dir: "ltr", weight: "bold" });
y += 44; text(W - 36, "الدعم الحكومي: مدفوع", { size: 20, fill: "#444" });
rule();
text(W / 2, "شكراً لتعاملكم معنا", { size: 22, anchor: "middle" });
y += 34; text(W / 2, "الاحتفاظ بالفاتورة عند الاستلام", { size: 18, anchor: "middle", fill: "#444" });
y += 60;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${y}">
  <rect width="100%" height="100%" fill="#f7f4ee"/>
  ${rows.join("\n  ")}
</svg>`;

const out = fileURLToPath(new URL("../public/demo/receipt-sample.jpg", import.meta.url));
await sharp(Buffer.from(svg))
  .rotate(-1.2, { background: "#ddd6c8" })
  .jpeg({ quality: 82 })
  .toFile(out);
console.log(`wrote ${out} (total KD ${kd(total)})`);
