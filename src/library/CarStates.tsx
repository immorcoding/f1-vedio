// State check: one car under each MangaCar state parameter, animated so rolling and locked wheels can be told apart.
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { CARS, MangaCar, type CarId, type CarState } from "../cars";
import { INK, PAPER } from "../kit/colors";
import { CAPTION_FONT } from "../kit/lettering";

export const CAR_STATES_FRAMES = 120;

const CELLS: { label: string; state: (frame: number) => CarState }[] = [
  { label: "WHEELS TURNING", state: (f) => ({ wheelAngle: f * 9 }) },
  { label: "FRONT LOCKED", state: (f) => ({ wheelAngle: f * 9, lockFront: 0 }) },
  {
    label: "BRAKING DIVE −2°, FRONT LOCKED",
    state: (f) => ({ wheelAngle: f * 9, lockFront: 0, tilt: -2 }),
  },
  {
    label: "NOSE UP +4°, OLD HARDS",
    state: (f) => ({ wheelAngle: f * 9, tilt: 4, compound: "#f4f4f4" }),
  },
];

export const CarStates: React.FC<{ car: CarId }> = ({ car }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ backgroundColor: PAPER }}>
      <svg width={1920} height={1080}>
        {CELLS.map((cell, i) => {
          const x = (i % 2) * 960;
          const y = Math.floor(i / 2) * 540;
          return (
            <g key={cell.label}>
              <rect
                x={x + 10}
                y={y + 10}
                width={940}
                height={520}
                fill="none"
                stroke={INK}
                strokeWidth={4}
              />
              <text
                x={x + 40}
                y={y + 70}
                fontFamily={CAPTION_FONT}
                fontSize={40}
                fill={INK}
              >
                {cell.label}
              </text>
              <MangaCar
                car={CARS[car]}
                at={{ x: x + 70, y: y + 450, pxPerMetre: 145 }}
                state={cell.state(frame)}
              />
            </g>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};
