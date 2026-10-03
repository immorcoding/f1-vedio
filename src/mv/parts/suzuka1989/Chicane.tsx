// Shot 1.3 (bars 15–18): lap 47, out of 130R into the Casio Triangle chicane, from straight above (MOT-2), driven for
// real (MOT-5; drive13.ts). The camera rides with the pair at 300 km/h, so the track — seams, kerbs, marker boards,
// grass — streams past at its true speed while the cars hold the frame. SEN leaves PRO's tow and pulls right; at
// the braking point the shot drops into half-speed slow motion (a white flash, the frame's edges fall into tone,
// afterimages trail the cars): PRO locks up and brakes, SEN brakes later and draws alongside on the inside, PRO
// turns in across him and their front wheels touch — the cut to the side-on impact on 19.1.
//
// Every car pose comes from drive13.ts through staging.ts, which the interpenetration check tests frame by frame.
import {
  MangaCar,
  MP4_5_PRO,
  MP4_5_SEN,
  topAnchorAt,
  type CarSpec,
} from "../../../cars";
import { INK, PAPER } from "../../../kit/colors";
import { InkFilterDef, inkFilter } from "../../../kit/ink";
import { CAPTION_FONT, Caption } from "../../../kit/lettering";
import { speedLines } from "../../../kit/lines";
import { ToneDefs, tone } from "../../../kit/tone";
import {
  mapView,
  poseAt,
  polylinePoints,
  SUZUKA_1989,
  TrackSection,
  widen,
  type MapPoint,
  type MapView,
} from "../../../tracks";
import { shotById, type PictureProps } from "./common";
import {
  proAt,
  rate,
  senAt,
  SLOWMO_AT,
  T_BRAKE_PRO,
  T_BRAKE_SEN,
  type CarDrive,
} from "./drive13";
import {
  carScale13,
  cars13,
  ppm13,
  smooth as smoothstep,
  tau13,
} from "./staging";

const C = SUZUKA_1989.corners.chicane;
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

// Ground marks of a car: black tyre marks where the front wheels locked, as a band along the lap.
const LOCK_TIME = 0.3; // s of locked front wheels at the start of braking

type Car = {
  car: CarSpec;
  tag: "PRO" | "SEN";
  at: (t: number) => CarDrive;
  brake: number;
};
const CARS: Car[] = [
  { car: MP4_5_SEN, tag: "SEN", at: senAt, brake: T_BRAKE_SEN },
  { car: MP4_5_PRO, tag: "PRO", at: proAt, brake: T_BRAKE_PRO },
];

// A point on the car, metres forward (dx) and to the right (dy) of the middle of its wheelbase, on the map.
const onCar = (c: CarDrive, dx: number, dy: number): MapPoint => {
  const a = (c.heading * Math.PI) / 180;
  return {
    x: c.x + Math.cos(a) * dx - Math.sin(a) * dy,
    y: c.y + Math.sin(a) * dx + Math.cos(a) * dy,
  };
};
const FRONT = 1.53; // front axle ahead of the middle of the wheelbase, m
const TRACK_HALF = 0.91; // half the front track, m

// Brake marker boards (plain boards with 3/2/1 bars, ART-5) on the left verge before the chicane.
const BOARDS = [
  { s: C - 150, bars: 3 },
  { s: C - 100, bars: 2 },
  { s: C - 50, bars: 1 },
];

export const Chicane: React.FC<PictureProps> = ({ f }) => {
  const shot = shotById("1.3");
  const tau = tau13(f);
  const { t, pro, sen } = cars13(f);
  const ppm = ppm13(f);
  const scale = carScale13(f);
  const cppm = ppm * scale;
  const slow = smoothstep(tau, SLOWMO_AT - 0.05, SLOWMO_AT + 0.25);
  // camera: on the pair, looking ahead along the road (further at speed), turned so they run left to right
  const mid = { x: (pro.x + sen.x) / 2, y: (pro.y + sen.y) / 2 };
  const sMid = (pro.s + sen.s) / 2;
  const v = (pro.v + sen.v) / 2;
  const lookAhead = 0.14 * v;
  const aheadPose = poseAt(T, sMid + lookAhead, (pro.lat + sen.lat) / 2);
  const centre = {
    x: mid.x + (aheadPose.x - poseAt(T, sMid, (pro.lat + sen.lat) / 2).x),
    y: mid.y + (aheadPose.y - poseAt(T, sMid, (pro.lat + sen.lat) / 2).y),
  };
  // the road's mean heading over the next stretch, so the frame turns smoothly with it
  let hSum = 0;
  for (let k = -2; k <= 2; k++) hSum += poseAt(T, sMid + 10 + k * 12).heading;
  const view = mapView({
    centre,
    rotation: -hSum / 5,
    pxPerMetre: ppm,
    screen: { x: 960, y: 560 },
  });
  const sFrom = sMid - 1100 / ppm - 40;
  const sTo = sMid + 1500 / ppm + 40;
  // the track's markings: a transverse asphalt seam every 8 m, so the road visibly streams past
  const seams: string[] = [];
  for (let s = Math.ceil(sFrom / 8) * 8; s < sTo; s += 8) {
    const a = view.project(poseAt(T, s, -T.width / 2 + 0.6));
    const b = view.project(poseAt(T, s, T.width / 2 - 0.6));
    seams.push(
      `M ${a.x.toFixed(1)} ${a.y.toFixed(1)} L ${b.x.toFixed(1)} ${b.y.toFixed(1)}`,
    );
  }
  // tyre wall on the outside (left) of the chicane, beyond the run-off
  const tyres: MapPoint[] = [];
  for (let s = C - 70; s < C + 30; s += 0.7)
    tyres.push(poseAt(T, s, -(T.width / 2 + 6.5)));
  // chicane label once it is in sight
  const apex = view.project(poseAt(T, C + 8, 0));
  const label = smoothstep(tau, 2.2, 2.7);
  return (
    <svg viewBox="0 0 1920 1080" width={1920} height={1080}>
      <defs>
        <ToneDefs />
        <InkFilterDef />
        <radialGradient id="s13-slow">
          <stop offset="55%" stopColor="#fff" stopOpacity={0} />
          <stop offset="100%" stopColor="#fff" stopOpacity={1} />
        </radialGradient>
        <mask
          id="s13-vignette"
          maskUnits="userSpaceOnUse"
          x={0}
          y={0}
          width={1920}
          height={1080}
        >
          <rect width={1920} height={1080} fill="url(#s13-slow)" />
        </mask>
      </defs>
      <rect width={1920} height={1080} fill={PAPER} />
      <g filter={inkFilter()}>
        <TrackSection
          track={T}
          view={view}
          from={sFrom}
          to={sTo}
          runoff={5}
          barrier
          grass={{ x: 0, y: 0, w: 1920, h: 1080 }}
          escapeRoads={false}
          tyreMarks
        />
        <EscapeRoad view={view} />
        <TrackSection
          track={T}
          view={view}
          from={Math.max(sFrom, C - 70)}
          to={Math.min(sTo, C + 40)}
          runoff={0}
          escapeRoads={false}
        />
        <path
          d={seams.join(" ")}
          stroke={INK}
          strokeWidth={Math.max(3, 0.14 * ppm)}
          opacity={0.6}
        />
        {/* tyre wall */}
        {tyres.map((p, i) => {
          const q = view.project(p);
          return (
            <circle
              key={i}
              cx={q.x}
              cy={q.y}
              r={0.3 * ppm}
              fill={INK}
              stroke={PAPER}
              strokeWidth={Math.max(1, 0.12 * ppm)}
            />
          );
        })}
        {/* brake marker boards */}
        {BOARDS.map((b) => {
          const p = poseAt(T, b.s, -(T.width / 2 + 3.2));
          const q = view.project(p);
          const w = 2.4 * ppm;
          const h = 0.7 * ppm;
          return (
            <g
              key={b.s}
              transform={`translate(${q.x} ${q.y}) rotate(${view.heading(p.heading)})`}
            >
              <rect
                x={-w / 2}
                y={-h / 2}
                width={w}
                height={h}
                fill={PAPER}
                stroke={INK}
                strokeWidth={3}
              />
              {Array.from({ length: b.bars }, (_, k) => (
                <rect
                  key={k}
                  x={-w / 2 + (k + 0.5) * (w / 4)}
                  y={-h / 2}
                  width={w / 9}
                  height={h}
                  fill={INK}
                />
              ))}
            </g>
          );
        })}
        {/* tyre marks of the locked front wheels, laid down from the braking point */}
        {CARS.map(({ tag, at, brake }) => {
          if (t < brake) return null;
          const lines: string[] = [];
          for (const side of [-1, 1]) {
            const pts: MapPoint[] = [];
            for (let u = brake; u <= Math.min(t, brake + LOCK_TIME); u += 0.01)
              pts.push(onCar(at(u), FRONT, side * TRACK_HALF));
            if (pts.length > 1) lines.push(view.path(pts));
          }
          return (
            <g key={`mark-${tag}`}>
              {lines.map((d) => (
                <path
                  key={d}
                  d={d}
                  fill="none"
                  stroke={INK}
                  strokeWidth={0.28 * ppm}
                  strokeLinecap="round"
                  opacity={0.55}
                />
              ))}
            </g>
          );
        })}
        {/* contact shadows, offset down-right (sun high in the south-west) and toward the outside of the turn */}
        {CARS.map(({ tag, at }) => {
          const c = at(t);
          const q = view.project(onCar(c, 0.12 * scale, 0));
          const roll = Math.max(-1, Math.min(1, c.latAccel / 30));
          return (
            <rect
              key={`sh-${tag}`}
              x={-2.1 * cppm}
              y={-0.95 * cppm}
              width={4.2 * cppm}
              height={1.9 * cppm}
              rx={0.5 * cppm}
              fill={INK}
              opacity={0.28}
              transform={`translate(${q.x + 0.35 * cppm} ${q.y + (0.45 - 0.25 * roll) * cppm}) rotate(${view.heading(c.heading)})`}
            />
          );
        })}
        {/* slow-motion afterimages: where each car was a moment ago, fading (manga multiple image) */}
        {slow > 0
          ? CARS.flatMap(({ car, tag, at }) =>
              [0.09, 0.06, 0.03].map((dt, k) => {
                const c = at(t - dt);
                const h = view.heading(c.heading);
                const q = view.project(c);
                return (
                  <g
                    key={`ghost-${tag}-${k}`}
                    opacity={slow * (0.12 + 0.06 * k)}
                  >
                    <MangaCar
                      car={car}
                      view="top"
                      at={topAnchorAt(
                        car,
                        { x: q.x, y: q.y, pxPerMetre: cppm },
                        h,
                      )}
                      state={{ heading: h, steer: c.steer }}
                    />
                  </g>
                );
              }),
            )
          : null}
        {CARS.map(({ car, tag, at }) => {
          const c = at(t);
          const h = view.heading(c.heading);
          const q = view.project(c);
          // speed streaks behind the car, as long as the screen speed (shorter in the slow motion)
          const streak = c.v * rate(tau) * 0.09 * ppm;
          return (
            <g key={tag}>
              <g transform={`translate(${q.x} ${q.y}) rotate(${h})`}>
                <path
                  d={speedLines({
                    x: -2.4 * cppm - streak,
                    y: -0.9 * cppm,
                    w: streak,
                    h: 1.8 * cppm,
                    n: 8,
                    seed: `${tag}-${Math.floor(f / 3)}`,
                    thickness: 5,
                    length: [0.5, 1],
                  })}
                  fill={INK}
                  opacity={0.75}
                />
              </g>
              <MangaCar
                car={car}
                view="top"
                at={topAnchorAt(car, { x: q.x, y: q.y, pxPerMetre: cppm }, h)}
                state={{ heading: h, steer: c.steer }}
              />
            </g>
          );
        })}
        {/* lock-up smoke: puffs left behind at the front wheels while locked, drifting and growing */}
        {CARS.flatMap(({ tag, at, brake }) =>
          Array.from({ length: 10 }, (_, k) => {
            const born = brake + (k / 10) * LOCK_TIME;
            const age = t - born;
            if (age < 0 || age > 1.2) return null;
            return [-1, 1].map((side) => {
              const p = view.project(
                onCar(at(born), FRONT - 0.3, side * TRACK_HALF),
              );
              const r = (0.25 + 0.9 * age) * ppm;
              return (
                <circle
                  key={`smoke-${tag}-${k}-${side}`}
                  cx={p.x}
                  cy={p.y - age * 0.4 * ppm}
                  r={r}
                  fill={PAPER}
                  stroke={INK}
                  strokeWidth={2}
                  opacity={Math.max(0, 0.85 - age * 0.7)}
                />
              );
            });
          }),
        )}
        {/* driver tags above and below the pair while they are still far from the corner */}
        {CARS.map(({ tag, at }) => {
          const c = at(t);
          const q = view.project(c);
          const p = {
            x: q.x,
            y: q.y + (tag === "SEN" ? 1 : -1) * (1.4 * cppm + 34),
          };
          return (
            <g key={`tag-${tag}`} opacity={1 - smoothstep(tau, 4.5, 5.2)}>
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
        {/* the chicane's name, once, pointing at its first apex */}
        {label > 0 && apex.x < 1900 ? (
          <g opacity={label * (1 - smoothstep(tau, 5.6, 6.0))}>
            <path
              d={`M ${apex.x} ${apex.y} L ${apex.x + 90} ${apex.y + 120}`}
              stroke={INK}
              strokeWidth={4}
            />
            <rect
              x={apex.x + 60}
              y={apex.y + 118}
              width={220}
              height={60}
              fill={PAPER}
              stroke={INK}
              strokeWidth={4}
            />
            <text
              x={apex.x + 170}
              y={apex.y + 160}
              textAnchor="middle"
              fontFamily={CAPTION_FONT}
              fontSize={36}
              fill={INK}
            >
              减速弯
            </text>
          </g>
        ) : null}
        {/* the slow-motion beat: a white flash at its start, then the edges of the frame fall into tone */}
        {slow > 0 ? (
          <g>
            <rect
              width={1920}
              height={1080}
              fill={tone("mid")}
              mask="url(#s13-vignette)"
              opacity={0.5 * slow}
            />
            <rect
              width={1920}
              height={1080}
              fill={PAPER}
              opacity={
                0.7 *
                (1 - smoothstep(tau, SLOWMO_AT, SLOWMO_AT + 0.25)) *
                (tau >= SLOWMO_AT ? 1 : 0)
              }
            />
          </g>
        ) : null}
        <g transform="translate(1460 80)">
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
