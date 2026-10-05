// Poses and gaits for the people module (ART-16, MOT-5). Gaits are functions of the distance walked (m), not of time:
// the stance foot is pinned to its footprint on the ground, so a caller that moves the figure's ground point by the same
// distance gets planted feet with no sliding. Gait timing after Muybridge's "A man walking" (1887): stance 60 % of the
// cycle, heel strike with the toe up, heel-off and push from the ball, arms swinging against the legs.
// Held poses take a time or phase argument where they move (breathing, a fist pump on the beat, a jump), so nobody
// stands frozen in a shot. Pure TypeScript with no React (node-loadable, like ./skeleton.ts).
import {
  BONES,
  add,
  LEG,
  footFrom,
  lean,
  flatFoot,
  lerpV,
  mixPose,
  solve,
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
  // the forearms run across the body, toward and away from the camera, so they show short
  return withArms(
    s,
    { shoulder: 16, elbow: 96, fore: 0.38, grip: "fist", wrist: 20 },
    { shoulder: 20, elbow: 92, fore: 0.6, grip: "fist", wrist: 0 },
  );
};

// Watching, one palm resting on the crown of the head (the nervous last lap), the other hanging. The elbow is raised
// forward and out to the side, so the upper arm points partly at the camera and shows short; the hand lies flat on top
// of the head, fingers toward the back.
export const handOnHead = (o: { t?: number; head?: number } = {}): Pose => {
  const s = stand({ t: o.t, lean: -2, head: o.head ?? -4 });
  return withArms(s, {
    hand: v(s.hip.x + 0.1, s.hip.y + 0.77),
    grip: "flat",
    wrist: 75,
    upper: 0.7,
    elbowOut: -1,
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
      near: { shoulder: -16 + 138 * armsUpK, elbow: 24, grip: "fist", wrist: 6 },
      far: { shoulder: -22 + 214 * armsUpK, elbow: 18, grip: "fist", wrist: -6 },
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

// A hug with someone facing you, hips `gap` m apart (HUG_GAP: chests just touching): u 0..1 — arms open, wrap round the other's back,
// a squeeze that bounces.
export const HUG_GAP = 0.54;
export const hug = (u: number, gap = HUG_GAP, t = 0): Pose => {
  const x = clamp01(u);
  const wrap = smooth(x / 0.4);
  const squeeze = Math.sin(TAU * t * 1.1) * 0.5 + 0.5;
  const open = (y: number): V => v(0.3, y);
  const round = (dx: number, y: number): V => v(gap + dx, y);
  return {
    hip: v(0.03 * wrap, 0.9 - 0.02 * squeeze * wrap),
    pelvis: 6,
    chest: 4 + 6 * wrap + 2 * squeeze * wrap,
    head: -4 * wrap,
    feet: { near: flatFoot(0.18), far: footFrom(v(-0.14, 0), BONES.ball, 14) },
    arms: {
      near: { hand: lerpV(open(1.45), round(0.04, 1.34), wrap), grip: "flat", wrist: 30, elbowOut: -1 },
      far: { hand: lerpV(open(1.3), round(0.0, 1.2), wrap), grip: "flat", wrist: 30, elbowOut: -1 },
    },
  };
};

// A pose moved forward by dx (hip, feet and IK hands), e.g. to hand over between poses with different ground points.
export const shiftPose = (p: Pose, dx: number): Pose => {
  const arm = (a: ArmPose): ArmPose =>
    "hand" in a ? { ...a, hand: v(a.hand.x + dx, a.hand.y) } : a;
  const foot = (f: FootPose): FootPose => ({ ...f, ankle: v(f.ankle.x + dx, f.ankle.y) });
  return {
    ...p,
    hip: v(p.hip.x + dx, p.hip.y),
    feet: { near: foot(p.feet.near), far: foot(p.feet.far) },
    arms: { near: arm(p.arms.near), far: arm(p.arms.far) },
  };
};

// ── Getting out of a wreck ───────────────────────────────────────────────────────────────────────────────────────
// Climbing over a waist-high guardrail sideways (the rail runs along x, between the near and far legs in depth),
// facing along it. `top` is the top rail's upper edge at the climb spot (the caller passes the real height, bends
// included; a 1.05 m barrier meets a 1.78 m body between hip and waist). u 0..1:
//   0     standing behind the rail, both hands on its top edge, the near foot up on the bottom rail;
//   0.2   pushed up on nearly straight arms, the hip just over the top edge, the near knee raised to go over;
//   0.36  the near leg lifted up and over: astride the top rail, sitting on it, the far foot still on the bottom rail;
//   0.5   still astride, a breath, sliding toward the near side until the near foot's toes reach the ground;
//   0.68  the far leg swung up and over: sitting on the rail's edge with both legs on the near side;
//   0.84  stepped down on the near side (pushing off the rail), knees bent, hands out for balance;
//   1     standing, the first frame of the stumble away.
// Rules the keys keep (MOT-5, ART-18): the hands never move while they hold the rail (fixed points, one grip from the
// start until he steps off, within arm's reach at every key); a foot on the ground stays where it is; a limb only
// changes sides of the rail when every joint of it is above the top edge, and the body only once the hip is over it —
// so nothing passes through a rail, and the hip stays at the top edge or above while the legs are on both sides.
export type BodyPart = "farLeg" | "body" | "nearLeg" | "nearArm";
export const CLIMB_FORWARD = 0.3; // the hip ends this far forward (x) of the ground point
// where the climber's hands hold the top rail (figure frame, relative to the top edge) for the whole climb
export const CLIMB_HANDS = { near: v(0.2, 0.04), far: v(-0.02, 0.04) };
// when each part crosses to the near side (u)
export const CLIMB_SWITCH = { nearLeg: 0.28, body: 0.36, farLeg: 0.59 };
const CLIMB_KEYS = (top: number): { u: number; pose: Pose }[] => {
  const arms = {
    near: { hand: v(CLIMB_HANDS.near.x, top + CLIMB_HANDS.near.y), grip: "hold", wrist: 24 },
    far: { hand: v(CLIMB_HANDS.far.x, top + CLIMB_HANDS.far.y), grip: "hold", wrist: 24 },
  } as const;
  const end = shiftPose(stumble(0), CLIMB_FORWARD);
  // sitting astride the rail: the hip joint a little above the top edge (the crotch on it)
  const TOE_DOWN = 0.24; // where the near foot's toes reach the ground, then where it steps down
  const seat = top + 0.07;
  // the far foot on the bottom rail behind, until that leg swings over
  const onBottomRail = (x: number, pitch: number): FootPose => ({ ankle: v(x, 0.38), pitch });
  return [
    {
      u: 0,
      pose: {
        hip: v(-0.1, 0.9),
        pelvis: 12,
        chest: 26,
        head: -10,
        feet: { far: flatFoot(-0.22), near: onBottomRail(0.04, 6) },
        arms,
      },
    },
    {
      u: 0.2,
      pose: {
        hip: v(-0.03, top + 0.05),
        pelvis: 22,
        chest: 38,
        head: -8,
        feet: { far: onBottomRail(-0.16, 10), near: { ankle: v(0.02, top - 0.14), pitch: 30 } },
        arms,
      },
    },
    {
      u: 0.36,
      pose: {
        hip: v(0.02, seat),
        pelvis: 8,
        chest: 24,
        head: -4,
        feet: { far: onBottomRail(-0.12, 10), near: { ankle: v(0.16, seat - 0.68), pitch: 30 } },
        arms,
      },
    },
    {
      u: 0.5,
      // slid to the near side of the seat: the near leg straight down, toes on the ground
      pose: {
        hip: v(0.05, top - 0.01),
        pelvis: 4,
        chest: 18,
        head: 0,
        feet: { far: onBottomRail(-0.08, 12), near: footFrom(v(TOE_DOWN, 0), BONES.toe, 68) },
        arms,
      },
    },
    {
      u: 0.68,
      pose: {
        hip: v(0.07, top - 0.01),
        pelvis: 6,
        chest: 20,
        head: 4,
        feet: { far: { ankle: v(0.12, top - 0.6), pitch: 20 }, near: footFrom(v(TOE_DOWN, 0), BONES.toe, 60) },
        arms,
      },
    },
    {
      u: 0.84,
      pose: {
        // weight down onto the near foot (heel down where the toes touched), the far foot landing beside it
        hip: v(0.12, end.hip.y - 0.08),
        pelvis: 14,
        chest: 22,
        head: 8,
        feet: { near: flatFoot(TOE_DOWN - BONES.toe.x), far: end.feet.far },
        // he pushed off the rail as he stepped down: hands free, out in front for balance
        arms: {
          near: { shoulder: 34, elbow: 40, grip: "open", wrist: 10 },
          far: { shoulder: 22, elbow: 48, grip: "open", wrist: 10 },
        },
      },
    },
    { u: 1, pose: end },
  ];
};
export const climbRail = (
  u: number,
  top = 1.05,
): { pose: Pose; behind: BodyPart[] } => {
  const keys = CLIMB_KEYS(top);
  const x = clamp01(u);
  let i = 0;
  while (i < keys.length - 2 && x > keys[i + 1].u) i++;
  const a = keys[i];
  const b = keys[i + 1];
  const k = (x - a.u) / (b.u - a.u);
  const pose = mixPose(a.pose, b.pose, smooth(k));
  // each leg goes up and over the top edge rather than through it: half way, the foot is drawn out forward along the
  // rail just above its top edge, the leg reaching over like a hurdler's, the knee up (never folded back through it)
  const over = Math.sin(Math.PI * k);
  const lift = (ankle: V) => {
    const mid = v(pose.hip.x + 0.5, top + 0.1);
    ankle.x += (mid.x - ankle.x) * over;
    ankle.y += (mid.y - ankle.y) * over;
  };
  if (i === 1) lift(pose.feet.near.ankle);
  if (i === 3) lift(pose.feet.far.ankle);
  // and the first step away off the rail: the near foot lifts clear as it swings forward
  if (i === 5) pose.feet.near.ankle.y += 0.1 * over;
  const behind: BodyPart[] = [];
  if (x < CLIMB_SWITCH.farLeg) behind.push("farLeg");
  if (x < CLIMB_SWITCH.body) behind.push("body", "nearArm");
  if (x < CLIMB_SWITCH.nearLeg) behind.push("nearLeg");
  return { pose, behind };
};

// ── Duet: helped out over the rail ───────────────────────────────────────────────────────────────────────────────
// A driver climbs over the rail (climbRail) while a doctor on the near side reaches over and holds his near upper arm;
// then the driver stumbles away and the doctor walks a step behind him, a hand at his back. Both face the same way.
// `t` seconds from the start of the climb. Positions are the ground points' distance forward (m) from the climb spot;
// `cross` is how far each has come toward their walking depth (driver: 0 behind the rail, 0.5 on it, 1 walking a
// step in front of it; doctor: 0 at the rail, 1 walking a step deeper than the driver) for the caller to turn into
// depth. Feet stay planted: each pose and its position come from the same walked distance.
export type Placed = { pose: Pose; x: number; cross: number };
export const ESCAPE = {
  climb: 2.0, // s over the rail
  speed: 0.7, // m/s walking away
  docStart: -0.95, // the doctor's spot at the rail, forward of the climb spot
  gap: 0.62, // the doctor walks this far behind
};
export const assistedEscape = (
  t: number,
  o: Partial<typeof ESCAPE> & { top?: number } = {},
): { gro: Placed & { behind: BodyPart[] }; doc: Placed } => {
  const E = { ...ESCAPE, ...o };
  const stride = STUMBLE.stride ?? 0.5;
  const walkT = Math.max(0, t - E.climb);
  const d = gaitDistance(walkT, E.speed, { stride, uneven: 0.4 });
  // the driver
  let gro: Placed & { behind: BodyPart[] };
  if (t < E.climb) {
    const u = Math.max(0, t) / E.climb;
    const c = climbRail(u, o.top);
    gro = {
      pose: c.pose,
      x: 0,
      // behind until he is hauled up, on the rail while astride and sitting, in front once he has dropped down
      cross: 0.5 * smooth((u - 0.2) / 0.16) + 0.5 * smooth((u - 0.68) / 0.16),
      behind: c.behind,
    };
  } else {
    gro = { pose: stumble(d), x: CLIMB_FORWARD + d, cross: 1, behind: [] };
  }
  const groHip = gro.x + gro.pose.hip.x;
  // the doctor: holding the driver's near upper arm while he climbs
  const docOpts: GaitOptions = { stride, lean: 10, armSwing: 12, head: 6 };
  const PH = 0.27; // his steps fall between the driver's
  const catchUp = CLIMB_FORWARD - E.gap - E.docStart; // how far he has to come to walk a step behind
  const dd = d + catchUp * smooth(walkT / 1.1) + PH;
  const docX = E.docStart + dd - PH;
  const armAt = (() => {
    const j = solve(gro.pose).arms.near;
    const p = lerpV(j.shoulder, j.elbow, 0.55);
    return v(gro.x + p.x - E.docStart, p.y);
  })();
  const holding = reachTo(armAt, { grip: "hold", t });
  // walking behind, the near hand on his back once it reaches
  const back = v(groHip - 0.15 - docX, 1.2);
  const onBack = smooth((0.8 - back.x) / 0.2);
  const walking = mixPose(
    walk(dd, docOpts),
    walkWithHands(dd, { near: { hand: back, grip: "flat", wrist: 25 } }, docOpts),
    onBack,
  );
  const w = smooth((t - E.climb * 0.8) / (E.climb * 0.2 + 0.3));
  const doc: Placed = {
    pose:
      w <= 0
        ? holding
        : w >= 1
          ? walking
          : mixPose(shiftPose(holding, E.docStart - docX), walking, w),
    x: docX,
    cross: smooth(walkT / 1.1),
  };
  return { gro, doc };
};

// ── Getting out of a cockpit ─────────────────────────────────────────────────────────────────────────────────────
// Climbing out of a single-seater's cockpit sideways, toward the camera, by the halo: the way drivers get out (both
// hands on the halo, haul up, a foot up on the side of the chassis, step out), then down the car's side to the ground.
// Facing along the car (forward = toward the nose) until EXIT_TURN, then turned to face away from the car (the way he
// steps down and walks off). The caller gives the geometry in the figure frame (y up from the ground he ends on) of
// the way he faces — from EXIT_TURN on, the turned frame; the heights may come from a drawing rather than a true
// elevation (a foothold further from the camera shows higher up), so nothing here assumes them. u 0..1:
//   0     sitting in the cockpit, legs in the footwell, both hands up on the halo (far hand on the central pillar, near
//         hand on the hoop's near side), head and shoulders above the rim;
//   0.12  hauling himself up on the halo, feet drawn back under him;
//   0.24  standing on the floor of the cockpit, leaning over the halo on both arms;
//   0.36  the near foot lifted out onto the rim (the far hand has moved from the pillar to the hoop);
//   0.48  pushed up off the hoop onto that foot, crouched over the side;
//   0.6   the far leg over: both feet on the rim (the hands have let go); he turns on the spot, both feet where they
//         are, so the far foot, behind him while he faced the nose, is now the front one;
//   0.69  that front (far) foot reaches down onto the sill and takes his weight, the near leg crouched on the rim;
//   0.79  he lowers himself on it and the trailing near foot comes down past it to the ground beside the car;
//   0.9   the far foot off the sill, down to the ground where the walk starts;
//   1     the near foot a step on: standing, the first frame of the stumble away.
// Rules the keys keep (MOT-5, MOT-7, ART-18): a hand that holds the halo stays on its point until it lets go (the
// caller checks reach); a planted foot stays where it is; every planted foot is within reach and never higher than
// just under the hip, so knees bend forward only and no thigh swings back behind the body; a limb changes layer only
// where it overlaps nothing it changes sides of, so no limb passes through the halo, the cockpit side or a rail. A
// side-on figure cannot show a leg stepping toward the camera, so a leg lifted out over the cockpit side swings its
// knee forward over the hoop — drawn in front of the hoop, which is where a leg going out over the side is — and the
// steps down toward the camera are drawn as steps down (a foothold nearer the camera shows lower).
export type CockpitExit = {
  floor: number; // the cockpit floor he stands on (y)
  rim: number; // top of the cockpit's near side, where he steps out (y)
  step: number; // x of his near foot on the rim (behind the hoop's foot, so the leg clears the halo)
  sill: V; // the first foothold down the car's side, where the far foot steps down (ankle-less: the sole's height)
  beside: V; // the ground beside the car where the near foot comes down (the sole's height)
  pillar: V; // wrist target of the far hand on the halo's central pillar
  hoop: V; // wrist target of the near hand on the hoop's near side
};
// Where a part is, for the caller's layering:
//   "cockpit"  inside, behind the halo's near side, showing only above the rim;
//   "lifting"  still within the cockpit's outline (showing only above the rim) but nearer than the halo's near side:
//              a leg on its way out over the side;
//   "out"      over the side, on the cockpit side of the barrier;
//   "front"    in front of the barrier.
export type ExitLayer = "cockpit" | "lifting" | "out" | "front";
export const EXIT_FORWARD = CLIMB_FORWARD; // the hip ends this far forward of the ground point
// He turns from facing the nose to facing away from the car here (both feet on the rim, hands off the halo): from this
// u on, the caller gives the geometry in the turned frame and draws him facing the other way.
export const EXIT_TURN = 0.6;
// when each part changes layer (u: at the top of its swing), and when each hand lets go of the halo
// (a leg starts lifting as its swing out begins, is out once its foot is on the rim, and goes in front of the barrier
// at the top of its swing down; the body goes out once the hip is over the side)
export const EXIT_SWITCH = {
  nearLegLift: 0.24,
  nearLegOut: 0.36,
  bodyOut: 0.48,
  farLegLift: 0.48,
  farLegOut: 0.6,
  farLegFront: 0.645,
  nearLegFront: 0.74,
  bodyFront: 0.78,
  farHandOff: 0.24, // = the key where it starts to move (to the hoop: back on at farHandOn)
  farHandOn: 0.36,
  nearHandOff: 0.48,
};
// How a foot swings into a key: which foot, how high it rises over the straight line (m, at mid-swing), how much its
// toe points down on the way, and `out` > 1 to move out (along x) ahead of coming down — a foot stepping off a ledge
// goes forward before it drops.
type Swing = { foot: "near" | "far"; lift: number; toe: number; out?: number };
type ExitKey = { u: number; pose: Pose; swing?: Swing };
const mirrorX = (p: V): V => v(-p.x, p.y);
const EXIT_KEYS = (g: CockpitExit, turned: boolean): ExitKey[] => {
  const F = g.floor;
  const R = g.rim;
  const end = shiftPose(stumble(0), EXIT_FORWARD);
  const hold = (hand: V, wrist: number): ArmPose => ({
    hand,
    grip: "hold",
    wrist,
    elbowOut: -1,
  });
  const both = { near: hold(g.hoop, -40), far: hold(g.pillar, -20) };
  const free = {
    near: { shoulder: 38, elbow: 34, grip: "open", wrist: 10 } as ArmPose,
    far: { shoulder: 52, elbow: 30, grip: "open", wrist: 10 } as ArmPose,
  };
  // the far hand moves from the pillar to the hoop beside the near hand, to push up off both
  const onHoop = { near: both.near, far: hold(v(g.hoop.x - 0.13, g.hoop.y - 0.02), -40) };
  const onFloor = (x: number): FootPose => ({ ankle: v(x, F + BONES.ankle), pitch: 0 });
  const onRim = (x: number, pitch = 0): FootPose => ({ ankle: v(x, R + BONES.ankle), pitch });
  // crouched on the rim, both feet on it, facing the nose (in the frame of the nose, whatever g's frame is)
  const crouch = (step: number): Pose => ({
    hip: v(-0.04, R + 0.4),
    pelvis: 26,
    chest: 42,
    head: 0,
    feet: { near: onRim(step), far: onRim(step - 0.16, 10) },
    arms: free,
  });
  if (!turned)
    return [
      {
        u: 0,
        pose: {
          hip: v(0.16, F + 0.12),
          pelvis: -20,
          chest: 24,
          head: -6,
          // legs out along the footwell, knees a little up
          feet: {
            near: { ankle: v(0.82, F + 0.16), pitch: -30 },
            far: { ankle: v(0.8, F + 0.15), pitch: -30 },
          },
          arms: both,
        },
      },
      {
        u: 0.12,
        pose: {
          hip: v(0.06, F + 0.42),
          pelvis: 20,
          chest: 32,
          head: -8,
          feet: { near: onFloor(0.12), far: onFloor(0.0) },
          arms: both,
        },
      },
      {
        u: 0.24,
        pose: {
          hip: v(0.0, F + 0.8),
          pelvis: 24,
          chest: 48,
          head: -6,
          feet: { near: onFloor(-0.04), far: onFloor(-0.14) },
          arms: both,
        },
      },
      {
        u: 0.36,
        pose: {
          hip: v(-0.02, F + 0.84),
          pelvis: 26,
          chest: 44,
          head: -4,
          feet: {
            near: onRim(g.step),
            far: { ankle: v(-0.14, F + BONES.ankle + 0.02), pitch: 24 },
          },
          arms: onHoop,
        },
      },
      {
        u: 0.48,
        pose: {
          hip: v(-0.04, R + 0.32),
          pelvis: 30,
          chest: 50,
          head: -2,
          feet: {
            near: onRim(g.step),
            far: { ankle: v(-0.12, F + BONES.ankle + 0.06), pitch: 46 },
          },
          arms: onHoop,
        },
      },
      { u: EXIT_TURN, pose: crouch(g.step) },
    ];
  // Turned: the same crouch, its hip and feet where they were (g.step is mirrored with the frame, so the crouch is
  // built from the nose frame's step and mirrored back); the body now leans the new way.
  const c = crouch(-g.step);
  const turnedCrouch: Pose = {
    ...c,
    hip: mirrorX(c.hip),
    feet: {
      near: { ankle: mirrorX(c.feet.near.ankle), pitch: 0 },
      far: { ankle: mirrorX(c.feet.far.ankle), pitch: 0 },
    },
  };
  const rimNear = turnedCrouch.feet.near;
  const onSill: FootPose = { ankle: v(g.sill.x, g.sill.y + BONES.ankle), pitch: 0 };
  const onBeside: FootPose = { ankle: v(g.beside.x, g.beside.y + BONES.ankle), pitch: 0 };
  // the far foot comes down flat where the stumble finds it (ball where the stumble's ball is), and rolls up onto
  // its ball by the end
  const ef = end.feet.far;
  const farDown = footFrom(add(ef.ankle, lean(BONES.ball, ef.pitch)), BONES.ball, 0);
  // the hip over the feet that carry him: within reach of each, and well above the higher one
  return [
    { u: EXIT_TURN, pose: turnedCrouch },
    {
      // the front (far) foot down onto the sill, the near leg folded under him on the rim
      u: 0.69,
      pose: {
        hip: v(g.sill.x + 0.03, Math.min(g.sill.y + 0.88, R + 0.3)),
        pelvis: 24,
        chest: 36,
        head: 12,
        feet: { near: rimNear, far: onSill },
        arms: {
          near: { shoulder: 30, elbow: 40, grip: "open", wrist: 10 },
          far: { shoulder: 58, elbow: 26, grip: "open", wrist: 10 },
        },
      },
      swing: { foot: "far", lift: 0.05, toe: 30 },
    },
    {
      // lowered on the sill foot, the near foot down past it to the ground beside the car
      u: 0.79,
      pose: {
        hip: v((g.sill.x + g.beside.x) / 2 + 0.02, g.beside.y + BONES.ankle + 0.78),
        pelvis: 22,
        chest: 30,
        head: 12,
        feet: { near: onBeside, far: onSill },
        arms: {
          near: { shoulder: 44, elbow: 30, grip: "open", wrist: 10 },
          far: { shoulder: 30, elbow: 40, grip: "open", wrist: 10 },
        },
      },
      swing: { foot: "near", lift: 0.06, toe: 25, out: 1.7 },
    },
    {
      // off the sill: the far foot down to the ground where the walk starts
      u: 0.9,
      pose: {
        hip: v((g.beside.x + farDown.ankle.x) / 2 + 0.04, end.hip.y - 0.04),
        pelvis: 16,
        chest: 22,
        head: 12,
        feet: { near: onBeside, far: farDown },
        arms: free,
      },
      swing: { foot: "far", lift: 0.04, toe: 20, out: 1.4 },
    },
    {
      u: 1,
      pose: end,
      swing: { foot: "near", lift: 0.05, toe: 0, out: 1.2 },
    },
  ];
};
export const climbOutOfCockpit = (
  u: number,
  g: CockpitExit,
): {
  pose: Pose;
  layer: Record<BodyPart, ExitLayer>;
  holds: { near: boolean; far: boolean };
} => {
  const x = clamp01(u);
  const keys = EXIT_KEYS(g, x >= EXIT_TURN);
  let i = 0;
  while (i < keys.length - 2 && x > keys[i + 1].u) i++;
  const a = keys[i];
  const b = keys[i + 1];
  const k = clamp01((x - a.u) / (b.u - a.u));
  const pose = mixPose(a.pose, b.pose, smooth(k));
  // a swinging foot goes up and over what it crosses
  const over = Math.sin(Math.PI * k);
  if (x < EXIT_TURN) {
    // half way it is drawn up to `clear` (an ankle height), a little ahead of the hip, the knee up like a hurdler's
    const lift = (ankle: V, clear: number, ahead: number) => {
      const mid = v(pose.hip.x + ahead, clear);
      ankle.x += (mid.x - ankle.x) * over;
      ankle.y += (mid.y - ankle.y) * over;
    };
    if (i === 2) lift(pose.feet.near.ankle, g.rim + 0.1, -0.04); // near foot up and out onto the rim
    if (i === 4) lift(pose.feet.far.ankle, g.rim + 0.12, -0.08); // far foot up and out onto the rim
  } else if (b.swing) {
    // stepping down: the foot leaves its hold, (out first, if it steps off a ledge) then down onto the next
    const s = b.swing;
    const from = a.pose.feet[s.foot].ankle;
    const to = b.pose.feet[s.foot].ankle;
    const ex = smooth(Math.min(1, k * (s.out ?? 1)));
    const ey = smooth(k);
    const foot = pose.feet[s.foot];
    foot.ankle = v(
      from.x + (to.x - from.x) * ex,
      from.y + (to.y - from.y) * ey + s.lift * over,
    );
    foot.pitch += s.toe * over;
  }
  const S = EXIT_SWITCH;
  const side = (lifting: number, out: number, front: number): ExitLayer =>
    x < lifting ? "cockpit" : x < out ? "lifting" : x < front ? "out" : "front";
  const body = side(S.bodyOut, S.bodyOut, S.bodyFront);
  return {
    pose,
    layer: {
      nearLeg: side(S.nearLegLift, S.nearLegOut, S.nearLegFront),
      farLeg: side(S.farLegLift, S.farLegOut, S.farLegFront),
      body,
      nearArm: body,
    },
    holds: {
      near: x < S.nearHandOff,
      far: x < S.farHandOff || (x >= S.farHandOn && x < S.nearHandOff),
    },
  };
};
