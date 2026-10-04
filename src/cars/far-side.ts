// Where the far side of a side-view car shows (ART-17, ART-26): its wheels and wing endplates, worked out with the
// pinhole camera the panel is drawn through (src/kit/camera.ts).
//
// A far part is its near twin moved one width W across the car, away from the camera (W = the track for a wheel,
// the wing span for an endplate). A level pinhole camera at distance z draws everything at z + W at s = z / (z + W)
// of the size, pulled toward the vanishing point (the horizon at the camera's height, on the optical axis):
//   far = VP + (near − VP) · s.
// So a far part shows (1 − s)·(camera height − part height) above its near twin, at s of its size. A far wheel
// rises above its near wheel's top by (1 − s)·(camera height − tyre top): from a camera at or below tyre-top height
// it is wholly behind the near wheel; it peeks out only as the camera rises above that.
//
// The far wheel stays at its near wheel's x (the convergence toward the optical axis is left out, so a car drawn
// side-on shows its far wheels straight behind the near ones, as the user approved on the STR3) unless the scene
// gives the axis' place along the car (`CarCamera.axisAt`).
import type { Camera } from "../kit/camera";
import { planOf } from "./plan";
import { photoPxPerMetre, type CarSpec, type Wheel } from "./spec";

// The camera a side-view car is seen from (CarState.camElevation / camDistance / camAxisAt).
export type CarCamera = {
  // Degrees above the car's axle height, seen from the car's near side; 0 = a dead-level camera at axle height.
  elevation: number;
  // Metres from the camera to the car's near side.
  distance: number;
  // Where the camera's optical axis crosses the car, metres forward from its rear end; leave it out for a camera
  // square to each part (far parts straight behind the near ones).
  axisAt?: number;
};

// A car drawn without a scene camera (asset sheets, panels drawn without a pinhole): a low trackside camera 10 m away,
// 0.17 m above the axles (about 0.5 m up, below the tyre tops). The far wheels sit wholly behind the near ones (the
// STR3 look the user approved, 2026-10-04) and the far front endplate shows as a sliver of 2–3 cm along its top edge
// (ART-17).
export const DEFAULT_CAR_CAMERA: CarCamera = { elevation: 1, distance: 10 };

// The camera of a car drawn with `camera.anchor(p)` at depth p.z: its elevation over the car's axles and its
// distance. Pass the result's fields into CarState (`{ ...carCamera(car, cam, z), wheelAngle }`).
export const carCamera = (
  car: CarSpec,
  cam: Camera,
  z: number,
): { camElevation: number; camDistance: number } => ({
  camElevation: (Math.atan2(cam.height - axleHeight(car), z) * 180) / Math.PI,
  camDistance: z,
});

// The car's own axle height, m (the near wheels' mean centre).
export const axleHeight = (car: CarSpec) =>
  (car.frame.ground - (car.nearWheels[0].cy + car.nearWheels[1].cy) / 2) /
  photoPxPerMetre(car);

// How far the far side lies behind the near side, m: wheel track (front, rear) and the endplates' spacing (the wing
// spans), from the car's top-view planform.
export const farSideWidths = (car: CarSpec) => {
  const plan = planOf(car);
  const track = (steer: boolean) =>
    2 *
    Math.max(
      ...plan.wheels
        .filter((w) => !!w.steer === steer)
        .map((w) => Math.abs(w.y)),
    );
  return {
    frontTrack: track(true),
    rearTrack: track(false),
    frontWing: 2 * maxAbsY(plan.frontWing.deck),
    rearWing: 2 * maxAbsY(plan.rearWing.top),
  };
};

// The far twin of a near part `width` metres behind it, as a map of photo-space points: p → o + p · s.
export type FarCopy = { s: number; ox: number; oy: number };

// `x` is the part's own x in photo px (where it stays, unless the camera gives its axis).
export const farCopy = (
  car: CarSpec,
  cam: CarCamera,
  width: number,
  x: number,
): FarCopy => {
  const ppm = photoPxPerMetre(car);
  const z = Math.max(cam.distance, 0.5);
  const s = z / (z + width);
  const height =
    axleHeight(car) + z * Math.tan((cam.elevation * Math.PI) / 180);
  const vpY = car.frame.ground - height * ppm;
  const vpX = cam.axisAt === undefined ? x : car.frame.x - cam.axisAt * ppm;
  return { s, ox: vpX * (1 - s), oy: vpY * (1 - s) };
};

export const farCopyTransform = (c: FarCopy) =>
  `translate(${c.ox} ${c.oy}) scale(${c.s})`;

// The far wheels (front, rear) as drawn from this camera.
export const farWheelsFor = (car: CarSpec, cam: CarCamera): [Wheel, Wheel] => {
  const w = farSideWidths(car);
  return car.nearWheels.map((near, i) => {
    const c = farCopy(car, cam, i === 0 ? w.frontTrack : w.rearTrack, near.cx);
    return {
      cx: c.ox + near.cx * c.s,
      cy: c.oy + near.cy * c.s,
      r: near.r * c.s,
    };
  }) as [Wheel, Wheel];
};

// The far endplate of a wing (near outline `near`, wing span `span` m) as drawn from this camera: an SVG transform
// for paths in the near endplate's coordinates.
export const farEndplateTransform = (
  car: CarSpec,
  cam: CarCamera,
  near: string,
  span: number,
) => {
  const xs = pathNumbers(near).filter((_, i) => i % 2 === 0);
  const mid = (Math.min(...xs) + Math.max(...xs)) / 2;
  return farCopyTransform(farCopy(car, cam, span, mid));
};

// The camera a car state asks for (the default when it gives none).
export const cameraOf = (state: {
  camElevation?: number;
  camDistance?: number;
  camAxisAt?: number;
}): CarCamera => ({
  elevation: state.camElevation ?? DEFAULT_CAR_CAMERA.elevation,
  distance: state.camDistance ?? DEFAULT_CAR_CAMERA.distance,
  axisAt: state.camAxisAt,
});

const pathNumbers = (d: string) =>
  d
    .replace(/[A-Za-z]/g, " ")
    .trim()
    .split(/[\s,]+/)
    .map(Number);

const maxAbsY = (d: string) =>
  Math.max(
    ...pathNumbers(d)
      .filter((_, i) => i % 2 === 1)
      .map(Math.abs),
  );
