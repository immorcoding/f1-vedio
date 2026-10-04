// Where the wreck lies, in the world metres of the trackside camera (3.4–3.6): the barrier line, the survival cell
// through it, the torn-off rear on the track side, and the halo. Pure TypeScript, so the staging and the
// interpenetration check can read it from node. x along the barrier, z away from the camera (pinhole, kit/camera.ts).
// Every point on the car is read from the VF-20 trace (cars-2020.ts) through the cell's pose; nothing here copies a
// photo coordinate by hand.
import { VF20 } from "../../../cars/cars-2020.ts";
import { carLength } from "../../../cars/spec.ts";
import { RAILS } from "./rails.ts";

export const BARRIER_Z = 13;
// Camera of shot 3.4 (Wreck.tsx WRECK_CAM): 1 m up at the track edge, long lens, looking square at the barrier 13 m
// away. Every shot of the wreck is a zoomed copy of it (zoomCam), which keeps screen positions in proportion, so the
// staging can work in this one.
export const WRECK_CAM_SPEC = { f: 2300, horizon: 420, cx: 960, height: 1.0 };
// The survival cell went through the barrier and lodged in the gap it tore: its near side (half the 2.0 m width)
// just behind the rails' line, so nobody on the track side stands inside it. It is drawn in the gap, in front of the
// torn rails' stubs, with only the bottom rail's stubs (curled toward the track) in front of it (Wreck.tsx).
export const CELL_Z = 14.1;
export const REAR_Z = 10.4; // the torn-off rear came to rest on the track side
// World x of the intact car's rear end for each piece, set so the cell's nose lands near screen x 260 and the rear
// piece's torn edge near 1250.
export const CELL_ANCHOR_X = ((1332 - 960) * CELL_Z) / 2300;
export const REAR_ANCHOR_X = ((1787 - 960) * REAR_Z) / 2300;
export const L = carLength(VF20);

// The pieces' poses (CarState.split): the cell pushed on 0.4 m and pitched nose-down into the rails; the rear piece
// turned a little on its own wheels.
export const CELL_POSE = { dx: 0.4, rotate: -3 };
export const REAR_POSE = { rotate: 4 };

// ── Reading the trace ────────────────────────────────────────────────────────────────────────────────────────────
type Pt = { x: number; y: number };
const PPM_PHOTO = 250 / VF20.frame.k;
export const PPM = PPM_PHOTO;

// The segments of an absolute M/L/C/Z path as traced: each a list of control points (2 for a line, 4 for a cubic).
const segments = (d: string): Pt[][] => {
  const tok = d.match(/[MLCZ]|-?\d*\.?\d+/g) ?? [];
  const out: Pt[][] = [];
  let at: Pt = { x: 0, y: 0 };
  let start = at;
  let i = 0;
  const num = () => Number(tok[i++]);
  const pt = () => ({ x: num(), y: num() });
  let cmd = "M";
  while (i < tok.length) {
    if (/[MLCZ]/.test(tok[i])) cmd = tok[i++];
    if (cmd === "M") {
      at = pt();
      start = at;
      cmd = "L";
    } else if (cmd === "L") {
      const p = pt();
      out.push([at, p]);
      at = p;
    } else if (cmd === "C") {
      const ps = [pt(), pt(), pt()];
      out.push([at, ...ps]);
      at = ps[2];
    } else {
      out.push([at, start]);
      at = start;
    }
  }
  return out;
};
const onSegment = (s: Pt[], t: number): Pt => {
  if (s.length === 2)
    return {
      x: s[0].x + (s[1].x - s[0].x) * t,
      y: s[0].y + (s[1].y - s[0].y) * t,
    };
  const u = 1 - t;
  const w = [u * u * u, 3 * u * u * t, 3 * u * t * t, t * t * t];
  return {
    x: w.reduce((a, k, j) => a + k * s[j].x, 0),
    y: w.reduce((a, k, j) => a + k * s[j].y, 0),
  };
};
// A path as a dense polyline (about `step` photo px apart).
const flatten = (segs: Pt[][], step = 2): Pt[] => {
  const pts: Pt[] = [];
  for (const s of segs) {
    const len = s
      .slice(1)
      .reduce((a, p, j) => a + Math.hypot(p.x - s[j].x, p.y - s[j].y), 0);
    const n = Math.max(1, Math.ceil(len / step));
    for (let j = 0; j < n; j++) pts.push(onSegment(s, j / n));
  }
  const last = segs[segs.length - 1];
  pts.push(last[last.length - 1]);
  return pts;
};
// The point a fraction `frac` of the way along a polyline, by length.
const alongPolyline = (pts: Pt[], frac: number): Pt => {
  const d = pts
    .slice(1)
    .map((p, j) => Math.hypot(p.x - pts[j].x, p.y - pts[j].y));
  let left = frac * d.reduce((a, b) => a + b, 0);
  for (let j = 0; j < d.length; j++) {
    if (left <= d[j]) {
      const t = d[j] ? left / d[j] : 0;
      return {
        x: pts[j].x + (pts[j + 1].x - pts[j].x) * t,
        y: pts[j].y + (pts[j + 1].y - pts[j].y) * t,
      };
    }
    left -= d[j];
  }
  return pts[pts.length - 1];
};
// Photo y of a closed outline's top edge at photo x (the highest crossing).
const topEdge = (outline: Pt[], x: number) => {
  let top = Infinity;
  for (let j = 0; j < outline.length; j++) {
    const a = outline[j];
    const b = outline[(j + 1) % outline.length];
    if ((a.x - x) * (b.x - x) > 0 || a.x === b.x) continue;
    top = Math.min(top, a.y + ((b.y - a.y) * (x - a.x)) / (b.x - a.x));
  }
  return top;
};
// Photo y of a closed outline's bottom edge at photo x (the lowest crossing).
const bottomEdge = (outline: Pt[], x: number) => {
  let bottom = -Infinity;
  for (let j = 0; j < outline.length; j++) {
    const a = outline[j];
    const b = outline[(j + 1) % outline.length];
    if ((a.x - x) * (b.x - x) > 0 || a.x === b.x) continue;
    bottom = Math.max(bottom, a.y + ((b.y - a.y) * (x - a.x)) / (b.x - a.x));
  }
  return bottom;
};
const inside = (outline: Pt[], p: Pt) => {
  let n = false;
  for (let j = 0, k = outline.length - 1; j < outline.length; k = j++) {
    const a = outline[j];
    const b = outline[k];
    if (
      a.y > p.y !== b.y > p.y &&
      p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x
    )
      n = !n;
  }
  return n;
};

const BODY = flatten(segments(VF20.body));
const BREAK = flatten(segments(VF20.breakLine ?? ""));

// The point the front piece turns about (MangaCar's breakPivot: the middle of the break line's bounding box).
const breakNums = segments(VF20.breakLine ?? "").flat();
export const CELL_PIVOT = {
  x:
    (Math.min(...breakNums.map((p) => p.x)) +
      Math.max(...breakNums.map((p) => p.x))) /
    2,
  y:
    (Math.min(...breakNums.map((p) => p.y)) +
      Math.max(...breakNums.map((p) => p.y))) /
    2,
};

// ── The cell as it is drawn ──────────────────────────────────────────────────────────────────────────────────────
// The traced photo looks down on the car a little (its far wheels stand 180 photo px above the near ones), so every
// point on the car's centre line shows about 90 photo px (0.31 m) higher than a pure side elevation would put it.
// MangaCar anchors the sprite's near-wheel ground on the camera's ground at CELL_Z. A person standing in the cockpit
// therefore stands on the sprite's centre-line ground, CELL_RISE above the camera's ground at CELL_Z: that keeps him
// in proportion with the halo and the cockpit as drawn (heights below are measured from there).
const RISE_PX =
  (VF20.nearWheels[0].cy -
    VF20.farWheels[0].cy +
    VF20.nearWheels[1].cy -
    VF20.farWheels[1].cy) /
  4;
export const CELL_RISE = RISE_PX / PPM_PHOTO;
// A photo point of the traced VF-20 on the posed survival cell, in world metres (y as the camera sees the sprite).
export const cellPoint = (px: number, py: number) => {
  const a = (CELL_POSE.rotate * Math.PI) / 180; // SVG rotate: clockwise on screen (y down)
  const dx = px - CELL_PIVOT.x;
  const dy = py - CELL_PIVOT.y;
  const rx = CELL_PIVOT.x + dx * Math.cos(a) - dy * Math.sin(a);
  const ry = CELL_PIVOT.y + dx * Math.sin(a) + dy * Math.cos(a);
  return {
    x: CELL_ANCHOR_X + (rx - VF20.frame.x) / PPM_PHOTO - CELL_POSE.dx,
    y: (VF20.frame.ground - ry) / PPM_PHOTO,
    z: CELL_Z,
  };
};
const cellAt = (p: Pt) => cellPoint(p.x, p.y);

// The halo as traced (VF20.halo): the near bar's curved front — the central pillar out of the nose and its turn into
// the hoop — then the hoop's straight near side back to its rear foot on the cockpit shoulder.
const HALO_SEGS = segments(VF20.halo ?? "");
const HALO_STRAIGHT = HALO_SEGS.findIndex((s) => s.length === 2);
const PILLAR = flatten(HALO_SEGS.slice(0, HALO_STRAIGHT));
const HOOP_FRONT = HALO_SEGS[HALO_STRAIGHT][0];
const HOOP_FOOT = HALO_SEGS[HALO_STRAIGHT][1];
const onHoop = (t: number) => onSegment(HALO_SEGS[HALO_STRAIGHT], t);

// The cockpit's top edge (the body outline's top from the nose to the airbox front) as the camera sees it on the
// posed cell, world x → height.
const AIRBOX_X = Math.min(
  ...BODY.filter((p) => p.y < HOOP_FRONT.y - 40).map((p) => p.x),
);
const RIM_FROM = Math.round(HOOP_FRONT.x - 80);
const RIM_EDGE = Array.from(
  { length: Math.ceil(AIRBOX_X) - RIM_FROM },
  (_, j) => {
    const x = RIM_FROM + j;
    return cellAt({ x, y: topEdge(BODY, x) });
  },
).filter((p) => Number.isFinite(p.y));
export const cockpitRimAt = (x: number) => {
  if (x <= RIM_EDGE[0].x) return RIM_EDGE[0].y;
  for (let j = 1; j < RIM_EDGE.length; j++)
    if (x <= RIM_EDGE[j].x) {
      const a = RIM_EDGE[j - 1];
      const b = RIM_EDGE[j];
      return a.y + ((b.y - a.y) * (x - a.x)) / (b.x - a.x);
    }
  return RIM_EDGE[RIM_EDGE.length - 1].y;
};

// The floor's edge under the near sidepod (the sidepod's lower edge as drawn, where the white bodywork meets the
// black undercut): the step a driver uses getting out, now that the bottom rail is torn open under the cell too.
// World x on the cell's plane → height (as the camera sees the sprite).
const SIDEPOD = flatten(segments(VF20.regions?.sidepod ?? ""));
const SIDEPOD_X = [
  Math.min(...SIDEPOD.map((p) => p.x)),
  Math.max(...SIDEPOD.map((p) => p.x)),
];
const FLOOR_EDGE = Array.from(
  { length: Math.floor(SIDEPOD_X[1] - SIDEPOD_X[0]) - 1 },
  (_, j) => {
    const x = SIDEPOD_X[0] + 1 + j;
    return cellAt({ x, y: bottomEdge(SIDEPOD, x) });
  },
).filter((p) => Number.isFinite(p.y));
export const floorEdgeAt = (x: number) => {
  if (x <= FLOOR_EDGE[0].x) return FLOOR_EDGE[0].y;
  for (let j = 1; j < FLOOR_EDGE.length; j++)
    if (x <= FLOOR_EDGE[j].x) {
      const a = FLOOR_EDGE[j - 1];
      const b = FLOOR_EDGE[j];
      return a.y + ((b.y - a.y) * (x - a.x)) / (b.x - a.x);
    }
  return FLOOR_EDGE[FLOOR_EDGE.length - 1].y;
};

// Where the halo is, for the close-ups: on the near bar's hoop, a fifth of the way back from its front, on the posed
// cell.
const HALO_MID = cellAt(onHoop(0.22));
export const HALO_WORLD = { x: HALO_MID.x, y: HALO_MID.y - 0.12, z: CELL_Z };

// The cockpit (seat floor 0.08 m above the centre-line ground). Measured from the centre-line ground: rim about
// 0.65 m, halo hoop top about 0.85 m with the cell's 3° nose-down pitch — a real 2020 car: rim about 0.65 m, halo top
// about 0.9 m.
export const COCKPIT_FLOOR = cellPoint(
  HOOP_FOOT.x,
  VF20.frame.ground - RISE_PX - 0.08 * PPM_PHOTO,
).y;
// where GRO's hands hold the halo: the far hand high on the central pillar, where it turns into the hoop; the near
// hand on the hoop's near side
export const HALO_PILLAR_GRIP = cellAt(alongPolyline(PILLAR, 0.8));
export const HALO_HOOP_GRIP = cellAt(onHoop(0.28));
// the hoop's near side, front (top) to rear foot, for the layering checks
export const HALO_HOOP = [cellAt(HOOP_FRONT), cellAt(HOOP_FOOT)];
export const HALO_FOOT = HALO_HOOP[1];
// Everything above the body's top edge round the cockpit, in photo space (draw it through the cell's own transform):
// the part of a person in the cockpit that shows above the near side.
const CLIP_FROM = Math.round(HOOP_FRONT.x - 280);
const CLIP_TO = Math.round(AIRBOX_X + 180);
export const COCKPIT_CLIP_PHOTO = `M ${CLIP_FROM} -4000 L ${CLIP_TO} -4000 ${Array.from(
  { length: CLIP_TO - CLIP_FROM + 1 },
  (_, j) => CLIP_TO - j,
)
  .map((x) => `L ${x} ${topEdge(BODY, x).toFixed(1)}`)
  .join(" ")} Z`;

// The near halo bar's drawn outline in photo space (VF20.halo stroked at MangaCar's 16 px ink width): a band either
// side of the centre line and a disc on each round end. A second draw of the cell cut to it gives back exactly the
// near bar — the topmost thing MangaCar paints there — over someone in the cockpit.
const NEAR_BAR_R = 8;
const BAR_LINE = flatten(HALO_SEGS, 1);
const barSide = (sign: number) =>
  BAR_LINE.map((p, j) => {
    const a = BAR_LINE[Math.max(0, j - 1)];
    const b = BAR_LINE[Math.min(BAR_LINE.length - 1, j + 1)];
    const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
    return {
      x: p.x - (sign * NEAR_BAR_R * (b.y - a.y)) / len,
      y: p.y + (sign * NEAR_BAR_R * (b.x - a.x)) / len,
    };
  });
export const NEAR_BAR_CLIP_PHOTO = {
  band: `M ${[...barSide(1), ...barSide(-1).reverse()]
    .map((p) => `${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
    .join(" L ")} Z`,
  ends: [BAR_LINE[0], BAR_LINE[BAR_LINE.length - 1]].map((p) => ({
    cx: p.x,
    cy: p.y,
    r: NEAR_BAR_R,
  })),
};

// The two pieces on the ground, for the interpenetration check: x span (world), depth z, 2.0 m wide. The break runs
// down the engine bulkhead (VF20.breakLine).
const BREAK_X = (CELL_PIVOT.x - VF20.frame.x) / PPM_PHOTO;
export const CELL_SPAN = {
  from: CELL_ANCHOR_X - L - CELL_POSE.dx,
  to: CELL_ANCHOR_X + BREAK_X - CELL_POSE.dx,
  z: CELL_Z,
};
export const REAR_SPAN = {
  from: REAR_ANCHOR_X + BREAK_X,
  to: REAR_ANCHOR_X,
  z: REAR_Z,
};

// ── The barrier as the impact left it (3.3's last frames on, 3.4–3.6) ─────────────────────────────────────────────
// Shared by the pictures (Impact.tsx, Wreck.tsx, Timeline27.tsx) and the staging (escape-staging.ts). The barrier runs
// along x at BARRIER_Z. The survival cell punched through it and the barrier split (FIA summary: the middle rail
// failed, the upper and lower rails deformed heavily, the cell pierced the barrier): all three rails are torn open
// along the cell — their jagged ends curled back toward the track either side of it (user review 2026-10-04: an
// intact bottom rail under the cell looked odd). The cell sits in that gap, the cockpit, the halo and the helmet in
// plain view.
export type RailOffset = { dx: number; dy: number; dz: number };
// A smooth bump: 1 at s = c, falling off over `width` metres either side.
export const bump = (s: number, c: number, width: number) =>
  Math.exp(-(((s - c) / width) ** 2));
export const RUN = { a: { x: -30, z: BARRIER_Z }, b: { x: 30, z: BARRIER_Z } };
const RUN_LEN = RUN.b.x - RUN.a.x;
export const CELL_FROM = CELL_ANCHOR_X - L - CELL_POSE.dx; // nose
export const CELL_TO = CELL_ANCHOR_X - 2.4 - CELL_POSE.dx; // torn edge
const S_CELL = (CELL_FROM + CELL_TO) / 2 - RUN.a.x;

// The front piece's outline as the camera sees it, carried to the barrier's plane (the same screen point at
// BARRIER_Z): the body, the front wing and the halo, cut at the break.
const H = WRECK_CAM_SPEC.height;
const toBarrier = (p: { x: number; y: number }) => ({
  x: (p.x * BARRIER_Z) / CELL_Z,
  y: H - ((H - p.y) * BARRIER_Z) / CELL_Z,
});
const HALO_R = 8; // half the near bar's drawn width, photo px (MangaCar)
const SILHOUETTE = [
  ...BODY,
  ...flatten(segments(VF20.frontWing.near)),
  ...flatten(segments(VF20.frontWing.deck)),
  ...flatten(segments(VF20.cockpit.headrest ?? "")),
  ...[...flatten(HALO_SEGS), ...flatten(segments(VF20.haloFar ?? ""))].flatMap(
    (p) => [
      { x: p.x, y: p.y - HALO_R },
      { x: p.x, y: p.y + HALO_R },
    ],
  ),
  ...BREAK.filter((p) => inside(BODY, p)),
]
  .filter((p) => {
    // front of the break: left of the break line at that height
    const j = BREAK.findIndex((b) => b.y >= p.y);
    const bx = j < 0 ? BREAK[BREAK.length - 1].x : BREAK[j].x;
    return p.x <= bx + 0.5;
  })
  .map((p) => toBarrier(cellAt(p)));
// The cell's extent (barrier x) between two heights at the barrier.
const extentIn = (y0: number, y1: number) => {
  const xs = SILHOUETTE.filter((p) => p.y >= y0 && p.y <= y1).map((p) => p.x);
  return [Math.min(...xs), Math.max(...xs)] as const;
};
// The torn stretches, world x at the barrier, per rail (0 bottom, 1 middle, 2 top): each rail is open over the cell's
// width at its own height, with a hand's breadth to spare either side for the jagged ends.
const SPARE = 0.12;
export const TEARS = [0, 1, 2].map((r) => {
  const [a, b] = extentIn(RAILS[r][0], RAILS[r][1]);
  return [a - SPARE, b + SPARE] as const;
});
export const BOTTOM_TEAR = TEARS[0];
export const MID_TEAR = TEARS[1];
export const TOP_TEAR = TEARS[2];
// per rail (0 bottom, 1 middle, 2 top), the torn stretches as fractions of the run (BentGuardrail's `gaps`)
export const along = (x: number) => (x - RUN.a.x) / RUN_LEN;
export const WRECK_GAPS: [number, number][][] = TEARS.map(([a, b]) => [
  [along(a), along(b)],
]);
// A torn end curls: the last CURL metres of rail before the tear bend up (`up`), back toward the track (`out`) and away
// from the gap (`away`), growing as the square toward the jagged end. Offsets along the rail (away from the gap),
// up, and toward the track; `amount` 0..1 grows the curl as the rail splits (3.3), 1 once it has.
export const CURL = 0.9;
export const CURL_SHAPE = [
  { up: 0.04, out: 0.22 }, // bottom rail: curls back more than up (the cell went over it)
  { up: 0.1, out: 0.25 },
  { up: 0.22, out: 0.32 },
];
export const tornCurl = (
  s: number,
  from: number,
  to: number,
  rail: number,
  amount = 1,
) => {
  const d = Math.min(Math.abs(s - from), Math.abs(s - to));
  const within = s > from && s < to;
  const q = (within ? 1 : Math.max(0, 1 - d / CURL) ** 2) * amount;
  const away = s <= from ? -1 : 1; // which way along the rail is away from the gap
  const c = CURL_SHAPE[rail];
  return { along: away * 0.12 * q, up: c.up * q, out: c.out * q };
};
// World offset of rail r (0 bottom, 1 middle, 2 top) at s metres along the run.
export const WRECK_BEND = (s: number, rail: number): RailOffset => {
  const [from, to] = TEARS[rail];
  const c = tornCurl(s, from - RUN.a.x, to - RUN.a.x, rail);
  // the lower two rails' stubs pushed back with the cell, the bottom one a little down as well
  const k = rail < 2 ? bump(s, S_CELL, 2.2) : 0;
  return {
    dx: c.along,
    dy: c.up - (rail === 0 ? 0.06 * k : 0),
    dz: (rail === 0 ? 0.35 : 0.3) * k - c.out,
  };
};
// The rails' top edge (m, rails.ts).
export const TOP_RAIL_EDGE = RAILS[2][1];
