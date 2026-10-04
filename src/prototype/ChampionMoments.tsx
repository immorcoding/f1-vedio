// PROTOTYPE (throwaway): do the drawn "who won the title" moments of Suzuka 1989, Suzuka 1990 and Brazil 2008 work
// better in the visual language of the Abu Dhabi champion card (src/mv/parts/abuDhabi2021/ChampionCard.tsx)?
// Each clip is one 2-bar manga page: the champion's helmet huge in a panel with focus lines and screentone, and beside it
// the card's big italic Arial Black lines (paper fill, ink stroke, slight rotation) slamming in one per beat of the
// first bar, oversize → settled in 0.12 s; the second bar holds with a slow push-in. A corner inset gives the reason:
// 1989 SEN's helmet under a red "取消成绩" stamp, 1990 PRO's helmet crossed out, 2008 the 98 · 97 score.
// The score plays from the bar where the moment would sit in the MV, so the slams land on real beats.
import { Audio } from "@remotion/media";
import { Easing, staticFile, useCurrentFrame } from "remotion";
import {
  CarInPhotoSpace,
  F641_PRO,
  MP4_23,
  MP4_5_PRO,
  MP4_5_SEN,
  MP4_5B_SEN,
  type CarSpec,
} from "../cars";
import { INK, PAPER } from "../kit/colors";
import { InkFilterDef, inkFilter } from "../kit/ink";
import { BRUSH_FONT } from "../kit/lettering";
import { focusLines, speedLines } from "../kit/lines";
import { ToneDefs, tone } from "../kit/tone";
import { SCORE } from "../mv/MV";
import { at, FPS, frameAt, framesBetween, type Pos } from "../mv/timing";

export type ChampionMoment = "1989" | "1990" | "2008";

type Moment = {
  bar: number; // the bar of the song where the moment would sit in the MV
  champion: CarSpec;
  helmetY: number; // screen y of the champion's helmet centre (the 2008 cockpit hides its lower half, so it sits lower)
  lines: readonly [string, string, string, string];
};

const MOMENTS: Record<ChampionMoment, Moment> = {
  "1989": {
    bar: 20,
    champion: MP4_5_PRO,
    helmetY: 400,
    lines: ["ALAIN PROST", "1989", "WORLD", "CHAMPION"],
  },
  "1990": {
    bar: 31,
    champion: MP4_5B_SEN,
    helmetY: 400,
    lines: ["AYRTON SENNA", "1990", "WORLD", "CHAMPION"],
  },
  "2008": {
    bar: 53,
    champion: MP4_23,
    helmetY: 470,
    lines: ["LEWIS HAMILTON", "2008", "WORLD", "CHAMPION"],
  },
};

// Two bars, the same for every clip (225 frames at 128 BPM).
export const CHAMPION_CLIP_FRAMES = framesBetween(at(1), at(3));

const ARIAL_BLACK = "Arial Black, Arial, sans-serif";
const STAMP_RED = "#d62a1e";

// Line layout in the text panel, like the card: name small, then the big words. All lines share one width.
const TEXT_X = 1480;
const TEXT_W = 690;
const LINE_STYLE = [
  { y: 290, fs: 74, sw: 10 },
  { y: 520, fs: 210, sw: 16 },
  { y: 715, fs: 150, sw: 14 },
  { y: 870, fs: 118, sw: 14 },
];

// Panels inside the page frame.
const HELMET_PANEL = { x: 44, y: 44, w: 1016, h: 992 };
const TEXT_PANEL = { x: 1084, y: 44, w: 792, h: 992 };
const INSET = { x: 76, y: 742, w: 420, h: 262 };
// The champion's helmet: centre on screen and drawn radius.
const HELMET = { x: 440, r: 205 };

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const smooth = (v: number) => {
  const x = clamp01(v);
  return x * x * (3 - 2 * x);
};

// The card's slam: oversize and transparent → settled in ~0.12 s, with a small overshoot.
const slam = (since: number) => {
  const u = Math.min(1, since / 0.12);
  return {
    s: 1.35 - 0.35 * Easing.out(Easing.back(2))(u),
    o: Math.min(1, (since * FPS) / 3),
  };
};

// A car's helmet at screen (x, y) with radius r, cut from the side view (photo space). `flip` turns it to face right.
const HelmetArt: React.FC<{
  car: CarSpec;
  x: number;
  y: number;
  r: number;
  flip?: boolean;
}> = ({ car, x, y, r, flip = false }) => {
  const h = car.helmetAt;
  const k = r / h.r;
  return (
    <g
      transform={`translate(${x} ${y}) scale(${flip ? -k : k} ${k}) translate(${-h.cx} ${-h.cy})`}
    >
      <CarInPhotoSpace car={car} />
    </g>
  );
};

type Box = { x: number; y: number; w: number; h: number };

const Frame: React.FC<{ box: Box; w?: number }> = ({ box, w = 10 }) => (
  <rect
    x={box.x}
    y={box.y}
    width={box.w}
    height={box.h}
    fill="none"
    stroke={INK}
    strokeWidth={w}
  />
);

// Corner inset, 1989: SEN's helmet, his result cancelled by a red stamp.
const Inset1989: React.FC<{ stamp: { s: number; o: number } }> = ({
  stamp,
}) => {
  const cx = INSET.x + INSET.w / 2;
  const sy = INSET.y + INSET.h - 58;
  return (
    <g>
      <rect {...box(INSET)} fill={tone("mid")} />
      <HelmetArt car={MP4_5_SEN} x={cx + 10} y={INSET.y + 84} r={62} />
      <g
        opacity={stamp.o}
        transform={`translate(${cx} ${sy}) rotate(-8) scale(${stamp.s})`}
      >
        <rect
          x={-180}
          y={-42}
          width={360}
          height={84}
          rx={10}
          fill={PAPER}
          stroke={STAMP_RED}
          strokeWidth={7}
        />
        <rect
          x={-170}
          y={-32}
          width={340}
          height={64}
          rx={6}
          fill="none"
          stroke={STAMP_RED}
          strokeWidth={2.5}
        />
        <text
          x={0}
          y={19}
          textAnchor="middle"
          fontFamily={BRUSH_FONT}
          fontSize={54}
          fill={STAMP_RED}
        >
          SEN 取消成绩
        </text>
      </g>
    </g>
  );
};

// Corner inset, 1990: PRO's helmet (Ferrari, 1990) crossed out with a brushed manga X.
const Inset1990: React.FC<{ x: number }> = ({ x }) => {
  const cx = INSET.x + INSET.w / 2 + 20;
  const cy = INSET.y + INSET.h / 2 + 6;
  const a = 112 * clamp01(x * 2);
  const b = 112 * clamp01(x * 2 - 1);
  const stroke = (dx: number, len: number) =>
    `M ${cx - dx * 96} ${cy - 80} L ${cx - dx * 96 + dx * len * (192 / 112)} ${cy - 80 + len * (160 / 112)}`;
  return (
    <g>
      <rect {...box(INSET)} fill={tone("mid")} />
      <HelmetArt car={F641_PRO} x={cx} y={cy + 4} r={86} />
      {a > 0 ? (
        <g strokeLinecap="round" fill="none">
          <path d={stroke(1, a)} stroke={PAPER} strokeWidth={42} />
          {b > 0 ? (
            <path d={stroke(-1, b)} stroke={PAPER} strokeWidth={42} />
          ) : null}
          <path d={stroke(1, a)} stroke={INK} strokeWidth={26} />
          {b > 0 ? (
            <path d={stroke(-1, b)} stroke={INK} strokeWidth={26} />
          ) : null}
        </g>
      ) : null}
      <text
        x={INSET.x + 20}
        y={INSET.y + 48}
        fontFamily={ARIAL_BLACK}
        fontWeight={900}
        fontStyle="italic"
        fontSize={34}
        fill={PAPER}
        stroke={INK}
        strokeWidth={7}
        paintOrder="stroke"
      >
        PRO
      </text>
    </g>
  );
};

// Corner inset, 2008: the final points, HAM 98 · MAS 97.
const Inset2008: React.FC<{ hit: { s: number; o: number } }> = ({ hit }) => {
  const cx = INSET.x + INSET.w / 2;
  return (
    <g>
      <rect {...box(INSET)} fill={PAPER} />
      <g
        opacity={hit.o}
        transform={`translate(${cx} ${INSET.y + 150}) scale(${hit.s}) translate(${-cx} ${-(INSET.y + 150)})`}
      >
        <text
          x={cx}
          y={INSET.y + 182}
          textAnchor="middle"
          textLength={360}
          lengthAdjust="spacingAndGlyphs"
          fontFamily={ARIAL_BLACK}
          fontWeight={900}
          fontStyle="italic"
          fontSize={150}
          fill={INK}
        >
          98 · 97
        </text>
      </g>
      {[
        { x: cx - 110, t: "HAM" },
        { x: cx + 110, t: "MAS" },
      ].map((d) => (
        <text
          key={d.t}
          x={d.x}
          y={INSET.y + 236}
          textAnchor="middle"
          fontFamily={ARIAL_BLACK}
          fontWeight={900}
          fontStyle="italic"
          fontSize={34}
          fill={INK}
        >
          {d.t}
        </text>
      ))}
    </g>
  );
};

const box = (b: Box) => ({ x: b.x, y: b.y, width: b.w, height: b.h });

export const ChampionMoments: React.FC<{ moment: ChampionMoment }> = ({
  moment,
}) => {
  const frame = useCurrentFrame();
  const m = MOMENTS[moment];
  const start = frameAt(at(m.bar));
  // seconds since a beat of the clip's first bar (negative before it)
  const sinceBeat = (p: Pos) => (frame - (frameAt(p) - start)) / FPS;
  const bar2 = sinceBeat(at(m.bar + 1));
  const barLen = (frameAt(at(m.bar + 2)) - frameAt(at(m.bar + 1))) / FPS;
  // the held second bar: a slow push-in on the whole page
  const push = 1 + 0.045 * smooth(bar2 / barLen);
  // each slam kicks the page a little, decaying fast
  let kick = 0;
  for (let b = 1; b <= 4; b++) {
    const s = sinceBeat(at(m.bar, b));
    if (s >= 0) kick += Math.exp(-s / 0.07) * (b >= 3 ? 1.4 : 1);
  }
  const shakeX = kick * 7 * Math.sin(frame * 2.3);
  const shakeY = kick * 5 * Math.cos(frame * 3.1);
  const flicker = Math.floor(frame / 5);
  const accent = slam(sinceBeat(at(m.bar, 1)));
  const xDraw = smooth(sinceBeat(at(m.bar, 1)) / 0.25);
  return (
    <>
      <svg width={1920} height={1080} style={{ position: "absolute" }}>
        <defs>
          <ToneDefs />
          <InkFilterDef />
          <clipPath id="cm-helmet-panel">
            <rect {...box(HELMET_PANEL)} />
          </clipPath>
          <clipPath id="cm-text-panel">
            <rect {...box(TEXT_PANEL)} />
          </clipPath>
          <clipPath id="cm-inset">
            <rect {...box(INSET)} />
          </clipPath>
        </defs>
        <rect width={1920} height={1080} fill={PAPER} />
        <g
          transform={`translate(${shakeX} ${shakeY}) translate(960 540) scale(${push}) translate(-960 -540)`}
        >
          <g filter={inkFilter()}>
            {/* the champion's panel: screentone, focus lines on the helmet, the helmet facing the title */}
            <g clipPath="url(#cm-helmet-panel)">
              <rect {...box(HELMET_PANEL)} fill={tone("light")} />
              <path
                d={focusLines(
                  HELMET.x,
                  m.helmetY,
                  HELMET.r + 70,
                  120,
                  3 + (flicker % 5),
                )}
                fill={INK}
                opacity={0.9}
              />
              <HelmetArt
                car={m.champion}
                x={HELMET.x}
                y={m.helmetY}
                r={HELMET.r}
                flip
              />
            </g>
            <Frame box={HELMET_PANEL} />
            {/* the corner inset: the reason, in a small panel of its own */}
            <rect
              x={INSET.x + 12}
              y={INSET.y + 12}
              width={INSET.w}
              height={INSET.h}
              fill={INK}
            />
            <g clipPath="url(#cm-inset)">
              {moment === "1989" ? <Inset1989 stamp={accent} /> : null}
              {moment === "1990" ? <Inset1990 x={xDraw} /> : null}
              {moment === "2008" ? <Inset2008 hit={accent} /> : null}
            </g>
            <Frame box={INSET} w={9} />
            {/* the text panel: black, paper speed streaks running up toward the title */}
            <g clipPath="url(#cm-text-panel)">
              <rect {...box(TEXT_PANEL)} fill={INK} />
              <path
                d={speedLines({
                  x: TEXT_PANEL.x - 200,
                  y: TEXT_PANEL.y - 100,
                  w: TEXT_PANEL.w + 400,
                  h: TEXT_PANEL.h + 200,
                  angle: -93,
                  n: 70,
                  seed: `cm-${moment}-${Math.floor(frame / 3)}`,
                  thickness: 5,
                })}
                fill={PAPER}
                opacity={0.18}
              />
            </g>
            <Frame box={TEXT_PANEL} />
          </g>
          {/* the title, slammed in one line per beat of the first bar (as on the Abu Dhabi card) */}
          <g transform={`rotate(-3 ${TEXT_X} 580)`}>
            {m.lines.map((line, i) => {
              const since = sinceBeat(at(m.bar, i + 1));
              if (since < 0) return null;
              const { s, o } = slam(since);
              const { y, fs, sw } = LINE_STYLE[i];
              const oy = y - fs / 3;
              return (
                <text
                  key={line}
                  x={TEXT_X}
                  y={y}
                  textAnchor="middle"
                  textLength={TEXT_W}
                  lengthAdjust="spacingAndGlyphs"
                  fontFamily={ARIAL_BLACK}
                  fontWeight={900}
                  fontStyle="italic"
                  fontSize={fs}
                  fill={PAPER}
                  stroke={INK}
                  strokeWidth={sw}
                  paintOrder="stroke"
                  opacity={o}
                  transform={`translate(${TEXT_X} ${oy}) scale(${s}) translate(${-TEXT_X} ${-oy})`}
                >
                  {line}
                </text>
              );
            })}
          </g>
        </g>
        {/* the heavy page frame of the card */}
        <rect
          x={20}
          y={20}
          width={1880}
          height={1040}
          fill="none"
          stroke={INK}
          strokeWidth={12}
        />
        {/* a paper flash on each slam, very short */}
        <rect
          width={1920}
          height={1080}
          fill={PAPER}
          opacity={Math.min(0.25, kick * 0.12)}
        />
      </svg>
      <Audio src={staticFile(SCORE)} trimBefore={frameAt(at(m.bar))} />
    </>
  );
};
