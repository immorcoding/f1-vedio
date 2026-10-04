// The rear wing's main plane and DRS flap (CarSpec.rearWing.planes), drawn in photo space behind the near endplate.
// HIGH (the spec has a far endplate copy): each element is swept from its side profile at the near endplate to the same
// profile on the far endplate (the copy's transform), so the camera looking down sees it span between the endplates.
// LOW (specSeenFrom set `planesLift`): each element's profile is lifted by that much (the planes sit on the centre line,
// further from the camera), so only the part above the near endplate shows: the closed flap's trailing edge as a small
// sliver, and with DRS open the flap's upper surface rising along its whole length. This replaces the generic sliver
// (`top`) for a car with traced planes.
import { INK } from "../kit/colors";
import { pathPoints } from "./seenFrom";
import { pathMin, type CarSpec } from "./spec";

type Pt = { x: number; y: number };

// the flap a shade lighter than the main plane, so the slot between them reads
const FLAP_TINT = "#43464d";

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

// The side profile swept from `a` to `b` (the same points moved): the end faces and one quad per edge, plus the two
// silhouette edges (the profile points furthest either side of the sweep direction).
const sweep = (a: Pt[], b: Pt[]) => {
  const n = a.length;
  const quads = a.map((p, i) => {
    const j = (i + 1) % n;
    return poly([p, a[j], b[j], b[i]]);
  });
  const d = { x: b[0].x - a[0].x, y: b[0].y - a[0].y };
  const side = (p: Pt) => p.x * d.y - p.y * d.x;
  let lo = 0;
  let hi = 0;
  a.forEach((p, i) => {
    if (side(p) < side(a[lo])) lo = i;
    if (side(p) > side(a[hi])) hi = i;
  });
  const edges = [lo, hi].map(
    (i) => `M ${r(a[i].x)} ${r(a[i].y)} L ${r(b[i].x)} ${r(b[i].y)}`,
  );
  return { quads, edges };
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
  const fills = [fill, FLAP_TINT];
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
          const b = a.map(toFar);
          const { quads, edges } = sweep(a, b);
          return (
            <g key={k}>
              {quads.map((q, i) => (
                <path
                  key={i}
                  d={q}
                  fill={fills[k]}
                  stroke={fills[k]}
                  strokeWidth={1}
                  strokeLinejoin="round"
                />
              ))}
              <path d={poly(b)} fill={fills[k]} />
              <path d={quads.join(" ")} fill={`url(#${id}-dl)`} opacity={0.5} />
              {edges.map((e) => (
                <path key={e} d={e} stroke={INK} strokeWidth={4} />
              ))}
              <path
                d={poly(b)}
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
