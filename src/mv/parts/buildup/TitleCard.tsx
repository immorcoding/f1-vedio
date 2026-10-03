// Shot 4.1 (bars 73–74): the title card. Night page; the Yas hotel's gridshell lights up panel by panel (full at the
// `buildup.hotelLit` cue), the 2021 lap draws itself on in white ink, the title is brushed in. A slow push-in and the
// riser's rising focus lines keep it moving.
import { BRUSH_FONT } from "../../../kit/lettering";
import { INK, PAPER } from "../../../kit/colors";
import { InkFilterDef, inkFilter } from "../../../kit/ink";
import { focusLines } from "../../../kit/lines";
import { ToneDefs } from "../../../kit/tone";
import { YasHotel } from "../../../scenes/abu-dhabi-2021/YasHotel";
import { fitMap, TrackMap, YAS_MARINA_2021 } from "../../../tracks";
import { ramp, secondsInShot, type ShotTime } from "../abuDhabi2021/shotClock";
import { at } from "../../timing.ts";

const T = YAS_MARINA_2021;
// The whole lap, fitted into the top-right of the page.
const VIEW = fitMap(T, { x: 1330, y: 60, w: 400, h: 600 }, 0, 0.02);

export const TitleCard: React.FC<{ st: ShotTime }> = ({ st }) => {
  const { t, dur } = st;
  const litAt = secondsInShot(st, at(74));
  const lit = ramp(t, 0.15, litAt);
  const push = 1 + 0.05 * (t / dur);
  const draw = ramp(t, 0.3, dur * 0.8);
  const title = ramp(t, 0.6, 1.4);
  const rise = ramp(t, dur * 0.4, dur);
  return (
    <svg width={1920} height={1080}>
      <defs>
        <ToneDefs />
        <InkFilterDef />
        <clipPath id="title-reveal">
          <rect x={80} y={120} width={1000 * title} height={240} />
        </clipPath>
      </defs>
      <rect width={1920} height={1080} fill={INK} />
      <g filter={inkFilter()} transform={`translate(960 600) scale(${push}) translate(-960 -600)`}>
        <path
          d={focusLines(860, 760, 640, 140, Math.floor(t * 10))}
          fill={PAPER}
          opacity={0.08 + 0.22 * rise}
        />
        {/* the hotel, standing on the circuit's edge */}
        <YasHotel x={150} ground={1000} scale={8.6} lit={lit} shimmer={t} />
        <path d="M -40 1000 L 1960 1000" stroke={PAPER} strokeWidth={4} />
        <path d="M -40 1016 L 1960 1016" stroke={PAPER} strokeWidth={1.5} opacity={0.6} />
        {/* the lap, drawn on from the finish line */}
        <TrackMap track={T} view={VIEW} theme="night" progress={draw} road={14} />
        {/* title: year and grand prix (STO-5), brushed on left to right */}
        <g clipPath="url(#title-reveal)">
          <text
            x={90}
            y={300}
            fontFamily={BRUSH_FONT}
            fontSize={150}
            fill={PAPER}
          >
            2021 · 阿布扎比
          </text>
        </g>
      </g>
    </svg>
  );
};
