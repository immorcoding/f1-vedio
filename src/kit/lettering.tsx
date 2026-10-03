// Manga lettering (ART-6): brush-script sound effects and narration boxes. Chinese text only (STO-5).
import { loadFont as loadBrush } from "@remotion/google-fonts/MaShanZheng";
import { loadFont as loadKuaiLe } from "@remotion/google-fonts/ZCOOLKuaiLe";
import { INK, PAPER } from "./colors";

export const { fontFamily: BRUSH_FONT } = loadBrush("normal", {
  weights: ["400"],
  subsets: ["chinese-simplified"],
  ignoreTooManyRequestsWarning: true,
});
export const { fontFamily: CAPTION_FONT } = loadKuaiLe("normal", {
  weights: ["400"],
  subsets: ["chinese-simplified"],
  ignoreTooManyRequestsWarning: true,
});

// Sound effect (拟声字): black brush characters with a paper-coloured halo, rotated about their baseline start.
export const Sfx: React.FC<{
  x: number;
  y: number;
  size: number;
  rotate?: number;
  children: string;
}> = ({ x, y, size, rotate = 0, children }) => (
  <text
    x={x}
    y={y}
    fontFamily={BRUSH_FONT}
    fontSize={size}
    fill={INK}
    stroke={PAPER}
    strokeWidth={size * 0.08}
    paintOrder="stroke"
    transform={`rotate(${rotate} ${x} ${y})`}
  >
    {children}
  </text>
);

// Narration box (旁白框): a paper box with a heavy ink border and one or more lines of text.
export const Caption: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  lines: string[];
  size?: number;
}> = ({ x, y, w, h, lines, size = 48 }) => (
  <g>
    <rect
      x={x}
      y={y}
      width={w}
      height={h}
      fill={PAPER}
      stroke={INK}
      strokeWidth={5}
    />
    {lines.map((line, i) => (
      <text
        key={line}
        x={x + 30}
        y={y + 17 + size + i * size * 1.25}
        fontFamily={CAPTION_FONT}
        fontSize={size}
        fill={INK}
      >
        {line}
      </text>
    ))}
  </g>
);
