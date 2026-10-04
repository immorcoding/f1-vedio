// The LOW look (ART-26): a car's body re-projected from its trace photo's camera to a lower one (FarSideLook.body,
// BodyView). Heights change; x stays as traced except along the nose, whose tip is placed by the nose rule below. The
// near wheels and the near front endplate stay as traced (they sit on the near wheel plane, where the cameras agree).
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
const TOP_HEIGHT = 0.65; // m apparent: above this every body point is on the centre-line top

// The nose tip, the same real dimensions on every 2020–21 car (user review 2026-10-04: the RB16B low look is right,
// its near front endplate hides the nose tip and the wing behind it; the other cars follow the same rule):
// - NOSE_DD_HEIGHT: the nose underside 50 mm behind its tip (the plane D-D of the 2021 Technical Regulations,
//   Art. 15.5.6) sits 0.145 m above the ground. The rules put that section at least 135 mm above the reference plane,
//   and the RB16B trace, re-projected with the nose 0.65 m behind the near wheel plane, gives 0.145 m. Each trace photo
//   lifts the nose by its own camera (and yaw), so each car's nose depth is backed out from this height.
// - NOSE_BEHIND_ENDPLATE: the tip sits 0.07 m behind the near front endplate's leading edge, as on the RB16B trace.
//   The other traces put it 0.06–0.17 m ahead of the edge: the photos are shot slightly from the front, which moves
//   centre-line parts forward (the far wheels show the same yaw).
const NOSE_DD = 0.05; // m behind the tip
const NOSE_DD_HEIGHT = 0.145; // m above the ground
const NOSE_BEHIND_ENDPLATE = 0.07; // m

const rad = (deg: number) => (deg * Math.PI) / 180;
const lerp = (a: number, b: number, t: number) => a + (b - a) * Math.max(0, Math.min(1, t));
const xsOf = (d: string) =>
  (d.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number).filter((_, i) => i % 2 === 0);

export type PointWarp = (x: number, y: number) => { x: number; y: number };

export const bodyWarp = (car: CarSpec, v: BodyView): PointWarp => {
  const ppm = photoPxPerMetre(car);
  const g = car.frame.ground;
  const s1 = Math.sin(rad(v.photoElevation));
  const c1 = Math.cos(rad(v.photoElevation));
  const s2 = Math.sin(rad(v.elevation));
  const c2 = Math.cos(rad(v.elevation));
  const aFloor = (g - v.floorY) / ppm;
  const aPod = (g - v.podY) / ppm;
  const front = car.nearWheels[0].cx;
  // the nose: its depth from the traced underside at D-D, its tip moved to NOSE_BEHIND_ENDPLATE (the nose stretched
  // or squeezed between the tip and noseTo)
  const tip = Math.min(...xsOf(car.body));
  const aDD = (g - (undersideAt(car.body, tip + NOSE_DD * ppm) ?? g)) / ppm;
  const noseDepth = (aDD - NOSE_DD_HEIGHT * c1) / s1;
  const tipTo = Math.min(...xsOf(car.frontWing.near)) + NOSE_BEHIND_ENDPLATE * ppm;
  return (x, y) => {
    const a = (g - y) / ppm;
    const body =
      a <= aPod
        ? lerp(FLOOR_DEPTH, POD_DEPTH, (a - aFloor) / (aPod - aFloor))
        : lerp(POD_DEPTH, CENTRE, (a - aPod) / (TOP_HEIGHT - aPod));
    const nose = 1 - Math.max(0, Math.min(1, (x - front) / (v.noseTo - front)));
    const d = lerp(body, noseDepth, nose);
    const h = (a - d * s1) / c1;
    const along = Math.max(0, Math.min(1, (v.noseTo - x) / (v.noseTo - tip)));
    return { x: x + (tipTo - tip) * along, y: g - (h * c2 + d * s2) * ppm };
  };
};

// Every coordinate pair of an absolute M/L/C/Z path through the warp; `keepFirst` leaves the first point (a
// suspension arm's wheel end) where it is.
export const warpPath = (d: string, w: PointWarp, keepFirst = false) => {
  const toks = d.match(/[MLCZ]|-?\d+(?:\.\d+)?/g) ?? [];
  const out: string[] = [];
  let pair = 0;
  const r = (n: number) => Math.round(n * 10) / 10;
  for (let i = 0; i < toks.length; i++) {
    const t = toks[i];
    if (/[MLCZ]/.test(t)) {
      out.push(t);
      continue;
    }
    const x = Number(t);
    const y = Number(toks[++i]);
    const p = keepFirst && pair === 0 ? { x, y } : w(x, y);
    pair++;
    out.push(`${r(p.x)} ${r(p.y)}`);
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
  const pt = <T extends { cx: number; cy: number }>(c: T): T => {
    const p = w(c.cx, c.cy);
    return { ...c, cx: p.x, cy: p.y };
  };
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
    numberAt: { ...car.numberAt, ...w(car.numberAt.x, car.numberAt.y) },
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
