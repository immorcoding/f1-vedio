// Shot 5.5 (bars 96–99): the rest of the last lap from above, back straight to the flag, compressed into four bars.
// The map turns with VER so he always drives left to right, as in the close-ups; the lap he has covered is inked in
// behind him, HAM drops back toward the 2.2 s he finished behind (facts.md), and VER's nose reaches the finish line
// exactly on the cut (100.1).
import { carPoint, MangaCar, PIRELLI_2021, RB16B, topAnchorAt, W12 } from "../../../cars";
import { INK, PAPER } from "../../../kit/colors";
import { InkFilterDef, inkFilter } from "../../../kit/ink";
import { focusLines, speedLines } from "../../../kit/lines";
import { ToneDefs, tone } from "../../../kit/tone";
import { PANEL } from "../../../scenes/abu-dhabi-2021/Closeup";
import {
  FinishLine,
  mapView,
  poseAt,
  samplePath,
  TrackMap,
  YAS_MARINA_2021,
} from "../../../tracks";
import { ramp, smooth, type ShotTime } from "./shotClock";

const T = YAS_MARINA_2021;
const LAP = T.lapLength;
const FROM = T.corners.t5Exit + 120;
const CAR_X = 8; // cars drawn 8× life size on the overview map
const verS = (u: number) => FROM + (LAP - FROM) * (0.94 * u + 0.06 * smooth(u));
// Nose ahead of the car's centre (mid-wheelbase), m.
const NOSE_AHEAD =
  carPoint(RB16B, "nose").x -
  (carPoint(RB16B, "rearAxle").x + carPoint(RB16B, "frontAxle").x) / 2;

// The map heading the camera follows: the direction of travel averaged over ±150 m, unwrapped so it never jumps.
const smoothHeading = (s: number) => {
  let h = poseAt(T, FROM).heading;
  let prev = h;
  for (let x = FROM; x <= s; x += 20) {
    let d = poseAt(T, x).heading - prev;
    while (d > 180) d -= 360;
    while (d < -180) d += 360;
    prev += d;
  }
  h = prev;
  // average with a window, also unwrapped relative to h
  let sum = 0;
  let n = 0;
  for (let x = s - 150; x <= s + 150; x += 25) {
    let d = poseAt(T, x).heading - h;
    while (d > 180) d -= 360;
    while (d < -180) d += 360;
    sum += h + d;
    n++;
  }
  return sum / n;
};

export const ToFinish: React.FC<{ st: ShotTime }> = ({ st }) => {
  const { t, dur } = st;
  const u = Math.min(1, t / dur);
  const sV = verS(u) - NOSE_AHEAD * CAR_X; // car centre, so its nose meets the line
  const gap = 60 + 90 * ramp(t, 0.2, dur); // m behind (markers are 8× life size, so never closer than 60 m)
  const sH = sV - gap;
  const zoom = ramp(t, dur - 1.6, dur);
  const view = mapView({
    centre: poseAt(T, sV + 120 * (1 - zoom) + 20 * zoom),
    rotation: -smoothHeading(sV),
    pxPerMetre: 1.6 + 0.9 * zoom,
    screen: { x: 900, y: 560 },
  });
  const ppm = view.pxPerMetre * CAR_X;
  const trail = view.path(samplePath(T, FROM - 40, sV, 0, 8));
  const fin = {
    a: view.project(poseAt(T, 0, -T.width * 1.4)),
    b: view.project(poseAt(T, 0, T.width * 1.4)),
  };
  const vPos = view.project(poseAt(T, sV));
  const vHead = view.heading(poseAt(T, sV).heading);
  return (
    <svg width={1920} height={1080}>
      <defs>
        <ToneDefs />
        <InkFilterDef />
        <clipPath id="tofin-panel">
          <rect x={PANEL.x} y={PANEL.y} width={PANEL.w} height={PANEL.h} />
        </clipPath>
      </defs>
      <rect width={1920} height={1080} fill={PAPER} />
      <g filter={inkFilter()}>
        <g clipPath="url(#tofin-panel)">
          <rect width={1920} height={1080} fill={tone("light")} />
          <path d={focusLines(vPos.x, vPos.y, 260, 120, Math.floor(t * 12))} fill={INK} opacity={0.18} />
          <TrackMap track={T} view={view} theme="paper" road={54} shadow />
          {/* the lap VER has run, inked solid */}
          <path d={trail} fill="none" stroke={INK} strokeWidth={20} strokeLinecap="round" strokeLinejoin="round" />
          <FinishLine a={fin.a} b={fin.b} width={34} theme="paper" />
          {/* speed lines streaming off the leader */}
          <g transform={`translate(${vPos.x} ${vPos.y}) rotate(${vHead})`}>
            <path
              d={speedLines({ x: -560, y: -70, w: 500, h: 140, n: 18, seed: `fin-${Math.floor(t * 15)}`, angle: 0, thickness: 8, length: [0.3, 0.8] })}
              fill={INK}
              opacity={0.85}
            />
          </g>
          {[
            { car: W12, s: sH, c: PIRELLI_2021.hard },
            { car: RB16B, s: sV, c: PIRELLI_2021.soft },
          ].map(({ car, s, c }) => {
            const pose = poseAt(T, s);
            const p = view.project(pose);
            const heading = view.heading(pose.heading);
            return (
              <g key={car.name}>
                <circle cx={p.x} cy={p.y} r={ppm * 3.6} fill={PAPER} stroke={INK} strokeWidth={6} />
                <MangaCar
                  car={car}
                  view="top"
                  at={topAnchorAt(car, { x: p.x, y: p.y, pxPerMetre: ppm }, heading)}
                  state={{ heading, compound: c }}
                />
              </g>
            );
          })}
        </g>
        <rect x={PANEL.x} y={PANEL.y} width={PANEL.w} height={PANEL.h} fill="none" stroke={INK} strokeWidth={10} />
      </g>
    </svg>
  );
};
