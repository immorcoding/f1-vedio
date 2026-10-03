// Manga motion lines, as fill paths (fill them with INK). Both are deterministic: same arguments, same lines.
import { random } from "remotion";

// Focus lines (集中线): thin wedges converging on (cx, cy), leaving a clear zone of radius about `clear` around it.
// `n` is the number of wedges; `seed` varies the pattern between panels.
export const focusLines = (
  cx: number,
  cy: number,
  clear: number,
  n: number,
  seed: number,
) => {
  let d = "";
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + ((i * seed) % 7) * 0.004;
    const inner = clear + ((i * 37) % 140);
    const width = 0.004 + ((i * 13) % 5) * 0.0025;
    const far = 2400;
    d += `M ${cx + Math.cos(a) * inner} ${cy + Math.sin(a) * inner} L ${cx + Math.cos(a - width) * far} ${cy + Math.sin(a - width) * far} L ${cx + Math.cos(a + width) * far} ${cy + Math.sin(a + width) * far} Z `;
  }
  return d;
};

export type SpeedLineOptions = {
  // The band the lines fill: a rectangle, rotated so its long side runs along `angle` (degrees, 0 = pointing right).
  x: number;
  y: number;
  w: number;
  h: number;
  angle?: number;
  n: number;
  seed: string | number;
  // Thickness of a streak at its thick end, in px; each streak gets 30–100 % of it.
  thickness?: number;
  // Streak length as a share of the band length (min, max).
  length?: [number, number];
};

// Speed lines (速度线): parallel streaks that taper to a point at their tail, scattered across a band.
// The thick end points along `angle`, so a car moving right gets angle 0 and streaks trailing behind it.
export const speedLines = ({
  x,
  y,
  w,
  h,
  angle = 0,
  n,
  seed,
  thickness = 6,
  length = [0.25, 0.7],
}: SpeedLineOptions) => {
  const a = (angle * Math.PI) / 180;
  const ux = Math.cos(a);
  const uy = Math.sin(a);
  // Band-local (u along, v across) → screen, rotating about the band's centre.
  const cx = x + w / 2;
  const cy = y + h / 2;
  const at = (u: number, v: number) =>
    `${cx + (u - w / 2) * ux - (v - h / 2) * uy} ${cy + (u - w / 2) * uy + (v - h / 2) * ux}`;
  let d = "";
  for (let i = 0; i < n; i++) {
    const r = (k: string) => random(`${seed}-${i}-${k}`);
    const len = w * (length[0] + (length[1] - length[0]) * r("len"));
    const head = len + (w - len) * r("pos");
    const v = h * r("v");
    const t = (thickness * (0.3 + 0.7 * r("t"))) / 2;
    d += `M ${at(head - len, v)} L ${at(head, v - t)} L ${at(head, v + t)} Z `;
  }
  return d;
};
