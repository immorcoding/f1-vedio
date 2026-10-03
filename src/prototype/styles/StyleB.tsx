// PROTOTYPE — style study B: Japanese racing-manga page, screentone and ink. Abu Dhabi 2021, lap 58, T5.
import { AbsoluteFill } from "remotion";
import { loadFont as loadBrush } from "@remotion/google-fonts/MaShanZheng";
import { handZh } from "../race-kit";
import { HAM_PLACE, RED_BULL_2021, VER_PLACE, spokes } from "./car-geometry";
import { RB16B, W12, wheelInCarUnits } from "./cars-2021";
import { MangaCar } from "./MangaCar";

const { fontFamily: brush } = loadBrush("normal", { weights: ["400"], subsets: ["chinese-simplified"], ignoreTooManyRequestsWarning: true });

const WHITE = "#fbfaf6";
const BLACK = "#0d0d0d";
const PANEL = { x: 40, y: 40, w: 1840, h: 1000 };
const INSET = { x: 1290, y: 70, w: 560, h: 330 };
const VER_FRONT = wheelInCarUnits(RB16B, 0);
const VER_LOCKUP = { x: VER_PLACE.x + VER_FRONT.x * VER_PLACE.scale, y: VER_PLACE.ground };

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
    <clipPath id="b-ground">
      <rect x={-200} y={sy(13.9)} width={2320} height={800} />
    </clipPath>
    <clipPath id="b-fence">
      <rect x={-200} y={-200} width={2320} height={580} />
    </clipPath>
    <clipPath id="b-shell">
      <path d={hotelShell()} />
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

// One pinhole camera for the whole panel: 2.9 m up, horizon at y = 190, focal length 2500 px.
// It matches the traced cars: HAM sits 10 m away (scale 1, ground y 915), VER 12.5 m away (scale 0.8, ground y 770).
const CAM = { f: 2500, horizon: 190, cx: 960, height: 2.9 };
// Screen position of a world point: x along the track (m), z distance from camera (m), y height above ground (m).
const sx = (z: number, x: number) => CAM.cx + (CAM.f * x) / z;
const sy = (z: number, y = 0) => CAM.horizon + (CAM.f * (CAM.height - y)) / z;
// A patch of ground between two distances and two track positions; its sides run to the vanishing point.
const groundQuad = (z0: number, z1: number, x0: number, x1: number) =>
  `M ${sx(z0, x0)} ${sy(z0)} L ${sx(z0, x1)} ${sy(z0)} L ${sx(z1, x1)} ${sy(z1)} L ${sx(z1, x0)} ${sy(z1)} Z`;

const WALL_Z = 25;
const STAND_Z = 45;
const HOTEL_Z = 420;

const hotelShell = () => {
  const z = HOTEL_Z;
  const [x0, x1, top] = [2, 64, 30];
  return `M ${sx(z, x0)} ${sy(z)} C ${sx(z, x0 + 6)} ${sy(z, top * 0.9)} ${sx(z, x0 + 20)} ${sy(z, top)} ${sx(z, (x0 + x1) / 2)} ${sy(z, top)} C ${sx(z, x1 - 20)} ${sy(z, top)} ${sx(z, x1 - 6)} ${sy(z, top * 0.9)} ${sx(z, x1)} ${sy(z)} Z`;
};

const lattice = (x0: number, x1: number, y0: number, y1: number, step: number) => {
  const out: string[] = [];
  const h = y1 - y0;
  for (let x = x0 - h; x < x1 + h; x += step) {
    out.push(`M ${x} ${y1} L ${x + h} ${y0}`);
    out.push(`M ${x} ${y0} L ${x + h} ${y1}`);
  }
  return out.join(" ");
};

// Grandstand tiers rising away from the camera, with a head-and-shoulders crowd on each row.
const STAND_ROWS = Array.from({ length: 26 }, (_, k) => ({ z: STAND_Z + k * 0.8, y: k * 0.45 }));

const Grandstand: React.FC = () => (
  <g>
    {STAND_ROWS.slice(0, -1).map((row, k) => {
      const next = STAND_ROWS[k + 1];
      const d = `M ${sx(row.z, -70)} ${sy(row.z, row.y)} L ${sx(row.z, -3)} ${sy(row.z, row.y)} L ${sx(next.z, -3)} ${sy(next.z, next.y)} L ${sx(next.z, -70)} ${sy(next.z, next.y)} Z`;
      return <path key={k} d={d} fill={k % 2 ? "url(#b-tone-mid)" : "url(#b-tone-dark)"} stroke={BLACK} strokeWidth={1.5} />;
    })}
    {STAND_ROWS.slice(0, -1).map((row, k) =>
      Array.from({ length: 110 }, (_, i) => {
        const x = -62 + i * 0.55 + ((k * 7 + i * 3) % 5) * 0.06;
        if ((i * 13 + k * 7) % 11 === 0) return null;
        const head = (CAM.f * 0.11) / row.z;
        const cx = sx(row.z, x);
        const cy = sy(row.z, row.y + 0.95);
        return (
          <g key={`${k}-${i}`}>
            <ellipse cx={cx} cy={cy + head * 2.2} rx={head * 1.6} ry={head * 1.2} fill={(i + k) % 3 ? WHITE : BLACK} stroke={BLACK} strokeWidth={1} />
            <circle cx={cx} cy={cy} r={head} fill={WHITE} stroke={BLACK} strokeWidth={1.2} />
          </g>
        );
      }),
    )}
  </g>
);

const Background: React.FC = () => (
  <g>
    <rect x={-200} y={-200} width={2320} height={CAM.horizon + 200} fill={BLACK} />
    {/* distant circuit buildings between the horizon and the wall */}
    <rect x={-200} y={CAM.horizon} width={2320} height={sy(WALL_Z, 1) - CAM.horizon} fill="url(#b-tone-dark)" />
    {Array.from({ length: 9 }, (_, i) => {
      const z = 160 + (i % 3) * 40;
      const x0 = -10 + i * 9;
      const h = 8 + (i % 4) * 5;
      return <path key={i} d={`M ${sx(z, x0)} ${sy(z)} L ${sx(z, x0)} ${sy(z, h)} L ${sx(z, x0 + 7)} ${sy(z, h)} L ${sx(z, x0 + 7)} ${sy(z)} Z`} fill={BLACK} />;
    })}
    {/* Yas hotel: glowing gridshell far beyond the circuit */}
    <path d={hotelShell()} fill={BLACK} />
    <g clipPath="url(#b-shell)">
      <path d={lattice(sx(HOTEL_Z, 2), sx(HOTEL_Z, 64), sy(HOTEL_Z, 30), sy(HOTEL_Z, 0), 16)} stroke={WHITE} strokeWidth={1.6} fill="none" />
    </g>
    <path d={hotelShell()} fill="none" stroke={WHITE} strokeWidth={2.5} />
    <Grandstand />
    {/* floodlight beams falling from towers above the frame */}
    {[
      [-120, 0.9],
      [520, 0.7],
    ].map(([x, o]) => (
      <path key={x} d={`M ${x} -60 L ${x + 900} ${sy(WALL_Z, 1)} L ${x + 1200} ${sy(WALL_Z, 1)} L ${x + 160} -60 Z`} fill={WHITE} opacity={0.16 * o} />
    ))}
    {/* catch fence on the wall: mesh, posts and cables run up out of the frame */}
    <g clipPath="url(#b-fence)" opacity={0.55}>
      <path d={lattice(-200, 2120, -200, sy(WALL_Z, 1), 22)} stroke="#6b6b6b" strokeWidth={1.2} fill="none" />
    </g>
    {Array.from({ length: 9 }, (_, i) => {
      const x = sx(WALL_Z, -16 + i * 4);
      return <path key={i} d={`M ${x} ${sy(WALL_Z, 1)} L ${x} -200`} stroke={BLACK} strokeWidth={8} />;
    })}
    {[2.2, 3.6].map((y) => (
      <path key={y} d={`M -200 ${sy(WALL_Z, y)} L 2120 ${sy(WALL_Z, y)}`} stroke={BLACK} strokeWidth={3} />
    ))}
    {/* concrete wall with panel joints */}
    <rect x={-200} y={sy(WALL_Z, 1)} width={2320} height={sy(WALL_Z) - sy(WALL_Z, 1)} fill={WHITE} stroke={BLACK} strokeWidth={4} />
    <rect x={-200} y={sy(WALL_Z, 1)} width={2320} height={14} fill="url(#b-tone-mid)" />
    {Array.from({ length: 12 }, (_, i) => {
      const x = sx(WALL_Z, -18 + i * 3);
      return <path key={i} d={`M ${x} ${sy(WALL_Z, 1)} L ${x} ${sy(WALL_Z)}`} stroke={BLACK} strokeWidth={2} />;
    })}
  </g>
);

const Track: React.FC = () => (
  <g>
    {/* run-off between the wall and the inside kerb */}
    <path d={groundQuad(15, WALL_Z, -30, 30)} fill="url(#b-tone-light)" />
    {Array.from({ length: 7 }, (_, i) => {
      const z = 16 + i * 1.3;
      return <path key={i} d={`M -200 ${sy(z)} L 2120 ${sy(z)}`} stroke={BLACK} strokeWidth={1} opacity={0.25} />;
    })}
    {/* inside (apex) kerb, beyond VER */}
    {Array.from({ length: 34 }, (_, i) => (
      <path key={i} d={groundQuad(13.9, 15.2, -8.5 + i * 0.5, -8 + i * 0.5)} fill={i % 2 ? BLACK : WHITE} stroke={BLACK} strokeWidth={3.5} />
    ))}
    <path d={groundQuad(13.65, 13.9, -30, 30)} fill={WHITE} stroke={BLACK} strokeWidth={2.5} />
    {/* racing surface, with rubbered-in streaks */}
    <path d={groundQuad(8.6, 13.65, -30, 30)} fill={WHITE} />
    {Array.from({ length: 18 }, (_, i) => {
      const z = 9 + ((i * 0.37) % 4.6);
      const x = -6 + ((i * 1.7) % 12);
      return <path key={i} d={`M ${sx(z, x)} ${sy(z)} L ${sx(z, x + 1.5 + (i % 3))} ${sy(z)}`} stroke={BLACK} strokeWidth={2.2} opacity={0.5} />;
    })}
    <g clipPath="url(#b-ground)">
      <path d={focusLines(VER_LOCKUP.x - 120, VER_LOCKUP.y - 60, 560, 110, 5)} fill={BLACK} />
    </g>
    {/* outside kerb, nearest the camera */}
    {Array.from({ length: 24 }, (_, i) => (
      <path key={`n${i}`} d={groundQuad(8, 8.6, -6 + i * 0.5, -5.5 + i * 0.5)} fill={i % 2 ? BLACK : WHITE} stroke={BLACK} strokeWidth={3} />
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
            <MangaCar car={RB16B} id="ver" x={VER_PLACE.x} ground={VER_PLACE.ground} scale={VER_PLACE.scale} spin={18} />
            <Puffs x={VER_LOCKUP.x - 40} y={VER_LOCKUP.y - 12} n={13} step={26} grow={3.4} />
            <MangaCar car={W12} id="ham" x={HAM_PLACE.x} ground={HAM_PLACE.ground} scale={HAM_PLACE.scale} spin={40} />
          </g>
          <Sfx x={960} y={360} size={150} rotate={-10}>
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
