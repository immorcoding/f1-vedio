// Shot 1.3 (bars 15–18): the chicane after 130R from straight above (MOT-2), lap 47. The view opens wide on the run
// from 130R and comes down onto the two McLarens as they brake. PRO stays left (the outside), ready to turn right into
// the chicane; SEN pulls out of his tow and dives down the inside, his line inked on as a dashed arrow. At the cut
// (19.1, the crash) PRO is turning in across SEN's nose — where shot 1.4 picks them up.
import { Easing } from "remotion";
import { MangaCar, MP4_5_PRO, MP4_5_SEN, topAnchorAt } from "../../../cars";
import { INK, PAPER } from "../../../kit/colors";
import { InkFilterDef, inkFilter } from "../../../kit/ink";
import { Caption } from "../../../kit/lettering";
import { speedLines } from "../../../kit/lines";
import { ToneDefs } from "../../../kit/tone";
import {
  mapView,
  poseAt,
  samplePath,
  SUZUKA_1989,
  TrackSection,
} from "../../../tracks";
import { ramp, shotById, type PictureProps } from "./common";

const T = SUZUKA_1989;
const C = T.corners.chicane;

// Lap distance and lateral offset (m, + = right, the inside of the chicane) of each car, u = 0…1 over the shot.
const proS = (u: number) => C - 14 - 150 * Math.pow(1 - u, 1.6);
const senS = (u: number) =>
  proS(u) - (14 - 11.5 * ramp(u, 0.3, 1, Easing.inOut(Easing.quad)));
const proLat = (u: number) =>
  -3.2 + 1.2 * ramp(u, 0.86, 1, Easing.in(Easing.quad));
const senLat = (u: number) => -2.6 + 6.6 * ramp(u, 0.3, 0.8);

export const Chicane: React.FC<PictureProps> = ({ f }) => {
  const shot = shotById("1.3");
  const len = shot.to - shot.from;
  const t = f - shot.from;
  const u = Math.min(1, t / len);
  const e = Math.pow(u, 1.3);
  const sP = proS(u);
  const sS = senS(u);
  const sMid = (sP + sS) / 2;
  const ppm = 4.5 + 10.5 * e;
  // wide: centred toward the chicane; close: on the cars
  const centre = poseAt(T, sMid + (C - sMid) * 0.55 * (1 - e) + 6 * e);
  const h0 = poseAt(T, C - 120).heading;
  const view = mapView({
    centre,
    rotation: -h0,
    pxPerMetre: ppm,
    screen: { x: 900, y: 560 },
  });
  // the cars are drawn larger than life on the wide map, near life size at the end
  const carScale = Math.max(1, 34 / ppm);
  const lineDraw = ramp(t, len * 0.15, len * 0.6);
  const arrowPts = samplePath(T, senS(0.25), C + 18, (s) => {
    const k = Math.min(
      1,
      Math.max(0, (s - senS(0.25)) / (C - 30 - senS(0.25))),
    );
    return -2.6 + 7.4 * k;
  });
  const end = view.project(arrowPts[arrowPts.length - 1]);
  const prev = view.project(arrowPts[arrowPts.length - 4]);
  const ah = Math.atan2(end.y - prev.y, end.x - prev.x);
  const caption = ramp(t, 8, 22, Easing.out(Easing.back(1.5)));
  const cars = [
    { car: MP4_5_SEN, s: sS, lat: senLat(u), steer: 0 },
    { car: MP4_5_PRO, s: sP, lat: proLat(u), steer: 16 * ramp(u, 0.86, 1) },
  ];
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
          from={C - 520}
          to={C + 260}
          runoff={8}
          barrier
          grass={{ x: 0, y: 0, w: 1920, h: 1080 }}
        />
        {/* SEN's line down the inside */}
        <g mask="url(#s13-draw)">
          <path
            d={view.path(arrowPts)}
            fill="none"
            stroke={PAPER}
            strokeWidth={24}
            strokeLinecap="round"
            strokeDasharray="36 16"
          />
          <path
            d={view.path(arrowPts)}
            fill="none"
            stroke={INK}
            strokeWidth={12}
            strokeLinecap="round"
            strokeDasharray="36 16"
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
        {cars.map(({ car, s, lat, steer }) => {
          const pose = poseAt(T, s, lat);
          const heading = view.heading(pose.heading);
          const p = view.project(pose);
          const cppm = ppm * carScale;
          return (
            <g key={car.driver.number}>
              <g transform={`translate(${p.x} ${p.y}) rotate(${heading})`}>
                <path
                  d={speedLines({
                    x: -8.5 * cppm,
                    y: -1.1 * cppm,
                    w: 5.5 * cppm,
                    h: 2.2 * cppm,
                    n: 9,
                    seed: `${car.driver.number}-${Math.floor(t / 4)}`,
                    thickness: 6,
                    length: [0.4, 1],
                  })}
                  fill={INK}
                  opacity={0.75 * (1 - ramp(u, 0.85, 1))}
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
        {/* driver tags, read at a glance on the wide map */}
        {cars.map(({ car, s, lat }) => {
          // PRO's tag above his car (his left), SEN's below (his right), at a fixed distance on screen
          const c = view.project(poseAt(T, s, lat));
          const p = { x: c.x - 30, y: c.y + (car === MP4_5_SEN ? 85 : -85) };
          return (
            <g key={`tag-${car.driver.number}`} opacity={1 - ramp(u, 0.7, 0.9)}>
              <rect
                x={p.x - 52}
                y={p.y - 26}
                width={104}
                height={46}
                fill={car === MP4_5_SEN ? INK : PAPER}
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
                fill={car === MP4_5_SEN ? PAPER : INK}
              >
                {car === MP4_5_SEN ? "SEN" : "PRO"}
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
