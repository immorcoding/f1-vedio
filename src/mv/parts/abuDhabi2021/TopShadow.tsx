// A top-view car's contact shadow, as Suzuka 1.3 draws it (Chicane.tsx): a rounded ink block the car's length by
// 1.9 m, 28 % ink, turned with the car's heading on screen and offset 0.35 m right and 0.45 m down the screen (the same
// light for every top view of the film), leaning 0.25 m with the body roll in a corner. Draw it before the car. `at`
// is the car's wheelbase middle on screen (what topAnchorAt takes); `ppm` the drawn px per metre of the car.
import { carLength, carPoint, type CarSpec } from "../../../cars";
import { INK } from "../../../kit/colors";
import { poseAt } from "../../../tracks";
import type { Track } from "../../../tracks/track";

export const TopShadow: React.FC<{
  car: CarSpec;
  at: { x: number; y: number };
  heading: number; // screen degrees, clockwise from screen right
  ppm: number;
  roll?: number; // −1..1, from rollAt
}> = ({ car, at, heading, ppm, roll = 0 }) => {
  const len = carLength(car);
  const midWheelbase =
    (carPoint(car, "rearAxle").x + carPoint(car, "frontAxle").x) / 2;
  const ahead = len / 2 - midWheelbase; // footprint centre ahead of the wheelbase middle, m
  const a = (heading * Math.PI) / 180;
  const cx = at.x + Math.cos(a) * ahead * ppm + 0.35 * ppm;
  const cy = at.y + Math.sin(a) * ahead * ppm + (0.45 - 0.25 * roll) * ppm;
  return (
    <rect
      x={-(len / 2) * 0.98 * ppm}
      y={-0.95 * ppm}
      width={len * 0.98 * ppm}
      height={1.9 * ppm}
      rx={0.5 * ppm}
      fill={INK}
      opacity={0.28}
      transform={`translate(${cx} ${cy}) rotate(${heading})`}
    />
  );
};

// The body roll a shadow leans with (Suzuka 1.3: lateral acceleration / 30 m/s², clamped): speed v (m/s, real) times
// the path's curvature at s, measured over ±6 m of the track.
export const rollAt = (track: Track, s: number, v: number) => {
  let dh = poseAt(track, s + 6).heading - poseAt(track, s - 6).heading;
  while (dh > 180) dh -= 360;
  while (dh < -180) dh += 360;
  const curvature = (dh * Math.PI) / 180 / 12;
  return Math.max(-1, Math.min(1, (v * v * curvature) / 30));
};
