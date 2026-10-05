// Sparks off metal scraping metal (a car along a guardrail): a few thin streaks at a time fanning out from the contact
// point, a small starburst on the contact point itself, and tiny dashes bouncing off where a streak hits the ground.
// Physical in the shot's own 3-D world (x, z on the ground, y up, metres; time in frames, slowed with the picture):
// each spark is thrown mainly along `along` (the way the car slides), glancing off `away` and up, falls in an arc under
// gravity and dies within a few frames. Drawn in screen pixels of fixed size (like the fire, ART-21), in the fire's
// colours (the ART-8 colour exception): a white-hot core inside a yellow-to-orange edge, tapered at both ends.
// Deterministic: every spark is seeded by its birth number, so any frame renders on its own.
//
// The scene supplies the physics in its world and the camera; it can split the result by depth (`depth` of each
// piece) to layer the sparks round a car. Used by shot 3.3 (src/mv/parts/bahrain2020/Impact.tsx).
import { random } from "remotion";
import { starPath } from "./impact";
import type { FirePalette } from "./fire";

export type Vec3 = { x: number; y: number; z: number };

export type SparkSpec = {
  seed: string;
  // frames since the first touch; sparks are born from 0 until `until`
  t: number;
  until: number;
  // the contact point at frame t (it moves along the barrier as the car slides)
  contact: (t: number) => Vec3;
  // unit directions in the world: the way the sparks are thrown (the slide along the barrier), and off the surface
  along: Vec3;
  away: Vec3;
  // m per frame, and m per frame² (both in the shot's time)
  speed: readonly [number, number];
  gravity: number;
  // how many streaks are alive at a time, and how long each lives (frames)
  live: number;
  life: readonly [number, number];
  // extra streaks born on the first frame (the first touch)
  burst?: number;
  project: (p: Vec3) => { x: number; y: number };
};

export type SparkStreak = {
  kind: "streak";
  head: { x: number; y: number };
  tail: { x: number; y: number };
  w: number;
  depth: number; // the world z of the head (the camera looks along +z)
  heat: number; // 1 new … 0 dying
};
export type SparkDash = {
  kind: "dash";
  a: { x: number; y: number };
  b: { x: number; y: number };
  depth: number;
  heat: number;
};
export type SparkStar = {
  kind: "star";
  at: { x: number; y: number };
  r: number;
  depth: number;
  seed: string;
};
export type SparkPiece = SparkStreak | SparkDash | SparkStar;

const add = (a: Vec3, b: Vec3, k: number): Vec3 => ({
  x: a.x + b.x * k,
  y: a.y + b.y * k,
  z: a.z + b.z * k,
});
const lerp = (r: readonly [number, number], u: number) =>
  r[0] + (r[1] - r[0]) * u;
const TAIL = 2.2; // frames of flight the streak trails behind its head
const MAX_TAIL = 110; // px
const BOUNCE = 3; // frames a bounce dash lives
const STAR_UNTIL = 6; // frames the starburst keeps flaring after the last spark is born

export const sparksAt = (s: SparkSpec): SparkPiece[] => {
  const out: SparkPiece[] = [];
  const meanLife = (s.life[0] + s.life[1]) / 2;
  const every = meanLife / s.live; // frames between births
  const births = Math.floor(s.until / every) + 1;
  const burst = s.burst ?? 0;
  for (let k = -burst; k < births; k++) {
    const born = k < 0 ? 0 : k * every;
    const age = s.t - born;
    const r = (n: string) => random(`${s.seed}-${k}-${n}`);
    const life = lerp(s.life, r("life"));
    if (age < 0 || age > life + BOUNCE) continue;
    const o = s.contact(born);
    // the fan: mostly along the slide, glancing off the surface up to ~30°, up a little or none
    const v = lerp(s.speed, r("v")) * (k < 0 ? 1.15 : 1);
    const off = 0.08 + 0.5 * r("off");
    const up = -0.05 + 0.35 * r("up");
    const n = Math.hypot(1, off, up);
    const vel = {
      x: (s.along.x + s.away.x * off) / n,
      y: (s.along.y + s.away.y * off) / n + up / n,
      z: (s.along.z + s.away.z * off) / n,
    };
    const pos = (a: number) => {
      const p = add(o, vel, v * a);
      return { ...p, y: p.y - 0.5 * s.gravity * a * a };
    };
    // when it reaches the ground
    const vy = vel.y * v;
    const ground = (vy + Math.sqrt(vy * vy + 2 * s.gravity * o.y)) / s.gravity;
    const end = Math.min(life, ground);
    if (age <= end) {
      const head = pos(age);
      const h = s.project(head);
      const t0 = s.project(pos(Math.max(0, age - TAIL)));
      // a short tail: never longer than MAX_TAIL px on screen (a spark flying at the camera would smear across it)
      const len = Math.hypot(h.x - t0.x, h.y - t0.y);
      const k = len > MAX_TAIL ? MAX_TAIL / len : 1;
      out.push({
        kind: "streak",
        head: h,
        tail: { x: h.x + (t0.x - h.x) * k, y: h.y + (t0.y - h.y) * k },
        w: 4.5 + 3 * r("w"),
        depth: head.z,
        heat: 1 - age / life,
      });
    } else if (ground < life && age - ground <= BOUNCE) {
      // it hits the ground: a few tiny dashes kick off it, on along the slide and up, and go out
      const hit = { ...pos(ground), y: 0 };
      const da = age - ground;
      const count = 2 + Math.floor(r("nd") * 2);
      for (let j = 0; j < count; j++) {
        const rj = (m: string) => random(`${s.seed}-${k}-d${j}-${m}`);
        const spread = (rj("s") - 0.5) * 0.9;
        const dv = 0.35 * v * (0.6 + 0.6 * rj("v"));
        const dir = {
          x: vel.x + s.away.x * spread,
          y: 0,
          z: vel.z + s.away.z * spread,
        };
        const lift = 0.06 + 0.08 * rj("u");
        const at = (a: number) => ({
          ...add(hit, dir, dv * a),
          y: Math.max(0, lift * a - 0.5 * s.gravity * a * a),
        });
        const a = at(Math.max(0, da - 0.8));
        const b = at(da);
        out.push({
          kind: "dash",
          a: s.project(a),
          b: s.project(b),
          depth: b.z,
          heat: 1 - da / BOUNCE,
        });
      }
    }
  }
  // the starburst on the contact point, flickering frame to frame while the sparks fly
  if (s.t <= s.until + STAR_UNTIL) {
    const c = s.contact(Math.min(s.t, s.until));
    const fade = s.t <= s.until ? 1 : 1 - (s.t - s.until) / STAR_UNTIL;
    const f = Math.floor(s.t);
    out.push({
      kind: "star",
      at: s.project(c),
      r: (34 + 18 * random(`${s.seed}-star-${f}`)) * (0.4 + 0.6 * fade),
      depth: c.z,
      seed: `${s.seed}-star-${f}`,
    });
  }
  return out;
};

// One piece, tapered at both ends: a lens from tail to head, widest two thirds of the way to the head.
const lens = (
  a: { x: number; y: number },
  b: { x: number; y: number },
  w: number,
) => {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const nx = (-dy / len) * (w / 2);
  const ny = (dx / len) * (w / 2);
  const m = { x: a.x + dx * 0.66, y: a.y + dy * 0.66 };
  return `M ${a.x.toFixed(1)} ${a.y.toFixed(1)} Q ${(m.x + nx).toFixed(1)} ${(m.y + ny).toFixed(1)} ${b.x.toFixed(1)} ${b.y.toFixed(1)} Q ${(m.x - nx).toFixed(1)} ${(m.y - ny).toFixed(1)} ${a.x.toFixed(1)} ${a.y.toFixed(1)} Z`;
};

export const Sparks: React.FC<{
  pieces: SparkPiece[];
  palette: FirePalette;
}> = ({ pieces, palette }) => (
  <>
    {pieces.map((p, i) => {
      if (p.kind === "star")
        return (
          <g key={i}>
            <path
              d={starPath(p.at.x, p.at.y, p.r, 9, p.seed, 0.42)}
              fill={palette.yellow}
              opacity={0.9}
            />
            <path
              d={starPath(p.at.x, p.at.y, p.r * 0.62, 7, `${p.seed}-c`, 0.45)}
              fill={palette.core}
            />
          </g>
        );
      if (p.kind === "dash")
        return (
          <path
            key={i}
            d={`M ${p.a.x.toFixed(1)} ${p.a.y.toFixed(1)} L ${p.b.x.toFixed(1)} ${p.b.y.toFixed(1)}`}
            stroke={palette.yellow}
            strokeWidth={2.4}
            strokeLinecap="round"
            opacity={0.5 + 0.5 * p.heat}
          />
        );
      // a streak: orange edge, yellow, white-hot core; it cools from the tail (the edge shows more as it dies)
      return (
        <g key={i} opacity={Math.min(1, 0.35 + p.heat * 1.2)}>
          <path d={lens(p.tail, p.head, p.w * 2.4)} fill={palette.red} />
          <path d={lens(p.tail, p.head, p.w * 1.9)} fill={palette.orange} />
          <path d={lens(p.tail, p.head, p.w * 1.25)} fill={palette.yellow} />
          <path
            d={lens(
              {
                x: p.tail.x + (p.head.x - p.tail.x) * 0.3,
                y: p.tail.y + (p.head.y - p.tail.y) * 0.3,
              },
              p.head,
              p.w * 0.6,
            )}
            fill={palette.core}
          />
        </g>
      );
    })}
  </>
);
