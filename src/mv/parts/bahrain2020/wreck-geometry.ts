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
