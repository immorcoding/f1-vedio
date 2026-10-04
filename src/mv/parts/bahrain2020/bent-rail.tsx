// The triple guardrail as it gives way (facts.md / FIA summary: the middle rail failed, the upper and lower rails
// deformed heavily, and the survival cell pierced the barrier). Same rails as night.tsx's Guardrail, but every rail is a
// strip of short segments, each pushed by a deflection field (metres along the run → world offset), so the rails can bend
// round the car, the top rail can be prised up over the halo and the bottom one pressed down. Torn stretches curl back
// in jagged lips; posts in the bent zone are knocked flat.
import type { Camera } from "../../../kit/camera";
import { INK, PAPER } from "../../../kit/colors";
import { tone } from "../../../kit/tone";
import { POST_TOP, RAILS } from "./night";

type Ground = { x: number; z: number };
export type Offset = { dx: number; dy: number; dz: number };
// World offset of rail r (0 bottom, 1 middle, 2 top) at s metres along the run from a.
export type Deflection = (s: number, rail: number) => Offset;

const NONE: Deflection = () => ({ dx: 0, dy: 0, dz: 0 });

// A smooth bump: 1 at s = c, falling off over `width` metres either side.
export const bump = (s: number, c: number, width: number) =>
  Math.exp(-(((s - c) / width) ** 2));

export const BentGuardrail: React.FC<{
  cam: Camera;
  a: Ground;
  b: Ground;
  deflect?: Deflection;
  // per rail, the stretches (fractions of a→b) that are torn away
  gaps?: readonly (readonly [number, number])[][];
  // draw only this part of the run (fractions), to layer the near and far stretches round a car
  from?: number;
  to?: number;
  tonePrefix: string;
}> = ({
  cam,
  a,
  b,
  deflect = NONE,
  gaps = [[], [], []],
  from = 0,
  to = 1,
  tonePrefix,
}) => {
  const len = Math.hypot(b.x - a.x, b.z - a.z);
  const at = (u: number, rail: number, y: number) => {
    const o = deflect(u * len, rail);
    return cam.project({
      x: a.x + (b.x - a.x) * u + o.dx,
      y: y + o.dy,
      z: a.z + (b.z - a.z) * u + o.dz,
    });
  };
  const f = (p: { x: number; y: number }) =>
    `${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
  const samples = (u0: number, u1: number) => {
    const n = Math.max(2, Math.ceil(((u1 - u0) * len) / 0.2) + 1);
    return Array.from({ length: n }, (_, i) => u0 + ((u1 - u0) * i) / (n - 1));
  };
  // a strip of rail r between heights y0 and y1, over u0..u1
  const strip = (r: number, u0: number, u1: number, y0: number, y1: number) => {
    const us = samples(u0, u1);
    const top = us.map((u) => f(at(u, r, y1)));
    const bot = us.map((u) => f(at(u, r, y0))).reverse();
    return `M ${top.join(" L ")} L ${bot.join(" L ")} Z`;
  };
  const line = (r: number, u0: number, u1: number, y: number) =>
    `M ${samples(u0, u1)
      .map((u) => f(at(u, r, y)))
      .join(" L ")}`;
  const bent = (u: number) => {
    const o = deflect(u * len, 1);
    return Math.hypot(o.dx, o.dy, o.dz) > 0.25;
  };
  const posts = Array.from(
    { length: Math.floor(len / 2) + 1 },
    (_, i) => (i * 2) / len,
  ).filter(
    (u) =>
      u >= from &&
      u <= to &&
      !bent(u) &&
      !(gaps[1] ?? []).some(([g0, g1]) => u > g0 && u < g1),
  );
  return (
    <g>
      {posts.map((u) => {
        const g = { x: a.x + (b.x - a.x) * u, z: a.z + (b.z - a.z) * u };
        const w = cam.pxPerMetre(g.z) * 0.08;
        const top = cam.project({ x: g.x, y: POST_TOP, z: g.z });
        const bot = cam.project({ x: g.x, y: 0, z: g.z });
        return (
          <rect
            key={u}
            x={top.x - w}
            y={top.y}
            width={2 * w}
            height={bot.y - top.y}
            fill="#1a1a1a"
            stroke={INK}
            strokeWidth={1.5}
          />
        );
      })}
      {RAILS.map(([y0, y1], r) => {
        const cuts = [...(gaps[r] ?? [])].sort((p, q) => p[0] - q[0]);
        const pieces: [number, number][] = [];
        let u = from;
        for (const [g0, g1] of cuts) {
          if (g0 > u) pieces.push([u, Math.min(g0, to)]);
          u = Math.max(u, g1);
        }
        if (u < to) pieces.push([u, to]);
        const mid = (y0 + y1) / 2;
        const lips = cuts
          .flatMap(([g0, g1]) => [
            { u: g0, dir: 1 },
            { u: g1, dir: -1 },
          ])
          .filter((e) => e.u > Math.max(0, from) && e.u < Math.min(1, to));
        return (
          <g key={r}>
            {pieces
              .filter(([u0, u1]) => u1 > u0)
              .map(([u0, u1]) => (
                <g key={u0}>
                  <path
                    d={strip(r, u0, u1, y0, y1)}
                    fill={PAPER}
                    stroke={INK}
                    strokeWidth={3}
                    strokeLinejoin="round"
                  />
                  <path
                    d={strip(r, u0, u1, y0, mid)}
                    fill={tone("light", tonePrefix)}
                  />
                  <path
                    d={line(r, u0, u1, mid)}
                    fill="none"
                    stroke={INK}
                    strokeWidth={2}
                  />
                </g>
              ))}
            {/* torn ends: the rail peels back toward the track and up in a jagged lip */}
            {lips.map((e) => {
              const o = deflect(e.u * len, r);
              const g = {
                x: a.x + (b.x - a.x) * e.u + o.dx,
                z: a.z + (b.z - a.z) * e.u + o.dz,
              };
              const back = e.dir * 0.45;
              const P = (dx: number, y: number, dz: number) =>
                cam.project({
                  x: g.x + ((b.x - a.x) / len) * dx,
                  y: y + o.dy,
                  z: g.z + ((b.z - a.z) / len) * dx + dz,
                });
              const p0 = P(0, y0, 0);
              const p1 = P(0, y1, 0);
              const q = P(back, y1 + 0.2, -0.35);
              const q1 = P(back * 0.6, (y0 + y1) / 2 + 0.05, -0.2);
              const q2 = P(back * 0.8, y0 + 0.1, -0.3);
              return (
                <path
                  key={`${e.u}`}
                  d={`M ${f(p0)} L ${f(p1)} L ${f(q)} L ${q1.x + e.dir * 8} ${q1.y} L ${f(q2)} Z`}
                  fill={PAPER}
                  stroke={INK}
                  strokeWidth={3}
                  strokeLinejoin="miter"
                />
              );
            })}
          </g>
        );
      })}
    </g>
  );
};
