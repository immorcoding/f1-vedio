// THROWAWAY prototype (v3): a cut-out, ink-washed photo of VER lifting the 2021 Abu Dhabi trophy, placed where the
// edit has room for it. The real scenes are imported and drawn as they are; nothing here is a blend mode.
//   A: 5.7 points card, rebuilt as a title card: cutout big on the left, the two scores on the right.
//   B: late 5.6, after the line: background faded to paper, the cutout rises behind the line, the car exits small.
//   C: 5.6 split into panels: the car in a narrower left panel, the cutout in a tall manga panel replacing the flag.
// Photo and cutout: public/proto-finish/ (never committed).
import { AbsoluteFill, Img, staticFile } from "remotion";
import { INK, PAPER } from "../kit/colors";
import { focusLines } from "../kit/lines";
import { Finish } from "../mv/parts/abuDhabi2021/Finish";
import { Points } from "../mv/parts/abuDhabi2021/Points";
import { shotAt, type ShotTime } from "../mv/parts/abuDhabi2021/shotClock";
import { EDIT } from "../mv/parts/abuDhabi2021/shots";
import { at, frameAt } from "../mv/timing";

export type Variant = "before56" | "before57" | "A" | "B" | "C";

const CUT = staticFile("proto-finish/cutout-ink.png");
const CUT_AR = 715 / 1399; // width / height of the cutout PNG

const Cutout: React.FC<{ x: number; y: number; h: number }> = ({ x, y, h }) => (
  <Img src={CUT} style={{ position: "absolute", left: x, top: y, height: h, width: h * CUT_AR }} />
);

const Burst: React.FC<{ cx: number; cy: number; r0: number; seed: number; opacity?: number; page?: boolean }> = ({
  cx,
  cy,
  r0,
  seed,
  opacity = 0.9,
  page,
}) => (
  <g clipPath={page ? "url(#page-clip)" : undefined}>
    <defs>
      <clipPath id="page-clip">
        <rect x={45} y={45} width={1830} height={990} />
      </clipPath>
    </defs>
    <path d={focusLines(cx, cy, r0, 120, seed)} fill={INK} opacity={opacity} />
  </g>
);

const Frame: React.FC<{ x: number; y: number; w: number; h: number; sw?: number }> = ({ x, y, w, h, sw = 10 }) => (
  <rect x={x} y={y} width={w} height={h} fill="none" stroke={INK} strokeWidth={sw} />
);

const Score: React.FC<{ x: number; y: number; code: string; pts: string; big?: boolean }> = ({ x, y, code, pts, big }) => (
  <g>
    <text
      x={x}
      y={y - (big ? 200 : 150)}
      fontFamily="Arial Black, Arial, sans-serif"
      fontWeight={900}
      fontSize={64}
      fill={PAPER}
      stroke={INK}
      strokeWidth={12}
      paintOrder="stroke"
    >
      {code}
    </text>
    <text
      x={x}
      y={y}
      fontFamily="Arial Black, Arial, sans-serif"
      fontWeight={900}
      fontStyle="italic"
      fontSize={big ? 220 : 160}
      fill={PAPER}
      stroke={INK}
      strokeWidth={16}
      paintOrder="stroke"
    >
      {pts}
    </text>
  </g>
);

// A: title card. The cutout owns the left; the scores sit on the right and never touch the face or the trophy.
const CardA: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: PAPER }}>
    <svg width={1920} height={1080} style={{ position: "absolute" }}>
      <Burst cx={560} cy={470} r0={330} seed={11} opacity={0.5} page />
      <ellipse cx={560} cy={560} rx={420} ry={560} fill={PAPER} opacity={0.88} />
    </svg>
    <Cutout x={150} y={50} h={1000} />
    <svg width={1920} height={1080} style={{ position: "absolute" }}>
      <Score x={1060} y={520} code="VER" pts="395.5" big />
      <Score x={1060} y={840} code="HAM" pts="387.5" />
      <Frame x={40} y={40} w={1840} h={1000} />
    </svg>
  </AbsoluteFill>
);

// B: car small and leaving, cutout rising behind the line.
const BeatB: React.FC<{ st: ShotTime }> = ({ st }) => (
  <AbsoluteFill style={{ backgroundColor: PAPER }}>
    <svg width={1920} height={1080} style={{ position: "absolute" }}>
      <Burst cx={1230} cy={470} r0={330} seed={5} opacity={0.6} page />
      <ellipse cx={1230} cy={560} rx={380} ry={520} fill={PAPER} opacity={0.88} />
    </svg>
    <Cutout x={900} y={35} h={1050} />
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: 1920,
        height: 1080,
        transform: "translate(-200px, 400px) scale(0.62)",
        transformOrigin: "0 0",
        WebkitMaskImage: "radial-gradient(ellipse 38% 30% at 44% 66%, #000 40%, transparent 100%)",
      }}
    >
      <Finish st={st} inset={null} />
    </div>
  </AbsoluteFill>
);

// C: split panels.
const LEFT = { x: 40, y: 130, w: 1140, h: 780 };
const RIGHT = { x: 1230, y: 40, w: 650, h: 1000 };
const SplitC: React.FC<{ st: ShotTime }> = ({ st }) => (
  <AbsoluteFill style={{ backgroundColor: PAPER }}>
    <div style={{ position: "absolute", left: LEFT.x, top: LEFT.y, width: LEFT.w, height: LEFT.h, overflow: "hidden" }}>
      <div style={{ position: "absolute", left: -80, top: -80, width: 1920, height: 1080, transform: "scale(0.8)", transformOrigin: "0 0" }}>
        <Finish st={st} inset={null} />
      </div>
    </div>
    <div style={{ position: "absolute", left: RIGHT.x, top: RIGHT.y, width: RIGHT.w, height: RIGHT.h, overflow: "hidden", background: PAPER }}>
      <svg width={RIGHT.w} height={RIGHT.h} style={{ position: "absolute" }}>
        <Burst cx={330} cy={420} r0={220} seed={9} opacity={0.8} />
        <ellipse cx={330} cy={520} rx={280} ry={460} fill={PAPER} opacity={0.85} />
      </svg>
      <Cutout x={-30} y={50} h={950} />
    </div>
    <svg width={1920} height={1080} style={{ position: "absolute" }}>
      <Frame x={LEFT.x} y={LEFT.y} w={LEFT.w} h={LEFT.h} />
      <Frame x={RIGHT.x} y={RIGHT.y} w={RIGHT.w} h={RIGHT.h} />
    </svg>
  </AbsoluteFill>
);

export const FinishPhotoBg: React.FC<{ variant?: Variant; t?: number }> = ({ variant = "A", t = 0.35 }) => {
  if (variant === "before57") return <Points st={shotAt(EDIT, frameAt(at(101)) + 60)} />;
  const st = shotAt(EDIT, frameAt(at(99)) + Math.round((variant === "B" ? 1.3 : t) * 60));
  if (variant === "before56") return <Finish st={st} />;
  if (variant === "A") return <CardA />;
  if (variant === "B") return <BeatB st={st} />;
  return <SplitC st={st} />;
};
