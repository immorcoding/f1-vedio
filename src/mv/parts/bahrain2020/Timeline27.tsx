// Shot 3.5 (bars 66–69): the 27 seconds in four panels, one more on each bar's first beat — four different moments,
// not four looks at the helmet (facts.md, FIA accident investigation summary):
//   0 秒   the barrier splits: the cell is through it, all three rails torn open along it, their ends curled
//          back and throwing sparks (the torn gap every later shot shows), the fire catching;
//   11 秒  the FIA medical car brakes in hard and stops, the doctor out and running for the fire;
//   (no time: not verified) a marshal turns a dry-powder extinguisher on the cockpit;
//   27 秒  GRO, in his helmet, rises out of the cockpit through the fire, both gloves on the halo, hauling himself up.
// People from the shared people module (src/kit/figure, ART-16), no faces (ART-5). Each panel has a small time label in
// a corner the subject is not in (ART-14), the top-left: the page's top-right corner holds the stopwatch.
import { pinhole, type Camera } from "../../../kit/camera";
import { INK, PAPER } from "../../../kit/colors";
import {
  DOCTOR,
  Figure,
  MARSHAL,
  gaitDistance,
  nozzleOf,
  spray,
  v,
  walk,
} from "../../../kit/figure";
import { Fire, FIRE_PALETTES, type FirePaletteName } from "../../../kit/fire";
import { Caption } from "../../../kit/lettering";
import { random } from "remotion";
import { ToneDefs } from "../../../kit/tone";
import { cueFrame, ramp, type PictureProps } from "./common";
import { BentGuardrail } from "./bent-rail";
import { MedicalCar } from "./MedicalCar";
import { NightBackdrop } from "./night";
import { Haze } from "./haze";
import { PowderJet } from "./powder";
import { FACTS } from "./shots.ts";
import {
  Flip,
  Vignette,
  WRECK_CAM,
  WreckWorld,
  heartbeat,
  heatZone,
  zoomCam,
} from "./Wreck";
import { CLIMB_X, PANEL_U, WALK_Z, exitAt } from "./escape-staging.ts";
import { useGroExit } from "./GroExit";
import {
  CELL_Z,
  FIRES_W,
  HALO_HOOP_GRIP,
  HALO_WORLD,
  MEDICAL_STOP_W,
  RUN_W,
  TEARS,
  WRECK_GAPS,
  bendIn,
  railLip,
  type P2,
} from "./wreck-geometry.ts";

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
}> = ({ r, corner, children }) => (
  <Caption
    x={corner === "tl" ? r.x + 18 : r.x + r.w - 18}
    y={r.y + 18}
    boxAnchor={corner === "tl" ? "start" : "end"}
    lines={[children]}
    size={42}
  />
);

// 0 s: the moment the barrier has split (3.3's freeze): the same torn gap as every later shot — all three rails open
// along the cell, their jagged ends curled back — with sparks still flying off the torn ends.
// (each rail's two torn ends: up the run first, then down it)
const LIPS = TEARS.flatMap((tear, r) => tear.map((wx) => railLip(wx, r)));

type PanelProps = {
  r: Rect;
  f: number;
  age: number;
  palette: FirePaletteName;
};

// 0 秒: the cell in the gap it tore, all three rails split along it, their torn ends curled back and
// throwing sparks; the fire just catching.
const PanelPry: React.FC<PanelProps> = ({ r, f, age, palette }) => {
  const cam = PANEL_CAMS.pry(r);
  const ppm = cam.pxPerMetre(CELL_Z);
  const sparks = LIPS.flatMap((lip, l) => {
    const touch = cam.project(lip);
    // thrown away from the gap: the end up the run lies on V's +x side (side −1 throws toward +x), the end down the
    // run on its −x side
    const side = l % 2 ? 1 : -1;
    return Array.from({ length: 7 }, (_, i) => {
      const a0 = (i * 11 + l * 7) % 30;
      const a = (age + a0) % 30;
      const ang = -Math.PI * (0.5 + side * (0.12 + ((i * 0.37) % 1) * 0.3));
      const sp = (0.03 + ((i * 3) % 5) * 0.008) * ppm;
      const P = (k: number) => ({
        x: touch.x + Math.cos(ang) * sp * k,
        y: touch.y + Math.sin(ang) * sp * k + 0.0009 * ppm * k * k,
      });
      return { a: P(Math.max(0, a - 3)), b: P(a), op: 1 - a / 30 };
    });
  });
  const intensity = 0.4 + 0.3 * ramp(age, 0, 200);
  return (
    <g>
      <Flip cx={r.x + r.w / 2}>
        <Haze frame={f} zone={heatZone(cam, intensity)} clip={r}>
          <WreckWorld
            cam={cam}
            f={f}
            fireSeed="t0"
            palette={palette}
            intensity={intensity}
            noGlow
            clip={r}
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
        </Haze>
      </Flip>
      <TimeLabel r={r} corner="tl">
        0s
      </TimeLabel>
    </g>
  );
};

// 11 秒: the medical car comes in fast and brakes hard to a stop short of the burning wreck — speed lines, the nose
// dipping under braking and bobbing back up as it stops, tyre smoke; the doctor gets out and runs for the fire.
// Its own camera (the medical car runs along the barrier, not at the cell's 51°, so the wreck camera would see it
// foreshortened): on the track side, square to the medical car and so to the barrier behind it, the picture flipped
// like the wreck's so it arrives left → right. The world is the same top view (wreck-geometry.ts): the barrier with
// the same torn gap and the fire through it; the cell is beyond the rails inside the fire, the rear half nearer, out
// of the panel to the left.
const MED_Z = 8.4; // the medical car's centre line from the camera
const MED_STOP = 1.0; // M x of its front bumper when it stops
const MED_CAM_W = {
  x: MEDICAL_STOP_W.front.x + MED_STOP,
  y: MEDICAL_STOP_W.front.y - MED_Z,
};
// the panel camera's world (M): x to the right of its unflipped picture (= up the run, W −x), z toward the barrier
const toM = (p: P2) => ({ x: -(p.x - MED_CAM_W.x), z: p.y - MED_CAM_W.y });
const MED_BEND = bendIn((d) => ({ x: -d.x, z: d.y }));
const MED_RUN = {
  a: toM({ x: RUN_W.from, y: 0 }),
  b: toM({ x: RUN_W.to + 12, y: 0 }),
};
// the run is drawn 12 m longer here (the barrier stays far from this camera): the gaps as fractions of it
const MED_GAPS: [number, number][][] = WRECK_GAPS.map((g) =>
  g.map(([a, b]) => {
    const k = (RUN_W.to - RUN_W.from) / (RUN_W.to + 12 - RUN_W.from);
    return [a * k, b * k] as [number, number];
  }),
);
const MED_RUNIN = 64; // frames from the panel landing to the stop
// the medical car's tyre contact patches, metres from its front bumper (MedicalCar.tsx: axles at 0.95 and 3.79 m
// from the rear of a 4.75 m car)
const FRONT_TYRE_X = 4.75 - 3.79;
const REAR_TYRE_X = 4.75 - 0.95;
const MED_BRAKE_D = 11; // metres it travels under braking in the panel (from ~74 km/h)
const MED_EYE = 1.6; // the panel camera's height
// the panel camera on the top view: where it stands, the way it looks and its picture's (unflipped) right
export const MEDICAL_CAMERA_W = {
  at: MED_CAM_W,
  look: { x: 0, y: 1 },
  right: { x: -1, y: 0 },
};
const medicalCam = (r: Rect) => {
  const fit = { x: 1.9, y: 1.0, z: MED_Z };
  const mf = (r.w / 7.2) * MED_Z;
  return pinhole({
    f: mf,
    height: MED_EYE,
    cx: r.x + r.w * 0.5 - (mf * fit.x) / fit.z,
    horizon: r.y + r.h * 0.5 - (mf * (MED_EYE - fit.y)) / fit.z,
  });
};
const PanelMedical: React.FC<PanelProps> = ({ r, f, age, palette }) => {
  const cam = PANEL_CAMS.medical(r);
  const fireP = FIRE_PALETTES[palette];
  const noLight = { ...fireP, glow: null };
  const fireAt = (p: P2, w: number, h: number) => {
    const q = toM(p);
    const base = cam.project({ x: q.x, y: 0, z: q.z });
    const s = cam.pxPerMetre(q.z);
    return { x: base.x, y: base.y, w: w * s, h: h * s };
  };
  const back = fireAt(FIRES_W.back, 4.2, 7.5);
  const low = fireAt(FIRES_W.front, 4.6, 1.6);
  const gap = fireAt(FIRES_W.gap, 2.0, 3.4);
  const zone = {
    x: Math.min(back.x - back.w * 0.6, gap.x - gap.w),
    y: back.y - back.h,
    w: Math.max(back.w * 1.2, gap.x + gap.w - (back.x - back.w * 0.6)),
    h: Math.max(back.h, gap.y - (back.y - back.h)) + 20,
  };
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
  // the heat haze over the wreck; the medical car and the doctor, in front of the fire, get the lighter ripple
  const calm = [
    {
      cx: medAt.x - 2.4 * mppm,
      cy: medAt.y - 0.75 * mppm,
      rx: 2.9 * mppm,
      ry: 1.0 * mppm,
    },
    ...(age >= OUT
      ? [
          (() => {
            const b = cam.project({ x: docAt.x, y: 0, z: docAt.z });
            const s = cam.pxPerMetre(docAt.z);
            return { cx: b.x, cy: b.y - 0.95 * s, rx: 0.6 * s, ry: 1.0 * s };
          })(),
        ]
      : []),
  ];
  return (
    <g>
      <Flip cx={r.x + r.w / 2}>
        <Haze frame={f} zone={zone} clip={r} calm={calm}>
          <NightBackdrop cam={cam} tonePrefix="b35" />
          <Fire
            x={back.x}
            y={back.y}
            w={back.w}
            h={back.h}
            frame={f}
            seed="t11-back"
            tongues={6}
            embers={14}
            palette={noLight}
            intensity={1}
            clip={r}
          />
          <BentGuardrail
            cam={cam}
            a={MED_RUN.a}
            b={MED_RUN.b}
            gaps={MED_GAPS}
            deflect={(s, rail) => MED_BEND(s, rail)}
            tonePrefix="b35"
          />
          <Fire
            x={low.x}
            y={low.y}
            w={low.w}
            h={low.h}
            frame={f + 7}
            seed="t11-front"
            tongues={7}
            embers={6}
            palette={noLight}
            intensity={1}
            smoke={false}
            clip={r}
          />
          <Fire
            x={gap.x}
            y={gap.y}
            w={gap.w}
            h={gap.h}
            frame={f + 13}
            seed="t11-gap"
            tongues={4}
            embers={4}
            palette={noLight}
            intensity={0.9}
            smoke={false}
            clip={r}
          />
          {smoke}
          <MedicalCar
            at={medAt}
            wheelAngle={wheelAngle}
            pitch={pitch}
            tonePrefix="b35"
          />
          {doctor}
        </Haze>
        {streaks}
        {trails}
      </Flip>
      {/* top-left like the other panels: the top-right corner of the page is the stopwatch's (Stopwatch.tsx) */}
      <TimeLabel r={r} corner="tl">
        {`${FACTS.medicalCarSeconds}s`}
      </TimeLabel>
    </g>
  );
};

// A marshal turns a dry-powder extinguisher on the cockpit. The time is not in the FIA summary or any source found,
// so this panel carries no seconds label (facts.md).
// He stands on the track side of the barrier past the nose (V −x, screen right), facing the cockpit.
const MARSHAL_AT = { x: HALO_WORLD.x - 1.0, z: CELL_Z - 2.4 };
const COCKPIT = { x: HALO_WORLD.x - 0.35, y: 0.75, z: HALO_WORLD.z - 0.3 };
const PanelExtinguisher: React.FC<PanelProps> = ({ r, f, age, palette }) => {
  const cam = PANEL_CAMS.extinguisher(r);
  const step = Math.floor(age / 3) * 3; // on threes, like everyone
  const pose = spray(step / 60);
  // the nozzle points at the cockpit: figure frame (facing right: forward is +x in the world)
  const tipF = nozzleOf(pose).tip;
  const aim = v(COCKPIT.x - MARSHAL_AT.x - tipF.x, COCKPIT.y - tipF.y);
  const at = cam.project({ x: MARSHAL_AT.x, y: 0, z: MARSHAL_AT.z });
  const ppm = cam.pxPerMetre(MARSHAL_AT.z);
  const cock = cam.project(COCKPIT);
  // the jet: small bubble-smoke puffs from the nozzle's tip (the kit's jet cone is off) to the cockpit
  const tip = nozzleOf(pose, aim).tip;
  const nozzle = { x: at.x + tip.x * ppm, y: at.y - tip.y * ppm }; // facing right
  const calm = [
    { cx: at.x, cy: at.y - 0.95 * ppm, rx: 0.6 * ppm, ry: 1.0 * ppm },
  ];
  return (
    <g>
      <Flip cx={r.x + r.w / 2}>
        <Haze frame={f} zone={heatZone(cam, 0.9)} clip={r} calm={calm}>
          <WreckWorld
            cam={cam}
            f={f}
            fireSeed="tx"
            palette={palette}
            intensity={0.9}
            noGlow
            clip={r}
            tonePrefix="b35"
          />
          <PowderJet
            from={nozzle}
            to={cock}
            ppm={ppm}
            frame={f}
            seed="b35-powder"
            on={ramp(age, 0, 6)}
          />
          <Figure
            at={at}
            pxPerMetre={ppm}
            pose={pose}
            outfit={MARSHAL}
            facing="right"
            held={{ kind: "extinguisher", aim }}
            rim={FIRE_PALETTES[palette].glow ? "#ffb347" : PAPER}
            rimSide="right"
          />
        </Haze>
      </Flip>
    </g>
  );
};

// 27 秒: GRO rising out of the cockpit through the fire, the way drivers get out — both gloves on the halo (the far
// hand on its central pillar, the near hand on the hoop), hauling himself up (escape-staging.ts / climbOutOfCockpit,
// the same climb 3.6 carries on with). A close copy of the wreck camera: the cell in the torn gap, the halo and his
// helmet and shoulders above the cockpit's rim, the low fire along the rails in front.
const PanelClimb: React.FC<PanelProps> = ({ r, f, age, palette }) => {
  const cam = PANEL_CAMS.climb(r);
  const fire = FIRE_PALETTES[palette];
  // he hauls himself up over the panel (on threes, like everyone), to where 3.6 picks him up
  const step = Math.floor(age / 3) * 3;
  const u = 0.03 + (PANEL_U - 0.03) * Math.min(1, step / 108);
  const e = exitAt(cam, u);
  const gro = useGroExit({
    at: cam.project({ x: CLIMB_X, y: 0, z: WALK_Z }),
    ppm: e.s,
    pose: e.pose,
    layers: e.layer,
    holds: e.holds,
    rim: fire.glow ? "#ffb347" : PAPER,
    facing: e.facing,
  });
  // GRO in the cockpit: in the haze with the lighter ripple, so his helmet and shoulders still read
  const groBase = cam.project({ x: CLIMB_X, y: 0, z: WALK_Z });
  const calm = [
    {
      cx: groBase.x - 0.2 * e.s,
      cy: groBase.y - 1.3 * e.s,
      rx: 0.75 * e.s,
      ry: 0.7 * e.s,
    },
  ];
  return (
    <g>
      <Flip cx={r.x + r.w / 2}>
        <Haze frame={f} zone={heatZone(cam)} clip={r} calm={calm}>
          <WreckWorld
            cam={cam}
            f={f}
            fireSeed="t28"
            palette={palette}
            intensity={1}
            noGlow
            clip={r}
            driver={false}
            cockpit={gro.cockpit}
            frontFire={0.45}
            tonePrefix="b35"
          />
        </Haze>
      </Flip>
      <TimeLabel r={r} corner="tl">
        {`${FACTS.escapeSeconds}s`}
      </TimeLabel>
    </g>
  );
};

// Each panel's camera for its rectangle (also drawn on the geometry diagram, src/library/BahrainGeometry.tsx). All
// but the medical car's are close copies of the wreck camera.
export const PANEL_CAMS = {
  // 0 秒: the cell in the gap, the halo, the nose through the rails and the torn ends either side, so the barrier's
  // line across the cell shows
  pry: (r: Rect) =>
    fitCam(
      { x: HALO_WORLD.x - 0.9, y: HALO_WORLD.y - 0.25, z: CELL_Z },
      6.4,
      r,
      0.5,
      0.5,
    ),
  medical: (r: Rect) => medicalCam(r),
  extinguisher: (r: Rect) =>
    fitCam({ x: HALO_WORLD.x - 0.6, y: 1.0, z: CELL_Z - 1.4 }, 4.4, r, 0.5, 0.55),
  // framing ~2.3 m round the cockpit
  climb: (r: Rect) =>
    fitCam({ x: HALO_HOOP_GRIP.x - 0.12, y: 1.3, z: CELL_Z }, 2.3, r, 0.5, 0.56),
};
// the four panels' rectangles once all are on the page
export const PANEL_RECTS = LAYOUTS[3];

const PANELS: React.FC<PanelProps>[] = [
  PanelPry,
  PanelMedical,
  PanelExtinguisher,
  PanelClimb,
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
