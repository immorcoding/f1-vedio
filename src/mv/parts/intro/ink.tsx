// Minimal manga primitives for the intro's black page. Kept local on purpose: the shared
// manga layer (tones, ink, focus lines) arrives with ticket #3 and replaces these.
import { Easing, interpolate } from "remotion";

export const BLACK = "#0d0d0d";
export const WHITE = "#fbfaf6"; // ART-2 paper white, used here as ink on the black page

export const ramp = (
  frame: number,
  start: number,
  end: number,
  easing = Easing.inOut(Easing.cubic),
) =>
  interpolate(frame, [start, end], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing,
  });

/** 45° screentone of white dots on transparent: reads as grey on black (ART-2, inverted). */
export const Tone: React.FC<{
  id: string;
  r: number;
  gap?: number;
  color?: string;
}> = ({ id, r, gap = 7, color = WHITE }) => (
  <pattern
    id={id}
    width={gap}
    height={gap}
    patternUnits="userSpaceOnUse"
    patternTransform="rotate(45)"
  >
    <circle cx={gap / 2} cy={gap / 2} r={r} fill={color} />
  </pattern>
);

// DrawPath, circlePath and arcPath moved to src/kit/lamp.tsx with the gantry lamp (#21).
export { DrawPath, arcPath, circlePath } from "../../../kit/lamp";

/** Focus lines (集中线): thin wedges converging on (cx, cy), clear inside `clear`. `seed` reshuffles them. */
export const focusLines = (
  cx: number,
  cy: number,
  clear: number,
  n: number,
  seed: number,
) => {
  let d = "";
  for (let i = 0; i < n; i++) {
    const h = Math.sin((i + 1) * 12.9898 + seed * 78.233) * 43758.5453;
    const rnd = h - Math.floor(h);
    const a = (i / n) * Math.PI * 2 + rnd * 0.05;
    const inner = clear + rnd * 160;
    const w = 0.003 + rnd * 0.006;
    const far = 2600;
    d += `M ${cx + Math.cos(a) * inner} ${cy + Math.sin(a) * inner} L ${cx + Math.cos(a - w) * far} ${cy + Math.sin(a - w) * far} L ${cx + Math.cos(a + w) * far} ${cy + Math.sin(a + w) * far} Z `;
  }
  return d;
};
