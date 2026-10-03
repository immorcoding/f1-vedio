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
import { Figure, walkPose, type BodyPose, type Outfit } from "./figure";
import { FACTS } from "./shots.ts";
import { HALO_WORLD, WRECK_CAM, WreckWorld, heartbeat, zoomCam } from "./Wreck";

// Closer than 3.4, framed on the cockpit; it pans left with the two men as they walk away.
const camAt = (pan: number): Camera =>
  zoomCam(WRECK_CAM, HALO_WORLD, 1.35, { x: 1280 + pan, y: 520 });

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
  const cam = camAt(w * 520);
  // GRO: over the rails, then away on the track side, angling toward the camera
  const climb = ramp(t, 0, CLIMB_END);
  // first he is behind the rails, hauling himself up over them; then down on the track side
  const behind = t < OVER;
  const groAt = {
    x: CLIMB_X - 0.5 * climb - 3.6 * w,
    z: behind ? 13.3 : 12.75 - 0.15 * climb - 1.5 * w,
  };
  const step = Math.floor(t / 3) * 3; // poses held on threes
  const groPose = behind
    ? { ...CLIMB_A, hipY: 1.15 + 0.2 * ramp(step, 0, OVER) }
    : t < CLIMB_END
      ? mix(CLIMB_B, walkPose(0, 0.85, 14), ramp(step, OVER, CLIMB_END))
      : walkPose((step - CLIMB_END) / 64, 0.85, 14);
  // the doctor: waiting with his hand on GRO's arm, then walking him away, one hand at his back
  // (on the track side of him while he climbs; then just behind him, his near hand at GRO's back)
  const walking = t >= CLIMB_END;
  const docAt = walking
    ? { x: groAt.x + 0.3, z: groAt.z + 0.3 }
    : { x: groAt.x - 1.15, z: groAt.z - 0.6 };
  const docPose: BodyPose =
    t < CLIMB_END
      ? {
          lean: 12,
          near: {
            leg: { thigh: 14, knee: 8, foot: 0 },
            arm: { shoulder: 78, elbow: 14 },
          },
          far: {
            leg: { thigh: -12, knee: 10, foot: 6 },
            arm: { shoulder: 64, elbow: 30 },
          },
        }
      : (() => {
          const p = walkPose((step - CLIMB_END) / 64 + 0.25, 0.85, 10);
          return {
            ...p,
            near: { ...p.near, arm: { shoulder: 58, elbow: 12 } },
          };
        })();
  // the marshal at the cockpit with the extinguisher
  const marAt = { x: CLIMB_X + 1.5, z: 12.3 };
  const marPose: BodyPose = {
    lean: 14,
    near: {
      leg: { thigh: 22, knee: 18, foot: 0 },
      arm: { shoulder: 58, elbow: 34 },
    },
    far: {
      leg: { thigh: -18, knee: 8, foot: 8 },
      arm: { shoulder: 70, elbow: 24 },
    },
  };
  const g = (p: { x: number; z: number }) =>
    cam.project({ x: p.x, y: 0, z: p.z });
  const ppm = (p: { z: number }) => cam.pxPerMetre(p.z);
  const nozzle = cam.project({ x: marAt.x + 0.62, y: 1.05, z: marAt.z });
  const hb = heartbeat(f);
  const text = ramp(f, timeCue, timeCue + 8);
  const puffs = Array.from({ length: 9 }, (_, i) => {
    const life = ((Math.floor(f / 3) + i * 2) % 9) / 9;
    return {
      x: nozzle.x + (40 + life * 260) * (0.9 + 0.2 * Math.sin(i * 3.1)),
      y: nozzle.y - life * 60 + Math.sin(i * 1.7) * 20,
      r: 14 + life * 46,
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
      />
      {/* marshal and the dry-powder cloud */}
      <Figure
        at={g(marAt)}
        pxPerMetre={ppm(marAt)}
        pose={marPose}
        outfit={MARSHAL_KIT}
        facing="right"
        rim={rim}
        rimSide="right"
      />
      <rect
        x={nozzle.x - 0.42 * ppm(marAt)}
        y={nozzle.y + 0.05 * ppm(marAt)}
        width={0.16 * ppm(marAt)}
        height={0.5 * ppm(marAt)}
        rx={0.05 * ppm(marAt)}
        fill="#2a2a2a"
        stroke={INK}
        strokeWidth={2}
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
      {/* nearer person drawn last */}
      {[
        {
          key: "doc",
          z: docAt.z,
          el: (
            <Figure
              at={g(docAt)}
              pxPerMetre={ppm(docAt)}
              pose={docPose}
              outfit={DOCTOR_KIT}
              facing={walking ? "left" : "right"}
              rim={rim}
              rimSide="right"
            />
          ),
        },
        { key: "gro", z: groAt.z, el: behind ? null : gro },
      ]
        .sort((a, b) => b.z - a.z)
        .map((p) => (
          <g key={p.key}>{p.el}</g>
        ))}
      <rect width={1920} height={1080} fill={INK} opacity={0.12 * hb} />
      {text > 0 ? (
        <g
          opacity={text}
          transform={`translate(110 260) scale(${0.8 + 0.2 * text})`}
        >
          <Sfx x={0} y={0} size={210} rotate={-4}>
            {`${FACTS.escapeSeconds} 秒`}
          </Sfx>
        </g>
      ) : null}
    </svg>
  );
};
