// PROTOTYPE (prototype/car-high-low): a car's body re-projected from its trace photo's camera to a lower one
// (FarSideLook.body, BodyView). Only heights change: x stays as traced, and so do the near wheels and the near front
// endplate (they sit on the near wheel plane, where the two cameras agree).
//
// A body point at true height h and depth d (m behind the near wheel plane) shows at h·cos(e) + d·sin(e) above the
// near ground line for a camera e degrees up. The trace photo gives that apparent height for e = photoElevation; the
// point's depth comes from its height (BodyView); so h follows, and the point is redrawn for the look's elevation.
import {
  photoPxPerMetre,
  type BodyView,
  type CarSpec,
  type FarSideCamera,
  type FarSideLook,
} from "./spec";

const CENTRE = 0.8; // m, the centre line behind the near wheel plane (half the 2020–21 track)
const FLOOR_DEPTH = 0.35; // m, the floor edge: puts it 0.02–0.15 tyre diameters up from 4°, as the low-angle photos show
const POD_DEPTH = 0.7; // m, the sidepod's lower line (the undercut runs in under the sidepod)
const NOSE = 0.65; // m, the nose's near face and underside (the nose is ~0.3 m wide on the centre line)
const TOP_HEIGHT = 0.65; // m apparent: above this every body point is on the centre-line top

const rad = (deg: number) => (deg * Math.PI) / 180;
const lerp = (a: number, b: number, t: number) => a + (b - a) * Math.max(0, Math.min(1, t));

export type YWarp = (x: number, y: number) => number;

export const bodyWarp = (car: CarSpec, v: BodyView): YWarp => {
  const ppm = photoPxPerMetre(car);
  const g = car.frame.ground;
  const s1 = Math.sin(rad(v.photoElevation));
  const c1 = Math.cos(rad(v.photoElevation));
  const s2 = Math.sin(rad(v.elevation));
  const c2 = Math.cos(rad(v.elevation));
  const aFloor = (g - v.floorY) / ppm;
  const aPod = (g - v.podY) / ppm;
  const front = car.nearWheels[0].cx;
  return (x, y) => {
    const a = (g - y) / ppm;
    const body =
      a <= aPod
        ? lerp(FLOOR_DEPTH, POD_DEPTH, (a - aFloor) / (aPod - aFloor))
        : lerp(POD_DEPTH, CENTRE, (a - aPod) / (TOP_HEIGHT - aPod));
    const nose = 1 - Math.max(0, Math.min(1, (x - front) / (v.noseTo - front)));
    const d = lerp(body, NOSE, nose);
    const h = (a - d * s1) / c1;
    return g - (h * c2 + d * s2) * ppm;
  };
};

// Every coordinate pair of an absolute M/L/C/Z path through the warp; `keepFirst` leaves the first point (a
// suspension arm's wheel end) where it is.
export const warpPath = (d: string, w: YWarp, keepFirst = false) => {
  const toks = d.match(/[MLCZ]|-?\d+(?:\.\d+)?/g) ?? [];
  const out: string[] = [];
  let pair = 0;
  for (let i = 0; i < toks.length; i++) {
    const t = toks[i];
    if (/[MLCZ]/.test(t)) {
      out.push(t);
      continue;
    }
    const x = Number(t);
    const y = Number(toks[++i]);
    const ny = keepFirst && pair === 0 ? y : w(x, y);
    pair++;
    out.push(`${x} ${Math.round(ny * 10) / 10}`);
  }
  return out.join(" ");
};

// Polyline points of an absolute M/L/C/Z path (curves sampled).
const pathPoints = (d: string) => {
  const toks = d.match(/[MLCZ]|-?\d+(?:\.\d+)?/g) ?? [];
  const pts: { x: number; y: number }[][] = [];
  let cur: { x: number; y: number }[] = [];
  let cmd = "M";
  for (let i = 0; i < toks.length; ) {
    const t = toks[i];
    if (/[MLCZ]/.test(t)) {
      cmd = t;
      i++;
      if (t === "Z" && cur.length) {
        cur.push(cur[0]);
        pts.push(cur);
        cur = [];
      }
      continue;
    }
    if (cmd === "M") {
      if (cur.length) pts.push(cur);
      cur = [{ x: +toks[i], y: +toks[i + 1] }];
      i += 2;
      cmd = "L";
    } else if (cmd === "L") {
      cur.push({ x: +toks[i], y: +toks[i + 1] });
      i += 2;
    } else {
      const p = toks.slice(i, i + 6).map(Number);
      const o = cur[cur.length - 1];
      for (let k = 1; k <= 12; k++) {
        const u = k / 12;
        const [a, b, c, e] = [(1 - u) ** 3, 3 * u * (1 - u) ** 2, 3 * u * u * (1 - u), u ** 3];
        cur.push({ x: a * o.x + b * p[0] + c * p[2] + e * p[4], y: a * o.y + b * p[1] + c * p[3] + e * p[5] });
      }
      i += 6;
    }
  }
  if (cur.length) pts.push(cur);
  return pts;
};

// The lowest edge of a closed path at x (largest y), or undefined where the path does not reach x.
export const undersideAt = (d: string, x: number) => {
  let best: number | undefined;
  for (const poly of pathPoints(d)) {
    for (let i = 1; i < poly.length; i++) {
      const p = poly[i - 1];
      const q = poly[i];
      if ((p.x - x) * (q.x - x) > 0 || p.x === q.x) continue;
      const y = p.y + ((q.y - p.y) * (x - p.x)) / (q.x - p.x);
      best = best === undefined ? y : Math.max(best, y);
    }
  }
  return best;
};

// The front wing seen side-on from the low camera: the main plane runs from the near endplate's top up to the
// (re-projected) nose underside, so the wing always meets the nose; the accent flap is a wedge along its rear.
const sideOnWing = (car: CarSpec, body: string) => {
  const ep = pathPoints(car.frontWing.near).flat();
  const x0 = Math.min(...ep.map((p) => p.x));
  const x1 = Math.max(...ep.map((p) => p.x));
  const top = Math.min(...ep.map((p) => p.y));
  const w = x1 - x0;
  const nose = (x: number) => Math.min(top, (undersideAt(body, x) ?? top) + 3);
  const xm = x0 + 0.45 * w;
  const xf = x1 - 0.4 * w;
  return {
    frontDeck: `M ${x0 + 4} ${top + 6} L ${xm} ${nose(xm)} L ${x1} ${nose(x1)} L ${x1} ${top + 6} Z`,
    frontFlap: `M ${xf} ${top + 2} L ${x1} ${Math.min(nose(x1), top - 12)} L ${x1} ${top + 2} Z`,
  };
};

const cache = new WeakMap<CarSpec, Partial<Record<FarSideCamera, CarSpec>>>();

// The car as drawn for one camera look: the spec itself, or with `look.body` its body re-projected and the front
// wing side-on (unless the look gives its own deck and flap).
export const specSeenFrom = (car: CarSpec, camera: FarSideCamera): CarSpec => {
  const look: FarSideLook | undefined = car.farSide?.[camera];
  if (!look?.body) return car;
  const hit = cache.get(car)?.[camera];
  if (hit) return hit;
  const w = bodyWarp(car, look.body);
  const P = (d: string) => warpPath(d, w);
  const opt = (d?: string) => (d === undefined ? undefined : P(d));
  const pt = <T extends { cx: number; cy: number }>(c: T): T => ({ ...c, cy: w(c.cx, c.cy) });
  const rw = car.rearWing;
  const warped: CarSpec = {
    ...car,
    body: P(car.body),
    regions: {
      cover: P(car.regions.cover),
      sidepod: P(car.regions.sidepod),
      undercut: P(car.regions.undercut),
      chassis: P(car.regions.chassis),
    },
    livery: car.livery.map((a) => ({ ...a, d: P(a.d) })),
    accents: car.accents.map((a) => ({ ...a, d: P(a.d) })),
    haloAccent: car.haloAccent && { ...car.haloAccent, d: P(car.haloAccent.d) },
    glints: car.glints.map(P),
    floor: P(car.floor),
    rearWing: {
      ...rw,
      near: P(rw.near),
      livery: rw.livery?.map((a) => ({ ...a, d: P(a.d) })),
      top: opt(rw.top),
      elements: rw.elements.map(P),
      pylon: P(rw.pylon),
      beam: opt(rw.beam),
    },
    panelLines: car.panelLines.map(P),
    suspension: car.suspension.map((d) => warpPath(d, w, true)),
    halo: opt(car.halo),
    haloFar: opt(car.haloFar),
    cockpit: {
      headrest: opt(car.cockpit.headrest),
      hans: car.cockpit.hans && pt(car.cockpit.hans),
      opening: opt(car.cockpit.opening),
    },
    helmetAt: pt(car.helmetAt),
    windscreen: opt(car.windscreen),
    mirror: P(car.mirror),
    tcam: opt(car.tcam),
    antenna: opt(car.antenna),
    rainLight: opt(car.rainLight),
    numberAt: { ...car.numberAt, y: w(car.numberAt.x, car.numberAt.y) },
    breakLine: opt(car.breakLine),
  };
  const wing = sideOnWing(car, warped.body);
  const out: CarSpec = {
    ...warped,
    farSide: {
      ...car.farSide,
      [camera]: {
        ...look,
        body: undefined, // already applied: drawing `out` again must not re-project it
        frontDeck: look.frontDeck ?? wing.frontDeck,
        frontFlap: look.frontFlap ?? wing.frontFlap,
      },
    },
  };
  cache.set(car, { ...cache.get(car), [camera]: out });
  return out;
};
