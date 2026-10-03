// Shot 2.1 (bars 33–34): the title card. A grey rain-day page; the Interlagos lap inks itself on from the finish line
// in race direction (anticlockwise), the title is brushed in, and rain begins to fall across the page — first a few
// drops splashing on the paper, then a steady fall.
import { INK, PAPER } from "../../../kit/colors";
import { inkFilter } from "../../../kit/ink";
import { BRUSH_FONT } from "../../../kit/lettering";
import { Rain, Splashes } from "../../../kit/rain";
import { tone } from "../../../kit/tone";
import { fitMap, INTERLAGOS_2008, TrackMap } from "../../../tracks";
import { ramp, type ShotTime } from "../abuDhabi2021/shotClock";
import { Page } from "./common";

const T = INTERLAGOS_2008;
const VIEW = fitMap(T, { x: 1060, y: 90, w: 760, h: 900 }, 0, 0.04);

export const Title: React.FC<{ st: ShotTime }> = ({ st }) => {
  const { t, dur } = st;
  const draw = ramp(t, 0.15, dur * 0.85);
  const title = ramp(t, 0.5, 1.5);
  const rain = ramp(t, 0.2, dur * 0.6);
  const push = 1 + 0.04 * (t / dur);
  return (
    <Page>
      <defs>
        <clipPath id="b21-title">
          <rect x={60} y={300} width={1000 * title} height={260} />
        </clipPath>
      </defs>
      {/* overcast: a light screen falling from the top of the page */}
      <rect width={1920} height={1080} fill={tone("light")} opacity={0.55} />

      <g
        filter={inkFilter()}
        transform={`translate(960 540) scale(${push}) translate(-960 -540)`}
      >
        <TrackMap
          track={T}
          view={VIEW}
          progress={draw}
          road={18}
          rim={18 * 0.36}
          shadow
          finish
          labels={ramp(t, dur * 0.8, dur)}
          labelSize={32}
        />
        <g clipPath="url(#b21-title)">
          <text
            x={80}
            y={500}
            fontFamily={BRUSH_FONT}
            fontSize={170}
            fill={INK}
            stroke={PAPER}
            strokeWidth={10}
            paintOrder="stroke"
          >
            2008 · 巴西
          </text>
        </g>
        <path
          d={`M 90 560 L ${90 + 860 * title} 560`}
          stroke={INK}
          strokeWidth={9}
          strokeLinecap="round"
        />
      </g>
      <Splashes
        x0={0}
        x1={1920}
        y0={0}
        y1={1080}
        t={t}
        n={Math.round(60 * rain)}
        seed="b21"
      />
      <Rain
        t={t}
        n={Math.round(230 * rain)}
        length={80}
        opacity={0.6}
        seed="b21-rain"
      />
    </Page>
  );
};
