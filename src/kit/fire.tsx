// Manga fire: inked flame tongues in three layers (outer, mid, core), detached wisps, embers and a smoke column above.
// It jumps rather than flows: the shapes are redrawn every `step` frames (animated on threes by default), like
// hand-drawn fire in a manga anime.
//
// The whole look of the fire is one parameter, its palette. FIRE_MANGA keeps it in the page's black and white (ART-2,
// ART-8: fire is environment); FIRE_COLOR is the coloured alternative, an ART-8 exception waiting on the user's call.
import { useId } from "react";
import { random } from "remotion";
import { INK, PAPER } from "./colors";
import { TonePattern } from "./tone";

export type FirePalette = {
  readonly name: string;
  // Fills of the three flame layers, outside in.
  readonly outer: string;
  readonly mid: string;
  readonly core: string;
  // Lay a dot screen over the mid layer (how black-and-white fire gets its grey).
  readonly midDots: boolean;
  // The outline round the outer flames and the wisps.
  readonly line: string;
  readonly smoke: string;
  readonly smokeDots: boolean;
  readonly ember: string;
  // Light thrown round the fire; none in black and white.
  readonly glow: string | null;
};

export const FIRE_MANGA: FirePalette = {
  name: "manga",
  outer: PAPER,
  mid: PAPER,
  core: PAPER,
  midDots: true,
  line: INK,
  smoke: "#2a2a2a",
  smokeDots: true,
  ember: PAPER,
  glow: null,
};

export const FIRE_COLOR: FirePalette = {
  name: "color",
  outer: "#d8321c",
  mid: "#f58a1f",
  core: "#ffe8a6",
  midDots: false,
  line: INK,
  smoke: "#262626",
  smokeDots: true,
  ember: "#ffc35a",
  glow: "#ff6a1a",
};

export const FIRE_PALETTES = { manga: FIRE_MANGA, color: FIRE_COLOR };
export type FirePaletteName = keyof typeof FIRE_PALETTES;

type Tongue = { bx: number; w: number; h: number; lean: number };

// One flame tongue standing on y = 0: a teardrop from its base up to a leaning tip, with a curl on one side.
const tonguePath = ({ bx, w, h, lean }: Tongue, s: number) => {
  const W = w * s;
  const H = h * s;
  const L = lean * s;
  const l = bx - W / 2;
  const r = bx + W / 2;
  const tip = bx + L;
  // left flank up to a sharp tip, down the right flank to a small outward flick, then back to the base
  return (
    `M ${l} 0 C ${l - W * 0.15} ${-H * 0.3} ${tip - W * 0.5} ${-H * 0.55} ${tip - W * 0.1} ${-H * 0.8} ` +
    `L ${tip} ${-H} C ${tip + W * 0.06} ${-H * 0.84} ${tip + W * 0.22} ${-H * 0.72} ${tip + W * 0.2} ${-H * 0.6} ` +
    `L ${r + W * 0.16} ${-H * 0.64} C ${r - W * 0.06} ${-H * 0.48} ${r + W * 0.14} ${-H * 0.26} ${r} 0 Z`
  );
};

// A detached flame flick floating at height y (negative = up): a thin curved sliver, pointed at both ends — a lick of
// flame torn off the top, never a round-bottomed drop.
const wispPath = ({ bx, y, w, h, lean }: Tongue & { y: number }) => {
  const W = w * 0.5;
  const s = lean >= 0 ? 1 : -1;
  return (
    `M ${bx - s * W * 0.3} ${y} ` +
    `C ${bx + s * W * 0.9} ${y - h * 0.25} ${bx - s * W * 0.4} ${y - h * 0.6} ${bx + s * W * 0.5} ${y - h} ` +
    `C ${bx + s * W * 0.1} ${y - h * 0.62} ${bx + s * W * 1.5} ${y - h * 0.3} ${bx - s * W * 0.3} ${y} Z`
  );
};

export type FireProps = {
  // Middle of the fire's base, on screen.
  x: number;
  y: number;
  // Width of the base and height of the tallest tongue, px.
  w: number;
  h: number;
  // Composition frame; the shapes change every `step` frames.
  frame: number;
  seed: string;
  palette: FirePalette;
  step?: number;
  // 0–1: how far the fire has grown.
  intensity?: number;
  // Finer drawing for close-ups: this many times more (and narrower) tongues. Default 1.
  detail?: number;
  // Draw the smoke column.
  smoke?: boolean;
};

export const Fire: React.FC<FireProps> = ({
  x,
  y,
  w,
  h,
  frame,
  seed,
  palette,
  step = 3,
  intensity = 1,
  smoke = true,
  detail = 1,
}) => {
  const id = `fire${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const t = Math.floor(frame / step);
  const R = (k: string) => random(`${seed}-${k}-${t}`);
  const n = Math.max(5, Math.round((w / (h * 0.11)) * detail));
  const tongues: Tongue[] = Array.from({ length: n }, (_, i) => {
    const u = (i + 0.5) / n - 0.5;
    const edge = 1 - Math.abs(u) * 1.35; // taller in the middle
    const tall = i % 3 === 1 ? 1 : 0.7; // every third tongue leaps higher
    return {
      bx: u * w * 0.95 + (R(`x${i}`) - 0.5) * (w / n) * 0.6,
      w: (w / n) * (1.7 + R(`w${i}`) * 1.1),
      h: h * intensity * Math.max(0.18, edge) * tall * (0.6 + R(`h${i}`) * 0.4),
      lean: (R(`l${i}`) - 0.5) * (w / n) * 1.8,
    };
  });
  const wisps = Array.from(
    { length: Math.round((n / detail) * 0.5) },
    (_, i) => {
      const life = (t + i * 3) % 5; // each wisp rises and shrinks over five steps
      const u = random(`${seed}-wisp${i}-${Math.floor((t + i * 3) / 5)}`) - 0.5;
      const size = h * 0.07 * (1 - life / 6) * intensity;
      return {
        bx: u * w * 0.7,
        y: -h * intensity * (0.7 + life * 0.1),
        w: size * 0.9,
        h: size * 1.9,
        lean: size * 0.3 * (u > 0 ? 1 : -1),
      };
    },
  );
  const embers = Array.from(
    { length: Math.round((n / detail) * 1.5) },
    (_, i) => {
      const life = (t + i * 2) % 8;
      const g = Math.floor((t + i * 2) / 8);
      const u = random(`${seed}-em${i}-${g}`) - 0.5;
      return {
        x: u * w * 1.1 + Math.sin(life + i) * 12,
        y: -h * intensity * (0.3 + life * 0.16),
        r: 3 + random(`${seed}-er${i}-${g}`) * 4,
      };
    },
  );
  const puffs = Array.from({ length: 7 }, (_, i) => {
    const life = ((t * 0.5 + i * 1.7) % 7) / 7;
    return {
      x: (random(`${seed}-pf${i}`) - 0.5) * w * 0.6 + life * w * 0.12,
      y: -h * intensity * (1 + life * 0.9),
      r: (h * 0.1 + life * h * 0.14) * (0.6 + 0.4 * intensity),
    };
  });
  const lineW = Math.max(3, (h * 0.012) / Math.sqrt(detail));

  return (
    <g transform={`translate(${x} ${y})`}>
      <defs>
        <TonePattern id={`${id}-dots`} r={2.1} gap={7} />
        <TonePattern id={`${id}-smoke`} r={2.6} gap={7} />
        {palette.glow ? (
          <radialGradient id={`${id}-glow`}>
            <stop offset="0%" stopColor={palette.glow} stopOpacity={0.55} />
            <stop offset="100%" stopColor={palette.glow} stopOpacity={0} />
          </radialGradient>
        ) : null}
      </defs>
      {palette.glow ? (
        <ellipse
          cx={0}
          cy={-h * 0.35 * intensity}
          rx={w * 1.1}
          ry={h * 0.9 * intensity + 40}
          fill={`url(#${id}-glow)`}
        />
      ) : null}
      {smoke
        ? puffs.map((p, i) => (
            <g key={`s${i}`}>
              <circle
                cx={p.x}
                cy={p.y}
                r={p.r}
                fill={palette.smoke}
                stroke={INK}
                strokeWidth={lineW}
              />
              {palette.smokeDots ? (
                <circle
                  cx={p.x - p.r * 0.2}
                  cy={p.y - p.r * 0.2}
                  r={p.r * 0.7}
                  fill={`url(#${id}-smoke)`}
                  opacity={0.6}
                />
              ) : null}
            </g>
          ))
        : null}
      {/* outline first, all tongues, then the fills over it: one inked silhouette */}
      {[...tongues.map((tg) => tonguePath(tg, 1)), ...wisps.map(wispPath)].map(
        (d, i) => (
          <path
            key={`o${i}`}
            d={d}
            fill={palette.line}
            stroke={palette.line}
            strokeWidth={lineW * 2.2}
            strokeLinejoin="round"
          />
        ),
      )}
      {tongues.map((tg, i) => (
        <path key={`f${i}`} d={tonguePath(tg, 1)} fill={palette.outer} />
      ))}
      {wisps.map((s, i) => (
        <path key={`w${i}`} d={wispPath(s)} fill={palette.mid} />
      ))}
      {tongues.map((tg, i) => (
        <g key={`m${i}`}>
          <path
            d={tonguePath(tg, 0.66)}
            fill={palette.mid}
            stroke={palette.line}
            strokeWidth={lineW * 0.6}
            strokeLinejoin="round"
          />
          {palette.midDots ? (
            <path d={tonguePath(tg, 0.66)} fill={`url(#${id}-dots)`} />
          ) : null}
        </g>
      ))}
      {tongues.map((tg, i) => (
        <path
          key={`c${i}`}
          d={tonguePath({ ...tg, h: tg.h * 0.8 }, 0.36)}
          fill={palette.core}
        />
      ))}
      {embers.map((e, i) => (
        <path
          key={`e${i}`}
          d={`M ${e.x} ${e.y - e.r * 1.6} L ${e.x + e.r} ${e.y} L ${e.x} ${e.y + e.r * 1.6} L ${e.x - e.r} ${e.y} Z`}
          fill={palette.ember}
          stroke={INK}
          strokeWidth={1.5}
        />
      ))}
    </g>
  );
};
