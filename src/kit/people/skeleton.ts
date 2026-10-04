// The people module's skeleton (ART-16): a side-on body at real proportions (1.78 m), posed by a few numbers —
// where the hip is, how the pelvis and ribcage lean, where each foot stands and where each hand goes — and solved into
// joints with two-bone IK, so feet can be planted on the ground (MOT-5) and hands put on a car, a shoulder or a hose.
// Units are metres in the figure's own frame: origin on the ground under the hip at rest, x forward, y up.
// Pure TypeScript with no React, so staging files and node checks (scripts/check-overlap.mjs) can load it.

export type V = { x: number; y: number };
export const v = (x: number, y: number): V => ({ x, y });
export const add = (a: V, b: V): V => ({ x: a.x + b.x, y: a.y + b.y });
export const sub = (a: V, b: V): V => ({ x: a.x - b.x, y: a.y - b.y });
export const mul = (a: V, k: number): V => ({ x: a.x * k, y: a.y * k });
export const len = (a: V) => Math.hypot(a.x, a.y);
export const lerpV = (a: V, b: V, u: number): V => ({
  x: a.x + (b.x - a.x) * u,
  y: a.y + (b.y - a.y) * u,
});
export const norm = (a: V): V => {
  const l = len(a) || 1e-9;
  return { x: a.x / l, y: a.y / l };
};
const RAD = Math.PI / 180;
// Rotate a vector that is "up" in a body part's own frame by that part's lean: + leans forward (clockwise on screen
// for a figure facing right). lean(v(0, 1), a) = (sin a, cos a).
export const lean = (p: V, deg: number): V => {
  const c = Math.cos(deg * RAD);
  const s = Math.sin(deg * RAD);
  return { x: p.x * c + p.y * s, y: -p.x * s + p.y * c };
};
// A direction `deg` from straight down, + swung forward.
export const down = (deg: number, l = 1): V => ({
  x: Math.sin(deg * RAD) * l,
  y: -Math.cos(deg * RAD) * l,
});
export const angleOf = (d: V) => Math.atan2(d.x, -d.y) / RAD; // inverse of down()

// Bone lengths, m (stature 1.78 m: hip joint 0.92, knee 0.50, ankle 0.08, shoulder joint 1.45).
export const BONES = {
  thigh: 0.43,
  shin: 0.42,
  upperArm: 0.3,
  forearm: 0.26,
  ankle: 0.08, // ankle above the sole
  heel: v(-0.06, -0.08), // heel contact, relative to the ankle (foot flat)
  ball: v(0.14, -0.08), // ball of the foot, relative to the ankle
  toe: v(0.205, -0.065),
  waist: 0.15, // hip joint to waist, along the pelvis
  shoulder: v(-0.005, 0.335), // shoulder joint in the ribcage frame (origin at the waist)
  neck: v(-0.02, 0.385), // base of the neck in the ribcage frame
};
export const LEG = BONES.thigh + BONES.shin;

// Hand shapes. fist: fingers curled, thumb across them; flat: fingers together and straight, thumb apart (a palm on a
// car, a hand on a back); open: relaxed, fingers loosely curled; spread: fingers fanned (waving, cheering); point:
// index out; hold: wrapped round a handle, rail or arm.
export type Grip = "fist" | "flat" | "open" | "spread" | "point" | "hold";

// A foot: where its ankle is and how far the heel is raised (+) or the toe lifted (−), degrees.
export type FootPose = { ankle: V; pitch: number };
// An arm: either a hand target for IK, or angles (shoulder from straight down, + forward; elbow bend, + folds the
// forearm forward). `wrist` bends the hand off the forearm line, + forward/up. `upper` / `fore` (0..1, default 1) are
// how much of the upper arm / forearm shows in the side view: an arm raised out to the side points partly at the
// camera and looks shorter (a wave, a cheer).
export type ArmPose = (
  | { hand: V; elbowOut?: 1 | -1 }
  | { shoulder: number; elbow: number }
) & { grip?: Grip; wrist?: number; upper?: number; fore?: number };

export type Pose = {
  hip: V; // the hip joint
  pelvis?: number; // pelvis tilt, + top forward (default 6, a standing pelvis tips forward a little)
  chest: number; // ribcage lean from vertical, + forward
  head?: number; // nod, + forward / down
  feet: { near: FootPose; far: FootPose };
  arms: { near: ArmPose; far: ArmPose };
};

// The ankle of a foot whose `pivot` point (heel, ball, …; relative to the ankle when flat) is at `at`, pitched.
export const footFrom = (at: V, pivot: V, pitch: number): FootPose => ({
  ankle: sub(at, lean(pivot, pitch)),
  pitch,
});
// A foot flat on the ground with its ankle at x.
export const flatFoot = (x: number): FootPose => ({
  ankle: v(x, BONES.ankle),
  pitch: 0,
});

// Two-bone IK: the middle joint for a chain root→end of lengths a, b, bending to the `side` (+1: the joint lies to the
// left of root→target when that points down the screen, i.e. a knee in front; −1: an elbow behind).
export const twoBone = (
  root: V,
  target: V,
  a: number,
  b: number,
  side: 1 | -1,
): { mid: V; end: V } => {
  const d0 = sub(target, root);
  const dist = Math.min(Math.max(len(d0), Math.abs(a - b) + 1e-4), a + b - 1e-4);
  const u = norm(d0);
  const along = (a * a - b * b + dist * dist) / (2 * dist);
  const h = Math.sqrt(Math.max(0, a * a - along * along));
  const perp = { x: -u.y, y: u.x };
  return {
    mid: add(add(root, mul(u, along)), mul(perp, h * side)),
    end: add(root, mul(u, dist)),
  };
};

export type LegJ = { hip: V; knee: V; ankle: V; pitch: number };
export type ArmJ = {
  shoulder: V;
  elbow: V;
  wrist: V;
  handDir: V; // unit vector along the hand
  grip: Grip;
};
export type Body = {
  hip: V;
  pelvis: number;
  chest: number;
  head: number;
  waist: V;
  shoulder: V;
  neck: V;
  legs: { near: LegJ; far: LegJ };
  arms: { near: ArmJ; far: ArmJ };
  // pelvis / ribcage frames: map a point given in that part's own frame to the figure frame
  inPelvis: (p: V) => V;
  inChest: (p: V) => V;
};

// Near and far limbs sit a little apart in depth; on a side view that shows as a small shift along x.
const NEAR_HIP = v(0.012, 0);
const FAR_HIP = v(-0.012, 0.004);
const FAR_SHOULDER = v(-0.035, 0.012);

export const solve = (pose: Pose): Body => {
  const pelvis = pose.pelvis ?? 6;
  const chest = pose.chest;
  const hip = pose.hip;
  const inPelvis = (p: V) => add(hip, lean(p, pelvis));
  const waist = inPelvis(v(0, BONES.waist));
  const inChest = (p: V) => add(waist, lean(p, chest));
  const shoulder = inChest(BONES.shoulder);
  const neck = inChest(BONES.neck);
  const leg = (h: V, f: FootPose): LegJ => {
    const { mid, end } = twoBone(h, f.ankle, BONES.thigh, BONES.shin, 1);
    return { hip: h, knee: mid, ankle: end, pitch: f.pitch };
  };
  const arm = (s: V, a: ArmPose): ArmJ => {
    let elbow: V;
    let wrist: V;
    const ua = BONES.upperArm * (a.upper ?? 1);
    const fa = BONES.forearm * (a.fore ?? 1);
    if ("hand" in a) {
      const r = twoBone(s, a.hand, ua, fa, a.elbowOut ?? -1);
      elbow = r.mid;
      wrist = r.end;
    } else {
      elbow = add(s, down(a.shoulder, ua));
      wrist = add(elbow, down(a.shoulder + a.elbow, fa));
    }
    const fore = norm(sub(wrist, elbow));
    const handDir = norm(lean(fore, -(a.wrist ?? 0)));
    return { shoulder: s, elbow, wrist, handDir, grip: a.grip ?? "fist" };
  };
  return {
    hip,
    pelvis,
    chest,
    head: pose.head ?? 0,
    waist,
    shoulder,
    neck,
    legs: {
      near: leg(add(hip, NEAR_HIP), pose.feet.near),
      far: leg(add(hip, FAR_HIP), pose.feet.far),
    },
    arms: {
      near: arm(shoulder, pose.arms.near),
      far: arm(add(shoulder, lean(FAR_SHOULDER, chest)), pose.arms.far),
    },
    inPelvis,
    inChest,
  };
};

// Blend two poses (for transitions). Arms given the same way blend directly; an IK arm meeting an angle arm is
// blended as angles.
export const mixPose = (a: Pose, b: Pose, u: number): Pose => {
  const m = (x: number, y: number) => x + (y - x) * u;
  const foot = (p: FootPose, q: FootPose): FootPose => ({
    ankle: lerpV(p.ankle, q.ankle, u),
    pitch: m(p.pitch, q.pitch),
  });
  // an IK arm blended with an angle arm is first turned into angles (from the solved pose), so nothing pops
  const asAngles = (pose: Pose, side: "near" | "far"): ArmPose => {
    const arm = pose.arms[side];
    if (!("hand" in arm)) return arm;
    const j = solve(pose).arms[side];
    const sh = angleOf(sub(j.elbow, j.shoulder));
    let el = angleOf(sub(j.wrist, j.elbow)) - sh;
    el = ((((el + 180) % 360) + 360) % 360) - 180;
    return { shoulder: sh, elbow: el, grip: arm.grip, wrist: arm.wrist, upper: arm.upper, fore: arm.fore };
  };
  const armM = (side: "near" | "far"): ArmPose => {
    let p = a.arms[side];
    let q = b.arms[side];
    if ("hand" in p !== "hand" in q) {
      p = asAngles(a, side);
      q = asAngles(b, side);
    }
    const grip = u < 0.5 ? p.grip : q.grip;
    const ext = {
      grip,
      wrist: m(p.wrist ?? 0, q.wrist ?? 0),
      upper: m(p.upper ?? 1, q.upper ?? 1),
      fore: m(p.fore ?? 1, q.fore ?? 1),
    };
    if ("hand" in p && "hand" in q)
      return { hand: lerpV(p.hand, q.hand, u), elbowOut: q.elbowOut, ...ext };
    if ("shoulder" in p && "shoulder" in q) {
      // the shorter way round
      let ds = q.shoulder - p.shoulder;
      ds = ((((ds + 180) % 360) + 360) % 360) - 180;
      return { shoulder: p.shoulder + ds * u, elbow: m(p.elbow, q.elbow), ...ext };
    }
    return u < 0.5 ? p : q;
  };
  return {
    hip: lerpV(a.hip, b.hip, u),
    pelvis: m(a.pelvis ?? 6, b.pelvis ?? 6),
    chest: m(a.chest, b.chest),
    head: m(a.head ?? 0, b.head ?? 0),
    feet: { near: foot(a.feet.near, b.feet.near), far: foot(a.feet.far, b.feet.far) },
    arms: { near: armM("near"), far: armM("far") },
  };
};
