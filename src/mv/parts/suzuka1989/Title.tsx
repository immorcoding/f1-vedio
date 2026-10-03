// Shot 1.1 (bars 9–10): title card. The figure-eight of Suzuka is inked onto the page along the race direction (the
// back straight bridging the lap after Degner), "1989 · 铃鹿" is brushed in, and on the last beats the chicane after
// 130R — where the next shots happen — is ringed.
import { Easing } from "remotion";
import { INK, PAPER } from "../../../kit/colors";
import { InkFilterDef, inkFilter } from "../../../kit/ink";
import { BRUSH_FONT } from "../../../kit/lettering";
import { ToneDefs, tone } from "../../../kit/tone";
import { fitMap, poseAt, SUZUKA_1989, TrackMap } from "../../../tracks";
import { ramp, shotById, type PictureProps } from "./common";

const T = SUZUKA_1989;
const VIEW = fitMap(T, { x: 760, y: 120, w: 1100, h: 860 }, 0);

export const Title: React.FC<PictureProps> = ({ f }) => {
  const shot = shotById("1.1");
  const t = f - shot.from;
  const len = shot.to - shot.from;
  const draw = ramp(t, 2, len * 0.68, Easing.inOut(Easing.quad));
  const title = ramp(t, 14, 40, Easing.out(Easing.back(2)));
  const ring = ramp(t, len * 0.72, len * 0.82, Easing.out(Easing.back(1.6)));
  const chicane = VIEW.project(poseAt(T, T.corners.chicane));
  return (
    <svg viewBox="0 0 1920 1080" width={1920} height={1080}>
      <defs>
        <ToneDefs />
        <InkFilterDef />
      </defs>
      <rect width={1920} height={1080} fill={PAPER} />
      <g filter={inkFilter()}>
        {/* a light tone sun-patch behind the map, like a printed page */}
        <ellipse
          cx={1310}
          cy={560}
          rx={620}
          ry={440}
          fill={tone("light")}
          opacity={0.55}
        />
        <TrackMap
          track={T}
          view={VIEW}
          progress={draw}
          shadow
          finish
          road={22}
        />
        {ring > 0 ? (
          <g>
            <circle
              cx={chicane.x}
              cy={chicane.y}
              r={58 * ring}
              fill="none"
              stroke={INK}
              strokeWidth={7}
            />
          </g>
        ) : null}
        <g
          opacity={title}
          transform={`translate(110 610) scale(${0.85 + 0.15 * title})`}
        >
          {shot.text.map((line) => (
            <text
              key={line}
              x={0}
              y={0}
              fontFamily={BRUSH_FONT}
              fontSize={150}
              fill={INK}
            >
              {line}
            </text>
          ))}
          <path
            d="M 6 40 L 560 28"
            stroke={INK}
            strokeWidth={8}
            strokeLinecap="round"
          />
        </g>
      </g>
    </svg>
  );
};
