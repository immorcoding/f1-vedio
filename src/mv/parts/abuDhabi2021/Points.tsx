// Shot 5.7 (bars 102–103): the final points, a new page (review-1: not 4.2's cockpit face-off again). Two stacked
// panels on a diagonal gutter. On top, wide, is VER's helmet, lit by focus lines. Below, smaller, is HAM's helmet
// under a screen of tone that thickens. The racing is over, so there are no speed lines.
// The drums do not stop here (review-2: the v1 score keeps the drop's kick on every beat, clap and snare on 2 and 4),
// so the page is cut to them (MOT-6, #28): every kick shakes the page lightly and re-draws the focus lines; the
// accents sit on the real hits only. 102.1 (`abuDhabi2021.points`, the cut, boom and crash): the points box slams
// onto the gutter, 395.5 VS 387.5 (facts.md), the lower panel still empty paper. 102.2 (snare,
// `abuDhabi2021.pointsGold`): VER's 395.5 takes the gold stroke, a champion's score like Brazil's 98 on 2.7 (the
// user, 2026-10-04; ART-8). 102.3 (kick, `abuDhabi2021.hamPanel`): HAM's panel slams up from below. 102.4 and 103.2
// (snares): VER punches in a step; on 103.2 HAM's tone darkens a step. 103.3 (kick) is left quiet for HAM's panel
// (#32): on its kick the ghost of a championship trophy engraved "8" flashes up in the empty space ahead of HAM, the
// record eighth title he is losing (facts.md; no caption, the 8 is the only text), and fades into the tone before
// 103.4 (`abuDhabi2021.hamGhost`). 103.4 (snare, `abuDhabi2021.verPush`): the last punch on VER and the tone swallows
// HAM, and the push keeps accelerating into the cut to 5.8 (MOT-8). The helmets sit at opposite ends of the diagonal
// so the box covers neither (ART-14).
import {
  MangaCar,
  PIRELLI_2021,
  RB16B,
  W12,
  type CarSpec,
} from "../../../cars";
import { INK, PAPER } from "../../../kit/colors";
import { InkFilterDef, inkFilter } from "../../../kit/ink";
import { CAPTION_FONT, TITLE_FONT, useLettering } from "../../../kit/lettering";
import { focusLines } from "../../../kit/lines";
import { PointsBox } from "../../../kit/points-box";
import { ToneDefs, tone } from "../../../kit/tone";
import { helmetAnchor } from "../../../scenes/abu-dhabi-2021/Faceoff";
import { scoreColumns } from "../../points";
import { EDIT } from "./shots.ts";
import { Easing } from "remotion";
import { at, type Pos } from "../../timing.ts";
import { cueAt, hit, ramp, secondsInShot, type ShotTime } from "./shotClock";

const TOP = "M 30 30 L 1890 30 L 1890 540 L 30 660 Z";
const BOTTOM = "M 30 690 L 1890 570 L 1890 1050 L 30 1050 Z";
const BOX = { x: 960, y: 610, size: 170 };

const HelmetPanel: React.FC<{
  id: string;
  poly: string;
  car: CarSpec;
  compound: string;
  helmet: { x: number; y: number };
  ppm: number;
  /** Focus-line pattern: a new one on every kick. */
  seed: number;
  /** Extra focus-line strength (a kick's flash). */
  flash: number;
  /** 0..1: tone laid over the panel (the one who lost recedes). */
  dim: number;
  tag: string;
  tagAt: { x: number; y: number };
  /** Drawn over the panel's tone, under its tag (the ghost of the eighth title's trophy). */
  children?: React.ReactNode;
}> = ({ id, poly, car, compound, helmet, ppm, seed, flash, dim, tag, tagAt, children }) => (
  <g>
    <defs>
      <clipPath id={id}>
        <path d={poly} />
      </clipPath>
    </defs>
    <g clipPath={`url(#${id})`}>
      <rect x={0} y={0} width={1920} height={1080} fill={INK} />
      <path d={focusLines(helmet.x, helmet.y, 300, 120, seed + (tag === "VER" ? 0 : 40))} fill={PAPER} opacity={Math.min(0.8, 0.45 - 0.3 * dim + flash)} />
      <MangaCar car={car} at={helmetAnchor(car, helmet.x, helmet.y, ppm)} state={{ wheelAngle: 0, compound, farSide: "low" }} />
      {dim > 0 ? <rect x={0} y={0} width={1920} height={1080} fill={tone("dark")} opacity={dim} /> : null}
      {children}
      <g transform={`translate(${tagAt.x} ${tagAt.y}) rotate(-4)`}>
        <rect x={-70} y={-34} width={140} height={68} fill={tag === "VER" ? INK : PAPER} stroke={PAPER} strokeWidth={6} />
        <text y={17} textAnchor="middle" fontFamily={CAPTION_FONT} fontWeight={700} fontSize={48} fill={tag === "VER" ? PAPER : INK}>
          {tag}
        </text>
      </g>
    </g>
    <path d={poly} fill="none" stroke={PAPER} strokeWidth={12} />
    <path d={poly} fill="none" stroke={INK} strokeWidth={5} />
  </g>
);

// The eighth title he didn't get: a generic championship cup (no real trophy's design or logo, ART-5) in ink and
// tone, the 8 engraved on its bowl, ghosted like a memory (a paper glow, a fainter double exposure drifting off).
// Local units: the base's bottom centre at the origin, 250 units tall.
const Cup: React.FC<{ id: string }> = ({ id }) => {
  const bowl = "M -82 -232 C -82 -160 -42 -122 0 -119 C 42 -122 82 -160 82 -232 Z";
  return (
    <g strokeLinejoin="round" strokeLinecap="round">
      <defs>
        <clipPath id={`${id}-bowl`}>
          <path d={bowl} />
        </clipPath>
      </defs>
      {/* handles */}
      <path d="M -78 -214 C -132 -214 -128 -146 -46 -136" fill="none" stroke={INK} strokeWidth={17} />
      <path d="M -78 -214 C -132 -214 -128 -146 -46 -136" fill="none" stroke={PAPER} strokeWidth={8} />
      <path d="M 78 -214 C 132 -214 128 -146 46 -136" fill="none" stroke={INK} strokeWidth={17} />
      <path d="M 78 -214 C 132 -214 128 -146 46 -136" fill="none" stroke={PAPER} strokeWidth={8} />
      {/* base, two steps */}
      <rect x={-62} y={-30} width={124} height={30} fill={PAPER} stroke={INK} strokeWidth={5} />
      <rect x={-46} y={-50} width={92} height={20} fill={PAPER} stroke={INK} strokeWidth={5} />
      <rect x={14} y={-28} width={46} height={26} fill={tone("mid")} />
      {/* stem and knot */}
      <path d="M -13 -50 L -8 -92 L 8 -92 L 13 -50 Z" fill={PAPER} stroke={INK} strokeWidth={5} />
      <ellipse cx={0} cy={-98} rx={24} ry={9} fill={PAPER} stroke={INK} strokeWidth={5} />
      <path d="M -8 -106 L -12 -121 L 12 -121 L 8 -106 Z" fill={PAPER} stroke={INK} strokeWidth={5} />
      {/* bowl: paper, tone on the far side, a highlight streak, the engraved 8 */}
      <path d={bowl} fill={PAPER} />
      <g clipPath={`url(#${id}-bowl)`}>
        <path d="M 30 -240 C 46 -180 34 -140 10 -116 L 100 -116 L 100 -240 Z" fill={tone("mid")} />
        <path d="M -62 -222 C -60 -180 -46 -152 -26 -136" fill="none" stroke={PAPER} strokeWidth={9} opacity={0.9} />
      </g>
      <text
        x={0}
        y={-146}
        textAnchor="middle"
        fontFamily={TITLE_FONT}
        fontWeight={900}
        fontSize={92}
        fill={INK}
        stroke={PAPER}
        strokeWidth={3}
        paintOrder="stroke"
      >
        8
      </text>
      <path d={bowl} fill="none" stroke={INK} strokeWidth={6} />
      <ellipse cx={0} cy={-232} rx={82} ry={11} fill={PAPER} stroke={INK} strokeWidth={6} />
      <ellipse cx={0} cy={-232} rx={70} ry={6} fill={tone("dark")} />
    </g>
  );
};

const TrophyGhost: React.FC<{ x: number; y: number; h: number; a: number; drift: number }> = ({ x, y, h, a, drift }) => {
  const k = (h / 250) * (1 + 0.04 * drift);
  return a <= 0 ? null : (
    <g opacity={a}>
      <ellipse cx={x} cy={y - h * 0.55} rx={h * 0.62} ry={h * 0.62} fill={PAPER} opacity={0.12} />
      <ellipse cx={x} cy={y - h * 0.55} rx={h * 0.45} ry={h * 0.5} fill={PAPER} opacity={0.14} />
      <g opacity={0.28} transform={`translate(${x + h * (0.06 + 0.1 * drift)} ${y - h * 0.03}) scale(${k * 1.02})`}>
        <Cup id="pt-cup-echo" />
      </g>
      <g opacity={0.8} transform={`translate(${x} ${y}) scale(${k})`}>
        <Cup id="pt-cup" />
      </g>
    </g>
  );
};

// The drum hits of bars 102–103 (scripts/make-music.mjs: the drop's kick on every beat, clap and snare on 2 and 4).
const BEATS = [102, 103].flatMap((bar) => [1, 2, 3, 4].map((beat) => at(bar, beat)));
const SNARE_PUNCHES = [at(102, 4), at(103, 2)];
const TONE_STEPS = [at(103, 2), at(103, 4)];

export const Points: React.FC<{ st: ShotTime }> = ({ st }) => {
  useLettering();
  const { t, dur } = st;
  const since = (p: Pos) => secondsInShot(st, p);
  const gold = since(cueAt(EDIT, "abuDhabi2021.pointsGold"));
  const hamIn = since(cueAt(EDIT, "abuDhabi2021.hamPanel"));
  const ghostIn = since(cueAt(EDIT, "abuDhabi2021.hamGhost"));
  const last = since(cueAt(EDIT, "abuDhabi2021.verPush"));
  // the latest kick: which one (the focus-line pattern) and how long ago (shake, flash)
  const kicks = BEATS.map(since).filter((s) => s <= t);
  const kick = kicks.length - 1;
  const sinceKick = t - kicks[kick];
  const slam = hit(t, 0, 0.2);
  const hamSlam = hit(t, hamIn, 0.15);
  // VER: a slow drift, a step on each snare punch, then the last punch accelerates into the cut (MOT-8)
  const step = (a: number) => (t < a ? 0 : 1 - Math.exp(-(t - a) / 0.035)) + 0.6 * hit(t, a, 0.07);
  const push =
    0.03 * (t / dur) +
    SNARE_PUNCHES.reduce((s, p) => s + 0.045 * step(since(p)), 0) +
    0.06 * step(last) +
    0.08 * ramp(t, last, dur) ** 2;
  // HAM: comes up from below on 102.3, then the tone thickens a step on 103.2 and swallows him on 103.4
  const u = Math.min(1, Math.max(0, (t - hamIn) / 0.12));
  const hamY = t < hamIn ? null : 520 * (1 - Easing.out(Easing.back(1.6))(u));
  const dim = 0.2 + TONE_STEPS.reduce((s, p) => s + (t < since(p) ? 0 : 0.25), 0) + 0.06 * ramp(t, hamIn, dur);
  const shake = 16 * slam + 12 * hamSlam + 5 * hit(sinceKick, 0, 0.09);
  const sx = Math.sin(t * 41) * shake;
  const sy = Math.cos(t * 37) * shake * 0.75;
  const flash = 0.25 * hit(sinceKick, 0, 0.1);
  // the ghost: in over 3 frames on 103.3, gone by the 103.4 snare (the tone swallows HAM there)
  const ghostA =
    t < ghostIn - 0.001 ? 0 : Math.min(1, (t - ghostIn + 1 / 60) / 0.05) * (1 - Math.min(1, Math.max(0, (t - (last - 0.14)) / 0.14)));
  const ghostDrift = Math.max(0, Math.min(1, (t - ghostIn) / (last - ghostIn)));
  return (
    <svg width={1920} height={1080}>
      <defs>
        <ToneDefs />
        <InkFilterDef />
      </defs>
      <rect width={1920} height={1080} fill={PAPER} />
      <g filter={inkFilter()} transform={`translate(${sx} ${sy})`}>
        <HelmetPanel
          id="pt-ver"
          poly={TOP}
          car={RB16B}
          compound={PIRELLI_2021.soft}
          helmet={{ x: 1360, y: 290 }}
          ppm={600 * (1 + push)}
          seed={kick * 7}
          flash={flash}
          dim={0}
          tag="VER"
          tagAt={{ x: 200, y: 110 }}
        />
        {hamY === null ? null : (
          <g transform={`translate(0 ${hamY})`}>
            <HelmetPanel
              id="pt-ham"
              poly={BOTTOM}
              car={W12}
              compound={PIRELLI_2021.hard}
              helmet={{ x: 380, y: 900 }}
              ppm={500}
              seed={kick * 7}
              flash={0.4 * flash}
              dim={dim}
              tag="HAM"
              tagAt={{ x: 1720, y: 975 }}
            >
              <TrophyGhost x={1180} y={1030} h={240} a={ghostA} drift={ghostDrift} />
            </HelmetPanel>
          </g>
        )}
        <g transform={`translate(${BOX.x} ${BOX.y}) rotate(-3.7)`}>
          <PointsBox
            accent="gold"
            columns={scoreColumns("abuDhabiFinal")}
            size={BOX.size}
            since={t}
            goldSince={t - gold}
          />
        </g>
      </g>
      {slam > 0.5 ? <rect width={1920} height={1080} fill={PAPER} opacity={0.6 * hit(t, 0, 0.08)} /> : null}
    </svg>
  );
};
