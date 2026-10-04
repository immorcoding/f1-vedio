// Shot 1.4 (bars 19–20): the crash, side-on from SEN's side of the track (1.3 seen from the inside of the chicane).
// On 19.1 the picture freezes on the touch: the impact star sits on the contact point — PRO's right front wheel coming
// down on SEN's front wing — with "咔！", focus lines and the first debris hanging in the air. Then it runs on: the two
// McLarens, locked together exactly as they met at the end of 1.3 (staging.ts), slide on with their front wheels
// locked, laying black marks and tyre smoke, debris skittering down the road, and stop at the mouth of the chicane's
// escape road — PRO turned across SEN's nose, SEN's wing bent up under PRO's wheel. On 20.1 the page splits: the
// stopped pair on the left, and on the right the fans' easter egg (STO-7, docs/production/facts.md): marshals push
// SEN down the escape road past the abandoned PRO car, the Honda fires and he drives off between the bollards — read
// left to right.
import { Easing, random } from "remotion";
import { carPoint, MangaCar, MP4_5_PRO, MP4_5_SEN } from "../../../cars";
import type { CarSpec, CarState } from "../../../cars";
import { offsetFrom, pinhole, type Camera } from "../../../kit/camera";
import { INK, PAPER } from "../../../kit/colors";
import {
  Figure,
  walkPose,
  type BodyPose,
  type Outfit,
} from "../../../kit/figure";
import { ImpactStar } from "../../../kit/impact";
import { InkFilterDef, inkFilter } from "../../../kit/ink";
import { Sfx } from "../../../kit/lettering";
import { focusLines, speedLines } from "../../../kit/lines";
import { ToneDefs, tone } from "../../../kit/tone";
import {
  Barriers,
  Grandstand,
  Hills,
  Sky,
  TRACKSIDE_DEFAULT,
  type TracksideLayout,
} from "../../../scenes/suzuka-1989/trackside";
import { Foreground } from "./Foreground";
import { FarVerge, RoadFlow } from "./Motion";
import { ramp, shotById, type PictureProps } from "./common";
import {
  CONTACT_14,
  FREEZE_14,
  HIT,
  MID_WHEELBASE,
  PRO_AHEAD_14,
  PRO_YAW_14,
  PUSH,
  SEN_MID_14,
  slide14,
  slideSpeed14,
  slideTime14,
  Z_PRO_14,
  Z_SEN_14,
} from "./staging";

const RED = "#ee3a24";

// The main panel's camera: 2.2 m up, close, f = 1700 px (ART-9).
const CAM = pinhole({ f: 1700, horizon: 380, cx: 960, height: 2.2 });
const LAYOUT: TracksideLayout = {
  ...TRACKSIDE_DEFAULT,
  nearEdge: 5,
  farEdge: 17,
};

const FRONT_AXLE = carPoint(MP4_5_SEN, "frontAxle").x; // m from the rear end
const REAR_AXLE = carPoint(MP4_5_SEN, "rearAxle").x;
const NOSE = carPoint(MP4_5_SEN, "nose").x;

// ── a car seen side-on but yawed toward the camera ────────────────────────────────────────────────────────────
// The side view is a flat silhouette, so a car turned by `yaw` degrees (nose toward the camera) is drawn through the
// affine map that carries its rear end and nose to where the camera sees them: shorter, nose lower and nearer.
type Plan = { x: number; z: number }; // world metres, x relative to the camera
const yawedPoint = (
  rear: Plan,
  yaw: number,
  ahead: number,
  right = 0,
): Plan => {
  const a = (yaw * Math.PI) / 180;
  return {
    // forward is (cos a, −sin a); the car's right side, toward the camera, is (−sin a, −cos a)
    x: rear.x + Math.cos(a) * ahead - Math.sin(a) * right,
    z: rear.z - Math.sin(a) * ahead - Math.cos(a) * right,
  };
};
const YawedCar: React.FC<{
  cam: Camera;
  car: CarSpec;
  rear: Plan;
  yaw: number;
  state?: CarState;
}> = ({ cam, car, rear, yaw, state }) => {
  const L = 4;
  const nose = yawedPoint(rear, yaw, L);
  const mid = yawedPoint(rear, yaw, L / 2);
  const r = cam.project({ x: rear.x, z: rear.z });
  const n = cam.project({ x: nose.x, z: nose.z });
  const P = cam.pxPerMetre(mid.z);
  const up = cam.pxPerMetre(mid.z); // px per metre of height at the middle of the car
  const m = [(n.x - r.x) / (L * P), (n.y - r.y) / (L * P), 0, up / P, r.x, r.y];
  return (
    <g transform={`matrix(${m.map((v) => v.toFixed(5)).join(" ")})`}>
      <MangaCar car={car} at={{ x: 0, y: 0, pxPerMetre: P }} state={state} />
    </g>
  );
};

// ── tyre smoke: inked puffs ───────────────────────────────────────────────────────────────────────────────────
const Puff: React.FC<{ x: number; y: number; r: number; o: number }> = ({
  x,
  y,
  r,
  o,
}) => (
  <g opacity={o}>
    <circle cx={x} cy={y} r={r} fill={PAPER} stroke={INK} strokeWidth={2.6} />
    <path
      d={`M ${x - r * 0.2} ${y + r * 0.9} A ${r} ${r} 0 0 0 ${x + r * 0.95} ${y + r * 0.2}`}
      fill="none"
      stroke={tone("light")}
      strokeWidth={r * 0.35}
    />
  </g>
);

// A cloud of puffs drawn as one inked silhouette: every outline first, then every fill over it, so the puffs merge
// instead of showing each other's rims.
type PuffAt = { x: number; y: number; r: number; o: number };
const Cloud: React.FC<{ puffs: PuffAt[] }> = ({ puffs }) => (
  <g opacity={0.95}>
    {puffs.map((p, i) => (
      <circle key={`o-${i}`} cx={p.x} cy={p.y} r={p.r * p.o + 2.6} fill={INK} />
    ))}
    {puffs.map((p, i) => (
      <circle key={`f-${i}`} cx={p.x} cy={p.y} r={p.r * p.o} fill={PAPER} />
    ))}
    {puffs.map((p, i) => (
      <path
        key={`s-${i}`}
        d={`M ${p.x - p.r * p.o * 0.1} ${p.y + p.r * p.o * 0.8} A ${p.r * p.o} ${p.r * p.o} 0 0 0 ${p.x + p.r * p.o * 0.9} ${p.y + p.r * p.o * 0.15}`}
        fill="none"
        stroke={tone("light")}
        strokeWidth={p.r * p.o * 0.3}
      />
    ))}
  </g>
);

// Puffs left behind a wheel as it slides: one every 0.07 s of the slide, each fixed where it was born, rising and
// growing, shrinking away at the end of their LIFE seconds (o is the shrink factor).
const LIFE = 1.1;
const smokeAt = (
  wheel: (slide: number) => Plan,
  ts: number,
  camX: number,
  seed: string,
) => {
  const out: { x: number; y: number; r: number; o: number; z: number }[] = [];
  for (let k = 0; k < 9; k++) {
    const born = k * 0.07;
    const age = ts - born;
    if (age < 0 || age > LIFE) continue;
    // where the wheel was then, in world x (slide distance at birth)
    const sAt = 22 * 0.45 * (1 - Math.exp(-born / 0.45));
    const w = wheel(sAt);
    const jitter = random(`${seed}-${k}`) - 0.5;
    const p = CAM.project({
      x: w.x + sAt - camX + jitter * 0.4,
      y: 0.25 + 0.45 * age,
      z: w.z,
    });
    out.push({
      x: p.x,
      y: p.y,
      z: w.z,
      r: (0.14 + 0.4 * age) * CAM.pxPerMetre(w.z),
      o: Math.min(1, Math.max(0, (LIFE - age) / (0.4 * LIFE))),
    });
  }
  return out;
};

// ── debris: pieces of front wing and nose thrown from the contact point ─────────────────────────────────────────
const DEBRIS = Array.from({ length: 26 }, (_, i) => {
  const r = (k: string) => random(`s89-debris-${i}-${k}`);
  const colour = i % 3 === 0 ? INK : i % 3 === 1 ? PAPER : RED;
  const size = 0.05 + 0.14 * r("size");
  const n = 3 + Math.floor(r("n") * 2);
  const shape = Array.from({ length: n }, (_, k) => {
    const a = (k / n) * Math.PI * 2 + r(`a${k}`) * 0.9;
    const rr = 0.5 + 0.6 * r(`r${k}`);
    return { x: Math.cos(a) * rr, y: Math.sin(a) * rr };
  });
  return {
    colour,
    size,
    shape,
    // with the cars' speed, thrown up and out, some toward the camera
    vx: 9 + 12 * r("vx"),
    vy: 1 + 3.5 * r("vy"),
    vz: -3 + 5 * r("vz"),
    spin: (r("spin") - 0.5) * 1400,
  };
});
// Debris clock: crawls through the freeze (the picture hangs on the touch), then real time.
const debrisTime = (f: number) => {
  const d = f - HIT;
  return d < FREEZE_14
    ? (d * 0.08) / 60
    : (FREEZE_14 * 0.08 + d - FREEZE_14) / 60;
};
const debrisAt = (p: (typeof DEBRIS)[number], t: number) => {
  const y0 = 0.35;
  // flight until it lands, then it skids to a stop
  const land = (p.vy + Math.sqrt(p.vy * p.vy + 2 * 9.81 * y0)) / 9.81;
  const tf = Math.min(t, land);
  let x = CONTACT_14.x + p.vx * tf;
  let z = CONTACT_14.z + p.vz * tf;
  const y = Math.max(0, y0 + p.vy * tf - 4.9 * tf * tf);
  if (t > land) {
    const skid = 0.25 * (1 - Math.exp(-(t - land) / 0.25));
    x += p.vx * skid;
    z += p.vz * skid;
  }
  return { x, y, z, angle: p.spin * tf };
};

// SEN's broken front wing: the left half bent up and back where PRO's wheel came down on it, the nose tip crumpled
// (metres from the car's rear end, x forward, y up).
const BentWing: React.FC<{
  at: { x: number; y: number; pxPerMetre: number };
}> = ({ at }) => {
  const P = (x: number, y: number) => {
    const p = offsetFrom(at, x, y);
    return `${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
  };
  const w = Math.max(2, 0.012 * at.pxPerMetre);
  return (
    <g>
      {/* the bent half of the wing (all white on the 1989 car, ART-12), folded up behind the nose */}
      <path
        d={`M ${P(NOSE - 0.46, 0.17)} L ${P(NOSE - 0.1, 0.2)} L ${P(NOSE - 0.02, 0.5)} L ${P(NOSE - 0.3, 0.55)} Z`}
        fill={PAPER}
        stroke={INK}
        strokeWidth={w * 1.4}
        strokeLinejoin="round"
      />
      {/* torn root: a jagged black band where it snapped */}
      <path
        d={`M ${P(NOSE - 0.46, 0.17)} L ${P(NOSE - 0.39, 0.23)} L ${P(NOSE - 0.32, 0.17)} L ${P(NOSE - 0.24, 0.24)} L ${P(NOSE - 0.17, 0.17)} L ${P(NOSE - 0.1, 0.2)}`}
        fill="none"
        stroke={INK}
        strokeWidth={w * 2}
        strokeLinejoin="miter"
      />
      {/* the crumpled nose tip */}
      <path
        d={`M ${P(NOSE - 0.22, 0.06)} L ${P(NOSE - 0.1, 0.14)} L ${P(NOSE - 0.16, 0.2)} L ${P(NOSE + 0.01, 0.17)} L ${P(NOSE - 0.04, 0.08)} L ${P(NOSE + 0.02, 0.03)} Z`}
        fill={INK}
      />
    </g>
  );
};

// ── the easter-egg panel ─────────────────────────────────────────────────────────────────────────────────────
// Marshals of 1989: white overalls, light hoods (no faces, ART-5).
const MARSHAL: Outfit = {
  suit: "#ecebe6",
  suitShade: "#bdbcb6",
  seam: "#8a8984",
  stripe: RED,
  gloves: "#d8d7d2",
  boots: "#222222",
  head: { kind: "hood", color: "#d9d8d2" },
};

// Pushing: leaning hard into the car, arms out straight to the rear wing, legs driving.
const pushPose = (p: number): BodyPose => {
  const w = walkPose(p, 1.25, 30);
  return {
    ...w,
    head: -10,
    near: { ...w.near, arm: { shoulder: 80, elbow: 6 } },
    far: { ...w.far, arm: { shoulder: 74, elbow: 10 } },
  };
};

// The panel's own frame (EGG.w × EGG.h px), drawn through its own camera and scaled into the box on the page.
const EGG = { w: 1180, h: 1007 };
const EGG_CAM = pinhole({ f: 1450, horizon: 400, cx: EGG.w / 2, height: 1.5 });
const EGG_LAYOUT: TracksideLayout = {
  ...TRACKSIDE_DEFAULT,
  nearEdge: 6.6,
  farEdge: 15,
  rail: 17,
  fence: 18.5,
  stand: 60,
  standFrom: -60,
  standTo: 80,
};
const EGG_Z = 9.4; // SEN's centreline in the escape road
const FIRE = 0.85; // s into the panel: the Honda catches
// SEN's rear end, world x: pushed from a standstill up to a running pace, then away under power.
const eggX = (t: number) => {
  const x0 = -4.6;
  if (t < FIRE) return x0 + 1.2 * t + 1.6 * t * t;
  const vF = 1.2 + 3.2 * FIRE;
  const dt = t - FIRE;
  return x0 + 1.2 * FIRE + 1.6 * FIRE * FIRE + vF * dt + 0.5 * 6.5 * dt * dt;
};
// the camera follows the push, then lets him go off to the right
const eggCam = (t: number) => {
  const follow = (x: number) => x + MID_WHEELBASE + 0.6;
  if (t < FIRE) return follow(eggX(t));
  return follow(eggX(FIRE)) + 2.6 * (t - FIRE);
};
// Bollards: two gates across the escape road (one post either side of his path).
const GATES = [0.9, 6.2];
const BOLLARD_Z = [EGG_Z - 1.75, EGG_Z + 1.75];

const Bollard: React.FC<{ cam: Camera; x: number; z: number }> = ({
  cam,
  x,
  z,
}) => {
  const p = cam.anchor({ x, z });
  const w = 0.24 * p.pxPerMetre;
  const h = 1.0 * p.pxPerMetre;
  return (
    <g>
      <ellipse
        cx={p.x}
        cy={p.y}
        rx={w * 1.3}
        ry={w * 0.32}
        fill={INK}
        opacity={0.35}
      />
      {[0, 1, 2, 3].map((k) => (
        <rect
          key={k}
          x={p.x - w / 2}
          y={p.y - h + (k * h) / 4}
          width={w}
          height={h / 4}
          fill={k % 2 ? PAPER : INK}
          stroke={INK}
          strokeWidth={2}
        />
      ))}
      <rect
        x={p.x - w * 0.8}
        y={p.y - 0.06 * p.pxPerMetre}
        width={w * 1.6}
        height={0.06 * p.pxPerMetre}
        fill={INK}
      />
    </g>
  );
};

const PushPanel: React.FC<{ t: number }> = ({ t }) => {
  const cam = EGG_CAM;
  const camX = eggCam(t);
  const x = eggX(t);
  const fired = t >= FIRE;
  const sinceFire = Math.max(0, t - FIRE);
  const carA = cam.anchor({ x: x - camX, z: EGG_Z });
  const speed = fired ? 1.2 + 3.2 * FIRE + 6.5 * sinceFire : 1.2 + 3.2 * t;
  // the marshals push at the rear wing until the engine fires, then run on a step or two and stop
  const xFire = eggX(FIRE);
  const marshalX = (dx: number) =>
    (fired ? xFire + 1.3 * 0.35 * (1 - Math.exp(-sinceFire / 0.35)) : x) + dx;
  const marshals = [
    { dx: -0.72, z: EGG_Z - 0.55, ph: 0 },
    { dx: -0.78, z: EGG_Z + 0.5, ph: 0.5 },
  ];
  const marshalPose = (ph: number) =>
    fired
      ? walkPose(0.15 + ph * 0.2, 0.4 * Math.exp(-sinceFire / 0.3), 6)
      : pushPose(t * 1.9 + ph);
  const exhaust = offsetFrom(carA, 0.05, 0.42);
  // PRO's car, abandoned where the pair stopped (Prost got out, facts.md): beyond SEN, on the track side
  const proRear = { x: -5.4 - camX, z: EGG_Z + 4 };
  const marshal = (m: (typeof marshals)[number]) => {
    const p = cam.anchor({ x: marshalX(m.dx) - camX, z: m.z });
    return (
      <Figure
        key={m.z}
        at={p}
        pxPerMetre={p.pxPerMetre}
        pose={marshalPose(m.ph)}
        outfit={MARSHAL}
        facing="right"
      />
    );
  };
  return (
    <g>
      <Sky cam={cam} camX={camX} layout={EGG_LAYOUT} />
      <Hills cam={cam} camX={camX} layout={EGG_LAYOUT} />
      <Grandstand cam={cam} camX={camX} layout={EGG_LAYOUT} />
      <Barriers cam={cam} camX={camX} layout={EGG_LAYOUT} />
      <RoadFlow
        cam={cam}
        camX={camX}
        speed={0}
        nearEdge={EGG_LAYOUT.nearEdge}
        farEdge={EGG_LAYOUT.farEdge}
      />
      <Foreground
        cam={cam}
        camX={camX}
        nearEdge={EGG_LAYOUT.nearEdge}
        farEdge={EGG_LAYOUT.farEdge}
      />
      <YawedCar
        cam={cam}
        car={MP4_5_PRO}
        rear={proRear}
        yaw={PRO_YAW_14}
        state={{ driver: false, lockFront: 20 }}
      />
      {GATES.map((g) => (
        <Bollard key={`far-${g}`} cam={cam} x={g - camX} z={BOLLARD_Z[1]} />
      ))}
      {marshal(marshals[1])}
      {fired ? (
        <path
          d={speedLines({
            x: carA.x - 520,
            y: carA.y - 0.9 * carA.pxPerMetre,
            w: 480,
            h: 0.85 * carA.pxPerMetre,
            n: 10,
            seed: `egg-${Math.floor(t * 20)}`,
            thickness: 5,
          })}
          fill={INK}
          opacity={Math.min(1, sinceFire * 3)}
        />
      ) : null}
      <MangaCar
        car={MP4_5_SEN}
        at={carA}
        state={{ wheelAngle: (x / 0.33) * 57.3, tilt: fired ? 0.8 : 0 }}
      />
      <BentWing at={carA} />
      {fired
        ? Array.from({ length: 6 }, (_, i) => {
            const age = sinceFire - i * 0.05;
            if (age < 0) return null;
            const r = (14 + 60 * age) * (1 + i * 0.12);
            return (
              <Puff
                key={i}
                x={exhaust.x - 30 - age * 260 - i * 18}
                y={exhaust.y - age * 70 - (i % 2) * 14}
                r={r}
                o={Math.max(0, 0.95 - age * 1.1)}
              />
            );
          })
        : null}
      {marshal(marshals[0])}
      {GATES.map((g) => (
        <Bollard key={`near-${g}`} cam={cam} x={g - camX} z={BOLLARD_Z[0]} />
      ))}
      {fired ? (
        <g
          transform={`translate(${EGG.w - 440} 290) scale(${0.6 + 0.4 * Math.min(1, sinceFire * 6)})`}
        >
          <Sfx x={0} y={0} size={210} rotate={-8}>
            轰！
          </Sfx>
        </g>
      ) : null}
      {/* the push: a manga motion arrow behind the marshals while they shove */}
      {speed > 0 && !fired ? (
        <path
          d={speedLines({
            x: carA.x - 2.2 * carA.pxPerMetre,
            y: carA.y - 1.6 * carA.pxPerMetre,
            w: 1.1 * carA.pxPerMetre,
            h: 1.2 * carA.pxPerMetre,
            n: 6,
            seed: `push-${Math.floor(t * 12)}`,
            thickness: 4,
          })}
          fill={INK}
          opacity={0.5}
        />
      ) : null}
    </g>
  );
};

// ── the main panel ───────────────────────────────────────────────────────────────────────────────────────────
export const Crash: React.FC<PictureProps> = ({ f }) => {
  const shot = shotById("1.4");
  const d = f - HIT;
  const camX = slide14(f);
  const speed = slideSpeed14(f);
  const ts = slideTime14(f);
  const freeze = d < FREEZE_14;
  // SEN's and PRO's rear ends relative to the camera (the pair holds the frame while the camera pans with it)
  const senRear: Plan = { x: SEN_MID_14 - MID_WHEELBASE, z: Z_SEN_14 };
  const proMid: Plan = { x: SEN_MID_14 + PRO_AHEAD_14, z: Z_PRO_14 };
  const proRear = yawedPoint(proMid, PRO_YAW_14, -MID_WHEELBASE);
  const senA = CAM.anchor({ x: senRear.x, z: senRear.z });
  const contact = CAM.project({ x: CONTACT_14.x, y: 0.3, z: CONTACT_14.z });
  // after the freeze the frame shakes out
  const shake = freeze ? 0 : 12 * Math.exp(-(d - FREEZE_14) / 10);
  const sx = shake * Math.sin(d * 2.7);
  const sy = shake * Math.cos(d * 2.1);
  const tilt = freeze ? -3 : -3 * (1 - ramp(d, FREEZE_14, FREEZE_14 + 50));
  const star = ramp(d, 0, 8, Easing.out(Easing.cubic));
  const starFade = 1 - ramp(d, FREEZE_14 + 6, FREEZE_14 + 30);
  const sfx = ramp(d, 0, 6, Easing.out(Easing.back(2.5)));
  // from 20.1 the page splits: the stopped pair on the left, the push-start on the right
  const page = ramp(f, PUSH, PUSH + 16, Easing.out(Easing.cubic));
  const PANEL = { x: 1060, y: 190, w: 820, h: 700 };
  const K = PANEL.w / EGG.w;
  const leftW = 1920 - (1920 - (PANEL.x - 26)) * page;
  // the main picture shrinks into the left panel, framing both cars
  const S = 1;
  const pageTx = -330 * page;
  // wheels in world terms for the smoke and the black marks (rear-end relative to the camera at slide 0)
  const senWheel = (axle: number) => (): Plan => ({
    x: senRear.x + axle,
    z: Z_SEN_14,
  });
  const proWheel = (axle: number) => (): Plan =>
    yawedPoint(proRear, PRO_YAW_14, axle);
  const puffsNear = [
    ...smokeAt(senWheel(FRONT_AXLE), ts, camX, "sf"),
    ...smokeAt(senWheel(REAR_AXLE), ts, camX, "sr"),
  ];
  const puffsFar = [
    ...smokeAt(proWheel(FRONT_AXLE), ts, camX, "pf"),
    ...smokeAt(proWheel(REAR_AXLE), ts, camX, "pr"),
  ];
  // black marks: from where the slide began to where each wheel is now, on the ground at its depth
  const mark = (w: Plan, width: number) => {
    const a = CAM.project({ x: w.x - camX, z: w.z });
    const b = CAM.project({ x: w.x, z: w.z });
    return (
      <path
        key={`${w.x}-${w.z}`}
        d={`M ${a.x.toFixed(1)} ${a.y.toFixed(1)} L ${b.x.toFixed(1)} ${b.y.toFixed(1)}`}
        stroke={INK}
        strokeWidth={width * CAM.pxPerMetre(w.z)}
        strokeLinecap="round"
        opacity={0.55}
      />
    );
  };
  const tDeb = debrisTime(f);
  const pieces = DEBRIS.map((p, i) => ({ p, i, s: debrisAt(p, tDeb) }));
  const piece = ({ p, i, s }: (typeof pieces)[number]) => {
    const q = CAM.project({ x: s.x - camX, y: s.y, z: s.z });
    const k = p.size * CAM.pxPerMetre(s.z);
    const pts = p.shape
      .map((v) => `${(q.x + v.x * k).toFixed(1)} ${(q.y + v.y * k).toFixed(1)}`)
      .join(" L ");
    return (
      <path
        key={`deb-${i}`}
        d={`M ${pts} Z`}
        fill={p.colour}
        stroke={INK}
        strokeWidth={2}
        transform={`rotate(${s.angle.toFixed(1)} ${q.x.toFixed(1)} ${q.y.toFixed(1)})`}
      />
    );
  };
  const contactBurst = 1 - ramp(d, FREEZE_14, FREEZE_14 + 40);
  return (
    <svg viewBox="0 0 1920 1080" width={1920} height={1080}>
      <defs>
        <ToneDefs />
        <InkFilterDef />
        <clipPath id="s14-panel">
          <rect x={PANEL.x} y={PANEL.y} width={PANEL.w} height={PANEL.h} />
        </clipPath>
        <clipPath id="s14-main">
          <rect x={0} y={0} width={leftW} height={1080} />
        </clipPath>
      </defs>
      <rect width={1920} height={1080} fill={PAPER} />
      <g filter={inkFilter()}>
        <g clipPath="url(#s14-main)">
          <g
            transform={`translate(${pageTx} ${(1 - S) * 540 * page}) scale(${S})`}
          >
            <g transform={`translate(${sx} ${sy}) rotate(${tilt} 960 540)`}>
              <Sky cam={CAM} camX={camX} layout={LAYOUT} />
              <Hills cam={CAM} camX={camX} layout={LAYOUT} />
              <Grandstand cam={CAM} camX={camX} layout={LAYOUT} />
              <Barriers cam={CAM} camX={camX} layout={LAYOUT} />
              <FarVerge
                cam={CAM}
                camX={camX + 6}
                speed={speed}
                z={LAYOUT.farEdge + 1.4}
              />
              <RoadFlow
                cam={CAM}
                camX={camX}
                speed={speed}
                nearEdge={LAYOUT.nearEdge}
                farEdge={LAYOUT.farEdge}
              />
              <Foreground
                cam={CAM}
                camX={camX}
                nearEdge={LAYOUT.nearEdge}
                farEdge={LAYOUT.farEdge}
              />
              {/* black marks of the locked wheels, from the hit to now */}
              {camX > 0.05 ? (
                <g>
                  {mark(proWheel(FRONT_AXLE)(), 0.12)}
                  {mark(proWheel(REAR_AXLE)(), 0.12)}
                  {mark(senWheel(FRONT_AXLE)(), 0.14)}
                  {mark(senWheel(REAR_AXLE)(), 0.14)}
                </g>
              ) : null}
              {freeze ? (
                <path
                  d={focusLines(contact.x, contact.y, 240, 130, 11)}
                  fill={INK}
                />
              ) : null}
              <Cloud puffs={puffsFar} />
              {/* PRO beyond, turned in across SEN's nose (yawed toward the camera) */}
              <YawedCar
                cam={CAM}
                car={MP4_5_PRO}
                rear={proRear}
                yaw={PRO_YAW_14}
                state={{ lockFront: 20, wheelAngle: 20 }}
              />
              {pieces.filter(({ s }) => s.z > Z_SEN_14 + 1.1).map(piece)}
              {/* SEN's smoke rises behind his own body and trails out behind the car */}
              <Cloud puffs={puffsNear} />
              <MangaCar
                car={MP4_5_SEN}
                at={senA}
                state={{
                  lockFront: 40,
                  wheelAngle: 40,
                  tilt: freeze ? -1.5 : -1.5 * (1 - ramp(ts, 0, 1.2)),
                }}
              />
              <BentWing at={senA} />
              {pieces.filter(({ s }) => s.z <= Z_SEN_14 + 1.1).map(piece)}
              {/* dust burst at the contact while the picture hangs */}
              {contactBurst > 0 ? (
                <Cloud
                  puffs={[0, 1, 2, 3, 4].map((k) => ({
                    x: contact.x + (k - 2) * 34,
                    y: contact.y + 24 - (k % 2) * 20,
                    r: 24 + 10 * (k % 3) + 50 * (1 - contactBurst),
                    o: Math.min(1, contactBurst * 2),
                  }))}
                />
              ) : null}
              {star * starFade > 0 ? (
                <g opacity={starFade}>
                  <ImpactStar
                    x={contact.x}
                    y={contact.y - 20}
                    r={150}
                    seed="suzuka89"
                    t={star}
                  />
                </g>
              ) : null}
            </g>
            {sfx > 0 ? (
              <g
                opacity={1 - page}
                transform={`translate(330 300) scale(${0.6 + 0.4 * sfx})`}
              >
                <Sfx x={0} y={0} size={230} rotate={-12}>
                  {shot.text[0]}
                </Sfx>
              </g>
            ) : null}
          </g>
        </g>
        <rect
          x={0}
          y={0}
          width={leftW}
          height={1080}
          fill="none"
          stroke={INK}
          strokeWidth={18}
        />
        {page > 0 ? (
          <g transform={`translate(${(1 - page) * 960} 0)`}>
            <rect
              x={PANEL.x + 14}
              y={PANEL.y + 14}
              width={PANEL.w}
              height={PANEL.h}
              fill={INK}
            />
            <g clipPath="url(#s14-panel)">
              <rect
                x={PANEL.x}
                y={PANEL.y}
                width={PANEL.w}
                height={PANEL.h}
                fill={PAPER}
              />
              <g
                transform={`translate(${PANEL.x + PANEL.w / 2 - (K * EGG.w) / 2} ${PANEL.y}) scale(${K})`}
              >
                <PushPanel t={(f - PUSH) / 60} />
              </g>
            </g>
            <rect
              x={PANEL.x}
              y={PANEL.y}
              width={PANEL.w}
              height={PANEL.h}
              fill="none"
              stroke={INK}
              strokeWidth={10}
            />
          </g>
        ) : null}
      </g>
    </svg>
  );
};
