// Dry powder billowing off where an extinguisher's jet lands (shots 3.5 and 3.6): white ink-edged streaks curling up and
// away, redrawn on threes — strokes, never round puffs (user review: no bubble-shaped clouds).
import { INK, PAPER } from "../../../kit/colors";
import { strokeRibbon } from "../../../kit/fire";

export const PowderBillow: React.FC<{
  // where the jet lands, on screen, and px per metre there
  x: number;
  y: number;
  ppm: number;
  frame: number;
}> = ({ x, y, ppm, frame }) => {
  const flick = Math.floor(frame / 3);
  return (
    <g>
      {Array.from({ length: 7 }, (_, i) => {
        const life = ((flick * 0.5 + i * 2.3) % 7) / 7;
        const pts = Array.from({ length: 9 }, (_, k) => {
          const q = k / 8;
          return {
            x:
              x +
              (Math.sin(i * 1.9) * 0.3 - 0.25 * q) * ppm +
              Math.sin(q * 5 + i + flick * 0.4) * 0.12 * ppm,
            y: y - (0.05 + life * 0.4 + q * (0.5 + life * 0.5)) * ppm,
          };
        });
        return (
          <path
            key={i}
            d={strokeRibbon(pts, (0.14 + 0.18 * life) * ppm, 0.4)}
            fill={PAPER}
            stroke={INK}
            strokeWidth={2.5}
            strokeLinejoin="round"
            opacity={0.95 * (1 - life)}
          />
        );
      })}
    </g>
  );
};
