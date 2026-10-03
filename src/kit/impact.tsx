// Impact star (撞击星): the manga burst drawn where two things hit — an irregular many-pointed star in paper with a
// heavy ink outline, a smaller ink star inside it and a ring of short ink spikes beyond. Deterministic per seed.
// Used at the moment of a crash (treatment 1.4, 1.7, 3.3).
import { random } from "remotion";
import { INK, PAPER } from "./colors";

// Outline of an irregular star: `n` points between radius r (tips) and r * inner (valleys), jittered by seed.
export const starPath = (
  cx: number,
  cy: number,
  r: number,
  n: number,
  seed: string,
  inner = 0.55,
  rotation = 0,
) => {
  const pts: string[] = [];
  for (let i = 0; i < n * 2; i++) {
    const tip = i % 2 === 0;
    const jitter = random(`${seed}-${i}`);
    const a =
      ((i + (jitter - 0.5) * 0.5) / (n * 2)) * Math.PI * 2 +
      (rotation * Math.PI) / 180;
    const rr = tip
      ? r * (0.72 + 0.28 * jitter)
      : r * inner * (0.85 + 0.3 * jitter);
    pts.push(
      `${(cx + Math.cos(a) * rr).toFixed(1)} ${(cy + Math.sin(a) * rr).toFixed(1)}`,
    );
  }
  return `M ${pts.join(" L ")} Z`;
};

export const ImpactStar: React.FC<{
  x: number;
  y: number;
  // Outer radius in px.
  r: number;
  seed: string;
  // 0–1: grows the star in over the first part and fades the outer spikes (drive it from the frame).
  t?: number;
  rotation?: number;
  points?: number;
}> = ({ x, y, r, seed, t = 1, rotation = 0, points = 14 }) => {
  const grow = Math.min(1, t * 1.6);
  const R = r * (0.35 + 0.65 * grow);
  const spikes = Array.from({ length: 22 }, (_, i) => {
    const a = (i / 22) * Math.PI * 2 + random(`${seed}-sp-${i}`) * 0.2;
    const r0 = R * 1.08;
    const r1 = R * (1.25 + 0.35 * random(`${seed}-sl-${i}`));
    return `M ${x + Math.cos(a) * r0} ${y + Math.sin(a) * r0} L ${x + Math.cos(a) * r1} ${y + Math.sin(a) * r1}`;
  }).join(" ");
  return (
    <g>
      <path
        d={spikes}
        stroke={INK}
        strokeWidth={Math.max(3, r * 0.025)}
        strokeLinecap="round"
        opacity={Math.max(0, 1 - Math.max(0, t - 0.4) * 1.6)}
      />
      <path
        d={starPath(x, y, R, points, seed, 0.55, rotation)}
        fill={PAPER}
        stroke={INK}
        strokeWidth={Math.max(5, r * 0.04)}
        strokeLinejoin="miter"
      />
      <path
        d={starPath(
          x,
          y,
          R * 0.5,
          Math.round(points * 0.7),
          `${seed}-in`,
          0.45,
          rotation + 9,
        )}
        fill={INK}
      />
    </g>
  );
};
