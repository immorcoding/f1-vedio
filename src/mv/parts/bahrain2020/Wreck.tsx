// The wreck after the impact, seen from the track at night (ART-9 pinhole camera): the Haas in two pieces — the
// survival cell, halo up, wedged through the triple guardrail, and the rear (power unit, gearbox, rear wing) torn off on
// the track side — and the fire. Shot 3.4 shows it whole; shot 3.5 pushes in on the halo panel by panel through zoomed
// copies of the same camera; shot 3.6 reuses it behind GRO. No driver injury is ever shown: helmet and halo only.
import { MangaCar, VF20 } from "../../../cars";
import { pinhole, type Camera } from "../../../kit/camera";
import { INK, PAPER } from "../../../kit/colors";
import { Fire, FIRE_PALETTES, type FirePaletteName } from "../../../kit/fire";
import { ToneDefs, TonePattern } from "../../../kit/tone";
import { beatsAtFrame, FRAMES_PER_BEAT } from "../../timing.ts";
import { cueFrame, ramp, shotById, type PictureProps } from "./common";
import { Guardrail, NightBackdrop } from "./night";
import {
  BARRIER_Z,
  CELL_ANCHOR_X,
  CELL_POSE,
  CELL_Z,
  HALO_WORLD,
  L,
  REAR_ANCHOR_X,
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

// The barrier runs along x at BARRIER_Z; the cell tore the middle and top rails over this stretch (fractions of the run).
const RUN = { a: { x: -30, z: BARRIER_Z }, b: { x: 30, z: BARRIER_Z } };
const along = (x: number) => (x - RUN.a.x) / (RUN.b.x - RUN.a.x);
const CELL_FROM = CELL_ANCHOR_X - L - CELL_POSE.dx; // nose
const CELL_TO = CELL_ANCHOR_X - 2.4 - CELL_POSE.dx; // torn edge
const GAPS: [number, number][][] = [
  [],
  [[along(CELL_FROM + 0.9), along(CELL_TO + 0.5)]],
  [[along(CELL_FROM + 1.6), along(CELL_TO + 0.2)]],
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
}> = ({
  cam,
  f,
  palette,
  intensity,
  tonePrefix,
  behindRails,
  noGlow = false,
  fireSeed = "",
  fireDetail = 1,
  driver,
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
  const front = fireAt(CELL_FROM + 2.4, BARRIER_Z - 0.3, 4.6, 1.6);
  const gapFire = fireAt(CELL_TO + 1.0, (CELL_Z + REAR_Z) / 2, 2.0, 3.4);
  const cellAt = cam.anchor({ x: CELL_ANCHOR_X, z: CELL_Z });
  const rearAt = cam.anchor({ x: REAR_ANCHOR_X, z: REAR_Z });
  return (
    <g>
      <NightBackdrop cam={cam} tonePrefix={tonePrefix} />
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
      <Guardrail
        cam={cam}
        a={RUN.a}
        b={RUN.b}
        gaps={GAPS}
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

const Vignette: React.FC<{ amount: number }> = ({ amount }) => (
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
  // smoke rolling off to the left across the top of the frame, on threes
  const step = Math.floor(f / 3);
  const smoke = Array.from({ length: 10 }, (_, i) => {
    const life = ((step * 0.6 + i * 9) % 90) / 90;
    return {
      x: 1250 - life * 1500 + Math.sin(i * 2.1) * 60,
      y: 330 - life * 330 + Math.cos(i * 1.3) * 40,
      r: 60 + life * 150,
    };
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
      <g opacity={ramp(t, 30, 140)}>
        {smoke.map((p, i) => (
          <g key={i}>
            <circle
              cx={p.x}
              cy={p.y}
              r={p.r}
              fill="#262626"
              stroke={INK}
              strokeWidth={3}
            />
            <circle
              cx={p.x - p.r * 0.2}
              cy={p.y - p.r * 0.2}
              r={p.r * 0.7}
              fill="url(#b34-dark)"
              opacity={0.5}
            />
          </g>
        ))}
      </g>
      <Vignette amount={0.5 + 0.35 * hb} />
    </svg>
  );
};

// The halo, scorched black but whole (facts.md: the burnt front of the car, halo intact, is on show in London):
// drawn over the cell's own halo in the last panel — charred tube, soot, embers, and the one clean highlight left on it.
// Uses the cell's own transform (MangaCar facing left, split pose of the front piece) to land on the traced halo.
const HaloScorch: React.FC<{ cam: Camera; f: number }> = ({ cam, f }) => {
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
            stroke="url(#b35-soot)"
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

// Panel layout of shot 3.5: four panels, one more on each bar, each one closer on the halo.
const PANELS = [
  { x: 40, y: 40, w: 1100, h: 480, zoom: 1.15 },
  { x: 1164, y: 40, w: 716, h: 480, zoom: 2.0 },
  { x: 40, y: 544, w: 716, h: 496, zoom: 2.7 },
  { x: 780, y: 544, w: 1100, h: 496, zoom: 3.6 },
];

type Rect = { x: number; y: number; w: number; h: number };
// The page with 1, 2, 3 and 4 panels on it: every layout fills the frame; the last one is PANELS.
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
  PANELS,
];
const lerpRect = (a: Rect, b: Rect, u: number): Rect => ({
  x: a.x + (b.x - a.x) * u,
  y: a.y + (b.y - a.y) * u,
  w: a.w + (b.w - a.w) * u,
  h: a.h + (b.h - a.h) * u,
});
// Panel i's rectangle at frame f. On each cue the new panel lands in its place in the next layout (drawn on top) and
// the panels already on the page slide into that layout over 10 frames, so the frame never has a hole.
const panelRect = (i: number, f: number, cues: number[]): Rect => {
  const k = cues.filter((c) => f >= c).length; // panels on the page
  const target = LAYOUTS[k - 1][i];
  if (k < 2 || i === k - 1) return target;
  return lerpRect(
    LAYOUTS[k - 2][i],
    target,
    ramp(f, cues[k - 1], cues[k - 1] + 10),
  );
};

export const HaloPanels: React.FC<PictureProps> = ({ f, palette }) => {
  const cues = [1, 2, 3, 4].map((n) => cueFrame(`bahrain2020.panel${n}`));
  const hb = heartbeat(f);
  return (
    <svg viewBox="0 0 1920 1080" width={1920} height={1080}>
      <defs>
        <ToneDefs prefix="b35" />
        <TonePattern id="b35-soot" r={2.4} gap={6} />
      </defs>
      <rect width={1920} height={1080} fill={INK} />
      {PANELS.map((p, i) => {
        if (f < cues[i]) return null;
        const age = f - cues[i];
        const pop = ramp(age, 0, 8);
        // each panel keeps creeping in while it is on screen
        const zoom = p.zoom * (1 + 0.004 * age);
        // each panel looks at a different part of the cockpit, so the fire in front changes too:
        // the whole cell, the helmet, the front of the halo, then the halo itself
        const look = [
          { dx: 0.4, dy: 0.1 },
          { dx: -0.45, dy: 0.05 },
          { dx: 0.55, dy: -0.12 },
          { dx: 0, dy: 0 },
        ][i];
        const target = {
          x: HALO_WORLD.x + look.dx,
          y: HALO_WORLD.y + look.dy,
          z: HALO_WORLD.z,
        };
        // the page re-lays itself as each panel lands, so the frame is always full
        const r = panelRect(i, f, cues);
        const cam = zoomCam(WRECK_CAM, target, zoom * Math.sqrt(r.w / p.w), {
          x: r.x + r.w * (i % 2 ? 0.45 : 0.55),
          y: r.y + r.h * 0.52,
        });
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
              <WreckWorld
                cam={cam}
                f={f + i * 11}
                fireSeed={`p${i}`}
                palette={palette}
                intensity={[0.8, 0.8, 0.9, 0.5][i]}
                noGlow
                fireDetail={zoom}
                tonePrefix="b35"
              />
              {i === 3 ? <HaloScorch cam={cam} f={f} /> : null}
              {/* newest panel flashes white as it lands */}
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
      <Vignette amount={0.25 + 0.3 * hb} />
    </svg>
  );
};
