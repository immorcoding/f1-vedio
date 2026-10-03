// The wreck after the impact, seen from the track at night (ART-9 pinhole camera): the Haas in two pieces — the
// survival cell, halo up, wedged through the triple guardrail, and the rear (power unit, gearbox, rear wing) torn off on
// the track side — and the fire. Shot 3.4 shows it whole; shot 3.5 pushes in on the halo panel by panel through zoomed
// copies of the same camera; shot 3.6 reuses it behind GRO. No driver injury is ever shown: helmet and halo only.
import { MangaCar, VF20, carLength } from "../../../cars";
import { pinhole, type Camera } from "../../../kit/camera";
import { INK, PAPER } from "../../../kit/colors";
import { Fire, FIRE_PALETTES, type FirePaletteName } from "../../../kit/fire";
import { ToneDefs, TonePattern } from "../../../kit/tone";
import { beatsAtFrame, FRAMES_PER_BEAT } from "../../timing.ts";
import { cueFrame, ramp, shotById, type PictureProps } from "./common";
import { Guardrail, NightBackdrop } from "./night";

// Camera of shot 3.4: 1 m up at the track edge, long lens, looking square at the barrier 13 m away.
export const WRECK_CAM = pinhole({
  f: 2300,
  horizon: 420,
  cx: 960,
  height: 1.0,
});

const BARRIER_Z = 13;
const CELL_Z = 13.6; // the survival cell went through the middle rail: just behind the barrier line
const REAR_Z = 10.4; // the torn-off rear came to rest on the track side
// World x of the intact car's rear end for each piece, set so the cell's nose lands near screen x 260 and the rear
// piece's torn edge near 1250.
const CELL_ANCHOR_X = ((1332 - 960) * CELL_Z) / 2300;
const REAR_ANCHOR_X = ((1787 - 960) * REAR_Z) / 2300;
const L = carLength(VF20);

// The pieces' poses (CarState.split): the cell pushed on 0.4 m and pitched nose-down into the rails; the rear piece
// turned a little on its own wheels.
const CELL_POSE = { dx: 0.4, rotate: -3 };
const REAR_POSE = { rotate: 4 };

// Where the halo is, for the close-ups: the near halo bar's middle, from the trace (photo 880, 515), on the posed cell.
const HALO_FROM_REAR = (VF20.frame.x - 880) / (250 / VF20.frame.k);
const HALO_HEIGHT = (VF20.frame.ground - 515) / (250 / VF20.frame.k);
export const HALO_WORLD = {
  x: CELL_ANCHOR_X - HALO_FROM_REAR - CELL_POSE.dx,
  y: HALO_HEIGHT - 0.12,
  z: CELL_Z,
};

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
}> = ({
  cam,
  f,
  palette,
  intensity,
  tonePrefix,
  behindRails,
  noGlow = false,
}) => {
  const p = noGlow
    ? { ...FIRE_PALETTES[palette], glow: null }
    : FIRE_PALETTES[palette];
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
        seed="wreck-back"
        palette={p}
        intensity={intensity}
      />
      <MangaCar
        car={VF20}
        facing="left"
        at={cellAt}
        state={{ split: { front: CELL_POSE, show: "front" } }}
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
          seed={`wreck-front${k}`}
          palette={p}
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
        seed="wreck-gap"
        palette={p}
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
  const intensity = 0.25 + 0.75 * ramp(t, 0, 112);
  const hb = heartbeat(f);
  const push = 1 + 0.03 * (t / (shot.to - shot.from)) + 0.012 * hb;
  return (
    <svg viewBox="0 0 1920 1080" width={1920} height={1080}>
      <defs>
        <ToneDefs prefix="b34" />
      </defs>
      <g transform={`translate(960 540) scale(${push}) translate(-960 -540)`}>
        <WreckWorld
          cam={WRECK_CAM}
          f={f}
          palette={palette}
          intensity={intensity}
          tonePrefix="b34"
        />
      </g>
      <Vignette amount={0.55 + 0.35 * hb} />
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
  { x: 40, y: 40, w: 1100, h: 480, zoom: 1.4 },
  { x: 1164, y: 40, w: 716, h: 480, zoom: 2.0 },
  { x: 40, y: 544, w: 716, h: 496, zoom: 2.7 },
  { x: 780, y: 544, w: 1100, h: 496, zoom: 3.6 },
];

export const HaloPanels: React.FC<PictureProps> = ({ f, palette }) => {
  const cues = [1, 2, 3, 4].map((n) => cueFrame(`bahrain2020.panel${n}`));
  const hb = heartbeat(f);
  return (
    <svg viewBox="0 0 1920 1080" width={1920} height={1080}>
      <defs>
        <ToneDefs prefix="b35" />
        <TonePattern id="b35-soot" r={2.4} gap={6} />
        {PANELS.map((p, i) => (
          <clipPath key={i} id={`b35-p${i}`}>
            <rect x={p.x} y={p.y} width={p.w} height={p.h} />
          </clipPath>
        ))}
      </defs>
      <rect width={1920} height={1080} fill={INK} />
      {PANELS.map((p, i) => {
        if (f < cues[i]) return null;
        const age = f - cues[i];
        const pop = ramp(age, 0, 8);
        // each panel keeps creeping in while it is on screen
        const zoom = p.zoom * (1 + 0.004 * age);
        const cam = zoomCam(WRECK_CAM, HALO_WORLD, zoom, {
          x: p.x + p.w * (i % 2 ? 0.45 : 0.55),
          y: p.y + p.h * 0.52,
        });
        return (
          <g
            key={i}
            opacity={pop}
            transform={`translate(${p.x + p.w / 2} ${p.y + p.h / 2}) scale(${0.94 + 0.06 * pop}) translate(${-p.x - p.w / 2} ${-p.y - p.h / 2})`}
          >
            <g clipPath={`url(#b35-p${i})`}>
              <WreckWorld
                cam={cam}
                f={f + i * 5}
                palette={palette}
                intensity={i === 3 ? 0.55 : 1}
                noGlow
                tonePrefix="b35"
              />
              {i === 3 ? <HaloScorch cam={cam} f={f} /> : null}
              {/* newest panel flashes white as it lands */}
              <rect
                x={p.x}
                y={p.y}
                width={p.w}
                height={p.h}
                fill={PAPER}
                opacity={0.8 * (1 - ramp(age, 0, 5))}
              />
            </g>
            <rect
              x={p.x}
              y={p.y}
              width={p.w}
              height={p.h}
              fill="none"
              stroke={PAPER}
              strokeWidth={10}
            />
            <rect
              x={p.x}
              y={p.y}
              width={p.w}
              height={p.h}
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
