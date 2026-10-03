// Where everyone stands in shot 3.6, frame by frame, in the trackside camera's world metres (wreck-geometry.ts): GRO
// over the rails and walking away with planted feet, the doctor at his back, the marshal at the cockpit. Pure
// TypeScript, so the picture (Escape.tsx) and the interpenetration check (src/mv/overlap.ts) share it.
import { walkAdvance, walkPose, type BodyPose } from "../../../kit/gait.ts";
import { HALO_WORLD } from "./wreck-geometry.ts";

// cubic ease in-out ramp 0→1 between frames a and b (as common.ts ramp's default)
const ramp = (f: number, a: number, b: number) => {
  const u = Math.min(1, Math.max(0, (f - a) / (b - a)));
  return u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
};

// Over the top rail: astride it, then the trailing leg comes over and he steps down.
const CLIMB_A: BodyPose = {
  lean: 34,
  hipY: 1.3,
  head: 10,
  near: {
    leg: { thigh: 38, knee: 64, foot: 4 },
    arm: { shoulder: 55, elbow: 25 },
  },
  far: {
    leg: { thigh: -78, knee: 42, foot: 20 },
    arm: { shoulder: 82, elbow: 8 },
  },
};
const CLIMB_B: BodyPose = {
  lean: 20,
  head: 6,
  near: {
    leg: { thigh: 10, knee: 12, foot: 0 },
    arm: { shoulder: 30, elbow: 30 },
  },
  far: {
    leg: { thigh: -22, knee: 40, foot: 20 },
    arm: { shoulder: 70, elbow: 12 },
  },
};
const mix = (a: BodyPose, b: BodyPose, u: number): BodyPose => {
  const m = (x: number, y: number) => x + (y - x) * u;
  const leg = (p: BodyPose["near"]["leg"], q: BodyPose["near"]["leg"]) => ({
    thigh: m(p.thigh, q.thigh),
    knee: m(p.knee, q.knee),
    foot: m(p.foot, q.foot),
  });
  const arm = (p: BodyPose["near"]["arm"], q: BodyPose["near"]["arm"]) => ({
    shoulder: m(p.shoulder, q.shoulder),
    elbow: m(p.elbow, q.elbow),
  });
  return {
    lean: m(a.lean, b.lean),
    head: m(a.head ?? 0, b.head ?? 0),
    hipY:
      a.hipY !== undefined && b.hipY !== undefined
        ? m(a.hipY, b.hipY)
        : u < 0.5
          ? a.hipY
          : b.hipY,
    near: {
      leg: leg(a.near.leg, b.near.leg),
      arm: arm(a.near.arm, b.near.arm),
    },
    far: { leg: leg(a.far.leg, b.far.leg), arm: arm(a.far.arm, b.far.arm) },
  };
};

export const CLIMB_X = HALO_WORLD.x - 0.2;
export const OVER = 36; // frames he spends coming over the top rail
export const CLIMB_END = 75; // frames into the shot when he is down on the track side and walks
export const WALK_Z = 12.55; // GRO walks along the rails, 0.45 m in front of them
const DOC_Z = 12.78; // the doctor a step deeper, between GRO and the rails
const STRIDE = 0.85;
const CYCLE = 64; // frames per gait cycle (two steps), ~1.9 steps a second: a shaken, careful walk
const GRO_LEAN = 14;
const DOC_LEAN = 10;

// The marshal, braced, facing the cockpit and spraying: front knee bent, back leg long, leaning in; the near hand
// aims the hose nozzle, the far hand holds the cylinder by its handle at his side.
export const MARSHAL_POSE: BodyPose = {
  lean: 18,
  head: 10,
  near: {
    leg: { thigh: 28, knee: 30, foot: 0 },
    arm: { shoulder: 62, elbow: 18 },
  },
  far: {
    leg: { thigh: -20, knee: 6, foot: 12 },
    arm: { shoulder: -4, elbow: 16 },
  },
};
export const MARSHAL_AT = { x: CLIMB_X + 2.5, z: 12.35 };
export const AIM = { x: CLIMB_X + 1.25, y: 0.75, z: 13.4 }; // into the cockpit, beside where GRO came out

// t = frames into the shot
export const stage36 = (t: number) => {
  const step = Math.floor(t / 3) * 3; // poses and positions held together on threes
  const phase = Math.max(0, step - CLIMB_END) / CYCLE;
  // GRO: hauled up behind the rails, stepping down on the track side, then walking away with his feet planted
  const behind = t < OVER;
  const down = ramp(step, OVER, CLIMB_END);
  const groPose: BodyPose = behind
    ? { ...CLIMB_A, hipY: 1.15 + 0.2 * ramp(step, 0, OVER) }
    : t < CLIMB_END
      ? mix(CLIMB_B, walkPose(0, STRIDE, GRO_LEAN), down)
      : walkPose(phase, STRIDE, GRO_LEAN);
  const groAt = behind
    ? { x: CLIMB_X, z: 13.3 }
    : {
        x: CLIMB_X - 0.5 * down - walkAdvance(phase, STRIDE, GRO_LEAN),
        z: 13.0 - (13.0 - WALK_Z) * down,
      };
  // the doctor: beside the rails reaching for him, then walking at his back, a hand on him (the one real contact)
  const docPhase = phase + 0.5;
  const docPose: BodyPose =
    t < CLIMB_END
      ? {
          lean: 16,
          head: -4,
          near: {
            leg: { thigh: 16, knee: 18, foot: 0 },
            arm: { shoulder: 104 - 30 * down, elbow: 20 },
          },
          far: {
            leg: { thigh: -14, knee: 10, foot: 6 },
            arm: { shoulder: 86 - 20 * down, elbow: 34 },
          },
        }
      : (() => {
          const p = walkPose(docPhase, STRIDE, DOC_LEAN);
          return {
            ...p,
            near: { ...p.near, arm: { shoulder: 58, elbow: 34 } },
          };
        })();
  const docAt = {
    x:
      CLIMB_X +
      0.62 -
      0.5 * down -
      (walkAdvance(docPhase, STRIDE, DOC_LEAN) -
        walkAdvance(0.5, STRIDE, DOC_LEAN)),
    z: DOC_Z,
  };
  return { behind, down, groPose, groAt, docPose, docAt };
};
