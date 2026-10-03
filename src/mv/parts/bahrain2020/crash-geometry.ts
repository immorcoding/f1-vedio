// Shot 3.2's choreography as pure data (no React), so the scene and the overlap check use the same numbers (ART-18).
// World: metres, x along the straight in the race direction, y to the right of it (down the screen on the map).
// Facts (docs/production/facts.md): GRO crossing from the left of the track to the right, his right rear wheel touches
// KVY's left front wheel at 241 km/h; the Haas yaws right and hits the guardrail behind the run-off at 192 km/h, 29°.
import { AT01, VF20 } from "../../../cars/cars-2020.ts";
import { carLength, carPoint } from "../../../cars/spec.ts";

export const FPS = 60;
export const CAR_HALF_WIDTH = 1.0; // tyre outer faces, 2.0 m wide car
const TYRE_OUT = { rear: 0.8 + 0.2025, front: 0.85 + 0.1525 }; // outer tyre face from the centre line (plan.ts)

export const L_GRO = carLength(VF20);
export const L_KVY = carLength(AT01);
const GRO_RA = carPoint(VF20, "rearAxle").x;
const GRO_FA = carPoint(VF20, "frontAxle").x;
const KVY_FA = carPoint(AT01, "frontAxle").x;
// The kick at the right rear (KVY's wheel pushing it left) turns the car about its front axle: the rear swings away
// from KVY while the nose turns right.
const GRO_CG = GRO_FA;

export const TRACK_HALF = 7.5; // the straight is ~15 m wide
export const IMPACT_ANGLE = 29; // degrees, to the barrier (FIA)
const V0 = 67; // m/s = 241 km/h at the moment of contact (FIA)
const V_IMPACT = 53.3; // m/s = 192 km/h at the barrier (FIA)
const KVY_Y = -0.4; // KVY just left of the middle of the track
export const CONTACT_Y = KVY_Y - TYRE_OUT.rear - TYRE_OUT.front; // GRO's centre line at the touch: tyre face to tyre face
const LATERAL = 2.6; // m/s, GRO's sideways speed as he moves across in front of KVY
const LAG = 0.9; // how far the path lags the heading after the kick (0 = none)
const KVY_BRAKE = 40; // m/s², KVY brakes hard after the hit

export type CarPose = {
  // rear end, on the centre line (MangaCar top view's `at`), and the nose direction in degrees (clockwise = right)
  x: number;
  y: number;
  heading: number;
};

export type CrashPlan = {
  frames: number; // shot length
  contact: number; // frame of the touch (bar 60 beat 3)
  gro: CarPose[];
  kvy: CarPose[];
  barrierY: number; // the guardrail line, where GRO's nose arrives on the last frame
  contactPoint: { x: number; y: number };
};

const smooth = (u: number) => u * u * (3 - 2 * u);

export const planCrash = (frames: number, contact: number): CrashPlan => {
  const gro: CarPose[] = [];
  const kvy: CarPose[] = [];
  const dt = 1 / FPS;
  // KVY: at V0 until the touch, then braking
  let kx = 0;
  for (let f = 0; f <= frames; f++) {
    kvy.push({ x: kx, y: KVY_Y, heading: 0 });
    const v =
      f < contact ? V0 : Math.max(30, V0 - KVY_BRAKE * (f - contact) * dt);
    kx += v * dt;
  }
  // GRO before the touch: level with KVY (his rear axle at KVY's front axle at the touch), drifting right
  const kAtContact = kvy[contact].x;
  const groRearAtContact = kAtContact + KVY_FA - GRO_RA;
  const heading0 = (Math.atan2(LATERAL, V0) * 180) / Math.PI;
  for (let f = 0; f < contact; f++) {
    const s = (contact - f) * dt;
    // he came across from the left: sideways motion starts ~1.4 s before the touch
    const lat = Math.min(s, 1.4) * LATERAL;
    const startedMoving = s < 1.4;
    gro.push({
      x: groRearAtContact - V0 * s + 0.35 * Math.min(s, 2), // KVY closing on him a little
      y: CONTACT_Y - lat,
      heading: startedMoving ? heading0 : 0,
    });
  }
  // after the touch: the rear is kicked, the car yaws right about its middle and runs off at the impact angle
  let cx = groRearAtContact + GRO_CG * Math.cos((heading0 * Math.PI) / 180);
  let cy = CONTACT_Y + GRO_CG * Math.sin((heading0 * Math.PI) / 180);
  const after = frames - contact;
  let clearedAt = -1;
  for (let i = 0; i <= after; i++) {
    const u = i / after;
    const heading =
      heading0 +
      (IMPACT_ANGLE - heading0) * Math.min(1, smooth(Math.min(1, u * 1.35)));
    const h = (heading * Math.PI) / 180;
    gro.push({
      x: cx - GRO_CG * Math.cos(h),
      y: cy - GRO_CG * Math.sin(h),
      heading,
    });
    // the car slides: the kick turns its nose right first, and its path follows behind the heading
    const v = V0 + (V_IMPACT - V0) * u;
    // ... and it only starts across the track once its tail is clear of KVY's nose (ART-18: touch, never overlap)
    const rearX = cx - GRO_CG * Math.cos(h);
    const clear = rearX > kvy[contact + i].x + L_KVY + 0.3;
    if (clear && clearedAt < 0) clearedAt = i;
    const w = clearedAt < 0 ? 0 : Math.min(1, (i - clearedAt) / (after * 0.25));
    // (the kick also checks his drift across: straight on until the tail is clear)
    const path = (heading * Math.pow(u, LAG) * w * Math.PI) / 180;
    cx += v * Math.cos(path) * dt;
    cy += v * Math.sin(path) * dt;
  }
  const last = gro[frames];
  const lh = (last.heading * Math.PI) / 180;
  const barrierY =
    last.y + L_GRO * Math.sin(lh) + CAR_HALF_WIDTH * 0.3 * Math.cos(lh);
  return {
    frames,
    contact,
    gro,
    kvy,
    barrierY,
    contactPoint: { x: kAtContact + KVY_FA, y: KVY_Y - TYRE_OUT.front },
  };
};

// ── Overlap check (ART-18): the cars' plan footprints as rectangles (rear end → nose, 2.0 m wide) ─────────────

type V = { x: number; y: number };
const corners = (p: CarPose, length: number): V[] => {
  const h = (p.heading * Math.PI) / 180;
  const ux = { x: Math.cos(h), y: Math.sin(h) };
  const uy = { x: -Math.sin(h), y: Math.cos(h) };
  const w = CAR_HALF_WIDTH;
  return [
    [0, -w],
    [length, -w],
    [length, w],
    [0, w],
  ].map(([a, b]) => ({
    x: p.x + ux.x * a + uy.x * b,
    y: p.y + ux.y * a + uy.y * b,
  }));
};

// Penetration depth of two convex polygons (separating-axis test): 0 when apart or just touching.
export const penetration = (A: V[], B: V[]) => {
  let min = Infinity;
  for (const poly of [A, B]) {
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i];
      const b = poly[(i + 1) % poly.length];
      const len = Math.hypot(b.x - a.x, b.y - a.y);
      const n = { x: -(b.y - a.y) / len, y: (b.x - a.x) / len };
      const proj = (P: V[]) => P.map((p) => p.x * n.x + p.y * n.y);
      const pa = proj(A);
      const pb = proj(B);
      const o =
        Math.min(Math.max(...pa), Math.max(...pb)) -
        Math.max(Math.min(...pa), Math.min(...pb));
      if (o <= 0) return 0;
      min = Math.min(min, o);
    }
  }
  return min;
};

export const carOverlap = (plan: CrashPlan, f: number) =>
  penetration(corners(plan.gro[f], L_GRO), corners(plan.kvy[f], L_KVY));
