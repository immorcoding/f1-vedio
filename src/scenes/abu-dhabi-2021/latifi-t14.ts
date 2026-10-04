// Latifi's crash at the exit of turn 14, lap 53 (facts.md), as a top-down rigid-body run (MOT-5) for the shot-4.3
// inset. Turn 14 of the 2021 layout is a left-hander (the second of the two lefts by the marina); Latifi, on tyres
// dirtied at turn 9, lost the rear on the exit, spun, hit the outside (right-hand) wall and stopped across the track
// on the racing line.
//
// Phase 1, on the racing line: the car's centre runs along the lap from the apex (inside, 5.5 m left of the centre
// line) out towards the right-hand edge, accelerating from 44 m/s (~160 km/h); its heading is its velocity.
// Phase 2, the spin: at SLIP the rear lets go — the car keeps its momentum in a straight line while the track bends
// on to the left, and it yaws to the left (rear swinging out to the right) as the scrubbing tyres slow it. Its rear
// right corner meets the wall; the contact is a rigid-body impulse at that corner (restitution and wall friction),
// which kills most of the spin and throws the car off the wall; it slides to a stop at an angle across the track.
// Times are seconds since bar 80 (the inset's first frame); everything is integrated once, at 240 Hz, on load.
import { FW43B, wheelbaseMiddle } from "../../cars";
import { poseAt, YAS_MARINA_2021, type MapPoint } from "../../tracks";

const T = YAS_MARINA_2021;
export const T14_APEX = 4568; // lap distance of the turn-14 apex on the 2021 centre line, m
// The outside wall on the exit: a narrow paved run-off, then the concrete wall's face this far right of the centre
// line, m.
export const T14_RUNOFF = 2.5;
export const WALL_FACE = T.width / 2 + T14_RUNOFF;

const S0 = T14_APEX - 12; // where the car is at t = 0
const V0 = 44; // m/s along the centre line (the car on the inside covers less: ~37 m/s, 135 km/h)
const ACC = 7; // m/s², accelerating out of the corner
export const SLIP = 0.25; // s: the rear lets go
const DT = 1 / 240;
const END = 2.2; // s

// The racing line: apex on the inside, unwinding to the right-hand edge on the exit.
const lineLat = (s: number) => {
  const u = Math.min(1, Math.max(0, (s - (T14_APEX - 10)) / 90));
  return -5.5 + 11 * u * u * (3 - 2 * u);
};
const lineS = (t: number) => S0 + V0 * t + 0.5 * ACC * t * t;
const onLine = (t: number) => poseAt(T, lineS(t), lineLat(lineS(t)));

// The car as a box around its centre (the middle of the wheelbase, where topAnchorAt places it), m.
const MID = wheelbaseMiddle(FW43B);
const REAR = -MID;
const FRONT = FW43B.lengths.length - MID;
const HALF = 1.0;
const MASS = 800; // kg with driver and fuel
const INERTIA = (MASS * (5.4 ** 2 + 2 ** 2)) / 12; // kg m², as a uniform box
const RESTITUTION = 0.1;
const WALL_FRICTION = 0.7;

// The track near the corner, sampled, for each corner's distance from the centre line.
const SAMPLES = Array.from({ length: 1200 }, (_, i) => poseAt(T, T14_APEX - 40 + i * 0.25));
const lateralOf = (p: MapPoint) => {
  let best = SAMPLES[0];
  let bd = Infinity;
  for (const q of SAMPLES) {
    const d = (q.x - p.x) ** 2 + (q.y - p.y) ** 2;
    if (d < bd) {
      bd = d;
      best = q;
    }
  }
  const h = (best.heading * Math.PI) / 180;
  // the driver's right of the lap direction (y down): (-sin h, cos h)
  const n = { x: -Math.sin(h), y: Math.cos(h) };
  return { lat: (p.x - best.x) * n.x + (p.y - best.y) * n.y, n };
};

export type CrashState = {
  t: number;
  x: number;
  y: number;
  heading: number; // map degrees, clockwise from +x
  speed: number; // m/s
  steer: number; // front-wheel angle, degrees (positive = to the car's right)
  sliding: boolean; // tyres scrubbing sideways (smoke)
};
export type CrashRun = {
  states: CrashState[];
  contact: { t: number; x: number; y: number; n: MapPoint; speed: number };
  stop: number;
};

const simulate = (): CrashRun => {
  const states: CrashState[] = [];
  // phase 1
  for (let t = 0; t < SLIP; t += DT) {
    const p = onLine(t);
    const q = onLine(t + DT);
    const heading = (Math.atan2(q.y - p.y, q.x - p.x) * 180) / Math.PI;
    // steering into the left-hander, unwinding on the exit
    const steer = -6 * (1 - Math.min(1, t / SLIP));
    const speed = Math.hypot(q.x - p.x, q.y - p.y) / DT;
    states.push({ t, x: p.x, y: p.y, heading, speed, steer, sliding: false });
  }
  // phase 2
  const p0 = onLine(SLIP);
  const p1 = onLine(SLIP + DT);
  let x = p0.x;
  let y = p0.y;
  let vx = (p1.x - p0.x) / DT;
  let vy = (p1.y - p0.y) / DT;
  let psi = Math.atan2(vy, vx); // rad
  let w = 0; // yaw rate, rad/s (positive turns clockwise on screen)
  let contact: CrashRun["contact"] | null = null;
  let stop = END;
  for (let t = SLIP; t <= END; t += DT) {
    const speed = Math.hypot(vx, vy);
    const slip = speed > 0.1 ? Math.atan2(vy, vx) - psi : 0;
    const side = Math.abs(Math.sin(slip));
    if (!contact) {
      // the rear steps out to the right: the car yaws to the left, faster and faster
      w = Math.max(-4.6, w - 11 * DT);
    } else {
      // the tyres scrub the yaw away, and it stops with the car
      w *= Math.exp(-(speed > 1 ? 4 : 14) * DT);
    }
    // tyres scrubbing sideways slow the car hard, rolling straight it barely slows; after the hit the broken corner
    // drags too
    const decel = contact ? 19 : 2 + 11 * side;
    if (speed > 0) {
      const k = Math.max(0, speed - decel * DT) / speed;
      vx *= k;
      vy *= k;
    }
    x += vx * DT;
    y += vy * DT;
    psi += w * DT;
    // the wall: the deepest corner past the face takes the impulse
    const c = Math.cos(psi);
    const s = Math.sin(psi);
    let hitCorner: { r: MapPoint; pen: number; n: MapPoint } | null = null;
    for (const [lx, ly] of [
      [REAR, HALF],
      [REAR, -HALF],
      [FRONT, HALF],
      [FRONT, -HALF],
    ]) {
      const r = { x: lx * c - ly * s, y: lx * s + ly * c };
      const { lat, n } = lateralOf({ x: x + r.x, y: y + r.y });
      if (lat > WALL_FACE && (!hitCorner || lat - WALL_FACE > hitCorner.pen)) {
        hitCorner = { r, pen: lat - WALL_FACE, n };
      }
    }
    if (hitCorner) {
      const { r, pen } = hitCorner;
      const n = { x: -hitCorner.n.x, y: -hitCorner.n.y }; // from the wall back onto the track
      x += n.x * pen;
      y += n.y * pen;
      const pvx = vx - w * r.y;
      const pvy = vy + w * r.x;
      const vn = pvx * n.x + pvy * n.y;
      if (vn < 0) {
        const rn = r.x * n.y - r.y * n.x;
        const jn = (-(1 + RESTITUTION) * vn) / (1 / MASS + (rn * rn) / INERTIA);
        const tg = { x: -n.y, y: n.x };
        const vt = pvx * tg.x + pvy * tg.y;
        const rt = r.x * tg.y - r.y * tg.x;
        const jt = Math.max(
          -WALL_FRICTION * jn,
          Math.min(WALL_FRICTION * jn, -vt / (1 / MASS + (rt * rt) / INERTIA)),
        );
        if (!contact) {
          contact = { t, x: x + r.x, y: y + r.y, n: hitCorner.n, speed: Math.hypot(pvx, pvy) };
        }
        vx += (jn * n.x + jt * tg.x) / MASS;
        vy += (jn * n.y + jt * tg.y) / MASS;
        w += (rn * jn + rt * jt) / INERTIA;
      }
    }
    const moving = Math.hypot(vx, vy) > 0.05 || Math.abs(w) > 0.02;
    if (!moving && stop === END) stop = t;
    if (!moving) {
      vx = 0;
      vy = 0;
      w = 0;
    }
    states.push({
      t,
      x,
      y,
      heading: (psi * 180) / Math.PI,
      speed: Math.hypot(vx, vy),
      // opposite lock, then the wheels left where they were
      steer: contact ? 10 : 14 * Math.min(1, (t - SLIP) / 0.15),
      sliding: moving && (side > 0.25 || Math.abs(w) > 0.8),
    });
  }
  if (!contact) throw new Error("latifi-t14: the car never reaches the wall");
  return { states, contact, stop };
};

export const CRASH = simulate();

export const crashAt = (t: number): CrashState => {
  const i = Math.max(0, Math.min(CRASH.states.length - 1, Math.round(t / DT)));
  return CRASH.states[i];
};
