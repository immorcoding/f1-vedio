// The car library: traced car data (CarSpec) and the one renderer that draws any of them (MangaCar), from the side
// or from above (view "top").
// Usage: <MangaCar car={RB16B} at={camera.anchor({ x, z })} state={{ wheelAngle, lockFront, tilt }} />
//        <MangaCar car={RB16B} view="top" at={view.anchor(rearEnd)} state={{ heading, steer }} />
import { RB16B, W12 } from "./cars-2021";
import { AT01, VF20 } from "./cars-2020";
import { CARS_2008 } from "./cars-2008";
import { MP4_5_PRO, MP4_5_SEN } from "./cars-1989";
import { F641_PRO, MP4_5B_SEN } from "./cars-1990";
import { FW43B } from "./fw43b";
import type { CarSpec, TopOnlyCar } from "./spec";

export {
  MangaCar,
  CarInPhotoSpace,
  DriverHelmet,
  type CarState,
  type CarView,
  type PiecePose,
  type Tread,
} from "./MangaCar";
export { TopCar, topAnchorAt, wheelbaseMiddle } from "./TopCar";
export { modernPlan, modernPlanFrom, planOf } from "./plan";
export {
  carLength,
  carPoint,
  isTopOnly,
  CAR_UNITS_PER_METRE,
  type Accent,
  type CarLandmark,
  type CarPlan,
  type CarSpec,
  type Driver,
  type TopMarks,
  type PlanLengths,
  type TopOnlyCar,
} from "./spec";
export { PIRELLI_2021, RB16B, W12 } from "./cars-2021";
export { FW43B } from "./fw43b";
export { AT01, GRO_2020, KVY_2020, PIRELLI_2020, VF20 } from "./cars-2020";
export { CARS_2008, F2008, MP4_23, STR3, TF108 } from "./cars-2008";
export { MP4_5, MP4_5_PRO, MP4_5_SEN, PRO_1989, SEN_1989 } from "./cars-1989";
export {
  BER_1990,
  F641,
  F641_MAN,
  F641_PRO,
  MAN_1990,
  MP4_5B_BER,
  MP4_5B_SEN,
  PRO_1990,
  SEN_1990,
} from "./cars-1990";

// Every traced car by id, for the asset sheets and the Trace/Art check stills.
export const CARS = {
  W12,
  RB16B,
  VF20,
  AT01,
  ...CARS_2008,
  "MP45-SEN": MP4_5_SEN,
  "MP45-PRO": MP4_5_PRO,
  "F641-PRO": F641_PRO,
  "MP45B-SEN": MP4_5B_SEN,
} satisfies Record<string, CarSpec>;
export type CarId = keyof typeof CARS;

// Cars drawn only from above (no side trace), for the top-view sheets.
export const TOP_ONLY_CARS = { FW43B } satisfies Record<string, TopOnlyCar>;
export type TopOnlyCarId = keyof typeof TOP_ONLY_CARS;
