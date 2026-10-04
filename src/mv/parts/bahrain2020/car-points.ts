// Screen position of a point on the traced VF-20 (photo pixel space, the car faces left) as MangaCar draws it, for a car
// anchored at `at` and, for a broken car, moved by a piece pose (CarState.split). Lets effects land on the car: the
// fireball on the break, the halo, the torn edge.
import { VF20 } from "../../../cars/cars-2020.ts";
import type { PiecePose } from "../../../cars/MangaCar";
import type { ScreenAnchor } from "../../../kit/camera";

const PPM_PHOTO = 250 / VF20.frame.k;

const nums = (VF20.breakLine ?? "")
  .replace(/[ML]/g, " ")
  .trim()
  .split(/\s+/)
  .map(Number);
const bx = nums.filter((_, i) => i % 2 === 0);
const by = nums.filter((_, i) => i % 2 === 1);
// Middle of the break line: the pivot of the pieces' poses, and where the fuel cell burst.
export const BREAK_PIVOT = {
  x: (Math.min(...bx) + Math.max(...bx)) / 2,
  y: (Math.min(...by) + Math.max(...by)) / 2,
};

export const carPointOnScreen = (
  at: ScreenAnchor,
  p: { x: number; y: number },
  pose: PiecePose = {},
  // as MangaCar's `facing`: the trace faces left; facing right it is mirrored about `at`
  facing: "left" | "right" = "left",
) => {
  const a = ((pose.rotate ?? 0) * Math.PI) / 180;
  const rx = p.x - BREAK_PIVOT.x;
  const ry = p.y - BREAK_PIVOT.y;
  const q = {
    x:
      BREAK_PIVOT.x +
      rx * Math.cos(a) -
      ry * Math.sin(a) -
      (pose.dx ?? 0) * PPM_PHOTO,
    y:
      BREAK_PIVOT.y +
      rx * Math.sin(a) +
      ry * Math.cos(a) -
      (pose.dy ?? 0) * PPM_PHOTO,
  };
  const k = (VF20.frame.k * at.pxPerMetre) / 250;
  return {
    x: at.x + (facing === "left" ? 1 : -1) * (q.x - VF20.frame.x) * k,
    y: at.y + (q.y - VF20.frame.ground) * k,
  };
};
