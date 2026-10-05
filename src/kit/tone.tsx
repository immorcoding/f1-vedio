// Screentone: 45° rotated dot screens (ART-2). Three opaque levels for the black-and-white environment, and
// transparent dot screens laid over a flat colour to shade it (how car liveries get their shading, ART-8).
import { INK, PAPER } from "./colors";

export type ToneLevel = "dark" | "mid" | "light";

// The standard screen's cell, px.
export const STANDARD_GAP = 7;

// Dot radius per level on the standard 7 px screen.
const LEVEL_R: Record<ToneLevel, number> = { dark: 2.7, mid: 1.8, light: 1.05 };

// Inside an element of this class every standard (7 px) dot screen is drawn as the flat grey it averages to (the tone
// layer under the dots). The heat haze warps that flat copy and screens it again afterwards with the same standard
// screen, so those dots never warp into a moiré (screen-warp.tsx, ART-22). Screens of other sizes (a car's shading,
// soot, powder) keep their own dots there and warp as before: re-screened they would change texture. Outside it
// nothing changes.
export const FLAT_TONE_CLASS = "tone-flat";

const hex = (c: string) =>
  [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
// a dot screen's ink coverage, and the flat colour it averages to
const flatFill = (r: number, gap: number, paper: boolean) => {
  const cover = Math.min(1, (Math.PI * r * r) / (gap * gap));
  if (!paper) {
    return `fill:${INK};fill-opacity:${cover.toFixed(4)}`;
  }
  const [p, k] = [hex(PAPER), hex(INK)];
  const mix = p.map((v, i) => Math.round(v + (k[i] - v) * cover));
  return `fill:rgb(${mix.join(",")})`;
};

// One dot screen. `paper` fills the gaps with paper colour (an opaque tone); without it the gaps are transparent.
// The pattern lives in the user space of whatever references it, so it scales with a scaled group.
export const TonePattern: React.FC<{
  id: string;
  r: number;
  gap?: number;
  paper?: boolean;
}> = ({ id, r, gap = 7, paper = false }) => (
  <>
    <pattern
      id={id}
      width={gap}
      height={gap}
      patternUnits="userSpaceOnUse"
      patternTransform="rotate(45)"
    >
      {paper ? <rect width={gap} height={gap} fill={PAPER} /> : null}
      <circle cx={gap / 2} cy={gap / 2} r={r} fill={INK} />
    </pattern>
    {gap === STANDARD_GAP ? (
      <style>{`.${FLAT_TONE_CLASS} [fill="url(#${id})"]{${flatFill(r, gap, paper)}}`}</style>
    ) : null}
  </>
);

// The three opaque tones of one SVG. Put once in each <svg>'s <defs>, then fill with `tone("mid")`.
// Components that must not depend on the page's <defs> (such as the car) define their own set under a unique prefix.
export const ToneDefs: React.FC<{ prefix?: string }> = ({
  prefix = "tone",
}) => (
  <>
    {(Object.keys(LEVEL_R) as ToneLevel[]).map((level) => (
      <TonePattern
        key={level}
        id={`${prefix}-${level}`}
        r={LEVEL_R[level]}
        paper
      />
    ))}
  </>
);

export const tone = (level: ToneLevel, prefix = "tone") =>
  `url(#${prefix}-${level})`;
