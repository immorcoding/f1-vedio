// The ground round the barrier on the top view W (wreck-geometry.ts), so 3.3 can show what the car and the rails stand
// on and the 51° reads from the picture (review-2 #1): the run-off between the track's right edge and the barrier, as
// 3.2's map has it (CrashMap.tsx: the straight 2 × TRACK_HALF wide, the barrier parallel to it, PLAN_32.barrierY from
// the middle of the track), and the four tyre marks the sliding car lays down along its 29° path. Where the car scrapes
// the rails is here too: its right (far) side, from the right front-wing corner at the first touch on along the barrier
// as it slides through. Pure TypeScript, so the geometry diagram reads it from node.
import { VF20 } from "../../../cars/cars-2020.ts";
import { carPoint } from "../../../cars/spec.ts";
import { TRACK_HALF, WING_CORNER } from "./crash-geometry.ts";
import { PLAN_32 } from "./staging.ts";
import {
  IMPACT_POINT,
  L,
  LEFT_DIR,
  NOSE_DIR,
  PATH_DIR,
  RIGHT_DIR,
  type P2,
} from "./wreck-geometry.ts";

// W y of the track's right edge (the barrier is y = 0, the track side y < 0): the run-off is 3.2's, ~7.6 m wide.
export const RUNOFF_WIDTH = PLAN_32.barrierY - TRACK_HALF;
export const TRACK_EDGE_Y = -RUNOFF_WIDTH;
// the white line along the edge, as wide as 3.2 draws it (12 px at 42 px/m), on the track side of the edge
export const EDGE_LINE = 0.29;
export const TRACK_FAR_Y = TRACK_EDGE_Y - 2 * TRACK_HALF;

// The far (right) side of the car where it scrapes the barrier, `travel` metres along the path from the first touch:
// the barrier point (W x, y = 0) where the car's right side crosses the rail line. On the touch it is the right
// front-wing corner (IMPACT_POINT); it then slides on along the rails at PATH·x − NOSE·x·PATH·y / NOSE·y metres per
// metre of travel (≈ 0.48) while the nose goes through.
const SCRAPE_RATE = PATH_DIR.x - (NOSE_DIR.x * PATH_DIR.y) / NOSE_DIR.y;
export const scrapeAt = (travel: number): P2 => ({
  x: IMPACT_POINT.x + travel * SCRAPE_RATE,
  y: 0,
});

// The tyre marks: each tyre slides along the path (29° to the barrier), so its mark is a line along PATH_DIR through
// where the tyre was on the first touch. Tyre centres 0.8 m (rear) and 0.85 m (front) out from the centre line (as
// crash-geometry.ts); the axles from the trace. 3.3 draws them from the tyres as its car is drawn (Impact.tsx).
const REAR_AXLE = carPoint(VF20, "rearAxle").x;
const FRONT_AXLE = carPoint(VF20, "frontAxle").x;
export const tyresAtTouch = (): P2[] => {
  // the whole car on the first touch: its right front-wing corner on the rails
  const rear = {
    x:
      IMPACT_POINT.x -
      RIGHT_DIR.x * WING_CORNER.out -
      NOSE_DIR.x * (L - WING_CORNER.back),
    y:
      IMPACT_POINT.y -
      RIGHT_DIR.y * WING_CORNER.out -
      NOSE_DIR.y * (L - WING_CORNER.back),
  };
  return [
    [REAR_AXLE, 0.8],
    [REAR_AXLE, -0.8],
    [FRONT_AXLE, 0.85],
    [FRONT_AXLE, -0.85],
  ].map(([m, out]) => ({
    x: rear.x + NOSE_DIR.x * m + LEFT_DIR.x * out,
    y: rear.y + NOSE_DIR.y * m + LEFT_DIR.y * out,
  }));
};
