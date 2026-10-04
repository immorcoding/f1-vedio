// The trackside at night after turn 3, drawn through a pinhole camera (ART-9): black sky with the floodlights, dark
// asphalt, and the triple guardrail (three W-beam rails on posts) the Haas went into. Black and white only (ART-8).
import type { Camera } from "../../../kit/camera";
import { INK, PAPER } from "../../../kit/colors";
import { tone } from "../../../kit/tone";

// Rails of the triple guardrail: bottom and top edge heights, m (rails.ts, shared with the wreck geometry).
import { POST_TOP, RAILS } from "./rails.ts";
export { POST_TOP, RAILS };

type Ground = { x: number; z: number };

// Point a fraction u of the way from a to b.
const lerp = (a: Ground, b: Ground, u: number): Ground => ({
  x: a.x + (b.x - a.x) * u,
  z: a.z + (b.z - a.z) * u,
});

// Sky, floodlight towers and asphalt. `tonePrefix` names the page's ToneDefs.
export const NightBackdrop: React.FC<{ cam: Camera; tonePrefix: string }> = ({
  cam,
  tonePrefix,
}) => {
  const towers = [-60, -22, 18, 55];
  return (
    <g>
      <rect
        x={-400}
        y={-400}
        width={2720}
        height={cam.horizon + 400}
        fill={INK}
      />
      {/* far grandstand roofline and the floodlight masts with their lamp banks */}
      <rect
        x={-400}
        y={cam.screenY(9, 140)}
        width={2720}
        height={cam.horizon - cam.screenY(9, 140)}
        fill={tone("dark", tonePrefix)}
      />
      {towers.map((x) => {
        const z = 120;
        const top = cam.project({ x, y: 32, z });
        const base = cam.project({ x, y: 0, z });
        const w = cam.pxPerMetre(z) * 0.6;
        return (
          <g key={x}>
            <path
              d={`M ${base.x - w} ${base.y} L ${top.x - w * 0.4} ${top.y} L ${top.x + w * 0.4} ${top.y} L ${base.x + w} ${base.y} Z`}
              fill="#1c1c1c"
            />
            <rect
              x={top.x - w * 3}
              y={top.y - w * 2.2}
              width={w * 6}
              height={w * 2.2}
              fill={PAPER}
              stroke={INK}
              strokeWidth={2}
            />
            {[-2, -1, 0, 1, 2].map((i) => (
              <path
                key={i}
                d={`M ${top.x + i * w * 1.1} ${top.y - w * 2.2} L ${top.x + i * w * 1.1} ${top.y}`}
                stroke={INK}
                strokeWidth={1.5}
              />
            ))}
          </g>
        );
      })}
      <rect
        x={-400}
        y={cam.horizon}
        width={2720}
        height={1480 - cam.horizon}
        fill={tone("dark", tonePrefix)}
      />
    </g>
  );
};

// The triple guardrail from a to b along the ground. `gaps` lists, per rail (bottom, middle, top), the stretches
// (fractions of a→b) where the rail is torn away; the torn ends curl back. Posts every 2 m.
export const Guardrail: React.FC<{
  cam: Camera;
  a: Ground;
  b: Ground;
  gaps?: readonly (readonly [number, number])[][];
  tonePrefix: string;
}> = ({ cam, a, b, gaps = [[], [], []], tonePrefix }) => {
  const len = Math.hypot(b.x - a.x, b.z - a.z);
  const P = (g: Ground, y: number) => cam.project({ x: g.x, y, z: g.z });
  const quad = (u0: number, u1: number, y0: number, y1: number) => {
    const g0 = lerp(a, b, u0);
    const g1 = lerp(a, b, u1);
    const [p0, p1, p2, p3] = [P(g0, y0), P(g1, y0), P(g1, y1), P(g0, y1)];
    return `M ${p0.x} ${p0.y} L ${p1.x} ${p1.y} L ${p2.x} ${p2.y} L ${p3.x} ${p3.y} Z`;
  };
  // posts every 2 m, except where the middle rail is torn out (the posts there were knocked flat)
  const posts = Array.from(
    { length: Math.floor(len / 2) + 1 },
    (_, i) => (i * 2) / len,
  ).filter((u) => !(gaps[1] ?? []).some(([g0, g1]) => u > g0 && u < g1));
  return (
    <g>
      {posts.map((u) => {
        const g = lerp(a, b, u);
        const w = cam.pxPerMetre(g.z) * 0.08;
        const top = P(g, POST_TOP);
        const bot = P(g, 0);
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
        // the intact stretches of this rail
        const cuts = [...(gaps[r] ?? [])].sort((p, q) => p[0] - q[0]);
        const pieces: [number, number][] = [];
        let u = 0;
        for (const [g0, g1] of cuts) {
          if (g0 > u) pieces.push([u, g0]);
          u = Math.max(u, g1);
        }
        if (u < 1) pieces.push([u, 1]);
        const mid = (y0 + y1) / 2;
        return (
          <g key={r}>
            {pieces.map(([u0, u1]) => (
              <g key={u0}>
                <path
                  d={quad(u0, u1, y0, y1)}
                  fill={PAPER}
                  stroke={INK}
                  strokeWidth={3}
                  strokeLinejoin="round"
                />
                <path
                  d={quad(u0, u1, y0, mid)}
                  fill={tone("light", tonePrefix)}
                />
                <path
                  d={`M ${P(lerp(a, b, u0), mid).x} ${P(lerp(a, b, u0), mid).y} L ${P(lerp(a, b, u1), mid).x} ${P(lerp(a, b, u1), mid).y}`}
                  stroke={INK}
                  strokeWidth={2}
                />
              </g>
            ))}
            {/* torn ends: the rail peels back and up in a jagged lip */}
            {cuts.flatMap(([g0, g1]) =>
              [
                { u: g0, dir: 1 },
                { u: g1, dir: -1 },
              ]
                .filter((e) => e.u > 0 && e.u < 1)
                .map((e) => {
                  const g = lerp(a, b, e.u);
                  const tip = lerp(a, b, e.u + (e.dir * 0.3) / len);
                  const p0 = P(g, y0);
                  const p1 = P(g, y1);
                  const q = P({ x: tip.x, z: tip.z + 0.35 }, y1 + 0.12);
                  const q2 = P({ x: tip.x, z: tip.z + 0.3 }, y0 + 0.08);
                  return (
                    <path
                      key={`${e.u}`}
                      d={`M ${p0.x} ${p0.y} L ${p1.x} ${p1.y} L ${q.x} ${q.y} L ${(q.x + q2.x) / 2 + e.dir * 6} ${(q.y + q2.y) / 2} L ${q2.x} ${q2.y} Z`}
                      fill={PAPER}
                      stroke={INK}
                      strokeWidth={3}
                      strokeLinejoin="miter"
                    />
                  );
                }),
            )}
          </g>
        );
      })}
    </g>
  );
};
