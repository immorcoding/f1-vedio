// Manga rain and spray (ART-2, ART-8), driven by time so every frame is deterministic.
// - Rain: slanted streaks falling across a box, in ink on paper or in paper on dark tone; `t` in seconds.
// - Spray: the mist a car's tyres throw up on a wet track — a growing, scalloped cloud trailing behind the wheels,
//   inked like the tyre smoke of the settled T5 panel, with dot shading in its lower half and droplets.
// - Splash rings for drops landing on a wet surface.
import { random } from "remotion";
import { INK, PAPER } from "./colors";

export type RainProps = {
  x?: number;
  y?: number;
  w?: number;
  h?: number;
  t: number;
  // streak count over the box
  n?: number;
  // slant of the fall, degrees from vertical (positive = falling to the left, as for a camera tracking right)
  slant?: number;
  // fall speed, px per second, and streak length, px
  speed?: number;
  length?: number;
  color?: string;
  width?: number;
  opacity?: number;
  seed?: string;
};

export const Rain: React.FC<RainProps> = ({
  x = 0,
  y = 0,
  w = 1920,
  h = 1080,
  t,
  n = 220,
  slant = 14,
  speed = 2600,
  length = 70,
  color = INK,
  width = 2.2,
  opacity = 0.75,
  seed = "rain",
}) => {
  const a = (slant * Math.PI) / 180;
  const dx = -Math.sin(a);
  const dy = Math.cos(a);
  // the field is a wrapping strip taller than the box, so streaks enter and leave smoothly
  const span = h + length + w * Math.tan(a);
  let d = "";
  for (let i = 0; i < n; i++) {
    const r = (k: string) => random(`${seed}-${i}-${k}`);
    const len = length * (0.55 + 0.9 * r("l"));
    const v = speed * (0.8 + 0.4 * r("v"));
    const s = (((r("p") * span + v * t) % span) + span) % span;
    const x0 = x + r("x") * (w + span * Math.tan(a)) + dx * s;
    const y0 = y - length + dy * s;
    d += `M ${x0.toFixed(1)} ${y0.toFixed(1)} L ${(x0 + dx * len).toFixed(1)} ${(y0 + dy * len).toFixed(1)} `;
  }
  return (
    <path
      d={d}
      stroke={color}
      strokeWidth={width}
      strokeLinecap="round"
      opacity={opacity}
    />
  );
};

// Spray behind a wheel: (x, y) is the tyre's contact patch on screen, `m` px per metre there; the cloud streams back
// (to -x) `length` metres, rising to `height` metres. `t` animates the billows; `strength` 0–1 fades it.
export const Spray: React.FC<{
  x: number;
  y: number;
  m: number;
  t: number;
  length?: number;
  height?: number;
  strength?: number;
  seed?: string;
  // tone pattern prefix for the shading dots
  tonePrefix?: string;
}> = ({
  x,
  y,
  m,
  t,
  length = 7,
  height = 1.4,
  strength = 1,
  seed = "spray",
  tonePrefix = "tone",
}) => {
  if (strength <= 0) return null;
  const n = 11;
  const puffs = Array.from({ length: n }, (_, i) => {
    const u = i / (n - 1);
    // puffs drift back along the cloud and loop, so the spray churns
    const phase = (u + t * 1.6 + random(`${seed}-ph-${i}`) * 0.1) % 1;
    const px = x - phase * length * m;
    const r = (0.25 + phase * height * 0.75) * m * strength;
    const py = y - r * 0.8 - phase * height * 0.35 * m;
    return { px, py, r, phase, i };
  }).sort((a, b) => b.phase - a.phase);
  const drops = Array.from({ length: 26 }, (_, i) => {
    const q = (random(`${seed}-d-${i}`) + t * 2.3) % 1;
    const dx = -q * length * 0.8 * m;
    const dy = -(Math.sin(q * Math.PI) * height * 0.9 + 0.1) * m;
    return {
      cx: x + dx,
      cy: y + dy,
      r: (2 + 3 * random(`${seed}-dr-${i}`)) * strength,
    };
  });
  return (
    <g opacity={Math.min(1, strength * 1.2)}>
      {puffs.map((p) => (
        <g key={p.i} opacity={1 - 0.75 * p.phase}>
          <circle
            cx={p.px}
            cy={p.py}
            r={p.r}
            fill={PAPER}
            stroke={INK}
            strokeWidth={2.4}
          />
          <path
            d={`M ${p.px - p.r * 0.9} ${p.py + p.r * 0.25} A ${p.r} ${p.r} 0 0 0 ${p.px + p.r * 0.9} ${p.py + p.r * 0.25} Z`}
            fill={`url(#${tonePrefix}-light)`}
            opacity={0.8}
          />
        </g>
      ))}
      {drops.map((d, i) => (
        <circle key={i} cx={d.cx} cy={d.cy} r={d.r} fill={INK} />
      ))}
    </g>
  );
};

// Splash rings of drops landing on a wet surface: (x0..x1, y0..y1) a screen band, flattened ellipses that open and fade.
export const Splashes: React.FC<{
  x0: number;
  x1: number;
  y0: number;
  y1: number;
  t: number;
  n?: number;
  color?: string;
  seed?: string;
}> = ({ x0, x1, y0, y1, t, n = 40, color = INK, seed = "splash" }) => (
  <g>
    {Array.from({ length: n }, (_, i) => {
      const r = (k: string) => random(`${seed}-${i}-${k}`);
      const life = (t * 2.2 + r("p")) % 1;
      const cy = y0 + r("y") * (y1 - y0);
      const scale = 0.4 + (cy - y0) / Math.max(1, y1 - y0);
      return (
        <ellipse
          key={i}
          cx={x0 + r("x") * (x1 - x0)}
          cy={cy}
          rx={(4 + 16 * life) * scale}
          ry={(1.2 + 4 * life) * scale}
          fill="none"
          stroke={color}
          strokeWidth={1.6}
          opacity={0.8 * (1 - life)}
        />
      );
    })}
  </g>
);
