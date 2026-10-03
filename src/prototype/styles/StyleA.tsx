// PROTOTYPE — style study A: pen-and-ink sketchbook with watercolour washes. Abu Dhabi 2021, lap 58, T5.
import { AbsoluteFill } from "remotion";
import { hand } from "../race-kit";
import { CAR, HAM_PLACE, MERCEDES_2021, RED_BULL_2021, RIM_R, VER_LOCKUP, VER_PLACE, WHEELS, placeTransform, spokes, type CarSkin } from "./car-geometry";

const PAPER = "#f5efe2";
const INK = "#211c18";

const Defs: React.FC = () => (
  <defs>
    <filter id="a-wobble" x="-5%" y="-5%" width="110%" height="110%">
      <feTurbulence type="fractalNoise" baseFrequency={0.035} numOctaves={2} seed={4} result="n" />
      <feDisplacementMap in="SourceGraphic" in2="n" scale={3.5} xChannelSelector="R" yChannelSelector="G" />
    </filter>
    <filter id="a-wash" x="-10%" y="-10%" width="120%" height="120%">
      <feTurbulence type="fractalNoise" baseFrequency={0.018} numOctaves={3} seed={11} result="n" />
      <feDisplacementMap in="SourceGraphic" in2="n" scale={16} xChannelSelector="R" yChannelSelector="G" result="d" />
      <feGaussianBlur in="d" stdDeviation={1.6} result="b" />
      <feMorphology in="d" operator="erode" radius={3} result="inner" />
      <feComposite in="d" in2="inner" operator="out" result="rim" />
      <feGaussianBlur in="rim" stdDeviation={1.2} result="rimSoft" />
      <feMerge>
        <feMergeNode in="b" />
        <feMergeNode in="rimSoft" />
      </feMerge>
    </filter>
    <filter id="a-paint" x="-5%" y="-5%" width="110%" height="110%">
      <feTurbulence type="fractalNoise" baseFrequency={0.04} numOctaves={2} seed={5} result="n" />
      <feDisplacementMap in="SourceGraphic" in2="n" scale={5} xChannelSelector="R" yChannelSelector="G" result="d" />
      <feGaussianBlur in="d" stdDeviation={0.8} />
    </filter>
    <clipPath id="a-top">
      <path d={CAR.topBand} />
    </clipPath>
    <pattern id="a-hatch" width={7} height={7} patternUnits="userSpaceOnUse" patternTransform="rotate(40)">
      <line x1={0} y1={0} x2={0} y2={7} stroke={INK} strokeWidth={1.1} opacity={0.75} />
    </pattern>
    <pattern id="a-hatch2" width={9} height={9} patternUnits="userSpaceOnUse" patternTransform="rotate(-35)">
      <line x1={0} y1={0} x2={0} y2={9} stroke={INK} strokeWidth={1} opacity={0.6} />
    </pattern>
    <linearGradient id="a-sky" x1={0} y1={0} x2={0} y2={1}>
      <stop offset="0" stopColor="#2f3a6a" />
      <stop offset="0.55" stopColor="#7d6b9e" />
      <stop offset="1" stopColor="#eaa565" />
    </linearGradient>
    <radialGradient id="a-glow">
      <stop offset="0" stopColor={PAPER} stopOpacity={1} />
      <stop offset="0.45" stopColor={PAPER} stopOpacity={0.95} />
      <stop offset="0.75" stopColor="#f6d77a" stopOpacity={0.55} />
      <stop offset="1" stopColor="#f6d77a" stopOpacity={0} />
    </radialGradient>
    <clipPath id="a-shell">
      <path d="M 1120 430 C 1180 300 1350 250 1520 255 C 1680 260 1790 320 1840 430 Z" />
    </clipPath>
    <clipPath id="a-body">
      <path d={CAR.body} />
    </clipPath>
  </defs>
);

const Line: React.FC<{ d: string; w?: number; o?: number }> = ({ d, w = 2.2, o = 1 }) => (
  <path d={d} fill="none" stroke={INK} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" opacity={o} />
);

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
    <g filter="url(#a-wash)" opacity={0.78}>
      <path d="M 70 80 C 500 60 1300 70 1850 95 L 1835 590 C 1300 610 600 600 85 585 Z" fill="url(#a-sky)" />
    </g>
    <circle cx={265} cy={185} r={120} fill="url(#a-glow)" />
    <circle cx={905} cy={165} r={110} fill="url(#a-glow)" />
    <g filter="url(#a-wash)" opacity={0.55}>
      <path d="M 1120 430 C 1180 300 1350 250 1520 255 C 1680 260 1790 320 1840 430 Z" fill="#8a9be0" />
      <path d="M 60 440 L 1110 410 L 1120 575 L 70 590 Z" fill="#8e8076" />
    </g>
    <g filter="url(#a-wobble)">
      <path d="M 1120 430 C 1180 300 1350 250 1520 255 C 1680 260 1790 320 1840 430" fill="none" stroke={INK} strokeWidth={2.4} />
      <g clipPath="url(#a-shell)">
        <path d={lattice()} stroke={INK} strokeWidth={1.1} opacity={0.6} fill="none" />
      </g>
      <Line d="M 1100 432 L 1860 432 M 1150 432 L 1150 575 M 1810 432 L 1810 575" w={1.8} />
      {/* grandstand: roof, tiers, crowd ticks */}
      <Line d="M 40 432 L 1120 400 M 50 438 L 1110 408 M 70 578 L 1118 568" w={1.8} />
      {Array.from({ length: 5 }, (_, i) => (
        <Line key={i} d={`M ${70 + i * 260} ${440 - i * 7.4} L ${72 + i * 260} ${578 - i * 2.4}`} w={1.4} o={0.8} />
      ))}
      {Array.from({ length: 420 }, (_, i) => {
        const x = 78 + ((i * 53) % 1030);
        const row = i % 4;
        const y = 462 + row * 30 - x * 0.026 + ((i * 7) % 8);
        const c = ["#d8302a", "#f5efe2", "#f2c14e", "#3b5ba5", "#00a19b", "#f28c28"][(i * 5) % 6];
        return <circle key={`c${i}`} cx={x} cy={y} r={4.2} fill={c} stroke={INK} strokeWidth={0.9} opacity={0.85} />;
      })}
      <rect x={60} y={438} width={1060} height={150} fill="url(#a-hatch2)" opacity={0.35} />
      {/* floodlight towers */}
      {[
        [265, 185],
        [905, 165],
      ].map(([x, y]) => (
        <g key={x}>
          <Line d={`M ${x - 6} 440 L ${x - 2} ${y + 40} M ${x + 6} 440 L ${x + 2} ${y + 40} M ${x - 4} 330 L ${x + 4} 300 M ${x - 4} 260 L ${x + 4} 230`} w={1.8} />
          <rect x={x - 46} y={y - 26} width={92} height={56} fill="none" stroke={INK} strokeWidth={2} />
          <Line d={`M ${x - 46} ${y - 8} L ${x + 46} ${y - 8} M ${x - 46} ${y + 11} L ${x + 46} ${y + 11} M ${x - 15} ${y - 26} L ${x - 15} ${y + 30} M ${x + 15} ${y - 26} L ${x + 15} ${y + 30}`} w={1.2} />
        </g>
      ))}
      {/* loose panning strokes */}
      {Array.from({ length: 16 }, (_, i) => {
        const y = 300 + ((i * 41) % 260);
        const x = (i * 263) % 1700;
        return <Line key={`s${i}`} d={`M ${x} ${y} L ${x + 120 + ((i * 37) % 160)} ${y - 2}`} w={1.4} o={0.45} />;
      })}
    </g>
  </g>
);

const Track: React.FC = () => (
  <g>
    <g filter="url(#a-wash)" opacity={0.42}>
      <path d="M 40 600 C 600 590 1300 595 1880 605 L 1890 1050 C 1300 1060 600 1055 30 1045 Z" fill="#4c5a74" />
    </g>
    <g filter="url(#a-wash)" opacity={0.8}>
      {Array.from({ length: 18 }, (_, i) => (
        <path key={i} d={`M ${i * 112} 780 L ${i * 112 + 112} 780 L ${i * 112 + 106} 796 L ${i * 112 - 6} 796 Z`} fill={i % 2 ? "#d8302a" : PAPER} />
      ))}
      {Array.from({ length: 11 }, (_, i) => (
        <path key={`n${i}`} d={`M ${i * 190 - 20} 975 L ${i * 190 + 170} 975 L ${i * 190 + 160} 1012 L ${i * 190 - 30} 1012 Z`} fill={i % 2 ? "#d8302a" : PAPER} />
      ))}
    </g>
    <g filter="url(#a-wobble)">
      <Line d="M 30 602 C 600 594 1300 598 1890 606" w={2} />
      <Line d="M 0 780 L 1920 780 M 0 796 L 1920 796 M 0 975 L 1920 975 M 0 1012 L 1920 1012" w={1.8} />
      {Array.from({ length: 18 }, (_, i) => (
        <Line key={i} d={`M ${i * 112} 780 L ${i * 112 - 6} 796`} w={1.4} />
      ))}
      {Array.from({ length: 11 }, (_, i) => (
        <Line key={`n${i}`} d={`M ${i * 190 - 20} 975 L ${i * 190 - 30} 1012`} w={1.6} />
      ))}
      {Array.from({ length: 22 }, (_, i) => {
        const y = 640 + ((i * 59) % 300);
        const x = (i * 197) % 1800;
        return <Line key={`t${i}`} d={`M ${x} ${y} L ${x + 60 + ((i * 29) % 90)} ${y}`} w={1.2} o={0.35} />;
      })}
    </g>
  </g>
);

const Car: React.FC<{ skin: CarSkin; place: { x: number; ground: number; scale: number } }> = ({ skin, place }) => (
  <g transform={placeTransform(place)}>
    <ellipse cx={720} cy={2} rx={700} ry={16} fill="url(#a-hatch)" opacity={0.8} />
    <g filter="url(#a-paint)">
      <path d={CAR.body} fill={skin.body} opacity={0.9} transform="translate(3 -2)" />
      <path d={CAR.accentStripe} fill={skin.accent} opacity={0.9} />
      <path d={CAR.engineAccent} fill={skin.accent} opacity={0.75} />
      <path d={CAR.noseAccent} fill={skin.nose} opacity={0.9} />
      <path d={CAR.rearWingEndplate} fill={skin.body} opacity={0.75} />
      <path d="M 28 -246 L 152 -246 L 152 -226 L 28 -226 Z" fill={skin.accent} opacity={0.85} />
      <path d={CAR.frontWingEndplate} fill={skin.body} opacity={0.7} />
      <path d="M 1300 -14 L 1422 -14 L 1422 -8 L 1290 -8 Z" fill={skin.accent} opacity={0.9} />
      <path d={CAR.floor} fill="#2b2b2e" opacity={0.9} />
      <circle cx={CAR.helmet.cx} cy={CAR.helmet.cy} r={CAR.helmet.r} fill={skin.helmet} />
      <path d={CAR.rearLight} fill="#e3262b" />
    </g>
    <g clipPath="url(#a-body)">
      <path d={CAR.shadowBand} fill="url(#a-hatch)" />
    </g>
    <g filter="url(#a-wobble)">
      <Line d={CAR.body} w={2.6} />
      <Line d={CAR.body} w={1.1} o={0.4} />
      <Line d={CAR.floor} w={2} />
      {[CAR.sidepodLine, CAR.inlet, CAR.undercut, CAR.boomerang, CAR.fin, CAR.headrest, CAR.airboxMouth, CAR.mirror, CAR.mirrorStalk, CAR.beamWing].map((d) => (
        <Line key={d} d={d} w={1.8} />
      ))}
      {[...CAR.vanes, ...CAR.suspension, ...CAR.rearWingLines, ...CAR.frontWingLines, ...CAR.frontWingPillars].map((d) => (
        <Line key={d} d={d} w={1.6} />
      ))}
      <Line d={CAR.rearWingEndplate} w={2.4} />
      <Line d={CAR.frontWingEndplate} w={2.2} />
      <g clipPath="url(#a-body)">
        <g clipPath="url(#a-top)">
          <path d={CAR.body} fill="none" stroke={PAPER} strokeWidth={7} opacity={0.55} />
        </g>
      </g>
      {[CAR.sidepodLine, CAR.inlet, CAR.undercut, CAR.boomerang, CAR.fin, CAR.headrest, CAR.airboxMouth, ...CAR.vanes].map((d) => (
        <path key={`hl${d}`} d={d} fill="none" stroke={PAPER} strokeWidth={1.8} strokeLinecap="round" opacity={0.7} />
      ))}
      {[...CAR.rearWingLines, ...CAR.frontWingLines, CAR.beamWing].map((d) => (
        <path key={`hw${d}`} d={d} fill="none" stroke={PAPER} strokeWidth={1.4} opacity={0.55} transform="translate(0 2)" />
      ))}
      <path d={CAR.halo} fill="none" stroke={INK} strokeWidth={12} strokeLinecap="round" />
      <path d={CAR.halo} fill="none" stroke={skin.body} strokeWidth={7} strokeLinecap="round" opacity={0.9} />
      <circle cx={CAR.helmet.cx} cy={CAR.helmet.cy} r={CAR.helmet.r} fill="none" stroke={INK} strokeWidth={2.4} />
      <path d={CAR.visor} fill={INK} opacity={0.85} />
      <text x={CAR.number.x} y={CAR.number.y} fontFamily={hand} fontSize={34} fill={PAPER} transform={`rotate(-7 ${CAR.number.x} ${CAR.number.y})`}>
        {skin.number}
      </text>
      {WHEELS.map((w) => (
        <g key={w.cx}>
          <circle cx={w.cx} cy={w.cy} r={w.r} fill="#26262a" opacity={0.92} />
          <circle cx={w.cx} cy={w.cy} r={w.r} fill="url(#a-hatch2)" />
          <circle cx={w.cx} cy={w.cy} r={w.r - 16} fill="none" stroke={skin.compound} strokeWidth={4.5} opacity={0.95} />
          <circle cx={w.cx} cy={w.cy} r={RIM_R} fill="#8d8c8a" />
          <path d={spokes(w, RIM_R)} stroke={INK} strokeWidth={2} />
          <circle cx={w.cx} cy={w.cy} r={RIM_R} fill="none" stroke={INK} strokeWidth={2} />
          <circle cx={w.cx} cy={w.cy} r={10} fill={INK} />
          <circle cx={w.cx} cy={w.cy} r={w.r} fill="none" stroke={INK} strokeWidth={2.8} />
          <path d={`M ${w.cx - w.r * 0.7} ${w.cy - w.r * 0.55} A ${w.r * 0.9} ${w.r * 0.9} 0 0 1 ${w.cx + w.r * 0.2} ${w.cy - w.r * 0.88}`} fill="none" stroke={PAPER} strokeWidth={3} opacity={0.7} />
        </g>
      ))}
    </g>
  </g>
);

const Smoke: React.FC = () => (
  <g>
    <g filter="url(#a-wash)" opacity={0.5}>
      {Array.from({ length: 14 }, (_, i) => (
        <circle key={i} cx={VER_LOCKUP.x - 40 - i * 26} cy={VER_LOCKUP.y - 10 - i * 2.5 - (i % 3) * 5} r={10 + i * 3.2} fill="#d9d6d0" />
      ))}
    </g>
    <g filter="url(#a-wobble)">
      {Array.from({ length: 14 }, (_, i) => (
        <circle key={i} cx={VER_LOCKUP.x - 40 - i * 26} cy={VER_LOCKUP.y - 10 - i * 2.5 - (i % 3) * 5} r={10 + i * 3.2} fill="none" stroke={INK} strokeWidth={1.1} opacity={0.45} strokeDasharray={i % 2 ? "6 5" : undefined} />
      ))}
    </g>
  </g>
);

export const StyleA: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: PAPER }}>
    <svg width={1920} height={1080}>
      <Defs />
      <g transform="rotate(-2 960 540)">
        <Background />
        <Track />
        <Car skin={RED_BULL_2021} place={VER_PLACE} />
        <Smoke />
        <Car skin={MERCEDES_2021} place={HAM_PLACE} />
      </g>
      <g filter="url(#a-wobble)">
        <text x={1440} y={1060} fontFamily={hand} fontSize={38} fill={INK} opacity={0.75}>
          Yas Marina &apos;21 · lap 58 · T5
        </text>
      </g>
    </svg>
    <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, mixBlendMode: "multiply", opacity: 0.22 }}>
      <filter id="a-grain">
        <feTurbulence type="fractalNoise" baseFrequency={0.75} numOctaves={3} seed={2} />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter="url(#a-grain)" />
    </svg>
  </AbsoluteFill>
);
