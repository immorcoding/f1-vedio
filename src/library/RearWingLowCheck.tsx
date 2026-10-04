// Rear wing check (ART-17, ART-26): the four 2020–21 cars, LOW whole and the rear corner of LOW and HIGH blown up 3×.
// In LOW the near rear endplate hides the far endplate, the wing planes and the beam wing between the endplates, as
// the near front endplate hides the front wing; only a sliver of the wing's top line shows above it. Registered as
// Check-Rear-Wing-Low (1320 × 1760).
import { AbsoluteFill } from "remotion";
import { CARS, MangaCar, type CarId } from "../cars";
import type { CarSpec, FarSideCamera } from "../cars/spec";
import { CAPTION_FONT } from "../kit/lettering";
import { INK, PAPER } from "../kit/colors";

export const REAR_WING_LOW_SIZE = { width: 1320, height: 1760 };

const PPM = 80;
const ZOOM = 3;
const CORNER = { w: 1.5, h: 1.6 }; // m of the rear corner: from the rear end forward, from the ground up
const MODERN: CarId[] = ["RB16B", "W12", "AT01", "VF20"];

const Corner: React.FC<{
  car: CarSpec;
  farSide: FarSideCamera;
  x: number;
  y: number;
  label: string;
}> = ({ car, farSide, x, y, label }) => {
  const w = CORNER.w * PPM * ZOOM;
  const h = CORNER.h * PPM * ZOOM;
  return (
    <g>
      <svg
        x={x}
        y={y}
        width={w}
        height={h}
        viewBox={`${-0.1 * PPM} ${-CORNER.h * PPM + 4} ${CORNER.w * PPM} ${CORNER.h * PPM}`}
        overflow="hidden"
      >
        <rect x={-100} y={-200} width={1000} height={1000} fill={PAPER} />
        <MangaCar
          car={car}
          at={{ x: 0, y: 0, pxPerMetre: PPM }}
          state={{ farSide }}
        />
        <line
          x1={-100}
          x2={1000}
          y1={0}
          y2={0}
          stroke="#2a62d0"
          strokeWidth={0.7}
        />
      </svg>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        fill="none"
        stroke={INK}
        strokeWidth={3}
      />
      <text
        x={x}
        y={y + h + 26}
        fontFamily={CAPTION_FONT}
        fontWeight={700}
        fontSize={22}
        fill={INK}
      >
        {label}
      </text>
    </g>
  );
};

export const RearWingLowCheck: React.FC = () => {
  const rowH = 440;
  const top = 0;
  return (
    <AbsoluteFill style={{ backgroundColor: PAPER }}>
      <svg width={REAR_WING_LOW_SIZE.width} height={REAR_WING_LOW_SIZE.height}>
        {MODERN.map((id, i) => {
          const car = CARS[id];
          const y0 = top + i * rowH + 8;
          const ground = y0 + 300;
          return (
            <g key={id}>
              <line
                x1={0}
                x2={REAR_WING_LOW_SIZE.width}
                y1={y0 - 8}
                y2={y0 - 8}
                stroke={INK}
                strokeWidth={2}
              />
              <MangaCar
                car={car}
                at={{ x: 30, y: ground, pxPerMetre: PPM }}
                state={{ farSide: "low" }}
              />
              <line
                x1={10}
                x2={500}
                y1={ground}
                y2={ground}
                stroke="#2a62d0"
                strokeWidth={2}
              />
              <text
                x={30}
                y={ground + 34}
                fontFamily={CAPTION_FONT}
                fontWeight={700}
                fontSize={22}
                fill={INK}
              >
                {`${id} · LOW`}
              </text>
              <Corner
                car={car}
                farSide="low"
                x={540}
                y={y0}
                label="LOW · rear corner 3×"
              />
              <Corner
                car={car}
                farSide="high"
                x={540 + CORNER.w * PPM * ZOOM + 30}
                y={y0}
                label="HIGH · rear corner 3×"
              />
            </g>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};
