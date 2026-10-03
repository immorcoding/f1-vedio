// Review sheet for the top-view cars: each car's top view directly under its side view at the same scale, so the
// axles, cockpit, helmet and wings must line up vertically (the modern top view is built from the side trace, ART-10).
import { AbsoluteFill } from "remotion";
import {
  CARS,
  carPoint,
  MangaCar,
  PIRELLI_2021,
  type CarId,
  type Tread,
} from "../cars";
import { INK, PAPER } from "../kit/colors";

const PPM = 170;

export type TopCarSheetProps = {
  rows: { car: CarId; compound?: string; tread?: Tread; y: number }[];
};

export const TOP_SHEET_2021: TopCarSheetProps = {
  rows: [
    { car: "RB16B", compound: PIRELLI_2021.soft, y: 10 },
    { car: "W12", compound: PIRELLI_2021.hard, y: 545 },
  ],
};

// Every traced car from above, two columns at 95 px per metre: for checking the top views side by side (ART-15).
export const AllTopsSheet: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: PAPER }}>
    <svg width={1920} height={1080}>
      {(Object.keys(CARS) as CarId[]).map((id, i) => {
        const x = 80 + (i % 2) * 960;
        const y = 110 + Math.floor(i / 2) * 210;
        return (
          <g key={id}>
            <MangaCar
              car={CARS[id]}
              view="top"
              at={{ x, y, pxPerMetre: 95 }}
              state={{ heading: 0 }}
            />
            <text x={x + 600} y={y} fontFamily="Arial" fontSize={22} fill={INK}>
              {id}
            </text>
          </g>
        );
      })}
    </svg>
  </AbsoluteFill>
);
// Brazil 2008, last lap: GLO stays on dry grooved tyres, HAM (and VET, MAS) are on intermediates.
export const TOP_SHEETS_2008: Record<"A" | "B", TopCarSheetProps> = {
  A: {
    rows: [
      { car: "MP4-23", tread: "wet", y: 10 },
      { car: "TF108", tread: "dry", y: 545 },
    ],
  },
  B: {
    rows: [
      { car: "STR3", tread: "wet", y: 10 },
      { car: "F2008", tread: "wet", y: 545 },
    ],
  },
};

export const TopCarSheet: React.FC<TopCarSheetProps> = ({ rows }) => (
  <AbsoluteFill style={{ backgroundColor: PAPER }}>
    <svg width={1920} height={1080}>
      {rows.map(({ car: id, compound, tread, y }) => {
        const car = CARS[id];
        const x0 = 300;
        const guides = [
          0,
          carPoint(car, "rearAxle").x,
          carPoint(car, "frontAxle").x,
          carPoint(car, "nose").x,
        ].map((m) => x0 + m * PPM);
        return (
          <g key={id}>
            {guides.map((gx) => (
              <path
                key={gx}
                d={`M ${gx} ${y} L ${gx} ${y + 535}`}
                stroke="#c33"
                strokeWidth={1.5}
                strokeDasharray="6 6"
              />
            ))}
            <MangaCar
              car={car}
              at={{ x: x0, y: y + 190, pxPerMetre: PPM }}
              state={{ compound, tread }}
            />
            <MangaCar
              car={car}
              view="top"
              at={{ x: x0, y: y + 380, pxPerMetre: PPM }}
              state={{ heading: 0, compound, tread }}
            />
            <text
              x={1800}
              y={y + 40}
              textAnchor="end"
              fontFamily="Arial"
              fontSize={28}
              fill={INK}
            >
              {car.name}
            </text>
          </g>
        );
      })}
    </svg>
  </AbsoluteFill>
);
