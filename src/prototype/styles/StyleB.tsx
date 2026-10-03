// PROTOTYPE — style study B: Japanese racing-manga page, screentone and ink. Abu Dhabi 2021, lap 58, T5.
import { AbsoluteFill } from "remotion";
import { loadFont as loadBrush } from "@remotion/google-fonts/MaShanZheng";
import { handZh } from "../race-kit";
import { CAR, HAM_PLACE, MERCEDES_2021, RED_BULL_2021, RIM_R, VER_LOCKUP, VER_PLACE, WHEELS, placeTransform, spokes, type CarSkin } from "./car-geometry";

const { fontFamily: brush } = loadBrush("normal", { weights: ["400"], subsets: ["chinese-simplified"], ignoreTooManyRequestsWarning: true });

const WHITE = "#fbfaf6";
const BLACK = "#0d0d0d";
const PANEL = { x: 40, y: 40, w: 1840, h: 1000 };
const INSET = { x: 1290, y: 70, w: 560, h: 330 };

const tone = (id: string, r: number, gap = 7) => (
  <pattern id={id} width={gap} height={gap} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
    <rect width={gap} height={gap} fill={WHITE} />
    <circle cx={gap / 2} cy={gap / 2} r={r} fill={BLACK} />
  </pattern>
);

const Defs: React.FC = () => (
  <defs>
    {tone("b-tone-dark", 2.7)}
    {tone("b-tone-mid", 1.8)}
    {tone("b-tone-light", 1.05)}
    <filter id="b-ink" x="-3%" y="-3%" width="106%" height="106%">
      <feTurbulence type="fractalNoise" baseFrequency={0.05} numOctaves={2} seed={8} result="n" />
      <feDisplacementMap in="SourceGraphic" in2="n" scale={1.8} xChannelSelector="R" yChannelSelector="G" />
    </filter>
    <clipPath id="b-panel">
      <rect x={PANEL.x} y={PANEL.y} width={PANEL.w} height={PANEL.h} />
    </clipPath>
    <clipPath id="b-inset">
      <rect x={INSET.x} y={INSET.y} width={INSET.w} height={INSET.h} />
    </clipPath>
    <clipPath id="b-body">
      <path d={CAR.body} />
    </clipPath>
    <clipPath id="b-top">
      <path d={CAR.topBand} />
    </clipPath>
    <clipPath id="b-ground">
      <rect x={-100} y={606} width={2120} height={600} />
    </clipPath>
    <clipPath id="b-shell">
      <path d="M 1120 430 C 1180 300 1350 250 1520 255 C 1680 260 1790 320 1840 430 Z" />
    </clipPath>
  </defs>
);

const Ink: React.FC<{ d: string; w?: number; c?: string; o?: number }> = ({ d, w = 2.2, c = BLACK, o = 1 }) => (
  <path d={d} fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" opacity={o} />
);

// Focus lines: thin wedges converging on a point, leaving a clear zone around it.
const focusLines = (cx: number, cy: number, clear: number, n: number, seed: number) => {
  let d = "";
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + ((i * seed) % 7) * 0.004;
    const inner = clear + ((i * 37) % 140);
    const width = 0.004 + ((i * 13) % 5) * 0.0025;
    const far = 2400;
    d += `M ${cx + Math.cos(a) * inner} ${cy + Math.sin(a) * inner} L ${cx + Math.cos(a - width) * far} ${cy + Math.sin(a - width) * far} L ${cx + Math.cos(a + width) * far} ${cy + Math.sin(a + width) * far} Z `;
  }
  return d;
};

const lattice = () => {
  const out: string[] = [];
  for (let i = -20; i < 40; i++) {
    out.push(`M ${1100 + i * 34} 440 L ${1100 + i * 34 + 220} 220`);
    out.push(`M ${1100 + i * 34} 220 L ${1100 + i * 34 + 220} 440`);
  }
  return out.join(" ");
};

const Background: React.FC = () => (
  <g>
    <rect x={0} y={0} width={1920} height={430} fill={BLACK} />
    <rect x={0} y={330} width={1920} height={120} fill="url(#b-tone-dark)" />
    <path d="M 1120 430 C 1180 300 1350 250 1520 255 C 1680 260 1790 320 1840 430 Z" fill={BLACK} />
    <g clipPath="url(#b-shell)">
      <path d={lattice()} stroke={WHITE} strokeWidth={2} fill="none" />
    </g>
    <Ink d="M 1120 430 C 1180 300 1350 250 1520 255 C 1680 260 1790 320 1840 430" w={3} c={WHITE} />
    {/* floodlight starbursts */}
    {[
      [265, 185],
      [905, 165],
    ].map(([x, y]) => (
      <g key={x}>
        <path d={focusLines(x, y, 36, 40, 3)} fill={WHITE} opacity={0.9} transform={`translate(${x} ${y}) scale(0.09) translate(${-x} ${-y})`} />
        <circle cx={x} cy={y} r={44} fill={WHITE} />
        <rect x={x - 34} y={y - 20} width={68} height={40} fill="none" stroke={BLACK} strokeWidth={2} />
        <Ink d={`M ${x} ${y + 44} L ${x} 440`} w={4} c={WHITE} />
      </g>
    ))}
    {/* grandstand in tone, crowd as white specks */}
    <path d="M 40 445 L 1110 410 L 1118 590 L 40 600 Z" fill="url(#b-tone-mid)" />
    {Array.from({ length: 320 }, (_, i) => {
      const x = 60 + ((i * 53) % 1040);
      const y = 470 + (i % 4) * 30 - x * 0.026 + ((i * 7) % 8);
      return <circle key={i} cx={x} cy={y} r={3.6} fill={WHITE} stroke={BLACK} strokeWidth={1.2} />;
    })}
    <Ink d="M 40 445 L 1110 410 M 40 600 L 1118 590" w={3} />
  </g>
);

const Track: React.FC = () => (
  <g>
    <rect x={0} y={600} width={1920} height={480} fill={WHITE} />
    <rect x={0} y={600} width={1920} height={180} fill="url(#b-tone-light)" />
    {Array.from({ length: 18 }, (_, i) => (
      <path key={i} d={`M ${i * 112} 780 L ${i * 112 + 112} 780 L ${i * 112 + 106} 796 L ${i * 112 - 6} 796 Z`} fill={i % 2 ? BLACK : WHITE} stroke={BLACK} strokeWidth={2} />
    ))}
    {Array.from({ length: 11 }, (_, i) => (
      <path key={`n${i}`} d={`M ${i * 190 - 20} 975 L ${i * 190 + 170} 975 L ${i * 190 + 160} 1012 L ${i * 190 - 30} 1012 Z`} fill={i % 2 ? BLACK : WHITE} stroke={BLACK} strokeWidth={3} />
    ))}
    <Ink d="M 0 602 L 1920 606" w={4} />
    <g clipPath="url(#b-ground)">
      <path d={focusLines(VER_LOCKUP.x - 120, VER_LOCKUP.y - 60, 560, 110, 5)} fill={BLACK} />
    </g>
  </g>
);

const Car: React.FC<{ skin: CarSkin; place: { x: number; ground: number; scale: number }; toneFill: string }> = ({ skin, place, toneFill }) => (
  <g transform={placeTransform(place)}>
    <ellipse cx={720} cy={2} rx={700} ry={14} fill={BLACK} />
    <path d={CAR.body} fill={toneFill} />
    <path d={CAR.floor} fill={BLACK} />
    <path d={CAR.rearWingEndplate} fill={toneFill} />
    <path d={CAR.frontWingEndplate} fill={toneFill} />
    <path d={CAR.accentStripe} fill={skin.accent} />
    <path d={CAR.engineAccent} fill={skin.accent} />
    <g clipPath="url(#b-body)">
      <path d={CAR.shadowBand} fill={BLACK} opacity={toneFill === BLACK ? 0 : 0.85} />
      <g clipPath="url(#b-top)">
        <path d={CAR.body} fill="none" stroke={WHITE} strokeWidth={9} />
      </g>
    </g>
    <Ink d={CAR.body} w={5} />
    {[CAR.sidepodLine, CAR.inlet, CAR.undercut, CAR.boomerang, CAR.fin, CAR.headrest, CAR.airboxMouth, ...CAR.vanes].map((d) => (
      <Ink key={d} d={d} w={2.4} c={WHITE} />
    ))}
    {[...CAR.suspension, ...CAR.rearWingLines, ...CAR.frontWingLines, ...CAR.frontWingPillars, CAR.beamWing, CAR.mirror, CAR.mirrorStalk].map((d) => (
      <Ink key={d} d={d} w={2.4} />
    ))}
    <Ink d={CAR.rearWingEndplate} w={4.5} />
    <Ink d={CAR.frontWingEndplate} w={4} />
    <path d={CAR.halo} fill="none" stroke={BLACK} strokeWidth={13} strokeLinecap="round" />
    <path d={CAR.halo} fill="none" stroke={WHITE} strokeWidth={3} strokeLinecap="round" transform="translate(0 -3)" />
    <circle cx={CAR.helmet.cx} cy={CAR.helmet.cy} r={CAR.helmet.r} fill={WHITE} stroke={BLACK} strokeWidth={4} />
    <path d={CAR.visor} fill={BLACK} />
    <path d={`M ${CAR.helmet.cx - 20} ${CAR.helmet.cy - 4} C ${CAR.helmet.cx - 14} ${CAR.helmet.cy - 22} ${CAR.helmet.cx + 2} ${CAR.helmet.cy - 28} ${CAR.helmet.cx + 14} ${CAR.helmet.cy - 26}`} fill="none" stroke={skin.accent} strokeWidth={6} />
    <text x={CAR.number.x} y={CAR.number.y} fontFamily={handZh} fontSize={32} fill={WHITE} transform={`rotate(-7 ${CAR.number.x} ${CAR.number.y})`}>
      {skin.number}
    </text>
    {WHEELS.map((w) => (
      <g key={w.cx}>
        <circle cx={w.cx} cy={w.cy} r={w.r} fill={BLACK} />
        <circle cx={w.cx} cy={w.cy} r={w.r - 16} fill="none" stroke={skin.compound} strokeWidth={4} />
        <circle cx={w.cx} cy={w.cy} r={RIM_R} fill="url(#b-tone-light)" stroke={BLACK} strokeWidth={3} />
        <path d={spokes(w, RIM_R)} stroke={BLACK} strokeWidth={3} />
        <circle cx={w.cx} cy={w.cy} r={9} fill={BLACK} />
        <path d={`M ${w.cx - w.r * 0.8} ${w.cy - w.r * 0.42} A ${w.r * 0.9} ${w.r * 0.9} 0 0 1 ${w.cx - w.r * 0.1} ${w.cy - w.r * 0.9}`} fill="none" stroke={WHITE} strokeWidth={5} strokeLinecap="round" />
      </g>
    ))}
  </g>
);

const Puffs: React.FC<{ x: number; y: number; n: number; step: number; grow: number }> = ({ x, y, n, step, grow }) => (
  <g>
    {Array.from({ length: n }, (_, i) => {
      const cx = x - i * step;
      const cy = y - i * 2.4 - (i % 3) * 5;
      const r = 10 + i * grow;
      return (
        <g key={i}>
          <circle cx={cx} cy={cy} r={r} fill={WHITE} stroke={BLACK} strokeWidth={2.6} />
          <path d={`M ${cx - r * 0.2} ${cy + r * 0.9} A ${r} ${r} 0 0 0 ${cx + r * 0.95} ${cy + r * 0.2}`} fill="none" stroke="url(#b-tone-mid)" strokeWidth={r * 0.3} />
        </g>
      );
    })}
  </g>
);

const Sfx: React.FC<{ x: number; y: number; size: number; rotate: number; children: string }> = ({ x, y, size, rotate, children }) => (
  <text
    x={x}
    y={y}
    fontFamily={brush}
    fontSize={size}
    fill={BLACK}
    stroke={WHITE}
    strokeWidth={size * 0.08}
    paintOrder="stroke"
    transform={`rotate(${rotate} ${x} ${y})`}
  >
    {children}
  </text>
);

const Inset: React.FC = () => {
  const w = { cx: INSET.x + 300, cy: INSET.y + 250, r: 190 };
  return (
    <g>
      <g clipPath="url(#b-inset)">
        <rect x={INSET.x} y={INSET.y} width={INSET.w} height={INSET.h} fill={WHITE} />
        <path d={focusLines(w.cx, w.cy - 40, 230, 120, 9)} fill={BLACK} />
        <rect x={INSET.x} y={w.cy + 140} width={INSET.w} height={60} fill="url(#b-tone-mid)" />
        <circle cx={w.cx} cy={w.cy} r={w.r} fill={BLACK} />
        <circle cx={w.cx} cy={w.cy} r={w.r - 34} fill="none" stroke={RED_BULL_2021.compound} strokeWidth={9} />
        <circle cx={w.cx} cy={w.cy} r={104} fill="url(#b-tone-light)" stroke={BLACK} strokeWidth={5} />
        <path d={spokes({ cx: w.cx, cy: w.cy, r: 104 }, 104)} stroke={BLACK} strokeWidth={6} />
        <path d={`M ${w.cx - w.r * 0.85} ${w.cy - w.r * 0.35} A ${w.r * 0.92} ${w.r * 0.92} 0 0 1 ${w.cx - w.r * 0.1} ${w.cy - w.r * 0.92}`} fill="none" stroke={WHITE} strokeWidth={9} strokeLinecap="round" />
        <Puffs x={w.cx - 140} y={w.cy + 150} n={8} step={40} grow={9} />
        {Array.from({ length: 9 }, (_, i) => (
          <Ink key={i} d={`M ${w.cx + 40 + i * 18} ${w.cy + 180} l ${70 + (i % 3) * 30} ${-20 - (i % 4) * 14}`} w={3} />
        ))}
      </g>
      <rect x={INSET.x} y={INSET.y} width={INSET.w} height={INSET.h} fill="none" stroke={BLACK} strokeWidth={9} />
      <Sfx x={INSET.x + 24} y={INSET.y + 104} size={92} rotate={-8}>
        吱——
      </Sfx>
    </g>
  );
};

export const StyleB: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: WHITE }}>
    <svg width={1920} height={1080}>
      <Defs />
      <g filter="url(#b-ink)">
        <g clipPath="url(#b-panel)">
          <g transform="rotate(-3 960 540)">
            <Background />
            <Track />
            <Car skin={RED_BULL_2021} place={VER_PLACE} toneFill="url(#b-tone-dark)" />
            <Puffs x={VER_LOCKUP.x - 40} y={VER_LOCKUP.y - 12} n={13} step={26} grow={3.4} />
            <Car skin={MERCEDES_2021} place={HAM_PLACE} toneFill={BLACK} />
          </g>
          <Sfx x={1380} y={590} size={160} rotate={-12}>
            轰——！
          </Sfx>
        </g>
        <rect x={PANEL.x} y={PANEL.y} width={PANEL.w} height={PANEL.h} fill="none" stroke={BLACK} strokeWidth={10} />
        <Inset />
        <g>
          <rect x={420} y={80} width={330} height={150} fill={WHITE} stroke={BLACK} strokeWidth={5} />
          <text x={450} y={145} fontFamily={handZh} fontSize={48} fill={BLACK}>
            第 58 圈，
          </text>
          <text x={450} y={205} fontFamily={handZh} fontSize={48} fill={BLACK}>
            T5 发卡弯。
          </text>
        </g>
      </g>
    </svg>
  </AbsoluteFill>
);
