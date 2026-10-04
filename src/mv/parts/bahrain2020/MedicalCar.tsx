// The FIA F1 medical car of 2020 (Mercedes-AMG C 63 S Estate), side view, for the "11 秒" panel of shot 3.5. Drawn
// from the side photo in docs/assets/reference-register.md (same body as the 2020 car) at real size — 4.75 m long,
// 1.45 m high, 2.84 m wheelbase, 0.68 m wheels — as environment: paper and screentone, black glass, the roof light
// bar in paper (ART-8 keeps everything but the race cars and the fire black and white). Facing left; `at` is the
// ground point under the rear bumper.
import type { ScreenAnchor } from "../../../kit/camera";
import { INK, PAPER } from "../../../kit/colors";
import { tone } from "../../../kit/tone";

const LEN = 4.75;
const WHEEL_R = 0.34;
const REAR_AXLE = 0.95;
const FRONT_AXLE = REAR_AXLE + 2.84;
export const MEDICAL_CAR_LENGTH = LEN;

// Profile, metres from the rear (x, toward the front) and up from the ground (y).
const BODY: [number, number][] = [
  [0.06, 0.3],
  [0.0, 0.52],
  [0.03, 0.86],
  [0.1, 1.04],
  [0.3, 1.36],
  [0.6, 1.43],
  [2.45, 1.45],
  [2.85, 1.41],
  [3.62, 0.99],
  [4.25, 0.86],
  [4.62, 0.76],
  [4.75, 0.58],
  [4.72, 0.32],
  [4.6, 0.22],
];
const GLASS: [number, number][] = [
  [0.3, 1.04],
  [0.42, 1.31],
  [0.66, 1.37],
  [2.42, 1.38],
  [2.78, 1.34],
  [3.48, 1.0],
];

export const MedicalCar: React.FC<{
  at: ScreenAnchor;
  // wheel rotation, degrees; body pitch, degrees (negative = nose down under braking)
  wheelAngle?: number;
  pitch?: number;
  tonePrefix: string;
}> = ({ at, wheelAngle = 0, pitch = 0, tonePrefix }) => {
  const s = at.pxPerMetre;
  // facing left: x from the rear runs to the left on screen
  const P = ([x, y]: [number, number]) =>
    `${(at.x - x * s).toFixed(1)} ${(at.y - y * s).toFixed(1)}`;
  const poly = (pts: [number, number][]) => `M ${pts.map(P).join(" L ")} Z`;
  // the sill between the wheel arches, cut round them
  const arch = (cx: number) => {
    const r = WHEEL_R + 0.05;
    return `L ${P([cx + r, 0.22])} A ${r * s} ${r * s} 0 0 1 ${P([cx - r, 0.22])}`;
  };
  const body =
    `M ${BODY.map(P).join(" L ")} ` +
    `L ${P([FRONT_AXLE + WHEEL_R + 0.18, 0.22])} ${arch(FRONT_AXLE)} ` +
    `L ${P([REAR_AXLE + WHEEL_R + 0.05, 0.22])} ${arch(REAR_AXLE)} Z`;
  const pivot = { x: at.x - (LEN / 2) * s, y: at.y - 0.4 * s };
  const ink = Math.max(1.5, s * 0.012);
  const line = (a: [number, number], b: [number, number], w = ink * 0.7) => (
    <path d={`M ${P(a)} L ${P(b)}`} stroke={INK} strokeWidth={w} fill="none" />
  );
  const wheel = (cx: number) => {
    const c = { x: at.x - cx * s, y: at.y - WHEEL_R * s };
    return (
      <g key={cx}>
        <circle cx={c.x} cy={c.y} r={WHEEL_R * s} fill={INK} />
        <circle
          cx={c.x}
          cy={c.y}
          r={WHEEL_R * s * 0.66}
          fill={tone("light", tonePrefix)}
          stroke={PAPER}
          strokeWidth={ink * 0.8}
        />
        {/* five twin spokes, turning */}
        {[0, 1, 2, 3, 4].map((k) => {
          const a = ((wheelAngle * -1 + k * 72) * Math.PI) / 180;
          const r0 = WHEEL_R * s * 0.15;
          const r1 = WHEEL_R * s * 0.62;
          return (
            <path
              key={k}
              d={`M ${c.x + Math.cos(a) * r0} ${c.y + Math.sin(a) * r0} L ${c.x + Math.cos(a) * r1} ${c.y + Math.sin(a) * r1}`}
              stroke={INK}
              strokeWidth={WHEEL_R * s * 0.11}
              strokeLinecap="round"
            />
          );
        })}
        <circle cx={c.x} cy={c.y} r={WHEEL_R * s * 0.12} fill={INK} />
      </g>
    );
  };
  return (
    <g>
      {/* shadow on the asphalt */}
      <ellipse
        cx={at.x - (LEN / 2) * s}
        cy={at.y}
        rx={(LEN / 2) * s * 1.02}
        ry={0.09 * s}
        fill={INK}
        opacity={0.8}
      />
      <g transform={`rotate(${-pitch} ${pivot.x} ${pivot.y})`}>
        <path
          d={body}
          fill={PAPER}
          stroke={INK}
          strokeWidth={ink * 1.6}
          strokeLinejoin="round"
        />
        {/* lower body in a light tone: the colour block of the silver paint's shadow side */}
        <path
          d={poly([
            [0.02, 0.62],
            [4.74, 0.62],
            [4.72, 0.32],
            [0.06, 0.3],
          ])}
          fill={tone("light", tonePrefix)}
          opacity={0.9}
        />
        {/* glass, with the B and C pillars */}
        <path d={poly(GLASS)} fill={INK} />
        <path
          d={`M ${P([0.7, 1.33])} L ${P([2.3, 1.34])}`}
          stroke="#5a5a5a"
          strokeWidth={ink * 1.2}
          strokeLinecap="round"
        />
        {line([1.32, 1.04], [1.32, 1.37], ink * 3)}
        {line([2.38, 1.02], [2.38, 1.38], ink * 2.2)}
        {/* doors, beltline, handles, mirror */}
        {line([1.3, 1.02], [1.3, 0.3])}
        {line([2.36, 1.0], [2.4, 0.26])}
        {line([3.45, 1.0], [3.52, 0.3])}
        {line([0.05, 0.98], [3.6, 0.98])}
        {line([1.85, 0.86], [2.05, 0.86], ink * 1.4)}
        {line([2.95, 0.86], [3.15, 0.86], ink * 1.4)}
        <path
          d={poly([
            [3.3, 1.0],
            [3.48, 1.08],
            [3.56, 1.02],
            [3.5, 0.96],
          ])}
          fill={INK}
        />
        {/* head- and tail-lights */}
        <path
          d={poly([
            [4.3, 0.84],
            [4.6, 0.76],
            [4.58, 0.7],
            [4.3, 0.74],
          ])}
          fill={PAPER}
          stroke={INK}
          strokeWidth={ink}
        />
        <path
          d={poly([
            [0.02, 0.9],
            [0.22, 0.92],
            [0.22, 0.8],
            [0.02, 0.78],
          ])}
          fill={INK}
        />
        {/* the roof light bar on its brackets */}
        <path
          d={poly([
            [1.95, 1.45],
            [1.98, 1.53],
            [2.7, 1.53],
            [2.74, 1.45],
          ])}
          fill={PAPER}
          stroke={INK}
          strokeWidth={ink}
        />
        {[2.07, 2.25, 2.43, 2.61].map((x) => (
          <path
            key={x}
            d={poly([
              [x, 1.47],
              [x, 1.51],
              [x + 0.12, 1.51],
              [x + 0.12, 1.47],
            ])}
            fill={tone("mid", tonePrefix)}
          />
        ))}
      </g>
      {wheel(REAR_AXLE)}
      {wheel(FRONT_AXLE)}
    </g>
  );
};
