// The safety car from behind, for the 4.3 inset (#21): what HAM sees through the last safety-car lap. The 2021 Abu Dhabi
// safety car was the Aston Martin Vantage (SC02, facts.md); drawn after MrWalkr's 2021 photo of that car
// (references/yas-marina/sc-vantage-2021.jpg, CC BY-SA 4.0): the fastback glasshouse and roof, the wide rear haunches
// with the ducktail and the thin full-width tail-light strip, the fixed rear wing with lime endplates, the livery green
// with its lime pinstripe, and the light bar on two legs above the roof. The bar's lamps are drawn with the start-light
// gantry's lamp (src/kit/lamp.tsx) in their real amber (an ART-8 exception the user approved 2026-10-03), so they
// rhyme with the intro's five red lights when they go out one by one before the drop. No lettering on the car (ART-5).
import { useId } from "react";
import { INK, PAPER } from "../../kit/colors";
import { Lamp, type LampPaint } from "../../kit/lamp";

const SC_GREEN = "#0b5a50"; // Aston Martin racing green of the 2021 safety car (photo)
const SC_GREEN_DARK = "#063a34";
const SC_LIME = "#c7e11e"; // its lime pinstripe and wing endplates
const AMBER = "#ffa000"; // the roof lamps' amber
const AMBER_DARK = "#8a4700";
const AMBER_HOT = "#fff3c4";
const TAIL_RED = "#d0202a"; // the tail-light strip (a car's own light)

/** The design box: the car is drawn in 660 × 420 units and scaled into (x, y, w). */
export const SC_BOX = { w: 660, h: 420 };
export const SC_LAMPS = 5;
const LAMP_R = 33;
const BAR = { x0: 98, x1: 562, y0: 48, y1: 136 };
const lampX = (i: number) => 330 + (i - 2) * 90;
const LAMP_Y = (BAR.y0 + BAR.y1) / 2;

/**
 * `on`: per lamp, 0 = dark, ≥ 1 = lit (above 1 flashes as it comes on); `age`: frames since each came on.
 * `t` seconds drives the road streaming under the car.
 */
export const SafetyCarRear: React.FC<{
  x: number;
  y: number;
  w: number;
  on: readonly number[];
  age: readonly number[];
  t: number;
}> = ({ x, y, w, on, age, t }) => {
  const id = useId().replace(/:/g, "");
  const s = w / SC_BOX.w;
  const lit = on.reduce((a, b) => a + Math.min(1, b), 0) / SC_LAMPS;
  const paint: LampPaint = {
    lit: AMBER,
    hot: AMBER_HOT,
    bloom: `url(#${id}-bloom)`,
    litTone: `url(#${id}-amber)`,
    midTone: `url(#${id}-mid)`,
    darkTone: `url(#${id}-dark)`,
    line: PAPER,
    glass: INK,
  };
  // body outline, symmetric about x = 330
  const body =
    "M -10 430 L 6 372 C 14 340 40 318 92 308 C 120 303 140 300 160 296 " +
    "L 226 182 C 262 168 398 168 434 182 L 500 296 C 520 300 540 303 568 308 " +
    "C 620 318 646 340 654 372 L 670 430 Z";
  const glass = "M 184 290 L 244 212 C 280 205 380 205 416 212 L 476 290 C 420 298 240 298 184 290 Z";
  const dash = (t * 9) % 1;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <defs>
        <radialGradient id={`${id}-bloom`}>
          <stop offset="0%" stopColor={AMBER} stopOpacity={0.85} />
          <stop offset="45%" stopColor={AMBER} stopOpacity={0.28} />
          <stop offset="100%" stopColor={AMBER} stopOpacity={0} />
        </radialGradient>
        <radialGradient id={`${id}-spill`}>
          <stop offset="0%" stopColor={AMBER} stopOpacity={0.5} />
          <stop offset="100%" stopColor={AMBER} stopOpacity={0} />
        </radialGradient>
        <pattern id={`${id}-amber`} width={5} height={5} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <circle cx={2.5} cy={2.5} r={1.6} fill={AMBER_DARK} />
        </pattern>
        <pattern id={`${id}-mid`} width={5} height={5} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <circle cx={2.5} cy={2.5} r={1.2} fill={PAPER} />
        </pattern>
        <pattern id={`${id}-dark`} width={5} height={5} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <circle cx={2.5} cy={2.5} r={1.8} fill={PAPER} />
        </pattern>
        <pattern id={`${id}-shade`} width={7} height={7} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <circle cx={3.5} cy={3.5} r={2.2} fill={INK} />
        </pattern>
        <clipPath id={`${id}-box`}>
          <rect x={0} y={0} width={SC_BOX.w} height={SC_BOX.h} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id}-box)`}>
        {/* night: ink with a dark dot screen, the road below with its centre dashes streaming toward us */}
        <rect x={0} y={0} width={SC_BOX.w} height={SC_BOX.h} fill={INK} />
        <rect x={0} y={0} width={SC_BOX.w} height={SC_BOX.h} fill={`url(#${id}-mid)`} opacity={0.18} />
        {[0, 1].map((k) => {
          const u = (k + dash) / 2;
          return (
            <path
              key={k}
              d={`M ${330 - 6 - 30 * u} ${395 + 30 * u} L ${330 + 6 + 30 * u} ${395 + 30 * u}`}
              stroke={PAPER}
              strokeWidth={4 + 10 * u}
              opacity={0.5}
            />
          );
        })}
        {/* the amber light falling on the roof and the night around it */}
        <ellipse cx={330} cy={LAMP_Y + 40} rx={360} ry={200} fill={`url(#${id}-spill)`} opacity={lit} />

        {/* the car */}
        <path d={body} fill={SC_GREEN} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
        {/* shade on the haunches below the shoulder line */}
        <path
          d="M -10 430 L 6 372 C 14 350 30 336 60 328 C 200 344 460 344 600 328 C 630 336 646 350 654 372 L 670 430 Z"
          fill={`url(#${id}-shade)`}
          opacity={0.55}
        />
        {/* rear window: dark glass with one gloss stroke */}
        <path d={glass} fill={INK} stroke={INK} strokeWidth={4} />
        <path d="M 258 220 L 222 278" stroke={PAPER} strokeWidth={6} strokeLinecap="round" opacity={0.55} />
        {/* roof: a lighter strip of the green where the amber light lands */}
        <path d="M 230 184 C 264 172 396 172 430 184 L 424 194 C 392 184 268 184 236 194 Z" fill={PAPER} opacity={0.35} />
        {/* ducktail lip and the tail-light strip under it */}
        <path d="M 92 318 C 200 300 460 300 568 318" fill="none" stroke={INK} strokeWidth={5} />
        <path d="M 70 342 C 200 326 460 326 590 342" fill="none" stroke={INK} strokeWidth={14} strokeLinecap="round" />
        <path d="M 74 342 C 200 327 460 327 586 342" fill="none" stroke={TAIL_RED} strokeWidth={8} strokeLinecap="round" />
        <path d="M 120 337 C 220 329 440 329 540 337" fill="none" stroke={PAPER} strokeWidth={2.5} opacity={0.7} />
        {/* diffuser and the lime pinstripe on its edge */}
        <path d="M 40 404 C 200 394 460 394 620 404 L 630 430 L 30 430 Z" fill={SC_GREEN_DARK} stroke={INK} strokeWidth={4} />
        <path d="M 40 402 C 200 392 460 392 620 402" fill="none" stroke={SC_LIME} strokeWidth={5} />
        {/* the fixed rear wing: two stalks, the plane, lime endplates */}
        <path d="M 196 312 L 210 262 M 464 312 L 450 262" stroke={INK} strokeWidth={12} strokeLinecap="round" />
        <path d="M 30 252 C 200 244 460 244 630 252 L 628 268 C 460 262 200 262 32 268 Z" fill={SC_GREEN_DARK} stroke={INK} strokeWidth={5} />
        <path d="M 24 228 L 46 228 L 46 288 L 24 288 Z M 614 228 L 636 228 L 636 288 L 614 288 Z" fill={SC_LIME} stroke={INK} strokeWidth={4} />

        {/* the light bar: two legs from the roof, a dark housing with a silver top edge, the five lamps, an antenna */}
        <path d={`M 266 178 L 282 ${BAR.y1} M 394 178 L 378 ${BAR.y1}`} stroke={INK} strokeWidth={18} strokeLinecap="round" />
        <path d={`M 266 178 L 282 ${BAR.y1} M 394 178 L 378 ${BAR.y1}`} stroke="#5c5f63" strokeWidth={7} strokeLinecap="round" />
        <path d={`M 470 ${BAR.y0} L 486 ${BAR.y0 - 50}`} stroke={PAPER} strokeWidth={3} strokeLinecap="round" opacity={0.8} />
        <rect
          x={BAR.x0}
          y={BAR.y0}
          width={BAR.x1 - BAR.x0}
          height={BAR.y1 - BAR.y0}
          rx={30}
          fill={INK}
          stroke={PAPER}
          strokeWidth={3}
        />
        <path d={`M ${BAR.x0 + 26} ${BAR.y0 + 7} L ${BAR.x1 - 26} ${BAR.y0 + 7}`} stroke="#9aa0a6" strokeWidth={5} strokeLinecap="round" />
        {Array.from({ length: SC_LAMPS }, (_, i) => (
          <Lamp
            key={i}
            x={lampX(i)}
            y={LAMP_Y + 2}
            r={LAMP_R}
            draw={1}
            tone={1}
            on={on[i] ?? 0}
            age={age[i] ?? 99}
            paint={paint}
          />
        ))}
      </g>
    </g>
  );
};
