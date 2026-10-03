// People sheet: the cast of the shared people module (ART-16) — roles × key poses at group-shot size, and one figure
// at close-up size — for review against the settled references (ART-7).
import { AbsoluteFill } from "remotion";
import { INK, PAPER } from "../kit/colors";
import { CAPTION_FONT } from "../kit/lettering";
import {
  DOCTOR,
  FERRARI_MECHANIC,
  Figure,
  MARSHAL,
  cheer,
  driverOutfit,
  point,
  push,
  reach,
  spray,
  stand,
  standReady,
  walk,
  walkWithHands,
  wave,
  v,
  type Held,
  type Outfit,
  type Pose,
} from "../kit/figure";
import { SEN_1989 } from "../cars";

const SENNA = driverOutfit(SEN_1989.helmet, "#f3f2ee", {
  band: "#e23a2a",
  gloves: "#e23a2a",
  boots: "#1b1b1d",
});

type Cell = { label: string; pose: Pose; held?: Held };
const ROWS: { role: string; outfit: Outfit; cells: Cell[] }[] = [
  {
    role: "车手",
    outfit: SENNA,
    cells: [
      { label: "站立", pose: stand() },
      { label: "走", pose: walk(0.25) },
      { label: "挥手", pose: wave(0.2) },
      { label: "推车", pose: push(0.4) },
    ],
  },
  {
    role: "医生",
    outfit: DOCTOR,
    cells: [
      { label: "站立", pose: stand({ head: 8 }) },
      { label: "走", pose: walk(0.95, { lean: 6 }) },
      { label: "伸手接应", pose: reach() },
      {
        label: "扶人走",
        pose: walkWithHands(0.6, { near: { hand: v(0.42, 1.18), grip: "flat", wrist: 30 } }, { lean: 10 }),
      },
    ],
  },
  {
    role: "工作人员",
    outfit: MARSHAL,
    cells: [
      { label: "持灭火器", pose: standReady(), held: { kind: "extinguisher", carry: true } },
      { label: "喷灭火器", pose: spray(0.3), held: { kind: "extinguisher", spray: 1 } },
      { label: "指引", pose: point() },
      { label: "推车", pose: push(1.1) },
    ],
  },
  {
    role: "技师",
    outfit: FERRARI_MECHANIC,
    cells: [
      { label: "站立", pose: stand({ lean: -1 }) },
      { label: "走", pose: walk(0.5) },
      { label: "欢呼", pose: cheer(0.35) },
      { label: "推车", pose: push(0.75) },
    ],
  },
];

const S = 104; // px per metre in the grid (a 1.8 m figure ≈ 190 px)
const ROW_H = 262;
const COL_W = 290;

export const PeopleSheet: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: PAPER }}>
    <svg width={1920} height={1080}>
      {ROWS.map((row, r) => {
        const base = 40 + ROW_H * (r + 1) - 40;
        return (
          <g key={row.role}>
            <text x={30} y={base - 200} fontFamily={CAPTION_FONT} fontSize={30} fill={INK}>
              {row.role}
            </text>
            <line x1={30} x2={1240} y1={base} y2={base} stroke={INK} strokeWidth={1} opacity={0.25} />
            {row.cells.map((c, i) => {
              const x = 220 + COL_W * i;
              return (
                <g key={c.label}>
                  <Figure at={{ x, y: base }} pxPerMetre={S} pose={c.pose} outfit={row.outfit} facing="right" held={c.held} />
                  <text x={x - 60} y={base + 28} fontFamily={CAPTION_FONT} fontSize={20} fill={INK} opacity={0.7}>
                    {c.label}
                  </text>
                </g>
              );
            })}
          </g>
        );
      })}
      <line x1={1270} x2={1270} y1={30} y2={1050} stroke={INK} strokeWidth={2} />
      <Figure at={{ x: 1560, y: 1010 }} pxPerMetre={500} pose={walk(0.62)} outfit={SENNA} facing="left" />
      <text x={1300} y={70} fontFamily={CAPTION_FONT} fontSize={28} fill={INK}>
        特写尺寸
      </text>
    </svg>
  </AbsoluteFill>
);
