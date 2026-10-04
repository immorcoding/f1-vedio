// The points box (#17): the one design for every score and margin in the film, after Brazil 2.7's "98 · 97" box that
// the user picked. Type system D (ART-6): big numerals in Big Shoulders Black, leaned 8°, ink on a paper box with a
// heavy ink frame and a hard ink drop shadow; the driver codes small under them in Titillium Web Bold; a "·" between
// two scores; a gold under-stroke (an offset gold copy of the numeral) on the leader or winner.
// Two variants from the same parts: a score (two columns, "98 · 97") and a margin (one column, "+16" over "PRO",
// with a small unit such as "PTS" beside the numeral).
// Animation, keyed to beats by the caller: `since` is the seconds since the box slams in (oversize → settled in 0.12 s
// with a small overshoot, like 2.7's slam), `goldSince` the seconds since the gold stroke slams onto the leader.
// The box is drawn centred on (0, 0) of the caller's transform.
import { Easing } from "remotion";
import { INK, PAPER } from "./colors";
import {
  CAPTION_FONT,
  TITLE_FONT,
  lean,
  measure,
  useLettering,
} from "./lettering";

/** The gold of the champion cards (2.7, 5.8) and of the points box's under-stroke. */
export const GOLD = "#f2c230";

export type PointsColumn = { value: string; code: string; gold?: boolean };

/** Big numeral size by default (px): 2.7's box. */
export const POINTS_SIZE = 168;

// Proportions of 2.7's 430 × 250 box at a 168 px numeral, as shares of the numeral size.
const PAD_X = 0.2;
const DOT_GAP = 0.38;
const HEIGHT = 1.49;
const BASELINE = 1.0; // numeral baseline from the top
const CODE_BASE = 1.34; // code baseline from the top
const CODE_SIZE = 0.226;
const UNIT_SIZE = 0.24;
const UNIT_GAP = 0.06;
const SHADOW = 0.071;
const FRAME = 0.054;
const GOLD_OFFSET = 0.042;

const numW = (t: string, n: number) => measure(t, TITLE_FONT, 900, n);
const codeW = (t: string, n: number) =>
  measure(t, CAPTION_FONT, 700, n * CODE_SIZE);
const unitW = (t: string, n: number) =>
  measure(t, CAPTION_FONT, 700, n * UNIT_SIZE) + n * UNIT_GAP;

type Layout = {
  w: number;
  h: number;
  cols: { cx: number; num: number; unit: number }[];
  dots: number[];
};

const layout = (
  columns: readonly PointsColumn[],
  n: number,
  unit?: string,
): Layout => {
  const uw = unit ? unitW(unit, n) : 0;
  const widths = columns.map((c) => {
    const num = numW(c.value, n);
    return { num, w: Math.max(num + uw, codeW(c.code, n)) };
  });
  const w =
    2 * PAD_X * n +
    widths.reduce((s, c) => s + c.w, 0) +
    (columns.length - 1) * DOT_GAP * n;
  const cols: Layout["cols"] = [];
  const dots: number[] = [];
  let x = -w / 2 + PAD_X * n;
  widths.forEach((c, i) => {
    if (i > 0) {
      dots.push(x + (DOT_GAP * n) / 2);
      x += DOT_GAP * n;
    }
    cols.push({ cx: x + c.w / 2, num: c.num, unit: uw });
    x += c.w;
  });
  return { w, h: HEIGHT * n, cols, dots };
};

/** The box's size in px (after the fonts are in: call it from a component that has used `useLettering()`). */
export const pointsBoxSize = (
  columns: readonly PointsColumn[],
  size = POINTS_SIZE,
  unit?: string,
) => {
  const l = layout(columns, size, unit);
  return { w: l.w, h: l.h };
};

/** The slam of the box or its gold stroke: scale and opacity `since` seconds after it starts (null before). */
export const pointsSlam = (since: number, from = 1.6) => {
  if (since < 0) return null;
  const u = Math.min(1, since / 0.12);
  return {
    s: from - (from - 1) * Easing.out(Easing.back(2))(u),
    o: Math.min(1, since * 20),
  };
};

export const PointsBox: React.FC<{
  columns: readonly PointsColumn[];
  /** Numeral size, px. */
  size?: number;
  /** A small unit beside each numeral (the margin variant's "PTS"). */
  unit?: string;
  /** Seconds since the box slams in; omitted = already settled; negative = not yet on screen. */
  since?: number;
  /** Seconds since the gold stroke lands on the gold column(s); omitted = no gold; negative = not yet. */
  goldSince?: number;
}> = ({ columns, size = POINTS_SIZE, unit, since, goldSince }) => {
  useLettering();
  const box = since === undefined ? { s: 1, o: 1 } : pointsSlam(since);
  if (!box) return null;
  const n = size;
  const l = layout(columns, n, unit);
  const top = -l.h / 2;
  const base = top + BASELINE * n;
  const gold = goldSince === undefined ? null : pointsSlam(goldSince, 1.5);
  const numeral = (cx: number, value: string, fill: string, d = 0) => (
    <text
      x={cx + d}
      y={base + d}
      textAnchor="middle"
      transform={lean(cx + d, base + d)}
      fontFamily={TITLE_FONT}
      fontWeight={900}
      fontSize={n}
      fill={fill}
      stroke={d ? INK : undefined}
      strokeWidth={d ? n * 0.06 : undefined}
      paintOrder="stroke"
    >
      {value}
    </text>
  );
  return (
    <g transform={`scale(${box.s})`} opacity={box.o}>
      <rect
        x={-l.w / 2 + SHADOW * n}
        y={top + SHADOW * n}
        width={l.w}
        height={l.h}
        fill={INK}
      />
      <rect x={-l.w / 2} y={top} width={l.w} height={l.h} fill={PAPER} />
      {columns.map((c, i) => {
        const col = l.cols[i];
        // the numeral and its unit sit together, centred on the column
        const nx = col.cx - col.unit / 2;
        const gc = { x: nx, y: base - n * 0.36 };
        return (
          <g key={`${i}-${c.value}`}>
            {c.gold && gold ? (
              <g
                opacity={gold.o}
                transform={`translate(${gc.x} ${gc.y}) scale(${gold.s}) translate(${-gc.x} ${-gc.y})`}
              >
                {numeral(nx, c.value, GOLD, GOLD_OFFSET * n)}
              </g>
            ) : null}
            {numeral(nx, c.value, INK)}
            {unit ? (
              <text
                x={nx + col.num / 2 + UNIT_GAP * n}
                y={base}
                fontFamily={CAPTION_FONT}
                fontWeight={700}
                fontSize={n * UNIT_SIZE}
                fill={INK}
              >
                {unit}
              </text>
            ) : null}
            <text
              x={col.cx}
              y={top + CODE_BASE * n}
              textAnchor="middle"
              fontFamily={CAPTION_FONT}
              fontWeight={700}
              fontSize={n * CODE_SIZE}
              fill={INK}
            >
              {c.code}
            </text>
          </g>
        );
      })}
      {l.dots.map((x) => (
        <g key={x}>{numeral(x, "·", INK)}</g>
      ))}
      <rect
        x={-l.w / 2}
        y={top}
        width={l.w}
        height={l.h}
        fill="none"
        stroke={INK}
        strokeWidth={FRAME * n}
      />
    </g>
  );
};
