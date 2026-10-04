// Shot 3.1 (bars 57–58): title card. The Bahrain circuit is inked onto the night page as a white double line, the turn
// numbers 1–4 come up as the pen passes them, then the pen goes back over the straight after turn 3 to the crash point
// and marks it with a small cross.
import { Easing } from "remotion";
import { INK, PAPER } from "../../../kit/colors";
import {
  CAPTION_FONT,
  CircuitTag,
  TitleText,
  circuitAnim,
} from "../../../kit/lettering";
import { TonePattern } from "../../../kit/tone";
import { ramp, shotById, type PictureProps } from "./common";
import { BAHRAIN_CENTRE_LINE, BAHRAIN_TURNS } from "./track";

const BOX = { x: 800, y: 150, w: 1020, h: 800 };
const xs = BAHRAIN_CENTRE_LINE.map((p) => p[0]);
const ys = BAHRAIN_CENTRE_LINE.map((p) => p[1]);
const [minX, maxX, minY, maxY] = [
  Math.min(...xs),
  Math.max(...xs),
  Math.min(...ys),
  Math.max(...ys),
];
const S = Math.min(BOX.w / (maxX - minX), BOX.h / (maxY - minY));
const OX = BOX.x + (BOX.w - (maxX - minX) * S) / 2;
const OY = BOX.y + (BOX.h - (maxY - minY) * S) / 2;
export const mapPoint = ([x, y]: readonly [number, number]) => ({
  x: OX + (x - minX) * S,
  y: OY + (y - minY) * S,
});
const pts = BAHRAIN_CENTRE_LINE.map(mapPoint);
const linePath = (from: number, to: number) =>
  pts
    .slice(from, to + 1)
    .map((p, i) => `${i ? "L" : "M"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(" ");
const TRACK = `${linePath(0, pts.length - 1)} Z`;

// The highlight: the centre line from turn 3's apex to the crash point, ~180 m on (facts.md; the map runs ~3 % long),
// as screen points with their running length, so the pen's head can stop exactly on any distance along it.
const CRASH_M = 180 * 1.03;
const RUN_PTS = (() => {
  const out: { x: number; y: number; d: number }[] = [];
  let m = 0;
  for (let i = BAHRAIN_TURNS["3"]; i < BAHRAIN_CENTRE_LINE.length - 1; i++) {
    const [ax, ay] = BAHRAIN_CENTRE_LINE[i];
    const [bx, by] = BAHRAIN_CENTRE_LINE[i + 1];
    const seg = Math.hypot(bx - ax, by - ay);
    if (!out.length) out.push({ ...pts[i], d: 0 });
    if (m + seg >= CRASH_M) {
      const u = (CRASH_M - m) / seg;
      const a = pts[i];
      const b = pts[i + 1];
      out.push({
        x: a.x + (b.x - a.x) * u,
        y: a.y + (b.y - a.y) * u,
        d: CRASH_M,
      });
      break;
    }
    m += seg;
    out.push({ ...pts[i + 1], d: m });
  }
  return out;
})();
// the run up to `d` metres, as a path
const runTo = (d: number) => {
  const keep = RUN_PTS.filter((p) => p.d < d);
  const next = RUN_PTS[keep.length];
  const prev = keep[keep.length - 1];
  const u = next ? (d - prev.d) / (next.d - prev.d) : 0;
  const head = next
    ? { x: prev.x + (next.x - prev.x) * u, y: prev.y + (next.y - prev.y) * u }
    : prev;
  return [...keep, head]
    .map((p, i) => `${i ? "L" : "M"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(" ");
};
const CRASH_PT = RUN_PTS[RUN_PTS.length - 1];
// the track's right-hand side at the crash point (GRO went off to the right, into the barrier on that side)
const CRASH_DIR = (() => {
  const a = RUN_PTS[RUN_PTS.length - 2];
  const l = Math.hypot(CRASH_PT.x - a.x, CRASH_PT.y - a.y);
  return { x: (CRASH_PT.x - a.x) / l, y: (CRASH_PT.y - a.y) / l };
})();
const RIGHT = { x: -CRASH_DIR.y, y: CRASH_DIR.x };

export const TitleMap: React.FC<PictureProps> = ({ f }) => {
  const shot = shotById("3.1");
  const t = f - shot.from;
  const len = shot.to - shot.from;
  const draw = ramp(t, 4, len * 0.62, Easing.inOut(Easing.quad));
  const title = ramp(t, 18, 40, Easing.out(Easing.back(2)));
  // the highlight: once the circuit is drawn, the pen goes back over the straight after turn 3, easing in and out,
  // and stops on the crash point, where a small cross comes up on the track's right edge
  const trace = ramp(t, len * 0.68, len * 0.86, Easing.inOut(Easing.cubic));
  const mark = ramp(t, len * 0.86, len * 0.92, Easing.out(Easing.cubic));
  const markAt = {
    x: CRASH_PT.x + RIGHT.x * 26,
    y: CRASH_PT.y + RIGHT.y * 26,
  };
  return (
    <svg viewBox="0 0 1920 1080" width={1920} height={1080}>
      <defs>
        <TonePattern id="b31-dots" r={1.2} gap={8} />
        <radialGradient id="b31-fade">
          <stop offset="0%" stopColor={INK} stopOpacity={1} />
          <stop offset="100%" stopColor={INK} stopOpacity={0} />
        </radialGradient>
        <pattern
          id="b31-wdots"
          width={8}
          height={8}
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <circle cx={4} cy={4} r={1.1} fill={PAPER} />
        </pattern>
      </defs>
      <rect width={1920} height={1080} fill={INK} />
      {/* night haze: a light white screentone, cleared round the circuit */}
      <rect width={1920} height={1080} fill="url(#b31-wdots)" opacity={0.18} />
      <ellipse
        cx={BOX.x + BOX.w / 2}
        cy={BOX.y + BOX.h / 2}
        rx={760}
        ry={560}
        fill="url(#b31-fade)"
      />
      {/* the track: white double line drawn on with the pen */}
      <path
        d={TRACK}
        pathLength={1}
        fill="none"
        stroke={PAPER}
        strokeWidth={20}
        strokeLinejoin="round"
        strokeDasharray="1.001 1"
        strokeDashoffset={1 - draw}
      />
      <path
        d={TRACK}
        pathLength={1}
        fill="none"
        stroke={INK}
        strokeWidth={11}
        strokeLinejoin="round"
        strokeDasharray="1.001 1"
        strokeDashoffset={1 - draw}
      />
      {/* the straight after turn 3 up to the crash point, where the next shot happens: the double line filled in
          solid white, a touch bolder than the track line */}
      {trace > 0 ? (
        <path
          d={runTo(CRASH_M * trace)}
          fill="none"
          stroke={PAPER}
          strokeWidth={24}
          strokeLinecap="butt"
          strokeLinejoin="round"
        />
      ) : null}
      {mark > 0 ? (
        <g
          transform={`translate(${markAt.x} ${markAt.y}) scale(${mark}) rotate(45)`}
        >
          <path
            d="M -20 0 L 20 0 M 0 -20 L 0 20"
            stroke={INK}
            strokeWidth={14}
            strokeLinecap="round"
          />
          <path
            d="M -18 0 L 18 0 M 0 -18 L 0 18"
            stroke={PAPER}
            strokeWidth={7}
            strokeLinecap="round"
          />
        </g>
      ) : null}
      {/* start line */}
      {draw > 0 ? (
        <path
          d={`M ${pts[0].x} ${pts[0].y - 22} L ${pts[0].x} ${pts[0].y + 22}`}
          stroke={PAPER}
          strokeWidth={6}
          strokeDasharray="5 5"
        />
      ) : null}
      {(["1", "2", "3", "4"] as const).map((n) => {
        const i = BAHRAIN_TURNS[n];
        const on = ramp(draw, i / pts.length, i / pts.length + 0.04);
        if (on <= 0) return null;
        const p = pts[i];
        // labels sit outside the circuit, to the left of the west side
        const lx = p.x - 52;
        return (
          <g key={n} opacity={on}>
            <circle cx={lx} cy={p.y} r={24} fill={PAPER} />
            <text
              x={lx}
              y={p.y + 11}
              textAnchor="middle"
              fontFamily={CAPTION_FONT}
              fontSize={32}
              fill={INK}
            >
              {n}
            </text>
          </g>
        );
      })}
      <g
        opacity={title}
        transform={`translate(120 640) scale(${0.85 + 0.15 * title})`}
      >
        <TitleText x={0} y={0} size={100} text={shot.text[0]} colour={PAPER} />
      </g>
      <CircuitTag
        x={124}
        y={674}
        text={shot.text[1]}
        colour={PAPER}
        {...circuitAnim(t, 40)}
      />
    </svg>
  );
};
