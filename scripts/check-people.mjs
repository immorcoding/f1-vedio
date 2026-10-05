// ART-30: the people skeleton stands at real height. A straight standing pose (pelvis and chest upright, feet flat)
// must put the hip joint at 0.92 m, the waist at 1.07, the shoulder joint at 1.46, the base of the neck at 1.51 and
// the top of the skull at 1.78, so people stay in scale with the cars and rails (ART-9).
// MOT-7 / ART-16: GRO stepping down off the car in 3.6 (climbOutOfCockpit from its turn on) moves like a body can:
// every foot is reached (a planted foot is not dragged off its hold), no foot is higher than just under its hip, no
// thigh swings back behind the pelvis (the knee bends forward only), and both feet stay put on the rim while he turns.
import { BONES, angleOf, len, solve, sub, v } from "../src/kit/people/skeleton.ts";
import { EXIT_TURN } from "../src/kit/people/motion.ts";
import { exitAt } from "../src/mv/parts/bahrain2020/escape-staging.ts";
import { pinhole } from "../src/kit/camera.ts";
import { WRECK_CAM_SPEC } from "../src/mv/parts/bahrain2020/wreck-geometry.ts";

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

const cam = pinhole(WRECK_CAM_SPEC);
const MAX_EXT = 10; // deg a thigh may swing back of the pelvis's down line
const BELOW = 0.12; // m a foot stays under its hip
const legProblems = [];
for (let u = EXIT_TURN; u < 1; u += 0.002) {
  const e = exitAt(cam, u);
  const b = solve(e.pose);
  for (const side of ["near", "far"]) {
    const l = b.legs[side];
    const miss = len(sub(l.ankle, e.pose.feet[side].ankle));
    const ext = b.pelvis - angleOf(sub(l.knee, l.hip));
    const under = l.hip.y - l.ankle.y;
    const at = `u ${u.toFixed(3)} ${side} leg`;
    if (miss > 0.002) legProblems.push(`${at}: foot ${(miss * 100).toFixed(1)} cm off its target (out of reach)`);
    if (ext > MAX_EXT) legProblems.push(`${at}: thigh ${ext.toFixed(0)}° back of the pelvis`);
    if (under < BELOW) legProblems.push(`${at}: foot only ${under.toFixed(2)} m under the hip`);
  }
}
// the turn on the rim: both feet stay where they are on screen
const screenFoot = (u, side) => {
  const e = exitAt(cam, u);
  const k = e.facing === "left" ? -1 : 1;
  const a = e.pose.feet[side].ankle;
  return v(k * a.x * e.s, a.y * e.s);
};
for (const side of ["near", "far"]) {
  const d = len(sub(screenFoot(EXIT_TURN - 1e-6, side), screenFoot(EXIT_TURN, side)));
  if (d > 2) legProblems.push(`the ${side} foot moves ${d.toFixed(1)} px as he turns on the rim`);
}
for (const p of legProblems.slice(0, 20)) console.log(`FAIL ${p}`);
console.log(`GRO's step down (3.6): ${legProblems.length ? `${legProblems.length} problem(s)` : "legs ok"}`);
if (legProblems.length) process.exit(1);
console.log("No problems found");
