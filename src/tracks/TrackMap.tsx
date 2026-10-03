// The whole lap as a map (MOT-2, ART-8): an inked ribbon with an open core, drawn on along the race direction as
// `progress` goes 0 → 1. Paper theme for title cards on the page (optionally with a screentone drop shadow), night
// theme for the floodlit races (white ink on black). Optional chequered finish line and turn labels. Figure-eight
// laps (Track.crossover) get a bridge: the upper pass is redrawn on top with a page-coloured gap either side.
import { INK, PAPER } from "../kit/colors";
import { tone } from "../kit/tone";
import {
  centrelineLength,
  poseAt,
  samplePath,
  type MapPoint,
  type MapView,
  type Track,
} from "./track";

export type MapTheme = "paper" | "night";

const THEME = {
  // paper: black ink on white; night: the track inked in white on a black page
  paper: { ink: INK, page: PAPER },
  night: { ink: PAPER, page: INK },
} as const;

export type TrackMapProps = {
  track: Track;
  // fitMap(track, box, rotation) fits the whole lap into a box
  view: MapView;
  theme?: MapTheme;
  // Share of the lap drawn, 0–1, from the start/finish line.
  progress?: number;
  // Ribbon width, screen px (default the real track width, at least 10 px).
  road?: number;
  // Ink on each side of the open core, screen px (default 18 % of the road, at least 2.5 px).
  rim?: number;
  // Screentone drop shadow down-right of the ribbon (paper theme).
  shadow?: boolean;
  // Chequered finish line across the ribbon at s = 0 (once the lap is fully drawn).
  finish?: boolean;
  // Opacity of the turn labels (Track.turns); 0 hides them.
  labels?: number;
  labelSize?: number;
  // Tone pattern prefix of the page's <ToneDefs>.
  tonePrefix?: string;
};

export const TrackMap: React.FC<TrackMapProps> = ({
  track,
  view,
  theme = "paper",
  progress = 1,
  road,
  rim,
  shadow = false,
  finish = false,
  labels = 0,
  labelSize = 40,
  tonePrefix = "tone",
}) => {
  const T = THEME[theme];
  const lap = view.path(
    samplePath(track, 0, centrelineLength(track), 0, 4),
    true,
  );
  const W = road ?? Math.max(10, track.width * view.pxPerMetre);
  const R = rim ?? Math.max(2.5, W * 0.18);
  const dash =
    progress >= 1
      ? {}
      : {
          pathLength: 1,
          strokeDasharray: "1.002 1",
          strokeDashoffset: 1 - Math.max(0, progress),
        };
  const stroke = {
    fill: "none",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    ...dash,
  } as const;
  // the bridge: the upper pass redrawn over a page-coloured gap, about two and a half road widths either side
  const over = track.crossover?.over;
  const reach = (2.5 * W) / view.pxPerMetre;
  const bridge =
    over !== undefined && progress * track.lapLength > over + reach
      ? view.path(samplePath(track, over - reach, over + reach, 0, reach / 8))
      : null;
  const finishA = view.project(poseAt(track, 0, -track.width * 0.9));
  const finishB = view.project(poseAt(track, 0, track.width * 0.9));
  return (
    <g>
      {shadow ? (
        <path
          d={lap}
          transform="translate(7 9)"
          stroke={tone("mid", tonePrefix)}
          strokeWidth={W}
          {...stroke}
        />
      ) : null}
      <path d={lap} stroke={T.ink} strokeWidth={W} {...stroke} />
      <path
        d={lap}
        stroke={T.page}
        strokeWidth={Math.max(2, W - 2 * R)}
        {...stroke}
      />
      {bridge ? (
        <g>
          <path
            d={bridge}
            fill="none"
            stroke={T.page}
            strokeWidth={W * 2}
            strokeLinecap="butt"
          />
          <path
            d={bridge}
            fill="none"
            stroke={T.ink}
            strokeWidth={W}
            strokeLinecap="butt"
          />
          <path
            d={bridge}
            fill="none"
            stroke={T.page}
            strokeWidth={Math.max(2, W - 2 * R)}
            strokeLinecap="butt"
          />
        </g>
      ) : null}
      {finish && progress >= 1 ? (
        <FinishLine
          a={finishA}
          b={finishB}
          theme={theme}
          width={Math.max(8, W * 0.8)}
        />
      ) : null}
      {labels > 0
        ? (track.turns ?? []).map((t) => {
            // on the outside of the turn, clear of the ribbon
            const side = t.side === "left" ? 1 : -1;
            const p = view.project(
              poseAt(
                track,
                t.s,
                side *
                  (track.width +
                    40 / view.pxPerMetre +
                    labelSize / view.pxPerMetre),
              ),
            );
            return (
              <text
                key={t.label}
                x={p.x}
                y={p.y + labelSize * 0.36}
                textAnchor="middle"
                fontFamily="Arial Black, Arial, sans-serif"
                fontWeight={900}
                fontStyle="italic"
                fontSize={labelSize}
                fill={T.ink}
                opacity={labels}
              >
                {t.label}
              </text>
            );
          })
        : null}
    </g>
  );
};

// A chequered strip across the track between screen points a and b.
export const FinishLine: React.FC<{
  a: MapPoint;
  b: MapPoint;
  width: number;
  theme?: MapTheme;
}> = ({ a, b, width, theme = "paper" }) => {
  const T = THEME[theme];
  const len = Math.hypot(b.x - a.x, b.y - a.y);
  const ang = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
  const n = Math.max(4, Math.round(len / (width / 2)));
  const cell = len / n;
  return (
    <g transform={`translate(${a.x} ${a.y}) rotate(${ang})`}>
      <rect
        x={-2}
        y={-width / 2 - 2}
        width={len + 4}
        height={width + 4}
        fill={T.page}
        stroke={T.ink}
        strokeWidth={2.5}
      />
      {Array.from({ length: n * 2 }, (_, i) => {
        const col = Math.floor(i / 2);
        const row = i % 2;
        return (col + row) % 2 ? null : (
          <rect
            key={i}
            x={col * cell}
            y={-width / 2 + (row * width) / 2}
            width={cell}
            height={width / 2}
            fill={T.ink}
          />
        );
      })}
    </g>
  );
};
