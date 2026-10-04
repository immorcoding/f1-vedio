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

export type Variant = "before56" | "before57" | "A" | "B" | "C" | "D" | "E" | "F" | "G";

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


// D/E (v4): the whole photo (backdrop kept) in a tall panel, the Red Bull team-radio line set huge beside it.
// D = ink-wash photo, E = muted colour photo. Line verified: formula1.com "Say what" Abu Dhabi 2021 (Horner).
const PH_AR = 948 / 1506;
const LINES = ["MAX VERSTAPPEN,", "YOU ARE THE", "WORLD", "CHAMPION!"];
const SIZES = [84, 84, 180, 150];
const CardD: React.FC<{ colour?: boolean }> = ({ colour }) => {
  const ph = { x: 40, y: 40, h: 1000 };
  const pw = ph.h * PH_AR;
  return (
    <AbsoluteFill style={{ backgroundColor: PAPER }}>
      <svg width={1920} height={1080} style={{ position: "absolute" }}>
        <Burst cx={1290} cy={540} r0={360} seed={21} opacity={0.35} page />
      </svg>
      <div style={{ position: "absolute", left: ph.x, top: ph.y, width: pw, height: ph.h, overflow: "hidden" }}>
        <Img src={staticFile(colour ? "proto-finish/full-col.png" : "proto-finish/full-ink.png")} style={{ width: pw, height: ph.h }} />
      </div>
      <svg width={1920} height={1080} style={{ position: "absolute" }}>
        <g transform="rotate(-4 1290 540)">
          {LINES.map((l, i) => {
            const y = [310, 410, 630, 830][i];
            return (
              <text key={l} x={1290} y={y} textAnchor="middle" fontFamily="Arial Black, Arial, sans-serif" fontWeight={900}
                fontStyle="italic" fontSize={SIZES[i]} fill={i >= 2 ? INK : PAPER} stroke={i >= 2 ? PAPER : INK}
                strokeWidth={i >= 2 ? 10 : 14} paintOrder="stroke" letterSpacing={i >= 2 ? 6 : 2}>
                {l}
              </text>
            );
          })}
        </g>
        <text x={1290} y={985} textAnchor="middle" fontFamily="sans-serif" fontSize={30} fill={INK}>
          — 红牛车队无线电 · 2021.12.12 · 阿布扎比
        </text>
        <Frame x={ph.x} y={ph.y} w={pw} h={ph.h} />
        <Frame x={40} y={40} w={1840} h={1000} />
      </svg>
    </AbsoluteFill>
  );
};


// F/G (v5): the landscape podium photo full-bleed; the right side inked down so the radio line reads over the LED wall.
// F = ink-wash photo, G = muted colour photo.
const WIDE = [
  { t: "MAX VERSTAPPEN,", y: 560, fs: 60 },
  { t: "YOU ARE THE", y: 640, fs: 60 },
  { t: "WORLD", y: 810, fs: 150 },
  { t: "CHAMPION!", y: 950, fs: 120 },
];
const CardF: React.FC<{ colour?: boolean }> = ({ colour }) => (
  <AbsoluteFill style={{ backgroundColor: INK }}>
    <Img
      src={staticFile(colour ? "proto-finish/wide-col.png" : "proto-finish/wide-ink.png")}
      style={{ position: "absolute", left: -40, top: 0, width: 2057, height: 1080 }}
    />
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: "linear-gradient(90deg, rgba(14,14,20,0) 52%, rgba(14,14,20,0.82) 66%, rgba(14,14,20,0.9) 100%)",
      }}
    />
    <svg width={1920} height={1080} style={{ position: "absolute" }}>
      <g transform="rotate(-3 1540 760)">
        {WIDE.map(({ t, y, fs }, i) => (
          <text key={t} x={1540} y={y} textAnchor="middle" textLength={660} lengthAdjust="spacingAndGlyphs"
            fontFamily="Arial Black, Arial, sans-serif" fontWeight={900} fontStyle="italic" fontSize={fs}
            fill={i >= 2 ? PAPER : PAPER} stroke={INK} strokeWidth={i >= 2 ? 14 : 10} paintOrder="stroke">
            {t}
          </text>
        ))}
      </g>
      <text x={1870} y={1040} textAnchor="end" fontFamily="sans-serif" fontSize={28} fill={PAPER} opacity={0.85}>
        — 红牛车队无线电 · 2021.12.12 · 阿布扎比
      </text>
      <Frame x={20} y={20} w={1880} h={1040} sw={12} />
    </svg>
  </AbsoluteFill>
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
  if (variant === "D") return <CardD />;
  if (variant === "E") return <CardD colour />;
  if (variant === "F") return <CardF />;
  if (variant === "G") return <CardF colour />;
  if (variant === "B") return <BeatB st={st} />;
  return <SplitC st={st} />;
};
