// The car library: traced car data (CarSpec) and the one renderer that draws any of them (MangaCar).
// Usage: <MangaCar car={RB16B} at={camera.anchor({ x, z })} state={{ wheelAngle, lockFront, tilt }} />
import { RB16B, W12 } from "./cars-2021";
import { AT01, VF20 } from "./cars-2020";
import type { CarSpec } from "./spec";

export {
  MangaCar,
  CarInPhotoSpace,
  type CarState,
  type CarView,
} from "./MangaCar";
export {
  carLength,
  carPoint,
  CAR_UNITS_PER_METRE,
  type CarLandmark,
  type CarSpec,
  type Driver,
} from "./spec";
export { PIRELLI_2021, RB16B, W12 } from "./cars-2021";
export { AT01, GRO_2020, KVY_2020, PIRELLI_2020, VF20 } from "./cars-2020";

// Every traced car by id, for the asset sheets and the Trace/Art check stills.
export const CARS = { W12, RB16B, VF20, AT01 } satisfies Record<
  string,
  CarSpec
>;
export type CarId = keyof typeof CARS;
