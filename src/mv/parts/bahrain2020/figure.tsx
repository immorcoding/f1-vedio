// People in overalls, side view (ART-16): a jointed body at real proportions (1.80 m), dressed as a race driver,
// doctor or marshal — overalls with seams and folds, gloves, boots, helmet — drawn limb by limb, far side first, with a
// rim of firelight on the side towards the fire. No faces (ART-5): helmets, hoods or the back of the head only.
// The walk is a gait cycle (thigh swing, knee bend, heel rise, counter-swinging arms) checked against Eadweard
// Muybridge's "A man walking" plates (1887, public domain; docs/assets/reference-register.md).
import { INK, PAPER } from "../../../kit/colors";

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
      [0, 4],
      [0.15, 16],
      [0.4, 5],
      [0.6, 38],
      [0.72, 60],
      [0.9, 20],
      [1, 4],
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

// A limb as one smooth outline through its joints (hip–knee–ankle, shoulder–elbow–wrist), widths in metres at each
// joint, with rounded ends: no visible seam at the knee or elbow.
const chain = (P: (v: V) => string, pts: V[], widths: number[]) => {
  const n = pts.length;
  const normal = (i: number) => {
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(n - 1, i + 1)];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy) || 1e-6;
    return { x: -dy / len, y: dx / len, tx: dx / len, ty: dy / len };
  };
  const left: V[] = [];
  const right: V[] = [];
  pts.forEach((p, i) => {
    const nm = normal(i);
    left.push({
      x: p.x + (nm.x * widths[i]) / 2,
      y: p.y + (nm.y * widths[i]) / 2,
    });
    right.push({
      x: p.x - (nm.x * widths[i]) / 2,
      y: p.y - (nm.y * widths[i]) / 2,
    });
  });
  const end = normal(n - 1);
  const start = normal(0);
  const tipEnd = {
    x: pts[n - 1].x + end.tx * widths[n - 1] * 0.5,
    y: pts[n - 1].y + end.ty * widths[n - 1] * 0.5,
  };
  const tipStart = {
    x: pts[0].x - start.tx * widths[0] * 0.5,
    y: pts[0].y - start.ty * widths[0] * 0.5,
  };
  // smooth through the middle joints with quadratic curves via the joint offsets
  const side = (s: V[]) => {
    let d = "";
    for (let i = 1; i < s.length - 1; i++) {
      const m = { x: (s[i].x + s[i + 1].x) / 2, y: (s[i].y + s[i + 1].y) / 2 };
      d += ` Q ${P(s[i])} ${P(i === s.length - 2 ? s[i + 1] : m)}`;
    }
    if (s.length === 2) d += ` L ${P(s[1])}`;
    return d;
  };
  const rl = [...right].reverse();
  return `M ${P(left[0])}${side(left)} Q ${P(tipEnd)} ${P(right[n - 1])}${side(rl)} Q ${P(tipStart)} ${P(left[0])} Z`;
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

  // put the hips where the lowest point of either foot touches the ground
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
  const neck = add(shoulder, polar(0.07, 180 - pose.lean * 0.6));
  const nearArm = armJoints(
    add(shoulder, polar(0.05, up + 180)),
    pose.near.arm,
    pose.lean,
  );
  const farArm = armJoints(
    add(shoulder, { x: -0.03, y: -0.04 }),
    pose.far.arm,
    pose.lean,
  );
  const headC = add(
    neck,
    polar(0.16, 180 - pose.lean * 0.4 + (pose.head ?? 0) * 0.3),
  );
  const fwd = (v: V, d: number) => add(v, polar(d, 90 - pose.lean));
  const ink = Math.max(1.6, s * 0.011);

  const legD = (l: Leg) =>
    chain(P, [l.hip, l.knee, l.ankle], [0.21, 0.135, 0.105]);
  const armD = (a: Arm) =>
    chain(P, [a.shoulder, a.elbow, a.wrist], [0.135, 0.105, 0.09]);
  const gloveD = (a: Arm) => chain(P, [a.wrist, a.hand], [0.1, 0.085]);
  const bootD = (l: Leg) =>
    `M ${P(add(l.heel, { x: -0.015, y: -0.005 }))} L ${P(add(l.toe, { x: 0.01, y: 0 }))} ` +
    `Q ${P(add(l.toe, { x: 0.03, y: 0.07 }))} ${P(add(l.toe, { x: -0.07, y: 0.075 }))} ` +
    `L ${P(add(l.ankle, { x: 0.05, y: 0.03 }))} L ${P(add(l.ankle, { x: 0.045, y: 0.1 }))} ` +
    `L ${P(add(l.ankle, { x: -0.06, y: 0.1 }))} L ${P(add(l.heel, { x: -0.02, y: 0.06 }))} Z`;
  // torso: chest ahead of the spine, shoulder blades behind, narrowing to the waist, collar at the neck
  const torsoD =
    `M ${P(fwd(add(hip, { x: 0, y: -0.04 }), 0.12))} ` +
    `C ${P(fwd(add(hip, { x: 0, y: 0.22 }), 0.13))} ${P(fwd(add(shoulder, { x: 0, y: -0.2 }), 0.19))} ${P(fwd(add(shoulder, { x: 0, y: -0.04 }), 0.15))} ` +
    `Q ${P(fwd(shoulder, 0.12))} ${P(fwd(neck, 0.06))} L ${P(fwd(neck, -0.06))} ` +
    `Q ${P(fwd(shoulder, -0.16))} ${P(fwd(add(shoulder, { x: 0, y: -0.12 }), -0.15))} ` +
    `C ${P(fwd(add(shoulder, { x: 0, y: -0.3 }), -0.12))} ${P(fwd(add(hip, { x: 0, y: 0.2 }), -0.15))} ${P(fwd(add(hip, { x: 0, y: -0.04 }), -0.14))} ` +
    `Q ${P(add(hip, { x: 0, y: -0.13 }))} ${P(fwd(add(hip, { x: 0, y: -0.04 }), 0.12))} Z`;
  const neckD = chain(
    P,
    [neck, add(neck, polar(0.08, 180 - pose.lean * 0.4))],
    [0.12, 0.11],
  );

  const h = outfit.head;
  const c = headC;
  const shellD =
    h.kind === "helmet"
      ? `M ${P(add(c, { x: -0.145, y: -0.07 }))} C ${P(add(c, { x: -0.17, y: 0.1 }))} ${P(add(c, { x: -0.04, y: 0.17 }))} ${P(add(c, { x: 0.05, y: 0.16 }))} ` +
        `C ${P(add(c, { x: 0.13, y: 0.15 }))} ${P(add(c, { x: 0.165, y: 0.06 }))} ${P(add(c, { x: 0.155, y: -0.02 }))} ` +
        `L ${P(add(c, { x: 0.14, y: -0.12 }))} L ${P(add(c, { x: -0.09, y: -0.14 }))} Z`
      : `M ${P(add(c, { x: -0.11, y: -0.1 }))} C ${P(add(c, { x: -0.14, y: 0.08 }))} ${P(add(c, { x: -0.02, y: 0.15 }))} ${P(add(c, { x: 0.05, y: 0.13 }))} ` +
        `C ${P(add(c, { x: 0.12, y: 0.1 }))} ${P(add(c, { x: 0.12, y: -0.02 }))} ${P(add(c, { x: 0.09, y: -0.1 }))} Z`;

  // the whole silhouette, in one colour — for the rim of firelight behind the figure
  const silhouette = (color: string) => (
    <g fill={color} stroke={color} strokeWidth={ink * 2} strokeLinejoin="round">
      {[
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
      ].map((d, i) => (
        <path key={i} d={d} />
      ))}
    </g>
  );
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
  return (
    <g>
      {rim ? (
        <g transform={`translate(${rimShift} ${-ink * 0.6})`} opacity={0.95}>
          {silhouette(rim)}
        </g>
      ) : null}
      {/* far side, in shadow */}
      {part(armD(farArm), outfit.suitShade)}
      {part(gloveD(farArm), outfit.gloves)}
      {part(legD(farLeg), outfit.suitShade)}
      {part(bootD(farLeg), outfit.boots)}
      {/* body */}
      {part(neckD, outfit.suitShade)}
      {part(torsoD, outfit.suit)}
      {outfit.stripe
        ? line(
            `M ${P(fwd(add(hip, { x: 0, y: 0.04 }), 0.0))} L ${P(fwd(add(shoulder, { x: 0, y: -0.04 }), 0.02))}`,
            3.2,
            outfit.stripe,
          )
        : null}
      {/* zip, belt, chest seam */}
      {line(
        `M ${P(fwd(add(shoulder, { x: 0, y: -0.02 }), 0.13))} C ${P(fwd(add(shoulder, { x: 0, y: -0.25 }), 0.17))} ${P(fwd(add(hip, { x: 0, y: 0.25 }), 0.12))} ${P(fwd(add(hip, { x: 0, y: 0.08 }), 0.11))}`,
        0.8,
      )}
      {line(
        `M ${P(fwd(add(hip, { x: 0, y: 0.07 }), -0.14))} L ${P(fwd(add(hip, { x: 0, y: 0.07 }), 0.12))}`,
        1.6,
        INK,
      )}
      {/* near leg with knee fold and outside seam */}
      {part(legD(nearLeg), outfit.suit)}
      {outfit.stripe
        ? line(
            `M ${P(add(nearLeg.hip, { x: 0, y: -0.06 }))} Q ${P(nearLeg.knee)} ${P(add(nearLeg.ankle, { x: 0, y: 0.07 }))}`,
            2.4,
            outfit.stripe,
          )
        : null}
      {line(
        `M ${P(add(nearLeg.knee, { x: -0.06, y: 0.035 }))} Q ${P(add(nearLeg.knee, { x: 0, y: -0.015 }))} ${P(add(nearLeg.knee, { x: 0.06, y: 0.04 }))}`,
      )}
      {line(
        `M ${P(add(nearLeg.knee, { x: -0.05, y: -0.04 }))} Q ${P(add(nearLeg.knee, { x: 0, y: -0.07 }))} ${P(add(nearLeg.knee, { x: 0.05, y: -0.03 }))}`,
        0.7,
      )}
      {part(bootD(nearLeg), outfit.boots)}
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
            `M ${P(add(c, { x: -0.15, y: 0.05 }))} C ${P(add(c, { x: -0.08, y: 0.165 }))} ${P(add(c, { x: 0.06, y: 0.165 }))} ${P(add(c, { x: 0.13, y: 0.1 }))}`,
            (0.045 * s) / ink,
            h.stripe,
          )}
          {part(
            `M ${P(add(c, { x: 0.16, y: 0.04 }))} C ${P(add(c, { x: 0.12, y: 0.075 }))} ${P(add(c, { x: 0.04, y: 0.075 }))} ${P(add(c, { x: -0.01, y: 0.055 }))} L ${P(add(c, { x: 0, y: -0.025 }))} C ${P(add(c, { x: 0.06, y: -0.035 }))} ${P(add(c, { x: 0.12, y: -0.035 }))} ${P(add(c, { x: 0.155, y: -0.03 }))} Z`,
            h.visor,
          )}
          {line(
            `M ${P(add(c, { x: 0.125, y: 0.055 }))} C ${P(add(c, { x: 0.08, y: 0.068 }))} ${P(add(c, { x: 0.04, y: 0.066 }))} ${P(add(c, { x: 0.02, y: 0.054 }))}`,
            1,
            PAPER,
          )}
          {line(
            `M ${P(add(c, { x: 0.1, y: -0.08 }))} L ${P(add(c, { x: 0.04, y: -0.09 }))} M ${P(add(c, { x: 0.1, y: -0.105 }))} L ${P(add(c, { x: 0.04, y: -0.115 }))}`,
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
      {/* near arm, elbow fold, glove with its cuff */}
      {part(armD(nearArm), outfit.suit)}
      {line(
        `M ${P(add(nearArm.elbow, { x: -0.035, y: 0.045 }))} Q ${P(add(nearArm.elbow, { x: 0.01, y: 0.005 }))} ${P(add(nearArm.elbow, { x: 0.03, y: -0.045 }))}`,
      )}
      {part(gloveD(nearArm), outfit.gloves)}
      {line(
        `M ${P(add(nearArm.wrist, polar(0.05, 90)))} L ${P(add(nearArm.wrist, polar(0.05, -90)))}`,
        1.2,
        INK,
      )}
    </g>
  );
};
