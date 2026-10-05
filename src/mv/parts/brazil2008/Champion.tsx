// Shot 2.7 (bars 53–56): the title, in the language of Abu Dhabi's champion card (5.8). Facts only, no quote (STO-8):
// - 53.1 (`brazil2008.points`): the final points slam in big, HAM 98 · MAS 97 (facts.md); on 53.2 a gold under-stroke
//   hits HAM's 98. On 53.3 the score box flies into the bottom-left corner while two manga panels slide in: a full
//   illustration of the moment (ChampionMoment: HAM's MP4-23 on the wet pit straight, grandstand behind, the chequered
//   line coming up) and a black lettering panel.
// - Bar 54: "LEWIS HAMILTON" / "2008" / "WORLD" / "CHAMPION" slam in one per beat, oversize → settled in 0.12 s, gold
//   under-stroke on the big words; every slam punches the page (shake, a kick of zoom, focus lines flaring behind the
//   lettering and round the car, HAM's visor glinting); the last hits hardest, throws a burst ring, and is the moment
//   the front wheel crosses the line.
// - Bars 55–56: the hold. Each panel keeps pushing in on its subject, accelerating into the cut; rain keeps falling (Interlagos) with
//   gold and paper sparkles in it, glints twinkle on the car and the visor, the speed streaks stream up the lettering
//   panel.
// Colour: paper, ink and gold for the lettering, the car in its real livery on a black-and-white Interlagos (ART-8). No
// face, no logo (ART-5); the lettering is clipped to its own panel and the score box sits below the car, so neither
// covers the car or the helmet (ART-14).
import { Easing, random } from "remotion";
import { INK, PAPER } from "../../../kit/colors";
import { inkFilter } from "../../../kit/ink";
import {
  TITLE_FONT,
  fitTitleSize,
  lean,
  useLettering,
} from "../../../kit/lettering";
import { focusLines, speedLines } from "../../../kit/lines";
import { GOLD, PointsBox } from "../../../kit/points-box";
import { Rain } from "../../../kit/rain";
import { scoreColumns } from "../../points";
import { tone } from "../../../kit/tone";
import { at, FPS, type Pos } from "../../timing";
import {
  clamp01,
  secondsInShot,
  type ShotTime,
} from "../abuDhabi2021/shotClock";
import { ChampionMoment, MOMENT_CAR, MOMENT_HELMET } from "./ChampionMoment";
import { Page } from "./common";

type Box = { x: number; y: number; w: number; h: number };
const rect = (b: Box) => ({ x: b.x, y: b.y, width: b.w, height: b.h });

// Panels inside the page frame.
const HELMET_PANEL: Box = { x: 44, y: 44, w: 1016, h: 992 };
const TEXT_PANEL: Box = { x: 1084, y: 44, w: 792, h: 992 };
// The score box (the shared points box, src/kit/points-box.tsx) sits in the panel's bottom-left corner, on the wet
// track below the car; this is its layout frame (the box is centred in it).
export const SCORE_W = 430;
export const SCORE_H = 250;
const CORNER = { x: 76, y: 768 };
const BIG_K = 2.5;
const BIG = {
  x: 960 - (SCORE_W * BIG_K) / 2,
  y: 520 - (SCORE_H * BIG_K) / 2,
};

// The lettering, as on the card: the name small, then the big words; all lines share one width.
const TEXT_X = 1480;
const TEXT_W = 690;
const TEXT_C = { x: 1480, y: 600 };
// Big Shoulders Black (ART-6): each line is sized to TEXT_W (no stretching), but its caps never taller than `cap`, so
// the lines keep clear of each other.
const LINES = [
  { t: "LEWIS HAMILTON", y: 290, cap: 64, sw: 10 },
  { t: "2008", y: 520, cap: 190, sw: 16 },
  { t: "WORLD", y: 715, cap: 158, sw: 14 },
  { t: "CHAMPION", y: 870, cap: 124, sw: 14 },
];

// glints twinkling on the car's bodywork in the hold: page px from the middle of the car, star radius in px
const GLINTS = [
  { x: 250, y: -10, s: 30, phase: 0 },
  { x: -300, y: -95, s: 26, phase: 0.4 },
  { x: -40, y: -30, s: 22, phase: 0.75 },
];

// decays from 1 to 0 over `len` seconds after a hit `since` seconds ago
const decay = (since: number, len: number) =>
  since < 0 ? 0 : Math.max(0, 1 - since / len) ** 2;

// The card's slam: oversize and transparent → settled in ~0.12 s, with a small overshoot.
const slam = (since: number, big = false) => {
  const u = Math.min(1, Math.max(0, since) / 0.12);
  return {
    s: (big ? 1.6 : 1.35) - (big ? 0.6 : 0.35) * Easing.out(Easing.back(2))(u),
    o: clamp01((since * FPS) / 3),
  };
};

const Glint: React.FC<{ x: number; y: number; r: number; s: number }> = ({
  x,
  y,
  r,
  s,
}) =>
  s <= 0.01 ? null : (
    <g transform={`translate(${x} ${y}) scale(${s}) rotate(${12 * s})`}>
      <path
        d={`M 0 ${-r} Q ${r * 0.1} ${-r * 0.1} ${r} 0 Q ${r * 0.1} ${r * 0.1} 0 ${r} Q ${-r * 0.1} ${r * 0.1} ${-r} 0 Q ${-r * 0.1} ${-r * 0.1} 0 ${-r} Z`}
        fill={PAPER}
        stroke={INK}
        strokeWidth={2 / Math.max(s, 0.3)}
      />
    </g>
  );

// Sparkles falling with the rain over a panel: small four-point stars, gold and paper, twinkling as they fall.
const Sparkles: React.FC<{ box: Box; t: number; n: number; seed: string }> = ({
  box,
  t,
  n,
  seed,
}) => {
  const out = [];
  for (let i = 0; i < n; i++) {
    const r = (k: string) => random(`${seed}-${i}-${k}`);
    const v = 260 + 220 * r("v");
    const span = box.h + 80;
    const y = box.y - 40 + ((((r("p") * span + v * t) % span) + span) % span);
    const x =
      box.x + box.w * r("x") + 24 * Math.sin(t * (1.5 + r("f")) + 6 * r("q"));
    const tw = Math.abs(Math.sin(t * (3 + 4 * r("w")) + 6 * r("o")));
    const size = (9 + 12 * r("s")) * (0.35 + 0.65 * tw);
    const gold = r("c") < 0.55;
    out.push(
      <path
        key={i}
        transform={`translate(${x} ${y}) rotate(${45 * r("a") + 60 * t})`}
        d={`M 0 ${-size} L ${size * 0.22} ${-size * 0.22} L ${size} 0 L ${size * 0.22} ${size * 0.22} L 0 ${size} L ${-size * 0.22} ${size * 0.22} L ${-size} 0 L ${-size * 0.22} ${-size * 0.22} Z`}
        fill={gold ? GOLD : PAPER}
        stroke={INK}
        strokeWidth={1.5}
      />,
    );
  }
  return <g>{out}</g>;
};

export const Champion: React.FC<{ st: ShotTime }> = ({ st }) => {
  useLettering();
  const { t, dur } = st;
  const since = (p: Pos) => t - secondsInShot(st, p);
  const beat = secondsInShot(st, at(53, 2));
  const sinceLine = LINES.map((_, i) => since(at(54, i + 1)));
  const sinceGold = since(at(53, 2));
  const sinceMove = since(at(53, 3));
  const holdFrom = secondsInShot(st, at(55));
  const crossAt = secondsInShot(st, at(54, 4));

  // the punch of every slam: the points (53.1), the gold 98 (53.2, softer), the four lines (the last hardest)
  const linePunch = sinceLine.reduce(
    (m, s, i) =>
      Math.max(m, decay(s, i === 3 ? 0.45 : 0.25) * (i === 3 ? 1.8 : 1)),
    0,
  );
  const punch = Math.max(
    linePunch,
    decay(t, 0.3) * 1.3,
    decay(sinceGold, 0.2) * 0.6,
  );
  const shakeX = punch * 9 * Math.sin(t * 97);
  const shakeY = punch * 7 * Math.cos(t * 83);
  const finalBurst = decay(sinceLine[3], 0.6);
  const cutFlash = decay(t, 0.22);
  const flicker = Math.floor(st.frame / 5);

  // the score box: big in the middle, then into the corner over 53.3 → 54.1
  const move = Easing.inOut(Easing.cubic)(clamp01(sinceMove / (2 * beat)));
  const k = BIG_K + (1 - BIG_K) * move;
  const bx = BIG.x + (CORNER.x - BIG.x) * move;
  const by = BIG.y + (CORNER.y - BIG.y) * move;
  const scoreJolt = decay(sinceLine[3], 0.3);
  // the panels slide in from the sides while the box flies
  const slideIn = (delay: number) =>
    1 - Easing.out(Easing.cubic)(clamp01((sinceMove - delay) / (1.5 * beat)));
  const helmetDx = -1100 * slideIn(0);
  const textDx = 900 * slideIn(0.08);

  // the page's camera: a slow drift from the cut and a kick per slam. In the hold each panel pushes in on its own
  // subject (the helmet, the lettering), accelerating into the cut, so the panels stay framed and nothing is clipped.
  const hold = clamp01((t - holdFrom) / (dur - holdFrom));
  const holdPush = 0.35 * hold + 0.65 * Easing.in(Easing.quad)(hold);
  const push = 1 + 0.012 * (t / dur) + 0.012 * punch;
  const textPush = 1 + 0.06 * holdPush;

  // focus lines behind the lettering flare on every slam and stay faintly after the last
  const textFlare = Math.min(
    0.55,
    0.08 + 0.4 * linePunch + (sinceLine[3] > 0 ? 0.1 : 0),
  );
  const visorGlint = Math.min(1, linePunch);
  const glintPulse = (phase: number) => {
    const flare = sinceLine.reduce(
      (m, s) => Math.max(m, decay(s - phase * 0.1, 0.4)),
      0,
    );
    const twinkle =
      sinceLine[3] < 0
        ? 0
        : 0.35 + 0.4 * Math.sin((t * 2.2 + phase) * Math.PI * 2);
    return sinceLine[0] < 0 ? 0 : Math.max(flare * 1.1, twinkle);
  };
  const sparkle = clamp01(sinceLine[3] / 0.3);
  const helmetKick = (1 + 0.03 * linePunch) * (1 + 0.11 * holdPush);

  return (
    <Page>
      <defs>
        <clipPath id="b27-helmet-panel">
          <rect {...rect(HELMET_PANEL)} />
        </clipPath>
        <clipPath id="b27-text-panel">
          <rect {...rect(TEXT_PANEL)} />
        </clipPath>
      </defs>
      <g transform={`translate(${shakeX} ${shakeY})`}>
        <g transform={`translate(960 540) scale(${push}) translate(-960 -540)`}>
          {/* bar 53: the score's own page, focus lines on the box and rain */}
          <g filter={inkFilter()}>
            <rect width={1920} height={1080} fill={tone("light")} />
            <path
              d={focusLines(960, 520, 640, 140, 3 + (flicker % 5))}
              fill={INK}
              opacity={0.85}
            />
          </g>
          <Rain t={t} n={160} opacity={0.5} seed="b27-page" />
          {/* the gutters between the panels clear to paper as the panels arrive */}
          <rect
            width={1920}
            height={1080}
            fill={PAPER}
            opacity={1 - slideIn(0)}
          />

          {/* the helmet panel */}
          <g transform={`translate(${helmetDx} 0)`}>
            <g clipPath="url(#b27-helmet-panel)">
              <rect {...rect(HELMET_PANEL)} fill={PAPER} />
              <g
                transform={`translate(${MOMENT_CAR.x} ${MOMENT_CAR.y}) scale(${helmetKick}) translate(${-MOMENT_CAR.x} ${-MOMENT_CAR.y})`}
              >
                <ChampionMoment t={t} crossAt={crossAt} punch={linePunch} />
                {/* the visor glints on every slam */}
                <Glint
                  x={MOMENT_HELMET.x + MOMENT_HELMET.r * 0.45}
                  y={MOMENT_HELMET.y - MOMENT_HELMET.r * 0.1}
                  r={MOMENT_HELMET.r * 1.5}
                  s={Math.max(visorGlint, 0.6 * glintPulse(0.2))}
                />
                {GLINTS.map((g) => (
                  <Glint
                    key={g.phase}
                    x={MOMENT_CAR.x + g.x}
                    y={MOMENT_CAR.y + g.y}
                    r={g.s}
                    s={glintPulse(g.phase)}
                  />
                ))}
              </g>
              {sparkle > 0 ? (
                <g opacity={sparkle}>
                  <Sparkles box={HELMET_PANEL} t={t} n={22} seed="b27-sp-h" />
                </g>
              ) : null}
              {finalBurst > 0 ? (
                <circle
                  cx={MOMENT_HELMET.x}
                  cy={MOMENT_HELMET.y}
                  r={120 + 800 * (1 - finalBurst)}
                  fill="none"
                  stroke={INK}
                  strokeWidth={30 * finalBurst}
                  opacity={finalBurst}
                />
              ) : null}
            </g>
            <rect
              {...rect(HELMET_PANEL)}
              fill="none"
              stroke={INK}
              strokeWidth={10}
            />
          </g>

          {/* the lettering panel */}
          <g transform={`translate(${textDx} 0)`}>
            <g clipPath="url(#b27-text-panel)">
              <rect {...rect(TEXT_PANEL)} fill={INK} />
              <path
                d={speedLines({
                  x: TEXT_PANEL.x - 200,
                  y: TEXT_PANEL.y - 100,
                  w: TEXT_PANEL.w + 400,
                  h: TEXT_PANEL.h + 200,
                  angle: -93,
                  n: 70,
                  seed: `b27-${Math.floor(st.frame / 3)}`,
                  thickness: 5,
                })}
                fill={PAPER}
                opacity={0.16}
              />
              <path
                d={focusLines(TEXT_C.x, TEXT_C.y, 330, 90, 31)}
                fill={PAPER}
                opacity={textFlare}
              />
              <Rain
                x={TEXT_PANEL.x}
                y={TEXT_PANEL.y}
                w={TEXT_PANEL.w}
                h={TEXT_PANEL.h}
                t={t + 0.5}
                n={70}
                color={PAPER}
                opacity={0.3}
                seed="b27-text-rain"
              />
              {sparkle > 0 ? (
                <g opacity={sparkle}>
                  <Sparkles box={TEXT_PANEL} t={t} n={26} seed="b27-sp-t" />
                </g>
              ) : null}
              <g
                transform={`translate(${TEXT_C.x} ${TEXT_C.y}) scale(${textPush}) translate(${-TEXT_C.x} ${-TEXT_C.y}) rotate(-3 ${TEXT_X} 580)`}
              >
                {LINES.map(({ t: line, y, cap, sw }, i) => {
                  const fs = fitTitleSize(line, TEXT_W, cap);
                  const s0 = sinceLine[i];
                  if (s0 < 0) return null;
                  const { s, o } = slam(s0, i === 3);
                  const oy = y - fs / 3;
                  const text = (fill: string, d: number) => (
                    <text
                      x={TEXT_X + d}
                      y={y + d}
                      textAnchor="middle"
                      transform={lean(TEXT_X + d, y + d)}
                      fontFamily={TITLE_FONT}
                      fontWeight={900}
                      fontSize={fs}
                      fill={fill}
                      stroke={INK}
                      strokeWidth={sw}
                      paintOrder="stroke"
                    >
                      {line}
                    </text>
                  );
                  return (
                    <g
                      key={line}
                      opacity={o}
                      transform={`translate(${TEXT_X} ${oy}) scale(${s}) translate(${-TEXT_X} ${-oy})`}
                    >
                      {/* a gold under-stroke on the big words */}
                      {i >= 1 ? text(GOLD, 8) : null}
                      {text(PAPER, 0)}
                    </g>
                  );
                })}
              </g>
              {/* the last slam: a ring bursting out from the lettering */}
              {finalBurst > 0 ? (
                <circle
                  cx={TEXT_C.x}
                  cy={TEXT_C.y + 120}
                  r={120 + 900 * (1 - finalBurst)}
                  fill="none"
                  stroke={PAPER}
                  strokeWidth={40 * finalBurst}
                  opacity={finalBurst}
                />
              ) : null}
            </g>
            <rect
              {...rect(TEXT_PANEL)}
              fill="none"
              stroke={INK}
              strokeWidth={10}
            />
          </g>
        </g>

        {/* the score box: slams in big on the cut, then flies into the corner and stays there (outside the push) */}
        <g
          transform={`translate(${bx} ${by}) scale(${k}) translate(${SCORE_W / 2} ${SCORE_H / 2}) rotate(${-2 + 1.5 * scoreJolt * Math.sin(t * 60) + 0.6 * Math.sin(t * 1.3)})`}
        >
          <PointsBox
            accent="gold"
            columns={scoreColumns("brazil2008")}
            since={t}
            goldSince={sinceGold}
          />
        </g>
      </g>
      {/* the cut lands on a white flash; the last slam flashes the page lightly */}
      <rect
        width={1920}
        height={1080}
        fill={PAPER}
        opacity={Math.max(cutFlash, 0.35 * decay(sinceLine[3], 0.18))}
      />
      <rect
        x={20}
        y={20}
        width={1880}
        height={1040}
        fill="none"
        stroke={INK}
        strokeWidth={12}
      />
    </Page>
  );
};
