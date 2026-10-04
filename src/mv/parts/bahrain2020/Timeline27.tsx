// Shot 3.5 (bars 66–69): the 27 seconds in four panels, one more on each bar's first beat — four different moments,
// not four looks at the helmet (facts.md, FIA accident investigation summary):
//   0 秒   the halo has prised the barrier open: the cell wedged under the top rail, the fire catching;
//   11 秒  the FIA medical car brakes in hard and stops, the doctor out and running for the fire;
//   (no time: not verified) a marshal turns a dry-powder extinguisher on the cockpit;
//   27 秒  a gloved hand comes out of the fire and grabs the top rail.
// People from the shared people module (src/kit/figure, ART-16), no faces (ART-5). Each panel has a small time label in
// a corner the subject is not in (ART-14).
import { GRO_2020, VF20 } from "../../../cars";
import { pinhole, type Camera } from "../../../kit/camera";
import { INK, PAPER } from "../../../kit/colors";
import {
  DOCTOR,
  Figure,
  MARSHAL,
  driverOutfit,
  flatFoot,
  gaitDistance,
  nozzleOf,
  solve,
  spray,
  v,
  walk,
  type Outfit,
  type Pose,
} from "../../../kit/figure";
import {
  FIRE_PALETTES,
  type FirePaletteName,
} from "../../../kit/fire";
import { CAPTION_FONT } from "../../../kit/lettering";
import { random } from "remotion";
import { ToneDefs } from "../../../kit/tone";
import { bump, type Deflection } from "./bent-rail";
import { cueFrame, ramp, type PictureProps } from "./common";
import { MedicalCar } from "./MedicalCar";
import { RAILS } from "./night";
import { PowderBillow } from "./powder";
import { FACTS } from "./shots.ts";
import {
  RUN,
  Vignette,
  WRECK_BEND,
  WRECK_CAM,
  WreckWorld,
  heartbeat,
  zoomCam,
} from "./Wreck";
import { BARRIER_Z, CELL_Z, HALO_WORLD } from "./wreck-geometry.ts";

type Rect = { x: number; y: number; w: number; h: number };

// The page with 1, 2, 3 and 4 panels on it: every layout fills the frame.
const LAYOUTS: Rect[][] = [
  [{ x: 0, y: 0, w: 1920, h: 1080 }],
  [
    { x: 40, y: 40, w: 1100, h: 1000 },
    { x: 1164, y: 40, w: 716, h: 1000 },
  ],
  [
    { x: 40, y: 40, w: 1100, h: 480 },
    { x: 1164, y: 40, w: 716, h: 1000 },
    { x: 40, y: 544, w: 1100, h: 496 },
  ],
  [
    { x: 40, y: 40, w: 1100, h: 480 },
    { x: 1164, y: 40, w: 716, h: 480 },
    { x: 40, y: 544, w: 716, h: 496 },
    { x: 780, y: 544, w: 1100, h: 496 },
  ],
];
const lerpRect = (a: Rect, b: Rect, u: number): Rect => ({
  x: a.x + (b.x - a.x) * u,
  y: a.y + (b.y - a.y) * u,
  w: a.w + (b.w - a.w) * u,
  h: a.h + (b.h - a.h) * u,
});
// Panel i's rectangle at frame f: on each cue the new panel lands in its place in the next layout (drawn on top) and
// the panels already on the page slide into that layout over 10 frames, so the frame never has a hole.
const panelRect = (i: number, f: number, cues: number[]): Rect => {
  const k = cues.filter((c) => f >= c).length;
  const target = LAYOUTS[k - 1][i];
  if (k < 2 || i === k - 1) return target;
  return lerpRect(
    LAYOUTS[k - 2][i],
    target,
    ramp(f, cues[k - 1], cues[k - 1] + 10),
  );
};

// The wreck camera zoomed so that `across` metres at the target's depth fill the panel's width, the target landing at
// (fx, fy) of the panel.
const fitCam = (
  target: { x: number; y: number; z: number },
  across: number,
  r: Rect,
  fx = 0.5,
  fy = 0.5,
): Camera =>
  zoomCam(WRECK_CAM, target, r.w / across / WRECK_CAM.pxPerMetre(target.z), {
    x: r.x + r.w * fx,
    y: r.y + r.h * fy,
  });

// The small time label in a panel corner.
const TimeLabel: React.FC<{
  r: Rect;
  corner: "tl" | "tr";
  children: string;
}> = ({ r, corner, children }) => {
  const w = 34 * children.length + 40;
  const x = corner === "tl" ? r.x + 18 : r.x + r.w - 18 - w;
  return (
    <g>
      <rect
        x={x}
        y={r.y + 18}
        width={w}
        height={64}
        fill={PAPER}
        stroke={INK}
        strokeWidth={4}
      />
      <text
        x={x + w / 2}
        y={r.y + 64}
        textAnchor="middle"
        fontFamily={CAPTION_FONT}
        fontSize={42}
        fill={INK}
      >
        {children}
      </text>
    </g>
  );
};

const S_HALO = HALO_WORLD.x - RUN.a.x;
// 0 s: the halo has pushed the top rail up and back — the rail rides on the halo, the cell wedged under it.
const PRY_BEND: Deflection = (s, rail) => {
  if (rail === 2) {
    const k = bump(s, S_HALO - 0.15, 1.3);
    return { dx: 0, dy: 0.2 * k, dz: 1.0 * k };
  }
  return WRECK_BEND(s, rail);
};

type PanelProps = {
  r: Rect;
  f: number;
  age: number;
  palette: FirePaletteName;
};

// 0 秒: the cell in the barrier, the top rail riding on the halo; the fire just catching; sparks off the rail.
const PanelPry: React.FC<PanelProps> = ({ r, f, age, palette }) => {
  const cam = fitCam(
    { x: HALO_WORLD.x + 0.1, y: HALO_WORLD.y + 0.1, z: HALO_WORLD.z },
    3.4,
    r,
    0.55,
    0.5,
  );
  const touch = cam.project({
    x: HALO_WORLD.x - 0.15,
    y: HALO_WORLD.y + 0.18,
    z: HALO_WORLD.z,
  });
  const ppm = cam.pxPerMetre(HALO_WORLD.z);
  const sparks = Array.from({ length: 14 }, (_, i) => {
    const a0 = (i * 11) % 30;
    const a = (age + a0) % 30;
    const ang = -Math.PI * (0.15 + ((i * 0.37) % 1) * 0.7);
    const sp = (0.03 + ((i * 3) % 5) * 0.008) * ppm;
    const P = (k: number) => ({
      x: touch.x + Math.cos(ang) * sp * k,
      y: touch.y + Math.sin(ang) * sp * k + 0.0009 * ppm * k * k,
    });
    return { a: P(Math.max(0, a - 3)), b: P(a), op: 1 - a / 30 };
  });
  return (
    <g>
      <WreckWorld
        cam={cam}
        f={f}
        fireSeed="t0"
        palette={palette}
        intensity={0.4 + 0.3 * ramp(age, 0, 200)}
        noGlow
        fireDetail={2}
        bend={PRY_BEND}
        tonePrefix="b35"
      />
      {sparks.map((s, i) => (
        <g key={i} opacity={s.op}>
          <path
            d={`M ${s.a.x} ${s.a.y} L ${s.b.x} ${s.b.y}`}
            stroke={INK}
            strokeWidth={6}
            strokeLinecap="round"
          />
          <path
            d={`M ${s.a.x} ${s.a.y} L ${s.b.x} ${s.b.y}`}
            stroke="#fff1b8"
            strokeWidth={3.5}
            strokeLinecap="round"
          />
        </g>
      ))}
      <TimeLabel r={r} corner="tl">
        0 秒
      </TimeLabel>
    </g>
  );
};

// 11 秒: the medical car comes in fast and brakes hard to a stop in front of the burning wreck — speed lines, the nose
// dipping under braking and bobbing back up as it stops, tyre smoke; the doctor gets out and runs for the fire.
const MED_Z = 8.4;
const MED_STOP = 1.0; // world x of its front bumper when it stops
const MED_RUNIN = 64; // frames from the panel landing to the stop
// the medical car's tyre contact patches, metres from its front bumper (MedicalCar.tsx: axles at 0.95 and 3.79 m
// from the rear of a 4.75 m car)
const FRONT_TYRE_X = 4.75 - 3.79;
const REAR_TYRE_X = 4.75 - 0.95;
const MED_BRAKE_D = 11; // metres it travels under braking in the panel (from ~74 km/h)
const PanelMedical: React.FC<PanelProps> = ({ r, f, age, palette }) => {
  const cam = fitCam({ x: 1.9, y: 1.0, z: MED_Z }, 7.2, r, 0.5, 0.5);
  const u = Math.min(1, age / MED_RUNIN);
  // constant deceleration to rest: distance left goes as (1 - u)², speed as (1 - u)
  const dist = MED_BRAKE_D * (1 - u) * (1 - u);
  const speed = 1 - u; // of the entry speed
  const front = MED_STOP + dist;
  const wheelAngle = -((MED_BRAKE_D - dist) / (2 * Math.PI * 0.34)) * 360;
  const after = Math.max(0, age - MED_RUNIN);
  // the nose dives as the brakes bite (over the first few frames), stays down, and rocks back past level at the stop
  const pitch =
    u < 1
      ? -2.6 * Math.min(1, age / 6)
      : -2.6 * Math.exp(-after / 7) * Math.cos(after / 3.2);
  const medAt = cam.anchor({ x: front + 4.75, z: MED_Z });
  const mppm = medAt.pxPerMetre;
  // the doctor: out of the near side once it has stopped, running left toward the fire
  const OUT = MED_RUNIN + 12;
  const runT = Math.max(0, age - OUT) / 60;
  const d = gaitDistance(runT, 3.2, { stride: 1.0 });
  const docAt = { x: MED_STOP + 1.6 - d, z: MED_Z - 1.3 };
  const doctor =
    age >= OUT ? (
      <Figure
        at={cam.project({ x: docAt.x, y: 0, z: docAt.z })}
        pxPerMetre={cam.pxPerMetre(docAt.z)}
        pose={walk(d, { stride: 1.0, lean: 16, armSwing: 30, elbows: 50 })}
        outfit={DOCTOR}
        facing="left"
        rim={FIRE_PALETTES[palette].glow ? "#ffb347" : null}
        rimSide="left"
      />
    ) : null;
  // speed: streaks across the panel behind and round the car (redrawn on twos), and long trails off its tail and
  // roof, all thinning out as it slows
  const tick = Math.floor(age / 2);
  const streaks =
    speed > 0.05
      ? Array.from({ length: 16 }, (_, i) => {
          const R = (k: string) => random(`b35-ms${k}${i}-${tick}`);
          const y = medAt.y - (0.05 + R("y") * 1.6) * mppm;
          const x0 = medAt.x - 4.75 * mppm * R("x") * 0.9;
          const len = speed * (160 + R("l") * 360);
          return (
            <path
              key={`s${i}`}
              d={`M ${x0} ${y} L ${x0 + len} ${y}`}
              stroke={i % 3 ? INK : PAPER}
              strokeWidth={i % 3 ? 3 : 5}
              strokeLinecap="round"
              opacity={0.75 * Math.min(1, speed * 2)}
            />
          );
        })
      : null;
  const trails =
    speed > 0.05
      ? [0.35, 0.8, 1.2, 1.38].map((h, i) => {
          const y = medAt.y - h * mppm;
          const len = speed * (260 + i * 70);
          return (
            <path
              key={`t${i}`}
              d={`M ${medAt.x + 6} ${y} L ${medAt.x + 6 + len} ${y}`}
              stroke={PAPER}
              strokeWidth={4}
              strokeLinecap="round"
              opacity={0.85 * speed}
            />
          );
        })
      : null;
  // the tyres biting: bubble tyre smoke (round ink-edged puffs, the part's smoke style) left behind each wheel while
  // it brakes hard — each puff stays where it was laid, swelling and fading as it ages
  const smoke =
    age > 4
      ? [FRONT_TYRE_X, REAR_TYRE_X].flatMap((wx, k) =>
          Array.from({ length: 10 }, (_, j) => {
            const born = Math.min(MED_RUNIN, age) - j * 4;
            if (born < 4) return null;
            const a = (age - born) / 40; // 0..
            if (a > 1) return null;
            const bu = born / MED_RUNIN;
            const sp = 1 - bu;
            if (sp < 0.12) return null;
            const laidX =
              MED_STOP + MED_BRAKE_D * (1 - bu) * (1 - bu) + wx + 0.15;
            const c = cam.project({
              x: laidX + 0.5 * a,
              y: 0.12 + 0.35 * a,
              z: MED_Z,
            });
            return (
              <circle
                key={`m${k}-${j}`}
                cx={c.x}
                cy={c.y}
                r={(0.14 + 0.38 * a) * mppm * (0.6 + 0.4 * sp)}
                fill={PAPER}
                stroke={INK}
                strokeWidth={2.5}
                opacity={(k ? 0.5 : 0.85) * (1 - a) * Math.min(1, sp * 2.5)}
              />
            );
          }),
        )
      : null;
  return (
    <g>
      <WreckWorld
        cam={cam}
        f={f}
        fireSeed="t11"
        palette={palette}
        intensity={1}
        noGlow
        tonePrefix="b35"
      />
      {streaks}
      {trails}
      {smoke}
      <MedicalCar
        at={medAt}
        wheelAngle={wheelAngle}
        pitch={pitch}
        tonePrefix="b35"
      />
      {doctor}
      <TimeLabel r={r} corner="tr">
        {`${FACTS.medicalCarSeconds} 秒`}
      </TimeLabel>
    </g>
  );
};

// A marshal turns a dry-powder extinguisher on the cockpit. The time is not in the FIA summary or any source found,
// so this panel carries no seconds label (facts.md).
const MARSHAL_AT = { x: HALO_WORLD.x + 2.05, z: BARRIER_Z - 0.75 };
const COCKPIT = { x: HALO_WORLD.x + 0.35, y: 0.75, z: HALO_WORLD.z - 0.3 };
const PanelExtinguisher: React.FC<PanelProps> = ({ r, f, age, palette }) => {
  const cam = fitCam(
    { x: HALO_WORLD.x + 1.1, y: 1.0, z: BARRIER_Z - 0.3 },
    4.4,
    r,
    0.5,
    0.55,
  );
  const step = Math.floor(age / 3) * 3; // on threes, like everyone
  const pose = spray(step / 60);
  // the nozzle points at the cockpit: figure frame (facing left: forward is -x in the world)
  const tipF = nozzleOf(pose).tip;
  const aim = v(MARSHAL_AT.x - tipF.x - COCKPIT.x, COCKPIT.y - tipF.y);
  const reach = Math.hypot(aim.x, aim.y);
  const at = cam.project({ x: MARSHAL_AT.x, y: 0, z: MARSHAL_AT.z });
  const ppm = cam.pxPerMetre(MARSHAL_AT.z);
  const cock = cam.project(COCKPIT);
  return (
    <g>
      <WreckWorld
        cam={cam}
        f={f}
        fireSeed="tx"
        palette={palette}
        intensity={0.9}
        noGlow
        fireDetail={1.5}
        tonePrefix="b35"
      />
      <PowderBillow x={cock.x} y={cock.y} ppm={ppm} frame={f} />
      <Figure
        at={at}
        pxPerMetre={ppm}
        pose={pose}
        outfit={MARSHAL}
        facing="left"
        held={{
          kind: "extinguisher",
          spray: (reach / 1.05) * ramp(age, 0, 6),
          aim,
        }}
        rim={FIRE_PALETTES[palette].glow ? "#ffb347" : PAPER}
        rimSide="left"
      />
    </g>
  );
};

// 27 秒: GRO's gloved hand comes up out of the cockpit and takes hold of the top rail. The geometry of the moment
// (facts.md, FIA summary): the cell went through the barrier and is wedged between the rails, the top rail riding over
// the halo, which pushed it up. So, from a marshal's eye height: the cell with its halo behind the barrier; the top
// rail bent up and back so it lies over the halo's hoop, in front of it (drawn after the cell, its lower edge resting
// on the hoop's top); GRO's left arm rising out of the cockpit opening, in front of the halo's near bar (he comes out
// over the side), behind the top rail, the glove closing over its top edge with the fingers curled over the near face.
const GRO_KIT: Outfit = driverOutfit(GRO_2020.helmet, "#1f1f23", {
  band: "#8d9099",
  gloves: "#4a4a52",
  boots: "#141416",
});
// the halo hoop's top (the far bar's highest point on the trace, photo y 490, 0.1 m ahead of HALO_WORLD's point; the
// same 0.12 m drop as HALO_WORLD for the pitched cell)
const PPM_PHOTO = 250 / VF20.frame.k;
const HALO_TOP = {
  x: HALO_WORLD.x - (880 - 852) / PPM_PHOTO,
  y: (VF20.frame.ground - 490) / PPM_PHOTO - 0.12,
  z: CELL_Z,
};
const RAIL_HALO_Z = BARRIER_Z + 0.55; // the top rail pushed back onto the cell over the cockpit
const ARM_Z = BARRIER_Z + 0.8; // GRO's left side, just outside the cell's near bar, behind the rail
const SHOULDER = { x: HALO_WORLD.x + 0.36, y: 1.06, z: ARM_Z }; // half up out of the seat, under the hoop
const COCKPIT_RIM = 0.82; // the cockpit opening's edge (height, at the cell)
// a body only for its near arm: standing, so the shoulder (figure frame) does not depend on where the hand goes
const armPose = (hand: { x: number; y: number }): Pose => ({
  hip: v(0, 0.92),
  pelvis: 6,
  chest: 6,
  feet: { near: flatFoot(0.1), far: flatFoot(-0.1) },
  arms: {
    near: { hand, grip: "hold", wrist: -50, elbowOut: -1 },
    far: { shoulder: 10, elbow: 20 },
  },
});
const SHOULDER_FIG = solve(armPose(v(0.3, 1.2))).shoulder;
const PanelHand: React.FC<PanelProps> = ({ r, f, age, palette }) => {
  // a standing marshal's eye, 1.6 m up, framing ~2.4 m of the barrier round the cockpit
  const z0 = ARM_Z;
  const fpx = (r.w / 2.4) * z0;
  const aimAt = { x: HALO_WORLD.x + 0.2, y: 1.22 };
  const cam = pinhole({
    f: fpx,
    height: 1.6,
    cx: r.x + r.w * 0.5 - (fpx * aimAt.x) / z0,
    horizon: r.y + r.h * 0.5 - (fpx * (1.6 - aimAt.y)) / z0,
  });
  const fire = FIRE_PALETTES[palette];
  // the top rail over the halo: pushed back to RAIL_HALO_Z and lifted so its lower edge lands on the hoop's top
  // (overlapping it by 1 cm, so the rail reads as lying on it, in front)
  const hoopY = cam.screenY(HALO_TOP.y, HALO_TOP.z);
  const railBottomY = hoopY - 0.01 * cam.pxPerMetre(RAIL_HALO_Z);
  const lift =
    cam.height -
    ((railBottomY - cam.horizon) * RAIL_HALO_Z) / cam.f -
    RAILS[2][0];
  const sHalo = HALO_TOP.x + 0.25 - RUN.a.x;
  const bend: Deflection = (s, rail) => {
    if (rail === 2) {
      const k = bump(s, sHalo, 1.5);
      return { dx: 0, dy: lift * k, dz: (RAIL_HALO_Z - BARRIER_Z) * k };
    }
    return WRECK_BEND(s, rail);
  };
  // where the glove holds: the rail's top edge above the cockpit, a little behind the hoop's top
  const gripX = HALO_TOP.x + 0.08;
  const sGrip = gripX - RUN.a.x;
  const railTop = cam.project({
    x: gripX,
    y: RAILS[2][1] + bend(sGrip, 2).dy,
    z: BARRIER_Z + bend(sGrip, 2).dz,
  });
  // GRO's figure frame at the arm's depth (facing left: forward is screen left)
  const ppm = cam.pxPerMetre(ARM_Z);
  const sh = cam.project(SHOULDER);
  const base = { x: sh.x + SHOULDER_FIG.x * ppm, y: sh.y + SHOULDER_FIG.y * ppm };
  const fig = (p: { x: number; y: number }) => v((base.x - p.x) / ppm, (base.y - p.y) / ppm);
  // the hand comes up out of the cockpit over the first frames and closes on the rail: the wrist just behind and
  // above the top edge, so the back of the glove shows over it
  const grab = ramp(age, 0, 16, (x) => 1 - (1 - x) * (1 - x));
  const holdAt = { x: railTop.x + 0.04 * ppm, y: railTop.y - 0.04 * ppm };
  const startAt = { x: sh.x - 0.12 * ppm, y: sh.y - 0.05 * ppm };
  const hand = fig({
    x: startAt.x + (holdAt.x - startAt.x) * grab,
    y: startAt.y + (holdAt.y - startAt.y) * grab,
  });
  const pose = armPose(hand);
  const gripped = grab > 0.92;
  if (!gripped) pose.arms.near.grip = "open";
  const rimY = cam.screenY(COCKPIT_RIM, CELL_Z);
  const rim = fire.glow ? "#ffb347" : PAPER;
  // the fingers over the rail's near face, curled down from its top edge (drawn in front of the rail)
  const fingerW = 0.021 * ppm;
  // (placed from the solved wrist, so they stay on the glove: the knuckles ahead of it, over the edge)
  const wrist = solve(pose).arms.near.wrist;
  const wristX = base.x - wrist.x * ppm;
  const fingers = gripped
    ? [0, 1, 2, 3].map((i) => {
        const x = wristX - 0.115 * ppm + i * (fingerW * 1.05);
        const len = (0.034 + (i === 1 || i === 2 ? 0.006 : 0)) * ppm;
        return (
          <rect
            key={i}
            x={x}
            y={railTop.y - 0.012 * ppm}
            width={fingerW}
            height={len}
            rx={fingerW / 2}
            fill={GRO_KIT.gloves}
            stroke={INK}
            strokeWidth={Math.max(2, ppm * 0.006)}
          />
        );
      })
    : null;
  return (
    <g>
      <defs>
        {/* the arm shows only above the cockpit opening (the rest of him is still inside the cell) */}
        <clipPath id="b35-arm">
          <rect x={r.x} y={r.y} width={r.w} height={Math.max(0, rimY - r.y)} />
        </clipPath>
      </defs>
      <WreckWorld
        cam={cam}
        f={f}
        fireSeed="t28"
        palette={palette}
        intensity={1}
        noGlow
        fireDetail={3}
        driver={false}
        bend={bend}
        frontFire={0.45}
        behindRails={
          <g clipPath="url(#b35-arm)">
            <Figure
              at={base}
              pxPerMetre={ppm}
              pose={pose}
              outfit={GRO_KIT}
              facing="left"
              parts={["nearArm"]}
              shadow={false}
              rim={rim}
              rimSide="right"
            />
          </g>
        }
        tonePrefix="b35"
      />
      {fingers}
      <TimeLabel r={r} corner="tl">
        {`${FACTS.escapeSeconds} 秒`}
      </TimeLabel>
    </g>
  );
};

const PANELS: React.FC<PanelProps>[] = [
  PanelPry,
  PanelMedical,
  PanelExtinguisher,
  PanelHand,
];

export const Timeline27: React.FC<PictureProps> = ({ f, palette }) => {
  const cues = [1, 2, 3, 4].map((n) => cueFrame(`bahrain2020.panel${n}`));
  const hb = heartbeat(f);
  return (
    <svg viewBox="0 0 1920 1080" width={1920} height={1080}>
      <defs>
        <ToneDefs prefix="b35" />
      </defs>
      <rect width={1920} height={1080} fill={INK} />
      {PANELS.map((Panel, i) => {
        if (f < cues[i]) return null;
        const age = f - cues[i];
        const pop = ramp(age, 0, 8);
        const r = panelRect(i, f, cues);
        return (
          <g
            key={i}
            opacity={pop}
            transform={`translate(${r.x + r.w / 2} ${r.y + r.h / 2}) scale(${0.94 + 0.06 * pop}) translate(${-r.x - r.w / 2} ${-r.y - r.h / 2})`}
          >
            <clipPath id={`b35-p${i}`}>
              <rect x={r.x} y={r.y} width={r.w} height={r.h} />
            </clipPath>
            <g clipPath={`url(#b35-p${i})`}>
              <Panel r={r} f={f} age={age} palette={palette} />
              {/* the newest panel flashes white as it lands */}
              <rect
                x={r.x}
                y={r.y}
                width={r.w}
                height={r.h}
                fill={PAPER}
                opacity={0.8 * (1 - ramp(age, 0, 5))}
              />
            </g>
            <rect
              x={r.x}
              y={r.y}
              width={r.w}
              height={r.h}
              fill="none"
              stroke={PAPER}
              strokeWidth={10}
            />
            <rect
              x={r.x}
              y={r.y}
              width={r.w}
              height={r.h}
              fill="none"
              stroke={INK}
              strokeWidth={4}
            />
          </g>
        );
      })}
      <Vignette amount={0.2 + 0.25 * hb} />
    </svg>
  );
};

