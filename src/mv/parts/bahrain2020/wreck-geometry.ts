// Where the wreck lies, in the world metres of the trackside camera (3.4–3.6): the barrier line, the survival cell
// through it, the torn-off rear on the track side, and the halo. Pure TypeScript, so the staging and the
// interpenetration check can read it from node. x along the barrier, z away from the camera (pinhole, kit/camera.ts).
import { VF20 } from "../../../cars/cars-2020.ts";
import { carLength } from "../../../cars/spec.ts";

export const BARRIER_Z = 13;
// Camera of shot 3.4 (Wreck.tsx WRECK_CAM): 1 m up at the track edge, long lens, looking square at the barrier 13 m
// away. Every shot of the wreck is a zoomed copy of it (zoomCam), which keeps screen positions in proportion, so the
// staging can work in this one.
export const WRECK_CAM_SPEC = { f: 2300, horizon: 420, cx: 960, height: 1.0 };
// The survival cell went through the barrier and lodged in it: its near side (half the 2.0 m width) just behind the
// rails, so nobody on the track side stands inside it.
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

// Where the halo is, for the close-ups: the near halo bar's middle, from the trace (photo 880, 515), on the posed cell.
const HALO_FROM_REAR = (VF20.frame.x - 880) / (250 / VF20.frame.k);
const HALO_HEIGHT = (VF20.frame.ground - 515) / (250 / VF20.frame.k);
export const HALO_WORLD = {
  x: CELL_ANCHOR_X - HALO_FROM_REAR - CELL_POSE.dx,
  y: HALO_HEIGHT - 0.12,
  z: CELL_Z,
};

// The two pieces on the ground, for the interpenetration check: x span (world), depth z, 2.0 m wide. The break runs
// down the engine bulkhead (VF20.breakLine, photo x ≈ 1190).
const PPM_PHOTO = 250 / VF20.frame.k;
const BREAK_FROM_REAR = (VF20.frame.x - 1190) / PPM_PHOTO;
export const CELL_SPAN = {
  from: CELL_ANCHOR_X - L - CELL_POSE.dx,
  to: CELL_ANCHOR_X - BREAK_FROM_REAR - CELL_POSE.dx,
  z: CELL_Z,
};
export const REAR_SPAN = {
  from: REAR_ANCHOR_X - BREAK_FROM_REAR,
  to: REAR_ANCHOR_X,
  z: REAR_Z,
};

// ── The cell as it is drawn ──────────────────────────────────────────────────────────────────────────────────────
// The traced photo looks down on the car a little (its far wheels stand 180 photo px above the near ones), so every
// point on the car's centre line shows about 90 photo px (0.31 m) higher than a pure side elevation would put it.
// MangaCar anchors the sprite's near-wheel ground on the camera's ground at CELL_Z. A person standing in the cockpit
// therefore stands on the sprite's centre-line ground, CELL_RISE above the camera's ground at CELL_Z: that keeps him
// in proportion with the halo and the cockpit as drawn (heights below are measured from there).
export const PPM = PPM_PHOTO;
export const CELL_RISE = 90 / PPM_PHOTO;
const breakNums = (VF20.breakLine ?? "")
  .replace(/[ML]/g, " ")
  .trim()
  .split(/\s+/)
  .map(Number);
const BX = breakNums.filter((_, i) => i % 2 === 0);
const BY = breakNums.filter((_, i) => i % 2 === 1);
// the point the front piece turns about (MangaCar's breakPivot)
export const CELL_PIVOT = {
  x: (Math.min(...BX) + Math.max(...BX)) / 2,
  y: (Math.min(...BY) + Math.max(...BY)) / 2,
};
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
const cubic = (p: number[], t: number) => {
  const u = 1 - t;
  return [0, 1].map(
    (i) =>
      u * u * u * p[i] +
      3 * u * u * t * p[2 + i] +
      3 * u * t * t * p[4 + i] +
      t * t * t * p[6 + i],
  );
};
// The cockpit as drawn (photo y of the body's top edge along the opening: 572–574; the seat floor 0.08 m above the
// centre-line ground). Measured from the centre-line ground: rim 0.67 m, halo hoop top 0.86 m (0.91 m before the cell
// pitched 3° nose-down into the rails) — a real 2020 car: cockpit rim about 0.65 m, halo top about 0.9 m.
export const COCKPIT_FLOOR = cellPoint(1000, 765 - 0.08 * PPM_PHOTO).y;
export const COCKPIT_RIM = cellPoint(1000, 574).y;
// where GRO's hands hold the halo: the far hand on the central pillar (the near halo path's curve, VF20.halo), the
// near hand on the hoop's near side
const PILLAR = [764, 562, 785, 530, 815, 506, 852, 503];
const [PX, PY] = cubic(PILLAR, 0.8);
export const HALO_PILLAR_GRIP = cellPoint(PX, PY);
export const HALO_HOOP_GRIP = cellPoint(897, 518);
// the hoop's near side, front (top) to rear foot, for the layering checks
export const HALO_HOOP = [cellPoint(852, 503), cellPoint(1012, 556)];
// Everything above the cell's top edge round the cockpit, in photo space (draw it through the cell's own transform):
// the part of a person in the cockpit that shows above the near side.
export const COCKPIT_CLIP_PHOTO =
  "M 560 -4000 L 1240 -4000 L 1240 459 L 1062 459 L 1062 540 L 1040 546 L 1030 574 L 790 572 L 765 548 L 560 548 Z";

// ── The barrier as the impact left it (3.4–3.6) ─────────────────────────────────────────────────────────────────
// Shared by the picture (Wreck.tsx) and the staging (escape-staging.ts). The barrier runs along x at BARRIER_Z. The
// survival cell punched through it and the barrier split (FIA summary: the middle rail failed, the upper and lower
// rails deformed heavily, the cell pierced the barrier): the middle rail is gone over the cell's length, the top rail
// is torn open over the cockpit — its jagged ends curled up, out and back toward the track — and the bottom rail is
// pressed down and back under the cell. Through the tear the cockpit, the halo and the helmet are in plain view.
export type RailOffset = { dx: number; dy: number; dz: number };
// A smooth bump: 1 at s = c, falling off over `width` metres either side.
export const bump = (s: number, c: number, width: number) =>
  Math.exp(-(((s - c) / width) ** 2));
export const RUN = { a: { x: -30, z: BARRIER_Z }, b: { x: 30, z: BARRIER_Z } };
const RUN_LEN = RUN.b.x - RUN.a.x;
export const CELL_FROM = CELL_ANCHOR_X - L - CELL_POSE.dx; // nose
export const CELL_TO = CELL_ANCHOR_X - 2.4 - CELL_POSE.dx; // torn edge
const S_CELL = (CELL_FROM + CELL_TO) / 2 - RUN.a.x;
// The torn stretches, world x: the middle rail over the cell, the top rail over the cockpit (from just ahead of the
// halo's pillar to behind the headrest).
export const MID_TEAR = [CELL_FROM + 0.9, CELL_TO + 0.5] as const;
export const TOP_TEAR = [HALO_PILLAR_GRIP.x - 0.6, cellPoint(1068, 512).x + 0.3] as const;
// per rail (0 bottom, 1 middle, 2 top), the torn stretches as fractions of the run (BentGuardrail's `gaps`)
export const along = (x: number) => (x - RUN.a.x) / RUN_LEN;
export const WRECK_GAPS: [number, number][][] = [
  [],
  [[along(MID_TEAR[0]), along(MID_TEAR[1])]],
  [[along(TOP_TEAR[0]), along(TOP_TEAR[1])]],
];
// A torn end curls: the last `reach` metres of rail before the tear bend up, back toward the track and away from the
// gap, growing as the square toward the jagged end.
const CURL = 0.9;
const curl = (s: number, from: number, to: number, up: number, out: number) => {
  const d = Math.min(Math.abs(s - from), Math.abs(s - to));
  const inside = s > from && s < to;
  const q = inside ? 1 : Math.max(0, 1 - d / CURL) ** 2;
  const away = s <= from ? -1 : 1; // which way is away from the gap
  return { dx: away * 0.12 * q, dy: up * q, dz: -out * q };
};
// World offset of rail r (0 bottom, 1 middle, 2 top) at s metres along the run.
export const WRECK_BEND = (s: number, rail: number): RailOffset => {
  if (rail === 2)
    return curl(s, TOP_TEAR[0] - RUN.a.x, TOP_TEAR[1] - RUN.a.x, 0.22, 0.32);
  if (rail === 1) {
    const k = bump(s, S_CELL, 2.2);
    const c = curl(s, MID_TEAR[0] - RUN.a.x, MID_TEAR[1] - RUN.a.x, 0.1, 0.25);
    return { dx: c.dx, dy: c.dy, dz: 0.3 * k + c.dz };
  }
  const k = bump(s, S_CELL, 2.2);
  return { dx: 0, dy: -0.08 * k, dz: 0.4 * k };
};
// The rails' upper edges (m, night.tsx RAILS) and the bottom rail's top edge at world x, as the wreck left it: what is
// left between the cockpit and the track where the top two rails are torn away.
export const TOP_RAIL_EDGE = 1.05;
export const BOTTOM_RAIL_EDGE = 0.425;
export const bottomRailAt = (x: number) => {
  const o = WRECK_BEND(x - RUN.a.x, 0);
  return { y: BOTTOM_RAIL_EDGE + o.dy, z: BARRIER_Z + o.dz };
};
