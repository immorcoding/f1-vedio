// Easter egg (STO-7, treatment 4.3): what brought out the last safety car — on lap 53 Latifi (Williams) crashed into
// the wall at the exit of turn 14 (facts.md). A small top-view inset of turn 14 on the 2021 layout: the corner, the
// wall on the outside of the exit, an impact star and debris strewn back across the track. No car is drawn (the 2021
// Williams is not traced); the place and the wreckage tell it.
import { random } from "remotion";
import { INK, PAPER } from "../../kit/colors";
import { ImpactStar } from "../../kit/impact";
import { tone } from "../../kit/tone";
import {
  autoKerbs,
  mapView,
  poseAt,
  TrackSection,
  YAS_MARINA_2021,
} from "../../tracks";

const T = YAS_MARINA_2021;
// Turn 14 on the generated 2021 line (the 14th of its 16 corners: a left-hander, apex ≈ 4570 m).
const T14 = 4570;
const RUNOFF = 4;

/** Drawn into the box (x, y, w, h); `t` seconds since the inset appeared. */
export const LatifiCrash: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  t: number;
}> = ({ x, y, w, h, t }) => {
  const exit = T14 + 30;
  const view = mapView({
    centre: poseAt(T, exit),
    rotation: -poseAt(T, exit).heading,
    pxPerMetre: 4.2,
    screen: { x: x + w * 0.5, y: y + h * 0.55 },
  });
  const wall = view.project(poseAt(T, exit + 6, T.width / 2 + RUNOFF + 0.5));
  const debris = Array.from({ length: 16 }, (_, i) => {
    const r = (k: string) => random(`latifi-${k}-${i}`);
    const p = view.project(
      poseAt(T, exit + 6 - r("s") * 35, T.width / 2 + RUNOFF - r("l") * (T.width + 2)),
    );
    const s = 4 + r("z") * 7;
    const a = r("a") * 360 + t * 60 * (r("v") - 0.5);
    return { p, s, a, dark: r("d") < 0.6 };
  });
  return (
    <g>
      <defs>
        <clipPath id="latifi-box">
          <rect x={x} y={y} width={w} height={h} />
        </clipPath>
      </defs>
      <g clipPath="url(#latifi-box)">
        <rect x={x} y={y} width={w} height={h} fill={tone("mid")} />
        <TrackSection
          track={T}
          view={view}
          from={T14 - 120}
          to={T14 + 120}
          surface="paper"
          runoff={RUNOFF}
          barrier
          kerbs={autoKerbs(T, T14 - 120, T14 + 120, 1 / 120)}
        />
        {debris.map((d, i) => (
          <path
            key={i}
            d={`M ${-d.s} ${-d.s * 0.4} L ${d.s} ${-d.s * 0.6} L ${d.s * 0.5} ${d.s * 0.7} Z`}
            transform={`translate(${d.p.x} ${d.p.y}) rotate(${d.a})`}
            fill={d.dark ? INK : PAPER}
            stroke={INK}
            strokeWidth={1.5}
          />
        ))}
        <ImpactStar x={wall.x} y={wall.y} r={70} seed="latifi" t={Math.min(1, 0.35 + t * 1.5)} />
      </g>
      <rect x={x} y={y} width={w} height={h} fill="none" stroke={INK} strokeWidth={8} />
    </g>
  );
};
