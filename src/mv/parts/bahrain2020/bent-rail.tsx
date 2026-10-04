// The triple guardrail as it gives way (facts.md / FIA summary: the middle rail failed, the upper and lower rails
// deformed heavily, and the survival cell pierced the barrier). Same rails as night.tsx's Guardrail, but every rail is a
// strip of short segments, each pushed by a deflection field (metres along the run → world offset), so the rails can bend
// round the car and the bottom one can be pressed down; where a rail is torn (`gaps`) its ends finish in jagged steel
// curled back and twisted to show their dark back face (the curl itself is in the deflection field); posts in the bent
// zone are knocked flat.
import type { Camera } from "../../../kit/camera";
import { INK, PAPER } from "../../../kit/colors";
import { random } from "remotion";
import { tone } from "../../../kit/tone";
import { POST_TOP, RAILS } from "./night";

type Ground = { x: number; z: number };
export type Offset = { dx: number; dy: number; dz: number };
// World offset of rail r (0 bottom, 1 middle, 2 top) at s metres along the run from a.
export type Deflection = (s: number, rail: number) => Offset;

const NONE: Deflection = () => ({ dx: 0, dy: 0, dz: 0 });
// the steel's back face where a torn end twists round: a flat mid grey, set apart from the dot-screened night and ground
const BACK_FACE = "#9d988f";

// A smooth bump: 1 at s = c, falling off over `width` metres either side (pure, in wreck-geometry.ts).
export { bump } from "./wreck-geometry.ts";

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
  // draw only these rails (0 bottom, 1 middle, 2 top) and the posts or not, to layer the rails round a car in the gap
  rails?: readonly number[];
  posts?: boolean;
  tonePrefix: string;
}> = ({
  cam,
  a,
  b,
  deflect = NONE,
  gaps = [[], [], []],
  from = 0,
  to = 1,
  rails = [0, 1, 2],
  posts: withPosts = true,
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
      withPosts &&
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
        if (!rails.includes(r)) return null;
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
            {/* torn ends (ART-11; user review 2026-10-04: clean and readable, no stray strokes or fragments): the
                beam's last 0.2 m, curled back with the rest of the stub, is twisted round to show the steel's dark
                back face (flat grey); one fold line where it turns, and one bold jagged edge with three sharp teeth. No hanging
                strips. */}
            {lips.map((e) => {
              // keyed by rail and side, not by where the end is: the teeth keep their shape while the tear opens (3.3)
              const R = (k: string) => random(`tear-${r}-${e.dir}-${k}`) - 0.5;
              const h = y1 - y0;
              // the last FOLD metres of the beam, following its own bend (the curl in the deflection field): the steel
              // twisted round there, so it shows its darker back face
              const FOLD = 0.2;
              const uf = e.u - (e.dir * FOLD) / len;
              const along = samples(Math.min(uf, e.u), Math.max(uf, e.u));
              const fromFold = e.dir > 0 ? along : [...along].reverse();
              const topEdge = fromFold.map((u) => at(u, r, y1));
              const botEdge = [...fromFold].reverse().map((u) => at(u, r, y0));
              // one bold jagged edge with three sharp teeth, in line with the beam past its end
              const tip = (dx: number, k: number) =>
                at(e.u + (e.dir * dx) / len, r, y0 + h * k);
              const teeth = [
                tip(0.03, 1),
                tip(0.13 + 0.03 * R("a"), 0.8),
                tip(0.01, 0.62 + 0.05 * R("b")),
                tip(0.16 + 0.03 * R("c"), 0.43),
                tip(0.02, 0.25 + 0.05 * R("d")),
                tip(0.1 + 0.02 * R("e"), 0.1),
                tip(0, 0),
              ];
              const pts = (ps: { x: number; y: number }[]) =>
                ps.map((p) => `L ${f(p)}`).join(" ");
              const outline = `M ${f(topEdge[0])} ${pts(topEdge.slice(1))} ${pts(teeth)} ${pts(botEdge)}`;
              return (
                <g key={`${r}${e.dir}`}>
                  {/* the twisted end, its back face in flat grey; only the outer edge is inked, plus the fold */}
                  <path d={`${outline} Z`} fill={BACK_FACE} />
                  <path
                    d={outline}
                    fill="none"
                    stroke={INK}
                    strokeWidth={3.5}
                    strokeLinejoin="miter"
                  />
                  <path
                    d={`M ${f(topEdge[0])} L ${f(botEdge[botEdge.length - 1])}`}
                    stroke={INK}
                    strokeWidth={2.5}
                  />
                </g>
              );
            })}
          </g>
        );
      })}
    </g>
  );
};
