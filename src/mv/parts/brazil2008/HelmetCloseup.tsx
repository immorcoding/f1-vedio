// A driver's helmet alone, drawn at close-up scale (no car around it): the same shell and design data as the helmet
// in the car (MangaCar, ART-13), with the detail a close-up needs — visor pivot, top intake and
// rear spoiler of a modern shell, the dark padding at the neck opening, a shade side in a darker base colour with dots
// over it (ART-8), and rain beads on the shell. Helmet units: centre 0 0, radius 1, facing left, y down; `flip`
// turns it to face right. `glint` (0–1) flares the visor's highlight.
import { useId } from "react";
import type { CarSpec } from "../../../cars";
import { INK, PAPER } from "../../../kit/colors";
import { shadeOf } from "../../../kit/figure";
import { TonePattern } from "../../../kit/tone";

const SHELL =
  "M -0.98 0.45 C -1.08 -0.1 -0.75 -0.98 0.05 -1 C 0.7 -1 1.05 -0.55 1.02 0.05 L 0.95 0.6 L -0.6 0.7 Z";
const VISOR =
  "M -1 -0.12 C -0.95 -0.42 -0.6 -0.5 -0.1 -0.46 L 0.12 -0.1 C -0.3 0.02 -0.75 0.05 -1 0.08 Z";

// rain beads on the shell: centre and size in helmet units
const BEADS = [
  { x: -0.42, y: -0.72, s: 0.035 },
  { x: -0.15, y: -0.84, s: 0.028 },
  { x: 0.32, y: -0.62, s: 0.04 },
  { x: 0.55, y: -0.3, s: 0.03 },
  { x: 0.22, y: 0.18, s: 0.034 },
  { x: -0.35, y: 0.32, s: 0.026 },
  { x: 0.68, y: 0.12, s: 0.028 },
];

export const HelmetCloseup: React.FC<{
  car: CarSpec;
  x: number;
  y: number;
  r: number;
  flip?: boolean;
  glint?: number;
}> = ({ car, x, y, r, flip = false, glint = 0 }) => {
  const id = `hc${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const {
    base,
    stripe,
    trim = stripe,
    shell = "modern",
    design,
  } = car.driver.helmet;
  // ink widths in helmet units, so they come out the same in pixels at any radius
  const px = (p: number) => p / r;
  const ink = px(9);
  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -r : r} ${r})`}>
      <defs>
        <clipPath id={`${id}-shell`}>
          <path d={SHELL} />
        </clipPath>
        <clipPath id={`${id}-visor`}>
          <path d={VISOR} />
        </clipPath>
        <TonePattern id={`${id}-dots`} r={px(2.6)} gap={px(11)} />
      </defs>
      {shell === "modern" ? (
        <>
          {/* rear spoiler and top intake */}
          <path
            d="M 0.74 -0.74 L 1.0 -0.8 L 1.04 -0.6 L 0.92 -0.54 Z"
            fill={base}
            stroke={INK}
            strokeWidth={ink * 0.8}
            strokeLinejoin="round"
          />
          <path
            d="M -0.2 -0.97 L -0.15 -1.13 L 0.22 -1.13 L 0.28 -0.97 Z"
            fill={INK}
          />
          <path
            d="M -0.1 -1.08 L 0.16 -1.08"
            stroke="#3a3a3a"
            strokeWidth={px(5)}
            strokeLinecap="round"
          />
        </>
      ) : null}
      <path d={SHELL} fill={base} />
      <g clipPath={`url(#${id}-shell)`}>
        {design ? (
          design.map((a) => <path key={a.d} d={a.d} fill={a.color} />)
        ) : (
          <>
            <path
              d="M -0.75 -0.7 C -0.2 -0.95 0.5 -0.86 1 -0.32"
              fill="none"
              stroke={stripe}
              strokeWidth={0.2}
            />
            <path
              d="M 0.1 -0.02 C 0.45 -0.04 0.8 0.02 1.05 0.18"
              fill="none"
              stroke={trim}
              strokeWidth={0.13}
            />
          </>
        )}
        {/* the shade side: the lower back of the shell in a darker base, with dots over it */}
        <path
          d="M -1.2 0.4 C -0.3 0.42 0.55 0.24 1.2 -0.22 L 1.2 1 L -1.2 1 Z"
          fill={shadeOf(base, 0.28)}
          opacity={0.55}
        />
        <path
          d="M -1.2 0.34 C -0.3 0.36 0.5 0.18 1.2 -0.3 L 1.2 1 L -1.2 1 Z"
          fill={`url(#${id}-dots)`}
          opacity={0.5}
        />
        {/* the neck opening: dark padding along the bottom edge */}
        <path
          d="M -0.7 0.74 L -0.62 0.6 C -0.1 0.52 0.5 0.5 0.96 0.48 L 1 0.66 Z"
          fill={INK}
        />
        <path
          d="M -0.55 0.62 C -0.1 0.55 0.5 0.53 0.92 0.51"
          fill="none"
          stroke="#3a3a3a"
          strokeWidth={px(4)}
        />
      </g>
      {/* visor: tinted, a big highlight and a thin one (they flare with `glint`), the seal along its top */}
      <path d={VISOR} fill="#15132a" />
      <g clipPath={`url(#${id}-visor)`}>
        <path
          d="M -0.95 -0.18 C -0.8 -0.4 -0.5 -0.44 -0.2 -0.42 L -0.3 -0.3 C -0.55 -0.32 -0.8 -0.26 -0.92 -0.08 Z"
          fill="#2c2a4a"
        />
        <path
          d="M -0.86 -0.33 C -0.62 -0.42 -0.32 -0.42 -0.1 -0.38"
          fill="none"
          stroke={PAPER}
          strokeWidth={px(7 + 8 * glint)}
          strokeLinecap="round"
          opacity={0.85}
        />
        <path
          d="M -0.7 -0.22 C -0.5 -0.27 -0.3 -0.27 -0.16 -0.25"
          fill="none"
          stroke={PAPER}
          strokeWidth={px(3 + 4 * glint)}
          strokeLinecap="round"
          opacity={0.55 + 0.4 * glint}
        />
        {/* rain running down the visor */}
        {[-0.78, -0.55, -0.3].map((vx, i) => (
          <path
            key={vx}
            d={`M ${vx} ${-0.36 + 0.04 * i} L ${vx - 0.02} ${-0.06 + 0.03 * i}`}
            stroke="#5a5880"
            strokeWidth={px(4)}
            strokeLinecap="round"
          />
        ))}
      </g>
      <path
        d={VISOR}
        fill="none"
        stroke={INK}
        strokeWidth={ink * 0.8}
        strokeLinejoin="round"
      />
      {/* pivot plate at the visor's back */}
      <ellipse
        cx={0.13}
        cy={-0.22}
        rx={0.09}
        ry={0.075}
        fill={shadeOf(base, 0.12)}
        stroke={INK}
        strokeWidth={ink * 0.7}
      />
      <circle cx={0.13} cy={-0.22} r={0.022} fill={INK} />
      {/* chin vents */}
      <path
        d="M -0.9 0.26 L -0.64 0.26 M -0.88 0.38 L -0.62 0.38"
        stroke={INK}
        strokeWidth={ink * 0.7}
        strokeLinecap="round"
      />
      {/* crown highlight and rain beads */}
      <path
        d="M -0.55 -0.82 C -0.3 -0.95 0 -0.98 0.25 -0.95"
        fill="none"
        stroke={PAPER}
        strokeWidth={px(9)}
        strokeLinecap="round"
        opacity={0.9}
      />
      <path
        d="M 0.38 -0.9 C 0.5 -0.86 0.6 -0.8 0.68 -0.72"
        fill="none"
        stroke={PAPER}
        strokeWidth={px(5)}
        strokeLinecap="round"
        opacity={0.75}
      />
      {BEADS.map((b) => (
        <g key={`${b.x}${b.y}`}>
          <ellipse
            cx={b.x}
            cy={b.y}
            rx={b.s}
            ry={b.s * 1.25}
            fill={PAPER}
            opacity={0.65}
            stroke={INK}
            strokeWidth={px(2)}
          />
          <circle
            cx={b.x - b.s * 0.3}
            cy={b.y - b.s * 0.4}
            r={b.s * 0.3}
            fill={PAPER}
          />
        </g>
      ))}
      <path
        d={SHELL}
        fill="none"
        stroke={INK}
        strokeWidth={ink}
        strokeLinejoin="round"
      />
    </g>
  );
};
