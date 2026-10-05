// Shot 5.1e (bar 87): helmet panels. The page goes black; on 87.1 (`abuDhabi2021.helmetVer`) VER's panel slams in
// from the left across the top half, on 87.3 (`abuDhabi2021.helmetHam`) HAM's from the right across the bottom half,
// the gutter between them slashed on a diagonal. Each panel is a side-on close-up of the helmet alone (#34: the car's
// own helmet drawing, `DriverHelmet`, as in the outro's 1989/90 panel, so it is not a third use of 4.2's cockpit
// close-up), both facing right, the way the race runs; VER on top because he is on the inside line. The night
// streams past in white speed lines, focus lines close on each visor, and wind streaks peel off the helmet's back.
// Unlike the 4.2 face-off (helmets eye to eye, still), these are driving: the helmet shivers and creeps in.
import { DriverHelmet, RB16B, W12, type Driver } from "../../../cars";
import { INK, PAPER } from "../../../kit/colors";
import { InkFilterDef, inkFilter } from "../../../kit/ink";
import { CAPTION_FONT } from "../../../kit/lettering";
import { focusLines, speedLines } from "../../../kit/lines";
import { ToneDefs } from "../../../kit/tone";
import { at } from "../../timing.ts";
import { hit, ramp, secondsInShot, type ShotTime } from "./shotClock";

// helmet radius in px: about 0.6 of a panel's height across
const HELMET_R = 200;

const Strip: React.FC<{
  id: string;
  poly: string;
  driver: Driver;
  helmet: { x: number; y: number };
  t: number;
  since: number;
  from: "left" | "right";
  tag: string;
  tagAt: { x: number; y: number };
}> = ({ id, poly, driver, helmet, t, since, from, tag, tagAt }) => {
  if (since < 0) return null;
  const slide = (1 - ramp(since, 0, 0.09)) * (from === "left" ? -1400 : 1400);
  const jolt = hit(since, 0, 0.25);
  const sx = slide + Math.sin(t * 59) * (2 + 10 * jolt);
  const sy = Math.cos(t * 51) * (2 + 6 * jolt);
  const r = HELMET_R * (1 + 0.04 * since);
  // wind streaks off the back of the helmet (it faces right, so they trail left)
  const streaks = [-0.55, -0.15, 0.25, 0.6].map((k, i) => {
    const y = helmet.y + k * r;
    const x0 = helmet.x - r * (0.9 - 0.15 * Math.abs(k));
    const len = 260 + 140 * (((seedOf(t) + i * 7) % 5) / 4);
    return `M ${x0} ${y} q ${-len * 0.5} ${-6 + i * 3} ${-len} ${4}`;
  });
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
        <path
          d={focusLines(helmet.x + 40, helmet.y, 260, 110, seed)}
          fill={PAPER}
          opacity={0.35}
        />
        <path
          d={streaks.join(" ")}
          fill="none"
          stroke={PAPER}
          strokeWidth={5}
          strokeLinecap="round"
          opacity={0.8}
        />
        {/* a paper rim around the helmet so its ink outline reads on the night */}
        <g
          filter="url(#hl-rim)"
          transform={`translate(0 ${Math.sin(t * 41) * 3}) rotate(${Math.sin(t * 23) * 0.8} ${helmet.x} ${helmet.y})`}
        >
          <DriverHelmet
            driver={driver}
            x={helmet.x}
            y={helmet.y}
            r={r}
            facing="right"
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

const seedOf = (t: number) => Math.floor(t * 30);

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
        <filter id="hl-rim" x="-20%" y="-20%" width="140%" height="140%">
          <feMorphology
            in="SourceAlpha"
            operator="dilate"
            radius={7}
            result="grown"
          />
          <feFlood floodColor={PAPER} result="paper" />
          <feComposite in="paper" in2="grown" operator="in" result="rim" />
          <feMerge>
            <feMergeNode in="rim" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <rect width={1920} height={1080} fill={INK} />
      <g filter={inkFilter()}>
        <Strip
          id="hl-ver"
          poly={top}
          driver={RB16B.driver}
          helmet={{ x: 1000, y: 280 }}
          t={t}
          since={t}
          from="left"
          tag="VER"
          tagAt={{ x: 220, y: 110 }}
        />
        <Strip
          id="hl-ham"
          poly={bottom}
          driver={W12.driver}
          helmet={{ x: 900, y: 790 }}
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
