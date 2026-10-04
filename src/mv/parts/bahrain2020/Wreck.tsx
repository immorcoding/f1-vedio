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
  FireLight,
  HeatShimmer,
  type FirePaletteName,
  type ScreenRect,
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
  CELL_PIVOT,
  CELL_POSE,
  CELL_TO,
  CELL_Z,
  COCKPIT_CLIP_PHOTO,
  PPM,
  WRECK_GAPS,
  HALO_WORLD,
  REAR_ANCHOR_X,
  RUN,
  WRECK_BEND,
  REAR_POSE,
  REAR_Z,
  WRECK_CAM_SPEC,
} from "./wreck-geometry.ts";

export { HALO_WORLD };

// Camera of shot 3.4: 1 m up at the track edge, long lens, looking square at the barrier 13 m away.
export const WRECK_CAM = pinhole(WRECK_CAM_SPEC);

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

// The barrier as the impact left it (wreck-geometry.ts): the middle rail gone over the cell, the top rail torn open
// over the cockpit, the bottom rail pressed down and back.
export { RUN, WRECK_BEND, WRECK_GAPS, CELL_FROM };

// The posed survival cell's own transform (MangaCar facing left, the split pose of the front piece): photo space of the
// traced VF-20 → screen, for drawing over or clipping to parts of the cell.
export const cellTransform = (cam: Camera) => {
  const at = cam.anchor({ x: CELL_ANCHOR_X, z: CELL_Z });
  const k = (VF20.frame.k * at.pxPerMetre) / 250;
  return `translate(${at.x} ${at.y}) scale(${k} ${k}) translate(${-VF20.frame.x} ${-VF20.frame.ground}) translate(${-CELL_POSE.dx * PPM} 0) rotate(${CELL_POSE.rotate} ${CELL_PIVOT.x} ${CELL_PIVOT.y})`;
};
// A clip to everything above the cell's top edge round the cockpit: what shows of someone standing in it.
export const CockpitClip: React.FC<{ id: string; cam: Camera }> = ({
  id,
  cam,
}) => (
  <clipPath id={id}>
    <path d={COCKPIT_CLIP_PHOTO} transform={cellTransform(cam)} />
  </clipPath>
);
// The halo's near side (pillar and near hoop bar), drawn again exactly as MangaCar draws it: over someone inside
// the cockpit, who is behind it.
export const NearHalo: React.FC<{ cam: Camera }> = ({ cam }) => {
  const d = VF20.halo ?? "";
  return (
    <g transform={cellTransform(cam)}>
      <path
        d={d}
        fill="none"
        stroke={INK}
        strokeWidth={16}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d={d}
        fill="none"
        stroke={VF20.paint.chassis}
        strokeWidth={9}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d={d}
        fill="none"
        stroke={PAPER}
        strokeWidth={3}
        strokeLinecap="round"
        transform="translate(0 -3)"
      />
    </g>
  );
};

export const WreckWorld: React.FC<{
  cam: Camera;
  f: number;
  palette: FirePaletteName;
  // 0–1: the fire growing after the impact
  intensity: number;
  tonePrefix: string;
  // someone in the cockpit (the caller clips them to it and redraws the halo over them)
  cockpit?: React.ReactNode;
  // someone out over the cell's side, behind the bottom rail but clear of it on screen
  behindRails?: React.ReactNode;
  // close-ups: no light pool, the fire throws no glow over the whole panel
  noGlow?: boolean;
  // varies the flames (the close-up panels each catch a different moment of the fire)
  fireSeed?: string;
  // the screen rectangle the picture is shown in (a panel): the fire's filters are cut to it
  clip?: ScreenRect;
  // false once GRO is out: the cockpit is empty
  driver?: false;
  // how the rails are bent and where they are torn (default: as they were left after the impact)
  bend?: Deflection;
  gaps?: [number, number][][];
  // the torn ends trail hanging strips (not while the rail is still splitting)
  hanging?: boolean;
  // the low fire along the rails, scaled (a close-up keeps it down so a hand on the rail still reads)
  frontFire?: number;
}> = ({
  cam,
  f,
  palette,
  intensity,
  tonePrefix,
  cockpit,
  behindRails,
  noGlow = false,
  fireSeed = "",
  clip,
  driver,
  bend = WRECK_BEND,
  gaps = WRECK_GAPS,
  hanging = true,
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
        cy={back.y - back.h * intensity * 1.0}
        rx={back.w * 0.9}
        ry={back.h * 0.7}
        scale={Math.max(8, cam.pxPerMetre(CELL_Z) * 0.08)}
        clip={clip}
      >
        <NightBackdrop cam={cam} tonePrefix={tonePrefix} />
      </HeatShimmer>
      <Fire
        x={back.x}
        y={back.y}
        w={back.w}
        h={back.h}
        frame={f}
        seed={`wreck-back${fireSeed}`}
        tongues={6}
        embers={14}
        palette={p}
        intensity={intensity}
        clip={clip}
      />
      <MangaCar
        car={VF20}
        facing="left"
        at={cellAt}
        state={{ split: { front: CELL_POSE, show: "front" }, driver }}
      />
      <BentGuardrail
        cam={cam}
        a={RUN.a}
        b={RUN.b}
        gaps={gaps}
        hanging={hanging}
        deflect={bend}
        tonePrefix={tonePrefix}
      />
      {/* the fire's light on the rails and the asphalt (not in the close-ups: it would wash the panel out) */}
      {noGlow ? null : (
        <FireLight
          cx={back.x}
          cy={cam.screenY(0.6, BARRIER_Z)}
          rx={back.w * 1.6}
          ry={cam.pxPerMetre(BARRIER_Z) * 2.2}
          frame={f}
          palette={p}
          amount={intensity}
        />
      )}
      {/* someone in the cockpit or out over its side, behind the low fire: drawn after the fire's light so he stays
          solid (nothing of him overlaps the bottom rail until he crosses it) */}
      {cockpit}
      {behindRails}
      {/* the low fire along the rails */}
      <Fire
        x={front.x}
        y={front.y}
        w={front.w}
        h={front.h}
        frame={f + 7}
        seed={`wreck-front${fireSeed}`}
        tongues={7}
        embers={6}
        palette={noLight}
        intensity={intensity}
        smoke={false}
        clip={clip}
      />
      <Fire
        x={gapFire.x}
        y={gapFire.y}
        w={gapFire.w}
        h={gapFire.h}
        frame={f + 13}
        seed={`wreck-gap${fireSeed}`}
        tongues={4}
        embers={4}
        palette={noLight}
        intensity={intensity * 0.9}
        smoke={false}
        clip={clip}
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
  const k =
    (VF20.frame.k * cam.anchor({ x: CELL_ANCHOR_X, z: CELL_Z }).pxPerMetre) /
    250;
  const halo = VF20.halo ?? "";
  const haloFar = VF20.haloFar ?? "";
  // the last embers on the tube: soft glowing points (fire style B, no outline) drifting slowly up and burning out
  const embers = Array.from({ length: 6 }, (_, i) => {
    const u = (f * 0.006 + i * 0.37) % 1;
    return {
      x: 780 + ((i * 97) % 240) + Math.sin(f * 0.03 + i * 1.7) * 6,
      y: 570 - u * 70,
      r: 2 + (i % 3),
      op: Math.min(1, u / 0.15) * (1 - u),
    };
  });
  return (
    <g transform={cellTransform(cam)}>
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
        <g key={i} opacity={e.op}>
          <circle cx={e.x} cy={e.y} r={e.r * 3} fill="#ffb43c" opacity={0.25} />
          <circle cx={e.x} cy={e.y} r={e.r} fill="#ffb43c" />
          <circle cx={e.x} cy={e.y} r={e.r * 0.5} fill="#fff3c4" />
        </g>
      ))}
    </g>
  );
};
