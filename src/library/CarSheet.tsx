// Asset sheet: traced cars drawn large on paper, for review against the reference photos and the settled sheet
// (ART-7, docs/shape/references/cars-2021-sheet.png).
import { AbsoluteFill } from "remotion";
import { CARS, MangaCar, type CarId } from "../cars";
import { PAPER } from "../kit/colors";

// Each row: a car with its rear end at screen x and its ground line at screen y.
export type CarSheetProps = {
  rows: { car: CarId; x: number; ground: number }[];
  pxPerMetre: number;
};

export const CarSheet: React.FC<CarSheetProps> = ({ rows, pxPerMetre }) => (
  <AbsoluteFill style={{ backgroundColor: PAPER }}>
    <svg width={1920} height={1080}>
      {rows.map((r) => (
        <MangaCar
          key={r.car}
          car={CARS[r.car]}
          at={{ x: r.x, y: r.ground, pxPerMetre }}
        />
      ))}
    </svg>
  </AbsoluteFill>
);

// The 2021 sheet: RB16B above W12, 275 px per metre.
export const SHEET_2021: CarSheetProps = {
  rows: [
    { car: "RB16B", x: 180, ground: 490 },
    { car: "W12", x: 180, ground: 1010 },
  ],
  pxPerMetre: 275,
};
