// The helmet cards of the Suzuka story (1989 and 1990 share them, so the two parts read as one): a manga panel of one
// driver's helmet in the cockpit — the car drawn huge so the helmet fills the panel and the livery around it says
// which team — with a caption box or a red result stamp straddling its bottom edge. 1.2 shows the stakes, 1.4 the
// 1989 result, 1.5 PRO's move to Ferrari, 1.8 the 1990 result; PRO always on the left, SEN on the right.
import {
  HELMET_LENS,
  cameraAt,
  MangaCar,
  type CarSpec,
} from "../../../cars";
import { INK, PAPER } from "../../../kit/colors";
import {
  CAPTION_FONT,
  RubberStamp,
  STAMP_FONT,
  measure,
  useLettering,
} from "../../../kit/lettering";
import { focusLines } from "../../../kit/lines";

export type Box = { x: number; y: number; w: number; h: number };

// The two card slots of 1.2 and 1.4 (1.8 uses the same layout, larger).
export const CARD_PRO: Box = { x: 90, y: 50, w: 600, h: 320 };
export const CARD_SEN: Box = { x: 1230, y: 50, w: 600, h: 320 };

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
          state={{ ...cameraAt(car, HELMET_LENS.height, HELMET_LENS.distance), wheelAngle: wheel }}
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

// The caption box straddling the card's bottom edge (1.2's stakes, 1.5's move), centred on the card and hugging its
// text. A leading driver code ("PRO +16 PTS") sits in an inverted chip, as in type system D's stakes box (ART-6).
export const CardCaption: React.FC<{ box: Box; text: string }> = ({
  box,
  text,
}) => {
  useLettering();
  const size = 44;
  const m = /^([A-Z]{3}) (.+)$/.exec(text);
  const code = m ? m[1] : "";
  const rest = m ? m[2] : text;
  const padX = size * 0.4;
  const codeW = code
    ? measure(code, CAPTION_FONT, 700, size, 0.02) + padX * 1.4
    : 0;
  const restW = measure(rest, CAPTION_FONT, 700, size, 0.02) + padX * 2;
  const w = codeW + restW;
  const h = 74;
  const x = box.x + box.w / 2 - w / 2;
  const y = box.y + box.h - 6;
  const base = y + h / 2 + size * 0.345;
  return (
    <g>
      <rect x={x + 7} y={y + 7} width={w} height={h} fill={INK} />
      <rect x={x} y={y} width={w} height={h} fill={PAPER} />
      {code ? (
        <>
          <rect x={x} y={y} width={codeW} height={h} fill={INK} />
          <text
            x={x + codeW / 2}
            y={base}
            textAnchor="middle"
            fontFamily={CAPTION_FONT}
            fontWeight={700}
            fontSize={size}
            letterSpacing="0.02em"
            fill={PAPER}
          >
            {code}
          </text>
        </>
      ) : null}
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        fill="none"
        stroke={INK}
        strokeWidth={6}
      />
      <text
        x={x + codeW + padX}
        y={base}
        fontFamily={CAPTION_FONT}
        fontWeight={700}
        fontSize={size}
        letterSpacing="0.02em"
        fill={INK}
      >
        {rest}
      </text>
    </g>
  );
};

// A red rubber stamp slammed onto the card's bottom edge, clear of the helmet (ART-14), tilted. `t` 0–1 is the slam:
// it drops from twice the size and lands with a small overshoot.
export const Stamp: React.FC<{
  box: Box;
  text: string;
  t: number;
  size?: number;
  rotate?: number;
}> = ({ box, text, t, size = 72, rotate = -8 }) => {
  useLettering();
  if (t <= 0) return null;
  // English words run long: the letters shrink until the stamp is at most 92% of the card's width
  const s0 = size * 0.72;
  const tw = measure(text, STAMP_FONT, 700, s0, 0.05);
  const letters = Math.min(s0, (box.w * 0.92 * s0) / (tw + s0 * 0.9));
  const x = box.x + box.w / 2;
  const y = box.y + box.h + size * 0.08;
  const s = 1 + 1.2 * Math.pow(1 - Math.min(1, t), 3);
  const o = Math.min(1, t * 3);
  return (
    <g
      opacity={o * 0.95}
      transform={`translate(${x} ${y}) rotate(${rotate}) scale(${s})`}
    >
      <RubberStamp text={text} size={letters} />
    </g>
  );
};
