// Car looks check (ART-26): the side-view cars in their two looks at one scale, on one ground line, with vertical guides
// through the near wheel centres. Top: the 2020–22 cars (RB16B first, the reference), each as HIGH before the far
// wheels were lined up and lowered (user review 2026-10-04), HIGH now and LOW, with the front corner of HIGH and LOW
// blown up 3×: in LOW the near front endplate hides the nose tip. Bottom: every other car with far wheels, before and
// after lining them up with the near wheels. Registered as Check-Car-Looks (2400 × 2860).
import { AbsoluteFill } from "remotion";
import { CARS, MangaCar, type CarId, type CarSpec } from "../cars";
import { carLength, carPoint, type FarSideCamera } from "../cars/spec";
import { CAPTION_FONT } from "../kit/lettering";
import { INK, PAPER } from "../kit/colors";

export const CAR_LOOKS_SIZE = { width: 2400, height: 2860 };

const PPM = 80;
const ZOOM = 3;
const CORNER = { w: 1.35, h: 0.8 }; // m of the front corner in a blow-up: from the front end back, from the ground up
const MODERN: CarId[] = ["RB16B", "W12", "AT01", "VF20", "RB18"];
const OTHERS: CarId[] = ["MP4-23", "F2008", "STR3", "TF108", "MP45-PRO", "F641-PRO", "MP45B-SEN"];

// The car as drawn before this check's change: far wheels at their traced x, and the 2021–22 cars' HIGH far wheels at
// the full traced lift.
const before = (car: CarSpec): CarSpec => {
  const high = car.farSide?.high;
  const full = /^202[12]/.test(car.name) && high ? { ...high, wheels: car.farWheels } : high;
  return { ...car, keepFarWheelX: true, farSide: car.farSide && { ...car.farSide, high: full } };
};

const Guides: React.FC<{ car: CarSpec; x: number; ground: number; ppm: number; h: number }> = ({ car, x, ground, ppm, h }) => (
  <g>
    <line x1={x - 20} x2={x + carLength(car) * ppm + 20} y1={ground} y2={ground} stroke="#2a62d0" strokeWidth={2} />
    {(["frontAxle", "rearAxle"] as const).map((k) => {
      const gx = x + carPoint(car, k).x * ppm;
      return <line key={k} x1={gx} x2={gx} y1={ground + 8} y2={ground - h} stroke="#d02a2a" strokeWidth={1.5} strokeDasharray="6 4" />;
    })}
  </g>
);

const Car: React.FC<{ car: CarSpec; farSide: FarSideCamera; x: number; ground: number; label: string }> = ({
  car,
  farSide,
  x,
  ground,
  label,
}) => (
  <g>
    <MangaCar car={car} at={{ x, y: ground, pxPerMetre: PPM }} state={{ farSide }} />
    <Guides car={car} x={x} ground={ground} ppm={PPM} h={1.6 * PPM} />
    <text x={x} y={ground + 30} fontFamily={CAPTION_FONT} fontWeight={700} fontSize={22} fill={INK}>
      {label}
    </text>
  </g>
);

// The front corner of a car blown up ZOOM×, drawn at the car's own scale inside a viewBox.
const Corner: React.FC<{ car: CarSpec; farSide: FarSideCamera; x: number; y: number; label: string }> = ({
  car,
  farSide,
  x,
  y,
  label,
}) => {
  const ppm = PPM * ZOOM;
  const w = CORNER.w * ppm;
  const h = CORNER.h * ppm;
  const front = carLength(car);
  const front2 = carPoint(car, "frontAxle").x;
  return (
    <g>
      <svg x={x} y={y} width={w} height={h} viewBox={`${(front - CORNER.w + 0.15) * PPM} ${-CORNER.h * PPM + 4} ${CORNER.w * PPM} ${CORNER.h * PPM}`} overflow="hidden">
        <rect x={-100} y={-100} width={1000} height={1000} fill={PAPER} />
        <MangaCar car={car} at={{ x: 0, y: 0, pxPerMetre: PPM }} state={{ farSide }} />
        <line x1={-100} x2={1000} y1={0} y2={0} stroke="#2a62d0" strokeWidth={0.7} />
        <line x1={front2 * PPM} x2={front2 * PPM} y1={-200} y2={10} stroke="#d02a2a" strokeWidth={0.6} strokeDasharray="2 1.5" />
      </svg>
      <rect x={x} y={y} width={w} height={h} fill="none" stroke={INK} strokeWidth={3} />
      <text x={x} y={y + h + 26} fontFamily={CAPTION_FONT} fontWeight={700} fontSize={22} fill={INK}>
        {label}
      </text>
    </g>
  );
};

export const CarLooksCheck: React.FC = () => {
  const rowH = 300;
  const top = 70;
  const colW = 520;
  return (
    <AbsoluteFill style={{ backgroundColor: PAPER }}>
      <svg width={CAR_LOOKS_SIZE.width} height={CAR_LOOKS_SIZE.height}>
        <text x={20} y={44} fontFamily={CAPTION_FONT} fontWeight={700} fontSize={32} fill={INK}>
          Car looks (ART-26) · one scale, {PPM} px/m · blue: ground · red dashed: near wheel centres · corners {ZOOM}×
        </text>
        {MODERN.map((id, i) => {
          const car = CARS[id];
          const y0 = top + i * rowH;
          const ground = y0 + rowH - 60;
          const cx = 30 + 3 * colW;
          return (
            <g key={id}>
              <line x1={0} x2={CAR_LOOKS_SIZE.width} y1={y0} y2={y0} stroke={INK} strokeWidth={2} />
              <Car car={before(car)} farSide="high" x={30} ground={ground} label={`${id} · HIGH before`} />
              <Car car={car} farSide="high" x={30 + colW} ground={ground} label={`${id} · HIGH now`} />
              <Car car={car} farSide="low" x={30 + 2 * colW} ground={ground} label={`${id} · LOW now`} />
              <Corner car={car} farSide="high" x={cx} y={y0 + 12} label="HIGH now · front corner 3×" />
              <Corner car={car} farSide="low" x={cx + CORNER.w * PPM * ZOOM + 20} y={y0 + 12} label="LOW now · front corner 3×" />
            </g>
          );
        })}
        {OTHERS.map((id, i) => {
          const car = CARS[id];
          const col = i % 2;
          const y0 = top + (MODERN.length + Math.floor(i / 2)) * rowH;
          const ground = y0 + rowH - 60;
          const x = 30 + col * 2 * colW + (col ? 140 : 0);
          return (
            <g key={id}>
              {col === 0 ? <line x1={0} x2={CAR_LOOKS_SIZE.width} y1={y0} y2={y0} stroke={INK} strokeWidth={2} /> : null}
              <Car car={before(car)} farSide="high" x={x} ground={ground} label={`${id} · before`} />
              <Car car={car} farSide="high" x={x + colW} ground={ground} label={`${id} · now (far wheels at the near wheels' x)`} />
            </g>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};
