// Intro (bars 1–8): the start-light gantry is inked onto a black page, its tones fade in,
// then the five red lights come on with the five hits. Lights out is the cut at 9.1.
// The first frame already shows the whole gantry in the middle of the frame (#24: no black opening, and frame 0 is
// the video's thumbnail): a faint pencil underdrawing of all of it, the five modules and the truss already part-inked
// over it and the screentone coming up. Through bars 1–4 the ink finishes the modules, the truss, rail and hangers,
// then the twenty lamps one after another; the pencil fades as the ink covers it.
// Gantry layout after the FIA start lights (5 columns × 4 lamps: amber, green, red, red;
// a "light" is one column's red pair) — see docs/assets/reference-register.md.
import { AbsoluteFill, Easing } from "remotion";
import { useSongFrame } from "../../clock";
import type { SceneProps } from "../../scenes";
import { frameAt } from "../../timing.ts";
import { EDIT } from "./shots.ts";
import { Lamp as SignalLamp, type LampPaint } from "../../../kit/lamp";
import {
  BLACK,
  circlePath,
  DrawPath,
  focusLines,
  ramp,
  Tone,
  WHITE,
} from "./ink";

const LAMP_R = 66;
const RED = "#e3101a"; // LED red of the FIA start lights
const RED_DARK = "#7a0008";
const HOT = "#fff1e6";
const COLS = [0, 1, 2, 3, 4].map((c) => 960 + (c - 2) * 236);
const ROWS = [300, 470, 640, 810];
const RED_ROWS = [2, 3];
const MODULE = { halfW: 102, top: 200, bottom: 902, r: 20 };
const RAIL = { y: 168, h: 24, x0: 410, x1: 1510 };
const BEAM = { y0: -70, y1: 30 };
const HANGERS = [560, 1360];

const cueFrame = (id: string) => {
  for (const s of EDIT.shots)
    for (const c of s.cues ?? []) if (c.id === id) return frameAt(c.at);
  throw new Error(`intro: no cue ${id}`);
};
const LIGHTS = [1, 2, 3, 4, 5].map((k) => cueFrame(`intro.light${k}`));
const SHOT_2 = frameAt(EDIT.shots[1].from);

/** Ink draw-in that is already `at0` drawn on the first frame and complete at frame `end`. */
const inkIn = (f: number, end: number, at0: number) =>
  at0 + (1 - at0) * ramp(f, 0, end, Easing.out(Easing.cubic));
// The draw-in schedule (song frames; a bar is 112.5): what is inked on frame 0 and when each part is finished.
const INK = {
  truss: { end: 170, at0: 0.35 },
  hanger: (i: number) => ({ end: 150 + i * 20, at0: 0.2 }),
  rail: { end: 180, at0: 0.3 },
  module: (c: number) => ({ end: 120 + c * 24, at0: 0.42 - 0.04 * c }),
  /** Lamps, one after another (order = column × 4 + row), the last finishing just before bar 5. */
  lamp: (order: number) => [26 + order * 17, 100 + order * 17] as const,
};
/** The pencil underdrawing: as strong as this on frame 0, gone once the ink and tones are complete. */
const SKETCH = { opacity: 0.5, fadeFrom: 260, fadeTo: 440 };

const roundRect = (x0: number, y0: number, x1: number, y1: number, r: number) =>
  `M ${x0 + r} ${y0} L ${x1 - r} ${y0} Q ${x1} ${y0} ${x1} ${y0 + r} L ${x1} ${y1 - r} Q ${x1} ${y1} ${x1 - r} ${y1} L ${x0 + r} ${y1} Q ${x0} ${y1} ${x0} ${y1 - r} L ${x0} ${y0 + r} Q ${x0} ${y0} ${x0 + r} ${y0} Z`;

const beamTruss = () => {
  let d = `M -400 ${BEAM.y0} L 2320 ${BEAM.y0} M -400 ${BEAM.y1} L 2320 ${BEAM.y1}`;
  for (let x = -400; x < 2320; x += 100)
    d += ` M ${x} ${BEAM.y1} L ${x + 50} ${BEAM.y0} L ${x + 100} ${BEAM.y1}`;
  return d;
};

// Camera: a wide framing for 0.1 that creeps in, then a cut to the red rows for 0.2.
// Each light gives the frame a punch and a short shake that settle within a beat.
const camera = (f: number) => {
  let scale: number;
  let cy: number;
  if (f < SHOT_2) {
    const t = f / SHOT_2;
    scale = 0.9 + 0.08 * t;
    cy = 500;
  } else {
    const t = (f - SHOT_2) / (frameAt(EDIT.shots[1].to) - SHOT_2);
    scale = 1.3 + 0.1 * t;
    cy = 690 - 20 * t;
  }
  let dx = 0;
  let dy = 0;
  LIGHTS.forEach((lf, i) => {
    if (f < lf) return;
    const k = Math.exp(-(f - lf) / 6);
    scale *= 1 + (0.018 + 0.006 * i) * k;
    dx += (5 + 2 * i) * k * Math.sin((f - lf) * 2.3);
    dy += (3 + i) * k * Math.cos((f - lf) * 1.9);
  });
  return `translate(${960 + dx} ${540 + dy}) scale(${scale}) translate(-960 ${-cy})`;
};

// A lit lamp is a flat block of the lamp's real red (ART-8) with a white-hot core, a dark-red
// screentone on its lower rim, and, for a moment after it switches on, a burst of ink ticks.
// The drawing is the shared one in src/kit/lamp.tsx (4.3's safety-car lamps rhyme with it).
const PAINT: LampPaint = {
  lit: RED,
  hot: HOT,
  bloom: "url(#intro-bloom)",
  litTone: "url(#intro-tone-red)",
  midTone: "url(#intro-tone-mid)",
  darkTone: "url(#intro-tone-dark)",
  line: WHITE,
  glass: BLACK,
};

const Lamp: React.FC<{
  x: number;
  y: number;
  draw: number;
  tone: number;
  on: number;
  age: number;
}> = (p) => <SignalLamp {...p} r={LAMP_R} paint={PAINT} />;

export type GantryProps = {
  /** Frames into the ink draw-in (the intro's song frame; complete by ~450). */
  draw: number;
  /** 0–1 screentone fade-in. */
  tone: number;
  /** Per column: 0 = dark, ≥ 1 = lit (above 1 for the flash as it switches on). */
  lit: readonly number[];
  /** Per column: frames since its light came on (for the tick burst). */
  age: readonly number[];
  /** SVG transform of the whole gantry (the camera). */
  cam: string;
  /** Opacity of the white focus lines behind the gantry, and their animation frame. */
  focus: number;
  focusFrame: number;
  /** Opacity of the pencil underdrawing (0 = none). */
  sketch?: number;
};

// The whole gantry as thin pencil lines, under the ink: what the page shows before the ink reaches it.
const SKETCH_LINES = [
  beamTruss(),
  ...HANGERS.map(
    (x) =>
      `M ${x - 16} ${BEAM.y1} L ${x - 16} ${RAIL.y} M ${x + 16} ${BEAM.y1} L ${x + 16} ${RAIL.y}`,
  ),
  roundRect(RAIL.x0, RAIL.y, RAIL.x1, RAIL.y + RAIL.h, 6),
  ...COLS.flatMap((x) => [
    roundRect(
      x - MODULE.halfW,
      MODULE.top,
      x + MODULE.halfW,
      MODULE.bottom,
      MODULE.r,
    ),
    `M ${x - MODULE.halfW} ${(ROWS[1] + ROWS[2]) / 2} L ${x + MODULE.halfW} ${(ROWS[1] + ROWS[2]) / 2}`,
    ...ROWS.flatMap((y) => [
      circlePath(x, y, LAMP_R + 14),
      circlePath(x, y, LAMP_R),
    ]),
  ]),
].join(" ");

// The gantry itself, drawn on a black page (exported; the outro no longer uses it since it ends on the chequered flag).
export const GantryArt: React.FC<GantryProps> = ({
  draw: f,
  tone,
  lit,
  age,
  cam,
  focus,
  focusFrame,
  sketch = 0,
}) => {
  const litCount = lit.filter((l) => l > 0).length;
  return (
    <svg viewBox="0 0 1920 1080" width={1920} height={1080}>
      <defs>
        <Tone id="intro-tone-light" r={1.0} />
        <Tone id="intro-tone-mid" r={1.7} />
        <Tone id="intro-tone-dark" r={2.5} />
        <Tone id="intro-tone-red" r={2.3} color={RED_DARK} gap={6} />
        <radialGradient id="intro-bloom">
          <stop offset="0%" stopColor={RED} stopOpacity={0.8} />
          <stop offset="45%" stopColor={RED} stopOpacity={0.25} />
          <stop offset="100%" stopColor={RED} stopOpacity={0} />
        </radialGradient>
        <radialGradient id="intro-spill">
          <stop offset="0%" stopColor={RED} stopOpacity={0.35} />
          <stop offset="100%" stopColor={RED} stopOpacity={0} />
        </radialGradient>
      </defs>

      {focus > 0 ? (
        <path
          d={focusLines(960, 725, 560, 150, Math.floor(focusFrame / 3))}
          fill={WHITE}
          opacity={focus}
        />
      ) : null}

      <g transform={cam}>
        {/* red spill on the gantry, growing with each light */}
        <ellipse
          cx={960}
          cy={725}
          rx={900}
          ry={420}
          fill="url(#intro-spill)"
          opacity={litCount / 5}
        />

        {/* overhead beam (truss) and the two hangers */}
        <rect
          x={-400}
          y={BEAM.y0}
          width={2720}
          height={BEAM.y1 - BEAM.y0}
          fill="url(#intro-tone-light)"
          opacity={tone * 0.8}
        />
        <DrawPath
          d={beamTruss()}
          progress={inkIn(f, INK.truss.end, INK.truss.at0)}
          width={3}
        />
        {HANGERS.map((x, i) => (
          <g key={x}>
            <rect
              x={x - 16}
              y={BEAM.y1}
              width={32}
              height={RAIL.y - BEAM.y1}
              fill="url(#intro-tone-mid)"
              opacity={tone}
            />
            <DrawPath
              d={`M ${x - 16} ${BEAM.y1} L ${x - 16} ${RAIL.y} M ${x + 16} ${BEAM.y1} L ${x + 16} ${RAIL.y}`}
              progress={inkIn(f, INK.hanger(i).end, INK.hanger(i).at0)}
              width={3}
            />
          </g>
        ))}
        {/* rail the five modules hang from */}
        <rect
          x={RAIL.x0}
          y={RAIL.y}
          width={RAIL.x1 - RAIL.x0}
          height={RAIL.h}
          fill="url(#intro-tone-mid)"
          opacity={tone}
        />
        <DrawPath
          d={roundRect(RAIL.x0, RAIL.y, RAIL.x1, RAIL.y + RAIL.h, 6)}
          progress={inkIn(f, INK.rail.end, INK.rail.at0)}
          width={3}
        />

        {COLS.map((x, c) => {
          const drawModule = inkIn(f, INK.module(c).end, INK.module(c).at0);
          return (
            <g key={x}>
              <path
                d={roundRect(
                  x - MODULE.halfW,
                  MODULE.top,
                  x + MODULE.halfW,
                  MODULE.bottom,
                  MODULE.r,
                )}
                fill={BLACK}
              />
              <path
                d={roundRect(
                  x - MODULE.halfW,
                  MODULE.top,
                  x + MODULE.halfW,
                  MODULE.bottom,
                  MODULE.r,
                )}
                fill="url(#intro-tone-light)"
                opacity={tone * 0.9}
              />
              <DrawPath
                d={roundRect(
                  x - MODULE.halfW,
                  MODULE.top,
                  x + MODULE.halfW,
                  MODULE.bottom,
                  MODULE.r,
                )}
                progress={drawModule}
                width={4.5}
              />
              {/* the one panel seam each module has, between the signal lamps and the red pair */}
              <DrawPath
                d={`M ${x - MODULE.halfW} ${(ROWS[1] + ROWS[2]) / 2} L ${x + MODULE.halfW} ${(ROWS[1] + ROWS[2]) / 2}`}
                progress={drawModule}
                width={2}
                opacity={0.7}
              />
              {ROWS.map((y, r) => {
                const order = c * 4 + r;
                return (
                  <Lamp
                    key={y}
                    x={x}
                    y={y}
                    draw={ramp(f, ...INK.lamp(order))}
                    tone={tone}
                    on={RED_ROWS.includes(r) ? lit[c] : 0}
                    age={age[c]}
                  />
                );
              })}
            </g>
          );
        })}

        {/* the pencil underdrawing, over the black module and lens fills; the white ink covers it where it lands */}
        {sketch > 0 ? (
          <path
            d={SKETCH_LINES}
            fill="none"
            stroke={WHITE}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={sketch}
          />
        ) : null}
      </g>
    </svg>
  );
};

export const Scene: React.FC<SceneProps> = ({ part }) => {
  const f = useSongFrame(part);
  const lit = LIGHTS.map((lf) =>
    f >= lf ? 1 + 0.7 * Math.exp(-(f - lf) / 4) : 0,
  );
  // the tones are already coming up on the first frame and full before the first light (bar 5)
  const tone =
    0.35 + 0.65 * ramp(f, 0, frameAt({ bar: 5, beat: 1 }) - 10, Easing.linear);
  const sketch =
    SKETCH.opacity * (1 - ramp(f, SKETCH.fadeFrom, SKETCH.fadeTo, Easing.linear));
  const last = LIGHTS[4];
  const focus = f >= last ? 0.28 + 0.45 * Math.exp(-(f - last) / 8) : 0;

  return (
    <AbsoluteFill style={{ backgroundColor: BLACK }}>
      <GantryArt
        draw={f}
        tone={tone}
        lit={lit}
        age={LIGHTS.map((lf) => f - lf)}
        cam={camera(f)}
        focus={focus}
        focusFrame={f}
        sketch={sketch}
      />
    </AbsoluteFill>
  );
};

/** The lights' punch-and-shake for a camera at `scale`, framing world y `cy` (the intro's 0.2 look), given each
 *  light's switch-on frame (frames since, negative before). */
export const gantryCamera = (
  scale: number,
  cy: number,
  since: readonly number[],
) => {
  let s = scale;
  let dx = 0;
  let dy = 0;
  since.forEach((a, i) => {
    if (a < 0) return;
    const k = Math.exp(-a / 6);
    s *= 1 + (0.018 + 0.006 * i) * k;
    dx += (5 + 2 * i) * k * Math.sin(a * 2.3);
    dy += (3 + i) * k * Math.cos(a * 1.9);
  });
  return `translate(${960 + dx} ${540 + dy}) scale(${s}) translate(-960 ${-cy})`;
};
