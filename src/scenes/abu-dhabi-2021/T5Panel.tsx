// Abu Dhabi 2021, lap 58, T5 hairpin: VER dives down the inside and locks his front-right, HAM holds the outside.
// The settled scene standard (ART-7, docs/shape/references/style-b-manga-v2.png), built from the production kit and car
// library; shot 5.3 of the treatment (bar 89).
//
// `t` animates the panel: seconds after the lock-up. At t = 0 it draws exactly the settled frame (the library still
// and the first frame of shot 5.3); after that the camera tracks the braking cars along the wall, VER slides past on
// the inside trailing smoke, HAM's wheels turn, and the focus lines and lettering shiver.
import { AbsoluteFill } from "remotion";
import { MangaCar, PIRELLI_2021, RB16B, W12, carPoint } from "../../cars";
import { offsetFrom, pinhole } from "../../kit/camera";
import { INK, PAPER } from "../../kit/colors";
import { Ink, InkFilterDef, inkFilter } from "../../kit/ink";
import { Caption, Sfx } from "../../kit/lettering";
import { focusLines, speedLines } from "../../kit/lines";
import { ToneDefs, tone } from "../../kit/tone";
import {
  Background,
  T5_LAYOUT,
  TrackSurface,
  TracksideDefs,
} from "./trackside";

const PANEL = { x: 40, y: 40, w: 1840, h: 1000 };
const INSET = { x: 1290, y: 70, w: 560, h: 330 };

// One camera for the whole panel: 2.9 m up, level, f = 2500 px. HAM is 10 m away on the outside line, VER 12.5 m on the inside.
export const T5_CAM = pinhole({ f: 2500, horizon: 190, cx: 960, height: 2.9 });
const cam = T5_CAM;

// Motion after the lock-up (all zero at t = 0).
const BRAKE = { v0: 50, decel: 7.5 }; // camera tracking speed, m/s, and how fast it bleeds off
export const t5Motion = (t: number) => ({
  camX: BRAKE.v0 * t - 0.5 * BRAKE.decel * t * t,
  verX: -1.8 + 0.85 * t, // VER slides past on the inside
  hamX: -3.24 - 0.3 * t,
  wheel: 540 * t, // stylised wheel turn, degrees (true rate would strobe)
});

// Tyre smoke: a trail of inked puffs growing as they drift back from (x, y). `t` boils them.
export const Puffs: React.FC<{
  x: number;
  y: number;
  n: number;
  step: number;
  grow: number;
  t?: number;
}> = ({ x, y, n, step, grow, t = 0 }) => (
  <g>
    {Array.from({ length: n }, (_, i) => {
      const boil = t === 0 ? 0 : Math.sin(i * 1.7 + t * 9);
      const cx = x - i * step + boil * 3;
      const cy = y - i * 2.4 - (i % 3) * 5 + boil * 2;
      const r = 10 + i * grow + (t === 0 ? 0 : Math.abs(boil) * 2);
      return (
        <g key={i}>
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill={PAPER}
            stroke={INK}
            strokeWidth={2.6}
          />
          <path
            d={`M ${cx - r * 0.2} ${cy + r * 0.9} A ${r} ${r} 0 0 0 ${cx + r * 0.95} ${cy + r * 0.2}`}
            fill="none"
            stroke={tone("mid")}
            strokeWidth={r * 0.3}
          />
        </g>
      );
    })}
  </g>
);

const insetSpokes = (cx: number, cy: number, r: number, n = 10) =>
  Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    return `M ${cx + Math.cos(a) * r * 0.25} ${cy + Math.sin(a) * r * 0.25} L ${cx + Math.cos(a) * r * 0.92} ${cy + Math.sin(a) * r * 0.92}`;
  }).join(" ");

const flick = (t: number, base: number) =>
  t === 0 ? base : base + Math.floor(t * 12);

// Close-up inset: VER's locked front-right tyre smoking.
const Inset: React.FC<{ t: number }> = ({ t }) => {
  const w = { cx: INSET.x + 300, cy: INSET.y + 250, r: 190 };
  const jx = t === 0 ? 0 : Math.sin(t * 47) * 2.5;
  return (
    <g>
      <g clipPath="url(#t5-inset)">
        <rect
          x={INSET.x}
          y={INSET.y}
          width={INSET.w}
          height={INSET.h}
          fill={PAPER}
        />
        <path
          d={focusLines(w.cx, w.cy - 40, 230, 120, flick(t, 9))}
          fill={INK}
        />
        <rect
          x={INSET.x}
          y={w.cy + 140}
          width={INSET.w}
          height={60}
          fill={tone("mid")}
        />
        <g transform={t === 0 ? undefined : `translate(${jx} 0)`}>
          <circle cx={w.cx} cy={w.cy} r={w.r} fill={INK} />
          <circle
            cx={w.cx}
            cy={w.cy}
            r={w.r - 34}
            fill="none"
            stroke={PIRELLI_2021.soft}
            strokeWidth={9}
          />
          <circle
            cx={w.cx}
            cy={w.cy}
            r={104}
            fill={tone("light")}
            stroke={INK}
            strokeWidth={5}
          />
          <path d={insetSpokes(w.cx, w.cy, 104)} stroke={INK} strokeWidth={6} />
          <path
            d={`M ${w.cx - w.r * 0.85} ${w.cy - w.r * 0.35} A ${w.r * 0.92} ${w.r * 0.92} 0 0 1 ${w.cx - w.r * 0.1} ${w.cy - w.r * 0.92}`}
            fill="none"
            stroke={PAPER}
            strokeWidth={9}
            strokeLinecap="round"
          />
        </g>
        <Puffs
          x={w.cx - 140}
          y={w.cy + 150}
          n={8 + Math.floor(t * 2)}
          step={40}
          grow={9}
          t={t}
        />
        {Array.from({ length: 9 }, (_, i) => (
          <Ink
            key={i}
            d={`M ${w.cx + 40 + i * 18} ${w.cy + 180} l ${70 + (i % 3) * 30} ${-20 - (i % 4) * 14}`}
            w={3}
          />
        ))}
      </g>
      <rect
        x={INSET.x}
        y={INSET.y}
        width={INSET.w}
        height={INSET.h}
        fill="none"
        stroke={INK}
        strokeWidth={9}
      />
      <Sfx x={INSET.x + 24 + jx} y={INSET.y + 104} size={92} rotate={-8}>
        SCREECH
      </Sfx>
    </g>
  );
};

// HAM is drawn after VER: nearer the camera, so in front (ART-9).
export const T5Panel: React.FC<{ t?: number }> = ({ t = 0 }) => {
  const m = t5Motion(t);
  const VER = cam.anchor({ x: m.verX - m.camX + m.camX, z: 12.5 });
  const HAM = cam.anchor({ x: m.hamX, z: 10 });
  const VER_LOCKUP = offsetFrom(VER, carPoint(RB16B, "frontContact").x);
  const shake =
    t === 0
      ? undefined
      : `translate(${Math.sin(t * 31) * 3 * Math.exp(-t)} ${Math.cos(t * 27) * 3 * Math.exp(-t)})`;
  const streaks = Math.min(1, t * 5);
  return (
    <AbsoluteFill style={{ backgroundColor: PAPER }}>
      <svg width={1920} height={1080}>
        <defs>
          <ToneDefs />
          <InkFilterDef />
          <clipPath id="t5-panel">
            <rect x={PANEL.x} y={PANEL.y} width={PANEL.w} height={PANEL.h} />
          </clipPath>
          <clipPath id="t5-inset">
            <rect x={INSET.x} y={INSET.y} width={INSET.w} height={INSET.h} />
          </clipPath>
          <TracksideDefs
            cam={cam}
            layout={T5_LAYOUT}
            camX={m.camX}
            prefix="t5"
          />
        </defs>
        <g filter={inkFilter()}>
          <g clipPath="url(#t5-panel)">
            <g transform="rotate(-3 960 540)">
              <Background
                cam={cam}
                layout={T5_LAYOUT}
                camX={m.camX}
                prefix="t5"
              />
              {streaks > 0 ? (
                <path
                  d={speedLines({
                    x: -200,
                    y: -100,
                    w: 2320,
                    h: cam.screenY(0, 25) + 100,
                    n: 70,
                    seed: `t5-${Math.floor(t * 20)}`,
                    angle: 180,
                    thickness: 7,
                    length: [0.2, 0.6],
                  })}
                  fill={PAPER}
                  opacity={0.55 * streaks}
                />
              ) : null}
              <TrackSurface
                cam={cam}
                camX={m.camX}
                prefix="t5"
                focus={{
                  x: VER_LOCKUP.x - 120,
                  y: VER_LOCKUP.y - 60,
                  seed: flick(t, 5),
                }}
              />
              <MangaCar
                car={RB16B}
                at={VER}
                state={{ wheelAngle: 18 + m.wheel, lockFront: 18 }}
              />
              <Puffs
                x={VER_LOCKUP.x - 40}
                y={VER_LOCKUP.y - 12}
                n={13 + Math.floor(t * 3)}
                step={26}
                grow={3.4}
                t={t}
              />
              <MangaCar
                car={W12}
                at={HAM}
                state={{ wheelAngle: 40 + m.wheel }}
              />
            </g>
            <g transform={shake}>
              <Sfx x={640} y={360} size={150} rotate={-10}>
                VROOOM!
              </Sfx>
            </g>
          </g>
          <rect
            x={PANEL.x}
            y={PANEL.y}
            width={PANEL.w}
            height={PANEL.h}
            fill="none"
            stroke={INK}
            strokeWidth={10}
          />
          <Inset t={t} />
          <Caption x={420} y={80} lines={["LAP 58 · TURN 5"]} />
        </g>
      </svg>
    </AbsoluteFill>
  );
};
