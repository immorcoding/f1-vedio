// The safety car's roof light bar in close-up, for an inset (treatment 4.3: "安全车灯熄灭"). The 2021 Abu Dhabi safety
// car was the Aston Martin Vantage (facts.md); bar and roofline drawn from MrWalkr's 2021 photo of that car
// (references/yas-marina/sc-vantage-2021.jpg, CC BY-SA 4.0): a slim bar on a two-legged frame above the roof, lamp
// clusters at both ends, a camera pod in the middle. The car body is its real livery green (cars keep their real
// colours, ART-8); the lamps are their real amber when lit (an ART-8 exception the user approved 2026-10-03), with a
// white-hot core and an amber burst; off they are dark glass.
import { INK, PAPER } from "../../kit/colors";
import { tone } from "../../kit/tone";

const SC_GREEN = "#0b5a50"; // Aston Martin racing green of the 2021 safety car (photo)
const SC_LIME = "#c7e11e"; // its lime pinstripe
const AMBER = "#ffa000"; // the roof lamps' amber
const AMBER_HOT = "#fff3c4";

/** `left` / `right`: 0..1 lamp brightness of each end cluster. Drawn in a 560 × 330 box at (x, y). */
export const SafetyCarLights: React.FC<{
  x: number;
  y: number;
  left: number;
  right: number;
}> = ({ x, y, left, right }) => {
  const lamp = (cx: number, on: number, dir: 1 | -1) => (
    <g>
      {Array.from({ length: 5 }, (_, i) => (
        <rect
          key={i}
          x={cx + dir * i * 26 - (dir < 0 ? 22 : 0)}
          y={y + 112}
          width={22}
          height={30}
          rx={4}
          fill={on > 0.5 ? (i % 2 ? AMBER : AMBER_HOT) : INK}
          stroke={on > 0.5 ? INK : "#4a4a4a"}
          strokeWidth={2}
        />
      ))}
      {on > 0.05 ? (
        <path
          d={Array.from({ length: 14 }, (_, i) => {
            const a = (i / 14) * Math.PI * 2;
            const ox = cx + dir * 55;
            const oy = y + 127;
            return `M ${ox + Math.cos(a) * 80} ${oy + Math.sin(a) * 34} L ${ox + Math.cos(a) * (110 + 60 * on)} ${oy + Math.sin(a) * (48 + 30 * on)}`;
          }).join(" ")}
          stroke={AMBER}
          strokeWidth={6}
          strokeLinecap="round"
          opacity={on}
        />
      ) : null}
    </g>
  );
  return (
    <g>
      <rect x={x} y={y} width={560} height={330} fill={INK} />
      {/* night sky with a dot screen */}
      <rect x={x} y={y} width={560} height={210} fill={tone("dark")} opacity={0.35} />
      {/* roof and windscreen top, in livery green, with the lime pinstripe at the roof edge */}
      <path
        d={`M ${x - 20} ${y + 330} L ${x - 20} ${y + 250} C ${x + 120} ${y + 205} ${x + 440} ${y + 205} ${x + 580} ${y + 250} L ${x + 580} ${y + 330} Z`}
        fill={SC_GREEN}
        stroke={INK}
        strokeWidth={5}
      />
      <path
        d={`M ${x - 20} ${y + 300} C ${x + 120} ${y + 262} ${x + 440} ${y + 262} ${x + 580} ${y + 300} L ${x + 580} ${y + 330} L ${x - 20} ${y + 330} Z`}
        fill={INK}
        opacity={0.75}
      />
      <path
        d={`M ${x + 40} ${y + 236} C ${x + 160} ${y + 214} ${x + 400} ${y + 214} ${x + 520} ${y + 236}`}
        fill="none"
        stroke={SC_LIME}
        strokeWidth={4}
      />
      <path
        d={`M ${x + 80} ${y + 230} C ${x + 200} ${y + 212} ${x + 360} ${y + 212} ${x + 480} ${y + 230}`}
        fill="none"
        stroke={PAPER}
        strokeWidth={4}
        opacity={0.8}
      />
      {/* frame legs */}
      <path
        d={`M ${x + 150} ${y + 222} L ${x + 175} ${y + 150} M ${x + 410} ${y + 222} L ${x + 385} ${y + 150}`}
        stroke={INK}
        strokeWidth={16}
        strokeLinecap="round"
      />
      <path
        d={`M ${x + 150} ${y + 222} L ${x + 175} ${y + 150} M ${x + 410} ${y + 222} L ${x + 385} ${y + 150}`}
        stroke="#5c5f63"
        strokeWidth={7}
        strokeLinecap="round"
      />
      {/* the bar: dark housing, silver top edge, camera pod */}
      <rect x={x + 60} y={y + 104} width={440} height={48} rx={22} fill={INK} stroke={PAPER} strokeWidth={3} />
      <path d={`M ${x + 82} ${y + 110} L ${x + 478} ${y + 110}`} stroke="#9aa0a6" strokeWidth={5} strokeLinecap="round" />
      <rect x={x + 258} y={y + 78} width={44} height={30} rx={8} fill="#2b2d30" stroke={PAPER} strokeWidth={2.5} />
      <circle cx={x + 280} cy={y + 93} r={7} fill={PAPER} />
      {lamp(x + 72, left, 1)}
      {lamp(x + 488, right, -1)}
    </g>
  );
};
