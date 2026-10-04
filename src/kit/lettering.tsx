// Lettering (ART-6, type system D; STO-5: English only, as few words as possible). One font per role, all Google
// Fonts under the OFL:
// - titles and big numerals: Big Shoulders Black, leaned 8°, the year in outline (TITLE_FONT, <TitleText>, <BigText>)
// - labels, captions, lines: Titillium Web 600/700 inside ink narration boxes (CAPTION_FONT, <Caption>)
// - sound effects: Bangers, ink with a paper halo, letters jittered (SFX_FONT, <Sfx>)
// - stamps: Saira Stencil Bold in a red rubber-stamp box (STAMP_FONT, <RubberStamp>; the red is ART-8's exception)
// Under every title card's title: a short chequered strip and the circuit's name (<CircuitTag>).
import { useEffect, useState } from "react";
import { continueRender, delayRender } from "remotion";
import { loadFont as loadBangers } from "@remotion/google-fonts/Bangers";
import { loadFont as loadBigShoulders } from "@remotion/google-fonts/BigShoulders";
import { loadFont as loadSairaStencil } from "@remotion/google-fonts/SairaStencil";
import { loadFont as loadTitillium } from "@remotion/google-fonts/TitilliumWeb";
import { INK, PAPER } from "./colors";

const opt = { subsets: ["latin" as const], ignoreTooManyRequestsWarning: true };
const titleFont = loadBigShoulders("normal", { weights: ["900"], ...opt });
const captionFont = loadTitillium("normal", { weights: ["600", "700"], ...opt });
const sfxFont = loadBangers("normal", { weights: ["400"], ...opt });
const stampFont = loadSairaStencil("normal", { weights: ["700"], ...opt });

export const TITLE_FONT = titleFont.fontFamily;
export const CAPTION_FONT = captionFont.fontFamily;
export const SFX_FONT = sfxFont.fontFamily;
export const STAMP_FONT = stampFont.fontFamily;

// The stamps' red: a seal on the page, not part of the drawn world (ART-8's approved exception).
export const STAMP_RED = "#d3221c";

// ── measuring ────────────────────────────────────────────────────────────────────────────────────────────────────
// Boxes that hug their text need the text's width, so they measure it with a canvas once the fonts are in. Until then
// `useLettering()` holds the render (delayRender) and re-renders when they arrive, so no frame uses fallback metrics.
const FONTS_READY = Promise.all([
  titleFont.waitUntilDone(),
  captionFont.waitUntilDone(),
  sfxFont.waitUntilDone(),
  stampFont.waitUntilDone(),
]);
let fontsReady = false;
FONTS_READY.then(() => {
  fontsReady = true;
}).catch(() => undefined);

export const useLettering = (): boolean => {
  const [ready, setReady] = useState(fontsReady);
  const [handle] = useState(() =>
    fontsReady ? null : delayRender("lettering fonts"),
  );
  useEffect(() => {
    if (handle === null) return;
    FONTS_READY.then(() => {
      setReady(true);
      continueRender(handle);
    }).catch(() => continueRender(handle));
  }, [handle]);
  return ready;
};

let ctx: CanvasRenderingContext2D | null = null;
const cache = new Map<string, number>();
/** Width in px of one line of text; `tracking` is letter spacing in em (SVG adds it after every glyph). */
export const measure = (
  text: string,
  family: string,
  weight: number,
  size: number,
  tracking = 0,
): number => {
  const key = `${family}|${weight}|${size}|${tracking}|${text}`;
  const hit = cache.get(key);
  if (hit !== undefined) return hit;
  if (typeof document === "undefined") return text.length * size * 0.55;
  ctx ??= document.createElement("canvas").getContext("2d");
  if (!ctx) return text.length * size * 0.55;
  ctx.font = `${weight} ${size}px "${family}"`;
  const w = ctx.measureText(text).width + text.length * tracking * size;
  if (fontsReady) cache.set(key, w);
  return w;
};

// ── titles ───────────────────────────────────────────────────────────────────────────────────────────────────────
/** Splits "SUZUKA 1989" into the place and the year (the last word). */
export const splitTitle = (text: string) => {
  const i = text.lastIndexOf(" ");
  return i < 0
    ? { place: text, year: "" }
    : { place: text.slice(0, i), year: text.slice(i + 1) };
};

const SKEW = -8;
const BS_K = 1.12; // Big Shoulders sits small on its em: D draws it at 1.12× the nominal size
const BS_TRACK = 0.01;

/** Width of a TitleText line (before the lean). */
export const titleWidth = (text: string, size: number) => {
  const { place, year } = splitTitle(text);
  const s = size * BS_K;
  return (
    measure(place, TITLE_FONT, 900, s, BS_TRACK) +
    (year ? size * 0.16 + measure(year, TITLE_FONT, 900, s, BS_TRACK) : 0)
  );
};

// A title card's title: the place in solid Big Shoulders Black, the year in outline, leaned. (x, y) is the left end of
// the baseline. `colour` is ink on paper, paper on night.
export const TitleText: React.FC<{
  x: number;
  y: number;
  size: number;
  text: string;
  colour?: string;
}> = ({ x, y, size, text, colour = INK }) => {
  useLettering();
  const { place, year } = splitTitle(text);
  const s = size * BS_K;
  const placeW = measure(place, TITLE_FONT, 900, s, BS_TRACK);
  return (
    <g transform={`translate(${x} ${y}) skewX(${SKEW})`}>
      <text
        x={0}
        y={0}
        fontFamily={TITLE_FONT}
        fontWeight={900}
        fontSize={s}
        letterSpacing={`${BS_TRACK}em`}
        fill={colour}
      >
        {place}
      </text>
      {year ? (
        <text
          x={placeW + size * 0.16}
          y={0}
          fontFamily={TITLE_FONT}
          fontWeight={900}
          fontSize={s}
          letterSpacing={`${BS_TRACK}em`}
          fill="none"
          stroke={colour}
          strokeWidth={Math.max(3, size * 0.028)}
          strokeLinejoin="round"
        >
          {year}
        </text>
      ) : null}
    </g>
  );
};

/** Big Shoulders Black's cap height per px of font size. */
export const TITLE_CAP = 0.72;
/** Font size (px) at which `text` in Big Shoulders Black is `width` wide, but no taller (caps) than `maxCap`. */
export const fitTitleSize = (text: string, width: number, maxCap: number) => {
  const per = measure(text, TITLE_FONT, 900, 100) / 100;
  return Math.min(maxCap / TITLE_CAP, width / per);
};
/** SVG transform that leans text by the titles' 8° about its anchor point. */
export const lean = (x: number, y: number) =>
  `translate(${x} ${y}) skewX(${SKEW}) translate(${-x} ${-y})`;

// Big numerals (67G, the points): Big Shoulders Black, leaned, with a halo in the other colour so they read on any
// ground. `anchor` as in SVG text-anchor.
export const BigText: React.FC<{
  x: number;
  y: number;
  size: number;
  children: string;
  colour?: string;
  halo?: string;
  haloWidth?: number;
  anchor?: "start" | "middle" | "end";
}> = ({
  x,
  y,
  size,
  children,
  colour = INK,
  halo = PAPER,
  haloWidth,
  anchor = "start",
}) => (
  <g transform={`translate(${x} ${y}) skewX(${SKEW})`}>
    <text
      x={0}
      y={0}
      textAnchor={anchor}
      fontFamily={TITLE_FONT}
      fontWeight={900}
      fontSize={size * BS_K}
      fill={colour}
      stroke={halo}
      strokeWidth={haloWidth ?? size * 0.12}
      strokeLinejoin="round"
      paintOrder="stroke"
    >
      {children}
    </text>
  </g>
);

// The line under every title: a short strip of chequered flag (two rows of checks) wiping in left to right, then the
// circuit's name typed on in small letter-spaced Titillium caps. (x, y) is the strip's top left; `strip` and `name`
// are 0–1 progress. Returns nothing until the strip starts.
export const CIRCUIT_SIZE = 24;
export const CircuitTag: React.FC<{
  x: number;
  y: number;
  text: string;
  strip: number;
  name: number;
  colour?: string;
  size?: number;
  checks?: number;
}> = ({
  x,
  y,
  text,
  strip,
  name,
  colour = INK,
  size = CIRCUIT_SIZE,
  checks = 16,
}) => {
  if (strip <= 0) return null;
  const sq = Math.round(size * 0.42);
  const other = colour === INK ? PAPER : INK;
  const n = Math.max(0, Math.min(checks, Math.ceil(checks * strip)));
  const shown = text.slice(0, Math.round(text.length * Math.min(1, name)));
  const cells: React.ReactNode[] = [];
  for (let i = 0; i < n; i++)
    for (let r = 0; r < 2; r++)
      if ((i + r) % 2 === 0)
        cells.push(
          <rect
            key={`${i}-${r}`}
            x={x + i * sq}
            y={y + r * sq}
            width={sq}
            height={sq}
            fill={colour}
          />,
        );
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={n * sq}
        height={sq * 2}
        fill={other}
        stroke={colour}
        strokeWidth={2}
      />
      {cells}
      {shown ? (
        <text
          x={x}
          y={y + sq * 2 + size * 1.25}
          fontFamily={CAPTION_FONT}
          fontWeight={600}
          fontSize={size}
          letterSpacing="0.25em"
          fill={colour}
          opacity={Math.min(1, name * 4)}
        >
          {shown}
        </text>
      ) : null}
    </g>
  );
};
/** Strip then name, from a title's own clock: the strip wipes over 14 frames from `start`, the name types over 30. */
export const circuitAnim = (t: number, start: number) => {
  const c = (v: number) => Math.max(0, Math.min(1, v));
  return { strip: c((t - start) / 14), name: c((t - start - 10) / 30) };
};
/** Height of a CircuitTag from its top to the name's baseline. */
export const circuitTagHeight = (size = CIRCUIT_SIZE) =>
  Math.round(size * 0.42) * 2 + size * 1.25;

// ── sound effects ────────────────────────────────────────────────────────────────────────────────────────────────
// Bangers in ink with a thick paper halo; every letter nudged up or down and turned a little (deterministic), rotated
// about the start of the baseline.
const jitter = (text: string, size: number, amp = 0.8) => {
  const off = [...text].map((_, i) => (((i * 37) % 5) - 2) * amp * 0.06 * size);
  const dy = off.map((o, i) => (i === 0 ? o : o - off[i - 1]));
  const rot = [...text].map((_, i) => (((i * 53) % 7) - 3) * amp * 2.2);
  return { dy: dy.map((v) => v.toFixed(1)).join(" "), rotate: rot.join(" ") };
};

export const Sfx: React.FC<{
  x: number;
  y: number;
  size: number;
  rotate?: number;
  anchor?: "start" | "middle" | "end";
  children: string;
}> = ({ x, y, size, rotate = 0, anchor = "start", children }) => {
  const j = jitter(children, size);
  return (
    <text
      x={x}
      y={y}
      dy={j.dy}
      rotate={j.rotate}
      textAnchor={anchor}
      fontFamily={SFX_FONT}
      fontSize={size}
      letterSpacing="0.03em"
      fill={INK}
      stroke={PAPER}
      strokeWidth={size * 0.14}
      strokeLinejoin="round"
      paintOrder="stroke"
      transform={`rotate(${rotate} ${x} ${y})`}
    >
      {children}
    </text>
  );
};

// ── narration boxes ──────────────────────────────────────────────────────────────────────────────────────────────
// A paper box with a heavy ink border and a hard ink drop shadow, Titillium Web Bold caps inside. (x, y) is the box's
// top left; the box hugs its text unless `w` / `h` fix it (the text is then centred in it).
const CAP_TRACK = 0.02;
export const captionSize = (lines: readonly string[], size = 48) => {
  const padX = size * 0.45;
  const lineH = size * 1.15;
  const textW = Math.max(
    ...lines.map((l) => measure(l, CAPTION_FONT, 700, size, CAP_TRACK)),
  );
  return { w: textW + padX * 2, h: size * 0.5 + lineH * lines.length };
};

export const Caption: React.FC<{
  x: number;
  y: number;
  w?: number;
  h?: number;
  lines: readonly string[];
  size?: number;
  align?: "start" | "middle";
  /** Which point of the box `x` names: its left edge (default), its middle or its right edge. */
  boxAnchor?: "start" | "middle" | "end";
}> = ({ x: x0, y, w, h, lines, size = 48, align = "start", boxAnchor = "start" }) => {
  useLettering();
  const fit = captionSize(lines, size);
  const bw = w ?? fit.w;
  const bh = h ?? fit.h;
  const x = x0 - (boxAnchor === "middle" ? bw / 2 : boxAnchor === "end" ? bw : 0);
  const lineH = size * 1.15;
  const block = lineH * (lines.length - 1);
  // Titillium caps are ~0.69 em tall: centre the caps of the block in the box
  const first = y + bh / 2 - block / 2 + size * 0.345;
  const tx = align === "middle" ? x + bw / 2 : x + (bw - fit.w) / 2 + size * 0.45;
  return (
    <g>
      <rect x={x + 7} y={y + 7} width={bw} height={bh} fill={INK} />
      <rect
        x={x}
        y={y}
        width={bw}
        height={bh}
        fill={PAPER}
        stroke={INK}
        strokeWidth={5}
      />
      {lines.map((line, i) => (
        <text
          key={line}
          x={tx}
          y={first + i * lineH}
          textAnchor={align}
          fontFamily={CAPTION_FONT}
          fontWeight={700}
          fontSize={size}
          letterSpacing={`${CAP_TRACK}em`}
          fill={INK}
        >
          {line}
        </text>
      ))}
    </g>
  );
};

// ── stamps ───────────────────────────────────────────────────────────────────────────────────────────────────────
// A red rubber stamp centred on (0, 0) of the caller's transform: paper fill (it covers what is under it), a heavy red
// frame with an inner rule, Saira Stencil Bold letters. Box size follows the text unless `minW` is larger.
export const RubberStamp: React.FC<{
  text: string;
  size: number;
  minW?: number;
}> = ({ text, size, minW = 0 }) => {
  useLettering();
  const tw = measure(text, STAMP_FONT, 700, size, 0.05);
  const w = Math.max(minW, tw + size * 0.9);
  const h = size * 1.5;
  return (
    <g>
      <rect
        x={-w / 2}
        y={-h / 2}
        width={w}
        height={h}
        rx={size * 0.16}
        fill={PAPER}
        stroke={STAMP_RED}
        strokeWidth={Math.max(5, size * 0.1)}
      />
      <rect
        x={-w / 2 + size * 0.2}
        y={-h / 2 + size * 0.2}
        width={w - size * 0.4}
        height={h - size * 0.4}
        rx={size * 0.06}
        fill="none"
        stroke={STAMP_RED}
        strokeWidth={Math.max(2, size * 0.035)}
      />
      <text
        x={0}
        y={size * 0.36}
        textAnchor="middle"
        fontFamily={STAMP_FONT}
        fontWeight={700}
        fontSize={size}
        letterSpacing="0.05em"
        fill={STAMP_RED}
      >
        {text}
      </text>
    </g>
  );
};
