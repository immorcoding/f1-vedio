// Poses and gaits for the people module (ART-16, MOT-5). Gaits are functions of the distance walked (m), not of time:
// the stance foot is pinned to its footprint on the ground, so a caller that moves the figure's ground point by the same
// distance gets planted feet with no sliding. Gait timing after Muybridge's "A man walking" (1887): stance 60 % of the
// cycle, heel strike with the toe up, heel-off and push from the ball, arms swinging against the legs.
import {
  BONES,
  LEG,
  footFrom,
  flatFoot,
  v,
  type ArmPose,
  type FootPose,
  type Pose,
  type V,
} from "./skeleton";

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const smooth = (x: number) => {
  const u = clamp01(x);
  return u * u * (3 - 2 * u);
};
const frac = (x: number) => x - Math.floor(x);
// smooth minimum, so the hip does not kink where the supporting leg changes
const smin = (a: number, b: number, k = 0.025) => {
  const h = clamp01(0.5 + (0.5 * (b - a)) / k);
  return b + (a - b) * h - k * h * (1 - h);
};

export type GaitOptions = {
  stride?: number; // step length, m (one foot to the other)
  lean?: number; // chest lean, deg
  pelvis?: number;
  armSwing?: number; // deg each way
  crouch?: number; // how much lower than a straight-legged walk the hip rides, m
  lift?: number; // swing-foot clearance, m
  head?: number;
  reach?: number; // heel ahead of the hip at heel strike, as a share of the stride
  stance?: number; // share of the cycle a foot is on the ground
  limp?: number; // 0..1: uneven steps (the far leg's steps shorter and quicker), for a stumble
  back?: number; // feet set this far behind the hip, m (a body leaning into a push)
};

const STANCE = 0.6;

// One foot through the gait cycle at phase p (0 = heel strike), body-relative.
const gaitFoot = (
  p: number,
  L: number,
  reach: number,
  lift: number,
  stance: number,
): { foot: FootPose; onGround: boolean } => {
  const HB = BONES.ball.x - BONES.heel.x;
  // heel position (relative to the hip) of the footprint this foot is standing on; it moves back as the body passes
  const heelAt = (q: number) => reach - q * L;
  const strikePitch = -16;
  const offPitch = 50;
  const stanceFoot = (q: number): FootPose => {
    const s = q / stance;
    const hx = heelAt(q);
    if (s < 0.14)
      return footFrom(v(hx, 0), BONES.heel, strikePitch * (1 - smooth(s / 0.14)));
    if (s < 0.5) return flatFoot(hx - BONES.heel.x);
    const k = (s - 0.5) / 0.5;
    return footFrom(v(hx + HB, 0), BONES.ball, offPitch * Math.pow(k, 1.6));
  };
  if (p < stance) return { foot: stanceFoot(p), onGround: true };
  const w = (p - stance) / (1 - stance);
  const a = stanceFoot(stance - 1e-6);
  const b = footFrom(v(reach, 0), BONES.heel, strikePitch);
  // the swing foot leaves late and arrives early, clears the ground mid-swing, and turns from toe-down to toe-up
  const e = smooth(w);
  const ankle: V = {
    x: a.ankle.x + (b.ankle.x - a.ankle.x) * e,
    y:
      a.ankle.y +
      (b.ankle.y - a.ankle.y) * e +
      lift * Math.sin(Math.PI * Math.min(1, w * 1.15)),
  };
  const pitch = offPitch + (strikePitch - offPitch) * smooth(w * 1.3);
  return { foot: { ankle, pitch }, onGround: false };
};

// The hip height that keeps every grounded foot within reach of a nearly straight leg.
const hipHeight = (feet: { foot: FootPose; onGround: boolean }[], top: number, hipX = 0) => {
  let y = top;
  for (const f of feet) {
    if (!f.onGround) continue;
    const dx = f.foot.ankle.x - hipX;
    const reachY = f.foot.ankle.y + Math.sqrt(Math.max(0, (LEG * 0.985) ** 2 - dx * dx));
    y = smin(y, reachY);
  }
  return y;
};

// Arm swing at leg phase p (the arm swings against the leg on its own side).
const swingArm = (p: number, swing: number): ArmPose => {
  const c = Math.cos(p * Math.PI * 2);
  return {
    shoulder: -swing * c - 2,
    elbow: 14 + 16 * Math.max(0, -c),
    grip: "fist",
  };
};

// A walk, `d` metres along. Returns the pose; the figure's ground point should be moved by `d` as well.
export const walk = (d: number, o: GaitOptions = {}): Pose => {
  const stride = o.stride ?? 0.72;
  const L = stride * 2;
  const reach = (o.reach ?? 0.42) * stride - (o.back ?? 0);
  const lift = o.lift ?? 0.07;
  const stance = o.stance ?? STANCE;
  const limp = o.limp ?? 0;
  // a limp shifts the far foot's phase so its steps are short
  const pn = frac(d / L);
  const pf = frac(d / L + 0.5 - limp * 0.12 * Math.sin(2 * Math.PI * pn));
  const near = gaitFoot(pn, L, reach, lift, stance);
  const far = gaitFoot(pf, L, reach * (1 - limp * 0.3), lift * (1 - limp * 0.4), stance);
  const top = BONES.ankle + LEG * 0.985 - (o.crouch ?? 0);
  const hipY = hipHeight([near, far], top);
  const swing = o.armSwing ?? 17;
  const bob = Math.cos(4 * Math.PI * pn);
  return {
    hip: v(0, hipY),
    pelvis: (o.pelvis ?? 6) + 2 * bob,
    chest: (o.lean ?? 4) + 1.2 * bob,
    head: (o.head ?? 2) - 1.5 * bob,
    feet: { near: near.foot, far: far.foot },
    arms: { near: swingArm(pn, swing), far: swingArm(pf, swing) },
  };
};

// A walk with both hands on something that travels with the walker (pushing a car, a hand on someone's back): the
// hands are fixed relative to the hip.
export const walkWithHands = (
  d: number,
  hands: { near?: ArmPose; far?: ArmPose },
  o: GaitOptions = {},
): Pose => {
  const w = walk(d, o);
  return {
    ...w,
    arms: { near: hands.near ?? w.arms.near, far: hands.far ?? w.arms.far },
  };
};

// Pushing a car: leaning in hard, palms flat on it at `contact` (relative to the hip at rest, m), driving from the
// back leg. Long low strides; `d` is the distance pushed.
export const push = (d: number, contact: V = v(0.78, 1.0), o: GaitOptions = {}): Pose => {
  const w = walk(d, {
    stride: 0.66,
    lean: 52,
    pelvis: 30,
    crouch: 0.04,
    armSwing: 0,
    head: -24,
    reach: 0.45,
    back: 0.32,
    stance: 0.66,
    lift: 0.05,
    ...o,
  });
  // the hands stay on the car while the hip bobs
  const hand = (dx: number, dy: number): ArmPose => ({
    hand: v(contact.x + dx, contact.y + dy),
    grip: "flat",
    wrist: 60,
  });
  return { ...w, arms: { near: hand(0, 0), far: hand(-0.04, 0.03) } };
};

// ── Held poses ───────────────────────────────────────────────────────────────────────────────────────────────────
// A relaxed stand with the weight on the far leg (contrapposto: the hip pushed over the standing foot, the free knee
// eased forward, the chest settling back over it).
export const stand = (o: { lean?: number; head?: number } = {}): Pose => ({
  hip: v(0.0, 0.905),
  pelvis: 7,
  chest: o.lean ?? -1,
  head: o.head ?? 4,
  feet: {
    far: flatFoot(-0.03),
    near: footFrom(v(0.17, 0), BONES.ball, 14),
  },
  arms: {
    near: { shoulder: 6, elbow: 14, grip: "open", wrist: 6 },
    far: { shoulder: -8, elbow: 18, grip: "open", wrist: 4 },
  },
});

// Waving to the crowd: near arm high, open hand.
export const wave = (t = 0): Pose => {
  const s = stand({ head: -8, lean: -5 });
  const sway = Math.sin(t * Math.PI * 2);
  return {
    ...s,
    arms: {
      ...s.arms,
      near: { shoulder: 128 + 6 * sway, elbow: 40 - 10 * sway, grip: "flat", wrist: -20 + 14 * sway },
    },
  };
};

// Pointing ahead with the near arm straight out.
export const point = (): Pose => {
  const s = stand({ lean: 2, head: -4 });
  return {
    ...s,
    arms: { ...s.arms, near: { shoulder: 96, elbow: 2, grip: "point", wrist: -4 } },
  };
};

// Cheering: both fists up, up on the toes (`t` = 0..1 through one jump; 0 = standing on the ground).
export const cheer = (t = 0): Pose => {
  const j = Math.sin(Math.PI * clamp01(t));
  const hipY = 0.9 + 0.22 * j;
  const lift = 0.22 * j;
  return {
    hip: v(0, hipY),
    pelvis: 4,
    chest: -9 + 4 * j,
    head: -16,
    feet: {
      near: footFrom(v(0.1, lift), BONES.ball, 28 + 20 * j),
      far: footFrom(v(-0.08, lift), BONES.ball, 34 + 22 * j),
    },
    arms: {
      near: { shoulder: 146, elbow: 16, grip: "fist", wrist: 0 },
      far: { shoulder: 172, elbow: 22, grip: "fist", wrist: 0 },
    },
  };
};

// Spraying an extinguisher: braced lunge, near hand aiming the nozzle, far hand holding the cylinder at the hip.
export const spray = (t = 0): Pose => {
  const jitter = Math.sin(t * 40) * 0.006;
  return {
    hip: v(0, 0.8),
    pelvis: 16,
    chest: 22,
    head: 6,
    feet: {
      near: flatFoot(0.42),
      far: footFrom(v(-0.5, 0), BONES.ball, 32),
    },
    arms: {
      near: { hand: v(0.66, 1.14 + jitter), grip: "hold", wrist: -6 },
      far: { hand: v(0.22, 0.86), grip: "hold", wrist: 20 },
    },
  };
};

// Standing ready with an extinguisher in the far hand.
export const standReady = (): Pose => {
  const s = stand({ lean: 0, head: 2 });
  return {
    ...s,
    arms: {
      near: { shoulder: 4, elbow: 6, grip: "hold", wrist: 0 },
      far: { shoulder: -6, elbow: 20, grip: "open", wrist: 4 },
    },
  };
};

// Reaching forward and down to help someone (a doctor at the barrier).
export const reach = (): Pose => ({
  hip: v(0, 0.84),
  pelvis: 18,
  chest: 32,
  head: -6,
  feet: { near: flatFoot(0.3), far: footFrom(v(-0.3, 0), BONES.ball, 24) },
  arms: {
    near: { hand: v(0.72, 1.2), grip: "open", wrist: 10 },
    far: { hand: v(0.6, 1.05), grip: "open", wrist: 0 },
  },
});
