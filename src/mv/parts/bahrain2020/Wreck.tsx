// The wreck after the impact, seen from the track at night (ART-9 pinhole camera): the Haas in two pieces — the
// survival cell, halo up, wedged through the triple guardrail, and the rear (power unit, gearbox, rear wing) torn off on
// the track side — and the fire. Shot 3.4 shows it whole; shot 3.5 pushes in on the halo panel by panel through zoomed
// copies of the same camera; shot 3.6 reuses it behind GRO. No driver injury is ever shown: helmet and halo only.
import { useId } from "react";
import { MangaCar, VF20 } from "../../../cars";
import { pinhole, type Camera } from "../../../kit/camera";
import { INK, PAPER } from "../../../kit/colors";
import {
  Fire,
  FIRE_PALETTES,
  HeatShimmer,
  type FirePaletteName,
} from "../../../kit/fire";
import { ToneDefs, TonePattern } from "../../../kit/tone";
import { beatsAtFrame, FRAMES_PER_BEAT } from "../../timing.ts";
import { ramp, shotById, type PictureProps } from "./common";
import { BentGuardrail, type Deflection } from "./bent-rail";
import { NightBackdrop } from "./night";
import {
  BARRIER_Z,
  CELL_ANCHOR_X,
  CELL_FROM,
  CELL_POSE,
  CELL_TO,
  CELL_Z,
  HALO_WORLD,
  REAR_ANCHOR_X,
  RUN,
  WRECK_BEND,
  REAR_POSE,
  REAR_Z,
} from "./wreck-geometry.ts";

export { HALO_WORLD };

// Camera of shot 3.4: 1 m up at the track edge, long lens, looking square at the barrier 13 m away.
export const WRECK_CAM = pinhole({
  f: 2300,
  horizon: 420,
  cx: 960,
  height: 1.0,
});

// A copy of a camera zoomed by `zoom` about a world point, which lands on `to` on screen.
export const zoomCam = (
  cam: Camera,
  target: { x: number; y: number; z: number },
  zoom: number,
  to: { x: number; y: number },
) => {
  const p = cam.project(target);
  return pinhole({
    f: cam.f * zoom,
    cx: to.x - (p.x - cam.cx) * zoom,
    horizon: to.y - (p.y - cam.horizon) * zoom,
    height: cam.height,
  });
};

// The barrier, its bend and the torn middle rail (wreck-geometry.ts). The middle rail is gone over this stretch
// (fractions of the run); the top rail is bent up over the nose, ahead of the cockpit.
export { RUN, WRECK_BEND, CELL_FROM };
const along = (x: number) => (x - RUN.a.x) / (RUN.b.x - RUN.a.x);
const GAPS: [number, number][][] = [
  [],
  [[along(CELL_FROM + 0.9), along(CELL_TO + 0.5)]],
  [],
];

export const WreckWorld: React.FC<{
  cam: Camera;
  f: number;
  palette: FirePaletteName;
  // 0–1: the fire growing after the impact
  intensity: number;
  tonePrefix: string;
  // drawn behind the guardrail, just in front of the cell (someone climbing over the rails)
  behindRails?: React.ReactNode;
  // close-ups: no light pool, the fire throws no glow over the whole panel
  noGlow?: boolean;
  // varies the flames (the close-up panels each catch a different moment of the fire)
  fireSeed?: string;
  // close-ups: more, finer flame tongues (the fire is drawn this many times more finely)
  fireDetail?: number;
  // false once GRO is out: the cockpit is empty
  driver?: false;
  // how the rails are bent (default: as they were left after the impact)
  bend?: Deflection;
  // the low fire along the rails, scaled (a close-up keeps it down so a hand on the rail still reads)
  frontFire?: number;
}> = ({
  cam,
  f,
  palette,
  intensity,
  tonePrefix,
  behindRails,
  noGlow = false,
  fireSeed = "",
  fireDetail = 1.7,
  driver,
  bend = WRECK_BEND,
  frontFire = 1,
}) => {
  const p = noGlow
    ? { ...FIRE_PALETTES[palette], glow: null }
    : FIRE_PALETTES[palette];
  // only the big fire behind the cell throws light; the fires in front of it would wash the cell out
  const noLight = { ...p, glow: null };
  const fireAt = (x: number, z: number, w: number, h: number) => {
    const base = cam.project({ x, y: 0, z });
    const ppm = cam.pxPerMetre(z);
    return { x: base.x, y: base.y, w: w * ppm, h: h * ppm };
  };
  const back = fireAt(CELL_FROM + 2.2, CELL_Z + 0.5, 4.2, 7.5);
  const front = fireAt(CELL_FROM + 2.4, BARRIER_Z - 0.3, 4.6, 1.6 * frontFire);
  const gapFire = fireAt(CELL_TO + 1.0, (CELL_Z + REAR_Z) / 2, 2.0, 3.4);
  const cellAt = cam.anchor({ x: CELL_ANCHOR_X, z: CELL_Z });
  const rearAt = cam.anchor({ x: REAR_ANCHOR_X, z: REAR_Z });
  return (
    <g>
      {/* the night behind the fire, warped by the hot air rising over it */}
      <HeatShimmer
        frame={f}
        cx={back.x}
        cy={back.y - back.h * intensity * 1.05}
        rx={back.w * 0.95}
        ry={back.h * 0.75}
        scale={Math.max(8, cam.pxPerMetre(CELL_Z) * 0.09)}
      >
        <NightBackdrop cam={cam} tonePrefix={tonePrefix} />
      </HeatShimmer>
      {/* the fire's light on the asphalt */}
      <ellipse
        cx={back.x}
        cy={cam.screenY(0, BARRIER_Z - 1)}
        rx={back.w * 1.4}
        ry={cam.pxPerMetre(BARRIER_Z) * 2.4}
        fill={p.glow ?? PAPER}
        opacity={(p.glow ? 0.35 : 0.12) * intensity}
      />
      <Fire
        x={back.x}
        y={back.y}
        w={back.w}
        h={back.h}
        frame={f}
        seed={`wreck-back${fireSeed}`}
        detail={fireDetail}
        palette={p}
        intensity={intensity}
      />
      <MangaCar
        car={VF20}
        facing="left"
        at={cellAt}
        state={{ split: { front: CELL_POSE, show: "front" }, driver }}
      />
      {behindRails}
      <BentGuardrail
        cam={cam}
        a={RUN.a}
        b={RUN.b}
        gaps={GAPS}
        deflect={bend}
        tonePrefix={tonePrefix}
      />
      {/* the low fire along the rails: three smaller fires, so close-ups keep fine tongues */}
      {[-1, 0, 1].map((k) => (
        <Fire
          key={k}
          x={front.x + k * front.w * 0.34}
          y={front.y}
          w={front.w * 0.4}
          h={front.h * (k === 0 ? 1 : 0.75)}
          frame={f + 1 + k}
          seed={`wreck-front${k}${fireSeed}`}
          detail={fireDetail}
          palette={noLight}
          intensity={intensity}
          smoke={false}
        />
      ))}
      <Fire
        x={gapFire.x}
        y={gapFire.y}
        w={gapFire.w}
        h={gapFire.h}
        frame={f + 2}
        seed={`wreck-gap${fireSeed}`}
        detail={fireDetail}
        palette={noLight}
        intensity={intensity * 0.9}
        smoke={false}
      />
      <MangaCar
        car={VF20}
        facing="left"
        at={rearAt}
        state={{
          split: { rear: REAR_POSE, show: "rear" },
          compound: VF20.compound,
        }}
      />
      {/* debris on the asphalt */}
      {[
        [CELL_TO + 1.6, 11.6, 0.5],
        [CELL_TO + 2.6, 12.2, 0.3],
        [REAR_ANCHOR_X - 3.3, 9.6, 0.4],
        [REAR_ANCHOR_X + 0.6, 9.2, 0.25],
      ].map(([x, z, s]) => {
        const c = cam.project({ x, y: 0, z });
        const k = cam.pxPerMetre(z) * s;
        return (
          <path
            key={`${x}${z}`}
            d={`M ${c.x - k} ${c.y} L ${c.x - k * 0.2} ${c.y - k * 0.5} L ${c.x + k} ${c.y - k * 0.1} L ${c.x + k * 0.3} ${c.y + k * 0.15} Z`}
            fill={INK}
            stroke={PAPER}
            strokeWidth={1.5}
          />
        );
      })}
    </g>
  );
};

// Heartbeat (the score's lub on beats 1 and 3): a small push and a darkening at the frame's edge on each beat.
export const heartbeat = (f: number) => {
  const beat = Math.floor(beatsAtFrame(f));
  const onBeat = beat % 2 === 0 ? beat : beat - 1; // beats 1 and 3 of the bar (0-based even beats)
  const since = f - onBeat * FRAMES_PER_BEAT;
  return (
    Math.exp(-since / 7) +
    0.6 * Math.exp(-Math.abs(since - 7) / 4) * (since > 4 ? 1 : 0)
  );
};

export const Vignette: React.FC<{ amount: number }> = ({ amount }) => (
  <>
    <defs>
      <radialGradient id="b3-vig" cx="50%" cy="50%" r="75%">
        <stop offset="55%" stopColor={INK} stopOpacity={0} />
        <stop offset="100%" stopColor={INK} stopOpacity={1} />
      </radialGradient>
    </defs>
    <rect width={1920} height={1080} fill="url(#b3-vig)" opacity={amount} />
  </>
);

// Shot 3.4 (bars 62–65): the wreck, the fire rising over the first bar, the frame breathing with the heartbeat.
export const WreckShot: React.FC<PictureProps> = ({ f, palette }) => {
  const shot = shotById("3.4");
  const t = f - shot.from;
  const len = shot.to - shot.from;
  const intensity = 0.25 + 0.75 * ramp(t, 0, 112);
  const hb = heartbeat(f);
  // the camera never rests: a slow dolly from the whole wreck (torn rear in front) in to the cell in the barrier,
  // drifting along the rails, with a small kick on each heartbeat
  const u = ramp(t, 0, len, (x) => x * x * (3 - 2 * x));
  const target = {
    x: HALO_WORLD.x + (REAR_ANCHOR_X - 1.5 - HALO_WORLD.x) * (1 - u),
    y: 0.9 * (1 - u) + HALO_WORLD.y * u,
    z: REAR_Z + (HALO_WORLD.z - REAR_Z) * u,
  };
  const cam = zoomCam(WRECK_CAM, target, 0.82 + 0.45 * u + 0.01 * hb, {
    x: 960 + 160 * (1 - u),
    y: 560,
  });
  return (
    <svg viewBox="0 0 1920 1080" width={1920} height={1080}>
      <defs>
        <ToneDefs prefix="b34" />
      </defs>
      <WreckWorld
        cam={cam}
        f={f}
        palette={palette}
        intensity={intensity}
        tonePrefix="b34"
      />
      <Vignette amount={0.5 + 0.35 * hb} />
    </svg>
  );
};

// The halo, scorched black but whole (facts.md: the burnt front of the car, halo intact, is on show in London):
// drawn over the cell's own halo in the last panel — charred tube, soot, embers, and the one clean highlight left on it.
// Uses the cell's own transform (MangaCar facing left, split pose of the front piece) to land on the traced halo.
export const HaloScorch: React.FC<{ cam: Camera; f: number }> = ({
  cam,
  f,
}) => {
  const soot = `soot${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const at = cam.anchor({ x: CELL_ANCHOR_X, z: CELL_Z });
  const k = (VF20.frame.k * at.pxPerMetre) / 250;
  const ppmPhoto = 250 / VF20.frame.k;
  const nums = (VF20.breakLine ?? "")
    .replace(/[ML]/g, " ")
    .trim()
    .split(/\s+/)
    .map(Number);
  const bx = nums.filter((_, i) => i % 2 === 0);
  const by = nums.filter((_, i) => i % 2 === 1);
  const pivot = {
    x: (Math.min(...bx) + Math.max(...bx)) / 2,
    y: (Math.min(...by) + Math.max(...by)) / 2,
  };
  const halo = VF20.halo ?? "";
  const haloFar = VF20.haloFar ?? "";
  const step = Math.floor(f / 3);
  const embers = Array.from({ length: 6 }, (_, i) => ({
    x: 780 + ((i * 97 + step * 13) % 240),
    y: 500 + ((i * 53 + step * 7) % 70),
    r: 2 + (i % 3),
  }));
  return (
    <g
      transform={`translate(${at.x} ${at.y}) scale(${k} ${k}) translate(${-VF20.frame.x} ${-VF20.frame.ground}) translate(${-CELL_POSE.dx * ppmPhoto} 0) rotate(${CELL_POSE.rotate} ${pivot.x} ${pivot.y})`}
    >
      <defs>
        <TonePattern id={soot} r={2.4 / k} gap={6 / k} />
      </defs>
      {[haloFar, halo].map((d, i) => (
        <g key={i}>
          <path
            d={d}
            fill="none"
            stroke={INK}
            strokeWidth={i ? 20 : 16}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d={d}
            fill="none"
            stroke="#3a2a22"
            strokeWidth={i ? 12 : 9}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* soot: a dot screen burnt into the tube */}
          <path
            d={d}
            fill="none"
            stroke={`url(#${soot})`}
            strokeWidth={i ? 12 : 9}
            strokeLinecap="round"
            opacity={0.7}
          />
        </g>
      ))}
      {/* the one clean highlight left on the near bar: it held */}
      <path
        d={halo}
        fill="none"
        stroke={PAPER}
        strokeWidth={2.5}
        strokeLinecap="round"
        transform="translate(0 -5)"
      />
      {embers.map((e, i) => (
        <circle
          key={i}
          cx={e.x}
          cy={e.y}
          r={e.r}
          fill="#ffb347"
          stroke={INK}
          strokeWidth={0.8}
        />
      ))}
    </g>
  );
};
