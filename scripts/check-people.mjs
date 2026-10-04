// ART-30: the people skeleton stands at real height. A straight standing pose (pelvis and chest upright, feet flat)
// must put the hip joint at 0.92 m, the waist at 1.07, the shoulder joint at 1.46, the base of the neck at 1.51 and
// the top of the skull at 1.78, so people stay in scale with the cars and rails (ART-9).
import { BONES, solve, v } from "../src/kit/people/skeleton.ts";

const TOL = 0.015; // m
const hipY = BONES.ankle + BONES.shin + BONES.thigh - 0.01; // knees a hair short of locked
const foot = { ankle: v(0, BONES.ankle), pitch: 0 };
const arm = { shoulder: 0, elbow: 0 };
const body = solve({
  hip: v(0, hipY),
  pelvis: 0,
  chest: 0,
  head: 0,
  feet: { near: foot, far: foot },
  arms: { near: arm, far: arm },
});
const skullTop = body.neck.y + BONES.headUp + BONES.skullTop;
const want = [
  ["hip joint", body.hip.y, 0.92],
  ["waist", body.waist.y, 1.07],
  ["shoulder joint", body.shoulder.y, 1.46],
  ["base of the neck", body.neck.y, 1.51],
  ["top of the skull", skullTop, 1.78],
];
let bad = 0;
for (const [name, got, at] of want) {
  const ok = Math.abs(got - at) <= TOL;
  if (!ok) bad++;
  console.log(`${ok ? "ok  " : "FAIL"} ${name}: ${got.toFixed(3)} m (want ${at} ± ${TOL})`);
}
if (bad) {
  console.error(`${bad} height(s) off: the skeleton no longer stands 1.78 m (ART-30)`);
  process.exit(1);
}
console.log("No problems found");
