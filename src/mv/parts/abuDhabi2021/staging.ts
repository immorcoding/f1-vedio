// The run to T5 (bars 82–89, shots 5.1–5.2c) as plain data: one race clock from the drop (82.1) to the lock-up
// (90.1), the speeds of both cars on it, and where each shot puts them. The pictures draw from it, the engine cue
// (src/mv/sfx.ts) plays it, and the interpenetration check (src/mv/overlap.ts, ART-18) tests it. Pure TypeScript so
// node can load it.
//
// True speeds (MOT-5): both cars flat out at ~300 km/h up the straight from T4, HAM ahead with VER in his tow. HAM
// brakes for the hairpin on 88.4 at 4 g; VER brakes 0.15 s later and harder (4.5 g), gains ~5 m and is a nose ahead,
// locking his front-right, on the turn-in at 90.1 (the hit `abuDhabi2021.lockup`, shot 5.3). The cuts between the
// shots compress the straight (the race clock runs on through every cut, but each shot picks its own stretch of road);
// within a shot every car moves at the clock's speed.
import type { Footprint, TopViewSampler } from "../../overlap.ts";
import { FPS, at, frameAt, secondsAt, type Pos } from "../../timing.ts";
import { poseAt } from "../../../tracks/track.ts";
import { YAS_MARINA_2021 } from "../../../tracks/yas-marina-2021.ts";
import { EDIT } from "./shots.ts";

const T = YAS_MARINA_2021;

// The 2021 cars' footprint (cars-2021.ts traces: RB16B 5.57 m, W12 5.75 m; 2.0 m over the tyres). The centre lies
// ~0.2 m ahead of the middle of the wheelbase, which is where topAnchorAt places a car.
export const CAR_2021 = { length: 5.75, width: 2.0, centreAhead: 0.2 };

/** Song seconds since the drop (82.1). */
const DROP = secondsAt(at(82));
export const sinceDrop = (p: Pos) => secondsAt(p) - DROP;

// ── the race clock: speed (m/s) and distance (m) since the drop ──────────────────────────────────────────────────
const V0 = 80; // out of T4
const VMAX = 84; // ~302 km/h at the braking point
const TAU = 3; // s, how fast the car pulls to VMAX
/** HAM's braking point: 88.4, on the beat (the hihats of the drop), 4 g. */
export const HAM_BRAKE = sinceDrop(at(88, 4));
const HAM_DECEL = 40;
/** VER brakes 0.15 s later and harder, and locks his front-right as he turns in. */
export const VER_BRAKE = HAM_BRAKE + 0.15;
const VER_DECEL = 44;
const VMIN = 20;
/** The lock-up: 90.1, the cut to the T5 panel. */
export const LOCKUP = sinceDrop(at(90));

const cruiseV = (t: number) => V0 + (VMAX - V0) * (1 - Math.exp(-t / TAU));
const cruiseD = (t: number) =>
  VMAX * t - (VMAX - V0) * TAU * (1 - Math.exp(-t / TAU));

const braked = (brake: number, decel: number) => {
  const vb = cruiseV(brake);
  const db = cruiseD(brake);
  const tStop = (vb - VMIN) / decel;
  const speed = (t: number) => {
    if (t <= brake) return cruiseV(t);
    return Math.max(VMIN, vb - decel * (t - brake));
  };
  const dist = (t: number) => {
    if (t <= brake) return cruiseD(t);
    const u = Math.min(t - brake, tStop);
    return db + vb * u - 0.5 * decel * u * u + VMIN * Math.max(0, t - brake - tStop);
  };
  return { speed, dist };
};
const HAM_RUN = braked(HAM_BRAKE, HAM_DECEL);
const VER_RUN = braked(VER_BRAKE, VER_DECEL);
/** Road speed, m/s, at t s since the drop. */
export const hamSpeed = HAM_RUN.speed;
export const verSpeed = VER_RUN.speed;
/** Distance since the drop, m. */
export const hamDist = HAM_RUN.dist;
export const verDist = VER_RUN.dist;

/** Braking 0..1 for the picture (nose dive, wheels slowing): how far each car is into its stop. */
export const braking = (t: number, who: "VER" | "HAM") => {
  const b = who === "VER" ? VER_BRAKE : HAM_BRAKE;
  return Math.min(1, Math.max(0, (t - b) / 0.12));
};

// ── VER against HAM: rear end to rear end, m (+ = VER ahead) ─────────────────────────────────────────────────────
// In the tow until 84.1, then he pulls out to the inside and draws up to ~4 m behind (his front wheels level with
// HAM's rear wheels) by 86.1, holds there to the braking point, and out-brakes him: the gain is the clock's.
export const PULL_OUT = sinceDrop(at(84));
const DRAWN_UP = sinceDrop(at(86));
const TOW_GAP = -6.6; // nose 0.9 m from HAM's gearbox
const UP_GAP = -4.1;
const smooth = (u: number) => {
  const x = Math.min(1, Math.max(0, u));
  return x * x * (3 - 2 * x);
};
export const verGap = (t: number) => {
  // before 84.1 a little breathing in the tow (±0.25 m), then the draw-up, then the brakes
  const breathe = 0.25 * Math.sin(t * 2.3) * (1 - smooth((t - PULL_OUT) / 0.5));
  const drawUp = (UP_GAP - TOW_GAP) * smooth((t - PULL_OUT - 0.2) / (DRAWN_UP - PULL_OUT - 0.2));
  const brakes = verDist(t) - hamDist(t);
  return TOW_GAP + breathe + drawUp + brakes;
};
/** Sideways offset from HAM, m, toward the inside (+): in the tow, then out to the inside line. */
export const verAcross = (t: number) =>
  0.35 + 2.35 * smooth((t - PULL_OUT + 0.1) / 0.9);

// ── shots ─────────────────────────────────────────────────────────────────────────────────────────────────────────
const shot = (id: string) => {
  const s = EDIT.shots.find((x) => x.id === id);
  if (!s) throw new Error(`abuDhabi2021: no shot ${id}`);
  return {
    from: frameAt(s.from),
    to: frameAt(s.to),
    /** Race seconds since the drop at the shot's first frame. */
    t0: sinceDrop(s.from),
  };
};
const raceT = (f: number) => (f - frameAt(at(82))) / FPS;

// 5.1 (82): the slam, from above. The straight out of T4; HAM ahead at s, VER in his tow.
export const SLAM_S0 = 905;
export const slamPlan = (t: number) => {
  const sH = SLAM_S0 + hamDist(t);
  return {
    ham: { s: sH, lat: 1.6 },
    ver: { s: sH + verGap(t), lat: 1.6 - verAcross(t) },
  };
};

// 5.1d (86): wheel to wheel from above, on the straight into T5; HAM on the right of the road, VER on the inside.
const SLICE_S0 = 1040;
const SLICE_T0 = sinceDrop(at(86));
export const slicePlan = (t: number) => {
  const sH = SLICE_S0 + hamDist(t) - hamDist(SLICE_T0);
  return {
    ham: { s: sH, lat: 2.8 },
    ver: { s: sH + verGap(t), lat: 2.8 - verAcross(t) },
  };
};

// 5.2 (88–89): T5 from above. HAM's lap distance is set so he reaches the turn-in on the lock-up (90.1); VER keeps
// his gap and his line on the inside (left of HAM, as the drivers see it).
const TURN_IN = YAS_MARINA_2021.corners.t5Apex - 31;
export const t5Plan = (t: number) => {
  const sH = TURN_IN - hamDist(LOCKUP) + hamDist(t);
  // HAM drifts out to the right before turning in; VER dives for the inside kerb
  const brakeU = smooth((t - HAM_BRAKE) / (LOCKUP - HAM_BRAKE));
  const hamLat = 2.8 + 1.0 * brakeU;
  return {
    ham: { s: sH, lat: hamLat },
    ver: { s: sH + verGap(t), lat: hamLat - verAcross(t) - 1.6 * brakeU },
  };
};

const footprint = (id: string, s: number, lat: number, scale = 1): Footprint => {
  const p = poseAt(T, s, lat);
  const a = (p.heading * Math.PI) / 180;
  return {
    id,
    x: p.x + Math.cos(a) * CAR_2021.centreAhead,
    y: p.y + Math.sin(a) * CAR_2021.centreAhead,
    heading: p.heading,
    length: CAR_2021.length,
    width: CAR_2021.width,
    scale,
  };
};
// A side-on car (rear end at x, distance z from the camera) as a footprint on the plan.
const sideOn = (id: string, x: number, z: number): Footprint => ({
  id,
  x: x + CAR_2021.length / 2,
  y: z,
  heading: 0,
  length: CAR_2021.length,
  width: CAR_2021.width,
});

/** Shots 5.1b, 5.1c: where the side-on shots put the cars (rear end x relative to the camera, distance z). */
export const SIDE_Z = { ham: 10, verTow: 10.2, verInside: 12.5 };
export const sidePlan = (t: number, hamX: number) => {
  const across = (verAcross(t) - 0.35) / 2.35;
  return {
    ham: { x: hamX, z: SIDE_Z.ham },
    ver: {
      x: hamX + verGap(t),
      z: SIDE_Z.verTow + (SIDE_Z.verInside - SIDE_Z.verTow) * across,
    },
  };
};

export const SLAM_SCALE = 1;
export const T5_SCALE = 1.2;

export const SAMPLERS: TopViewSampler[] = [
  { id: "5.1", plan: slamPlan, scale: SLAM_SCALE },
  { id: "5.1d", plan: slicePlan, scale: 1 },
  { id: "5.2", plan: t5Plan, scale: T5_SCALE },
].map(({ id, plan, scale }) => ({
  part: "abuDhabi2021",
  shot: id,
  ...shot(id),
  poses: (f: number) => {
    const c = plan(raceT(f));
    return [
      footprint("HAM", c.ham.s, c.ham.lat, scale),
      footprint("VER", c.ver.s, c.ver.lat, scale),
    ];
  },
}));
for (const id of ["5.1b", "5.1c"]) {
  const s = shot(id);
  SAMPLERS.push({
    part: "abuDhabi2021",
    shot: id,
    from: s.from,
    to: s.to,
    poses: (f) => {
      const c = sidePlan(raceT(f), 0);
      return [sideOn("HAM", c.ham.x, c.ham.z), sideOn("VER", c.ver.x, c.ver.z)];
    },
  });
}
