// Generates every PWA icon from one geometric SVG mark (no fonts, no external assets).
// Run with: npm run icons
import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const GREEN = "#1F6F4A";
const SAND = "#E8D9BF";
const WHITE = "#FFFFFF";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// The ration-card mark. Coordinates live in a 512x512 box so the in-app logo can reuse them.
const artwork = `
  <rect x="112" y="160" width="288" height="192" rx="28" fill="${WHITE}" />
  <rect x="152" y="208" width="140" height="20" rx="10" fill="${SAND}" />
  <rect x="152" y="248" width="208" height="20" rx="10" fill="${SAND}" />
  <rect x="152" y="288" width="96" height="20" rx="10" fill="${SAND}" />
  <circle cx="352" cy="296" r="36" fill="${GREEN}" />
  <polyline points="334,296 347,309 371,283" fill="none" stroke="${WHITE}"
    stroke-width="12" stroke-linecap="round" stroke-linejoin="round" />
`;

/**
 * Builds the full icon SVG.
 * @param {{ rounded: boolean; scale: number }} options
 *   rounded: rounded-square background (false = full-bleed square for iOS / maskable)
 *   scale:   shrink the artwork towards the centre (0.8 keeps it inside the maskable safe zone)
 */
function iconSvg({ rounded, scale }) {
  const radius = rounded ? 112 : 0;
  const offset = (512 - 512 * scale) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <rect width="512" height="512" rx="${radius}" fill="${GREEN}" />
  <g transform="translate(${offset} ${offset}) scale(${scale})">${artwork}</g>
</svg>`;
}

const targets = [
  { file: "public/icons/icon-192.png", size: 192, rounded: true, scale: 1 },
  { file: "public/icons/icon-512.png", size: 512, rounded: true, scale: 1 },
  { file: "public/icons/maskable-512.png", size: 512, rounded: false, scale: 0.8 },
  { file: "public/icons/apple-touch-icon.png", size: 180, rounded: false, scale: 1 },
  { file: "app/icon.png", size: 64, rounded: true, scale: 1 },
];

for (const { file, size, rounded, scale } of targets) {
  const out = path.join(root, file);
  await mkdir(path.dirname(out), { recursive: true });
  await sharp(Buffer.from(iconSvg({ rounded, scale })))
    .resize(size, size)
    .png()
    .toFile(out);
  console.log(`wrote ${file} (${size}x${size})`);
}
