// The signal lamp of the intro's start-light gantry, shared so other lamps can rhyme with it (#21: the safety car's
// amber roof lamps go out like the five red lights). A lit lamp is a flat block of the lamp's real colour (ART-8) with
// a white-hot core, a screentone of the dark colour on its lower rim and, for a moment after it switches on, a burst of
// ticks; an unlit lamp is dark glass with a mid screentone. A hood crescent, the rim and a gloss stroke are drawn over
// both. Drawn for a black page: the line work is paper white.
//
// Sizes are the gantry's (radius 66) scaled by `r / 66`, so the intro's lamps are drawn exactly as before.

/** A stroke that draws itself on as `progress` goes 0 → 1. */
export const DrawPath: React.FC<{
  d: string;
  progress: number;
  width?: number;
  color?: string;
  opacity?: number;
}> = ({ d, progress, width = 3, color = "#fbfaf6", opacity = 1 }) =>
  progress <= 0 ? null : (
    <path
      d={d}
      pathLength={1}
      fill="none"
      stroke={color}
      strokeWidth={width}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeDasharray="1.001 1"
      strokeDashoffset={1 - progress}
      opacity={opacity}
    />
  );

export const circlePath = (cx: number, cy: number, r: number) =>
  `M ${cx - r} ${cy} a ${r} ${r} 0 1 0 ${2 * r} 0 a ${r} ${r} 0 1 0 ${-2 * r} 0`;

/** Arc of a circle from angle a0 to a1 (radians, SVG orientation: 0 = right, π/2 = down). */
export const arcPath = (
  cx: number,
  cy: number,
  r: number,
  a0: number,
  a1: number,
) => {
  const large = Math.abs(a1 - a0) > Math.PI ? 1 : 0;
  const sweep = a1 > a0 ? 1 : 0;
  return `M ${cx + r * Math.cos(a0)} ${cy + r * Math.sin(a0)} A ${r} ${r} 0 ${large} ${sweep} ${cx + r * Math.cos(a1)} ${cy + r * Math.sin(a1)}`;
};

const GANTRY_R = 66;

export type LampPaint = {
  /** The lamp's real colour when lit, and its white-hot core. */
  lit: string;
  hot: string;
  /** Fills (`url(#…)`) the page defines: the bloom gradient, the lit rim's tone, the unlit glass and the hood. */
  bloom: string;
  litTone: string;
  midTone: string;
  darkTone: string;
  /** Line colour (paper white on a black page). */
  line: string;
  /** The page colour behind the lens. */
  glass: string;
};

export const Lamp: React.FC<{
  x: number;
  y: number;
  r?: number;
  /** 0..1 draw-in of the line work. */
  draw: number;
  /** 0..1 fade-in of the screentones. */
  tone: number;
  /** 0 = dark, ≥ 1 = lit (above 1 for the flash as it switches on). */
  on: number;
  /** Frames since it came on (the tick burst lasts 14 frames). */
  age: number;
  paint: LampPaint;
}> = ({ x, y, r = GANTRY_R, draw, tone, on, age, paint }) => {
  const k = r / GANTRY_R;
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill={paint.glass} />
      {on > 0 ? (
        <>
          <circle
            cx={x}
            cy={y}
            r={r * 2.3}
            fill={paint.bloom}
            opacity={Math.min(1, 0.5 * on)}
          />
          <circle cx={x} cy={y} r={r} fill={paint.lit} />
          <path
            d={`${arcPath(x, y, r, Math.PI * -0.15, Math.PI * 0.85)} ${arcPath(x + 12 * k, y + 12 * k, r - 8 * k, Math.PI * 0.85, Math.PI * -0.15).replace("M", "L")} Z`}
            fill={paint.litTone}
          />
          <circle
            cx={x - 10 * k}
            cy={y - 10 * k}
            r={r * 0.42}
            fill={paint.hot}
            opacity={Math.min(1, 0.75 + 0.25 * (on - 1))}
          />
          {age < 14 ? (
            <path
              d={Array.from({ length: 12 }, (_, i) => {
                const a = (i / 12) * Math.PI * 2 + 0.13;
                const r0 = r + 26 * k;
                const r1 = r + 26 * k + 46 * k * (1 - age / 14);
                return `M ${x + Math.cos(a) * r0} ${y + Math.sin(a) * r0} L ${x + Math.cos(a) * r1} ${y + Math.sin(a) * r1}`;
              }).join(" ")}
              stroke={paint.line}
              strokeWidth={4 * k}
              strokeLinecap="round"
              opacity={1 - age / 14}
            />
          ) : null}
        </>
      ) : (
        // unlit: dark glass with a mid screentone
        <circle cx={x} cy={y} r={r} fill={paint.midTone} opacity={0.55 * tone} />
      )}
      {/* inside of the hood: a crescent of dark tone above the lens */}
      <path
        d={`${arcPath(x, y, r + 14 * k, Math.PI * 1.08, Math.PI * 1.92)} ${arcPath(x, y, r + 2 * k, Math.PI * 1.92, Math.PI * 1.08).replace("M", "L")} Z`}
        fill={paint.darkTone}
        opacity={tone}
      />
      <DrawPath d={circlePath(x, y, r + 14 * k)} progress={draw} width={4 * k} color={paint.line} />
      <DrawPath
        d={circlePath(x, y, r)}
        progress={draw}
        width={2 * k}
        opacity={0.8}
        color={paint.line}
      />
      {/* gloss on the glass */}
      <DrawPath
        d={arcPath(x, y, r - 14 * k, Math.PI * 1.15, Math.PI * 1.45)}
        progress={draw}
        width={5 * k}
        opacity={0.6}
        color={paint.line}
      />
    </g>
  );
};
