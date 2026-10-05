// The wreck after the impact, seen from the track at night (ART-9 pinhole camera): the Haas in two pieces — the
// survival cell, halo up, lodged in the gap it tore in the triple guardrail, and the rear (power unit, gearbox, rear
// wing) torn off on the track side — and the fire. Shot 3.4 shows it whole; shot 3.5 pushes in on the halo panel by
// panel through zoomed copies of the same camera; shot 3.6 reuses it behind GRO; the halo finale closes on it. Every
// one shows the same torn gap (wreck-geometry.ts). No driver injury is ever shown: helmet and halo only.
import { useId } from "react";
import { MangaCar, VF20 } from "../../../cars";
import { pinhole, type Camera } from "../../../kit/camera";
import { INK, PAPER } from "../../../kit/colors";
import {
  BubbleSmoke,
  Fire,
  FIRE_PALETTES,
  FireLight,
  HeatShimmer,
  type FirePaletteName,
  type ScreenRect,
} from "../../../kit/fire";
import { ToneDefs, TonePattern } from "../../../kit/tone";
import { at, beatsAtFrame, frameAt, FRAMES_PER_BEAT } from "../../timing.ts";
import { ramp, shotById, type PictureProps } from "./common";
import { BentGuardrail } from "./bent-rail";
import { Haze } from "./haze";
import { NightBackdrop } from "./night";
import {
  CharFilter,
  CharMarks,
  DyingFire,
  RailShadeFilter,
  RearShadowFilter,
  RecedeFilter,
} from "./scorch";
import {
  CELL_ANCHOR_X,
  CELL_FROM,
  CELL_PIVOT,
  CELL_POSE,
  CELL_TO,
  CELL_Z,
  COCKPIT_CLIP_PHOTO,
  FIRES,
  NEAR_BAR_CLIP_PHOTO,
  PPM,
  WRECK_GAPS,
  HALO_WORLD,
  REAR_ANCHOR_X,
  RUN,
  WRECK_BEND,
  REAR_POSE,
  REAR_SPAN,
  REAR_Z,
  WRECK_CAM_SPEC,
  along,
} from "./wreck-geometry.ts";

export { HALO_WORLD };

// Camera of shot 3.4 (wreck-geometry.ts): on the track side, square to the cell's left flank, 3.2 m up. Its picture
// is flipped left to right on screen (`Flip`), so the cell's nose points right, the way the car ran in 3.2 and 3.3.
export const WRECK_CAM = pinhole(WRECK_CAM_SPEC);

// The manga flip: the trackside camera's picture mirrored about the vertical line through `cx` (the frame's or the
// panel's centre). Everything of the wreck's world goes inside it; lettering stays outside.
export const Flip: React.FC<{ cx?: number; children: React.ReactNode }> = ({
  cx = 960,
  children,
}) => <g transform={`translate(${2 * cx} 0) scale(-1 1)`}>{children}</g>;

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

// The hot zone over the wreck for the heat haze (haze.tsx), on screen: from the cell's nose to past the torn-off rear,
// from the ground in front of the rear piece up to the top of the fire behind the cell.
export const heatZone = (cam: Camera, intensity = 1): ScreenRect => {
  const left = cam.project({ x: CELL_FROM - 0.8, y: 0, z: CELL_Z }).x;
  const right = cam.project({ x: REAR_SPAN.to + 1.0, y: 0, z: REAR_Z }).x;
  const base = cam.project({ x: CELL_FROM + 2.2, y: 0, z: CELL_Z + 0.5 });
  const top =
    base.y - cam.pxPerMetre(CELL_Z + 0.5) * 7.5 * (0.35 + 0.65 * intensity);
  const bottom = cam.project({ x: 0, y: -0.4, z: REAR_Z }).y;
  return { x: left, y: top, w: right - left, h: bottom - top };
};

// A fire in front of the cell (WreckWorld `nearFires`), V metres.
export type NearFire = {
  x: number;
  z: number;
  w: number;
  h: number;
  seed: string;
  tongues?: number;
  // frames the flames run ahead (default: by its place in the list)
  phase?: number;
};

// The barrier as the impact left it (wreck-geometry.ts): all three rails torn open along the cell, their ends curled.
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
// A clip to the near halo bar's drawn outline (wreck-geometry.ts NEAR_BAR_CLIP_PHOTO): the cell drawn again through it
// is the near bar alone, in register with the rest of the cell because it is the same drawing.
const NearBarClip: React.FC<{ id: string; cam: Camera }> = ({ id, cam }) => (
  <clipPath id={id}>
    <path d={NEAR_BAR_CLIP_PHOTO.band} transform={cellTransform(cam)} />
    {NEAR_BAR_CLIP_PHOTO.ends.map((c) => (
      <circle key={c.cx} {...c} transform={cellTransform(cam)} />
    ))}
  </clipPath>
);
// Someone in the cockpit, drawn as part of the wreck's front section (WreckWorld `cockpit`): what is behind the near
// halo bar (the body, the far arm) and what is in front of it (a leg on its way out over the side, a glove closing over
// the tube). Both show only above the cockpit's rim.
export type CockpitLayers = {
  behindHalo: React.ReactNode;
  overHalo: React.ReactNode;
};

export const WreckWorld: React.FC<{
  cam: Camera;
  f: number;
  palette: FirePaletteName;
  // 0–1: the fire growing after the impact
  intensity: number;
  tonePrefix: string;
  // someone in the cockpit, layered round the near halo bar and cut to the cockpit's rim here
  cockpit?: CockpitLayers;
  // someone out over the cell's side, behind the bottom rail's stubs but clear of them on screen
  behindRails?: React.ReactNode;
  // close-ups: no light pool, the fire throws no glow over the whole panel
  noGlow?: boolean;
  // varies the flames (the close-up panels each catch a different moment of the fire)
  fireSeed?: string;
  // the screen rectangle the picture is shown in (a panel): the fire's filters are cut to it
  clip?: ScreenRect;
  // false once GRO is out: the cockpit is empty
  driver?: false;
  // the low fire along the rails, scaled (a close-up keeps it down so a hand on the rail still reads)
  frontFire?: number;
  // the heat shimmer over the night behind the fire, px (default: from the zoom)
  shimmer?: number;
  // the fire is out (halo finale): the cell charred, embers and a few small flames left along the rails
  burntOut?: boolean;
  // 0–1: the smoke drifting over the torn-off rear parts and thins away, so the rear reads (3.4 around 64.1)
  veilOpen?: number;
  // 0–1: the wreck recedes, darker, so GRO (drawn crisp in `cockpit`, `behindRails` or over it) is
  // the subject (user review 2026-10-05; ART-23); the fire is the light and stays as it is
  recede?: number;
  // fires between the camera and the cell, in the same layer as the low fire (in front of someone in the cockpit or
  // out over its side, behind someone who has stepped down in front of the rails): ground point, size in V metres
  nearFires?: readonly NearFire[];
  // the big fire behind the cell, scaled
  backFire?: number;
  // metres the fire in the gap stands further back from the camera, toward the barrier
  gapFireBack?: number;
  // the small debris drawn under the fires in front of the cell, which swallow it
  debrisUnderFire?: boolean;
  // someone in or out of the cockpit drawn over the fires round the car, the car and the fire in the gap
  subjectOverFires?: boolean;
  // the fires behind the subject fade out into the ground at their base (no bright line or pool at the root)
  softFireBase?: boolean;
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
  frontFire = 1,
  shimmer,
  burntOut = false,
  veilOpen = 0,
  recede = 0,
  nearFires = [],
  backFire = 1,
  gapFireBack = 0,
  debrisUnderFire = false,
  subjectOverFires = false,
  softFireBase = false,
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
  const back = fireAt(
    FIRES.back.x,
    FIRES.back.z,
    FIRES.back.w,
    FIRES.back.h * backFire,
  );
  const front = fireAt(
    FIRES.front.x,
    FIRES.front.z,
    FIRES.front.w,
    FIRES.front.h * frontFire,
  );
  const gapFire = fireAt(
    FIRES.gap.x,
    FIRES.gap.z + gapFireBack,
    FIRES.gap.w,
    FIRES.gap.h,
  );
  const cellAt = cam.anchor({ x: CELL_ANCHOR_X, z: CELL_Z });
  // the wreck cam is 3.2 m up, looking down on the car: the VF-20's high far side (ART-26)
  const cellState = {
    farSide: "high" as const,
    split: { front: CELL_POSE, show: "front" as const },
    driver,
  };
  const rimClip = `rim${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const rearShade = `${rimClip}-rear`;
  const charId = `${rimClip}-char`;
  const railShade = `${rimClip}-rails`;
  const recedeId = `${rimClip}-recede`;
  // the wreck's parts, receded when GRO is the subject
  const rec = (node: React.ReactNode) =>
    recede > 0 ? <g filter={`url(#${recedeId})`}>{node}</g> : node;
  const cellK = (VF20.frame.k * cellAt.pxPerMetre) / 250;
  const rearAt = cam.anchor({ x: REAR_ANCHOR_X, z: REAR_Z });
  // the veil of smoke over the rear piece: from the top of the gap fire across to above the rear wing
  const veil =
    Math.min(1, Math.max(0, (intensity - 0.2) / 0.5)) * (1 - 0.88 * veilOpen);
  const veilFrom = cam.project({
    x: CELL_TO + 1.0,
    y: 1.3,
    z: (CELL_Z + REAR_Z) / 2,
  });
  const veilTo = cam.project({ x: REAR_SPAN.to - 0.3, y: 1.5, z: REAR_Z });
  const veilAngle =
    (Math.atan2(veilTo.x - veilFrom.x, -(veilTo.y - veilFrom.y)) * 180) /
    Math.PI;
  const veilLength = Math.hypot(veilTo.x - veilFrom.x, veilTo.y - veilFrom.y);
  const veilLow = cam.project({ x: CELL_TO + 1.4, y: 0.5, z: REAR_Z + 0.6 });
  const veilLowTo = cam.project({
    x: REAR_SPAN.to - 0.8,
    y: 0.9,
    z: REAR_Z - 0.4,
  });
  const veilLowAngle =
    (Math.atan2(veilLowTo.x - veilLow.x, -(veilLowTo.y - veilLow.y)) * 180) /
    Math.PI;
  // as the veil parts, the upper drift lifts and the lower one sinks, opening a gap over the rear piece
  const part = veilOpen * cam.pxPerMetre(REAR_Z) * 0.45;
  const veilLowLength = Math.hypot(
    veilLowTo.x - veilLow.x,
    veilLowTo.y - veilLow.y,
  );
  // debris on the asphalt: three small, dark, low-contrast scraps lying flat, drawn under the smoke drifting off the
  // gap fire so they sink into it — scattered wreckage, not graphic shapes (user review 2026-10-04); with
  // `debrisUnderFire` they go under the fires, which swallow them (user review 2026-10-05)
  const debris = (
    <g>
      {[
        [CELL_TO + 0.9, CELL_Z - 1.3, 0.2],
        [CELL_TO - 0.4, CELL_Z - 0.8, 0.12],
        [REAR_SPAN.to + 0.6, REAR_Z - 0.6, 0.16],
      ].map(([x, z, s]) => {
        const c = cam.project({ x, y: 0, z });
        const k = cam.pxPerMetre(z) * s;
        return (
          <path
            key={`${x}${z}`}
            d={`M ${c.x - k} ${c.y} L ${c.x - k * 0.3} ${c.y - k * 0.32} L ${c.x + k} ${c.y - k * 0.08} L ${c.x + k * 0.35} ${c.y + k * 0.12} Z`}
            fill="#2b2724"
            stroke="#3b3531"
            strokeWidth={1}
            strokeLinejoin="round"
            opacity={0.8}
          />
        );
      })}
    </g>
  );
  // someone in the cockpit or out over its side (GRO); with `subjectOverFires` he is drawn over the fires round
  // the car, the car and the fire in the gap (3.6: the user's order, front to back: doctor, the near fire in front
  // of the cockpit, GRO, the fire in the gap, the car, the fire behind it; user review 2026-10-05)
  const subject = (
    <>
      {/* someone in the cockpit, between the far parts and the near halo bar and cut to the rim, then the near bar
            over him: drawn after the fire's light so he stays solid (as he is once out) */}
      {cockpit ? (
        <>
          <defs>
            <CockpitClip id={rimClip} cam={cam} />
            <NearBarClip id={`${rimClip}-bar`} cam={cam} />
          </defs>
          <g clipPath={`url(#${rimClip})`}>{cockpit.behindHalo}</g>
          <g clipPath={`url(#${rimClip}-bar)`}>
            {rec(
              <MangaCar
                car={VF20}
                facing="left"
                at={cellAt}
                state={cellState}
              />,
            )}
          </g>
          <g clipPath={`url(#${rimClip})`}>{cockpit.overHalo}</g>
        </>
      ) : null}
      {/* someone out over the cell's side, behind the low fire (nothing of him overlaps the bottom rail until he
            crosses it) */}
      {behindRails}
    </>
  );
  // a fire's base faded into the ground (`softFireBase`): its bottom `fade` px go from full to nothing at the base
  const soft = (key: string, y: number, ppm: number, node: React.ReactNode) => {
    if (!softFireBase) return node;
    const fade = 0.45 * ppm;
    const id = `${rimClip}-soft-${key}`;
    return (
      <g key={key}>
        <defs>
          <linearGradient
            id={`${id}-g`}
            gradientUnits="userSpaceOnUse"
            x1={0}
            x2={0}
            y1={y - fade}
            y2={y + 0.1 * fade}
          >
            <stop offset={0} stopColor="#fff" />
            <stop offset={0.55} stopColor="#fff" stopOpacity={0.55} />
            <stop offset={1} stopColor="#fff" stopOpacity={0} />
          </linearGradient>
          <mask
            id={id}
            maskUnits="userSpaceOnUse"
            x={-200}
            y={-200}
            width={2320}
            height={1480}
          >
            <rect
              x={-200}
              y={-200}
              width={2320}
              height={1480}
              fill={`url(#${id}-g)`}
            />
          </mask>
        </defs>
        <g mask={`url(#${id})`}>{node}</g>
      </g>
    );
  };
  const gapFireNode = (
    <>
      {burntOut
        ? null
        : soft(
            "gap",
            gapFire.y,
            gapFire.w / FIRES.gap.w,
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
            />,
          )}
    </>
  );
  const rearNode = (
    <>
      {/* the torn-off rear on the track side, turned end for end (wreck-geometry.ts REAR_REST): scorched and in
            shadow, a muted grey-brown silhouette with a faint rim of firelight on the side facing the fire */}
      <defs>
        <RearShadowFilter id={rearShade} rim={p.glow ? p.smokeRim : null} />
      </defs>
      {rec(
        <g filter={`url(#${rearShade})`}>
          <MangaCar
            car={VF20}
            facing="right"
            at={rearAt}
            state={{
              farSide: "high",
              split: { rear: REAR_POSE, show: "rear" },
              compound: VF20.compound,
            }}
          />
        </g>,
      )}
    </>
  );
  return (
    <g>
      {recede > 0 ? (
        <defs>
          <RecedeFilter id={recedeId} amount={recede} />
        </defs>
      ) : null}
      {/* the night behind the fire, warped by the hot air rising over it */}
      <HeatShimmer
        frame={f}
        cx={back.x}
        cy={back.y - back.h * intensity * 1.0}
        rx={back.w * 0.9}
        ry={back.h * 0.7}
        scale={shimmer ?? Math.max(8, cam.pxPerMetre(CELL_Z) * 0.08)}
        clip={clip}
      >
        <NightBackdrop cam={cam} tonePrefix={tonePrefix} />
      </HeatShimmer>
      {/* once the fire is out the night is a little darker, so the scorched halo is the lightest thing left */}
      {burntOut ? (
        <rect
          x={-50}
          y={-50}
          width={2020}
          height={1180}
          fill={INK}
          opacity={0.3}
        />
      ) : null}
      {burntOut ? null : (
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
      )}
      {burntOut ? (
        <defs>
          <RailShadeFilter id={railShade} />
        </defs>
      ) : null}
      {/* the barrier up the run, behind the cell's tail, to its torn ends at the gap */}
      <g filter={burntOut ? `url(#${railShade})` : undefined}>
        <BentGuardrail
          cam={cam}
          a={RUN.a}
          b={RUN.b}
          to={along(0)}
          gaps={WRECK_GAPS}
          deflect={WRECK_BEND}
          tonePrefix={tonePrefix}
        />
      </g>
      {/* the wreck's front section, one drawing in the gap: survival cell, cockpit sides, headrest, far and near halo
          bars, helmet while the driver is in; with someone in the cockpit the near bar is drawn again over him below */}
      {burntOut ? (
        <>
          <defs>
            <CharFilter id={charId} />
          </defs>
          <g filter={`url(#${charId})`}>
            <MangaCar car={VF20} facing="left" at={cellAt} state={cellState} />
          </g>
          <CharMarks transform={cellTransform(cam)} k={cellK} />
        </>
      ) : (
        rec(<MangaCar car={VF20} facing="left" at={cellAt} state={cellState} />)
      )}
      {/* the barrier on down the run from the gap, toward the camera in front of the nose (the cell went through it) */}
      <g filter={burntOut ? `url(#${railShade})` : undefined}>
        <BentGuardrail
          cam={cam}
          a={RUN.a}
          b={RUN.b}
          from={along(0)}
          gaps={WRECK_GAPS}
          deflect={WRECK_BEND}
          tonePrefix={tonePrefix}
        />
      </g>
      {/* the fire's light on the rails and the asphalt (not in the close-ups: it would wash the panel out) */}
      {noGlow ? null : (
        <FireLight
          cx={back.x}
          cy={cam.screenY(0.6, CELL_Z - 1)}
          rx={back.w * 1.6}
          ry={cam.pxPerMetre(CELL_Z - 1) * 2.2}
          frame={f}
          palette={p}
          amount={intensity}
        />
      )}
      {subjectOverFires ? null : subject}
      {debrisUnderFire ? debris : null}
      {/* the low fire along the rails; once it is out, embers and a few small flames */}
      {burntOut ? (
        <DyingFire
          x0={front.x - front.w * 0.5}
          x1={front.x + front.w * 0.5}
          y={front.y}
          frame={f}
          palette={noLight}
          seed={`wreck-dying${fireSeed}`}
        />
      ) : null}
      {burntOut
        ? null
        : soft(
            "front",
            front.y,
            front.w / FIRES.front.w,
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
            />,
          )}
      {burntOut
        ? null
        : nearFires.map((n, i) => {
            if (n.h <= 0) return null;
            const c = fireAt(n.x, n.z, n.w, n.h);
            return soft(
              n.seed,
              c.y,
              c.w / n.w,
              <Fire
                key={n.seed}
                x={c.x}
                y={c.y}
                w={c.w}
                h={c.h}
                frame={f + 23 + (n.phase ?? 11 * i)}
                seed={`wreck-${n.seed}${fireSeed}`}
                tongues={n.tongues ?? 5}
                embers={5}
                palette={noLight}
                intensity={intensity}
                smoke={false}
                clip={clip}
              />,
            );
          })}
      {subjectOverFires ? (
        <>
          {rearNode}
          {gapFireNode}
          {subject}
        </>
      ) : (
        <>
          {gapFireNode}
          {rearNode}
        </>
      )}
      {debrisUnderFire ? null : debris}
      {/* bubble smoke (ART-20) drifting across from the fire in the gap over the torn-off rear, partly veiling it */}
      {veil > 0 ? (
        <g
          transform={`translate(${veilFrom.x} ${veilFrom.y - part}) rotate(${veilAngle})`}
        >
          <BubbleSmoke
            w={cam.pxPerMetre(REAR_Z) * 1.3}
            top={0}
            rise={veilLength}
            frame={f}
            seed={`wreck-veil${fireSeed}`}
            palette={p}
            count={11}
            size={1.05}
            opacity={0.9 * veil}
          />
        </g>
      ) : null}
      {/* and a second, lower drift across the rear's flank, from the gap fire toward the camera's right */}
      {veil > 0 ? (
        <g
          transform={`translate(${veilLow.x} ${veilLow.y + part * 0.6}) rotate(${veilLowAngle})`}
        >
          <BubbleSmoke
            w={cam.pxPerMetre(REAR_Z) * 1.0}
            top={0}
            rise={veilLowLength}
            frame={f + 41}
            seed={`wreck-veil-low${fireSeed}`}
            palette={p}
            count={8}
            size={1.0}
            opacity={0.85 * veil}
          />
        </g>
      ) : null}
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

// Shot 3.4's camera at song frame f: it never rests — a slow dolly from the whole wreck (torn rear in front) in to the
// cell in the barrier, drifting along the rails, with a small kick on each heartbeat.
export const wreckShotCam = (f: number) => {
  const shot = shotById("3.4");
  const u = ramp(
    f - shot.from,
    0,
    shot.to - shot.from,
    (x) => x * x * (3 - 2 * x),
  );
  // (in the camera's own, unflipped picture: the screen is flipped, so the rear piece starts at the left edge)
  const start = { x: REAR_ANCHOR_X + 0.9, y: 0.9, z: REAR_Z };
  const target = {
    x: HALO_WORLD.x + (start.x - HALO_WORLD.x) * (1 - u),
    y: start.y * (1 - u) + HALO_WORLD.y * u,
    z: start.z + (HALO_WORLD.z - start.z) * u,
  };
  return zoomCam(WRECK_CAM, target, 0.82 + 0.45 * u + 0.01 * heartbeat(f), {
    x: 960 + 420 * (1 - u), // the rear piece starts at the edge, half out of frame (user review 2026-10-04)
    y: 560,
  });
};

// Shot 3.4 (bars 62–65): the wreck, the fire rising over the first bar, the frame breathing with the heartbeat.
export const WreckShot: React.FC<PictureProps> = ({ f, palette }) => {
  const shot = shotById("3.4");
  const t = f - shot.from;
  const intensity = 0.25 + 0.75 * ramp(t, 0, 112);
  const cam = wreckShotCam(f);
  // once, round 64.1 (halfway in, the rear piece on screen at the right): the smoke over the torn-off rear parts for
  // a moment, so it reads that the car is in two (review 1, #20); the rear stays the dark, muted silhouette (ART-23)
  const veilOpen =
    ramp(f, frameAt(at(63, 3)), frameAt(at(64))) *
    (1 - ramp(f, frameAt(at(64, 3)), frameAt(at(65))));
  return (
    <svg viewBox="0 0 1920 1080" width={1920} height={1080}>
      <defs>
        <ToneDefs prefix="b34" />
      </defs>
      <Flip>
        <Haze frame={f} zone={heatZone(cam, intensity)}>
          <WreckWorld
            cam={cam}
            f={f}
            palette={palette}
            intensity={intensity}
            tonePrefix="b34"
            veilOpen={veilOpen}
          />
        </Haze>
      </Flip>
      <Vignette amount={0.5 + 0.35 * heartbeat(f)} />
    </svg>
  );
};

// The halo, scorched black but whole (facts.md: the burnt front of the car, halo intact, is on show in London):
// drawn over the cell's own halo in the finale: an ash-grey tube with soot (the lightest thing in the frame over the
// charred cell), embers, and the one clean highlight left on it.
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
          {/* the titanium tube came out ash-grey over the charred cell (the remains in London): the lightest thing
              in the frame, the far bar a step darker */}
          <path
            d={d}
            fill="none"
            stroke={i ? "#bdb5aa" : "#706962"}
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
            opacity={0.35}
          />
        </g>
      ))}
      {/* the one clean highlight left on the near bar: it held */}
      <path
        d={halo}
        fill="none"
        stroke={PAPER}
        strokeWidth={3}
        strokeLinecap="round"
        transform="translate(0 -3.5)"
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
