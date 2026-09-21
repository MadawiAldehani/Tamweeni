"use client";

import { useId } from "react";

import { cn } from "@/lib/utils";

type SaduPatternProps = {
  /** "band": a 14px-high horizontal strip. "field": fills its box in both directions. */
  variant?: "band" | "field";
  /** Set the colour with a text-* class (e.g. "text-white/20"); the motif uses currentColor. */
  className?: string;
};

/** Pixel-edged rhombus, like a woven السدو motif. `steps` per edge. */
function steppedDiamond(cx: number, cy: number, rx: number, ry: number, steps: number) {
  const sx = rx / steps;
  const sy = ry / steps;
  const d = [`M${cx} ${cy - ry}`];
  for (let i = 0; i < steps; i += 1) {
    d.push(`H${cx + (i + 1) * sx} V${cy - ry + (i + 1) * sy}`);
  }
  for (let i = 0; i < steps; i += 1) {
    d.push(`V${cy + (i + 1) * sy} H${cx + rx - (i + 1) * sx}`);
  }
  for (let i = 0; i < steps; i += 1) {
    d.push(`H${cx - (i + 1) * sx} V${cy + ry - (i + 1) * sy}`);
  }
  for (let i = 0; i < steps; i += 1) {
    d.push(`V${cy - (i + 1) * sy} H${cx - rx + (i + 1) * sx}`);
  }
  return `${d.join(" ")} Z`;
}

function diamond(cx: number, cy: number, rx: number, ry: number) {
  return `M${cx} ${cy - ry} L${cx + rx} ${cy} L${cx} ${cy + ry} L${cx - rx} ${cy} Z`;
}

/** One tile: stepped diamond ring, inner diamond, and triangles that meet across the seams. */
function Tile({ w, h, steps }: { w: number; h: number; steps: number }) {
  const cx = w / 2;
  const cy = h / 2;
  const rx = w * 0.43;
  const ry = h * 0.43;
  const notch = Math.min(w, h) * 0.18;
  return (
    <g fill="currentColor">
      <path fillRule="evenodd" d={`${steppedDiamond(cx, cy, rx, ry, steps)} ${diamond(cx, cy, rx / 2, ry / 2)}`} />
      <path d={diamond(cx, cy, rx / 5, ry / 5)} />
      <path d={`M0 0 H${notch} L0 ${notch} Z M${w} 0 H${w - notch} L${w} ${notch} Z`} />
      <path d={`M0 ${h} H${notch} L0 ${h - notch} Z M${w} ${h} H${w - notch} L${w} ${h - notch} Z`} />
    </g>
  );
}

/**
 * Sadu-inspired repeating motif in currentColor. Decorative only.
 * Band: 100% × 14px, tile 28×14 repeating horizontally. Field: fills its box, tile 40×40.
 */
export function SaduPattern({ variant = "field", className }: SaduPatternProps) {
  const id = `sadu-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const band = variant === "band";
  const tile = band ? { w: 28, h: 14, steps: 3 } : { w: 40, h: 40, steps: 4 };

  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width="100%"
      height={band ? 14 : "100%"}
      preserveAspectRatio="none"
      className={cn("pointer-events-none", band ? "block" : "absolute inset-0", className)}
    >
      <defs>
        <pattern id={id} width={tile.w} height={tile.h} patternUnits="userSpaceOnUse">
          <Tile {...tile} />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}
