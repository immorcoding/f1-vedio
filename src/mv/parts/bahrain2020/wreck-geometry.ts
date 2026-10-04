// Where the wreck lies, in the world metres of the trackside camera (3.4–3.6): the barrier line, the survival cell
// through it, the torn-off rear on the track side, and the halo. Pure TypeScript, so the staging and the
// interpenetration check can read it from node. x along the barrier, z away from the camera (pinhole, kit/camera.ts).
import { VF20 } from "../../../cars/cars-2020.ts";
import { carLength } from "../../../cars/spec.ts";

export const BARRIER_Z = 13;
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

// The barrier as the impact left it (3.4–3.6), shared by the picture (Wreck.tsx) and the staging (escape-staging.ts:
// GRO's hands and seat land on the real top edge where he climbs). The barrier runs along x at BARRIER_Z; the cell
// broke the middle rail over its length and went through it; the top rail is prised up and back over the nose, the
// bottom one pressed down (FIA summary: the middle rail failed, the upper and lower rails deformed heavily).
export type RailOffset = { dx: number; dy: number; dz: number };
// A smooth bump: 1 at s = c, falling off over `width` metres either side.
export const bump = (s: number, c: number, width: number) =>
  Math.exp(-(((s - c) / width) ** 2));
export const RUN = { a: { x: -30, z: BARRIER_Z }, b: { x: 30, z: BARRIER_Z } };
export const CELL_FROM = CELL_ANCHOR_X - L - CELL_POSE.dx; // nose
export const CELL_TO = CELL_ANCHOR_X - 2.4 - CELL_POSE.dx; // torn edge
const S_NOSE = CELL_FROM + 1.0 - RUN.a.x;
const S_CELL = (CELL_FROM + CELL_TO) / 2 - RUN.a.x;
// World offset of rail r (0 bottom, 1 middle, 2 top) at s metres along the run.
export const WRECK_BEND = (s: number, rail: number): RailOffset => {
  if (rail === 2) {
    const k = bump(s, S_NOSE, 0.7);
    return { dx: 0, dy: 0.26 * k, dz: 0.45 * k };
  }
  const k = bump(s, S_CELL, 2.2);
  return rail === 0
    ? { dx: 0, dy: -0.08 * k, dz: 0.4 * k }
    : { dx: 0, dy: 0, dz: 0.3 * k };
};
// The top rail's upper edge (m, night.tsx RAILS) and its depth at world x, as the wreck left it.
export const TOP_RAIL_EDGE = 1.05;
export const topRailAt = (x: number) => {
  const o = WRECK_BEND(x - RUN.a.x, 2);
  return { y: TOP_RAIL_EDGE + o.dy, z: BARRIER_Z + o.dz };
};
