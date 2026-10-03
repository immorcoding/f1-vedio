// Shot 5.2 (bars 85–88): T5 from above (MOT-2). The camera opens on the whole hairpin, then swoops down onto the two
// cars as they arrive, north to the right. HAM keeps the outside line; VER, on the inside, brakes later and draws
// level, his line inked on as a dashed arrow. At the cut (89.1, the lock-up) VER is a nose ahead at the turn-in —
// where the T5 panel (shot 5.3) picks them up.
import { MangaCar, PIRELLI_2021, RB16B, topAnchorAt, W12 } from "../../../cars";
import { INK, PAPER } from "../../../kit/colors";
import { InkFilterDef, inkFilter } from "../../../kit/ink";
import { speedLines } from "../../../kit/lines";
import { ToneDefs, tone } from "../../../kit/tone";
import { PANEL } from "../../../scenes/abu-dhabi-2021/Closeup";
import { T5_SECTION } from "../../../scenes/abu-dhabi-2021/t5-map";
import { mapView, poseAt, samplePath, TrackSection, YAS_MARINA_2021 } from "../../../tracks";
import { ramp, type ShotTime } from "./shotClock";

const T = YAS_MARINA_2021;
const S = T.corners;
const V = 85; // m/s on the straight

// HAM along the lap: flat out, then braking at 30 m/s² to 17 m/s at the turn-in on the cut.
const hamS = (t: number, dur: number) => {
  const vEnd = 17;
  const a = 30;
  const tau = (V - vEnd) / a;
  const tb = dur - tau;
  const sEnd = S.t5Apex - 31;
  const sb = sEnd - ((V + vEnd) / 2) * tau;
  if (t <= tb) return sb - V * (tb - t);
  const u = t - tb;
  return sb + V * u - 0.5 * a * u * u;
};

// VER relative to HAM: just behind on the inside, losing a little on the straight, then out-braking him.
const verGap = (t: number, dur: number) =>
  -3 - 1 * ramp(t, 0, dur * 0.6) + 5.6 * ramp(t, dur * 0.66, dur);
const hamLat = (t: number, dur: number) =>
  3.5 + 1.2 * ramp(t, dur * 0.5, dur * 0.75) - 1.6 * ramp(t, dur * 0.8, dur);
const verLat = (t: number, dur: number) =>
  -3.6 - 0.9 * ramp(t, dur * 0.75, dur);

export const T5Top: React.FC<{ st: ShotTime }> = ({ st }) => {
  const { t, dur } = st;
  const sH = hamS(t, dur);
  const sV = sH + verGap(t, dur);
  // wide on the hairpin at first, then down onto the cars
  const e = Math.pow(Math.min(1, t / dur), 1.5);
  const sMid = (sH + sV) / 2;
  const ppmNow = 2.5 + 15 * e;
  // look ahead toward the hairpin, but never so far that the cars leave the left third of the frame
  const ahead = Math.min(0.5 * (S.t5Apex - sMid), 620 / ppmNow) * (1 - e) + 12 * e;
  const centre = poseAt(T, sMid + ahead);
  const h0 = poseAt(T, S.t5Approach + 200).heading;
  let turn = poseAt(T, sH).heading - h0;
  while (turn > 180) turn -= 360;
  while (turn < -180) turn += 360;
  const view = mapView({
    centre,
    rotation: -h0 - 0.3 * turn,
    pxPerMetre: ppmNow,
    screen: { x: 900, y: 560 },
  });
  // cars drawn larger than life on the wide map, close to life size at the end
  const carScale = 3.2 - 1.7 * e;
  const cars = [
    { car: RB16B, s: sV, lat: verLat(t, dur), c: PIRELLI_2021.soft },
    { car: W12, s: sH, lat: hamLat(t, dur), c: PIRELLI_2021.hard },
  ];
  // VER's line: from where he starts to past the apex, on the inside, inked on over the first bars; the cars drive
  // over it.
  const lineDraw = ramp(t, 0.4, dur * 0.45);
  const arrowPts = samplePath(T, hamS(0, dur) + 40, S.t5Apex + 70, (s) =>
    s < S.t5Apex ? -4.2 : -4.2 + (s - S.t5Apex) * 0.08,
  );
  const arrowEnd = view.project(arrowPts[arrowPts.length - 1]);
  const arrowPrev = view.project(arrowPts[arrowPts.length - 4]);
  const ah = Math.atan2(arrowEnd.y - arrowPrev.y, arrowEnd.x - arrowPrev.x);
  const hamLine = view.path(samplePath(T, hamS(0, dur) + 40, S.t5Apex + 40, 4));
  const label = view.project(poseAt(T, S.t5Apex, -30));
  const labelIn = ramp(t, 0.3, 0.9);
  const lock = ramp(t, dur - 0.35, dur);
  const verFront = view.project(poseAt(T, sV + 1.8 * carScale, verLat(t, dur) + 0.9));
  const fwd = (view.heading(poseAt(T, sV).heading) * Math.PI) / 180;
  return (
    <svg width={1920} height={1080}>
      <defs>
        <ToneDefs />
        <InkFilterDef />
        <clipPath id="t5top-panel">
          <rect x={PANEL.x} y={PANEL.y} width={PANEL.w} height={PANEL.h} />
        </clipPath>
        {/* VER's arrow is inked on through a growing mask */}
        <mask id="t5top-draw" maskUnits="userSpaceOnUse" x={0} y={0} width={1920} height={1080}>
          <path
            d={view.path(arrowPts)}
            fill="none"
            stroke="#fff"
            strokeWidth={60}
            pathLength={1}
            strokeDasharray={`${lineDraw} 1`}
          />
        </mask>
      </defs>
      <rect width={1920} height={1080} fill={PAPER} />
      <g filter={inkFilter()}>
        <g clipPath="url(#t5top-panel)">
          <rect x={0} y={0} width={1920} height={1080} fill={tone("mid")} />
          {/* the hairpin: run-off, wall, kerbs; no stand roofs, so the corner itself reads */}
          <TrackSection track={T} view={view} from={600} to={1900} {...T5_SECTION} stands={[]} />
          {/* HAM's line: dots round the outside */}
          <path
            d={hamLine}
            fill="none"
            stroke={INK}
            strokeWidth={7}
            strokeDasharray="2 18"
            strokeLinecap="round"
            opacity={lineDraw}
          />
          <g mask="url(#t5top-draw)">
            <path d={view.path(arrowPts)} fill="none" stroke={PAPER} strokeWidth={26} strokeLinecap="round" strokeDasharray="38 18" />
            <path d={view.path(arrowPts)} fill="none" stroke={INK} strokeWidth={14} strokeLinecap="round" strokeDasharray="38 18" />
          </g>
          {lineDraw > 0.97 ? (
            <path
              d={`M ${arrowEnd.x + Math.cos(ah) * 40} ${arrowEnd.y + Math.sin(ah) * 40} L ${arrowEnd.x + Math.cos(ah + 2.4) * 36} ${arrowEnd.y + Math.sin(ah + 2.4) * 36} L ${arrowEnd.x + Math.cos(ah - 2.4) * 36} ${arrowEnd.y + Math.sin(ah - 2.4) * 36} Z`}
              fill={INK}
              stroke={PAPER}
              strokeWidth={5}
            />
          ) : null}
          {cars.map(({ car, s, lat, c }) => {
            const pose = poseAt(T, s, lat);
            const heading = view.heading(pose.heading);
            const ppm = view.pxPerMetre * carScale;
            const p = view.project(pose);
            return (
              <g key={car.name}>
                {/* speed streaks trailing the car */}
                <g transform={`translate(${p.x} ${p.y}) rotate(${heading})`}>
                  <path
                    d={speedLines({ x: -9 * ppm, y: -1.3 * ppm, w: 6 * ppm, h: 2.6 * ppm, n: 9, seed: `${car.name}-${Math.floor(t * 15)}`, angle: 0, thickness: 6, length: [0.4, 1] })}
                    fill={INK}
                    opacity={0.8 * (1 - lock)}
                  />
                </g>
                <MangaCar
                  car={car}
                  view="top"
                  at={topAnchorAt(car, { x: p.x, y: p.y, pxPerMetre: ppm }, heading)}
                  state={{ heading, steer: -14 * ramp(t, dur * 0.85, dur), compound: c }}
                />
              </g>
            );
          })}
          {/* VER's lock-up starting: smoke from the inside front tyre */}
          {lock > 0
            ? Array.from({ length: 7 }, (_, i) => (
                <circle
                  key={i}
                  cx={verFront.x - i * 12 * Math.cos(fwd)}
                  cy={verFront.y - i * 12 * Math.sin(fwd) - i * 3}
                  r={(8 + i * 4) * lock}
                  fill={PAPER}
                  stroke={INK}
                  strokeWidth={3}
                />
              ))
            : null}
          {/* turn number */}
          <g opacity={labelIn} transform={`translate(${label.x} ${label.y}) scale(${0.6 + 0.4 * labelIn})`}>
            <circle r={62} fill={PAPER} stroke={INK} strokeWidth={8} />
            <text y={21} textAnchor="middle" fontFamily="Arial Black, Arial, sans-serif" fontWeight={900} fontStyle="italic" fontSize={58} fill={INK}>
              T5
            </text>
          </g>
        </g>
        <rect x={PANEL.x} y={PANEL.y} width={PANEL.w} height={PANEL.h} fill="none" stroke={INK} strokeWidth={10} />
      </g>
    </svg>
  );
};
