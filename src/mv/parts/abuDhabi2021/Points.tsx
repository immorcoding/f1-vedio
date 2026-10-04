// Shot 5.7 (bars 102–103): the final points, a new page (review-1: not 4.2's cockpit face-off again). Two stacked
// panels on a diagonal gutter. On top, wide, is VER's helmet, lit by focus lines. Below, smaller, is HAM's helmet
// under a screen of tone that thickens over the two bars. The racing is over, so there are no speed lines; the
// music drops its drums here (102–103), and the page holds still apart from a slow push-in on VER (MOT-6, MOT-8).
// On the cut (102.1, `abuDhabi2021.points`) the points box slams onto the gutter: 395.5 VS 387.5 (facts.md). On
// 102.2 (`abuDhabi2021.pointsGold`) VER's 395.5 takes the gold stroke: by now he is the world champion, so it is a
// champion's score like Brazil's 98 on 2.7 (the user, 2026-10-04). The helmets sit at opposite ends of the diagonal so
// the box covers neither (ART-14).
import {
  MangaCar,
  PIRELLI_2021,
  RB16B,
  W12,
  type CarSpec,
} from "../../../cars";
import { INK, PAPER } from "../../../kit/colors";
import { InkFilterDef, inkFilter } from "../../../kit/ink";
import { CAPTION_FONT, useLettering } from "../../../kit/lettering";
import { focusLines } from "../../../kit/lines";
import { PointsBox } from "../../../kit/points-box";
import { ToneDefs, tone } from "../../../kit/tone";
import { helmetAnchor } from "../../../scenes/abu-dhabi-2021/Faceoff";
import { scoreColumns } from "../../points";
import { EDIT } from "./shots.ts";
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
  t: number;
  /** 0..1: tone laid over the panel (the one who lost recedes). */
  dim: number;
  tag: string;
  tagAt: { x: number; y: number };
}> = ({ id, poly, car, compound, helmet, ppm, t, dim, tag, tagAt }) => (
  <g>
    <defs>
      <clipPath id={id}>
        <path d={poly} />
      </clipPath>
    </defs>
    <g clipPath={`url(#${id})`}>
      <rect x={0} y={0} width={1920} height={1080} fill={INK} />
      <path d={focusLines(helmet.x, helmet.y, 300, 120, Math.floor(t * 6) + (tag === "VER" ? 0 : 40))} fill={PAPER} opacity={0.45 - 0.3 * dim} />
      <MangaCar car={car} at={helmetAnchor(car, helmet.x, helmet.y, ppm)} state={{ wheelAngle: 0, compound }} />
      {dim > 0 ? <rect x={0} y={0} width={1920} height={1080} fill={tone("dark")} opacity={dim} /> : null}
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

export const Points: React.FC<{ st: ShotTime }> = ({ st }) => {
  useLettering();
  const { t, dur } = st;
  const gold = secondsInShot(st, cueAt(EDIT, "abuDhabi2021.pointsGold"));
  const slam = hit(t, 0, 0.2);
  // a slow push on VER that quickens into the cut; HAM's panel greys over the two bars
  const push = 0.05 * (t / dur) + 0.05 * ramp(t, dur - 0.6, dur);
  const dim = 0.25 + 0.4 * ramp(t, 0.4, dur);
  const sx = Math.sin(t * 41) * 16 * slam;
  const sy = Math.cos(t * 37) * 12 * slam;
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
          t={t}
          dim={0}
          tag="VER"
          tagAt={{ x: 200, y: 110 }}
        />
        <HelmetPanel
          id="pt-ham"
          poly={BOTTOM}
          car={W12}
          compound={PIRELLI_2021.hard}
          helmet={{ x: 380, y: 900 }}
          ppm={500}
          t={t}
          dim={dim}
          tag="HAM"
          tagAt={{ x: 1720, y: 975 }}
        />
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
