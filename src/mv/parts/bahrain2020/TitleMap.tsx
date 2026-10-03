// Shot 3.1 (bars 57–58): title card. The Bahrain circuit is inked onto the night page as a white double line, the turn
// numbers 1–4 come up as the pen passes them, and on the last half bar the straight after turn 3 lights up.
import { Easing } from "remotion";
import { INK, PAPER } from "../../../kit/colors";
import { BRUSH_FONT, CAPTION_FONT } from "../../../kit/lettering";
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
const STRAIGHT = linePath(BAHRAIN_TURNS["3"], BAHRAIN_TURNS["4"]);

export const TitleMap: React.FC<PictureProps> = ({ f }) => {
  const shot = shotById("3.1");
  const t = f - shot.from;
  const len = shot.to - shot.from;
  const draw = ramp(t, 4, len * 0.62, Easing.inOut(Easing.quad));
  const title = ramp(t, 18, 40, Easing.out(Easing.back(2)));
  const lit = ramp(t, len * 0.75, len * 0.8);
  // the lit straight pulses on the quarter notes of the last half bar
  const pulse =
    lit *
    (0.6 + 0.4 * Math.abs(Math.cos(((t - len * 0.75) / 28.125) * Math.PI)));
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
      {/* the straight after turn 3, where the next shot happens */}
      {lit > 0 ? (
        <path
          d={STRAIGHT}
          fill="none"
          stroke={PAPER}
          strokeWidth={8 + 10 * pulse}
          strokeLinecap="round"
          opacity={lit}
        />
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
        {shot.text.map((line) => (
          <text
            key={line}
            x={0}
            y={0}
            fontFamily={BRUSH_FONT}
            fontSize={150}
            fill={PAPER}
          >
            {line}
          </text>
        ))}
        <path
          d="M 6 40 L 560 28"
          stroke={PAPER}
          strokeWidth={7}
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
};
