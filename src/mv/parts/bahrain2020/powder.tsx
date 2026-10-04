// Dry powder billowing off where an extinguisher's jet lands (shots 3.5 and 3.6): white ink-edged streaks curling up and
// away, redrawn on threes — strokes, never round puffs (user review: no bubble-shaped clouds).
import { INK, PAPER } from "../../../kit/colors";
import { strokeRibbon } from "../../../kit/fire";

export const PowderBillow: React.FC<{
  // where the jet lands, on screen, and px per metre there
  x: number;
  y: number;
  ppm: number;
  frame: number;
}> = ({ x, y, ppm, frame }) => {
  const flick = Math.floor(frame / 3);
  return (
    <g>
      {Array.from({ length: 7 }, (_, i) => {
        const life = ((flick * 0.5 + i * 2.3) % 7) / 7;
        const pts = Array.from({ length: 9 }, (_, k) => {
          const q = k / 8;
          return {
            x:
              x +
              (Math.sin(i * 1.9) * 0.3 - 0.25 * q) * ppm +
              Math.sin(q * 5 + i + flick * 0.4) * 0.12 * ppm,
            y: y - (0.05 + life * 0.4 + q * (0.5 + life * 0.5)) * ppm,
          };
        });
        return (
          <path
            key={i}
            d={strokeRibbon(pts, (0.14 + 0.18 * life) * ppm, 0.4)}
            fill={PAPER}
            stroke={INK}
            strokeWidth={2.5}
            strokeLinejoin="round"
            opacity={0.95 * (1 - life)}
          />
        );
      })}
    </g>
  );
};

// The dry-powder jet from an extinguisher's nozzle to where it lands (shots 3.5 and 3.6): a hard white core and long
// streaks racing down a widening cone every frame, ink-edged — a jet under pressure, not a cloud. `power` 0–1 lets
// it reach out over the first frames.
export const PowderJet: React.FC<{
  from: { x: number; y: number };
  to: { x: number; y: number };
  ppm: number;
  frame: number;
  power?: number;
}> = ({ from, to, ppm, frame, power = 1 }) => {
  const full = Math.hypot(to.x - from.x, to.y - from.y);
  const L = full * power;
  if (L < 2) return null;
  const d = { x: (to.x - from.x) / full, y: (to.y - from.y) / full };
  const n = { x: -d.y, y: d.x };
  const P = (along: number, across: number) => ({
    x: from.x + d.x * along * L + n.x * across,
    y: from.y + d.y * along * L + n.y * across,
  });
  // half-width of the cone at `along` (0 nozzle → 1 target)
  const half = (along: number) =>
    (0.025 + 0.06 * along + 0.24 * along * along) * ppm;
  const core = strokeRibbon(
    Array.from({ length: 10 }, (_, k) => P(k / 9, 0)),
    0.2 * ppm,
    0.85,
  );
  const streaks = Array.from({ length: 22 }, (_, i) => {
    const lane = ((i * 0.618) % 1) * 2 - 1; // where across the cone, −1..1
    const speed = 0.11 + (i % 5) * 0.018;
    const head = (frame * speed + i * 0.37) % 1;
    const tail = Math.max(0, head - 0.3 - (i % 3) * 0.08);
    const wob = Math.sin(frame * 0.8 + i) * 0.08;
    return {
      a: P(tail, half(tail) * (lane + wob)),
      b: P(head, half(head) * (lane + wob)),
      w: Math.max(1.2, (0.01 + 0.025 * head) * ppm),
      op: 1 - head * 0.5,
    };
  });
  return (
    <g strokeLinecap="round">
      {/* the cone's edges, flaring */}
      {[-1, 1].map((side) => (
        <path
          key={side}
          d={`M ${Array.from({ length: 9 }, (_, k) => {
            const u = k / 8;
            const p = P(
              u,
              side *
                half(u) *
                (1 + 0.08 * Math.sin(frame * 1.3 + k * 1.7 + side)),
            );
            return `${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
          }).join(" L ")}`}
          fill="none"
          stroke={INK}
          strokeWidth={2.2}
          opacity={0.6}
        />
      ))}
      <path
        d={core}
        fill={PAPER}
        stroke={INK}
        strokeWidth={2.5}
        strokeLinejoin="round"
      />
      {streaks.map((s, i) => (
        <g key={i} opacity={s.op}>
          <path
            d={`M ${s.a.x} ${s.a.y} L ${s.b.x} ${s.b.y}`}
            stroke={INK}
            strokeWidth={s.w + 3}
          />
          <path
            d={`M ${s.a.x} ${s.a.y} L ${s.b.x} ${s.b.y}`}
            stroke={PAPER}
            strokeWidth={s.w}
          />
        </g>
      ))}
    </g>
  );
};
