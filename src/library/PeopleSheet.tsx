// People sheet: the cast of the shared people module (ART-16) — roles × key poses at group-shot size (104 px/m, the
// size people have in the trackside shots), and one figure at close-up size — for review against the settled
// references (ART-7). People-Hands (PeopleHands.tsx) shows the hands and the suit details up close.
import { AbsoluteFill } from "remotion";
import { INK, PAPER } from "../kit/colors";
import { CAPTION_FONT } from "../kit/lettering";
import {
  DOCTOR,
  FERRARI_MECHANIC,
  Figure,
  MARSHAL,
  armsFolded,
  armsUp,
  crowdOutfit,
  driverOutfit,
  fistPump,
  handOnHead,
  headBack,
  jump,
  point,
  push,
  reachTo,
  spray,
  stand,
  standReady,
  stumble,
  walk,
  walkWithHands,
  wave,
  v,
  type Held,
  type Outfit,
  type Pose,
} from "../kit/figure";
import { GRO_2020, SEN_1989 } from "../cars";

export const SENNA = driverOutfit(SEN_1989.helmet, "#f3f2ee", {
  band: "#e23a2a",
  gloves: "#e23a2a",
  boots: "#1b1b1d",
});
// Haas 2020: black suit with a grey side band, GRO's helmet.
export const GROSJEAN = driverOutfit(GRO_2020.helmet, "#1f1f23", {
  band: "#8d9099",
  gloves: "#2c2c31",
  boots: "#141416",
});
export const FAN_RED = crowdOutfit("#d4201d", { trousers: "#2f3640", hair: "#2a2420" });
export const FAN_LIGHT = crowdOutfit("#eceae4", { trousers: "#5b6270", hair: "#6b4a2e", sleeves: "long" });

type Cell = { label: string; pose: Pose; held?: Held };
const ROWS: { role: string; outfit: Outfit; cells: Cell[] }[] = [
  {
    role: "DRIVER",
    outfit: SENNA,
    cells: [
      { label: "STAND", pose: stand({ t: 0.6 }) },
      { label: "WALK", pose: walk(0.25) },
      { label: "WAVE", pose: wave(0.2) },
      { label: "PUSH", pose: push(0.4) },
      { label: "STUMBLE", pose: stumble(0.3) },
      { label: "POINT", pose: point() },
    ],
  },
  {
    role: "DOCTOR",
    outfit: DOCTOR,
    cells: [
      { label: "STAND", pose: stand({ t: 2, head: 8 }) },
      { label: "WALK", pose: walk(0.95, { lean: 6 }) },
      { label: "REACH OUT", pose: reachTo(v(0.62, 1.5)) },
      {
        label: "HELP WALK",
        pose: walkWithHands(0.6, { near: { hand: v(0.5, 1.22), grip: "flat", wrist: 20 } }, { lean: 10, stride: 0.5 }),
      },
    ],
  },
  {
    role: "MARSHAL",
    outfit: MARSHAL,
    cells: [
      { label: "HOLD EXTINGUISHER", pose: standReady(), held: { kind: "extinguisher", carry: true } },
      { label: "SPRAY", pose: spray(0.3), held: { kind: "extinguisher", spray: 1 } },
      { label: "PUSH", pose: push(1.1) },
    ],
  },
  {
    role: "MECHANIC",
    outfit: FERRARI_MECHANIC,
    cells: [
      { label: "ARMS FOLDED", pose: armsFolded() },
      { label: "HAND ON HEAD", pose: handOnHead() },
      { label: "FISTS UP", pose: armsUp(0.3) },
      { label: "FIST PUMP", pose: fistPump(0.05) },
      { label: "JUMP", pose: jump(0.55) },
      { label: "HEAD-BACK CHEER", pose: headBack(0.2) },
    ],
  },
  {
    role: "FAMILY",
    outfit: FAN_RED,
    cells: [
      { label: "STAND", pose: stand({ t: 1.3 }) },
      { label: "WALK", pose: walk(0.6) },
      { label: "CHEER", pose: armsUp(0.6) },
    ],
  },
];

const S = 104; // px per metre in the grid (a 1.8 m figure ≈ 185 px)
const ROW_H = 206;
const COL_W = 196;

export const PeopleSheet: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: PAPER }}>
    <svg width={1920} height={1080}>
      {ROWS.map((row, r) => {
        const base = 22 + ROW_H * (r + 1) - 26;
        return (
          <g key={row.role}>
            <text x={24} y={base - 150} fontFamily={CAPTION_FONT} fontSize={26} fill={INK}>
              {row.role}
            </text>
            <line x1={24} x2={1290} y1={base} y2={base} stroke={INK} strokeWidth={1} opacity={0.25} />
            {row.cells.map((c, i) => {
              const x = 170 + COL_W * i;
              const outfit = row.role === "FAMILY" && i === 1 ? FAN_LIGHT : row.outfit;
              return (
                <g key={c.label}>
                  <Figure at={{ x, y: base }} pxPerMetre={S} pose={c.pose} outfit={outfit} facing="right" held={c.held} />
                  <text x={x - 40} y={base + 20} fontFamily={CAPTION_FONT} fontSize={16} fill={INK} opacity={0.7}>
                    {c.label}
                  </text>
                </g>
              );
            })}
          </g>
        );
      })}
      <line x1={1310} x2={1310} y1={30} y2={1050} stroke={INK} strokeWidth={2} />
      <Figure at={{ x: 1600, y: 1010 }} pxPerMetre={500} pose={walk(0.62)} outfit={GROSJEAN} facing="left" />
      <text x={1335} y={70} fontFamily={CAPTION_FONT} fontSize={28} fill={INK}>
        CLOSE-UP SIZE
      </text>
    </svg>
  </AbsoluteFill>
);
