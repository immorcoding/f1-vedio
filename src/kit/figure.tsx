// People (ART-16): the shared people module. One renderer draws every person in the film — race drivers, the
// medical crew, marshals, mechanics, the crowd — from a pose (./people/skeleton, ./people/motion) and an outfit
// (./people/outfits), at any size from a 100 px figure in a group shot to a full-height close-up.
//
// The drawing is manga, like the cars: silhouette first, then as few lines as tell the form.
// - One bold contour round the whole silhouette, heavier on the shadow side; inside it, a thin line only where a near
//   limb crosses the body, and a few tapered fold strokes where the cloth bunches (back of a bent knee, inside of an
//   elbow, the waist, the seat). No joint rings (ART-11).
// - Colour blocks for the suit, its band, collar, gloves, boots and helmet; far limbs one shade darker; a crescent of
//   dot screen on each form's shadow side (ART-2, ART-8). Close-ups add the race suit's stand-up collar, front zip,
//   shoulder seam and epaulette.
// - Hands: a palm-and-fingers mass, a thumb drawn over it, and at larger sizes one or two strokes between the fingers
//   or across the knuckles — never a mitten.
// - No faces (ART-5): full-face helmets, or the face kept in shadow under a cap or helmet peak.
// Usage: <Figure at={camera.anchor({x, z})} pxPerMetre={…} pose={walk(d)} outfit={MARSHAL} facing="left" />
// `parts` draws only some of the body (a person climbing over a rail is drawn in two passes, behind and in front).
// The pose and gait maths live in ./people/*.ts (no React), for staging files and node checks.
import { useId } from "react";
import { INK, PAPER } from "./colors";
import type { Accent } from "../cars/spec";
import {
  BONES,
  add,
  lean,
  lerpV,
  mul,
  norm,
  solve,
  sub,
  v,
  type ArmJ,
  type Body,
  type LegJ,
  type Pose,
  type V,
} from "./people/skeleton";
import type { BodyPart } from "./people/motion";
import { SKIN, type Outfit } from "./people/outfits";

export * from "./people/skeleton";
export * from "./people/motion";
export * from "./people/outfits";

// ── Colour helpers ───────────────────────────────────────────────────────────────────────────────────────────────
const hex = (c: string) => {
  const h = c.replace("#", "");
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
};
const mixColor = (a: string, b: string, u: number) => {
  const [r1, g1, b1] = hex(a);
  const [r2, g2, b2] = hex(b);
  const m = (x: number, y: number) =>
    Math.round(x + (y - x) * u)
      .toString(16)
      .padStart(2, "0");
  return `#${m(r1, r2)}${m(g1, g2)}${m(b1, b2)}`;
};
export const shadeOf = (c: string, u = 0.3) => mixColor(c, INK, u);
// The colour of a detail line drawn on a fill: ink, or on a near-black fill a lighter grey of the same colour, as
// manga draws folds on a black suit.
const lineOn = (fill: string) => {
  const [r, g, b] = hex(fill);
  return 0.3 * r + 0.59 * g + 0.11 * b < 70 ? mixColor(fill, PAPER, 0.38) : INK;
};

// ── Curves ───────────────────────────────────────────────────────────────────────────────────────────────────────
type Pt = [number, number];
const f1 = (n: number) => n.toFixed(1);
// Catmull-Rom through screen points, as cubic Béziers.
const curve = (q: Pt[], closed: boolean) => {
  const n = q.length;
  const at = (i: number) =>
    closed ? q[(i + n) % n] : q[Math.max(0, Math.min(n - 1, i))];
  let d = `M ${f1(q[0][0])} ${f1(q[0][1])}`;
  const last = closed ? n : n - 1;
  for (let i = 0; i < last; i++) {
    const p0 = at(i - 1);
    const p1 = at(i);
    const p2 = at(i + 1);
    const p3 = at(i + 2);
    d +=
      ` C ${f1(p1[0] + (p2[0] - p0[0]) / 6)} ${f1(p1[1] + (p2[1] - p0[1]) / 6)}` +
      ` ${f1(p2[0] - (p3[0] - p1[0]) / 6)} ${f1(p2[1] - (p3[1] - p1[1]) / 6)} ${f1(p2[0])} ${f1(p2[1])}`;
  }
  return closed ? d + " Z" : d;
};

// ── Limb outlines ────────────────────────────────────────────────────────────────────────────────────────────────
// A limb along a chain of joints, with a width to the front (+normal) and back at each sample: {seg, t, f, b}.
type Sample = { seg: number; t: number; f: number; b: number };
type LimbShape = { front: V[]; back: V[]; outline: V[] };
const limb = (
  joints: V[],
  samples: Sample[],
  capStart: number,
  capEnd: number,
): LimbShape => {
  const dirs = joints.slice(1).map((j, i) => norm(sub(j, joints[i])));
  const nrm = (d: V): V => ({ x: -d.y, y: d.x });
  const front: V[] = [];
  const back: V[] = [];
  for (const s of samples) {
    const a = joints[s.seg];
    const b = joints[s.seg + 1];
    const c = lerpV(a, b, s.t);
    let n = nrm(dirs[s.seg]);
    // blend normals round a joint so the outline turns smoothly
    if (s.t > 0.7 && s.seg + 1 < dirs.length)
      n = norm(lerpV(n, nrm(dirs[s.seg + 1]), ((s.t - 0.7) / 0.3) * 0.5));
    if (s.t < 0.3 && s.seg > 0)
      n = norm(lerpV(n, nrm(dirs[s.seg - 1]), ((0.3 - s.t) / 0.3) * 0.5));
    front.push(add(c, mul(n, s.f)));
    back.push(sub(c, mul(n, s.b)));
  }
  const d0 = dirs[0];
  const dn = dirs[dirs.length - 1];
  const first = samples[0];
  const lastS = samples[samples.length - 1];
  const startC = lerpV(joints[first.seg], joints[first.seg + 1], first.t);
  const endC = lerpV(joints[lastS.seg], joints[lastS.seg + 1], lastS.t);
  const endCap = add(endC, mul(dn, capEnd));
  const startCap = sub(startC, mul(d0, capStart));
  return {
    front,
    back,
    outline: [...front, endCap, ...[...back].reverse(), startCap],
  };
};

// A tapered brush stroke along points (screen), max width w: the confident manga line.
const brush = (q: Pt[], w: number) => {
  if (q.length < 2) return "";
  const n = q.length;
  const left: Pt[] = [];
  const right: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const a = q[Math.max(0, i - 1)];
    const b = q[Math.min(n - 1, i + 1)];
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const l = Math.hypot(dx, dy) || 1;
    const u = i / (n - 1);
    const half =
      (w / 2) * Math.pow(Math.sin(Math.PI * (0.08 + 0.84 * u)), 0.7);
    left.push([q[i][0] - (dy / l) * half, q[i][1] + (dx / l) * half]);
    right.push([q[i][0] + (dy / l) * half, q[i][1] - (dx / l) * half]);
  }
  return curve([...left, ...right.reverse()], true);
};

// ── Body part shapes (figure frame, metres) ──────────────────────────────────────────────────────────────────────
// How loose each kind of clothing is: race suits are loose fireproof overalls, work overalls looser still.
const LOOSE = {
  race: { leg: 1.13, arm: 1.16, torso: 1.1 },
  overall: { leg: 1.22, arm: 1.22, torso: 1.15 },
  casual: { leg: 1.04, arm: 1.0, torso: 1.06 },
};

const legShape = (l: LegJ, fit: Outfit["fit"]): LimbShape => {
  const k = LOOSE[fit].leg;
  const hem = fit === "casual" ? 0.052 : fit === "overall" ? 0.068 : 0.06;
  const footTop = add(l.ankle, lean(v(-0.005, 0.07), l.pitch));
  return limb(
    [l.hip, l.knee, footTop],
    [
      { seg: 0, t: 0.0, f: 0.086 * k, b: 0.102 * k },
      { seg: 0, t: 0.3, f: 0.084 * k, b: 0.09 * k },
      { seg: 0, t: 0.68, f: 0.068 * k, b: 0.072 * k },
      { seg: 0, t: 0.97, f: 0.06 * k, b: 0.058 * k },
      { seg: 1, t: 0.22, f: 0.05 * k, b: 0.061 * k },
      { seg: 1, t: 0.55, f: 0.047 * k, b: 0.056 * k },
      { seg: 1, t: 1.0, f: hem, b: hem },
    ],
    0.06,
    0.0,
  );
};

const armShape = (a: ArmJ, fit: Outfit["fit"]): LimbShape => {
  const k = LOOSE[fit].arm;
  return limb(
    [a.shoulder, a.elbow, a.wrist],
    [
      { seg: 0, t: 0.0, f: 0.072 * k, b: 0.075 * k },
      { seg: 0, t: 0.4, f: 0.057 * k, b: 0.059 * k },
      { seg: 0, t: 0.95, f: 0.045 * k, b: 0.045 * k },
      { seg: 1, t: 0.3, f: 0.046 * k, b: 0.045 * k },
      { seg: 1, t: 0.96, f: 0.036 * k, b: 0.036 * k },
    ],
    0.085,
    0.0,
  );
};

// A short sleeve over the upper arm (street clothes).
const sleeveShape = (a: ArmJ): LimbShape =>
  limb(
    [a.shoulder, a.elbow],
    [
      { seg: 0, t: 0.0, f: 0.08, b: 0.083 },
      { seg: 0, t: 0.35, f: 0.068, b: 0.07 },
      { seg: 0, t: 0.58, f: 0.064, b: 0.066 },
    ],
    0.09,
    0.0,
  );

// Torso: ribcage and pelvis as two blocks, the outline drawn round both — chest, belly, groin, seat, small of the
// back, shoulder blades.
const torsoShape = (b: Body, fit: Outfit["fit"]): V[] => {
  const k = LOOSE[fit].torso;
  const C = (x: number, y: number) => b.inChest(v(x * k, y));
  const Pv = (x: number, y: number) => b.inPelvis(v(x * k, y));
  return [
    C(0.05, 0.4),
    C(0.112, 0.335),
    C(0.135, 0.22),
    C(0.12, 0.09),
    Pv(0.11, 0.12),
    Pv(0.108, 0.03),
    Pv(0.062, -0.07),
    Pv(0.0, -0.097),
    Pv(-0.082, -0.077),
    Pv(-0.124, 0.0),
    Pv(-0.1, 0.11),
    C(-0.09, 0.04),
    C(-0.12, 0.17),
    C(-0.128, 0.3),
    C(-0.07, 0.395),
  ];
};

const bootShape = (l: LegJ, fit: Outfit["fit"]): V[] => {
  const s = fit === "overall" ? 1.08 : 1;
  const F = (x: number, y: number) =>
    add(l.ankle, lean(v(x * s, y), l.pitch));
  return [
    F(-0.05, 0.09),
    F(-0.068, 0.02),
    F(-0.07, -0.05),
    F(-0.058, -0.08),
    F(0.14, -0.08),
    F(0.195, -0.076),
    F(0.205, -0.055),
    F(0.165, -0.038),
    F(0.1, -0.02),
    F(0.045, 0.03),
    F(0.04, 0.09),
  ];
};

// ── Hands ────────────────────────────────────────────────────────────────────────────────────────────────────────
// In the hand's own frame: x from the wrist along the hand, y toward the thumb side (forward on a hanging arm), m.
// `mass` is the palm and fingers (several shapes merged under one outline), `thumb` is drawn over it with its own
// line, `lines` are the finger and knuckle strokes shown at larger sizes, `cuff` the race glove's gauntlet.
type HandShape = { mass: V[][]; thumb: V[]; lines: V[][]; cuff?: V[] };
const finger = (
  H: (x: number, y: number) => V,
  bx: number,
  by: number,
  deg: number,
  l: number,
  w: number,
): V[] => {
  const r = (deg * Math.PI) / 180;
  const d = { x: Math.cos(r), y: Math.sin(r) };
  const p = { x: -d.y, y: d.x };
  const P = (a: number, c: number) =>
    H(bx + d.x * a + p.x * c, by + d.y * a + p.y * c);
  return [
    P(-0.01, -w / 2),
    P(l * 0.6, -w * 0.5),
    P(l, -w * 0.32),
    P(l + w * 0.32, 0),
    P(l, w * 0.32),
    P(l * 0.6, w * 0.5),
    P(-0.01, w / 2),
  ];
};
const handShape = (a: ArmJ, cuff: boolean): HandShape => {
  const d = a.handDir;
  const n = { x: -d.y, y: d.x };
  const H = (x: number, y: number) =>
    add(a.wrist, add(mul(d, x * 0.92), mul(n, y * 0.92)));
  const L = (pts: [number, number][]) => pts.map(([x, y]) => H(x, y));
  let out: HandShape;
  switch (a.grip) {
    case "flat":
      // fingers together and straight, thumb apart
      out = {
        mass: [
          L([
            [-0.005, -0.037],
            [0.06, -0.041],
            [0.105, -0.036],
            [0.168, -0.027],
            [0.186, -0.014],
            [0.184, 0.004],
            [0.168, 0.016],
            [0.11, 0.026],
            [0.06, 0.036],
            [-0.005, 0.036],
          ]),
        ],
        thumb: L([
          [0.018, 0.03],
          [0.05, 0.052],
          [0.084, 0.07],
          [0.1, 0.066],
          [0.094, 0.054],
          [0.062, 0.03],
        ]),
        lines: [
          L([
            [0.112, -0.019],
            [0.17, -0.014],
          ]),
          L([
            [0.108, -0.003],
            [0.176, 0.0],
          ]),
          L([
            [0.106, 0.012],
            [0.166, 0.012],
          ]),
        ],
      };
      break;
    case "open":
      // relaxed: fingers loosely curled forward, thumb along the front
      out = {
        mass: [
          L([
            [-0.005, -0.035],
            [0.06, -0.04],
            [0.11, -0.034],
            [0.148, -0.02],
            [0.166, 0.0],
            [0.162, 0.018],
            [0.142, 0.024],
            [0.104, 0.026],
            [0.06, 0.035],
            [-0.005, 0.034],
          ]),
        ],
        thumb: L([
          [0.018, 0.03],
          [0.056, 0.05],
          [0.096, 0.054],
          [0.11, 0.047],
          [0.098, 0.037],
          [0.058, 0.028],
        ]),
        lines: [
          L([
            [0.11, -0.017],
            [0.152, -0.008],
          ]),
          L([
            [0.106, 0.004],
            [0.15, 0.012],
          ]),
        ],
      };
      break;
    case "spread":
      // fingers fanned out, thumb wide
      out = {
        mass: [
          L([
            [-0.005, -0.038],
            [0.07, -0.043],
            [0.106, -0.036],
            [0.112, 0.0],
            [0.104, 0.034],
            [0.06, 0.038],
            [-0.005, 0.036],
          ]),
          finger(H, 0.098, -0.03, -14, 0.062, 0.018),
          finger(H, 0.104, -0.011, -4, 0.078, 0.019),
          finger(H, 0.104, 0.008, 6, 0.08, 0.019),
          finger(H, 0.098, 0.026, 16, 0.07, 0.019),
        ],
        thumb: finger(H, 0.03, 0.03, 52, 0.07, 0.024),
        lines: [],
      };
      break;
    case "point":
      // index out, the other fingers curled under the thumb
      out = {
        mass: [
          L([
            [-0.005, -0.038],
            [0.055, -0.046],
            [0.09, -0.04],
            [0.104, -0.016],
            [0.1, 0.012],
            [0.08, 0.028],
            [0.04, 0.042],
            [-0.005, 0.036],
          ]),
          finger(H, 0.09, 0.024, 4, 0.085, 0.019),
        ],
        thumb: L([
          [0.03, 0.036],
          [0.064, 0.042],
          [0.088, 0.03],
          [0.084, 0.018],
          [0.05, 0.022],
        ]),
        lines: [
          L([
            [0.074, -0.036],
            [0.084, -0.014],
            [0.082, 0.008],
          ]),
        ],
      };
      break;
    default: {
      // fist / hold: fingers curled into the palm, the thumb across them (wrapped further round a handle)
      const hold = a.grip === "hold";
      out = {
        mass: [
          L([
            [-0.005, -0.039],
            [0.05, -0.046],
            [0.086, -0.042],
            [0.106, -0.022],
            [0.11, 0.004],
            [0.102, 0.03],
            [0.076, 0.045],
            [0.035, 0.046],
            [-0.005, 0.039],
          ]),
        ],
        thumb: hold
          ? L([
              [0.03, 0.038],
              [0.066, 0.058],
              [0.104, 0.048],
              [0.106, 0.032],
              [0.086, 0.03],
              [0.05, 0.03],
            ])
          : L([
              [0.024, 0.038],
              [0.058, 0.056],
              [0.09, 0.05],
              [0.098, 0.036],
              [0.078, 0.03],
              [0.044, 0.03],
            ]),
        lines: [
          L([
            [0.072, -0.04],
            [0.08, -0.012],
            [0.078, 0.016],
          ]),
          L([
            [0.088, -0.024],
            [0.106, -0.022],
          ]),
          L([
            [0.09, -0.004],
            [0.11, -0.003],
          ]),
        ],
      };
    }
  }
  if (cuff)
    out.cuff = L([
      [-0.06, -0.05],
      [0.016, -0.053],
      [0.016, 0.053],
      [-0.06, 0.05],
    ]);
  return out;
};

// ── Helmet (side view, same design data as the helmet in the car, ART-13) ────────────────────────────────────────
// Helmet units: centre 0 0, radius 1, facing left, y down.
const SHELL =
  "M -0.98 0.45 C -1.08 -0.1 -0.75 -0.98 0.05 -1 C 0.7 -1 1.05 -0.55 1.02 0.05 L 0.95 0.6 L -0.6 0.7 Z";
const HELMET_R = 0.14;

const Helmet: React.FC<{
  helmet: {
    base: string;
    stripe: string;
    trim?: string;
    shell?: "modern" | "classic";
    design?: Accent[];
  };
  id: string;
  transform: string;
  w: number; // ink width in helmet units
  tone: string;
}> = ({ helmet, id, transform, w, tone }) => {
  const { base, stripe, trim = stripe, shell = "modern", design } = helmet;
  return (
    <g transform={transform}>
      <defs>
        <clipPath id={`${id}-hc`}>
          <path d={SHELL} />
        </clipPath>
      </defs>
      {shell === "modern" ? (
        <>
          <path
            d="M 0.75 -0.75 L 1.02 -0.82 L 1.06 -0.58 Z"
            fill={base}
            stroke={INK}
            strokeWidth={w * 0.7}
            strokeLinejoin="round"
          />
          <path d="M -0.16 -0.99 L -0.12 -1.12 L 0.2 -1.12 L 0.24 -0.99 Z" fill={INK} />
        </>
      ) : null}
      <path d={SHELL} fill={base} stroke={INK} strokeWidth={w * 2} strokeLinejoin="round" />
      <path d={SHELL} fill={base} />
      <g clipPath={`url(#${id}-hc)`}>
        {design ? (
          design.map((a) => <path key={a.d} d={a.d} fill={a.color} />)
        ) : (
          <>
            <path d="M -0.75 -0.7 C -0.2 -0.95 0.5 -0.86 1 -0.32" fill="none" stroke={stripe} strokeWidth={0.2} />
            <path d="M 0.1 -0.02 C 0.45 -0.04 0.8 0.02 1.05 0.18" fill="none" stroke={trim} strokeWidth={0.13} />
          </>
        )}
        {/* shadow side: the lower back of the shell */}
        <path d="M -1.2 0.2 C -0.3 0.25 0.5 0.1 1.2 -0.45 L 1.2 1 L -1.2 1 Z" fill={tone} opacity={0.5} />
      </g>
      {/* visor with its glint, the chin vents */}
      <path
        d="M -1 -0.12 C -0.95 -0.42 -0.6 -0.5 -0.1 -0.46 L 0.12 -0.1 C -0.3 0.02 -0.75 0.05 -1 0.08 Z"
        fill="#15132a"
        stroke={INK}
        strokeWidth={w * 0.8}
        strokeLinejoin="round"
      />
      <path d="M -0.85 -0.34 C -0.6 -0.42 -0.3 -0.42 -0.08 -0.38" fill="none" stroke={PAPER} strokeWidth={w * 0.8} strokeLinecap="round" opacity={0.85} />
      <path d="M -0.88 0.3 L -0.62 0.3" stroke={INK} strokeWidth={w * 0.8} strokeLinecap="round" />
      <path d="M -0.5 -0.84 C -0.25 -0.95 0 -0.97 0.22 -0.94" fill="none" stroke={PAPER} strokeWidth={w * 1.1} strokeLinecap="round" opacity={0.9} />
    </g>
  );
};

// ── Held things ──────────────────────────────────────────────────────────────────────────────────────────────────
export type Held =
  // cylinder in the far hand with the hose to the nozzle in the near hand, or carried in the near hand (`carry`);
  // `aim` points the nozzle (figure frame direction; default along the near hand), `spray` 0..1 draws a jet
  | { kind: "extinguisher"; spray?: number; carry?: boolean; aim?: V }
  | null;

// Where an extinguisher's nozzle points from, and its tip, in the figure frame (for a jet the scene draws itself).
export const nozzleOf = (pose: Pose, aim?: V) => {
  const n = solve(pose).arms.near;
  const dir = aim ? norm(aim) : n.handDir;
  const base = add(n.wrist, mul(n.handDir, 0.06));
  return { base, tip: add(base, mul(dir, 0.13)), dir };
};

const ALL_PARTS: readonly BodyPart[] = ["farLeg", "body", "nearLeg", "nearArm"];

// ── The figure ───────────────────────────────────────────────────────────────────────────────────────────────────
export const Figure: React.FC<{
  at: { x: number; y: number }; // screen point of the figure's ground origin (under the hip at rest)
  pxPerMetre: number;
  pose: Pose;
  outfit: Outfit;
  facing: "left" | "right";
  held?: Held;
  shadow?: boolean; // a flat ink shadow under the feet
  rim?: string | null; // firelight: an outer rim in this colour on `rimSide`
  rimSide?: "left" | "right";
  parts?: readonly BodyPart[]; // draw only these parts (default all); the shadow goes with "body"
}> = ({
  at,
  pxPerMetre: s,
  pose,
  outfit,
  facing,
  held = null,
  shadow = true,
  rim = null,
  rimSide = "right",
  parts = ALL_PARTS,
}) => {
  const id = `fig${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const dir = facing === "left" ? -1 : 1;
  const X = (p: V): Pt => [at.x + p.x * s * dir, at.y - p.y * s];
  const path = (pts: V[], closed = true) => curve(pts.map(X), closed);
  const b = solve(pose);
  const fit = outfit.fit;
  const suit = outfit.suit;
  const shade = outfit.shade ?? shadeOf(suit, 0.32);
  const casual = fit === "casual";
  const race = fit === "race";
  const work = fit === "overall";
  const legColor = casual ? (outfit.trousers ?? shade) : suit;
  const legShade = casual ? shadeOf(legColor, 0.3) : shade;
  const bare = casual && outfit.sleeves === "short";
  const show = new Set(parts);
  // close-up detail (finger strokes, zip, seams) only where it reads
  const detail = s >= 150;

  // line weights: the silhouette contour, inner lines, fold strokes
  const ink = Math.max(1.3, s * 0.0105);
  const thin = Math.max(0.8, s * 0.0055);
  const edge = Math.max(1, s * 0.0075);
  const fold = Math.max(1.1, s * 0.0085);
  const gap = Math.min(7, Math.max(3, s * 0.024));

  // shapes
  const legN = legShape(b.legs.near, fit);
  const legF = legShape(b.legs.far, fit);
  const armN = armShape(b.arms.near, fit);
  const armF = armShape(b.arms.far, fit);
  const torso = torsoShape(b, fit);
  const bootN = bootShape(b.legs.near, fit);
  const bootF = bootShape(b.legs.far, fit);
  const cuffs = race;
  const handN = handShape(b.arms.near, cuffs);
  const handF = handShape(b.arms.far, cuffs);
  const neckBase = b.neck;
  const headLean = b.chest * 0.55 + b.head;
  const headC = add(neckBase, lean(v(0.035, 0.13), headLean));
  const neck = [
    add(neckBase, lean(v(0.055, -0.02), b.chest)),
    add(headC, lean(v(0.03, -0.08), headLean)),
    add(headC, lean(v(-0.07, -0.06), headLean)),
    add(neckBase, lean(v(-0.06, -0.02), b.chest)),
  ];
  const tk = LOOSE[fit].torso;
  const C = (x: number, y: number) => b.inChest(v(x * tk, y));
  // stand-up collar round the base of the neck (race suits and overalls)
  const collar = casual
    ? null
    : [C(0.062, 0.388), C(0.07, 0.432), C(0.0, 0.448), C(-0.06, 0.44), C(-0.072, 0.392), C(0.0, 0.38)];

  // head outline (for the silhouette and the rim): helmet shell or skull
  const head = outfit.head;
  const helmetT = (() => {
    const [hx, hy] = X(headC);
    const k = HELMET_R * s;
    return `translate(${f1(hx)} ${f1(hy)}) rotate(${f1(dir * headLean)}) scale(${(-dir * k).toFixed(4)} ${k.toFixed(4)})`;
  })();
  const H = (x: number, y: number) => add(headC, lean(v(x, y), headLean));
  const skull = [
    H(-0.105, 0.0),
    H(-0.08, 0.085),
    H(0.0, 0.118),
    H(0.07, 0.085),
    H(0.093, 0.035),
    H(0.1, 0.0),
    H(0.118, -0.03),
    H(0.1, -0.05),
    H(0.098, -0.075),
    H(0.085, -0.105),
    H(0.04, -0.118),
    H(-0.03, -0.085),
    H(-0.08, -0.065),
  ];

  const handPts = (g: HandShape) => [...g.mass, g.thumb, ...(g.cuff ? [g.cuff] : [])];

  // Everything that makes the silhouette, per part, for the contour underlay and the rim.
  const silhouetteOf: Record<BodyPart, string[]> = {
    farLeg: [path(bootF), path(legF.outline)],
    body: [
      path(armF.outline),
      ...handPts(handF).map((p) => path(p)),
      path(torso),
      path(neck),
      collar ? path(collar) : "",
      head.kind === "helmet" ? "" : path(skull),
    ],
    nearLeg: [path(bootN), path(legN.outline)],
    nearArm: [path(armN.outline), ...handPts(handN).map((p) => path(p))],
  };
  const silhouette = ALL_PARTS.filter((p) => show.has(p)).flatMap(
    (p) => silhouetteOf[p],
  );

  // shadow-side crescent mask for a shape: the shape minus itself moved toward the light (upper left on screen)
  const lightShift = Math.max(2, 0.03 * s);
  const masks: { key: string; d: string }[] = [];
  const toneOn = (key: string, d: string, opacity = 0.55) => {
    masks.push({ key, d });
    return (
      <path d={d} fill={`url(#${id}-dots)`} mask={`url(#${id}-m-${key})`} opacity={opacity} />
    );
  };

  // fold strokes
  const suitLine = lineOn(suit);
  const legLine = lineOn(legColor);
  const foldAt = (pts: V[], w = fold, c = suitLine) => (
    <path d={brush(pts.map(X), w)} fill={c} />
  );
  const legFolds = (l: LegJ, shape: LimbShape) => {
    const bend = Math.abs(
      Math.atan2(l.knee.x - l.hip.x, l.hip.y - l.knee.y) -
        Math.atan2(l.ankle.x - l.knee.x, l.knee.y - l.ankle.y),
    );
    const out: React.ReactNode[] = [];
    // back of the knee: a fold that grows with the bend
    if (bend > 0.25) {
      const kb = shape.back[3];
      const into = lerpV(kb, l.knee, 0.75);
      out.push(
        foldAt([kb, lerpV(kb, into, 0.5), add(into, mul(norm(sub(l.hip, l.knee)), 0.03))], fold, legLine),
      );
    }
    // loose suits drape: one line from the knee down the shin
    if (!casual) {
      const a = lerpV(l.knee, shape.front[3], 0.3);
      const c2 = lerpV(l.knee, l.ankle, 0.55);
      out.push(foldAt([a, lerpV(a, c2, 0.5), c2], fold * 0.8, legLine));
    }
    // the suit bunching over the boot
    if (race && detail) {
      const h0 = shape.front[6];
      const h1 = shape.back[6];
      const up = mul(norm(sub(l.knee, l.ankle)), 0.05);
      out.push(foldAt([add(lerpV(h0, h1, 0.15), up), add(lerpV(h0, h1, 0.5), mul(up, 0.6)), lerpV(h0, h1, 0.8)], fold * 0.7, legLine));
    }
    return out;
  };
  const armFold = (a: ArmJ, shape: LimbShape) => {
    const u = norm(sub(a.elbow, a.shoulder));
    const f = norm(sub(a.wrist, a.elbow));
    const bend = Math.acos(Math.max(-1, Math.min(1, u.x * f.x + u.y * f.y)));
    if (bend < 0.35) return null;
    // the inside of the elbow: on the front side when the forearm folds forward, the back when it folds back
    const fwd = u.x * f.y - u.y * f.x > 0;
    const inner = fwd ? shape.front[2] : shape.back[2];
    return foldAt([
      lerpV(inner, a.elbow, 0.1),
      lerpV(inner, a.elbow, 0.55),
      lerpV(a.elbow, a.wrist, 0.12),
    ]);
  };

  // decorations clipped to a part: band, belt, armband
  const clip = (key: string, d: string) => (
    <clipPath id={`${id}-c-${key}`}>
      <path d={d} />
    </clipPath>
  );
  const stroke = (pts: V[], width: number, color: string, closed = false) => (
    <path d={path(pts, closed)} fill="none" stroke={color} strokeWidth={width * s} strokeLinecap="butt" />
  );

  const legBand = (l: LegJ, key: string) =>
    outfit.band ? (
      <g clipPath={`url(#${id}-c-${key})`}>
        {stroke([l.hip, l.knee, l.ankle], race ? 0.035 : 0.045, outfit.band)}
      </g>
    ) : null;

  const torsoD = path(torso);
  const legND = path(legN.outline);
  const legFD = path(legF.outline);
  const armND = path(armN.outline);
  const armFD = path(armF.outline);
  const sleeveND = bare ? path(sleeveShape(b.arms.near).outline) : "";
  const sleeveFD = bare ? path(sleeveShape(b.arms.far).outline) : "";

  const part = (d: string, fill: string, sw = thin, line = INK) => (
    <path d={d} fill={fill} stroke={line} strokeWidth={sw} strokeLinejoin="round" />
  );
  // a hand: the merged palm-and-fingers mass (outline under, fill over), the thumb over it, the finger strokes
  const hand = (g: HandShape, color: string, near: boolean) => {
    const fill = near ? color : shadeOf(color, 0.3);
    return (
      <g>
        {g.cuff ? part(path(g.cuff), shadeOf(color, near ? 0.12 : 0.35)) : null}
        <g fill={INK} stroke={INK} strokeWidth={thin * 2} strokeLinejoin="round">
          {g.mass.map((m, i) => (
            <path key={i} d={path(m)} />
          ))}
        </g>
        <g fill={fill}>
          {g.mass.map((m, i) => (
            <path key={i} d={path(m)} />
          ))}
        </g>
        {part(path(g.thumb), fill, thin, lineOn(fill))}
        {detail
          ? g.lines.map((l, i) => (
              <path key={i} d={brush(l.map(X), thin * 1.3)} fill={lineOn(fill)} />
            ))
          : null}
      </g>
    );
  };
  const boot = (pts: V[], near: boolean) => (
    <g>
      {part(path(pts), near ? outfit.boots : shadeOf(outfit.boots, 0.3))}
      {/* the sole as one heavier stroke */}
      <path
        d={path([pts[3], lerpV(pts[3], pts[4], 0.5), pts[4], pts[5]], false)}
        fill="none"
        stroke={INK}
        strokeWidth={work ? fold * 1.6 : fold}
        strokeLinecap="round"
      />
    </g>
  );

  // head drawing
  const headNode = (() => {
    if (head.kind === "helmet")
      return (
        <Helmet
          helmet={head.helmet}
          id={id}
          transform={helmetT}
          w={ink / (HELMET_R * s)}
          tone={`url(#${id}-dots)`}
        />
      );
    // a bare / capped head: skull in skin or hair, the face side in shadow, an ear, and the hat
    const hair = head.kind === "cap" ? head.hair : head.kind === "hair" ? head.hair : "#2a2522";
    const faceShadow = [H(0.0, 0.04), H(0.1, 0.035), H(0.12, -0.03), H(0.1, -0.11), H(0.0, -0.1)];
    const hat =
      head.kind === "cap"
        ? {
            dome: [H(-0.112, 0.01), H(-0.09, 0.09), H(0.0, 0.135), H(0.075, 0.1), H(0.1, 0.035), H(-0.02, 0.03)],
            peak: [H(0.06, 0.05), H(0.2, 0.03), H(0.2, 0.015), H(0.06, 0.025)],
            color: head.color,
          }
        : head.kind === "openHelmet"
          ? {
              dome: [H(-0.125, -0.04), H(-0.11, 0.09), H(0.0, 0.15), H(0.085, 0.11), H(0.11, 0.04), H(-0.01, -0.02), H(-0.04, -0.07)],
              peak: [H(0.08, 0.06), H(0.16, 0.045), H(0.155, 0.03), H(0.08, 0.035)],
              color: head.color,
            }
          : null;
    // bare heads: the hair covers the crown and the back
    const hairCap =
      head.kind === "hair"
        ? [H(-0.11, -0.01), H(-0.095, 0.08), H(-0.01, 0.125), H(0.075, 0.095), H(0.1, 0.045), H(0.06, 0.06), H(0.0, 0.06), H(-0.04, 0.0), H(-0.07, -0.07)]
        : [H(-0.107, 0.02), H(-0.06, 0.1), H(0.02, 0.1), H(-0.02, 0.0), H(-0.05, -0.06), H(-0.085, -0.06)];
    return (
      <g>
        {part(path(skull), SKIN, ink)}
        <path d={path(hairCap)} fill={hair} clipPath={`url(#${id}-c-skull)`} />
        {/* the face stays in shadow (ART-5) */}
        <path d={path(faceShadow)} fill={`url(#${id}-dots)`} opacity={0.75} clipPath={`url(#${id}-c-skull)`} />
        {head.kind !== "hair" ? (
          <path d={path([H(0.02, 0.04), H(0.12, 0.03), H(0.11, 0.0), H(0.03, 0.005)])} fill={INK} opacity={0.85} clipPath={`url(#${id}-c-skull)`} />
        ) : null}
        <path d={path([H(-0.005, 0.0), H(-0.03, 0.01), H(-0.035, -0.035), H(-0.01, -0.04)], false)} fill="none" stroke={INK} strokeWidth={thin} />
        {hat ? (
          <>
            {part(path(hat.dome), hat.color, ink * 0.9)}
            {part(path(hat.peak), shadeOf(hat.color, 0.25), thin)}
            {head.kind === "openHelmet" && head.stripe ? (
              <g clipPath={`url(#${id}-c-hat)`}>{stroke([H(-0.13, 0.03), H(0.0, 0.075), H(0.12, 0.05)], 0.02, head.stripe)}</g>
            ) : null}
          </>
        ) : null}
        <path d={path(skull)} fill="none" stroke={INK} strokeWidth={ink} strokeLinejoin="round" />
        {hat ? <path d={path(hat.dome)} fill="none" stroke={INK} strokeWidth={ink} strokeLinejoin="round" /> : null}
      </g>
    );
  })();
  const hatDome =
    head.kind === "cap" || head.kind === "openHelmet"
      ? path(
          head.kind === "cap"
            ? [H(-0.112, 0.01), H(-0.09, 0.09), H(0.0, 0.135), H(0.075, 0.1), H(0.1, 0.035), H(-0.02, 0.03)]
            : [H(-0.125, -0.04), H(-0.11, 0.09), H(0.0, 0.15), H(0.085, 0.11), H(0.11, 0.04), H(-0.01, -0.02), H(-0.04, -0.07)],
        )
      : "";

  // held extinguisher: cylinder hanging from the far hand, hose to the nozzle in the near hand
  const extinguisher = (() => {
    if (!held || held.kind !== "extinguisher") return null;
    const carry = !!held.carry;
    const g = carry ? b.arms.near : b.arms.far;
    const top = add(g.wrist, mul(g.handDir, 0.05));
    const axis = v(0, -1);
    const side = v(1, 0);
    const R = 0.075;
    const Cy = (x: number, y: number) => add(add(top, mul(side, x)), mul(axis, y));
    const body = [Cy(-R, 0.06), Cy(-R, 0.5), Cy(-R * 0.6, 0.53), Cy(R * 0.6, 0.53), Cy(R, 0.5), Cy(R, 0.06), Cy(R * 0.6, 0.02), Cy(-R * 0.6, 0.02)];
    const n = b.arms.near;
    const noz = nozzleOf(pose, held.aim);
    const nozzle = noz.base;
    const tip = noz.tip;
    const hose = carry
      ? [Cy(R * 0.3, 0.0), Cy(R * 1.6, 0.06), Cy(R * 1.5, 0.3), Cy(R, 0.36)]
      : [Cy(R * 0.3, 0.0), add(Cy(0, 0.2), v(0.15, -0.25)), lerpV(nozzle, add(n.wrist, v(0, -0.2)), 0.5), nozzle];
    const jet = held.spray ?? 0;
    const d = noz.dir;
    const nn = { x: -d.y, y: d.x };
    const J = (along: number, across: number) => add(tip, add(mul(d, along), mul(nn, across)));
    return {
      cylinder: (
        <g>
          {part(path(body), "#d22a26", thin)}
          <path d={path([Cy(-R * 0.5, 0.12), Cy(-R * 0.5, 0.44)], false)} fill="none" stroke={PAPER} strokeWidth={thin * 1.4} strokeLinecap="round" opacity={0.7} />
          {part(path([Cy(-0.025, 0.02), Cy(-0.025, -0.02), Cy(0.025, -0.02), Cy(0.025, 0.02)]), "#2b2b2b", thin)}
        </g>
      ),
      hose: (
        <g>
          <path d={path(hose, false)} fill="none" stroke={INK} strokeWidth={Math.max(1.5, 0.022 * s)} strokeLinecap="round" />
          {carry ? null : (
            <path d={path([nozzle, tip], false)} fill="none" stroke={INK} strokeWidth={Math.max(2, 0.035 * s)} strokeLinecap="round" />
          )}
        </g>
      ),
      jet:
        jet > 0 ? (
          <path
            d={path([tip, J(0.25 * jet, 0.07), J(0.55 * jet, 0.2), J(0.75 * jet, 0.34), J(0.95 * jet, 0.3), J(1.05 * jet, 0.12), J(1.0 * jet, -0.1), J(0.85 * jet, -0.26), J(0.6 * jet, -0.24), J(0.3 * jet, -0.1), J(0.1 * jet, -0.03)])}
            fill={`url(#${id}-dots)`}
            stroke={INK}
            strokeWidth={edge}
            strokeLinejoin="round"
          />
        ) : null,
      jetCore:
        jet > 0 ? (
          <path
            d={path([tip, J(0.3 * jet, 0.06), J(0.6 * jet, 0.13), J(0.8 * jet, 0.1), J(0.85 * jet, -0.04), J(0.65 * jet, -0.12), J(0.35 * jet, -0.07)])}
            fill={PAPER}
          />
        ) : null,
    };
  })();

  // ground shadow under the feet
  const feetX = [b.legs.near.ankle.x, b.legs.far.ankle.x];
  const footLift = Math.min(b.legs.near.ankle.y, b.legs.far.ankle.y) - BONES.ankle;
  const shadowK = Math.max(0.35, 1 - footLift * 2.5);
  const [scx, scy] = X(v((Math.min(...feetX) + Math.max(...feetX)) / 2 + 0.06, 0));
  const srx = ((Math.max(...feetX) - Math.min(...feetX)) / 2 + 0.24) * s * shadowK;

  const rimShift = (rimSide === "right" ? 1 : -1) * Math.max(2, ink * 1.6);

  const nearArmEdges = (
    <path d={path(armN.back, false) + " " + path(armN.front, false)} fill="none" stroke={bare ? INK : suitLine} strokeWidth={edge} strokeLinecap="round" />
  );
  const nearLegEdges = (
    <path d={path(legN.front.slice(1), false) + " " + path(legN.back.slice(2), false)} fill="none" stroke={legLine} strokeWidth={edge} strokeLinecap="round" />
  );

  // race-suit details on the body: the front zip with its pull, the waist where the suit blouses
  const nA = b.arms.near;
  const zip =
    race && detail ? (
      <g>
        <path
          d={path([C(0.088, 0.372), C(0.11, 0.3), C(0.113, 0.2), C(0.1, 0.1), b.inPelvis(v(0.09 * tk, 0.06))], false)}
          fill="none"
          stroke={suitLine}
          strokeWidth={thin}
          strokeLinecap="round"
        />
        {part(path([C(0.08, 0.37), C(0.096, 0.37), C(0.098, 0.335), C(0.082, 0.335)]), "#b9bcc2", thin * 0.8)}
      </g>
    ) : null;
  const waistFold = !casual
    ? foldAt([C(0.122, 0.075), C(0.09, 0.06), C(0.05, 0.062)], fold * 0.8)
    : null;
  // the shoulder seam over the near arm's root and the epaulette on top (race suits, close-up)
  // (both in the ribcage frame round the shoulder joint, so they stay on the shoulder whatever the arm does)
  const J = (x: number, y: number) =>
    b.inChest(add(BONES.shoulder, v(x * LOOSE[fit].arm, y * LOOSE[fit].arm)));
  const shoulderTop = J(0, 0.072);
  const seam =
    !casual && detail ? (
      <path
        d={path([J(-0.066, 0.03), J(-0.03, 0.068), J(0.03, 0.068), J(0.068, 0.028), J(0.076, -0.04)], false)}
        fill="none"
        stroke={suitLine}
        strokeWidth={thin}
        strokeLinecap="round"
      />
    ) : null;
  const epaulette =
    race && detail
      ? part(
          path([
            add(shoulderTop, lean(v(-0.04, -0.004), b.chest)),
            add(shoulderTop, lean(v(0.04, -0.004), b.chest)),
            add(shoulderTop, lean(v(0.04, 0.022), b.chest)),
            add(shoulderTop, lean(v(-0.04, 0.022), b.chest)),
          ]),
          outfit.collar ?? shadeOf(suit, 0.18),
          thin,
        )
      : null;

  const layers: Record<BodyPart, React.ReactNode> = {
    farLeg: (
      <g>
        {boot(bootF, false)}
        {part(legFD, legShade)}
      </g>
    ),
    body: (
      <g>
        {/* far arm, one shade darker */}
        {part(armFD, bare ? shadeOf(SKIN, 0.2) : shade)}
        {bare ? part(sleeveFD, shade) : null}
        {hand(handF, outfit.gloves, false)}
        {held?.kind === "extinguisher" && !held.carry ? extinguisher?.cylinder : null}
        {/* torso and neck */}
        <path d={path(neck)} fill={race ? shadeOf(suit, 0.15) : SKIN} stroke={INK} strokeWidth={thin} />
        {part(torsoD, suit)}
        {outfit.band ? (
          <g clipPath={`url(#${id}-c-torso)`}>
            {stroke([b.inChest(v(-0.01, 0.3)), b.inChest(v(-0.012, 0.1)), b.inPelvis(v(-0.01, 0.0))], race ? 0.035 : 0.045, outfit.band)}
          </g>
        ) : null}
        {outfit.belt ? (
          <g clipPath={`url(#${id}-c-torso)`}>{stroke([b.inPelvis(v(-0.2, 0.16)), b.inPelvis(v(0.2, 0.16))], 0.05, outfit.belt)}</g>
        ) : null}
        {casual ? (
          // the trousers' waist under the shirt
          <g clipPath={`url(#${id}-c-torso)`}>
            {stroke([b.inPelvis(v(-0.3, -0.02)), b.inPelvis(v(0.3, -0.02))], 0.14, legColor)}
          </g>
        ) : null}
        {toneOn("torso", torsoD)}
        {/* the near arm's cast shadow on the body */}
        {show.has("nearArm") ? (
          <g clipPath={`url(#${id}-c-torso)`}>
            <path d={armND} fill={`url(#${id}-dots)`} opacity={0.7} transform={`translate(${f1(lightShift * 0.5)} ${f1(lightShift * 0.8)})`} />
          </g>
        ) : null}
        {zip}
        {/* the seat crease and the waist */}
        {foldAt([b.inPelvis(v(-0.105, -0.05)), b.inPelvis(v(-0.06, -0.085)), b.inPelvis(v(-0.01, -0.08))], fold * 0.9)}
        {waistFold}
        {work ? foldAt([C(0.02, 0.27), C(0.06, 0.15), C(0.07, 0.04)], fold * 0.8) : null}
        {collar ? part(path(collar), outfit.collar ?? shadeOf(suit, 0.18), thin) : null}
        {/* head */}
        {headNode}
      </g>
    ),
    nearLeg: (
      <g>
        {boot(bootN, true)}
        <path d={legND} fill={legColor} />
        {legBand(b.legs.near, "legN")}
        {toneOn("legN", legND)}
        {nearLegEdges}
        {legFolds(b.legs.near, legN)}
      </g>
    ),
    nearArm: (
      <g>
        {held?.kind === "extinguisher" && held.carry ? extinguisher?.cylinder : null}
        {extinguisher?.hose}
        <path d={armND} fill={bare ? SKIN : suit} />
        {bare ? <path d={sleeveND} fill={suit} stroke={INK} strokeWidth={thin} /> : null}
        {outfit.armband ? (
          <g clipPath={`url(#${id}-c-armN)`}>
            {stroke([lerpV(nA.shoulder, nA.elbow, 0.3), lerpV(nA.shoulder, nA.elbow, 0.5)], 0.13, outfit.armband)}
          </g>
        ) : null}
        {outfit.band ? (
          <g clipPath={`url(#${id}-c-armN)`}>
            {stroke([nA.shoulder, nA.elbow, nA.wrist], race ? 0.024 : 0.032, outfit.band)}
          </g>
        ) : null}
        {toneOn("armN", armND)}
        {nearArmEdges}
        {armFold(nA, armN)}
        {seam}
        {epaulette}
        {hand(handN, outfit.gloves, true)}
        {extinguisher?.jet}
        {extinguisher?.jetCore}
      </g>
    ),
  };

  return (
    <g>
      <defs>
        <pattern id={`${id}-dots`} width={gap} height={gap} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <circle cx={gap / 2} cy={gap / 2} r={gap * 0.3} fill={INK} />
        </pattern>
        {clip("torso", torsoD)}
        {clip("legN", legND)}
        {clip("armN", armND)}
        {clip("skull", path(skull))}
        {hatDome ? clip("hat", hatDome) : null}
        {masks.map((m) => (
          <mask key={m.key} id={`${id}-m-${m.key}`} maskUnits="userSpaceOnUse" x={-10000} y={-10000} width={30000} height={30000}>
            <path d={m.d} fill="#fff" />
            <path d={m.d} fill="#000" transform={`translate(${f1(-lightShift * 0.55)} ${f1(-lightShift)})`} />
          </mask>
        ))}
      </defs>
      {shadow && show.has("body") ? (
        <ellipse cx={scx} cy={scy} rx={srx} ry={Math.max(2, 0.045 * s * shadowK)} fill={INK} opacity={0.9} />
      ) : null}
      {rim ? (
        <g transform={`translate(${rimShift} ${-ink * 0.6})`} fill={rim} stroke={rim} strokeWidth={ink * 2.4} strokeLinejoin="round" opacity={0.95}>
          {silhouette.filter(Boolean).map((d, i) => (
            <path key={i} d={d} />
          ))}
          {head.kind === "helmet" && show.has("body") ? <path d={SHELL} transform={helmetT} /> : null}
        </g>
      ) : null}
      {/* the silhouette contour, heavier toward the lower right */}
      <g transform={`translate(${f1(ink * 0.3)} ${f1(ink * 0.45)})`} fill={INK} stroke={INK} strokeWidth={ink * 2} strokeLinejoin="round">
        {silhouette.filter(Boolean).map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>
      <g fill={INK} stroke={INK} strokeWidth={ink * 1.6} strokeLinejoin="round">
        {silhouette.filter(Boolean).map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>
      {ALL_PARTS.filter((p) => show.has(p)).map((p) => (
        <g key={p}>{layers[p]}</g>
      ))}
    </g>
  );
};
