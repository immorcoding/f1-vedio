// Shot 5.2 (bars 88–89): the T5 braking zone from above (MOT-2), tight on the two cars. The camera tracks them at
// their true speed (staging.ts) and keeps pushing in, from ~1/5 of the frame width to ~1/4 by the braking point and
// tighter again on the 89.4 snare fill; travel runs left to right as in every side-on shot, so the inside of the
// left-hand hairpin (VER's line) is the top of the frame and the camera side (HAM's) the bottom. VER/HAM tags ride on
// the outer side of each car. VER's dive is inked on ahead of him as a dashed arrow down the inside to the apex.
// HAM brakes on 88.4 at 4 g; VER brakes 0.15 s later, closes the gap and is a nose ahead at the turn-in on the cut
// (90.1), his front-right just locking — where the T5 panel (shot 5.3) picks them up.
import { MangaCar, PIRELLI_2021, RB16B, topAnchorAt, W12, wheelAngleAt } from "../../../cars";
import { INK, PAPER } from "../../../kit/colors";
import { CAPTION_FONT } from "../../../kit/lettering";
import { InkFilterDef, inkFilter } from "../../../kit/ink";
import { focusLines, speedLines } from "../../../kit/lines";
import { ToneDefs, tone } from "../../../kit/tone";
import { PANEL } from "../../../scenes/abu-dhabi-2021/Closeup";
import { T5_SECTION } from "../../../scenes/abu-dhabi-2021/t5-map";
import { mapView, poseAt, samplePath, TrackSection, YAS_MARINA_2021 } from "../../../tracks";
import { at } from "../../timing.ts";
import { hit, ramp, secondsInShot, type ShotTime } from "./shotClock";
import { rollAt, TopShadow } from "./TopShadow";
import { braking, hamSpeed, T5_SCALE, t5Plan, verSpeed } from "./staging.ts";

const T = YAS_MARINA_2021;
const S = T.corners;
// Map heading of the straight into T5, which the camera holds level (screen right).
const H0 = poseAt(T, S.t5Apex - 220).heading;

export const T5Top: React.FC<{ st: ShotTime; t0: number }> = ({ st, t0 }) => {
  const { t, dur } = st;
  const race = t0 + t;
  const c = t5Plan(race);
  const fill = secondsInShot(st, at(89, 4)); // the snare fill into the lock-up
  const punch = ramp(t, fill, dur);
  const ppm = 48 + 14 * ramp(t, 0, fill) + 18 * punch * punch;
  const sMid = (c.ham.s + c.ver.s) / 2;
  const centre = poseAt(T, sMid + 3, (c.ham.lat + c.ver.lat) / 2);
  const view = mapView({
    centre,
    rotation: -H0,
    pxPerMetre: ppm,
    screen: { x: 940, y: 520 },
  });
  const cars = [
    { car: RB16B, ...c.ver, tag: "VER", comp: PIRELLI_2021.soft, who: "VER" as const },
    { car: W12, ...c.ham, tag: "HAM", comp: PIRELLI_2021.hard, who: "HAM" as const },
  ];
  // VER's dive: from his nose, down the inside to the apex kerb and round it
  const vNose = c.ver.s + 5.3;
  const apexLat = -5.2;
  const arrowPts = samplePath(T, vNose, S.t5Apex + 30, (s) => {
    const u = Math.min(1, Math.max(0, (s - vNose) / Math.max(10, S.t5Apex - 20 - vNose)));
    const k = u * u * (3 - 2 * u);
    return c.ver.lat + (apexLat - c.ver.lat) * k;
  }, 1.5);
  const arrowIn = ramp(t, 0.15, 0.6);
  const arrowEnd = view.project(arrowPts[arrowPts.length - 1]);
  const arrowPrev = view.project(arrowPts[arrowPts.length - 4]);
  const ah = Math.atan2(arrowEnd.y - arrowPrev.y, arrowEnd.x - arrowPrev.x);
  const lock = ramp(race, t0 + dur - 0.3, t0 + dur);
  const seed = Math.floor(t * 30);
  const flash = hit(t, fill, 0.15);
  const speedK = hamSpeed(race) / 84;
  return (
    <svg width={1920} height={1080}>
      <defs>
        <ToneDefs />
        <InkFilterDef />
        <clipPath id="t5top-panel">
          <rect x={PANEL.x} y={PANEL.y} width={PANEL.w} height={PANEL.h} />
        </clipPath>
        <mask id="t5top-draw" maskUnits="userSpaceOnUse" x={0} y={0} width={1920} height={1080}>
          <path
            d={view.path(arrowPts)}
            fill="none"
            stroke="#fff"
            strokeWidth={80}
            pathLength={1}
            strokeDasharray={`${arrowIn} 1`}
          />
        </mask>
      </defs>
      <rect width={1920} height={1080} fill={PAPER} />
      <g filter={inkFilter()}>
        <g clipPath="url(#t5top-panel)" transform={`translate(${Math.sin(t * 47) * 6 * flash} ${Math.cos(t * 43) * 6 * flash})`}>
          <rect x={0} y={0} width={1920} height={1080} fill={tone("mid")} />
          <TrackSection track={T} view={view} from={sMid - 80} to={sMid + 260} {...T5_SECTION} stands={[]} />
          <g mask="url(#t5top-draw)">
            <path d={view.path(arrowPts)} fill="none" stroke={PAPER} strokeWidth={30} strokeLinecap="round" strokeDasharray="44 20" />
            <path d={view.path(arrowPts)} fill="none" stroke={INK} strokeWidth={16} strokeLinecap="round" strokeDasharray="44 20" />
          </g>
          {arrowIn > 0.97 ? (
            <path
              d={`M ${arrowEnd.x + Math.cos(ah) * 46} ${arrowEnd.y + Math.sin(ah) * 46} L ${arrowEnd.x + Math.cos(ah + 2.4) * 42} ${arrowEnd.y + Math.sin(ah + 2.4) * 42} L ${arrowEnd.x + Math.cos(ah - 2.4) * 42} ${arrowEnd.y + Math.sin(ah - 2.4) * 42} Z`}
              fill={INK}
              stroke={PAPER}
              strokeWidth={6}
            />
          ) : null}
          {cars.map(({ car, s, lat, comp, who }) => {
            const pose = poseAt(T, s, lat);
            const heading = view.heading(pose.heading);
            const k = ppm * T5_SCALE;
            const p = view.project(pose);
            const b = braking(race, who);
            return (
              <g key={car.name}>
                <g transform={`translate(${p.x} ${p.y}) rotate(${heading})`}>
                  <path
                    d={speedLines({
                      x: -12 * k,
                      y: -1.3 * k,
                      w: 9 * k,
                      h: 2.6 * k,
                      n: 10,
                      seed: `${car.name}-${seed}`,
                      angle: 0,
                      thickness: 7,
                      length: [0.4, 1],
                    })}
                    fill={INK}
                    opacity={0.8 * (1 - 0.5 * b) * speedK}
                  />
                </g>
                <TopShadow
                  car={car}
                  at={p}
                  heading={heading}
                  ppm={k}
                  roll={rollAt(T, s, who === "VER" ? verSpeed(race) : hamSpeed(race))}
                />
                <MangaCar
                  car={car}
                  view="top"
                  at={topAnchorAt(car, { x: p.x, y: p.y, pxPerMetre: k }, heading)}
                  state={{
                    heading,
                    steer: who === "VER" ? -8 * lock : 0,
                    compound: comp,
                    wheelAngle: wheelAngleAt(car, s),
                    speed: who === "VER" ? verSpeed(race) : hamSpeed(race),
                  }}
                />
              </g>
            );
          })}
          {/* VER's front-right starting to lock: a few fine puffs */}
          {lock > 0
            ? (() => {
                const pose = poseAt(T, c.ver.s + 4.4, c.ver.lat + 0.8);
                const q = view.project(pose);
                const back = (view.heading(pose.heading) * Math.PI) / 180;
                return Array.from({ length: 8 }, (_, i) => (
                  <circle
                    key={i}
                    cx={q.x - Math.cos(back) * i * 14 * lock}
                    cy={q.y - Math.sin(back) * i * 14 * lock + (i % 2) * 6}
                    r={(5 + i * 3) * lock}
                    fill={PAPER}
                    stroke={INK}
                    strokeWidth={2.5}
                  />
                ));
              })()
            : null}
          {/* tags on the outer side of each car: VER above (inside), HAM below */}
          {cars.map(({ s, lat, tag }) => {
            const p = view.project(poseAt(T, s + 2.8, lat + (tag === "VER" ? -2.4 : 2.4) * T5_SCALE));
            const y = p.y + (tag === "VER" ? -26 : 26);
            return (
              <g key={tag} transform={`translate(${p.x} ${y})`}>
                <rect x={-58} y={-28} width={116} height={56} fill={tag === "VER" ? INK : PAPER} stroke={INK} strokeWidth={5} />
                <text y={14} textAnchor="middle" fontFamily={CAPTION_FONT} fontWeight={700} fontSize={40} fill={tag === "VER" ? PAPER : INK}>
                  {tag}
                </text>
              </g>
            );
          })}
          {punch > 0 ? (
            <path d={focusLines(960, 540, 700 - 250 * punch, 120, seed)} fill={INK} opacity={0.6 * punch} />
          ) : null}
        </g>
        <rect x={PANEL.x} y={PANEL.y} width={PANEL.w} height={PANEL.h} fill="none" stroke={INK} strokeWidth={10} />
      </g>
    </svg>
  );
};
