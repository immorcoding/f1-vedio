// Shot 5.1d (bar 86): wheel to wheel, from straight above and close (~110 px/m): VER, drawn up on the inside, has
// his front wheels level with HAM's rear wheels, 0.7 m of air between the tyres. Travel runs left to right as in
// every side-on shot (the inside, VER's side, at the top). The camera rides with the pair at their true speed
// (staging.ts), so the road's tyre marks and painted edge stream past under heavy speed lines; the cars shiver.
import { MangaCar, PIRELLI_2021, RB16B, topAnchorAt, W12 } from "../../../cars";
import { INK, PAPER } from "../../../kit/colors";
import { InkFilterDef, inkFilter } from "../../../kit/ink";
import { CAPTION_FONT } from "../../../kit/lettering";
import { speedLines } from "../../../kit/lines";
import { ToneDefs, tone } from "../../../kit/tone";
import { PANEL } from "../../../scenes/abu-dhabi-2021/Closeup";
import { T5_SECTION } from "../../../scenes/abu-dhabi-2021/t5-map";
import { mapView, poseAt, TrackSection, YAS_MARINA_2021 } from "../../../tracks";
import { ramp, type ShotTime } from "./shotClock";
import { slicePlan } from "./staging.ts";

const T = YAS_MARINA_2021;

export const TopSlice: React.FC<{ st: ShotTime; t0: number }> = ({ st, t0 }) => {
  const { t, dur } = st;
  const race = t0 + t;
  const c = slicePlan(race);
  const sH = c.ham.s;
  const sV = c.ver.s;
  const latV = c.ver.lat;
  const HAM_LAT = c.ham.lat;
  const ppm = 105 * (1 + 0.12 * ramp(t, 0, dur));
  // centred between VER's front axle and HAM's rear axle
  const centre = poseAt(T, sH + 2.4, (HAM_LAT + latV) / 2);
  const h0 = poseAt(T, sH).heading;
  const view = mapView({ centre, rotation: -h0, pxPerMetre: ppm, screen: { x: 960, y: 560 } });
  const seed = st.frame;
  const cars = [
    { car: RB16B, s: sV, lat: latV, comp: PIRELLI_2021.soft, tag: "VER" },
    { car: W12, s: sH, lat: HAM_LAT, comp: PIRELLI_2021.hard, tag: "HAM" },
  ];
  return (
    <svg width={1920} height={1080}>
      <defs>
        <ToneDefs />
        <InkFilterDef />
        <clipPath id="slice-panel">
          <rect x={PANEL.x} y={PANEL.y} width={PANEL.w} height={PANEL.h} />
        </clipPath>
      </defs>
      <rect width={1920} height={1080} fill={PAPER} />
      <g filter={inkFilter()}>
        <g clipPath="url(#slice-panel)">
          <rect width={1920} height={1080} fill={tone("mid")} />
          <TrackSection track={T} view={view} from={sH - 40} to={sH + 40} {...T5_SECTION} edgeLines stands={[]} />
          <path
            d={speedLines({
              x: -300,
              y: 0,
              w: 2600,
              h: 1080,
              n: 80,
              seed: `slice-${seed}`,
              angle: 180,
              thickness: 6,
              length: [0.2, 0.6],
            })}
            fill={INK}
            opacity={0.6}
          />
          {cars.map(({ car, s, lat, comp, tag }, k) => {
            const pose = poseAt(T, s, lat);
            const heading = view.heading(pose.heading);
            const p = view.project(pose);
            const shiver = Math.sin(t * 43 + k * 2) * 1.5;
            const tagP = view.project(poseAt(T, s + 2.4, lat + (tag === "VER" ? -1.9 : 1.9)));
            return (
              <g key={tag}>
                <MangaCar
                  car={car}
                  view="top"
                  at={topAnchorAt(car, { x: p.x, y: p.y + shiver, pxPerMetre: ppm }, heading)}
                  state={{ heading, compound: comp }}
                />
                <g transform={`translate(${tagP.x} ${tagP.y + (tag === "VER" ? -20 : 20)})`}>
                  <rect x={-62} y={-30} width={124} height={60} fill={tag === "VER" ? INK : PAPER} stroke={INK} strokeWidth={5} />
                  <text y={15} textAnchor="middle" fontFamily={CAPTION_FONT} fontWeight={700} fontSize={44} fill={tag === "VER" ? PAPER : INK}>
                    {tag}
                  </text>
                </g>
              </g>
            );
          })}
        </g>
        <rect x={PANEL.x} y={PANEL.y} width={PANEL.w} height={PANEL.h} fill="none" stroke={INK} strokeWidth={10} />
      </g>
    </svg>
  );
};
