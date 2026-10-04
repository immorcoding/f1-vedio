// PROTOTYPE (prototype/car-high-low), throwaway: "what should the HIGH-camera and LOW-camera side views of the 2021
// cars (W12, RB16B, AT01) and the VF-20 look like?"
// - Proto-CarHighLow: per car, A the shipped look (feat/v2 0e8fbba), B HIGH (as traced, far wheels as traced, deeper
//   nose), C LOW (body re-projected to a 4° camera, far side hidden, wing side-on to the nose); the STR3 low look at
//   the same scale. Ground line plus 0.1 m steps and the tyre-top line in every cell. Two cells of the last row are
//   left empty for the low-angle reference photos (pasted in by out/work/compose.py; photos are not bundled).
// - Proto-CarHighLow-Noses: the front corner of each look in photo pixel space at 1.25× (3× the sheet's scale), with
//   an empty first column for the reference photo crop of the same box.
import { AbsoluteFill } from "remotion";
import { AT01, CarInPhotoSpace, MangaCar, RB16B, STR3, VF20, W12 } from "../../cars";
import { carLength, photoPxPerMetre, type CarSpec, type FarSideCamera } from "../../cars/spec";
import { INK, PAPER } from "../../kit/colors";
import { CAPTION_FONT } from "../../kit/lettering";
import * as OLD20 from "./shipped-2020";
import * as OLD21 from "./shipped-2021";

type Look = { car: CarSpec; farSide: FarSideCamera; label: string };
type Row = { name: string; looks: [Look, Look, Look] };

export const ROWS: Row[] = [
  {
    name: "W12",
    looks: [
      { car: OLD21.W12, farSide: "low", label: "A shipped (low, every shot)" },
      { car: W12, farSide: "high", label: "B HIGH: traced + nose" },
      { car: W12, farSide: "low", label: "C LOW: 4° camera + nose" },
    ],
  },
  {
    name: "RB16B",
    looks: [
      { car: OLD21.RB16B, farSide: "low", label: "A shipped (low, every shot)" },
      { car: RB16B, farSide: "high", label: "B HIGH: traced + nose" },
      { car: RB16B, farSide: "low", label: "C LOW: 4° camera + nose" },
    ],
  },
  {
    name: "AT01",
    looks: [
      { car: OLD20.AT01, farSide: "low", label: "A shipped (low, every shot)" },
      { car: AT01, farSide: "high", label: "B HIGH: traced + nose" },
      { car: AT01, farSide: "low", label: "C LOW: 4° camera + nose" },
    ],
  },
  {
    name: "VF-20",
    looks: [
      { car: OLD20.VF20, farSide: "high", label: "A shipped (high, Bahrain 3.3–3.6)" },
      { car: VF20, farSide: "high", label: "B HIGH: traced + nose" },
      { car: VF20, farSide: "low", label: "C LOW: 4° camera + nose" },
    ],
  },
];

const PPM = 120;
const COL = 780;
const LEFT = 30;
const ROW_H = 400;
const TOP = 70;

const Label: React.FC<{ x: number; y: number; size?: number; children: React.ReactNode }> = ({
  x,
  y,
  size = 30,
  children,
}) => (
  <text x={x} y={y} fontFamily={CAPTION_FONT} fontWeight={700} fontSize={size} fill={INK}>
    {children}
  </text>
);

// Ground line, 0.1 m steps up to 0.3 m and the tyre-top line (0.67 m), across one cell.
const Ground: React.FC<{ x: number; w: number; y: number; ppm: number }> = ({ x, w, y, ppm }) => (
  <g>
    {[0.1, 0.2, 0.3].map((h) => (
      <line key={h} x1={x} x2={x + w} y1={y - h * ppm} y2={y - h * ppm} stroke="#3a7bd5" strokeWidth={1} strokeDasharray="6 6" />
    ))}
    <line x1={x} x2={x + w} y1={y - 0.67 * ppm} y2={y - 0.67 * ppm} stroke="#d53a3a" strokeWidth={1} strokeDasharray="10 6" />
    <line x1={x} x2={x + w} y1={y} y2={y} stroke="#3a7bd5" strokeWidth={3} />
  </g>
);

export const CarHighLowSheet: React.FC = () => {
  const W = LEFT + COL * 3;
  return (
    <AbsoluteFill style={{ backgroundColor: PAPER }}>
      <svg width={W} height={TOP + ROW_H * 5}>
        <Label x={LEFT} y={46} size={34}>
          Car HIGH / LOW · same scale ({PPM} px/m) · blue: ground and 0.1 m steps · red dashed: tyre top (0.67 m)
        </Label>
        {[...ROWS.map((r) => r.looks as Look[]), [null, null, { car: STR3, farSide: "low", label: "STR3 low (the approved look)" } as Look]].map(
          (looks, i) =>
            looks.map((l, j) => {
              const x0 = LEFT + j * COL;
              const y0 = TOP + i * ROW_H;
              const ground = y0 + ROW_H - 40;
              return (
                <g key={`${i}-${j}`}>
                  <rect x={x0} y={y0} width={COL - 10} height={ROW_H - 10} fill="none" stroke={INK} strokeWidth={2} />
                  {l ? (
                    <>
                      <Ground x={x0} w={COL - 10} y={ground} ppm={PPM} />
                      <MangaCar
                        car={l.car}
                        at={{ x: x0 + (COL - carLength(l.car) * PPM) / 2, y: ground, pxPerMetre: PPM }}
                        state={{ farSide: l.farSide }}
                      />
                      <Label x={x0 + 14} y={y0 + 38}>
                        {i < ROWS.length ? `${ROWS[i].name} · ${l.label}` : l.label}
                      </Label>
                    </>
                  ) : null}
                </g>
              );
            }),
        )}
      </svg>
    </AbsoluteFill>
  );
};
export const SHEET_SIZE = { width: LEFT + COL * 3, height: TOP + ROW_H * 5 };

// Front-corner boxes in each car's photo pixels (x0, y0, w, h), the ground line inside.
export const NOSE_BOX: Record<string, [number, number, number, number]> = {
  W12: [90, 600, 400, 260],
  RB16B: [90, 585, 400, 260],
  AT01: [140, 550, 400, 260],
  "VF-20": [190, 610, 400, 260],
};
export const NOSE_ZOOM = 1.25;
const NW = 400 * NOSE_ZOOM;
const NH = 260 * NOSE_ZOOM;
const NTOP = 60;
const NROW = NH + 50;

export const CarHighLowNoses: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: PAPER }}>
    <svg width={NW * 4 + 50} height={NTOP + NROW * 4}>
      <Label x={10} y={42} size={30}>
        Nose and front wing, 1.25 photo px (3× the sheet) · photo · A shipped · B HIGH · C LOW · blue: ground, 0.1 m steps
      </Label>
      {ROWS.map((r, i) => {
        const [bx, by, bw, bh] = NOSE_BOX[r.name];
        const y0 = NTOP + i * NROW;
        return (
          <g key={r.name}>
            <Label x={10} y={y0 + 34} size={26}>
              {r.name} · reference photo
            </Label>
            {r.looks.map((l, j) => {
              const x0 = 10 + (j + 1) * (NW + 10);
              const ppm = photoPxPerMetre(l.car);
              const g = l.car.frame.ground;
              return (
                <g key={j}>
                  <Label x={x0} y={y0 + 34} size={26}>
                    {l.label}
                  </Label>
                  <svg x={x0} y={y0 + 44} width={NW} height={NH} viewBox={`${bx} ${by} ${bw} ${bh}`}>
                    <rect x={bx} y={by} width={bw} height={bh} fill={PAPER} />
                    {[0.1, 0.2, 0.3].map((h) => (
                      <line key={h} x1={bx} x2={bx + bw} y1={g - h * ppm} y2={g - h * ppm} stroke="#3a7bd5" strokeWidth={1} strokeDasharray="6 6" />
                    ))}
                    <line x1={bx} x2={bx + bw} y1={g} y2={g} stroke="#3a7bd5" strokeWidth={3} />
                    <CarInPhotoSpace car={l.car} state={{ farSide: l.farSide }} />
                  </svg>
                  <rect x={x0} y={y0 + 44} width={NW} height={NH} fill="none" stroke={INK} strokeWidth={3} />
                </g>
              );
            })}
            <rect x={10} y={y0 + 44} width={NW} height={NH} fill="none" stroke={INK} strokeWidth={3} />
          </g>
        );
      })}
    </svg>
  </AbsoluteFill>
);
export const NOSES_SIZE = { width: NW * 4 + 50, height: NTOP + NROW * 4 };
