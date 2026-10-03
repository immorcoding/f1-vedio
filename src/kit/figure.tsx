// People in overalls, seen side-on (ART-16), the shared people module: a jointed body at real proportions (1.80 m)
// dressed as a race driver, doctor, marshal or mechanic — loose overalls with seams and folds, gloves, boots, helmet or
// hood — drawn far side first, with an optional rim of firelight. No faces (ART-5): helmets, hoods or the back of the head.
// The walk is a gait cycle (thigh swing, knee bend, heel rise, counter-swinging arms) checked against Eadweard
// Muybridge's "A man walking" plates (1887, public domain; docs/assets/reference-register.md).
import { INK, PAPER } from "./colors";

type V = { x: number; y: number };
const add = (a: V, b: V): V => ({ x: a.x + b.x, y: a.y + b.y });
const polar = (len: number, deg: number): V => {
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

type Leg = { hip: V; knee: V; ankle: V; heel: V; toe: V };
type Arm = { shoulder: V; elbow: V; wrist: V; hand: V };

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

export type Outfit = {
  suit: string; // overall colour
  suitShade: string; // far limbs and the shaded side
  seam: string; // seam / panel lines
  stripe?: string; // a band down the side of the suit
  gloves: string;
  boots: string;
  head:
    | { kind: "helmet"; base: string; stripe: string; visor: string }
    | { kind: "hood"; color: string };
};

const lerp = (a: V, b: V, u: number): V => ({
  x: a.x + (b.x - a.x) * u,
  y: a.y + (b.y - a.y) * u,
});

// A smooth closed outline round a line of points with a width at each (metres): the sides are Catmull-Rom curves, the
// ends round. Used for limbs in loose overalls — thigh fuller than knee, calf, a hem flaring over the boot.
const tube = (P: (v: V) => string, pts: V[], widths: number[]) => {
  const n = pts.length;
  const tangent = (i: number) => {
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(n - 1, i + 1)];
    const len = Math.hypot(b.x - a.x, b.y - a.y) || 1e-6;
    return { x: (b.x - a.x) / len, y: (b.y - a.y) / len };
  };
  const side = (sgn: number) =>
    pts.map((p, i) => {
      const t = tangent(i);
      return {
        x: p.x - t.y * sgn * widths[i] * 0.5,
        y: p.y + t.x * sgn * widths[i] * 0.5,
      };
    });
  const curve = (q: V[]) => {
    let d = "";
    for (let i = 0; i < q.length - 1; i++) {
      const p0 = q[Math.max(0, i - 1)];
      const p1 = q[i];
      const p2 = q[i + 1];
      const p3 = q[Math.min(q.length - 1, i + 2)];
      const c1 = { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 };
      const c2 = { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 };
      d += ` C ${P(c1)} ${P(c2)} ${P(p2)}`;
    }
    return d;
  };
  const L = side(1);
  const R = side(-1).reverse();
  const tEnd = tangent(n - 1);
  const tStart = tangent(0);
  const capEnd = {
    x: pts[n - 1].x + tEnd.x * widths[n - 1] * 0.55,
    y: pts[n - 1].y + tEnd.y * widths[n - 1] * 0.55,
  };
  const capStart = {
    x: pts[0].x - tStart.x * widths[0] * 0.55,
    y: pts[0].y - tStart.y * widths[0] * 0.55,
  };
  return `M ${P(L[0])}${curve(L)} Q ${P(capEnd)} ${P(R[0])}${curve(R)} Q ${P(capStart)} ${P(L[0])} Z`;
};

// A person standing on screen point `at` (their ground point), `pxPerMetre` there, facing left or right.
export const Figure: React.FC<{
  at: { x: number; y: number };
  pxPerMetre: number;
  pose: BodyPose;
  outfit: Outfit;
  facing: "left" | "right";
  // firelight: an outer rim in this colour on the side the fire is on
  rim?: string | null;
  rimSide?: "left" | "right";
}> = ({
  at,
  pxPerMetre: s,
  pose,
  outfit,
  facing,
  rim = null,
  rimSide = "right",
}) => {
  const dir = facing === "left" ? -1 : 1;
  const P = (v: V) =>
    `${(at.x + v.x * s * dir).toFixed(1)} ${(at.y - v.y * s).toFixed(1)}`;

  const { hip, nearLeg, farLeg, up, shoulder, neck, nearArm, farArm, headC } =
    solveBody(pose);
  const fwd = (v: V, d: number) => add(v, polar(d, 90 - pose.lean));
  const upT = (v: V, d: number) => add(v, polar(d, up));
  const ink = Math.max(1.6, s * 0.011);

  const legD = (l: Leg) =>
    tube(
      P,
      [
        l.hip,
        lerp(l.hip, l.knee, 0.45),
        l.knee,
        lerp(l.knee, l.ankle, 0.35),
        add(l.ankle, { x: 0, y: 0.05 }),
      ],
      [0.24, 0.215, 0.145, 0.15, 0.135],
    );
  const armD = (a: Arm) =>
    tube(
      P,
      [
        a.shoulder,
        lerp(a.shoulder, a.elbow, 0.5),
        a.elbow,
        lerp(a.elbow, a.wrist, 0.45),
        a.wrist,
      ],
      [0.16, 0.13, 0.105, 0.115, 0.095],
    );
  // the thumb: a small lobe on the front of the glove, angled off the hand
  const thumbD = (a: Arm) =>
    tube(
      P,
      [
        lerp(a.wrist, a.hand, 0.25),
        add(lerp(a.wrist, a.hand, 0.55), polar(0.045, 90 - pose.lean * 0.3)),
      ],
      [0.045, 0.035],
    );
  const gloveD = (a: Arm) =>
    tube(P, [a.wrist, lerp(a.wrist, a.hand, 0.5), a.hand], [0.095, 0.1, 0.075]);
  const bootD = (l: Leg) =>
    `M ${P(add(l.heel, { x: -0.015, y: -0.005 }))} L ${P(add(l.toe, { x: 0.01, y: 0 }))} ` +
    `Q ${P(add(l.toe, { x: 0.035, y: 0.075 }))} ${P(add(l.toe, { x: -0.07, y: 0.08 }))} ` +
    `L ${P(add(l.ankle, { x: 0.055, y: 0.04 }))} L ${P(add(l.ankle, { x: 0.05, y: 0.11 }))} ` +
    `L ${P(add(l.ankle, { x: -0.065, y: 0.11 }))} L ${P(add(l.heel, { x: -0.025, y: 0.06 }))} Z`;
  // torso: full chest ahead of the spine, shoulder blades behind, a soft belly, seat behind the hips; the overall
  // hangs a little loose at the small of the back
  const torsoD =
    `M ${P(fwd(neck, 0.07))} ` +
    `C ${P(fwd(upT(shoulder, -0.03), 0.16))} ${P(fwd(upT(shoulder, -0.16), 0.2))} ${P(fwd(upT(shoulder, -0.26), 0.17))} ` +
    `C ${P(fwd(upT(hip, 0.2), 0.15))} ${P(fwd(upT(hip, 0.08), 0.15))} ${P(fwd(upT(hip, -0.04), 0.12))} ` +
    `Q ${P(upT(hip, -0.14))} ${P(fwd(upT(hip, -0.04), -0.16))} ` +
    `C ${P(fwd(upT(hip, 0.06), -0.18))} ${P(fwd(upT(hip, 0.2), -0.12))} ${P(fwd(upT(hip, 0.3), -0.13))} ` +
    `C ${P(fwd(upT(shoulder, -0.18), -0.17))} ${P(fwd(upT(shoulder, 0.0), -0.17))} ${P(fwd(neck, -0.07))} Z`;
  // a stand-up collar, a band round the base of the neck
  const collarD = tube(P, [fwd(neck, -0.07), fwd(neck, 0.07)], [0.05, 0.05]);
  const neckD = tube(
    P,
    [upT(shoulder, 0.0), neck, add(neck, polar(0.06, 180 - pose.lean * 0.4))],
    [0.15, 0.13, 0.12],
  );

  const h = outfit.head;
  const c = headC;
  // full-face helmet ~0.28 m long and 0.25 m tall; a hood is a smaller, rounder head
  const shellD =
    h.kind === "helmet"
      ? `M ${P(add(c, { x: -0.135, y: -0.065 }))} C ${P(add(c, { x: -0.155, y: 0.09 }))} ${P(add(c, { x: -0.04, y: 0.155 }))} ${P(add(c, { x: 0.045, y: 0.145 }))} ` +
        `C ${P(add(c, { x: 0.12, y: 0.135 }))} ${P(add(c, { x: 0.15, y: 0.055 }))} ${P(add(c, { x: 0.14, y: -0.02 }))} ` +
        `L ${P(add(c, { x: 0.125, y: -0.11 }))} L ${P(add(c, { x: -0.08, y: -0.125 }))} Z`
      : `M ${P(add(c, { x: -0.1, y: -0.09 }))} C ${P(add(c, { x: -0.13, y: 0.07 }))} ${P(add(c, { x: -0.02, y: 0.14 }))} ${P(add(c, { x: 0.05, y: 0.12 }))} ` +
        `C ${P(add(c, { x: 0.11, y: 0.09 }))} ${P(add(c, { x: 0.11, y: -0.02 }))} ${P(add(c, { x: 0.08, y: -0.09 }))} Z`;

  // the whole silhouette, in one colour — for the rim of firelight behind the figure
  const outline = [
    legD(farLeg),
    legD(nearLeg),
    armD(farArm),
    armD(nearArm),
    torsoD,
    neckD,
    shellD,
    bootD(farLeg),
    bootD(nearLeg),
    gloveD(farArm),
    gloveD(nearArm),
  ];
  const part = (d: string, fill: string) => (
    <path
      d={d}
      fill={fill}
      stroke={INK}
      strokeWidth={ink}
      strokeLinejoin="round"
    />
  );
  const line = (d: string, w = 1, color = outfit.seam) => (
    <path
      d={d}
      fill="none"
      stroke={color}
      strokeWidth={ink * w}
      strokeLinecap="round"
    />
  );
  const rimShift = (rimSide === "right" ? 1 : -1) * Math.max(2, ink * 1.5);
  const nk = nearLeg.knee;
  const ne = nearArm.elbow;
  return (
    <g>
      {rim ? (
        <g
          transform={`translate(${rimShift} ${-ink * 0.6})`}
          fill={rim}
          stroke={rim}
          strokeWidth={ink * 2}
          strokeLinejoin="round"
          opacity={0.95}
        >
          {outline.map((d, i) => (
            <path key={i} d={d} />
          ))}
        </g>
      ) : null}
      {/* far side, in shadow */}
      {part(armD(farArm), outfit.suitShade)}
      {part(gloveD(farArm), outfit.gloves)}
      {part(thumbD(farArm), outfit.gloves)}
      {/* folds where the far sleeve and trouser leg bend */}
      {line(
        `M ${P(add(farArm.elbow, { x: -0.03, y: 0.04 }))} Q ${P(add(farArm.elbow, { x: 0.01, y: 0 }))} ${P(add(farArm.elbow, { x: 0.025, y: -0.04 }))}`,
        0.7,
        INK,
      )}
      {part(legD(farLeg), outfit.suitShade)}
      {part(bootD(farLeg), outfit.boots)}
      {line(
        `M ${P(add(farLeg.knee, { x: -0.06, y: 0.04 }))} Q ${P(add(farLeg.knee, { x: 0, y: 0 }))} ${P(add(farLeg.knee, { x: 0.06, y: 0.045 }))}`,
        0.7,
        INK,
      )}
      {/* body */}
      {part(neckD, outfit.suitShade)}
      {part(torsoD, outfit.suit)}
      {part(collarD, outfit.suitShade)}
      {line(
        `M ${P(fwd(neck, -0.04))} Q ${P(fwd(upT(shoulder, -0.02), -0.02))} ${P(fwd(upT(shoulder, -0.1), 0.02))}`,
        0.8,
      )}
      {outfit.stripe
        ? line(
            `M ${P(fwd(upT(hip, 0.02), -0.01))} C ${P(fwd(upT(hip, 0.25), 0.0))} ${P(fwd(upT(shoulder, -0.2), 0.02))} ${P(fwd(upT(shoulder, -0.05), 0.0))}`,
            3.2,
            outfit.stripe,
          )
        : null}
      {/* zip, belt, the fold where the overall gathers at the small of the back, the hip crease */}
      {line(
        `M ${P(fwd(neck, 0.06))} C ${P(fwd(upT(shoulder, -0.2), 0.19))} ${P(fwd(upT(hip, 0.2), 0.14))} ${P(fwd(upT(hip, 0.06), 0.13))}`,
        0.8,
      )}
      {line(
        `M ${P(fwd(upT(hip, 0.07), -0.16))} L ${P(fwd(upT(hip, 0.07), 0.13))}`,
        1.6,
        INK,
      )}
      {line(
        `M ${P(fwd(upT(hip, 0.16), -0.15))} q ${0.04 * s * dir} ${-0.01 * s} ${0.07 * s * dir} ${0.02 * s}`,
        0.8,
      )}
      {line(
        `M ${P(fwd(upT(hip, -0.02), 0.11))} q ${0.03 * s * dir} ${0.04 * s} ${0.08 * s * dir} ${0.02 * s}`,
        0.8,
      )}
      {/* near leg: side band, knee folds, hem */}
      {part(legD(nearLeg), outfit.suit)}
      {outfit.stripe
        ? line(
            `M ${P(add(nearLeg.hip, { x: 0, y: -0.05 }))} Q ${P(nk)} ${P(add(nearLeg.ankle, { x: 0, y: 0.08 }))}`,
            2.4,
            outfit.stripe,
          )
        : null}
      {line(
        `M ${P(add(nk, { x: -0.07, y: 0.045 }))} Q ${P(add(nk, { x: 0, y: -0.005 }))} ${P(add(nk, { x: 0.07, y: 0.05 }))}`,
      )}
      {line(
        `M ${P(add(nk, { x: -0.06, y: -0.03 }))} Q ${P(add(nk, { x: 0, y: -0.07 }))} ${P(add(nk, { x: 0.05, y: -0.035 }))}`,
        0.7,
      )}
      {line(
        `M ${P(add(nk, { x: -0.05, y: 0.12 }))} q ${0.03 * s * dir} ${0.015 * s} ${0.06 * s * dir} ${0} `,
        0.6,
      )}
      {part(bootD(nearLeg), outfit.boots)}
      {line(
        `M ${P(add(nearLeg.ankle, { x: -0.075, y: 0.13 }))} q ${0.04 * s * dir} ${-0.025 * s} ${0.075 * s * dir} ${-0.005 * s} q ${0.03 * s * dir} ${0.02 * s} ${0.07 * s * dir} ${0.005 * s}`,
        0.8,
      )}
      {line(
        `M ${P(add(nearLeg.heel, { x: -0.01, y: 0.02 }))} L ${P(add(nearLeg.toe, { x: 0, y: 0.02 }))}`,
        0.8,
        "#5a5a5a",
      )}
      {/* head */}
      {part(shellD, h.kind === "helmet" ? h.base : h.color)}
      {h.kind === "helmet" ? (
        <g>
          {line(
            `M ${P(add(c, { x: -0.14, y: 0.05 }))} C ${P(add(c, { x: -0.075, y: 0.155 }))} ${P(add(c, { x: 0.055, y: 0.155 }))} ${P(add(c, { x: 0.12, y: 0.09 }))}`,
            (0.042 * s) / ink,
            h.stripe,
          )}
          {part(
            `M ${P(add(c, { x: 0.145, y: 0.035 }))} C ${P(add(c, { x: 0.11, y: 0.07 }))} ${P(add(c, { x: 0.035, y: 0.07 }))} ${P(add(c, { x: -0.01, y: 0.05 }))} L ${P(add(c, { x: 0, y: -0.022 }))} C ${P(add(c, { x: 0.055, y: -0.032 }))} ${P(add(c, { x: 0.11, y: -0.032 }))} ${P(add(c, { x: 0.14, y: -0.028 }))} Z`,
            h.visor,
          )}
          {line(
            `M ${P(add(c, { x: 0.115, y: 0.05 }))} C ${P(add(c, { x: 0.075, y: 0.062 }))} ${P(add(c, { x: 0.04, y: 0.06 }))} ${P(add(c, { x: 0.02, y: 0.05 }))}`,
            1,
            PAPER,
          )}
          {line(
            `M ${P(add(c, { x: 0.09, y: -0.075 }))} L ${P(add(c, { x: 0.035, y: -0.085 }))}`,
            0.8,
            INK,
          )}
          <path
            d={shellD}
            fill="none"
            stroke={INK}
            strokeWidth={ink * 1.3}
            strokeLinejoin="round"
          />
        </g>
      ) : null}
      {/* near arm, elbow folds, glove with its cuff */}
      {part(armD(nearArm), outfit.suit)}
      {line(
        `M ${P(add(ne, { x: -0.04, y: 0.05 }))} Q ${P(add(ne, { x: 0.012, y: 0.006 }))} ${P(add(ne, { x: 0.035, y: -0.05 }))}`,
      )}
      {line(
        `M ${P(lerp(nearArm.shoulder, ne, 0.55))} q ${0.03 * s * dir} ${-0.01 * s} ${0.05 * s * dir} ${0.02 * s}`,
        0.6,
      )}
      {part(gloveD(nearArm), outfit.gloves)}
      {part(thumbD(nearArm), outfit.gloves)}
      {line(
        `M ${P(add(nearArm.wrist, polar(0.055, 90)))} L ${P(add(nearArm.wrist, polar(0.055, -90)))}`,
        1.4,
        INK,
      )}
    </g>
  );
};
