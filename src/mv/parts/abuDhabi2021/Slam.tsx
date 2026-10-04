// Shot 5.1 (bar 82): the drop. A new image on the hit, not a flash back into the build-up's framing: the camera is
// straight above the straight out of T4, the two cars rush diagonally at the lens (down-right, the way 5.3 travels),
// VER tucked into HAM's tow. The whole panel slams in tilted and oversized and settles in a tenth of a second; the
// first three frames are an impact frame (the page inverted, ink for paper); focus lines press in from every edge on
// the two noses, and the camera keeps dropping toward them through the bar (the cars grow: they come at us). The
// road, kerbs and tyre marks stream past at the cars' true speed (staging.ts).
import { MangaCar, PIRELLI_2021, RB16B, topAnchorAt, W12, wheelAngleAt } from "../../../cars";
import { INK, PAPER } from "../../../kit/colors";
import { InkFilterDef, inkFilter } from "../../../kit/ink";
import { focusLines, speedLines } from "../../../kit/lines";
import { ToneDefs, tone } from "../../../kit/tone";
import { T5_SECTION } from "../../../scenes/abu-dhabi-2021/t5-map";
import { autoKerbs, mapView, poseAt, TrackSection, YAS_MARINA_2021 } from "../../../tracks";
import { hit, ramp, type ShotTime } from "./shotClock";
import { rollAt, TopShadow } from "./TopShadow";
import { hamSpeed, SLAM_SCALE, slamPlan, verSpeed } from "./staging.ts";

const T = YAS_MARINA_2021;
// Screen heading of travel: down and to the right, toward the lens and the way the side-on shots run.
const SCREEN_HEADING = 38;
const KERBS = autoKerbs(T, 760, 1100, 1 / 200);

export const Slam: React.FC<{ st: ShotTime }> = ({ st }) => {
  const { t, dur } = st;
  const impact = st.frame < 3; // the inverted impact frame
  const slam = 1 - ramp(t, 0, 0.13); // panel settling 1 → 0
  const jolt = hit(t, 0, 0.3);
  const c = slamPlan(t);
  const mid = poseAt(T, (c.ham.s + c.ver.s) / 2 + 2, (c.ham.lat + c.ver.lat) / 2);
  // the camera drops toward the cars through the bar: they grow ~45 %, faster at the end (into the next cut)
  const ppm = 78 * (1 + 0.28 * ramp(t, 0, dur) + 0.17 * Math.pow(t / dur, 3));
  const rotation = SCREEN_HEADING - poseAt(T, c.ham.s).heading;
  const view = mapView({
    centre: mid,
    rotation,
    pxPerMetre: ppm,
    screen: { x: 960, y: 560 },
  });
  const focus = view.project(mid);
  const cars = [
    { car: W12, ...c.ham, compound: PIRELLI_2021.hard },
    { car: RB16B, ...c.ver, compound: PIRELLI_2021.soft },
  ];
  const sx = Math.sin(t * 63) * (2 + 22 * jolt);
  const sy = Math.cos(t * 57) * (2 + 16 * jolt);
  const panelScale = 1 + 0.35 * slam;
  const seed = Math.floor(t * 30);
  return (
    <div
      style={{
        width: 1920,
        height: 1080,
        filter: impact ? "invert(1)" : undefined,
      }}
    >
      <svg width={1920} height={1080}>
        <defs>
          <ToneDefs />
          <InkFilterDef />
          <clipPath id="slam-panel">
            <path d="M 60 30 L 1890 60 L 1860 1050 L 30 1020 Z" />
          </clipPath>
        </defs>
        <rect width={1920} height={1080} fill={INK} />
        <g
          transform={`translate(${960 + sx} ${540 + sy}) rotate(${-3 * slam}) scale(${panelScale}) translate(-960 -540)`}
        >
          <g filter={inkFilter()}>
            <g clipPath="url(#slam-panel)">
              <rect width={1920} height={1080} fill={tone("mid")} />
              <TrackSection
                track={T}
                view={view}
                from={c.ver.s - 60}
                to={c.ham.s + 90}
                {...T5_SECTION}
                kerbs={KERBS}
                stands={[]}
              />
              {/* the road streaming under the cars: long streaks along the travel, re-dealt every two frames */}
              <path
                d={speedLines({
                  x: -400,
                  y: -400,
                  w: 2800,
                  h: 2000,
                  n: 70,
                  seed: `slam-road-${seed}`,
                  angle: SCREEN_HEADING + 180,
                  thickness: 5,
                  length: [0.15, 0.45],
                })}
                fill={INK}
                opacity={0.55}
              />
              {cars.map(({ car, s, lat, compound }) => {
                const pose = poseAt(T, s, lat);
                const heading = view.heading(pose.heading);
                const p = view.project(pose);
                const v = car === RB16B ? verSpeed(t) : hamSpeed(t);
                return (
                  <g key={car.name}>
                    <TopShadow car={car} at={p} heading={heading} ppm={ppm * SLAM_SCALE} roll={rollAt(T, s, v)} />
                    <MangaCar
                      car={car}
                      view="top"
                      at={topAnchorAt(car, { x: p.x, y: p.y, pxPerMetre: ppm * SLAM_SCALE }, heading)}
                      state={{ heading, compound, wheelAngle: wheelAngleAt(car, s), speed: v }}
                    />
                  </g>
                );
              })}
              {/* focus lines pressing in from every edge on the two noses */}
              <path
                d={focusLines(focus.x + 120, focus.y + 90, 430 - 60 * jolt, 150, seed)}
                fill={PAPER}
                opacity={0.9}
              />
              <path
                d={focusLines(focus.x + 120, focus.y + 90, 520 - 60 * jolt, 110, seed + 3)}
                fill={INK}
                opacity={0.85}
              />
            </g>
            <path
              d="M 60 30 L 1890 60 L 1860 1050 L 30 1020 Z"
              fill="none"
              stroke={PAPER}
              strokeWidth={10}
            />
          </g>
        </g>
      </svg>
    </div>
  );
};
