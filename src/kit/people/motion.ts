// Poses and gaits for the people module (ART-16, MOT-5). Gaits are functions of the distance walked (m), not of time:
// the stance foot is pinned to its footprint on the ground, so a caller that moves the figure's ground point by the same
// distance gets planted feet with no sliding. Gait timing after Muybridge's "A man walking" (1887): stance 60 % of the
// cycle, heel strike with the toe up, heel-off and push from the ball, arms swinging against the legs.
// Held poses take a time or phase argument where they move (breathing, a fist pump on the beat, a jump), so nobody
// stands frozen in a shot. Pure TypeScript with no React (node-loadable, like ./skeleton.ts).
import {
  BONES,
  LEG,
  footFrom,
  flatFoot,
  lerpV,
  mixPose,
  v,
  type ArmPose,
  type FootPose,
  type Pose,
  type V,
} from "./skeleton.ts";

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const smooth = (x: number) => {
  const u = clamp01(x);
  return u * u * (3 - 2 * u);
};
const frac = (x: number) => x - Math.floor(x);
const TAU = Math.PI * 2;
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
  arms?: number; // arms carried this far forward of hanging, deg (balance when unsteady)
  elbows?: number; // extra elbow bend, deg
  crouch?: number; // how much lower than a straight-legged walk the hip rides, m
  lift?: number; // swing-foot clearance, m
  head?: number;
  reach?: number; // heel ahead of the hip at heel strike, as a share of the stride
  stance?: number; // share of the cycle a foot is on the ground
  // 0..1: uneven steps — the far foot strikes early, so the step onto it is short and the step off it long (a limp,
  // a stumble). A constant phase shift, so both feet stay planted.
  limp?: number;
  lurch?: number; // deg: the chest pitches forward on each step onto the weak (far) leg
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
      return footFrom(
        v(hx, 0),
        BONES.heel,
        strikePitch * (1 - smooth(s / 0.14)),
      );
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
const hipHeight = (
  feet: { foot: FootPose; onGround: boolean }[],
  top: number,
  hipX = 0,
) => {
  let y = top;
  for (const f of feet) {
    if (!f.onGround) continue;
    const dx = f.foot.ankle.x - hipX;
    const reachY =
      f.foot.ankle.y + Math.sqrt(Math.max(0, (LEG * 0.985) ** 2 - dx * dx));
    y = smin(y, reachY);
  }
  return y;
};

// Arm swing at leg phase p (the arm swings against the leg on its own side).
const swingArm = (
  p: number,
  swing: number,
  carry = 0,
  elbows = 0,
): ArmPose => {
  const c = Math.cos(p * TAU);
  return {
    shoulder: -swing * c - 2 + carry,
    elbow: 16 + elbows + 18 * Math.max(0, -c),
    grip: "open",
    wrist: 6,
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
  const pn = frac(d / L);
  const pf = frac(d / L + 0.5 - 0.14 * limp);
  const near = gaitFoot(pn, L, reach, lift, stance);
  const far = gaitFoot(pf, L, reach, lift * (1 - limp * 0.4), stance);
  const top = BONES.ankle + LEG * 0.985 - (o.crouch ?? 0);
  const hipY = hipHeight([near, far], top);
  const swing = o.armSwing ?? 17;
  const bob = Math.cos(4 * Math.PI * pn);
  // the lurch: a forward pitch that peaks just after the weak foot strikes
  const lurch = (o.lurch ?? 0) * Math.pow(Math.max(0, Math.cos(TAU * (pf - 0.12))), 3);
  return {
    hip: v(0, hipY - 0.02 * limp * Math.max(0, Math.cos(TAU * pf))),
    pelvis: (o.pelvis ?? 6) + 2 * bob,
    chest: (o.lean ?? 4) + 1.2 * bob + lurch,
    head: (o.head ?? 2) - 1.5 * bob,
    feet: { near: near.foot, far: far.foot },
    arms: {
      near: swingArm(pn, swing, o.arms ?? 0, o.elbows ?? 0),
      far: swingArm(pf, swing, o.arms ?? 0, o.elbows ?? 0),
    },
  };
};

// Distance walked after `t` seconds at `speed` m/s, with the pace varying ±`uneven` (0..0.8) once per gait cycle —
// slower over the weak leg. Drive walk()/stumble() and the ground point from the same value.
export const gaitDistance = (
  t: number,
  speed: number,
  o: { stride?: number; uneven?: number } = {},
) => {
  const L = 2 * (o.stride ?? 0.72);
  const u = Math.min(0.8, o.uneven ?? 0);
  const w = (TAU * speed) / L;
  return speed * t + (u * speed * (1 - Math.cos(w * t))) / w / 2;
};

// A shaken, unsteady walk: short uneven steps, leaning forward, head down, arms a little out for balance.
export const STUMBLE: GaitOptions = {
  stride: 0.5,
  lean: 15,
  pelvis: 12,
  crouch: 0.05,
  armSwing: 7,
  arms: 14,
  elbows: 16,
  head: 14,
  lift: 0.045,
  limp: 0.55,
  lurch: 7,
  stance: 0.64,
};
export const stumble = (d: number, o: GaitOptions = {}): Pose =>
  walk(d, { ...STUMBLE, ...o });

// A walk with hands on something that travels with the walker (pushing a car, a hand on someone's back): the hands
// are fixed relative to the hip.
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
export const push = (
  d: number,
  contact: V = v(0.78, 1.0),
  o: GaitOptions = {},
): Pose => {
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
  const hand = (dx: number, dy: number): ArmPose => ({
    hand: v(contact.x + dx, contact.y + dy),
    grip: "flat",
    wrist: 60,
  });
  return { ...w, arms: { near: hand(0, 0), far: hand(-0.04, 0.03) } };
};

// ── Standing ─────────────────────────────────────────────────────────────────────────────────────────────────────
// A relaxed stand, weight on the far leg (contrapposto: the hip pushed back over the standing foot, the free knee eased
// forward, the chest settling back over it), breathing and shifting a little with `t` (seconds).
export const stand = (
  o: { t?: number; lean?: number; head?: number } = {},
): Pose => {
  const t = o.t ?? 0;
  const breath = Math.sin((TAU * t) / 3.4);
  const shift = Math.sin((TAU * t) / 7.3 + 1);
  return {
    hip: v(-0.025 + 0.01 * shift, 0.895 + 0.004 * breath),
    pelvis: 9 + 1.5 * shift,
    chest: (o.lean ?? -3) + 1.2 * breath,
    head: (o.head ?? 5) - 1.5 * breath,
    feet: {
      far: flatFoot(-0.035),
      near: footFrom(v(0.17, 0), BONES.ball, 8),
    },
    arms: {
      near: { shoulder: 9 + 2 * shift, elbow: 22, grip: "open", wrist: 10 },
      far: { shoulder: -10 - 2 * shift, elbow: 16, grip: "open", wrist: 6 },
    },
  };
};

const withArms = (p: Pose, near: ArmPose, far?: ArmPose): Pose => ({
  ...p,
  arms: { near, far: far ?? p.arms.far },
});

// Watching a screen with the arms folded (the near forearm across the chest, the far hand tucked under it).
export const armsFolded = (o: { t?: number; head?: number } = {}): Pose => {
  const s = stand({ t: o.t, lean: -4, head: o.head ?? -6 });
  const C = (x: number, y: number) => v(s.hip.x + x, s.hip.y + y);
  return withArms(
    s,
    { hand: C(0.19, 0.42), grip: "fist", wrist: 10, elbowOut: 1 },
    { hand: C(0.15, 0.36), grip: "fist", wrist: 0, elbowOut: 1 },
  );
};

// Watching, one hand on top of the head (the nervous last lap), the other hanging.
export const handOnHead = (o: { t?: number; head?: number } = {}): Pose => {
  const s = stand({ t: o.t, lean: -2, head: o.head ?? -4 });
  return withArms(s, {
    hand: v(s.hip.x + 0.07, s.hip.y + 0.86),
    grip: "flat",
    wrist: 40,
    elbowOut: 1,
  });
};

// Waving to the crowd: the near upper arm out and up, forearm upright, the open hand rocking from the elbow.
export const wave = (t = 0): Pose => {
  const s = stand({ t, head: -6, lean: -4 });
  const sway = Math.sin(t * TAU);
  return withArms(s, {
    shoulder: 104 + 4 * sway,
    upper: 0.7,
    elbow: 58 - 18 * sway,
    grip: "spread",
    wrist: 8 * sway,
  });
};

// Pointing ahead with the near arm straight out.
export const point = (t = 0): Pose => {
  const s = stand({ t, lean: 2, head: -4 });
  return withArms(s, { shoulder: 92, elbow: 4, grip: "point", wrist: -4 });
};

// Standing ready with an extinguisher carried in the near hand.
export const standReady = (t = 0): Pose => {
  const s = stand({ t, lean: 0, head: 2 });
  return {
    ...s,
    arms: {
      near: { shoulder: 4, elbow: 8, grip: "hold", wrist: 0 },
      far: { shoulder: -8, elbow: 20, grip: "open", wrist: 6 },
    },
  };
};

// Reaching forward to a hand target (figure frame, m), e.g. a doctor taking someone's arm: the body leans toward
// the target as far as it needs, feet braced apart. `far` optionally gives the far hand a target too.
export const reachTo = (
  hand: V,
  o: { far?: V; grip?: ArmPose["grip"]; t?: number } = {},
): Pose => {
  const dist = Math.hypot(hand.x, hand.y - 1.3);
  const k = clamp01((dist - 0.35) / 0.45);
  const breath = Math.sin((TAU * (o.t ?? 0)) / 3);
  return {
    hip: v(-0.02 + 0.06 * k, 0.88 - 0.05 * k),
    pelvis: 10 + 10 * k,
    chest: 6 + 26 * k + breath,
    head: -6 - 6 * k,
    feet: { near: flatFoot(0.24), far: footFrom(v(-0.3, 0), BONES.ball, 22) },
    arms: {
      near: { hand, grip: o.grip ?? "hold", wrist: 6 },
      far: o.far
        ? { hand: o.far, grip: o.grip ?? "hold", wrist: 6 }
        : { shoulder: 30 + 30 * k, elbow: 40, grip: "open", wrist: 6 },
    },
  };
};

// Reaching forward and down to help someone (generic).
export const reach = (): Pose => reachTo(v(0.72, 1.2), { far: v(0.6, 1.05), grip: "open" });

// ── Fire marshal ─────────────────────────────────────────────────────────────────────────────────────────────────
// Spraying an extinguisher: braced, front knee bent and the back leg long, leaning in; the near hand on the nozzle,
// the far hand holding the cylinder low by its handle. `t` seconds (the jet's kick shakes the arms a little).
export const spray = (t = 0, nozzle: V = v(0.58, 1.08)): Pose => {
  const kick = Math.sin(t * 37) * 0.006 + Math.sin(t * 23) * 0.004;
  return {
    hip: v(0.02, 0.79),
    pelvis: 15,
    chest: 17,
    head: 6,
    feet: {
      near: flatFoot(0.37),
      far: footFrom(v(-0.52, 0), BONES.ball, 30),
    },
    arms: {
      near: { hand: v(nozzle.x, nozzle.y + kick), grip: "hold", wrist: -8 },
      far: { hand: v(0.1, 0.8 + kick * 0.5), grip: "hold", wrist: 0 },
    },
  };
};

// ── Celebrating ──────────────────────────────────────────────────────────────────────────────────────────────────
// Both arms up with fists, in a V that keeps the head clear (near arm forward, far arm back), bouncing on the knees
// with `t` (beats).
export const armsUp = (t = 0): Pose => {
  const b = Math.abs(Math.sin(Math.PI * t));
  return {
    hip: v(0, 0.86 + 0.04 * b),
    pelvis: 5,
    chest: -8 - 2 * b,
    head: -16,
    feet: { near: flatFoot(0.12), far: flatFoot(-0.12) },
    arms: {
      near: { shoulder: 118 + 5 * b, elbow: 30, grip: "fist", wrist: 10, upper: 0.9 },
      far: { shoulder: 196 - 4 * b, elbow: 16, grip: "fist", wrist: -8 },
    },
  };
};

// A fist pump on the beat: `beat` counts beats (whole numbers on the beat); the near fist comes down hard onto each
// beat and goes back up between, the knees dipping with it; the far fist stays up.
export const fistPump = (beat: number): Pose => {
  const b = frac(beat);
  // 1 = fist pulled down (on the beat), 0 = punched up
  const down = b < 0.18 ? 1 : b < 0.62 ? 1 - smooth((b - 0.18) / 0.44) : b < 0.84 ? 0 : smooth((b - 0.84) / 0.16);
  return {
    hip: v(0, 0.89 - 0.07 * down),
    pelvis: 7 + 6 * down,
    chest: -6 + 18 * down,
    head: -14 + 12 * down,
    feet: { near: flatFoot(0.16), far: footFrom(v(-0.12, 0), BONES.ball, 10) },
    arms: {
      near: {
        shoulder: 122 - 82 * down,
        elbow: 16 + 104 * down,
        grip: "fist",
        wrist: 10,
      },
      far: { shoulder: 194, elbow: 18, grip: "fist", wrist: -6 },
    },
  };
};

// A small jump for joy, u = 0..1 through one jump: crouch (arms swing back), take-off (arms up), in the air (knees
// tucked), land (knees give), recover.
export const jump = (u: number, height = 0.22): Pose => {
  const x = clamp01(u);
  const crouch =
    x < 0.25 ? smooth(x / 0.25) : x < 0.38 ? 1 - smooth((x - 0.25) / 0.13) : x < 0.78 ? 0 : x < 0.88 ? smooth((x - 0.78) / 0.1) : 1 - smooth((x - 0.88) / 0.12);
  const air = x > 0.36 && x < 0.8 ? Math.sin((Math.PI * (x - 0.36)) / 0.44) : 0;
  const armsUpK = x < 0.25 ? 0 : x < 0.4 ? smooth((x - 0.25) / 0.15) : x < 0.85 ? 1 : 1 - smooth((x - 0.85) / 0.15) * 0.6;
  const lift = air * height;
  const tuck = air * 0.08;
  const toe = (1 - crouch) * 26 * (air > 0 ? 1 : smooth((x - 0.3) / 0.08) * (x < 0.4 ? 1 : 0));
  return {
    hip: v(0.02 * crouch, 0.9 - 0.2 * crouch + lift - tuck * 0.3),
    pelvis: 6 + 22 * crouch,
    chest: -4 + 30 * crouch - 6 * air,
    head: -10 - 8 * air + 10 * crouch,
    feet: {
      near: footFrom(v(0.16, lift + tuck * 0.2), BONES.ball, toe + 10 * air),
      far: footFrom(v(-0.06, lift + tuck), BONES.ball, toe + 18 * air),
    },
    arms: {
      near: { shoulder: -30 + 152 * armsUpK, elbow: 24, grip: "fist", wrist: 6 },
      far: { shoulder: -40 + 232 * armsUpK, elbow: 18, grip: "fist", wrist: -6 },
    },
  };
};

// Head thrown back, shouting at the roof, arms flung out and up with open hands; `t` seconds sways it.
export const headBack = (t = 0): Pose => {
  const s = Math.sin(TAU * t * 0.9);
  return {
    hip: v(0.03, 0.88),
    pelvis: 2,
    chest: -17 + 2 * s,
    head: -30,
    feet: { near: flatFoot(0.2), far: flatFoot(-0.1) },
    arms: {
      near: { shoulder: 98 + 5 * s, elbow: 30, grip: "spread", wrist: 10, upper: 0.85 },
      far: { shoulder: 164 - 5 * s, elbow: 18, grip: "spread", wrist: 10 },
    },
  };
};

// A high five with someone facing you, hips `gap` m apart: u 0..1 — arm up and back, the slap at u = 0.5 (both hands
// meet at gap/2), follow-through and down.
export const HIGH_FIVE_AT = 0.5;
export const highFive = (u: number, gap = 0.9): Pose => {
  const x = clamp01(u);
  const wind = smooth(x / 0.35);
  const hit = smooth((x - 0.35) / 0.15);
  const after = smooth((x - 0.55) / 0.45);
  const meet = v(gap / 2, 1.98);
  const back = v(0.02, 2.0);
  const hand = lerpV(lerpV(back, meet, hit), v(gap / 2 - 0.12, 1.55), after);
  const s = stand({ lean: 0, head: -10 });
  const toward = hit * (1 - after);
  return {
    ...s,
    hip: v(s.hip.x + 0.06 * toward, s.hip.y),
    chest: s.chest + 8 * toward - 4 * wind * (1 - hit),
    feet: { far: flatFoot(-0.06), near: flatFoot(0.24) },
    arms: {
      near:
        x < 0.02
          ? { hand: v(0.08, 1.0), grip: "open", wrist: 8 }
          : { hand: lerpV(v(0.08, 1.0), hand, wind), grip: "spread", wrist: -10 },
      far: { shoulder: 10, elbow: 30, grip: "fist", wrist: 6 },
    },
  };
};

// A hug with someone facing you, hips `gap` m apart (about 0.4): u 0..1 — arms open, wrap round the other's back,
// a squeeze that bounces.
export const hug = (u: number, gap = 0.42, t = 0): Pose => {
  const x = clamp01(u);
  const wrap = smooth(x / 0.4);
  const squeeze = Math.sin(TAU * t * 1.1) * 0.5 + 0.5;
  const open = (y: number): V => v(0.3, y);
  const round = (dx: number, y: number): V => v(gap + dx, y);
  return {
    hip: v(0.03 * wrap, 0.9 - 0.02 * squeeze * wrap),
    pelvis: 6,
    chest: 6 + 8 * wrap + 2 * squeeze * wrap,
    head: 18 * wrap,
    feet: { near: flatFoot(0.18), far: footFrom(v(-0.14, 0), BONES.ball, 14) },
    arms: {
      near: { hand: lerpV(open(1.45), round(0.1, 1.36), wrap), grip: "flat", wrist: 30, elbowOut: -1 },
      far: { hand: lerpV(open(1.3), round(0.06, 1.22), wrap), grip: "flat", wrist: 30, elbowOut: -1 },
    },
  };
};

// ── Getting out of a wreck ───────────────────────────────────────────────────────────────────────────────────────
// Climbing over a guardrail sideways (the rail runs along x, between the near and far legs in depth), facing along it:
// u 0..1 — hands on the top rail, hauled up with the near knee lifted over it; astride the top rail; the near foot
// down on the near side and the far leg swung over; standing, steadied. `top` is the top rail's height.
// `behind` lists the parts the caller draws behind the rails at this moment (everything else in front).
export type BodyPart = "farLeg" | "body" | "nearLeg" | "nearArm";
export const CLIMB_FORWARD = 0.3; // the hip ends this far forward (x) of the ground point
const CLIMB_KEYS = (top: number): { u: number; pose: Pose }[] => {
  const grip = (x: number): ArmPose => ({ hand: v(x, top + 0.03), grip: "hold", wrist: 20 });
  return [
    {
      // hands on the rail, far foot on the ground behind it, near foot up on the bottom rail
      u: 0,
      pose: {
        hip: v(-0.16, 0.98),
        pelvis: 20,
        chest: 28,
        head: -12,
        feet: { far: flatFoot(-0.24), near: { ankle: v(0.06, 0.62), pitch: 0 } },
        arms: { near: grip(0.24), far: grip(0.04) },
      },
    },
    {
      // hauled up, pushing down on the rail, the near knee coming up over it, far foot on the middle rail
      u: 0.3,
      pose: {
        hip: v(-0.06, 1.3),
        pelvis: 14,
        chest: 24,
        head: -8,
        feet: { far: { ankle: v(-0.2, 1.0), pitch: 10 }, near: { ankle: v(0.2, top + 0.14), pitch: 34 } },
        arms: { near: grip(0.1), far: grip(-0.08) },
      },
    },
    {
      // astride the top rail: near leg hanging on the near side, far foot on the middle rail behind
      u: 0.5,
      pose: {
        hip: v(0, top + 0.1),
        pelvis: 2,
        chest: 10,
        head: 0,
        feet: { far: { ankle: v(-0.1, 1.0), pitch: 10 }, near: { ankle: v(0.13, 0.62), pitch: 22 } },
        arms: { near: grip(0.2), far: grip(-0.16) },
      },
    },
    {
      // near foot down on the track side, the far leg swinging over the rail, knee high
      u: 0.74,
      pose: {
        hip: v(0.14, 0.98),
        pelvis: 16,
        chest: 22,
        head: 6,
        feet: { near: flatFoot(0.22), far: { ankle: v(-0.02, top + 0.12), pitch: 36 } },
        arms: { near: grip(0.3), far: grip(0.02) },
      },
    },
    {
      // both feet down, bent over, steadying himself
      u: 1,
      pose: {
        hip: v(CLIMB_FORWARD, 0.87),
        pelvis: 14,
        chest: 20,
        head: 14,
        feet: { near: flatFoot(CLIMB_FORWARD + 0.12), far: footFrom(v(CLIMB_FORWARD - 0.12, 0), BONES.ball, 10) },
        arms: {
          near: { hand: v(CLIMB_FORWARD + 0.24, 0.98), grip: "open", wrist: 8 },
          far: { hand: v(CLIMB_FORWARD + 0.14, 0.92), grip: "open", wrist: 8 },
        },
      },
    },
  ];
};
export const climbRail = (
  u: number,
  top = 1.29,
): { pose: Pose; behind: BodyPart[] } => {
  const keys = CLIMB_KEYS(top);
  const x = clamp01(u);
  let i = 0;
  while (i < keys.length - 2 && x > keys[i + 1].u) i++;
  const a = keys[i];
  const b = keys[i + 1];
  const pose = mixPose(a.pose, b.pose, smooth((x - a.u) / (b.u - a.u)));
  // the knees swing up and over the top rail rather than through it
  const k = (x - a.u) / (b.u - a.u);
  if (i === 0) pose.feet.near.ankle.y += 0.12 * Math.sin(Math.PI * k);
  if (i === 2) pose.feet.far.ankle.y += 0.1 * Math.sin(Math.PI * k);
  const behind: BodyPart[] =
    x < 0.3 ? ["farLeg", "body", "nearLeg", "nearArm"] : x < 0.5 ? ["farLeg", "body"] : x < 0.74 ? ["farLeg"] : [];
  return { pose, behind };
};
