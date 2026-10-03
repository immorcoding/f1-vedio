// PROTOTYPE — style study C: polished 2D illustration, lit night scene with a panning-shot blur. Abu Dhabi 2021, lap 58, T5.
import { AbsoluteFill } from "remotion";
import { CAR, HAM_PLACE, MERCEDES_2021, RED_BULL_2021, RIM_R, VER_LOCKUP, VER_PLACE, WHEELS, placeTransform, spokes, type CarSkin } from "./car-geometry";

type Shades = { top: string; bottom: string; accentTop: string; accentBottom: string };
const RB_SHADES: Shades = { top: "#3f4f96", bottom: "#0e1435", accentTop: "#ff4a48", accentBottom: "#a50f14" };
const MER_SHADES: Shades = { top: "#55565e", bottom: "#09090b", accentTop: "#3fe0d6", accentBottom: "#00736e" };

const FLOODS = [
  [265, 185],
  [905, 165],
];

const lattice = () => {
  const out: string[] = [];
  for (let i = -20; i < 40; i++) {
    out.push(`M ${1100 + i * 34} 440 L ${1100 + i * 34 + 220} 220`);
    out.push(`M ${1100 + i * 34} 220 L ${1100 + i * 34 + 220} 440`);
  }
  return out.join(" ");
};

const Defs: React.FC = () => (
  <defs>
    <linearGradient id="c-sky" x1={0} y1={0} x2={0} y2={1}>
      <stop offset="0" stopColor="#070b22" />
      <stop offset="0.5" stopColor="#1d1846" />
      <stop offset="0.82" stopColor="#4b2563" />
      <stop offset="1" stopColor="#b3506f" />
    </linearGradient>
    <linearGradient id="c-asphalt" x1={0} y1={0} x2={0} y2={1}>
      <stop offset="0" stopColor="#24222f" />
      <stop offset="1" stopColor="#3b3a4a" />
    </linearGradient>
    <linearGradient id="c-stand" x1={0} y1={0} x2={0} y2={1}>
      <stop offset="0" stopColor="#2a2148" />
      <stop offset="1" stopColor="#120f22" />
    </linearGradient>
    <linearGradient id="c-shell" x1={0} y1={0} x2={0} y2={1}>
      <stop offset="0" stopColor="#3a3f8f" />
      <stop offset="1" stopColor="#151639" />
    </linearGradient>
    <radialGradient id="c-flood">
      <stop offset="0" stopColor="#fffbe8" stopOpacity={1} />
      <stop offset="0.18" stopColor="#fff2c4" stopOpacity={0.9} />
      <stop offset="0.5" stopColor="#ffcf7a" stopOpacity={0.25} />
      <stop offset="1" stopColor="#ffcf7a" stopOpacity={0} />
    </radialGradient>
    <linearGradient id="c-beam" x1={0} y1={0} x2={0} y2={1}>
      <stop offset="0" stopColor="#fff2c4" stopOpacity={0.22} />
      <stop offset="1" stopColor="#fff2c4" stopOpacity={0} />
    </linearGradient>
    <radialGradient id="c-tyre">
      <stop offset="0.55" stopColor="#1b1b20" />
      <stop offset="0.92" stopColor="#2c2c33" />
      <stop offset="1" stopColor="#0c0c0e" />
    </radialGradient>
    <radialGradient id="c-rim" cx="0.4" cy="0.35">
      <stop offset="0" stopColor="#d6dbe2" />
      <stop offset="0.6" stopColor="#7b828c" />
      <stop offset="1" stopColor="#2f3339" />
    </radialGradient>
    <radialGradient id="c-brake">
      <stop offset="0" stopColor="#ffd27a" stopOpacity={0.95} />
      <stop offset="0.5" stopColor="#ff6a1f" stopOpacity={0.6} />
      <stop offset="1" stopColor="#ff3d00" stopOpacity={0} />
    </radialGradient>
    <linearGradient id="c-visor" x1={0} y1={0} x2={1} y2={1}>
      <stop offset="0" stopColor="#3a2d6a" />
      <stop offset="1" stopColor="#0b0820" />
    </linearGradient>
    <radialGradient id="c-vignette" cx="0.5" cy="0.55" r="0.75">
      <stop offset="0.6" stopColor="#000" stopOpacity={0} />
      <stop offset="1" stopColor="#000" stopOpacity={0.55} />
    </radialGradient>
    <linearGradient id="c-haze" x1={0} y1={0} x2={0} y2={1}>
      <stop offset="0" stopColor="#b3506f" stopOpacity={0} />
      <stop offset="0.6" stopColor="#c86a7c" stopOpacity={0.35} />
      <stop offset="1" stopColor="#c86a7c" stopOpacity={0} />
    </linearGradient>
    {[
      ["rb", RB_SHADES],
      ["mer", MER_SHADES],
    ].map(([id, s]) => (
      <g key={id as string}>
        <linearGradient id={`c-body-${id}`} x1={0} y1={-240} x2={0} y2={0} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={(s as Shades).top} />
          <stop offset="1" stopColor={(s as Shades).bottom} />
        </linearGradient>
        <linearGradient id={`c-accent-${id}`} x1={0} y1={-240} x2={0} y2={-60} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={(s as Shades).accentTop} />
          <stop offset="1" stopColor={(s as Shades).accentBottom} />
        </linearGradient>
      </g>
    ))}
    <filter id="c-pan" x="-5%" y="-5%" width="110%" height="110%">
      <feGaussianBlur stdDeviation="14 0" />
    </filter>
    <filter id="c-pan-soft" x="-5%" y="-5%" width="110%" height="110%">
      <feGaussianBlur stdDeviation="7 0" />
    </filter>
    <filter id="c-glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation={6} result="b" />
      <feMerge>
        <feMergeNode in="b" />
        <feMergeNode in="b" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
    <filter id="c-soft" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation={2.2} />
    </filter>
    <filter id="c-blur12" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation={12} />
    </filter>
    <filter id="c-grain">
      <feTurbulence type="fractalNoise" baseFrequency={0.9} numOctaves={2} seed={6} />
      <feColorMatrix type="saturate" values="0" />
    </filter>
    <clipPath id="c-shellclip">
      <path d="M 1120 430 C 1180 300 1350 250 1520 255 C 1680 260 1790 320 1840 430 Z" />
    </clipPath>
    <clipPath id="c-body">
      <path d={CAR.body} />
    </clipPath>
    <clipPath id="c-top">
      <path d={CAR.topBand} />
    </clipPath>
  </defs>
);

const Background: React.FC = () => (
  <g>
    <rect x={-100} y={-100} width={2120} height={720} fill="url(#c-sky)" />
    {Array.from({ length: 70 }, (_, i) => (
      <circle key={i} cx={(i * 271) % 1920} cy={(i * 131) % 300} r={i % 7 === 0 ? 1.8 : 1} fill="#fff" opacity={0.25 + (i % 5) * 0.1} />
    ))}
    <g filter="url(#c-pan)">
      {/* hotel shell with glowing lattice */}
      <path d="M 1120 430 C 1180 300 1350 250 1520 255 C 1680 260 1790 320 1840 430 Z" fill="url(#c-shell)" />
      <g clipPath="url(#c-shellclip)" filter="url(#c-glow)">
        <path d={lattice()} stroke="#9fb8ff" strokeWidth={2.4} fill="none" opacity={0.9} />
      </g>
      <rect x={1100} y={430} width={760} height={150} fill="#141228" />
      {Array.from({ length: 6 }, (_, r) =>
        Array.from({ length: 22 }, (_, c) => (
          <rect key={`${r}-${c}`} x={1120 + c * 33} y={448 + r * 22} width={18} height={9} fill={(r * 7 + c * 3) % 5 === 0 ? "#ffd89a" : "#3b3466"} />
        )),
      )}
      {/* grandstand with crowd bokeh */}
      <path d="M 30 440 L 1110 405 L 1120 590 L 30 600 Z" fill="url(#c-stand)" />
      <path d="M 30 440 L 1110 405" stroke="#ffd9a8" strokeWidth={3} opacity={0.7} />
      {Array.from({ length: 360 }, (_, i) => {
        const x = 50 + ((i * 53) % 1050);
        const y = 455 + (i % 4) * 32 - x * 0.03 + ((i * 7) % 8);
        const c = ["#ff6b6b", "#ffe2b8", "#ffd34e", "#5b8cff", "#3fe0d6", "#ff9f43"][(i * 5) % 6];
        return <circle key={i} cx={x} cy={y} r={3.4} fill={c} opacity={0.55} />;
      })}
      {FLOODS.map(([x]) => (
        <g key={x}>
          <path d={`M ${x - 7} 440 L ${x - 3} 210 L ${x + 3} 210 L ${x + 7} 440 Z`} fill="#0d0b1c" />
        </g>
      ))}
    </g>
    <rect x={-100} y={330} width={2120} height={280} fill="url(#c-haze)" />
    {FLOODS.map(([x, y]) => (
      <g key={x}>
        <path d={`M ${x - 40} ${y + 20} L ${x - 420} 1080 L ${x + 420} 1080 L ${x + 40} ${y + 20} Z`} fill="url(#c-beam)" />
        <rect x={x - 46} y={y - 26} width={92} height={56} rx={4} fill="#1a1726" />
        {Array.from({ length: 8 }, (_, i) => (
          <circle key={i} cx={x - 33 + (i % 4) * 22} cy={y - 10 + Math.floor(i / 4) * 22} r={8} fill="#fffbe8" />
        ))}
        <circle cx={x} cy={y} r={240} fill="url(#c-flood)" />
      </g>
    ))}
  </g>
);

const Track: React.FC = () => (
  <g>
    <rect x={-100} y={598} width={2120} height={600} fill="url(#c-asphalt)" />
    {FLOODS.map(([x]) => (
      <ellipse key={x} cx={x} cy={760} rx={70} ry={240} fill="#ffe7b0" opacity={0.12} filter="url(#c-blur12)" />
    ))}
    <ellipse cx={1480} cy={700} rx={260} ry={60} fill="#8fa8ff" opacity={0.12} filter="url(#c-blur12)" />
    <g filter="url(#c-pan-soft)">
      {Array.from({ length: 18 }, (_, i) => (
        <path key={i} d={`M ${i * 112} 780 L ${i * 112 + 112} 780 L ${i * 112 + 106} 796 L ${i * 112 - 6} 796 Z`} fill={i % 2 ? "#d8302a" : "#e9e4ec"} />
      ))}
      {Array.from({ length: 11 }, (_, i) => (
        <g key={`n${i}`}>
          <path d={`M ${i * 190 - 20} 975 L ${i * 190 + 170} 975 L ${i * 190 + 160} 1012 L ${i * 190 - 30} 1012 Z`} fill={i % 2 ? "#c9221d" : "#f1edf3"} />
          <path d={`M ${i * 190 - 20} 975 L ${i * 190 + 170} 975 L ${i * 190 + 168} 982 L ${i * 190 - 21} 982 Z`} fill="#fff" opacity={0.35} />
        </g>
      ))}
      <rect x={-100} y={1012} width={2120} height={80} fill="#1d1c27" />
      {Array.from({ length: 30 }, (_, i) => (
        <rect key={`g${i}`} x={(i * 233) % 1920} y={640 + ((i * 47) % 330)} width={80 + ((i * 31) % 140)} height={2} fill="#fff" opacity={0.06} />
      ))}
    </g>
    <rect x={-100} y={598} width={2120} height={6} fill="#fff" opacity={0.85} filter="url(#c-pan-soft)" />
  </g>
);

const Car: React.FC<{ skin: CarSkin; id: "rb" | "mer"; place: { x: number; ground: number; scale: number } }> = ({ skin, id, place }) => {
  const dark = "rgba(0,0,0,0.55)";
  const light = "rgba(255,240,220,0.35)";
  return (
    <g transform={placeTransform(place)}>
      <ellipse cx={720} cy={4} rx={720} ry={24} fill="#000" opacity={0.65} filter="url(#c-soft)" />
      {/* sparks off the plank under braking */}
      {Array.from({ length: 7 }, (_, i) => (
        <path key={i} d={`M ${560 - i * 26} -6 l ${-80 - i * 14} ${-6 - (i % 3) * 5}`} stroke="#ffb347" strokeWidth={2.4} strokeLinecap="round" opacity={0.85} filter="url(#c-soft)" />
      ))}
      <path d={CAR.rearWingEndplate} fill={`url(#c-body-${id})`} />
      <path d="M 28 -246 L 152 -246 L 152 -228 L 28 -228 Z" fill={`url(#c-accent-${id})`} />
      <path d={CAR.beamWing} fill="none" stroke="#111" strokeWidth={8} strokeLinecap="round" />
      <path d={CAR.body} fill={`url(#c-body-${id})`} />
      <path d={CAR.accentStripe} fill={`url(#c-accent-${id})`} />
      <path d={CAR.engineAccent} fill={`url(#c-accent-${id})`} />
      <path d={CAR.noseAccent} fill={skin.nose} />
      <path d={CAR.floor} fill="#0b0b0d" />
      <path d={CAR.frontWingEndplate} fill={`url(#c-body-${id})`} />
      <path d="M 1300 -14 L 1422 -14 L 1422 -8 L 1290 -8 Z" fill={skin.accent} />
      <g clipPath="url(#c-body)">
        <path d={CAR.shadowBand} fill="#000" opacity={0.35} />
        <g clipPath="url(#c-top)">
          <path d={CAR.body} fill="none" stroke="#ffe9c4" strokeWidth={6} opacity={0.75} filter="url(#c-soft)" />
        </g>
        <ellipse cx={600} cy={-112} rx={260} ry={7} fill="#fff" opacity={0.18} filter="url(#c-soft)" transform="rotate(-6 600 -112)" />
      </g>
      {[CAR.sidepodLine, CAR.inlet, CAR.undercut, CAR.boomerang, CAR.fin, CAR.headrest, CAR.airboxMouth, ...CAR.vanes].map((d) => (
        <g key={d}>
          <path d={d} fill="none" stroke={dark} strokeWidth={2.4} strokeLinecap="round" />
          <path d={d} fill="none" stroke={light} strokeWidth={1.4} strokeLinecap="round" transform="translate(0 -2)" />
        </g>
      ))}
      {[...CAR.rearWingLines, ...CAR.frontWingLines, ...CAR.frontWingPillars, ...CAR.suspension].map((d) => (
        <path key={d} d={d} fill="none" stroke="#0b0b0d" strokeWidth={4} strokeLinecap="round" />
      ))}
      <path d={CAR.mirror} fill={`url(#c-body-${id})`} stroke={dark} strokeWidth={1.5} />
      <path d={CAR.mirrorStalk} stroke="#111" strokeWidth={3} />
      <path d={CAR.rearLight} fill="#ff2a2a" filter="url(#c-glow)" />
      <circle cx={CAR.helmet.cx} cy={CAR.helmet.cy} r={CAR.helmet.r} fill={skin.helmet} />
      <circle cx={CAR.helmet.cx - 8} cy={CAR.helmet.cy - 10} r={12} fill="#fff" opacity={0.35} filter="url(#c-soft)" />
      <path d={CAR.visor} fill="url(#c-visor)" />
      <path d={`M ${CAR.helmet.cx + 12} ${CAR.helmet.cy - 13} L ${CAR.helmet.cx + 26} ${CAR.helmet.cy - 12}`} stroke="#ffb36b" strokeWidth={2.5} strokeLinecap="round" opacity={0.8} />
      <path d={CAR.halo} fill="none" stroke="#0b0b0d" strokeWidth={13} strokeLinecap="round" />
      <path d={CAR.halo} fill="none" stroke={skin.body} strokeWidth={9} strokeLinecap="round" />
      <path d={CAR.halo} fill="none" stroke="#ffe9c4" strokeWidth={2} strokeLinecap="round" opacity={0.7} transform="translate(0 -3)" />
      <text x={CAR.number.x} y={CAR.number.y} fontFamily="Arial Black, Arial, sans-serif" fontWeight={900} fontSize={30} fill="#fff" opacity={0.92} transform={`rotate(-7 ${CAR.number.x} ${CAR.number.y})`}>
        {skin.number}
      </text>
      {WHEELS.map((w) => (
        <g key={w.cx}>
          <circle cx={w.cx} cy={w.cy} r={w.r} fill="url(#c-tyre)" />
          <circle cx={w.cx} cy={w.cy} r={w.r - 16} fill="none" stroke={skin.compound} strokeWidth={4} opacity={0.9} filter="url(#c-soft)" />
          <circle cx={w.cx} cy={w.cy} r={RIM_R} fill="url(#c-rim)" />
          <circle cx={w.cx} cy={w.cy} r={RIM_R * 0.8} fill="url(#c-brake)" />
          <path d={spokes(w, RIM_R, 12)} stroke="#2a2d33" strokeWidth={2} opacity={0.35} filter="url(#c-soft)" />
          {[0.35, 0.6, 0.85].map((k) => (
            <circle key={k} cx={w.cx} cy={w.cy} r={RIM_R * k} fill="none" stroke="#fff" strokeWidth={1} opacity={0.18} />
          ))}
          <circle cx={w.cx} cy={w.cy} r={8} fill="#c9ced6" />
          <path d={`M ${w.cx - w.r * 0.82} ${w.cy - w.r * 0.4} A ${w.r * 0.92} ${w.r * 0.92} 0 0 1 ${w.cx - w.r * 0.05} ${w.cy - w.r * 0.92}`} fill="none" stroke="#ffe9c4" strokeWidth={3} opacity={0.45} filter="url(#c-soft)" />
        </g>
      ))}
    </g>
  );
};

const Smoke: React.FC = () => (
  <g filter="url(#c-blur12)">
    {Array.from({ length: 14 }, (_, i) => (
      <circle key={i} cx={VER_LOCKUP.x - 30 - i * 30} cy={VER_LOCKUP.y - 12 - i * 3 - (i % 3) * 6} r={14 + i * 4.2} fill="#e8e4f0" opacity={0.42 - i * 0.02} />
    ))}
  </g>
);

export const StyleC: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#070b22" }}>
    <svg width={1920} height={1080}>
      <Defs />
      <g transform="rotate(-2 960 540)">
        <Background />
        <Track />
        <Car skin={RED_BULL_2021} id="rb" place={VER_PLACE} />
        <Smoke />
        <Car skin={MERCEDES_2021} id="mer" place={HAM_PLACE} />
      </g>
      <rect width={1920} height={1080} fill="url(#c-vignette)" />
    </svg>
    <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, mixBlendMode: "overlay", opacity: 0.18 }}>
      <rect width="100%" height="100%" filter="url(#c-grain)" />
    </svg>
  </AbsoluteFill>
);
