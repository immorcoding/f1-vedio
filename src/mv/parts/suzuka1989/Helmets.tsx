// The helmet cards of the Suzuka story (1989 and 1990 share them, so the two parts read as one): a manga panel of one
// driver's helmet in the cockpit — the car drawn huge so the helmet fills the panel and the livery around it says
// which team — with a caption box or a red result stamp straddling its bottom edge. 1.2 shows the stakes, 1.4 the
// 1989 result, 1.5 PRO's move to Ferrari, 1.8 the 1990 result; PRO always on the left, SEN on the right.
import { MangaCar, type CarSpec } from "../../../cars";
import { INK, PAPER } from "../../../kit/colors";
import { BRUSH_FONT, CAPTION_FONT } from "../../../kit/lettering";
import { focusLines } from "../../../kit/lines";

export type Box = { x: number; y: number; w: number; h: number };

// The two card slots of 1.2 and 1.4 (1.8 uses the same layout, larger).
export const CARD_PRO: Box = { x: 90, y: 50, w: 600, h: 320 };
export const CARD_SEN: Box = { x: 1230, y: 50, w: 600, h: 320 };

// The result stamps' red: a seal on the page, not part of the environment (ART-8 covers the drawn world only).
export const STAMP_RED = "#d3221c";

// Helmet centre of a car in metres from its origin (rear end on the ground): x forward, y up.
const helmetM = (car: CarSpec) => {
  const ppm = 250 / car.frame.k;
  return {
    x: (car.frame.x - car.helmetAt.cx) / ppm,
    y: (car.frame.ground - car.helmetAt.cy) / ppm,
  };
};

// One card. `ppm` scales with the card's height (760 px/m on the 320 px card of 1.2), `wheel` turns the front wheel
// so the card is alive while the cars drive, `shadow` drops the ink shadow of a panel lying on the page.
export const HelmetCard: React.FC<{
  car: CarSpec;
  box: Box;
  id: string;
  seed: number;
  facing?: "left" | "right";
  wheel?: number;
  shadow?: boolean;
}> = ({ car, box, id, seed, facing = "right", wheel = 0, shadow = false }) => {
  const ppm = 760 * (box.h / 320);
  const h = helmetM(car);
  const dir = facing === "right" ? 1 : -1;
  const cx = box.x + box.w * (0.5 + 0.02 * dir);
  const cy = box.y + box.h * 0.5;
  const k = box.h / 320;
  return (
    <g>
      {shadow ? (
        <rect
          x={box.x + 14 * k}
          y={box.y + 14 * k}
          width={box.w}
          height={box.h}
          fill={INK}
        />
      ) : null}
      <clipPath id={id}>
        <rect x={box.x} y={box.y} width={box.w} height={box.h} />
      </clipPath>
      <g clipPath={`url(#${id})`}>
        <rect x={box.x} y={box.y} width={box.w} height={box.h} fill={PAPER} />
        <path
          d={focusLines(cx, cy, 200 * k, 90, seed)}
          fill={INK}
          opacity={0.85}
        />
        <MangaCar
          car={car}
          facing={facing}
          at={{ x: cx - dir * h.x * ppm, y: cy + h.y * ppm, pxPerMetre: ppm }}
          state={{ wheelAngle: wheel }}
        />
      </g>
      <rect
        x={box.x}
        y={box.y}
        width={box.w}
        height={box.h}
        fill="none"
        stroke={INK}
        strokeWidth={9 * k}
      />
    </g>
  );
};

// How much the scene behind a result (1.4, 1.8) is dimmed with light tone.
export const RESULT_DIM = 0.5;

// A helmet card with its result stamp, moved by (dx, dy) and tilted while it flies in, jolted when the stamp lands.
export const StampedCard: React.FC<{
  car: CarSpec;
  box: Box;
  id: string;
  seed: number;
  stamp: string;
  stampT: number;
  facing?: "left" | "right";
  dx?: number;
  dy?: number;
  tilt?: number;
  jolt?: number;
  stampSize?: number;
}> = ({
  car,
  box,
  id,
  seed,
  stamp,
  stampT,
  facing,
  dx = 0,
  dy = 0,
  tilt = 0,
  jolt = 0,
  stampSize,
}) => {
  const cx = box.x + box.w / 2;
  const cy = box.y + box.h / 2;
  return (
    <g
      transform={`translate(${dx + jolt * 0.4} ${dy + jolt}) rotate(${tilt} ${cx} ${cy})`}
    >
      <HelmetCard
        car={car}
        box={box}
        id={id}
        seed={seed}
        facing={facing}
        shadow
      />
      <Stamp box={box} text={stamp} t={stampT} size={stampSize} />
    </g>
  );
};

// The caption box straddling the card's bottom edge (1.2's stakes, 1.5's move).
export const CardCaption: React.FC<{ box: Box; text: string }> = ({
  box,
  text,
}) => (
  <g>
    <rect
      x={box.x + 20}
      y={box.y + box.h - 6}
      width={box.w - 40}
      height={74}
      fill={PAPER}
      stroke={INK}
      strokeWidth={6}
    />
    <text
      x={box.x + box.w / 2}
      y={box.y + box.h + 50}
      textAnchor="middle"
      fontFamily={CAPTION_FONT}
      fontSize={46}
      fill={INK}
    >
      {text}
    </text>
  </g>
);

// A red seal slammed onto the card's bottom edge, clear of the helmet (ART-14): a double-ruled frame round brush
// characters, tilted. `t` 0–1 is the slam: it drops from twice the size and lands with a small overshoot.
export const Stamp: React.FC<{
  box: Box;
  text: string;
  t: number;
  size?: number;
  rotate?: number;
}> = ({ box, text, t, size = 72, rotate = -8 }) => {
  if (t <= 0) return null;
  const w = size * (text.length * 0.78 + 0.9);
  const h = size * 1.42;
  const x = box.x + box.w / 2;
  const y = box.y + box.h + size * 0.08;
  const s = 1 + 1.2 * Math.pow(1 - Math.min(1, t), 3);
  const o = Math.min(1, t * 3);
  return (
    <g
      opacity={o * 0.95}
      transform={`translate(${x} ${y}) rotate(${rotate}) scale(${s})`}
    >
      <rect
        x={-w / 2}
        y={-h / 2}
        width={w}
        height={h}
        rx={size * 0.12}
        fill={PAPER}
        stroke={STAMP_RED}
        strokeWidth={size * 0.11}
      />
      <rect
        x={-w / 2 + size * 0.16}
        y={-h / 2 + size * 0.16}
        width={w - size * 0.32}
        height={h - size * 0.32}
        rx={size * 0.06}
        fill="none"
        stroke={STAMP_RED}
        strokeWidth={size * 0.04}
      />
      <text
        x={0}
        y={size * 0.34}
        textAnchor="middle"
        fontFamily={BRUSH_FONT}
        fontSize={size}
        fill={STAMP_RED}
      >
        {text}
      </text>
    </g>
  );
};
