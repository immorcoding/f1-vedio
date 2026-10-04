// The rear wing's main plane and DRS flap (CarSpec.rearWing.planes), drawn in photo space behind the near endplate.
// HIGH (the spec has a far endplate copy): each element spans from its side profile at the near endplate to the same
// profile on the far endplate (the copy's transform), drawn as one slab with a single outline; the camera looking down
// sees it between the endplates. The near endplate is drawn later, over the planes; the far endplate before them.
// LOW (specSeenFrom set `planesLift`): each element's profile is lifted by that much (the planes sit on the centre line,
// further from the camera), so only the part above the near endplate shows: the closed flap's trailing edge as a small
// sliver, and with DRS open the flap's upper surface rising along its whole length. This replaces the generic sliver
// (`top`) for a car with traced planes.
import { INK } from "../kit/colors";
import { pathPoints } from "./seenFrom";
import { pathMin, type CarSpec } from "./spec";

type Pt = { x: number; y: number };

// the flap a shade lighter than the main plane (its colour mixed 15% towards white), so the slot between them reads
const lighter = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  const ch = (shift: number) => {
    const v = (n >> shift) & 255;
    return Math.round(v + (255 - v) * 0.15);
  };
  return `rgb(${ch(16)} ${ch(8)} ${ch(0)})`;
};

const rotate = (p: Pt, c: Pt, deg: number): Pt => {
  const a = (deg * Math.PI) / 180;
  const [dx, dy] = [p.x - c.x, p.y - c.y];
  return {
    x: c.x + dx * Math.cos(a) - dy * Math.sin(a),
    y: c.y + dx * Math.sin(a) + dy * Math.cos(a),
  };
};

const r = (n: number) => Math.round(n * 10) / 10;
const poly = (pts: Pt[]) =>
  `M ${pts.map((p) => `${r(p.x)} ${r(p.y)}`).join(" L ")} Z`;

// The side profile swept from `a` to `b` (the same points moved by the far endplate's copy transform) seen from the
// camera: the convex hull of both ends, one clean slab with a single outline (the profiles are convex).
const hull = (pts: Pt[]) => {
  const p = [...pts].sort((u, v) => u.x - v.x || u.y - v.y);
  const cross = (o: Pt, u: Pt, v: Pt) =>
    (u.x - o.x) * (v.y - o.y) - (u.y - o.y) * (v.x - o.x);
  const half = (list: Pt[]) => {
    const h: Pt[] = [];
    for (const q of list) {
      while (h.length >= 2 && cross(h[h.length - 2], h[h.length - 1], q) <= 0)
        h.pop();
      h.push(q);
    }
    h.pop();
    return h;
  };
  return [...half(p), ...half([...p].reverse())];
};

export const RearWingPlanesView: React.FC<{
  car: CarSpec;
  drs: number;
  id: string;
  fill: string;
}> = ({ car, drs, id, fill }) => {
  const rw = car.rearWing;
  const planes = rw.planes;
  if (!planes) return null;
  const turn = Math.max(0, Math.min(1, drs)) * planes.drsOpen;
  const profile = (d: string, flap: boolean) => {
    const pts = pathPoints(d).flat();
    return flap ? pts.map((p) => rotate(p, planes.pivot, turn)) : pts;
  };
  const elements = [profile(planes.main, false), profile(planes.flap, true)];
  const fills = [fill, lighter(fill)];
  const far = rw.farFrom;
  if (far) {
    const o = pathMin(rw.near);
    const toFar = (p: Pt) => ({
      x: o.x + far.dx + far.scale * (p.x - o.x),
      y: o.y + far.dy + far.scale * (p.y - o.y),
    });
    return (
      <g>
        {elements.map((a, k) => {
          const slab = poly(hull([...a, ...a.map(toFar)]));
          return (
            <g key={k}>
              <path d={slab} fill={fills[k]} />
              <path d={slab} fill={`url(#${id}-dl)`} opacity={0.5} />
              <path
                d={slab}
                fill="none"
                stroke={INK}
                strokeWidth={4}
                strokeLinejoin="round"
              />
            </g>
          );
        })}
      </g>
    );
  }
  const lift = rw.planesLift ?? 0;
  return (
    <g transform={`translate(0 ${-lift})`}>
      {elements.map((a, k) => (
        <path
          key={k}
          d={poly(a)}
          fill={fills[k]}
          stroke={INK}
          strokeWidth={4}
          strokeLinejoin="round"
        />
      ))}
    </g>
  );
};
