// The Bahrain crash as one top-view world model, and the trackside view of the wreck every shot from 3.3 on is drawn
// through. Pure TypeScript, so the staging, the interpenetration check and the geometry diagram read it from node.
//
// W, the top view (facts.md "2020 巴林大奖赛", FIA summary 2021-03-05): metres on the ground. Origin: where the survival
// cell's centre line crosses the barrier line at rest — the front of its primary roll structure, held against the top
// rail ("constrained by the primary roll structure against the upper rail"). x runs along the barrier in the race
// direction, y away from the track (beyond the barrier > 0); headings in degrees from +x toward +y (clockwise on a map
// drawn with y down, as 3.2's top view). The barrier is on the right of the car's run; the car's path meets it at 29°,
// its body at 51° (29° + the 22° yaw to the right, crash-geometry.ts); the cell pierces it nose first and stops with
// the roll structure on the rail line; the rear half (power unit, gearbox, rear wing) tears off and ends up on the
// track side "pointing in the wrong direction" (Ian Roberts, Autosport).
//
// V, the wreck view: the trackside camera looking square at the cell's left flank (the side facing the track), so the
// side-view car models (MangaCar, people) are drawn without foreshortening. V is that camera's world (pinhole,
// kit/camera.ts): x to the right of its picture, z away from it. Its picture is flipped left to right on screen (a
// manga flip, as 3.3), so the car points left → right, the direction it ran in 3.2. In V the cell's nose points −x.
// Every point on the car is read from the VF-20 trace (cars-2020.ts) through the cell's pose; nothing here copies a
// photo coordinate by hand (ART-29).
import { VF20 } from "../../../cars/cars-2020.ts";
import { carLength } from "../../../cars/spec.ts";
import { pinhole } from "../../../kit/camera.ts";
import {
  BODY_ANGLE,
  CAR_HALF_WIDTH,
  IMPACT_ANGLE,
  WING_CORNER,
} from "./crash-geometry.ts";
import { RAILS } from "./rails.ts";

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

// The halo as traced (VF20.halo): the near bar's curved front — the central pillar out of the nose and its turn into
// the hoop — then the hoop's straight near side back to its rear foot on the cockpit shoulder.
const HALO_SEGS = segments(VF20.halo ?? "");
const HALO_STRAIGHT = HALO_SEGS.findIndex((s) => s.length === 2);
const PILLAR = flatten(HALO_SEGS.slice(0, HALO_STRAIGHT));
const HOOP_FRONT = HALO_SEGS[HALO_STRAIGHT][0];
const HOOP_FOOT = HALO_SEGS[HALO_STRAIGHT][1];
const onHoop = (t: number) => onSegment(HALO_SEGS[HALO_STRAIGHT], t);
// The front of the airbox over the driver's head: the primary roll structure.
const AIRBOX_X = Math.min(
  ...BODY.filter((p) => p.y < HOOP_FRONT.y - 40).map((p) => p.x),
);
const AIRBOX_Y = Math.min(
  ...BODY.filter((p) => Math.abs(p.x - AIRBOX_X) < 3).map((p) => p.y),
);

// The car's lengths along its centre line, metres forward of the intact car's rear end (the trace's frame.x).
const fromRear = (photoX: number) => (VF20.frame.x - photoX) / PPM_PHOTO;
const WING_NUMS = segments(VF20.frontWing.near).flat();
export const CAR_STATIONS = {
  nose: fromRear(Math.min(...BODY.map((p) => p.x))),
  wing: fromRear(Math.min(...WING_NUMS.map((p) => p.x))),
  rollHoop: fromRear(AIRBOX_X),
  breakLine: fromRear(CELL_PIVOT.x),
  length: L,
};

// ── W: the top view ─────────────────────────────────────────────────────────────────────────────────────────────────
export type P2 = { x: number; y: number };
export const unit = (deg: number): P2 => ({
  x: Math.cos((deg * Math.PI) / 180),
  y: Math.sin((deg * Math.PI) / 180),
});
const add = (a: P2, b: P2, k = 1): P2 => ({ x: a.x + b.x * k, y: a.y + b.y * k });
const dot = (a: P2, b: P2) => a.x * b.x + a.y * b.y;

export const ORIGIN: P2 = { x: 0, y: 0 };
// the barrier: the rails' track face along y = 0 (the triple guardrail behind the run-off, on the right of the run)
export const BARRIER_W = { at: ORIGIN, dir: unit(0), trackSide: unit(-90) };
export const PATH_DIR = unit(IMPACT_ANGLE); // the car's direction of travel at the hit
export const NOSE_DIR = unit(BODY_ANGLE); // the body's heading at the hit and at rest (51° to the barrier)
export const LEFT_DIR = unit(BODY_ANGLE - 90); // the car's left: the side facing the track
export const RIGHT_DIR = unit(BODY_ANGLE + 90);

// The survival cell at rest: heading unchanged from the hit (the rails clamped it; no source gives a rest angle), its
// roll structure on the barrier line. A station along the intact car (metres forward of its rear end), on its centre
// line, in the cell's rest pose.
export const restStation = (m: number) =>
  add(ORIGIN, NOSE_DIR, m - CAR_STATIONS.rollHoop);
export const CELL_REST = {
  heading: BODY_ANGLE,
  nose: restStation(CAR_STATIONS.nose),
  rollHoop: ORIGIN,
  breakLine: restStation(CAR_STATIONS.breakLine),
};
// First touch: the right front-wing corner on the rails. The car slid in along its path, 29° to the barrier, its
// body yawed 22° to the right of that path, from the touch to the rest pose: PIERCE metres.
const CORNER_REST = add(
  restStation(CAR_STATIONS.nose - WING_CORNER.back),
  RIGHT_DIR,
  WING_CORNER.out,
);
export const PIERCE = CORNER_REST.y / PATH_DIR.y;
export const IMPACT_POINT = add(CORNER_REST, PATH_DIR, -PIERCE); // y = 0
// the whole car at the touch: its rest pose moved back along the path
export const atTouch = (p: P2) => add(p, PATH_DIR, -PIERCE);

// The rear half at rest, on the track side. Not in the FIA summary: Ian Roberts (FIA medical car, Autosport) arrived
// to "half a car, the rear end, … pointing in the wrong direction" and saw the cell to their right "with a big gap in
// the armco". So: turned end for end (drawn side-on, its torn front pointing back up the run), lying in the run-off
// between the gap and the arriving medical car. Its exact place and angle are not known; this one is schematic.
export const REAR_HEADING = BODY_ANGLE + 180;
const REAR_END = add(add(ORIGIN, NOSE_DIR, -1.8), LEFT_DIR, 2.95);
export const REAR_REST = {
  heading: REAR_HEADING,
  rearEnd: REAR_END, // the rear wing's end
  breakLine: add(REAR_END, unit(REAR_HEADING), CAR_STATIONS.breakLine), // its torn front
};

// ── V: the wreck view ──────────────────────────────────────────────────────────────────────────────────────────────
// The trackside camera (Wreck.tsx WRECK_CAM): square to the cell's left flank, CELL_Z metres from its centre line,
// 3.2 m up and looking a little down, so the barrier's 51° to the cell shows in the picture as rails crossing in front
// of the nose and running away behind the tail to a vanishing point in frame (a low camera flattens it into a strip
// that looks parallel to the car — review of #20). Every shot of the wreck is a zoomed copy of it (zoomCam), which
// keeps screen positions in proportion, and 3.3 is filmed from the same spot.
export const CELL_Z = 7.5;
export const WRECK_CAM_SPEC = { f: 1220, horizon: 130, cx: 960, height: 3.2 };
const BASE_CAM = pinhole(WRECK_CAM_SPEC);
const VIEW_Z = RIGHT_DIR; // the camera looks at the car's left flank, across it
const VIEW_X = unit(BODY_ANGLE + 180); // V's +x (before the flip): toward the tail
const CAMERA_W = add(ORIGIN, VIEW_Z, -CELL_Z); // the roll structure at V x 0
export const WRECK_CAMERA_W = { at: CAMERA_W, look: VIEW_Z, right: VIEW_X };
// W → V and back (ground plane; heights are the same in both)
export const toView = (p: P2) => {
  const d = add(p, CAMERA_W, -1);
  return { x: dot(d, VIEW_X), z: dot(d, VIEW_Z) };
};
export const fromView = (p: { x: number; z: number }): P2 =>
  add(add(CAMERA_W, VIEW_X, p.x), VIEW_Z, p.z);
export const dirToView = (d: P2) => ({ x: dot(d, VIEW_X), z: dot(d, VIEW_Z) });

// ── The cell as it is drawn ──────────────────────────────────────────────────────────────────────────────────────
// A photo point of the traced VF-20 on the posed survival cell, metres from the intact car's anchor (its rear end) in V
// (the car faces −x), y as the camera sees the sprite.
const cellRel = (px: number, py: number) => {
  const a = (CELL_POSE.rotate * Math.PI) / 180; // SVG rotate: clockwise on screen (y down)
  const dx = px - CELL_PIVOT.x;
  const dy = py - CELL_PIVOT.y;
  const rx = CELL_PIVOT.x + dx * Math.cos(a) - dy * Math.sin(a);
  const ry = CELL_PIVOT.y + dx * Math.sin(a) + dy * Math.cos(a);
  return {
    x: (rx - VF20.frame.x) / PPM_PHOTO - CELL_POSE.dx,
    y: (VF20.frame.ground - ry) / PPM_PHOTO,
  };
};
// V x of the intact car's rear end for the cell, set so its roll structure lands on the barrier line (W origin)
export const CELL_ANCHOR_X =
  toView(CELL_REST.rollHoop).x - cellRel(AIRBOX_X, AIRBOX_Y).x;
// the rear piece is turned end for end (MangaCar facing right in V): anchored at its own rear end
const REAR_V = toView(REAR_REST.rearEnd);
export const REAR_Z = REAR_V.z;
export const REAR_ANCHOR_X = REAR_V.x;

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
// A photo point of the traced VF-20 on the posed survival cell, in V metres (y as the camera sees the sprite).
export const cellPoint = (px: number, py: number) => {
  const r = cellRel(px, py);
  return { x: CELL_ANCHOR_X + r.x, y: r.y, z: CELL_Z };
};
const cellAt = (p: Pt) => cellPoint(p.x, p.y);

// The cockpit's top edge (the body outline's top from the nose to the airbox front) as the camera sees it on the
// posed cell, world x → height.
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

// The two pieces on the ground, for the interpenetration check: x span (V), depth z, 2.0 m wide. The break runs
// down the engine bulkhead (VF20.breakLine).
const BREAK_X = (CELL_PIVOT.x - VF20.frame.x) / PPM_PHOTO;
export const CELL_SPAN = {
  from: CELL_ANCHOR_X - L - CELL_POSE.dx,
  to: CELL_ANCHOR_X + BREAK_X - CELL_POSE.dx,
  z: CELL_Z,
};
// the rear piece faces +x in V: from its rear end to its torn front
export const REAR_SPAN = {
  from: REAR_ANCHOR_X,
  to: REAR_ANCHOR_X - BREAK_X,
  z: REAR_Z,
};
export const CELL_FROM = CELL_ANCHOR_X - L - CELL_POSE.dx; // nose
export const CELL_TO = CELL_ANCHOR_X - 2.4 - CELL_POSE.dx; // torn edge

// ── The barrier and the gap the cell tore (3.3's last frames on, 3.4–3.6) ────────────────────────────────────────
// Shared by the pictures (Impact.tsx, Wreck.tsx, Timeline27.tsx) and the staging (escape-staging.ts). The FIA summary:
// the middle rail failed, the upper and lower rails deformed heavily, the cell pierced the barrier. In V the barrier is
// the W line y = 0: it runs from far up the run (deep, behind the cell's tail) through the roll structure and on
// toward the camera past the nose. All three rails are torn open where the cell went through, their jagged ends curled
// back toward the track (ART-25: one torn gap, from the moment it tears to the last shot).
export type RailOffset = { dx: number; dy: number; dz: number };
// A smooth bump: 1 at s = c, falling off over `width` metres either side.
export const bump = (s: number, c: number, width: number) =>
  Math.exp(-(((s - c) / width) ** 2));
// The run as BentGuardrail draws it: from W x RUN_FROM (far up the run) to W x RUN_TO (1 m in front of the camera).
const RUN_FROM = -45;
const RUN_TO = (CELL_Z - 1.0) / -dirToView(BARRIER_W.dir).z;
const v3 = (p: P2) => {
  const q = toView(p);
  return { x: q.x, z: q.z };
};
export const RUN = { a: v3({ x: RUN_FROM, y: 0 }), b: v3({ x: RUN_TO, y: 0 }) };
const RUN_LEN = RUN_TO - RUN_FROM;
// metres along the run from its far end ↔ W x on the barrier
export const runS = (wx: number) => wx - RUN_FROM;
export const along = (wx: number) => runS(wx) / RUN_LEN;
// the barrier's V direction per metre of run, the way back toward the track, and the way through it
export const RUN_DIR_V = dirToView(BARRIER_W.dir);
export const TRACKWARD_V = dirToView(BARRIER_W.trackSide);
// V depth of the barrier line at V x (its track face): a point nearer than this is on the track side
export const barrierZAt = (x: number) =>
  RUN.a.z + ((x - RUN.a.x) * (RUN.b.z - RUN.a.z)) / (RUN.b.x - RUN.a.x);
export const onTrackSide = (p: { x: number; z: number }) =>
  dot(fromView(p), BARRIER_W.trackSide) > 0;

// The front piece's outline as the camera sees it (V, at CELL_Z): the body, the front wing and the halo, cut at the
// break.
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
  .map((p) => BASE_CAM.project(cellAt(p)));
// The torn stretch of each rail (0 bottom, 1 middle, 2 top), W x along the barrier. Where the cell's 2.0 m-wide body
// crossed the rail line (its whole width, 1.0 / sin 51° either side of the centre line: the physical tear), widened
// toward the near side for as far as the rail, seen from the wreck camera, would cross in front of the cell's
// outline at its height — the rails the cell went through break along its outline (ART-25) — and a hand's breadth to
// spare either side for the jagged ends.
const SPARE = 0.12;
const CROSS = CAR_HALF_WIDTH / Math.abs(dot(BARRIER_W.dir, LEFT_DIR));
const overlapsCell = (wx: number, rail: number) => {
  const p = v3({ x: wx, y: 0 });
  const [y0, y1] = RAILS[rail];
  const top = BASE_CAM.project({ x: p.x, y: y1, z: p.z });
  const bot = BASE_CAM.project({ x: p.x, y: y0, z: p.z });
  const xs = SILHOUETTE.filter((q) => q.y >= top.y && q.y <= bot.y).map(
    (q) => q.x,
  );
  return xs.length > 0 && top.x >= Math.min(...xs) && top.x <= Math.max(...xs);
};
// The middle rail failed (FIA): it is open all the way back to the first touch, where the nose went in and slid on
// through it; the top and bottom rails are torn only where the cell went through them, and bent back (deformed)
// along the rest of the way the car slid (WRECK_BEND).
export const TEARS = [0, 1, 2].map((r) => {
  let to = CROSS;
  for (let wx = CROSS; wx < RUN_TO - 1; wx += 0.02)
    if (overlapsCell(wx, r)) to = wx;
  const from = r === 1 ? Math.min(-CROSS, IMPACT_POINT.x) : -CROSS;
  return [from - SPARE, to + SPARE] as const;
});
// the stretch the car slid through, from the first touch to where its body crosses the rails at rest (W x)
export const SLID = [IMPACT_POINT.x, CROSS] as const;
export const BOTTOM_TEAR = TEARS[0];
export const MID_TEAR = TEARS[1];
export const TOP_TEAR = TEARS[2];
// per rail, the torn stretches as fractions of the run (BentGuardrail's `gaps`)
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
// Offset of rail r (0 bottom, 1 middle, 2 top) at s metres along the run, in a camera's world given how W directions
// look in it: the torn ends curled, and the stubs either side of the gap pushed on through with the cell (beyond the
// barrier line), the bottom one a little down as well. The same bend in every view.
// (pushed back over the stretch the car slid through, most where the cell went through)
const slidWeight = (s: number) => {
  const a = runS(SLID[0]);
  const b = runS(SLID[1]);
  if (s >= b) return bump(s, b, 1.6);
  const rise = Math.min(1, Math.max(0, (s - a + 1) / 1.5));
  const t = Math.min(1, Math.max(0, (s - a) / (b - a)));
  return rise * (0.4 + 0.6 * t);
};
export const bendIn =
  (view: (d: P2) => { x: number; z: number }) =>
  (s: number, rail: number): RailOffset => {
    const [from, to] = TEARS[rail];
    const c = tornCurl(s, runS(from), runS(to), rail);
    const k = slidWeight(s);
    const push = (rail === 0 ? 0.35 : rail === 1 ? 0.3 : 0.18) * k;
    const run = view(BARRIER_W.dir);
    const back = view(BARRIER_W.trackSide);
    return {
      dx: c.along * run.x + (c.out - push) * back.x,
      dy: c.up - (rail === 0 ? 0.06 * k : 0),
      dz: c.along * run.z + (c.out - push) * back.z,
    };
  };
export const WRECK_BEND = bendIn(dirToView);
// A torn end (rail r at W x on the barrier, at the rail's middle height), as it lies in V.
export const railLip = (wx: number, rail: number) => {
  const p = toView({ x: wx, y: 0 });
  const o = WRECK_BEND(runS(wx), rail);
  return {
    x: p.x + o.dx,
    y: (RAILS[rail][0] + RAILS[rail][1]) / 2 + o.dy,
    z: p.z + o.dz,
  };
};
export const RUN_W = { from: RUN_FROM, to: RUN_TO };
// The rails' top edge (m, rails.ts).
export const TOP_RAIL_EDGE = RAILS[2][1];

// ── Fire, in V (WreckWorld) ────────────────────────────────────────────────────────────────────────────────────────
// The big fire burns over the cell's middle, beyond the barrier; a low fire along the gap in front of it; a third in
// the run-off between the cell's torn edge and the rear piece, where the fuel cell burst.
export const FIRES = {
  back: { x: CELL_FROM + 2.2, z: CELL_Z + 0.5, w: 4.2, h: 7.5 },
  front: { x: CELL_FROM + 2.4, z: CELL_Z - 1.2, w: 4.6, h: 1.6 },
  gap: { x: CELL_TO + 1.0, z: (CELL_Z + REAR_Z) / 2, w: 2.0, h: 3.4 },
};
// the same fires on the top view
export const FIRES_W = {
  back: fromView(FIRES.back),
  front: fromView(FIRES.front),
  gap: fromView(FIRES.gap),
};

// ── The FIA medical car (3.5's 11 秒 panel) ────────────────────────────────────────────────────────────────────────
// It followed the field round on lap 1 and stopped on the run-off short of the wreck, the rear half in front of it and
// the cell to its right (Roberts: "We just looked to the right … a big gap in the armco"). Where exactly is not known;
// schematic: heading along the run, its front bumper 3.6 m up the run from the gap, its centre line 6 m off the
// barrier.
export const MEDICAL_STOP_W = { front: { x: -3.6, y: -6.0 }, heading: 0 };
