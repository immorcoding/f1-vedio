// Screentone: 45° rotated dot screens (ART-2). Three opaque levels for the black-and-white environment, and
// transparent dot screens laid over a flat colour to shade it (how car liveries get their shading, ART-8).
import { INK, PAPER } from "./colors";

export type ToneLevel = "dark" | "mid" | "light";

// Dot radius per level on the standard 7 px screen.
const LEVEL_R: Record<ToneLevel, number> = { dark: 2.7, mid: 1.8, light: 1.05 };

// One dot screen. `paper` fills the gaps with paper colour (an opaque tone); without it the gaps are transparent.
// The pattern lives in the user space of whatever references it, so it scales with a scaled group.
export const TonePattern: React.FC<{
  id: string;
  r: number;
  gap?: number;
  paper?: boolean;
}> = ({ id, r, gap = 7, paper = false }) => (
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
