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
const CLIMB_END = 75; // frames into the shot when he is down on the track side
const OVER = 36; // frames he spends coming over the top rail

// The marshal braced and spraying: front knee bent, rear leg straight, leaning in; the near hand aims the hose
// nozzle, the far hand holds the cylinder low at his side.
const MARSHAL_POSE: BodyPose = {
  lean: 20,
  head: 8,
  near: {
    leg: { thigh: 30, knee: 28, foot: 0 },
    arm: { shoulder: 74, elbow: 6 },
  },
  far: {
    leg: { thigh: -16, knee: 6, foot: 10 },
    arm: { shoulder: 16, elbow: 54 },
  },
};

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
  const walkFrames = black - shot.from - CLIMB_END;
  const w = ramp(t, CLIMB_END, CLIMB_END + walkFrames, (u) => u);
  const climb = ramp(t, 0, CLIMB_END);
  const step = Math.floor(t / 3) * 3; // poses held on threes
  // GRO: behind the rails hauling himself over, then down on the track side and away, toward the camera
  const behind = t < OVER;
  const groAt = {
    x: CLIMB_X - 0.5 * climb - 3.2 * w,
    z: behind ? 13.3 : 12.7 - 0.2 * climb - 1.9 * w,
  };
  const groPose = behind
    ? { ...CLIMB_A, hipY: 1.15 + 0.2 * ramp(step, 0, OVER) }
    : t < CLIMB_END
      ? mix(CLIMB_B, walkPose(0, 0.85, 16), ramp(step, OVER, CLIMB_END))
      : walkPose((step - CLIMB_END) / 64, 0.85, 16);
  // the camera keeps GRO the subject: framed on him, pushing in a little as he comes closer
  const cam: Camera = zoomCam(
    WRECK_CAM,
    { x: groAt.x, y: 1.1, z: groAt.z },
    1.55 + 0.15 * w,
    { x: 860 - 120 * w, y: 560 },
  );
  // the doctor: on the track side reaching up for him, then a step behind him with a hand at his back
  const walking = t >= CLIMB_END;
  const docAt = walking
    ? { x: groAt.x + 0.45, z: groAt.z + 0.55 }
    : { x: groAt.x - 1.05, z: 12.55 };
  const docPose: BodyPose = walking
    ? (() => {
        const p = walkPose((step - CLIMB_END) / 64 + 0.4, 0.8, 18);
        return { ...p, near: { ...p.near, arm: { shoulder: 70, elbow: 18 } } };
      })()
    : {
        lean: 14,
        head: -6,
        near: {
          leg: { thigh: 18, knee: 16, foot: 0 },
          arm: { shoulder: 128, elbow: 18 },
        },
        far: {
          leg: { thigh: -14, knee: 10, foot: 6 },
          arm: { shoulder: 96, elbow: 30 },
        },
      };
  // the marshal at the cockpit with the extinguisher
  const marAt = { x: CLIMB_X + 1.7, z: 12.45 };
  const g = (p: { x: number; z: number }) =>
    cam.project({ x: p.x, y: 0, z: p.z });
  const ppm = (p: { z: number }) => cam.pxPerMetre(p.z);
  const mppm = ppm(marAt);
  const nozzle = cam.project({ x: marAt.x + 0.58, y: 1.12, z: marAt.z });
  const hb = heartbeat(f);
  const text = ramp(f, timeCue, timeCue + 8);
  // the powder jet: a widening cone from the nozzle into the cockpit, billowing at its end
  const jetLen = 1.9 * mppm;
  const flick = Math.floor(f / 3);
  const jet = `M ${nozzle.x} ${nozzle.y - 4} L ${nozzle.x + jetLen} ${nozzle.y - 0.32 * mppm} L ${nozzle.x + jetLen} ${nozzle.y + 0.3 * mppm} L ${nozzle.x} ${nozzle.y + 4} Z`;
  const puffs = Array.from({ length: 8 }, (_, i) => {
    const u = ((flick + i * 3) % 8) / 8;
    return {
      x: nozzle.x + jetLen * (0.55 + 0.5 * u),
      y: nozzle.y + Math.sin(i * 2.3 + flick) * 0.25 * mppm - u * 0.2 * mppm,
      r: (0.12 + 0.2 * u) * mppm,
    };
  });
  const gro = (
    <Figure
      at={g(groAt)}
      pxPerMetre={ppm(groAt)}
      pose={groPose}
      outfit={GRO_KIT}
      facing="left"
      rim={rim}
      rimSide="right"
    />
  );
  const doctor = (
    <Figure
      at={g(docAt)}
      pxPerMetre={ppm(docAt)}
      pose={docPose}
      outfit={DOCTOR_KIT}
      facing={walking ? "left" : "right"}
      rim={rim}
      rimSide="right"
    />
  );
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
      {/* marshal, cylinder at his hip, and the dry-powder jet */}
      <Figure
        at={g(marAt)}
        pxPerMetre={mppm}
        pose={MARSHAL_POSE}
        outfit={MARSHAL_KIT}
        facing="right"
        rim={rim}
        rimSide="right"
      />
      <rect
        x={g(marAt).x + 0.02 * mppm}
        y={g(marAt).y - 0.98 * mppm}
        width={0.17 * mppm}
        height={0.52 * mppm}
        rx={0.06 * mppm}
        fill="#2a2a2a"
        stroke={INK}
        strokeWidth={2}
      />
      <path
        d={`M ${g(marAt).x + 0.1 * mppm} ${g(marAt).y - 0.98 * mppm} Q ${g(marAt).x + 0.2 * mppm} ${nozzle.y - 0.2 * mppm} ${nozzle.x} ${nozzle.y}`}
        fill="none"
        stroke={INK}
        strokeWidth={Math.max(3, 0.025 * mppm)}
      />
      <path
        d={jet}
        fill={PAPER}
        stroke={INK}
        strokeWidth={2.5}
        strokeLinejoin="round"
        opacity={0.9}
      />
      <path d={jet} fill="url(#b36-light)" opacity={0.5} />
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
      {/* the doctor a step behind (drawn first), GRO in front: he is the subject */}
      {walking ? doctor : null}
      {behind ? null : gro}
      {walking ? null : doctor}
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
