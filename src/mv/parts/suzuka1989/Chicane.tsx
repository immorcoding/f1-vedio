// Shot 1.3 (bars 15–18): the Casio Triangle chicane after 130R from straight above (MOT-2), lap 47. The view opens
// wide on the run from 130R and comes down onto the two McLarens as they brake. SEN sits in PRO's tow, pulls right
// onto the inside while still a car length back, and draws up until his nose is at PRO's sidepod; PRO, on the
// outside, turns in at the cut (19.1, the crash) — where shot 1.4 picks them up.
//
// Every car position comes from staging.ts, which the interpenetration check (npm run check:overlap, ART-18) tests
// frame by frame: the footprints, at the scale the cars are drawn, never meet in this shot.
//
// The chicane must read as the track: the main line is the asphalt with kerbs and bold edges; the escape road that
// runs straight on is drawn narrower, in light tone with thin edges, and barred by a staggered row of bollards.
import { Easing } from "remotion";
import { MangaCar, MP4_5_PRO, MP4_5_SEN, topAnchorAt } from "../../../cars";
import { INK, PAPER } from "../../../kit/colors";
import { InkFilterDef, inkFilter } from "../../../kit/ink";
import { Caption } from "../../../kit/lettering";
import { speedLines } from "../../../kit/lines";
import { ToneDefs, tone } from "../../../kit/tone";
import {
  mapView,
  poseAt,
  polylinePoints,
  samplePath,
  SUZUKA_1989,
  TrackSection,
  widen,
  type MapPoint,
  type MapView,
} from "../../../tracks";
import { ramp, shotById, type PictureProps } from "./common";
import {
  CHICANE as C,
  carScale13,
  cars13,
  ppm13,
  senLine13,
  u13,
} from "./staging";

const T = SUZUKA_1989;
const ESCAPE = polylinePoints(T.escapeRoads?.[0]?.path ?? []);
const ESCAPE_W = 7; // drawn narrower than the race track (13 m): a service road, not the circuit

// Point along the escape road at fraction k (0 = leaving the track, 1 = rejoining), offset across it, m.
const escapeAt = (k: number, across: number): MapPoint => {
  const i = Math.min(ESCAPE.length - 2, Math.floor(k * (ESCAPE.length - 1)));
  const a = ESCAPE[i];
  const b = ESCAPE[i + 1];
  const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
  const t = k * (ESCAPE.length - 1) - i;
  return {
    x: a.x + (b.x - a.x) * t - ((b.y - a.y) / len) * across,
    y: a.y + (b.y - a.y) * t + ((b.x - a.x) / len) * across,
  };
};

// Temporary bollards: two across the mouth leaving a gap, then a slalom down the road.
const BOLLARDS: [number, number][] = [
  [0.1, -2.3],
  [0.1, 0.6],
  [0.3, 1.8],
  [0.45, -1.8],
  [0.6, 1.8],
  [0.75, -1.8],
];

const EscapeRoad: React.FC<{ view: MapView }> = ({ view }) => {
  const ppm = view.pxPerMetre;
  const r = Math.max(10, 0.45 * ppm);
  return (
    <g>
      <path
        d={view.path(widen(ESCAPE, ESCAPE_W), true)}
        fill={tone("light")}
        stroke={INK}
        strokeWidth={Math.max(1.5, 0.15 * ppm)}
        strokeDasharray={`${Math.max(6, ppm)} ${Math.max(4, 0.6 * ppm)}`}
      />
      {BOLLARDS.map(([k, a]) => {
        const p = view.project(escapeAt(k, a));
        return (
          <g key={`${k}-${a}`}>
            <circle
              cx={p.x}
              cy={p.y}
              r={r}
              fill={PAPER}
              stroke={INK}
              strokeWidth={Math.max(2, r * 0.3)}
            />
            <circle cx={p.x} cy={p.y} r={r * 0.4} fill={INK} />
          </g>
        );
      })}
    </g>
  );
};

export const Chicane: React.FC<PictureProps> = ({ f }) => {
  const shot = shotById("1.3");
  const len = shot.to - shot.from;
  const t = f - shot.from;
  const u = u13(f);
  const e = Math.pow(u, 1.3);
  const { pro, sen } = cars13(u);
  const sMid = (pro.s + sen.s) / 2;
  const ppm = ppm13(u);
  // wide: centred between the cars and the chicane; close: on the cars
  const centre = poseAt(T, sMid + (C - sMid) * 0.35 * (1 - e) + 4 * e);
  const h0 = poseAt(T, C - 120).heading;
  const view = mapView({
    centre,
    rotation: -h0,
    pxPerMetre: ppm,
    screen: { x: 860, y: 520 },
  });
  const carScale = carScale13(u);
  const cppm = ppm * carScale;
  const lineDraw = ramp(t, len * 0.3, len * 0.7);
  const arrowFrom = sen.s + 10;
  const arrowPts = samplePath(
    T,
    Math.min(arrowFrom, C - 60),
    C + 18,
    senLine13,
  );
  const end = view.project(arrowPts[arrowPts.length - 1]);
  const prev = view.project(arrowPts[arrowPts.length - 4]);
  const ah = Math.atan2(end.y - prev.y, end.x - prev.x);
  const caption = ramp(t, 8, 22, Easing.out(Easing.back(1.5)));
  const steerPro = 14 * ramp(u, 0.8, 1);
  const cars = [
    { car: MP4_5_SEN, c: sen, steer: 0, tag: "SEN" },
    { car: MP4_5_PRO, c: pro, steer: steerPro, tag: "PRO" },
  ];
  // the main line over the junction is redrawn on top of the escape road
  const junction = { from: C - 70, to: C + 40 };
  return (
    <svg viewBox="0 0 1920 1080" width={1920} height={1080}>
      <defs>
        <ToneDefs />
        <InkFilterDef />
        <mask
          id="s13-draw"
          maskUnits="userSpaceOnUse"
          x={0}
          y={0}
          width={1920}
          height={1080}
        >
          <path
            d={view.path(arrowPts)}
            fill="none"
            stroke="#fff"
            strokeWidth={80}
            pathLength={1}
            strokeDasharray={`${lineDraw} 1`}
          />
        </mask>
      </defs>
      <rect width={1920} height={1080} fill={PAPER} />
      <g filter={inkFilter()}>
        <TrackSection
          track={T}
          view={view}
          from={C - 560}
          to={C + 260}
          runoff={5}
          barrier
          grass={{ x: 0, y: 0, w: 1920, h: 1080 }}
          escapeRoads={false}
        />
        <EscapeRoad view={view} />
        <TrackSection
          track={T}
          view={view}
          from={junction.from}
          to={junction.to}
          runoff={0}
          escapeRoads={false}
        />
        {/* SEN's line down the inside */}
        <g mask="url(#s13-draw)">
          <path
            d={view.path(arrowPts)}
            fill="none"
            stroke={PAPER}
            strokeWidth={22}
            strokeLinecap="round"
            strokeDasharray="34 16"
          />
          <path
            d={view.path(arrowPts)}
            fill="none"
            stroke={INK}
            strokeWidth={11}
            strokeLinecap="round"
            strokeDasharray="34 16"
          />
        </g>
        {lineDraw > 0.97 ? (
          <path
            d={`M ${end.x + Math.cos(ah) * 40} ${end.y + Math.sin(ah) * 40} L ${end.x + Math.cos(ah + 2.4) * 34} ${end.y + Math.sin(ah + 2.4) * 34} L ${end.x + Math.cos(ah - 2.4) * 34} ${end.y + Math.sin(ah - 2.4) * 34} Z`}
            fill={INK}
            stroke={PAPER}
            strokeWidth={5}
          />
        ) : null}
        {cars.map(({ car, c, steer }) => {
          const heading = view.heading(c.heading);
          const p = view.project(c);
          return (
            <g key={car.driver.number}>
              {/* short speed streaks just off the rear wing */}
              <g transform={`translate(${p.x} ${p.y}) rotate(${heading})`}>
                <path
                  d={speedLines({
                    x: -4.6 * cppm,
                    y: -0.9 * cppm,
                    w: 2.4 * cppm,
                    h: 1.8 * cppm,
                    n: 7,
                    seed: `${car.driver.number}-${Math.floor(t / 4)}`,
                    thickness: 5,
                    length: [0.4, 1],
                  })}
                  fill={INK}
                  opacity={0.7 * (1 - ramp(u, 0.8, 0.95))}
                />
              </g>
              <MangaCar
                car={car}
                view="top"
                at={topAnchorAt(
                  car,
                  { x: p.x, y: p.y, pxPerMetre: cppm },
                  heading,
                )}
                state={{ heading, steer }}
              />
            </g>
          );
        })}
        {/* driver tags on the wide map: PRO's above his car (his left), SEN's below (his right) */}
        {cars.map(({ c, tag }) => {
          const q = view.project(c);
          const p = {
            x: q.x,
            y: q.y + (tag === "SEN" ? 1 : -1) * (1.6 * cppm + 30),
          };
          return (
            <g key={tag} opacity={1 - ramp(u, 0.72, 0.88)}>
              <rect
                x={p.x - 52}
                y={p.y - 26}
                width={104}
                height={46}
                fill={tag === "SEN" ? INK : PAPER}
                stroke={INK}
                strokeWidth={4}
              />
              <text
                x={p.x}
                y={p.y + 10}
                textAnchor="middle"
                fontFamily="Arial Black, Arial, sans-serif"
                fontWeight={900}
                fontStyle="italic"
                fontSize={30}
                fill={tag === "SEN" ? PAPER : INK}
              >
                {tag}
              </text>
            </g>
          );
        })}
        <g
          opacity={caption}
          transform={`translate(${1460 + 20 * (1 - caption)} 80)`}
        >
          <Caption
            x={0}
            y={0}
            w={330}
            h={110}
            lines={[...shot.text]}
            size={56}
          />
        </g>
        <rect
          x={0}
          y={0}
          width={1920}
          height={1080}
          fill="none"
          stroke={INK}
          strokeWidth={18}
        />
      </g>
    </svg>
  );
};
