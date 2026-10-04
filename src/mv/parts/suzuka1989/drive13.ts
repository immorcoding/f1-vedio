// Shot 1.3 as real driving (MOT-5): the two McLarens come out of 130R flat out at 300 km/h, PRO leading on the left,
// SEN in his tow. SEN pulls out to the right, PRO brakes for the Casio Triangle, SEN brakes later and draws alongside on
// the inside, PRO turns in across him and their front wheels touch. Speeds and decelerations are real-world figures;
// the screen time runs at real speed until the braking point and then in an explicit half-speed slow motion, so the
// dive can be read without driving the cars slowly.
//
// Everything is a function of real (race) time t, seconds from the start of the shot; `realTime(τ)` maps screen time
// to it. Pure TypeScript, no React: the picture and the interpenetration check (ART-18) both read it.
import { corners, separation, type Footprint } from "../../overlap.ts";
import { poseAt } from "../../../tracks/track.ts";
import { SUZUKA_1989 } from "../../../tracks/suzuka-1989.ts";

const T = SUZUKA_1989;
const C = T.corners.chicane;

// ── real-world figures ────────────────────────────────────────────────────────────────────────────────
export const V_TOP = 83; // m/s, 300 km/h at the end of the back straight after 130R
export const V_CORNER = 24; // m/s, ~85 km/h at the turn-in of the chicane
export const DECEL = 38; // m/s², ~3.9 g under braking (1989 carbon brakes)
const BRAKE_TIME = (V_TOP - V_CORNER) / DECEL; // 1.55 s

// ── screen time → real time: real speed, then half-speed slow motion from the braking point ──────────────────
export const SLOWMO_AT = 3.0; // s of screen time
const SLOWMO_RAMP = 0.3; // s over which the rate eases from 1 to SLOWMO
export const SLOWMO = 0.5;
export const rate = (tau: number) => {
  if (tau <= SLOWMO_AT) return 1;
  const k = Math.min(1, (tau - SLOWMO_AT) / SLOWMO_RAMP);
  const e = k * k * (3 - 2 * k);
  return 1 + (SLOWMO - 1) * e;
};
export const realTime = (tau: number) => {
  // integral of rate, closed form for the smoothstep ramp
  if (tau <= SLOWMO_AT) return tau;
  const r = Math.min(tau - SLOWMO_AT, SLOWMO_RAMP);
  const k = r / SLOWMO_RAMP;
  const rampIntegral = SLOWMO_RAMP * (k + (SLOWMO - 1) * (k ** 3 - k ** 4 / 2));
  return (
    SLOWMO_AT +
    rampIntegral +
    Math.max(0, tau - SLOWMO_AT - SLOWMO_RAMP) * SLOWMO
  );
};

// ── the plan, laid out backward from the contact ───────────────────────────────────────────────────────────
// The shot is 7.5 s of screen time; the touch happens 0.12 s of screen time before the cut, so the side shot on 19.1
// picks up the impact.
export const SHOT_SECONDS = 7.5;
export const T_CONTACT = realTime(SHOT_SECONDS - 0.12);
const TURN_IN = 0.7; // s from PRO's turn-in to the touch
const T_MIN_PRO = T_CONTACT - TURN_IN - 0.15; // PRO down to corner speed
export const T_BRAKE_PRO = T_MIN_PRO - BRAKE_TIME;
// PRO at the touch: just before the chicane's first (right-hand) apex, at the mouth of the escape road.
const S_CONTACT_PRO = C - 10;

// Speed profiles.
const speedPro = (t: number) =>
  t < T_BRAKE_PRO
    ? V_TOP
    : Math.max(V_CORNER, V_TOP - DECEL * (t - T_BRAKE_PRO));
// SEN starts two car lengths behind (12.8 m centre to centre, 8.5 m nose to tail), brakes later and ends 0.5 m behind
// PRO, his left front wheel beside PRO's right front. Both reach corner speed, so the late braking gains exactly
// delay × (V_TOP − V_CORNER).
const GAP0 = 12.8; // "only two car lengths behind" through 130R (facts.md)
const GAP_END = 0.5;
const SEN_LATE = (GAP0 - GAP_END) / (V_TOP - V_CORNER);
export const T_BRAKE_SEN = T_BRAKE_PRO + SEN_LATE;
const speedSen = (t: number) =>
  t < T_BRAKE_SEN
    ? V_TOP
    : Math.max(V_CORNER, V_TOP - DECEL * (t - T_BRAKE_SEN));

// Distance covered between t0 and t1 under a speed profile (numeric, 1 ms steps).
const travelled = (v: (t: number) => number, t0: number, t1: number) => {
  const n = Math.max(1, Math.ceil(Math.abs(t1 - t0) / 0.001));
  const h = (t1 - t0) / n;
  let d = 0;
  for (let i = 0; i < n; i++) d += v(t0 + (i + 0.5) * h) * h;
  return d;
};
const S0_PRO = S_CONTACT_PRO - travelled(speedPro, 0, T_CONTACT);
const S0_SEN = S_CONTACT_PRO - GAP_END - travelled(speedSen, 0, T_CONTACT);

// Position tables at 2 ms (exact integration of the profiles), for fast lookup by frame.
const DT = 0.002;
const table = (v: (t: number) => number, s0: number) => {
  const n = Math.ceil((T_CONTACT + 1) / DT);
  const out = new Float64Array(n + 1);
  out[0] = s0;
  for (let i = 1; i <= n; i++) out[i] = out[i - 1] + v((i - 0.5) * DT) * DT;
  return out;
};
const TAB_PRO = table(speedPro, S0_PRO);
const TAB_SEN = table(speedSen, S0_SEN);
const lookup = (tab: Float64Array, t: number) => {
  if (t < 0) return tab[0] + V_TOP * t; // before the shot: still flat out
  const x = t / DT;
  const i = Math.min(tab.length - 2, Math.floor(x));
  return tab[i] + (tab[i + 1] - tab[i]) * (x - i);
};

const smooth = (v: number, a: number, b: number) => {
  const k = Math.min(1, Math.max(0, (v - a) / (b - a)));
  return k * k * (3 - 2 * k);
};

// Lateral offsets, m (+ = right of the centreline, the inside of the right-hander). Changes of line take real time
// at real lateral speeds (≤ 12 m/s).
export const LAT_LEFT = -3.4;
export const LAT_INSIDE = 3.2;
const SEN_PULL_OUT = T_BRAKE_PRO - 0.8; // he leaves the tow on the straight, before the braking point
const latSen = (t: number) =>
  LAT_LEFT +
  (LAT_INSIDE - LAT_LEFT) * smooth(t, SEN_PULL_OUT, SEN_PULL_OUT + 0.75);
// PRO turns in toward the apex across SEN's nose. How far he gets is found geometrically: his lateral target is
// solved so that the two footprints (true size, PRO yawed into the turn) first touch exactly at T_CONTACT; after that
// he holds his line (the cars are locked together; shot 1.4 takes over).
const latProTo = (target: number) => (t: number) => {
  // eases in and is still moving across at the touch (he has not finished turning in)
  // (u runs past 1 after the touch only so the heading there is measured on the continuing path)
  const u = Math.max(0, (t - (T_CONTACT - TURN_IN)) / TURN_IN);
  return LAT_LEFT + (target - LAT_LEFT) * Math.pow(u, 1.7);
};

export type CarDrive = {
  s: number; // lap distance, m
  lat: number; // lateral offset, m
  x: number;
  y: number; // map metres (middle of the wheelbase)
  v: number; // speed, m/s
  heading: number; // body heading, degrees on the map: along the velocity, plus a little yaw into the turn
  steer: number; // front-wheel angle, degrees (+ = right)
  braking: number; // 0…1, how hard the car is braking now
  latAccel: number; // m/s², + = toward the right (for the roll cue)
};

const headingOf = (
  sOf: (t: number) => number,
  latOf: (t: number) => number,
  t: number,
  h: number,
) => {
  const a = poseAt(T, sOf(t - h), latOf(t - h));
  const b = poseAt(T, sOf(t + h), latOf(t + h));
  return (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
};

const drive = (
  t: number,
  sOf: (t: number) => number,
  latOf: (t: number) => number,
  vOf: (t: number) => number,
  brakeAt: number,
): CarDrive => {
  const s = sOf(t);
  const lat = latOf(t);
  const p = poseAt(T, s, lat);
  // MOT-5: the heading follows the velocity, measured on the path itself (over ±0.03 s, a few metres, so the 4 m
  // centreline samples do not show as jitter)
  const vel = headingOf(sOf, latOf, t, 0.03);
  const H = 0.06;
  let dHead =
    headingOf(sOf, latOf, t + H, 0.03) - headingOf(sOf, latOf, t - H, 0.03);
  while (dHead > 180) dHead -= 360;
  while (dHead < -180) dHead += 360;
  const yawRate = (dHead * Math.PI) / 180 / (2 * H); // rad/s
  const v = vOf(t);
  const curvature = yawRate / Math.max(1, v); // 1/m
  const WHEELBASE = 2.94;
  // Ackermann angle, a little more (the car follows the wheels with a slip angle), and the front wheels lead the
  // body: the steer is taken 0.08 s ahead
  const ahead = (() => {
    let d =
      headingOf(sOf, latOf, t + H + 0.08, 0.03) -
      headingOf(sOf, latOf, t - H + 0.08, 0.03);
    while (d > 180) d -= 360;
    while (d < -180) d += 360;
    return (d * Math.PI) / 180 / (2 * H) / Math.max(1, v);
  })();
  const steer = ((Math.atan(WHEELBASE * ahead) * 180) / Math.PI) * 1.25;
  // the body yaws a little into the turn (slip angle), lagging the wheels
  const heading =
    vel + 0.2 * ((Math.atan(WHEELBASE * curvature) * 180) / Math.PI);
  const braking = t >= brakeAt && v > V_CORNER + 0.5 ? 1 : 0;
  return {
    s,
    lat,
    x: p.x,
    y: p.y,
    v,
    heading,
    steer,
    braking,
    latAccel: v * yawRate,
  };
};

const sPro = (u: number) => lookup(TAB_PRO, u);
const sSen = (u: number) => lookup(TAB_SEN, u);
const senFree = (t: number) => drive(t, sSen, latSen, speedSen, T_BRAKE_SEN);

// Footprint of a drive state (true size): centre 0.12 m ahead of the middle of the wheelbase.
export const footprintOf = (id: string, c: CarDrive, scale = 1): Footprint => {
  const a = (c.heading * Math.PI) / 180;
  return {
    id,
    x: c.x + Math.cos(a) * 0.12 * scale,
    y: c.y + Math.sin(a) * 0.12 * scale,
    heading: c.heading,
    length: 4.26,
    width: 2.12,
    scale,
  };
};

// Solve PRO's lateral target: bisection on the separation of the two footprints at T_CONTACT.
const LAT_PRO_CONTACT = (() => {
  const sep = (target: number) =>
    separation(
      corners(
        footprintOf(
          "PRO",
          drive(T_CONTACT, sPro, latProTo(target), speedPro, T_BRAKE_PRO),
        ),
      ),
      corners(footprintOf("SEN", senFree(T_CONTACT))),
    );
  let lo = LAT_LEFT; // apart
  let hi = LAT_INSIDE - 1; // overlapping
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (sep(mid) > 0) lo = mid;
    else hi = mid;
  }
  return lo;
})();
const latPro = latProTo(LAT_PRO_CONTACT);
const proFree = (t: number) => drive(t, sPro, latPro, speedPro, T_BRAKE_PRO);

// After the touch the two cars are locked together: both keep their poses at the touch and travel on as one, along
// the mean of their headings, at corner speed (shot 1.4 shows them sliding to a stop).
const PRO_C = proFree(T_CONTACT);
const SEN_C = senFree(T_CONTACT);
const LOCKED = (() => {
  const a = (((PRO_C.heading + SEN_C.heading) / 2) * Math.PI) / 180;
  return { dx: Math.cos(a), dy: Math.sin(a) };
})();
const locked = (c: CarDrive, t: number): CarDrive => {
  const d = V_CORNER * (t - T_CONTACT);
  return {
    ...c,
    x: c.x + LOCKED.dx * d,
    y: c.y + LOCKED.dy * d,
    s: c.s + d,
    steer: c.steer,
    braking: 1,
  };
};
export const proAt = (t: number) =>
  t <= T_CONTACT ? proFree(t) : locked(PRO_C, t);
export const senAt = (t: number) =>
  t <= T_CONTACT ? senFree(t) : locked(SEN_C, t);

// Lap distance where each car started braking (for the brake marks and the marker boards).
export const BRAKE_S = {
  pro: lookup(TAB_PRO, T_BRAKE_PRO),
  sen: lookup(TAB_SEN, T_BRAKE_SEN),
};
export const START_S = S0_PRO;
