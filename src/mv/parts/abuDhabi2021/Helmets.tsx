// Shot 5.1e (bar 87): helmet panels. The page goes black; on 87.1 (`abuDhabi2021.helmetVer`) VER's panel slams in
// from the left across the top half, on 87.3 (`abuDhabi2021.helmetHam`) HAM's from the right across the bottom half,
// the gutter between them slashed on a diagonal. Each panel is a tight close-up on the driver in his cockpit (the
// settled car art at ~1100 px/m, so helmet, halo and HANS are the traced ones, ART-13), both facing right, the way
// the race runs; VER on top because he is on the inside line. The night streams past in white speed lines and focus
// lines close on each visor. Unlike the 4.2 face-off (helmets eye to eye, still), these are driving: wheels turning,
// the cockpit shivering.
import {
  HELMET_LENS,
  cameraAt,
  MangaCar,
  PIRELLI_2021,
  RB16B,
  W12,
  type CarSpec,
} from "../../../cars";
import { INK, PAPER } from "../../../kit/colors";
import { InkFilterDef, inkFilter } from "../../../kit/ink";
import { CAPTION_FONT } from "../../../kit/lettering";
import { focusLines, speedLines } from "../../../kit/lines";
import { ToneDefs } from "../../../kit/tone";
import { helmetAnchor } from "../../../scenes/abu-dhabi-2021/Faceoff";
import { at } from "../../timing.ts";
import { hit, ramp, secondsInShot, type ShotTime } from "./shotClock";

const PPM = 1100;

const Strip: React.FC<{
  id: string;
  poly: string;
  car: CarSpec;
  compound: string;
  helmet: { x: number; y: number };
  t: number;
  since: number;
  from: "left" | "right";
  tag: string;
  tagAt: { x: number; y: number };
}> = ({ id, poly, car, compound, helmet, t, since, from, tag, tagAt }) => {
  if (since < 0) return null;
  const slide = (1 - ramp(since, 0, 0.09)) * (from === "left" ? -1400 : 1400);
  const jolt = hit(since, 0, 0.25);
  const sx = slide + Math.sin(t * 59) * (2 + 10 * jolt);
  const sy = Math.cos(t * 51) * (2 + 6 * jolt);
  const a = helmetAnchor(car, helmet.x, helmet.y, PPM * (1 + 0.04 * since));
  const seed = Math.floor(t * 30);
  return (
    <g transform={`translate(${sx} ${sy})`}>
      <defs>
        <clipPath id={id}>
          <path d={poly} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id})`}>
        <rect x={-200} y={-200} width={2400} height={1500} fill={INK} />
        <path
          d={speedLines({
            x: -300,
            y: -100,
            w: 2600,
            h: 1300,
            n: 70,
            seed: `${id}-${seed}`,
            angle: 180,
            thickness: 6,
            length: [0.2, 0.55],
          })}
          fill={PAPER}
          opacity={0.6}
        />
        <path d={focusLines(helmet.x + 40, helmet.y, 260, 110, seed)} fill={PAPER} opacity={0.35} />
        <g transform={`translate(0 ${Math.sin(t * 41) * 3})`}>
          <MangaCar car={car} at={a} state={{ ...cameraAt(car, HELMET_LENS.height, HELMET_LENS.distance), wheelAngle: t * 1200, compound }} />
        </g>
        <g transform={`translate(${tagAt.x} ${tagAt.y}) rotate(-4)`}>
          <rect x={-70} y={-34} width={140} height={68} fill={tag === "VER" ? INK : PAPER} stroke={PAPER} strokeWidth={6} />
          <text
            y={17}
            textAnchor="middle"
            fontFamily={CAPTION_FONT}
            fontWeight={700}
            fontSize={48}
            fill={tag === "VER" ? PAPER : INK}
          >
            {tag}
          </text>
        </g>
      </g>
      <path d={poly} fill="none" stroke={PAPER} strokeWidth={12} />
      <path d={poly} fill="none" stroke={INK} strokeWidth={5} />
    </g>
  );
};

export const Helmets: React.FC<{ st: ShotTime }> = ({ st }) => {
  const { t } = st;
  const hamIn = secondsInShot(st, at(87, 3));
  const top = "M 30 30 L 1890 30 L 1890 470 L 30 600 Z";
  const bottom = "M 30 630 L 1890 500 L 1890 1050 L 30 1050 Z";
  return (
    <svg width={1920} height={1080}>
      <defs>
        <ToneDefs />
        <InkFilterDef />
      </defs>
      <rect width={1920} height={1080} fill={INK} />
      <g filter={inkFilter()}>
        <Strip
          id="hl-ver"
          poly={top}
          car={RB16B}
          compound={PIRELLI_2021.soft}
          helmet={{ x: 1050, y: 300 }}
          t={t}
          since={t}
          from="left"
          tag="VER"
          tagAt={{ x: 220, y: 110 }}
        />
        <Strip
          id="hl-ham"
          poly={bottom}
          car={W12}
          compound={PIRELLI_2021.hard}
          helmet={{ x: 870, y: 800 }}
          t={t}
          since={t - hamIn}
          from="right"
          tag="HAM"
          tagAt={{ x: 1700, y: 980 }}
        />
      </g>
    </svg>
  );
};
