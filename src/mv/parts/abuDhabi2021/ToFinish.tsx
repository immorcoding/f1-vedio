// Shot 5.5 (bars 96–99): the rest of the last lap from above, back straight to the flag, compressed into four bars.
// The map turns with VER so he always drives left to right, as in the close-ups; the lap he has covered is inked in
// behind him, HAM drops back toward the 2.2 s he finished behind (facts.md), and VER's nose reaches the finish line
// exactly on the cut (100.1). The user kept this following camera and the small top-view cars over #23's fixed map
// (2026-10-04), with #23's glows on top: each car in a paper glow ringed in its team colour (VER red, HAM teal) with
// a comet tail behind it, pulsing on every beat. The tyres roll at the map's speed and each car has its contact shadow.
import {
  carPoint,
  MangaCar,
  PIRELLI_2021,
  RB16B,
  topAnchorAt,
  W12,
  wheelAngleAt,
} from "../../../cars";
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
import { SECONDS_PER_BEAT } from "../../timing.ts";
import { ramp, smooth, type ShotTime } from "./shotClock";
import { rollAt, TopShadow } from "./TopShadow";

// The glow colours (#23): the livery's accent (RB red, Petronas teal).
const RING = { VER: "#d8202b", HAM: "#00a19b" } as const;

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
  // the beat pulse (#23): a flare on every beat that decays within it
  const beat = (t % SECONDS_PER_BEAT) / SECONDS_PER_BEAT;
  const pulse = Math.exp(-beat * 4);
  // real speed along the lap, m/s (the run is compressed), for the tyres; the cars are CAR_X life size, so their
  // tread turns CAR_X times slower than a life-size tyre over the same ground
  const dt = 1 / 60;
  const speedOf = (s: (tt: number) => number) => (s(t + dt) - s(t - dt)) / (2 * dt);
  const sAt = (tt: number) => verS(Math.min(1, Math.max(0, tt / dur))) - NOSE_AHEAD * CAR_X;
  const vV = speedOf(sAt);
  const vH = speedOf((tt) => sAt(tt) - (60 + 90 * ramp(tt, 0.2, dur)));
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
            { car: W12, s: sH, c: PIRELLI_2021.hard, v: vH, tag: "HAM" as const },
            { car: RB16B, s: sV, c: PIRELLI_2021.soft, v: vV, tag: "VER" as const },
          ].map(({ car, s, c, v, tag }) => {
            const pose = poseAt(T, s);
            const p = view.project(pose);
            const heading = view.heading(pose.heading);
            const glow = ppm * (3.4 + 0.9 * pulse);
            // a comet tail in the team colour along the track behind the car
            const tail = view.path(samplePath(T, Math.max(FROM - 40, s - 70), s - 2.5 * CAR_X, 0, 6));
            return (
              <g key={car.name}>
                <path d={tail} fill="none" stroke={RING[tag]} strokeWidth={ppm * 1.1} strokeLinecap="round" opacity={0.75} />
                <circle cx={p.x} cy={p.y} r={glow} fill={PAPER} opacity={0.55 + 0.35 * pulse} />
                <circle cx={p.x} cy={p.y} r={glow * 0.72} fill={PAPER} stroke={RING[tag]} strokeWidth={ppm * (0.45 + 0.25 * pulse)} />
                <circle cx={p.x} cy={p.y} r={glow * 0.72 + ppm * 0.3} fill="none" stroke={INK} strokeWidth={4} />
                <TopShadow car={car} at={p} heading={heading} ppm={ppm} roll={rollAt(T, s, v / CAR_X)} />
                <MangaCar
                  car={car}
                  view="top"
                  at={topAnchorAt(car, { x: p.x, y: p.y, pxPerMetre: ppm }, heading)}
                  state={{ heading, compound: c, wheelAngle: wheelAngleAt(car, s / CAR_X), speed: v / CAR_X }}
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
