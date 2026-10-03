// Shot 3.6 (bars 70–72): GRO climbs out over the rails beside the burning cell; the FIA doctor (Ian Roberts, from the
// medical car) takes his arm and walks him away while a marshal turns a dry-powder extinguisher on the cockpit
// (facts.md, easter egg). 28 秒 comes up on bar 71; the last beat of bar 72 is black. People per ART-16, no faces.
import { GRO_2020 } from "../../../cars";
import type { Camera } from "../../../kit/camera";
import { INK, PAPER } from "../../../kit/colors";
import { FIRE_PALETTES } from "../../../kit/fire";
import { Sfx } from "../../../kit/lettering";
import { ToneDefs } from "../../../kit/tone";
import { cueFrame, ramp, shotById, type PictureProps } from "./common";
import {
  Figure,
  solveBody,
  walkAdvance,
  walkPose,
  type BodyPose,
  type Outfit,
} from "../../../kit/figure";
import { FACTS } from "./shots.ts";
import { HALO_WORLD, WRECK_CAM, WreckWorld, heartbeat, zoomCam } from "./Wreck";

// Race suit of 2020 (Haas: black with a grey side band), GRO's helmet; the doctor's light medical overalls and
// helmet; a marshal's overalls (orange in reality, a mid tone here: environment stays black and white, ART-8).
const GRO_KIT: Outfit = {
  suit: "#1f1f23",
  suitShade: "#0f0f12",
  seam: "#55555c",
  stripe: "#c3c5cc",
  gloves: "#2c2c31",
  boots: "#141416",
  head: {
    kind: "helmet",
    base: GRO_2020.helmet.base,
    stripe: GRO_2020.helmet.stripe,
    visor: "#15132a",
  },
};
const DOCTOR_KIT: Outfit = {
  suit: "#e9e9e4",
  suitShade: "#b9b9b3",
  seam: "#7b7b76",
  gloves: "#cfcfca",
  boots: "#262626",
  head: { kind: "helmet", base: PAPER, stripe: "#8a8a8a", visor: "#15132a" },
};
const MARSHAL_KIT: Outfit = {
  suit: "#8c8c8c",
  suitShade: "#5c5c5c",
  seam: "#383838",
  stripe: "#d8d8d8",
  gloves: "#3a3a3a",
  boots: "#1a1a1a",
  head: {
    kind: "helmet",
    base: "#c4c4c4",
    stripe: "#7a7a7a",
    visor: "#15132a",
  },
};

// Over the top rail: astride it, then the trailing leg comes over and he steps down.
const CLIMB_A: BodyPose = {
  lean: 34,
  hipY: 1.3,
  head: 10,
  near: {
    leg: { thigh: 38, knee: 64, foot: 4 },
    arm: { shoulder: 55, elbow: 25 },
  },
  far: {
    leg: { thigh: -78, knee: 42, foot: 20 },
    arm: { shoulder: 82, elbow: 8 },
  },
};
const CLIMB_B: BodyPose = {
  lean: 20,
  head: 6,
  near: {
    leg: { thigh: 10, knee: 12, foot: 0 },
    arm: { shoulder: 30, elbow: 30 },
  },
  far: {
    leg: { thigh: -22, knee: 40, foot: 20 },
    arm: { shoulder: 70, elbow: 12 },
  },
};
const mix = (a: BodyPose, b: BodyPose, u: number): BodyPose => {
  const m = (x: number, y: number) => x + (y - x) * u;
  const leg = (p: BodyPose["near"]["leg"], q: BodyPose["near"]["leg"]) => ({
    thigh: m(p.thigh, q.thigh),
    knee: m(p.knee, q.knee),
    foot: m(p.foot, q.foot),
  });
  const arm = (p: BodyPose["near"]["arm"], q: BodyPose["near"]["arm"]) => ({
    shoulder: m(p.shoulder, q.shoulder),
    elbow: m(p.elbow, q.elbow),
  });
  return {
    lean: m(a.lean, b.lean),
    head: m(a.head ?? 0, b.head ?? 0),
    hipY:
      a.hipY !== undefined && b.hipY !== undefined
        ? m(a.hipY, b.hipY)
        : u < 0.5
          ? a.hipY
          : b.hipY,
    near: {
      leg: leg(a.near.leg, b.near.leg),
      arm: arm(a.near.arm, b.near.arm),
    },
    far: { leg: leg(a.far.leg, b.far.leg), arm: arm(a.far.arm, b.far.arm) },
  };
};

const CLIMB_X = HALO_WORLD.x - 0.2;
const OVER = 36; // frames he spends coming over the top rail
const CLIMB_END = 75; // frames into the shot when he is down on the track side and walks
const WALK_Z = 12.55; // GRO walks along the rails, 0.45 m in front of them
const DOC_Z = 12.85; // the doctor a step deeper, between GRO and the rails
const STRIDE = 0.85;
const CYCLE = 64; // frames per gait cycle (two steps), ~1.9 steps a second: a shaken, careful walk
const GRO_LEAN = 14;
const DOC_LEAN = 10;

// The marshal, braced, facing the cockpit and spraying: front knee bent, back leg long, leaning in; the near hand
// aims the hose nozzle, the far hand holds the cylinder by its handle at his side.
const MARSHAL_POSE: BodyPose = {
  lean: 18,
  head: 10,
  near: {
    leg: { thigh: 28, knee: 30, foot: 0 },
    arm: { shoulder: 62, elbow: 18 },
  },
  far: {
    leg: { thigh: -20, knee: 6, foot: 12 },
    arm: { shoulder: -4, elbow: 16 },
  },
};
const MARSHAL_AT = { x: CLIMB_X + 2.75, z: 12.35 };
const AIM = { x: CLIMB_X + 1.45, y: 0.75, z: 13.4 }; // into the cockpit, beside where GRO came out

export const Escape: React.FC<PictureProps> = ({ f, palette }) => {
  const shot = shotById("3.6");
  const t = f - shot.from;
  const black = cueFrame("bahrain2020.black");
  const timeCue = cueFrame("bahrain2020.time");
  if (f >= black) {
    return (
      <svg viewBox="0 0 1920 1080" width={1920} height={1080}>
        <rect width={1920} height={1080} fill={INK} />
      </svg>
    );
  }
  const fire = FIRE_PALETTES[palette];
  const rim = fire.glow ? "#ffb347" : PAPER;
  // a held camera (he walks across the frame, not on the spot), creeping in a little
  const cam: Camera = zoomCam(
    WRECK_CAM,
    { x: CLIMB_X - 0.1, y: 1.0, z: WALK_Z },
    1.18 + 0.05 * ramp(t, 0, black - shot.from),
    { x: 980, y: 600 },
  );
  const step = Math.floor(t / 3) * 3; // poses and positions held together on threes
  const phase = Math.max(0, step - CLIMB_END) / CYCLE;
  // GRO: hauled up behind the rails, stepping down on the track side, then walking away with his feet planted
  const behind = t < OVER;
  const down = ramp(step, OVER, CLIMB_END);
  const groPose: BodyPose = behind
    ? { ...CLIMB_A, hipY: 1.15 + 0.2 * ramp(step, 0, OVER) }
    : t < CLIMB_END
      ? mix(CLIMB_B, walkPose(0, STRIDE, GRO_LEAN), down)
      : walkPose(phase, STRIDE, GRO_LEAN);
  const groAt = behind
    ? { x: CLIMB_X, z: 13.3 }
    : {
        x: CLIMB_X - 0.5 * down - walkAdvance(phase, STRIDE, GRO_LEAN),
        z: 13.0 - (13.0 - WALK_Z) * down,
      };
  // the doctor: beside the rails reaching for him, then walking at his back, a hand on him (the one real contact)
  const docPhase = phase + 0.5;
  const docPose: BodyPose =
    t < CLIMB_END
      ? {
          lean: 16,
          head: -4,
          near: {
            leg: { thigh: 16, knee: 18, foot: 0 },
            arm: { shoulder: 104 - 30 * down, elbow: 20 },
          },
          far: {
            leg: { thigh: -14, knee: 10, foot: 6 },
            arm: { shoulder: 86 - 20 * down, elbow: 34 },
          },
        }
      : (() => {
          const p = walkPose(docPhase, STRIDE, DOC_LEAN);
          return {
            ...p,
            near: { ...p.near, arm: { shoulder: 58, elbow: 34 } },
          };
        })();
  const docAt = {
    x:
      CLIMB_X +
      0.62 -
      0.5 * down -
      (walkAdvance(docPhase, STRIDE, DOC_LEAN) -
        walkAdvance(0.5, STRIDE, DOC_LEAN)),
    z: DOC_Z,
  };
  const g = (p: { x: number; z: number }) =>
    cam.project({ x: p.x, y: 0, z: p.z });
  const ppm = (p: { z: number }) => cam.pxPerMetre(p.z);
  // the marshal's nozzle is his near hand; his far hand holds the cylinder
  const mppm = ppm(MARSHAL_AT);
  const mBase = g(MARSHAL_AT);
  const mBody = solveBody(MARSHAL_POSE);
  const toScreen = (v: { x: number; y: number }) => ({
    x: mBase.x - v.x * mppm, // facing left
    y: mBase.y - v.y * mppm,
  });
  const nozzle = toScreen(mBody.nearArm.hand);
  const grip = toScreen(mBody.farArm.hand);
  const aim = cam.project(AIM);
  const hb = heartbeat(f);
  const text = ramp(f, timeCue, timeCue + 8);
  // the powder jet: a cone from the nozzle to the cockpit, billowing where it lands, redrawn on threes
  const flick = Math.floor(f / 3);
  const jx = aim.x - nozzle.x;
  const jy = aim.y - nozzle.y;
  const jl = Math.hypot(jx, jy);
  const nx = -jy / jl;
  const ny = jx / jl;
  const spread = 0.35 * mppm;
  const jet = `M ${nozzle.x + nx * 4} ${nozzle.y + ny * 4} L ${aim.x + nx * spread} ${aim.y + ny * spread} L ${aim.x - nx * spread} ${aim.y - ny * spread} L ${nozzle.x - nx * 4} ${nozzle.y - ny * 4} Z`;
  const puffs = Array.from({ length: 9 }, (_, i) => {
    const u = ((flick + i * 3) % 9) / 9;
    return {
      x: aim.x + Math.sin(i * 2.3 + flick * 0.7) * 0.5 * mppm,
      y: aim.y - u * 0.9 * mppm + Math.cos(i * 1.7) * 0.15 * mppm,
      r: (0.1 + 0.16 * u) * mppm,
    };
  });
  const figure = (
    at: { x: number; z: number },
    pose: BodyPose,
    outfit: Outfit,
    facing: "left" | "right",
  ) => (
    <Figure
      at={g(at)}
      pxPerMetre={ppm(at)}
      pose={pose}
      outfit={outfit}
      facing={facing}
      rim={rim}
      rimSide="right"
    />
  );
  const gro = figure(groAt, groPose, GRO_KIT, "left");
  return (
    <svg viewBox="0 0 1920 1080" width={1920} height={1080}>
      <defs>
        <ToneDefs prefix="b36" />
      </defs>
      <WreckWorld
        cam={cam}
        f={f}
        palette={palette}
        intensity={1}
        tonePrefix="b36"
        behindRails={behind ? gro : null}
        driver={false}
      />
      {/* the doctor, deeper than GRO, then GRO in front of him: GRO is the subject */}
      {figure(docAt, docPose, DOCTOR_KIT, "left")}
      {behind ? null : gro}
      {/* the marshal at the cockpit, cylinder in his far hand, and the dry-powder jet */}
      <rect
        x={grip.x - 0.08 * mppm}
        y={grip.y - 0.04 * mppm}
        width={0.17 * mppm}
        height={0.5 * mppm}
        rx={0.06 * mppm}
        fill="#2a2a2a"
        stroke={INK}
        strokeWidth={2}
      />
      {figure(MARSHAL_AT, MARSHAL_POSE, MARSHAL_KIT, "left")}
      <path
        d={`M ${grip.x} ${grip.y} Q ${(grip.x + nozzle.x) / 2} ${Math.max(grip.y, nozzle.y) + 0.25 * mppm} ${nozzle.x} ${nozzle.y}`}
        fill="none"
        stroke={INK}
        strokeWidth={Math.max(3, 0.03 * mppm)}
      />
      <path
        d={jet}
        fill={PAPER}
        stroke={INK}
        strokeWidth={2.5}
        strokeLinejoin="round"
        opacity={0.9}
      />
      {puffs.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={p.r}
          fill={PAPER}
          stroke={INK}
          strokeWidth={2.5}
          opacity={0.92}
        />
      ))}
      <rect width={1920} height={1080} fill={INK} opacity={0.12 * hb} />
      {text > 0 ? (
        <g
          opacity={text}
          transform={`translate(110 220) scale(${0.8 + 0.2 * text})`}
        >
          <Sfx x={0} y={0} size={210} rotate={-4}>
            {`${FACTS.escapeSeconds} 秒`}
          </Sfx>
        </g>
      ) : null}
    </svg>
  );
};
