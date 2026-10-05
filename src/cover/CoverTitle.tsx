// The cover's title block, shared by every variant: the Chinese title slammed into a heavy ink box (paper letters,
// a paper keyline and a hard ink drop shadow, so it reads on paper, on tone and on night), the second line
// "Opus 手绘 F1" in a paper narration box hanging off its lower edge, and a small credit line. Chinese in Noto Sans SC
// Black, Latin and numbers in Big Shoulders Black, both leaned 8° like every title in the film (ART-6).
import { CAPTION_FONT, TITLE_FONT, measure, useLettering } from "../kit/lettering";
import { INK, PAPER } from "../kit/colors";
import { CJK_FONT, useCoverFonts } from "./fonts";

export const TITLE = "从塞纳到维斯塔潘";
export const CREDIT = "MADE BY IMMOR × CLAUDE  ·  1989–2021";

const LEAN = -8;
// Big Shoulders sits small on its em (lettering.tsx BS_K)
const BS_K = 1.12;
// Noto Sans SC's ideographs: centre about 0.38 em above the baseline
const CJK_MID = 0.38;

type Seg = { t: string; latin: boolean };
const SUB: Seg[] = [
  { t: "Opus", latin: true },
  { t: "手绘", latin: false },
  { t: "F1", latin: true },
];

const segW = (s: Seg, size: number) =>
  s.latin
    ? measure(s.t, TITLE_FONT, 900, size * BS_K, 0.01)
    : measure(s.t, CJK_FONT, 900, size);

/** Layout of the block for a title size S (px per Chinese character): box sizes in the block's own frame. */
export const titleLayout = (S: number, sub = 0.5) => {
  const padX = S * 0.42;
  const mainW = measure(TITLE, CJK_FONT, 900, S, 0.02) + padX * 2;
  const mainH = S * 1.34;
  const ss = S * sub;
  const gap = ss * 0.28;
  const subTextW =
    SUB.reduce((a, s) => a + segW(s, ss), 0) + gap * (SUB.length - 1);
  const subPad = ss * 0.42;
  const subW = subTextW + subPad * 2;
  const subH = ss * 1.4;
  const subX = S * 0.55;
  const subY = mainH - ss * 0.22;
  return { padX, mainW, mainH, ss, gap, subW, subH, subX, subY, subPad };
};

export const CoverTitle: React.FC<{
  x: number;
  y: number;
  S: number;
  rotate?: number;
  sub?: number;
  /** Credit line under the second line; false to leave it out (the variant places it elsewhere). */
  credit?: boolean;
  /** Which way the second line's box sits: under the left (default) or the right end of the main box. */
  subAlign?: "left" | "right";
}> = ({ x, y, S, rotate = 0, sub = 0.5, credit = true, subAlign = "left" }) => {
  useLettering();
  useCoverFonts();
  const L = titleLayout(S, sub);
  const subX = subAlign === "left" ? L.subX : L.mainW - L.subX - L.subW;
  const midY = L.mainH / 2;
  const subMid = L.subY + L.subH / 2;
  let cx = subX + L.subPad;
  const segs = SUB.map((s) => {
    const w = segW(s, L.ss);
    const at = cx;
    cx += w + L.gap;
    return { ...s, at, w };
  });
  const k = S * 0.09; // keyline and shadow scale
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate})`}>
      {/* hard ink drop shadow, paper keyline, ink box */}
      <rect x={k * 1.4} y={k * 1.4} width={L.mainW} height={L.mainH} fill={INK} />
      <rect
        x={-k * 0.5}
        y={-k * 0.5}
        width={L.mainW + k}
        height={L.mainH + k}
        fill={PAPER}
      />
      <rect x={0} y={0} width={L.mainW} height={L.mainH} fill={INK} />
      <g transform={`translate(${L.mainW / 2} ${midY}) skewX(${LEAN})`}>
        <text
          x={0}
          y={S * CJK_MID}
          textAnchor="middle"
          fontFamily={CJK_FONT}
          fontWeight={900}
          fontSize={S}
          letterSpacing="0.02em"
          fill={PAPER}
        >
          {TITLE}
        </text>
      </g>
      {/* the second line: a paper narration box with a heavy ink border and a hard shadow */}
      <rect
        x={subX + k * 0.9}
        y={L.subY + k * 0.9}
        width={L.subW}
        height={L.subH}
        fill={INK}
      />
      <rect
        x={subX}
        y={L.subY}
        width={L.subW}
        height={L.subH}
        fill={PAPER}
        stroke={INK}
        strokeWidth={Math.max(5, k * 0.6)}
      />
      <g transform={`translate(0 ${subMid}) skewX(${LEAN})`}>
        {segs.map((s) => (
          <text
            key={s.t}
            x={s.at}
            y={s.latin ? L.ss * BS_K * 0.36 : L.ss * CJK_MID}
            fontFamily={s.latin ? TITLE_FONT : CJK_FONT}
            fontWeight={900}
            fontSize={s.latin ? L.ss * BS_K : L.ss}
            letterSpacing={s.latin ? "0.01em" : "0"}
            fill={INK}
          >
            {s.t}
          </text>
        ))}
      </g>
      {credit ? (
        <CreditTag
          x={subAlign === "left" ? subX + L.subW + S * 0.3 : subX - S * 0.3}
          y={L.subY + L.subH * 0.5}
          size={S * 0.17}
          anchor={subAlign === "left" ? "start" : "end"}
        />
      ) : null}
    </g>
  );
};

/** The small credit line: Titillium Web Bold caps, letter-spaced, in a slim ink tag. (x, y): anchor end, middle. */
export const CreditTag: React.FC<{
  x: number;
  y: number;
  size: number;
  anchor?: "start" | "end";
  text?: string;
}> = ({ x, y, size, anchor = "start", text = CREDIT }) => {
  useLettering();
  const tw = measure(text, CAPTION_FONT, 700, size, 0.12);
  const pad = size * 0.55;
  const w = tw + pad * 2;
  const h = size * 1.7;
  const x0 = anchor === "start" ? x : x - w;
  return (
    <g>
      <rect x={x0} y={y - h / 2} width={w} height={h} fill={INK} stroke={PAPER} strokeWidth={size * 0.18} />
      <text
        x={x0 + pad}
        y={y + size * 0.35}
        fontFamily={CAPTION_FONT}
        fontWeight={700}
        fontSize={size}
        letterSpacing="0.12em"
        fill={PAPER}
      >
        {text}
      </text>
    </g>
  );
};
