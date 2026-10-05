// Shot 5.1e (bar 87): the tyre split panel. The page goes black; on 87.1 (`abuDhabi2021.helmetVer`) VER's panel slams
// in from the left across the top half, on 87.3 (`abuDhabi2021.helmetHam`) HAM's from the right across the bottom half,
// the gutter between them slashed on a diagonal. Each panel is a side-on close-up of one wheel, the car's own wheel
// drawing (`CarWheel`: tyre, Pirelli sidewall band, rim, rim accent) rolling on a streaming track, both rolling to the
// right, the way the race runs; VER on top because he is on the inside line. The pair calls back 4.3's
// FRESH SOFTS vs OLD HARDS and shows why VER can catch up (facts.md: VER pitted for new softs under the last safety
// car, HAM stayed out on old hards):
//   VER  the fresh soft (red band) on the RB16B wheel: clean black tread with a sharp sheen, spinning hard, the rim
//        blurred by speed arcs;
//   HAM  the old hard (white band) on the W12 wheel (teal rim accent): the tread grained and worn — a grey dot tone
//        over the rubber and a few pale scuff marks that turn with the wheel (ART-11: texture, not noise).
// (The cue ids keep their helmet names from the panel this replaced; the shot is the same slot.)
import { random } from "remotion";
import {
  CarWheel,
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
import { at } from "../../timing.ts";
import { hit, ramp, secondsInShot, type ShotTime } from "./shotClock";

const WHEEL_R = 215; // px: the wheel about 0.8 of a panel's height across
const SPIN = 1500; // degrees per second shown on the rim (a held strobe; the arcs carry the real speed)
const GRAIN = "hl-grain";

// Arc from angle a0 to a1 (degrees, clockwise from screen right) on a circle about (x, y).
const arc = (x: number, y: number, r: number, a0: number, a1: number) => {
  const p = (a: number) =>
    `${x + r * Math.cos((a * Math.PI) / 180)} ${y + r * Math.sin((a * Math.PI) / 180)}`;
  return `M ${p(a0)} A ${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${p(a1)}`;
};

const Strip: React.FC<{
  id: string;
  poly: string;
  car: CarSpec;
  compound: string;
  worn: boolean;
  wheel: { x: number; y: number };
  t: number;
  since: number;
  from: "left" | "right";
  tag: string;
  tagAt: { x: number; y: number };
}> = ({ id, poly, car, compound, worn, wheel, t, since, from, tag, tagAt }) => {
  if (since < 0) return null;
  const slide = (1 - ramp(since, 0, 0.09)) * (from === "left" ? -1400 : 1400);
  const jolt = hit(since, 0, 0.25);
  const sx = slide + Math.sin(t * 59) * (2 + 10 * jolt);
  const sy = Math.cos(t * 51) * (2 + 6 * jolt);
  const r = WHEEL_R * (1 + 0.04 * since);
  const { x, y } = wheel;
  const ground = y + r;
  const spin = t * SPIN;
  const seed = Math.floor(t * 30);
  // speed arcs over the rim and the tyre, turning clockwise (rolling right); the fresh soft is blurred harder
  const arcs = Array.from({ length: worn ? 4 : 8 }, (_, i) => {
    const rr = r * (0.42 + 0.53 * random(`${id}-ar${i}`));
    const a0 = random(`${id}-aa${i}`) * 360 + spin * 0.37;
    const len = (worn ? 35 : 70) + 50 * random(`${id}-al${i}`);
    return arc(x, y, rr, a0, a0 + len);
  }).join(" ");
  // worn hard: pale scuff marks on the tread, turning with the wheel
  const scuffs = worn
    ? Array.from({ length: 9 }, (_, i) => {
        const a = (i / 9) * 360 + 17 * random(`${id}-sc${i}`) - spin;
        const span = 6 + 8 * random(`${id}-ss${i}`);
        const rr = r * (0.93 + 0.04 * random(`${id}-sr${i}`));
        return arc(x, y, rr, a, a + span);
      }).join(" ")
    : "";
  // the track: streaks running left under the wheel at road speed
  const road = Array.from({ length: 7 }, (_, i) => {
    const len = 120 + 220 * random(`${id}-rl${i}`);
    const xx =
      2200 -
      ((random(`${id}-rx${i}`) * 2600 +
        t * 2400 * (0.8 + 0.4 * random(`${id}-rv${i}`))) %
        2600);
    const yy = ground + 10 + 70 * random(`${id}-ry${i}`);
    return `M ${xx} ${yy} h ${len}`;
  }).join(" ");
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
        <path
          d={focusLines(x, y, r + 60, 110, seed)}
          fill={PAPER}
          opacity={0.35}
        />
        {/* the track surface the wheel rolls on */}
        <rect x={-200} y={ground} width={2400} height={400} fill="#262626" />
        <path d={`M -200 ${ground} H 2200`} stroke={PAPER} strokeWidth={4} />
        <path
          d={road}
          stroke={PAPER}
          strokeWidth={4}
          strokeLinecap="round"
          opacity={0.7}
        />
        <ellipse cx={x} cy={ground + 4} rx={r * 0.8} ry={10} fill={INK} />
        <g transform={`translate(0 ${Math.sin(t * 41) * 2})`}>
          <CarWheel
            car={car}
            x={x}
            y={y}
            r={r}
            angle={spin}
            compound={compound}
          />
          {/* the fresh soft spins hard: two fading ghosts of the wheel smear the spokes */}
          {worn
            ? null
            : [10, 20].map((lag, i) => (
                <g key={lag} opacity={0.35 - 0.15 * i}>
                  <CarWheel
                    car={car}
                    x={x}
                    y={y}
                    r={r}
                    angle={spin - lag}
                    compound={compound}
                  />
                </g>
              ))}
          {/* a paper rim on the tyre's edge so it reads against the night */}
          <circle
            cx={x}
            cy={y}
            r={r + 4}
            fill="none"
            stroke={PAPER}
            strokeWidth={5}
          />
          {worn ? (
            <>
              {/* grained rubber: a grey dot tone over the tyre between the band and the tread */}
              <path
                d={`M ${x - r} ${y} a ${r} ${r} 0 1 0 ${2 * r} 0 a ${r} ${r} 0 1 0 ${-2 * r} 0 Z M ${x - r * 0.8} ${y} a ${r * 0.8} ${r * 0.8} 0 1 1 ${1.6 * r} 0 a ${r * 0.8} ${r * 0.8} 0 1 1 ${-1.6 * r} 0 Z`}
                fill={`url(#${GRAIN})`}
                fillRule="evenodd"
                opacity={0.55}
              />
              <path
                d={scuffs}
                fill="none"
                stroke="#9a9a9a"
                strokeWidth={5}
                strokeLinecap="round"
              />
            </>
          ) : null}
          <path
            d={arcs}
            fill="none"
            stroke={PAPER}
            strokeWidth={worn ? 3 : 5}
            strokeLinecap="round"
            opacity={worn ? 0.45 : 0.75}
          />
        </g>
        <g transform={`translate(${tagAt.x} ${tagAt.y}) rotate(-4)`}>
          <rect
            x={-70}
            y={-34}
            width={140}
            height={68}
            fill={tag === "VER" ? INK : PAPER}
            stroke={PAPER}
            strokeWidth={6}
          />
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
        <pattern
          id={GRAIN}
          width={9}
          height={9}
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <circle cx={4.5} cy={4.5} r={1.8} fill="#8a8a8a" />
        </pattern>
      </defs>
      <rect width={1920} height={1080} fill={INK} />
      <g filter={inkFilter()}>
        <Strip
          id="hl-ver"
          poly={top}
          car={RB16B}
          compound={PIRELLI_2021.soft}
          worn={false}
          wheel={{ x: 980, y: 270 }}
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
          worn
          wheel={{ x: 900, y: 790 }}
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
