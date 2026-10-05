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

// The barrier runs on, unbroken, far up the run: the wreck model's RUN starts 45 m up (wreck-geometry.ts), so 3.3
// draws the rest of it from here to there, out to the vanishing point (no rail ends in the picture).
export const BARRIER_FAR_X = -1500;

// Behind the barrier: the infield of the circuit (the straight from turn 3 to turn 4 runs along the infield's north
// edge; the barrier is on the inside of the circuit). On the Planet Labs SkySat image (2017-11-02, ~0.77 m a pixel,
// docs/assets/reference-register.md), next to the crash site: a paved strip about 5 m wide right behind the barrier,
// then bare desert sand with small trees dotted over it, one every ~15–20 m, crowns 4–5 m across. The floodlight
// poles of this straight stand on the far (north) side of the track, behind the camera. No source shows a debris
// fence, a tyre wall or a hoarding on this side in 2020 (the two rows of tyres came a week later, for the Sakhir GP),
// so none are drawn. The trees on a jittered 17 m grid, keeping clear of the wreck and the gap (where 3.4 burns).
export const SERVICE_STRIP = { from: 0.6, to: 5.6 }; // W y, behind the barrier
export type Shrub = { at: P2; h: number; w: number; seed: number };
const hash = (i: number, k: number) => {
  const h = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return h - Math.floor(h);
};
export const SHRUBS: Shrub[] = (() => {
  const out: Shrub[] = [];
  const STEP = 17;
  let i = 0;
  for (let gy = 0; gy < 18; gy++)
    for (let gx = 0; gx < 60; gx++) {
      i++;
      const at = {
        x: -860 + gx * STEP + (hash(i, 1) - 0.5) * STEP * 0.9,
        y: 10 + gy * STEP + (hash(i, 2) - 0.5) * STEP * 0.9,
      };
      // clear of the wreck, the torn gap and the fire (3.4–3.6 stage everything within ~10 m of the gap)
      if (at.y < 8 || (Math.abs(at.x) < 14 && at.y < 16)) continue;
      const h = 2.2 + hash(i, 3) * 1.4;
      out.push({ at, h, w: h * (1.3 + hash(i, 4) * 0.3), seed: i });
    }
  return out;
})();

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
