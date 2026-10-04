// Asset sheet: traced cars drawn large on paper, for review against the reference photos and the settled sheet
// (ART-7, docs/shape/references/cars-2021-sheet.png). One sheet per car year (SHEETS), registered as Cars-<year>-Sheet.
import { AbsoluteFill } from "remotion";
import { CARS, MangaCar, type CarId } from "../cars";
import { PAPER } from "../kit/colors";

// Each row: a car with its rear end at screen x and its ground line at screen y.
export type CarSheetProps = {
  rows: { car: CarId; x: number; ground: number }[];
  pxPerMetre: number;
  // Optional top views (track-map cars): rear end at (x, y), nose to the right.
  tops?: { car: CarId; x: number; y: number }[];
  topPxPerMetre?: number;
};

export const CarSheet: React.FC<CarSheetProps> = ({
  rows,
  pxPerMetre,
  tops = [],
  topPxPerMetre = 60,
}) => (
  <AbsoluteFill style={{ backgroundColor: PAPER }}>
    <svg width={1920} height={1080}>
      {rows.map((r) => (
        <MangaCar
          key={r.car}
          car={CARS[r.car]}
          at={{ x: r.x, y: r.ground, pxPerMetre }}
        />
      ))}
      {tops.map((t) => (
        <MangaCar
          key={`top-${t.car}`}
          car={CARS[t.car]}
          view="top"
          at={{ x: t.x, y: t.y, pxPerMetre: topPxPerMetre }}
        />
      ))}
    </svg>
  </AbsoluteFill>
);

export const SHEETS = {
  // RB16B above W12, 275 px per metre (the settled sheet).
  2021: {
    rows: [
      { car: "RB16B", x: 180, ground: 490 },
      { car: "W12", x: 180, ground: 1010 },
    ],
    pxPerMetre: 275,
  },
  // Bahrain: VF-20 above AT01, at the 2021 sheet's 275 px per metre.
  2020: {
    rows: [
      { car: "VF20", x: 180, ground: 490 },
      { car: "AT01", x: 180, ground: 1010 },
    ],
    pxPerMetre: 275,
  },
  // Brazil: MP4-23 and TF108 on the left, STR3 and F2008 on the right, 190 px per metre.
  2008: {
    rows: [
      { car: "MP4-23", x: 60, ground: 470 },
      { car: "TF108", x: 60, ground: 1010 },
      { car: "STR3", x: 1000, ground: 470 },
      { car: "F2008", x: 1000, ground: 1010 },
    ],
    pxPerMetre: 190,
  },
  // Suzuka: PRO above SEN (one MP4/5 spec, two drivers), 340 px per metre, each with its top view.
  1989: {
    rows: [
      { car: "MP45-PRO", x: 120, ground: 470 },
      { car: "MP45-SEN", x: 120, ground: 980 },
    ],
    pxPerMetre: 340,
    tops: [
      { car: "MP45-PRO", x: 1590, y: 160 },
      { car: "MP45-SEN", x: 1590, y: 670 },
    ],
    topPxPerMetre: 62,
  },
  // Suzuka 1990: PRO's Ferrari 641 above SEN's MP4/5B, at the 1989 sheet's 340 px per metre, each with its top view.
  1990: {
    rows: [
      { car: "F641-PRO", x: 120, ground: 470 },
      { car: "MP45B-SEN", x: 120, ground: 980 },
    ],
    pxPerMetre: 340,
    tops: [
      { car: "F641-PRO", x: 1590, y: 160 },
      { car: "MP45B-SEN", x: 1590, y: 670 },
    ],
    topPxPerMetre: 62,
  },
} satisfies Record<number, CarSheetProps>;
