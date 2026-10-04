// Shot 4.1 (bars 73–74): the title card. Yas Marina at night from the start/finish straight (YasNight): grid boxes
// running away to the Yas hotel, whose gridshell lights up panel by panel (all on at the `buildup.hotelLit` cue,
// 74.1); floodlight cones, drifting haze and camera flashes in the grandstand keep it alive under a slow push-in. The
// title is lettered in top left over the sky, a chequered strip and the circuit's name under it; the 2021 lap draws itself on in an inset panel top right, over the
// grandstand canopy — neither covers the hotel or the straight (ART-14).
import { CircuitTag, TitleText, circuitAnim } from "../../../kit/lettering";
import { INK, PAPER } from "../../../kit/colors";
import { InkFilterDef, inkFilter } from "../../../kit/ink";
import { ToneDefs } from "../../../kit/tone";
import { fitMap, TrackMap, YAS_MARINA_2021 } from "../../../tracks";
import { hit, ramp, secondsInShot, type ShotTime } from "../abuDhabi2021/shotClock";
import { at } from "../../timing.ts";
import { EDIT } from "./shots";
import { NightToneDefs, YasNight } from "./YasNight";

// the title and the circuit's name, as in the edit list
const TEXT = EDIT.shots.find((s) => s.id === "4.1")?.text ?? ["", ""];

const T = YAS_MARINA_2021;
// The inset panel holding the lap, top right.
const PANEL = { x: 1512, y: 40, w: 352, h: 470 };
const VIEW = fitMap(
  T,
  { x: PANEL.x + 16, y: PANEL.y + 16, w: PANEL.w - 32, h: PANEL.h - 32 },
  0,
  0.04,
);

export const TitleCard: React.FC<{ st: ShotTime }> = ({ st }) => {
  const { t, dur } = st;
  const litAt = secondsInShot(st, at(74));
  const lit = ramp(t, 0.15, litAt);
  const push = 1 + 0.06 * (t / dur);
  const draw = ramp(t, 0.3, dur * 0.8);
  const title = ramp(t, 0.6, 1.4);
  // the crowd's camera flashes: a few at first, a burst when the hotel is fully lit
  const flashes = 3 + 9 * hit(t, litAt, 0.8) + 2 * (t / dur);
  return (
    <svg width={1920} height={1080}>
      <defs>
        <ToneDefs />
        <NightToneDefs />
        <InkFilterDef />
        <clipPath id="title-reveal">
          <rect x={80} y={70} width={1000 * title} height={260} />
        </clipPath>
      </defs>
      <rect width={1920} height={1080} fill={INK} />
      <g filter={inkFilter()} transform={`translate(800 620) scale(${push}) translate(-800 -620)`}>
        <YasNight t={t} frame={st.frame} lit={lit} flashes={flashes} />
      </g>
      {/* the lap, drawn on from the finish line, in an inset panel */}
      <g>
        <rect x={PANEL.x + 10} y={PANEL.y + 10} width={PANEL.w} height={PANEL.h} fill={INK} opacity={0.6} />
        <rect x={PANEL.x} y={PANEL.y} width={PANEL.w} height={PANEL.h} fill={INK} stroke={PAPER} strokeWidth={5} />
        {draw > 0 ? <TrackMap track={T} view={VIEW} theme="night" progress={draw} road={14} /> : null}
      </g>
      {/* title: grand prix and year (STO-5), wiped on left to right */}
      <g clipPath="url(#title-reveal)">
        <TitleText x={90} y={196} size={120} text={TEXT[0]} colour={PAPER} />
      </g>
      <CircuitTag x={94} y={224} text={TEXT[1]} colour={PAPER} {...circuitAnim(t * 60, 80)} />
    </svg>
  );
};
