// The damage of the 1989 touch (shot 1.4) as plain data and physics, no React: the picture (WingDamage.tsx) draws it
// and node can test it (debris never moves back against the cars' motion).
//
// What happened, physically: at low speed in the chicane SEN's nose ran into PRO's right front wheel, on SEN's left —
// the far side from the 1.4 camera. The wheel's tread shoved the far half of SEN's front wing back toward the car and
// up: the half breaks along its root beside the nose and folds up and back, away from the force, still hanging on; its
// outer flap and the endplate's front corner snap off along clean straight fracture lines; the nose tip crumples
// against the tyre. The few pieces that come off keep the car's forward speed, get a sideways kick out of the contact
// (toward the open side, mostly up and out ahead of the nose), tumble through the air, land and skid to a stop on
// the road, slowed by friction. They never fly back against the cars' motion.
import { FREEZE_14, HIT } from "./staging.ts";

// ── the car's front wing in car metres (x forward from the rear end, z up; l across, from the centreline out to
// the far side) — MP4/5 side trace and plan (cars-1989.ts) ─────────────────────────────────────────────────────
export const WING = {
  xTe: 3.7, // trailing edge
  xLe: 4.22, // leading edge
  lRoot: 0.2, // where the far half breaks off the nose
  lTip: 0.7, // the endplate
  zHinge: 0.2, // height of the root fracture
};
// The deck's top surface rises toward the back (side trace: 0.26 m at the leading edge, 0.39 m at the trailing edge).
export const deckTop = (x: number) =>
  0.26 + ((WING.xLe - x) / (WING.xLe - WING.xTe)) * 0.13;
// The far endplate (the near one's side outline, cars-1989.ts), its front lower corner broken off along a straight
// fracture from (4.04, 0.161) to (4.217, 0.215).
export const ENDPLATE_CUT: [number, number][] = [
  [4.217, 0.25],
  [3.703, 0.375],
  [3.697, 0.161],
  [4.04, 0.161],
  [4.217, 0.215],
];
// The flap along the trailing edge, from the root out to where its outer part snapped (a diagonal break).
export const FLAP = {
  x0: 3.71,
  x1: 3.81,
  lIn: WING.lRoot,
  lOutTe: 0.47,
  lOutLe: 0.42,
};

// How far the far half has folded: 0 = intact, 1 = final. On 19.1 the picture freezes mid-break (the debris clock
// crawls), then the tyre finishes the fold within a few frames and it stays there.
export const BEND_UP = 50; // degrees, about the root fracture
export const BEND_BACK = 22; // degrees, swept back about the root's rear end
export const debrisTime = (f: number) => {
  const d = f - HIT;
  return d < FREEZE_14
    ? (d * 0.08) / 60
    : (FREEZE_14 * 0.08 + d - FREEZE_14) / 60;
};
export const bendAt = (f: number) => {
  const d = f - HIT;
  if (d < FREEZE_14) return 0.55 + 0.1 * (d / FREEZE_14);
  const k = Math.min(1, (d - FREEZE_14) / 8);
  return 0.65 + 0.35 * (1 - (1 - k) * (1 - k));
};
// The nose tip's crumple, 0–1, on the same clock.
export const crumpleAt = (f: number) => {
  const d = f - HIT;
  if (d < FREEZE_14) return 0.6 + 0.15 * (d / FREEZE_14);
  return Math.min(1, 0.75 + 0.25 * ((d - FREEZE_14) / 6));
};

// A point on the far half (x, l, z) folded by `b`: up about the root line, then back about the root's rear end.
// Returns the side view (x, z) and its depth l (for ordering).
export const fold = (x: number, l: number, z: number, b: number) => {
  const up = (BEND_UP * b * Math.PI) / 180;
  const back = (BEND_BACK * b * Math.PI) / 180;
  const { lRoot: H, zHinge: Z0, xTe: X0 } = WING;
  const l1 = H + (l - H) * Math.cos(up) - (z - Z0) * Math.sin(up);
  const z1 = Z0 + (l - H) * Math.sin(up) + (z - Z0) * Math.cos(up);
  return {
    x: X0 + (x - X0) * Math.cos(back) - (l1 - H) * Math.sin(back),
    z: z1,
    l: H + (x - X0) * Math.sin(back) + (l1 - H) * Math.cos(back),
  };
};

// ── debris ───────────────────────────────────────────────────────────────────────────────────────────────────
// Each piece: its outline in metres about its centre (`fracture` = index of the edge it broke along, inked black: the
// carbon's cross-section), where it starts on the car (car metres), its kick relative to the car (m/s: forward,
// up, across — negative toward the camera), tumble (°/s in the picture plane, flip rad/s about its long axis) and
// air drag (1/s).
export type Piece = {
  name: string;
  colour: "white" | "carbon";
  shape: [number, number][];
  fracture: number;
  from: { x: number; l: number; z: number };
  kick: { fwd: number; up: number; across: number };
  spin: number;
  flip: number;
  drag: number;
};
export const PIECES: Piece[] = [
  {
    name: "outer flap",
    colour: "white",
    shape: [
      [-0.125, -0.05],
      [0.11, -0.05],
      [0.14, 0.05],
      [-0.125, 0.05],
    ],
    fracture: 1,
    from: { x: 3.76, l: 0.58, z: 0.42 },
    kick: { fwd: 1.2, up: 2.4, across: -0.9 },
    spin: 520,
    flip: 11,
    drag: 0.7,
  },
  {
    name: "endplate corner",
    colour: "white",
    shape: [
      [0.085, -0.025],
      [-0.09, -0.025],
      [0.085, 0.03],
    ],
    fracture: 1,
    from: { x: 4.13, l: 0.62, z: 0.3 },
    kick: { fwd: 1.8, up: 1.4, across: -0.5 },
    spin: -800,
    flip: 8,
    drag: 0.5,
  },
  {
    name: "carbon shard",
    colour: "carbon",
    shape: [
      [-0.07, -0.02],
      [0.06, -0.035],
      [0.075, 0.015],
      [-0.03, 0.03],
    ],
    fracture: 0,
    from: { x: 4.0, l: 0.5, z: 0.35 },
    kick: { fwd: 0.8, up: 2.9, across: -1.6 },
    spin: 1000,
    flip: 13,
    drag: 0.9,
  },
  {
    name: "carbon shard 2",
    colour: "carbon",
    shape: [
      [-0.05, -0.03],
      [0.05, -0.02],
      [0.02, 0.035],
    ],
    fracture: 0,
    from: { x: 4.18, l: 0.66, z: 0.25 },
    kick: { fwd: 2.4, up: 1.1, across: 0.4 },
    spin: -1200,
    flip: 10,
    drag: 0.8,
  },
  {
    name: "chip",
    colour: "carbon",
    shape: [
      [-0.018, -0.016],
      [0.02, -0.012],
      [0.016, 0.018],
      [-0.014, 0.014],
    ],
    fracture: 0,
    from: { x: 4.05, l: 0.45, z: 0.32 },
    kick: { fwd: 1.0, up: 2.0, across: -2.2 },
    spin: 1500,
    flip: 15,
    drag: 1.2,
  },
  {
    name: "white chip",
    colour: "white",
    shape: [
      [-0.02, -0.012],
      [0.018, -0.016],
      [0.012, 0.016],
    ],
    fracture: 0,
    from: { x: 3.9, l: 0.55, z: 0.4 },
    kick: { fwd: 0.6, up: 3.2, across: -1.2 },
    spin: -1700,
    flip: 14,
    drag: 1.3,
  },
];

const G = 9.81;
const MU = 0.55; // carbon sliding on asphalt

// Where a piece is `t` seconds (debris clock) after the touch, in car-relative start terms: forward and across
// displacement (m), height (m), and its tumble. `v0` is the car's speed at the touch (m/s).
export const pieceAt = (p: Piece, t: number, v0: number) => {
  const vx = v0 + p.kick.fwd;
  const vz = p.kick.across;
  const vh = Math.hypot(vx, vz);
  const ux = vx / vh;
  const uz = vz / vh;
  const y0 = p.from.z;
  const land = (p.kick.up + Math.sqrt(p.kick.up ** 2 + 2 * G * y0)) / G;
  const tf = Math.min(t, land);
  // in the air: drag slows the horizontal motion, gravity the vertical
  let s = (vh * (1 - Math.exp(-p.drag * tf))) / p.drag;
  const y = Math.max(0, y0 + p.kick.up * tf - 0.5 * G * tf * tf);
  const flipAir = (u: number) => 0.3 + 0.7 * Math.abs(Math.cos(p.flip * u));
  let angle = p.spin * tf;
  let flat = flipAir(tf);
  if (t > land) {
    // on the road: it skids, friction brings it to a stop; the tumble dies with it, and it lies flat
    const vl = vh * Math.exp(-p.drag * land);
    const a = MU * G;
    const stop = vl / a;
    const u = Math.min(t - land, stop);
    s += vl * u - 0.5 * a * u * u;
    angle += p.spin * 0.35 * (u - (u * u) / (2 * stop));
    const k = Math.min(1, (t - land) / 0.1);
    flat = flipAir(land) + (0.3 - flipAir(land)) * k;
  }
  return { fwd: s * ux, across: s * uz, y, angle, flat, landed: t > land };
};
