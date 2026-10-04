// A stretch of track seen from straight above (MOT-2), in the black-and-white environment style (ART-8): grass with
// ink tufts, run-off in light tone, barriers, grandstands, escape roads, the racing surface (mid-tone asphalt by day,
// paper under floodlights), tyre marks, kerbs and edge lines. Everything comes from the Track data and lap
// distances, so any corner of any lap can be framed with a mapView. Painted and built things (kerbs, lines, walls)
// have real widths in metres, with a minimum pen width on screen.
import { random } from "remotion";
import { INK, PAPER } from "../kit/colors";
import { tone } from "../kit/tone";
import {
  poseAt,
  polylinePoints,
  samplePath,
  widen,
  type Kerb,
  type MapView,
  type Side,
  type Track,
} from "./track";

// A grandstand behind the barrier on one side over [from, to]: depth in m from the barrier, roofed with tensile
// sails (Yas Marina).
export type Stand = { from: number; to: number; side: Side; depth: number };

export type TrackSectionProps = {
  track: Track;
  view: MapView;
  // Stretch of the lap to draw, m along the lap.
  from: number;
  to: number;
  // Racing surface: mid-tone asphalt (day) or paper (floodlit night).
  surface?: "asphalt" | "paper";
  // Run-off / verge beyond each edge, m (light tone): one width, or by lap distance and side.
  runoff?: number | ((s: number, side: Side) => number);
  // An ink barrier (wall, guardrail) along the outer edge of the run-off.
  barrier?: boolean;
  // Fill this screen box with grass (paper with ink tufts) first.
  grass?: { x: number; y: number; w: number; h: number };
  // Kerbs (default the track's traced kerbs; autoKerbs for untraced tracks).
  kerbs?: readonly Kerb[];
  stands?: readonly Stand[];
  // Escape roads from the track data, in the surface's fill.
  escapeRoads?: boolean;
  // Rubbered-in streaks along the racing surface.
  tyreMarks?: boolean;
  // A painted white line just inside each edge (default on asphalt).
  edgeLines?: boolean;
  // Tone pattern prefix of the page's <ToneDefs>.
  tonePrefix?: string;
};

const SAMPLE = 1.5; // m between samples along the lap

export const TrackSection: React.FC<TrackSectionProps> = ({
  track,
  view,
  from,
  to,
  surface = "asphalt",
  runoff = 6,
  barrier = false,
  grass,
  kerbs = track.kerbs ?? [],
  stands = [],
  escapeRoads = true,
  tyreMarks = false,
  edgeLines = surface === "asphalt",
  tonePrefix = "tone",
}) => {
  const half = track.width / 2;
  const ppm = view.pxPerMetre;
  // a pen `m` metres wide, at least `min` px on screen
  const pen = (m: number, min: number) => Math.max(min, m * ppm);
  const sgn = (side: Side) => (side === "left" ? -1 : 1);
  const run = (s: number, side: Side) =>
    typeof runoff === "number" ? runoff : runoff(s, side);
  const surfaceFill = surface === "paper" ? PAPER : tone("mid", tonePrefix);
  const edge = (side: Side, extra: (s: number) => number = () => 0) =>
    samplePath(track, from, to, (s) => sgn(side) * (half + extra(s)), SAMPLE);
  const edgeL = edge("left");
  const edgeR = edge("right");
  const outerL = edge("left", (s) => run(s, "left"));
  const outerR = edge("right", (s) => run(s, "right"));

  // grass tufts: little ink ticks scattered beside the track in map space, so they move with the view
  const tufts: string[] = [];
  if (grass) {
    const n = Math.round((to - from) / 2.5);
    for (let i = 0; i < n; i++) {
      const r = (k: string) => random(`tuft-${track.name}-${k}-${i}`);
      const side = r("side") < 0.5 ? -1 : 1;
      const p = view.project(
        poseAt(
          track,
          from + (to - from) * r("s"),
          side * (half + 3 + r("o") * 70),
        ),
      );
      const l = 6 + r("l") * 6;
      tufts.push(
        `M ${p.x.toFixed(1)} ${p.y.toFixed(1)} l ${-l * 0.4} ${-l} M ${(p.x + 4).toFixed(1)} ${p.y.toFixed(1)} l ${l * 0.2} ${-l * 1.1}`,
      );
    }
  }

  // kerb blocks across the edge (from 0.2 m inside it to 1.3 m outside), about 1.6 m long, alternating ink and paper
  const kerbBlocks = kerbs.flatMap((k) => {
    const g = sgn(k.side);
    const n = Math.max(1, Math.round((k.to - k.from) / 1.6));
    return Array.from({ length: n }, (_, i) => {
      const s0 = k.from + ((k.to - k.from) * i) / n;
      const s1 = k.from + ((k.to - k.from) * (i + 1)) / n;
      const inner = samplePath(track, s0, s1, g * (half - 0.2), 0.5);
      const outer = samplePath(track, s0, s1, g * (half + 1.3), 0.5);
      return { d: view.band(inner, outer), dark: i % 2 === 0 };
    });
  });

  // tyre marks along the racing surface
  const streaks = tyreMarks
    ? Array.from({ length: 10 }, (_, i) => {
        const lat = -half + 2 + ((i * 3.7) % (track.width - 4));
        const a = from + ((i * 53) % Math.max(1, to - from - 40));
        return view.path(
          samplePath(track, a, a + 25 + (i % 3) * 15, lat, SAMPLE),
        );
      })
    : [];

  return (
    <g>
      {grass ? (
        <>
          <rect
            x={grass.x}
            y={grass.y}
            width={grass.w}
            height={grass.h}
            fill={PAPER}
          />
          <path
            d={tufts.join(" ")}
            stroke={INK}
            strokeWidth={2}
            strokeLinecap="round"
            opacity={0.7}
          />
        </>
      ) : null}
      {/* run-off, both sides */}
      <path d={view.band(outerL, edgeL)} fill={tone("light", tonePrefix)} />
      <path d={view.band(edgeR, outerR)} fill={tone("light", tonePrefix)} />
      {barrier
        ? [outerL, outerR].map((line, i) => (
            <path
              key={i}
              d={view.path(line)}
              fill="none"
              stroke={INK}
              strokeWidth={pen(1.2, 2.5)}
              strokeLinejoin="round"
            />
          ))
        : null}
      {stands.map((st) => (
        <Grandstand
          key={`${st.from}-${st.side}`}
          track={track}
          view={view}
          stand={st}
          wall={(s) => half + run(s, st.side) + 1}
          tonePrefix={tonePrefix}
        />
      ))}
      {escapeRoads
        ? (track.escapeRoads ?? []).map((r) => (
            <path
              key={r.name}
              d={view.path(widen(polylinePoints(r.path), r.width), true)}
              fill={surfaceFill}
              stroke={INK}
              strokeWidth={pen(0.35, 1.5)}
              strokeLinejoin="round"
            />
          ))
        : null}
      {/* racing surface */}
      <path d={view.band(edgeL, edgeR)} fill={surfaceFill} />
      {streaks.map((d, i) => (
        <path
          key={i}
          d={d}
          fill="none"
          stroke={INK}
          strokeWidth={pen(0.25, 0.6)}
          opacity={0.35}
        />
      ))}
      {kerbBlocks.map((b, i) => (
        <path
          key={i}
          d={b.d}
          fill={b.dark ? INK : PAPER}
          stroke={INK}
          strokeWidth={pen(0.15, 0.6)}
        />
      ))}
      {(["left", "right"] as const).map((side) => (
        <g key={side}>
          {edgeLines ? (
            <path
              d={view.path(
                samplePath(track, from, to, sgn(side) * (half - 0.45), SAMPLE),
              )}
              fill="none"
              stroke={PAPER}
              strokeWidth={pen(0.3, 2)}
            />
          ) : null}
          <path
            d={view.path(side === "left" ? edgeL : edgeR)}
            fill="none"
            stroke={INK}
            strokeWidth={pen(0.35, 1.5)}
          />
        </g>
      ))}
    </g>
  );
};

// Grandstand behind the barrier: the stand in dark tone under a row of paper tensile sails, alternating apex in and
// out (Yas Marina's North Grandstand).
const Grandstand: React.FC<{
  track: Track;
  view: MapView;
  stand: Stand;
  // distance of the barrier from the centre line at s, m
  wall: (s: number) => number;
  tonePrefix: string;
}> = ({ track, view, stand: st, wall, tonePrefix }) => {
  const g = st.side === "left" ? -1 : 1;
  const P = (s: number, lateral: number) =>
    view.project(poseAt(track, s, g * lateral));
  const front = samplePath(track, st.from, st.to, (s) => g * wall(s), 2);
  const back = samplePath(
    track,
    st.from,
    st.to,
    (s) => g * (wall(s) + st.depth),
    2,
  );
  const sails: string[] = [];
  const bay = 10;
  for (let s = st.from; s < st.to - bay; s += bay) {
    const w0 = wall(s);
    const p0 = P(s, w0);
    const p1 = P(s + bay, wall(s + bay));
    const apex = P(s + bay / 2, w0 + st.depth);
    const back0 = P(s, w0 + st.depth);
    sails.push(
      `M ${p0.x} ${p0.y} L ${apex.x} ${apex.y} L ${p1.x} ${p1.y} Z M ${back0.x} ${back0.y} L ${apex.x} ${apex.y} L ${p0.x} ${p0.y} Z`,
    );
  }
  const ppm = view.pxPerMetre;
  return (
    <g>
      <path d={view.band(front, back)} fill={tone("dark", tonePrefix)} />
      <path
        d={sails.join(" ")}
        fill={PAPER}
        stroke={INK}
        strokeWidth={0.35 * ppm}
        strokeLinejoin="round"
      />
      <path
        d={view.band(front, back)}
        fill="none"
        stroke={INK}
        strokeWidth={0.6 * ppm}
      />
    </g>
  );
};
