// Shot 2.5, bars 49–50 (review-2 #4): the snap back to real time on 49.1 (`brazil2008.realTime`) is a cut to a new
// composition, from straight above (MOT-2, ART-40), so the 51.1 cut into 2.6's side-on line reads as a real change of
// shot. Out of Junção and up the hill in the rain at true speed (MOT-5): the camera rides with HAM, the track and the
// standing water stream past, and GLO, on dry tyres and twitching on the outside line, drops back across the frame —
// the gap grows from ~6 m to ~24 m (staging.ts `pullAway25`). The tags carry the new order: 5 HAM, 6 GLO.
import { MangaCar, MP4_23, TF108, topAnchorAt } from "../../../cars";
import { INK, PAPER } from "../../../kit/colors";
import { inkFilter } from "../../../kit/ink";
import { speedLines } from "../../../kit/lines";
import { Rain } from "../../../kit/rain";
import { tone } from "../../../kit/tone";
import {
  curvatureAt,
  INTERLAGOS_2008,
  mapView,
  poseAt,
  TrackSection,
} from "../../../tracks";
import type { ShotTime } from "../abuDhabi2021/shotClock";
import { Page } from "./common";
import { PosTag } from "./PosTag";
import { passRaceTime, pullAway25 } from "./staging.ts";

const T = INTERLAGOS_2008;
const PANEL = { x: 40, y: 40, w: 1840, h: 1000 };
const PPM = 34;
// HAM's place on screen: right of centre, so GLO has room to fall back across the frame
const HAM_AT = { x: 1320, y: 560 };

export const PullAway: React.FC<{ st: ShotTime }> = ({ st }) => {
  const { t } = st;
  const plan = pullAway25(t);
  const tau = passRaceTime(t);
  // the camera rides with HAM, turning with the road
  const camPose = poseAt(T, plan.ham.s + 4);
  const view = mapView({
    centre: poseAt(T, plan.ham.s, plan.ham.lat + 1.5),
    rotation: -camPose.heading,
    pxPerMetre: PPM,
    screen: HAM_AT,
  });
  const cars = (
    [
      { code: "GLO", car: TF108, tread: "dry", q: plan.glo, pos: 6 },
      { code: "HAM", car: MP4_23, tread: "wet", q: plan.ham, pos: 5 },
    ] as const
  ).map((c) => {
    const pose = poseAt(T, c.q.s, c.q.lat);
    const heading = view.heading(pose.heading) + c.q.yaw;
    // front wheels steered with the road (×3 so it reads, as in 2.4), GLO counter-steering his slide
    const steer =
      ((Math.atan(3.1 * curvatureAt(T, c.q.s)) * 180) / Math.PI) * 3 +
      (c.code === "GLO" ? -9 * Math.sin(tau * 3.1 + 0.6) : 0);
    // tags on the outer side of each car: HAM's on the inside, GLO's on the outside
    const tag = view.project(
      poseAt(T, c.q.s, c.q.lat + (c.code === "GLO" ? 3.2 : -3.6)),
    );
    return { ...c, heading, steer, p: view.project(pose), tag };
  });
  return (
    <Page>
      <defs>
        <clipPath id="b25-plan">
          <rect x={PANEL.x} y={PANEL.y} width={PANEL.w} height={PANEL.h} />
        </clipPath>
      </defs>
      <g filter={inkFilter()}>
        <g clipPath="url(#b25-plan)">
          <rect x={0} y={0} width={1920} height={1080} fill={tone("light")} />
          <TrackSection
            track={T}
            view={view}
            from={plan.ham.s - 120}
            to={plan.ham.s + 80}
            runoff={9}
            barrier
            tyreMarks
            grass={PANEL}
          />
          {/* standing water, fixed on the racing surface and streaming past with it */}
          {Array.from({ length: 30 }, (_, i) => {
            const s0 = 3400 + i * 11 + ((i * 7) % 5);
            const q = view.project(poseAt(T, s0, ((i * 37) % 9) - 4.5));
            return (
              <ellipse
                key={i}
                cx={q.x}
                cy={q.y}
                rx={(2.5 + (i % 3)) * PPM}
                ry={0.7 * PPM}
                fill={tone("dark")}
                opacity={0.5}
                transform={`rotate(${view.heading(poseAt(T, s0).heading)} ${q.x} ${q.y})`}
              />
            );
          })}
          {/* real-time speed: streaks trailing each car */}
          {cars.map(({ heading, p, code }) => (
            <g
              key={`v-${code}`}
              transform={`translate(${p.x} ${p.y}) rotate(${heading})`}
              opacity={0.75}
            >
              <path
                d={speedLines({
                  x: -10 * PPM,
                  y: -1.1 * PPM,
                  w: 7 * PPM,
                  h: 2.2 * PPM,
                  n: 9,
                  seed: `b25-${code}-${Math.floor(t * 15)}`,
                  angle: 0,
                  thickness: 5,
                  length: [0.4, 1],
                })}
                fill={INK}
              />
            </g>
          ))}
          {/* spray from the rear tyres, under both cars; GLO's grooved slicks hold less water (2.4) */}
          {cars.map(({ heading, p, tread, code, q }) => {
            const back = ((heading + 180) * Math.PI) / 180;
            const k = (tread === "dry" ? 0.45 : 1) * (0.6 + q.speed / 120);
            const puffs = Array.from({ length: 9 }, (_, i) => {
              const ph = (i / 9 + tau * 1.4) % 1;
              const d = (2.4 + ph * q.speed * 0.13) * PPM;
              const side = Math.sin(i * 2.3) * 0.2 * PPM;
              return {
                x: p.x + Math.cos(back) * d - Math.sin(back) * side,
                y: p.y + Math.sin(back) * d + Math.cos(back) * side,
                r: (0.35 + ph * 0.6) * PPM * k,
                o: 1 - ph * 0.85,
              };
            });
            return (
              <g key={`w-${code}`}>
                {puffs.map((u, i) => (
                  <circle
                    key={`o${i}`}
                    cx={u.x}
                    cy={u.y}
                    r={u.r + 2}
                    fill={INK}
                    opacity={u.o}
                  />
                ))}
                {puffs.map((u, i) => (
                  <circle
                    key={`f${i}`}
                    cx={u.x}
                    cy={u.y}
                    r={u.r}
                    fill={PAPER}
                    opacity={u.o}
                  />
                ))}
              </g>
            );
          })}
          {/* contact shadows */}
          {cars.map(({ heading, p, code }) => (
            <ellipse
              key={`sh-${code}`}
              cx={p.x + 0.25 * PPM}
              cy={p.y + 0.3 * PPM}
              rx={2.5 * PPM}
              ry={1.05 * PPM}
              fill={INK}
              opacity={0.3}
              transform={`rotate(${heading} ${p.x} ${p.y})`}
            />
          ))}
          {cars.map(({ car, heading, p, tread, steer, code }) => (
            <MangaCar
              key={code}
              car={car}
              view="top"
              at={topAnchorAt(car, { x: p.x, y: p.y, pxPerMetre: PPM }, heading)}
              state={{ heading, tread, steer }}
            />
          ))}
          {cars.map(({ tag, code, pos }) => (
            <PosTag
              key={`t-${code}`}
              x={tag.x}
              y={tag.y + 6}
              code={code}
              pos={pos}
              big={code === "HAM"}
            />
          ))}
          <Rain
            t={tau}
            n={260}
            slant={8}
            length={60}
            opacity={0.45}
            seed="b25"
          />
        </g>
        <rect
          x={PANEL.x}
          y={PANEL.y}
          width={PANEL.w}
          height={PANEL.h}
          fill="none"
          stroke={INK}
          strokeWidth={10}
        />
      </g>
    </Page>
  );
};
