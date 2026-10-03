// Body and gait maths for the people module (src/kit/figure.tsx): joint angles → joint positions in metres, the walk
// cycle, and how far a walker moves with the stance foot planted. Pure TypeScript (no React), so the staging of a shot
// and the interpenetration check (src/mv/overlap.ts) can use it from node.

export type V = { x: number; y: number };
export const add = (a: V, b: V): V => ({ x: a.x + b.x, y: a.y + b.y });
export const polar = (len: number, deg: number): V => {
  // deg from straight down, positive = swung forward (+x)
  const r = (deg * Math.PI) / 180;
  return { x: Math.sin(r) * len, y: -Math.cos(r) * len };
};

// Segment lengths, m.
const THIGH = 0.45;
const SHIN = 0.44;
const ANKLE_H = 0.08;
const TORSO = 0.52;
const UPPER_ARM = 0.3;
const FOREARM = 0.27;

export type LegPose = { thigh: number; knee: number; foot: number };
export type ArmPose = { shoulder: number; elbow: number };
export type BodyPose = {
  lean: number; // torso lean forward, degrees
  near: { leg: LegPose; arm: ArmPose };
  far: { leg: LegPose; arm: ArmPose };
  // hip height above the ground; omitted = whatever puts the lower foot on the ground
  hipY?: number;
  head?: number; // head tilt, degrees (down +)
};

const lerpTable = (table: [number, number][], p: number) => {
  const u = ((p % 1) + 1) % 1;
  for (let i = 0; i < table.length - 1; i++) {
    const [p0, v0] = table[i];
    const [p1, v1] = table[i + 1];
    if (u >= p0 && u <= p1) return v0 + ((v1 - v0) * (u - p0)) / (p1 - p0);
  }
  return table[table.length - 1][1];
};

// One leg through the gait cycle, p = 0 at heel strike (Muybridge plate frames 1–12 ≈ one cycle).
const gaitLeg = (p: number, stride = 1): LegPose => ({
  thigh:
    stride *
    lerpTable(
      [
        [0, 24],
        [0.15, 18],
        [0.5, -12],
        [0.62, -8],
        [0.85, 22],
        [1, 24],
      ],
      p,
    ),
  knee: lerpTable(
    [
      [0, 8],
      [0.15, 16],
      [0.4, 10],
      [0.6, 38],
      [0.72, 60],
      [0.9, 20],
      [1, 8],
    ],
    p,
  ),
  foot: lerpTable(
    [
      [0, -12],
      [0.08, 0],
      [0.42, 0],
      [0.6, 34],
      [0.7, 18],
      [0.88, -6],
      [1, -12],
    ],
    p,
  ),
});

const gaitArm = (p: number, swing = 1): ArmPose => ({
  // arms swing against the leg on the same side
  shoulder: -swing * 18 * Math.cos(p * Math.PI * 2),
  elbow: 14 + 10 * Math.max(0, -Math.cos(p * Math.PI * 2)),
});

export const walkPose = (p: number, stride = 1, lean = 6): BodyPose => ({
  lean,
  near: { leg: gaitLeg(p, stride), arm: gaitArm(p) },
  far: { leg: gaitLeg(p + 0.5, stride), arm: gaitArm(p + 0.5) },
});

export type Leg = { hip: V; knee: V; ankle: V; heel: V; toe: V };
export type Arm = { shoulder: V; elbow: V; wrist: V; hand: V };

const legJoints = (hip: V, l: LegPose): Leg => {
  const knee = add(hip, polar(THIGH, l.thigh));
  const shin = l.thigh - l.knee;
  const ankle = add(knee, polar(SHIN, shin));
  const f = (l.foot * Math.PI) / 180; // toe-down positive
  const rot = (v: V) => ({
    x: v.x * Math.cos(f) + v.y * Math.sin(f),
    y: -v.x * Math.sin(f) + v.y * Math.cos(f),
  });
  return {
    hip,
    knee,
    ankle,
    heel: add(ankle, rot({ x: -0.07, y: -ANKLE_H })),
    toe: add(ankle, rot({ x: 0.2, y: -ANKLE_H })),
  };
};

const armJoints = (shoulder: V, a: ArmPose, lean: number): Arm => {
  const elbow = add(shoulder, polar(UPPER_ARM, a.shoulder + lean * 0.3));
  const wrist = add(elbow, polar(FOREARM, a.shoulder + a.elbow + lean * 0.3));
  const hand = add(wrist, polar(0.09, a.shoulder + a.elbow * 1.2));
  return { shoulder, elbow, wrist, hand };
};

// The joints of a pose, in metres from the person's ground point, facing +x (y up). The hips sit where the lowest point
// of either foot touches the ground, unless the pose fixes hipY (climbing, sitting).
export const solveBody = (pose: BodyPose) => {
  const probe = [
    legJoints({ x: 0, y: 1 }, pose.near.leg),
    legJoints({ x: 0, y: 1 }, pose.far.leg),
  ];
  const low = Math.min(...probe.flatMap((l) => [l.heel.y, l.toe.y]));
  const hipY = pose.hipY ?? 1 - low;
  const hip = { x: 0, y: hipY };
  const nearLeg = legJoints({ x: 0.03, y: hipY }, pose.near.leg);
  const farLeg = legJoints({ x: -0.03, y: hipY }, pose.far.leg);
  const up = 180 - pose.lean;
  const shoulder = add(hip, polar(TORSO, up));
  const neck = add(shoulder, polar(0.06, 180 - pose.lean * 0.6));
  const nearArm = armJoints(
    add(shoulder, polar(0.06, up + 180)),
    pose.near.arm,
    pose.lean,
  );
  const farArm = armJoints(
    add(shoulder, { x: -0.03, y: -0.05 }),
    pose.far.arm,
    pose.lean,
  );
  const headC = add(
    neck,
    polar(0.15, 180 - pose.lean * 0.4 + (pose.head ?? 0) * 0.3),
  );
  return {
    hipY,
    hip,
    nearLeg,
    farLeg,
    up,
    shoulder,
    neck,
    nearArm,
    farArm,
    headC,
  };
};

// How far a walker has moved (metres, forward) at gait phase p of walkPose(p, stride, lean), with the stance foot
// planted: between two phases the body moves exactly as far as the foot on the ground slides back under it, so feet
// never skate. Drive both the pose and the position from the same phase (and hold both on the same frames).
const advanceTables = new Map<string, number[]>();
const ADV_N = 240;
export const walkAdvance = (p: number, stride = 1, lean = 6) => {
  const key = `${stride}|${lean}`;
  let table = advanceTables.get(key);
  if (!table) {
    table = [0];
    for (let k = 0; k < ADV_N; k++) {
      const a = solveBody(walkPose(k / ADV_N, stride, lean));
      const b = solveBody(walkPose((k + 1) / ADV_N, stride, lean));
      const lowA = (l: Leg) => Math.min(l.heel.y, l.toe.y);
      // the stance foot: the lower one at the start of the interval
      const near = lowA(a.nearLeg) <= lowA(a.farLeg);
      const fa = near ? a.nearLeg.ankle.x : a.farLeg.ankle.x;
      const fb = near ? b.nearLeg.ankle.x : b.farLeg.ankle.x;
      table.push(table[k] + Math.max(0, fa - fb));
    }
    advanceTables.set(key, table);
  }
  const cycle = table[ADV_N];
  const whole = Math.floor(p);
  const u = (p - whole) * ADV_N;
  const i = Math.floor(u);
  const part = table[i] + (table[Math.min(ADV_N, i + 1)] - table[i]) * (u - i);
  return whole * cycle + part;
};
