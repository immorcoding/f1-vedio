// The Yas hotel (W Abu Dhabi – Yas Island) at night, side elevation: two hotel blocks joined by a bridge over the
// track, both wrapped in the gridshell canopy of diamond glass panels that lights up at night. Profile traced from
// Aleš Jungmann's 2011 photograph (references/yas-marina/yas-hotel-2011.jpg, CC BY-SA 3.0), its proportions scaled
// to metres from the photo; black and white only (ART-8) — a lit panel is paper, an unlit one ink.
import { INK, PAPER } from "../../kit/colors";
import { tone } from "../../kit/tone";

type P = [number, number]; // metres: x along the building from its west end, y up

// Top and underside of the west shell, and the smaller east shell (traced, see header).
const WEST_TOP: P[] = [
  [0, 38],
  [3, 42],
  [12, 46],
  [30, 46.2],
  [51, 44],
  [71, 40],
  [92, 34.3],
  [112, 27.3],
  [128, 20.3],
  [136, 16.4],
];
const WEST_UNDER: P[] = [
  [136, 16.4],
  [122, 11.7],
  [107, 12.5],
  [91, 16.4],
  [61, 21.5],
  [40, 27.3],
  [9, 30],
  [0, 38],
];
const EAST: P[] = [
  [133, 15],
  [143, 18.7],
  [158, 19.6],
  [174, 18.7],
  [181, 15.6],
  [183, 11.7],
  [180, 7.8],
  [168, 6],
  [150, 8],
  [138, 11],
];

// Smooth closed path through points (Catmull-Rom → cubic Bézier).
const smoothD = (pts: P[], map: (p: P) => P, close = true) => {
  const q = pts.map(map);
  const n = q.length;
  const at = (i: number) =>
    close ? q[(i + n) % n] : q[Math.max(0, Math.min(n - 1, i))];
  let d = `M ${q[0][0]} ${q[0][1]}`;
  const last = close ? n : n - 1;
  for (let i = 0; i < last; i++) {
    const p0 = at(i - 1);
    const p1 = at(i);
    const p2 = at(i + 1);
    const p3 = at(i + 2);
    d += ` C ${p1[0] + (p2[0] - p0[0]) / 6} ${p1[1] + (p2[1] - p0[1]) / 6} ${p2[0] - (p3[0] - p1[0]) / 6} ${p2[1] - (p3[1] - p1[1]) / 6} ${p2[0]} ${p2[1]}`;
  }
  return close ? `${d} Z` : d;
};

// Deterministic 0..1 noise per panel.
const hash = (a: number, b: number) => {
  const h = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
  return h - Math.floor(h);
};

const inside = (pts: P[], x: number, y: number) => {
  let c = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i];
    const [xj, yj] = pts[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi)
      c = !c;
  }
  return c;
};

const WEST_POLY: P[] = [...WEST_TOP, ...WEST_UNDER.slice(1)];

// Diamond panels of the gridshell (≈ 4.4 × 3.2 m), with the share of the façade along x where each sits.
const CELL = { w: 4.4, h: 3.2 };
const PANELS = (() => {
  const out: { x: number; y: number; k: number; r: number }[] = [];
  for (let row = 0; row < 30; row++)
    for (let col = -1; col < 46; col++) {
      const x = col * CELL.w + (row % 2) * (CELL.w / 2);
      const y = 3 + row * (CELL.h / 2);
      if (inside(WEST_POLY, x, y) || inside(EAST, x, y))
        out.push({ x, y, k: x / 183, r: hash(col, row) });
    }
  return out;
})();

/**
 * The hotel standing on `ground` (screen y), its west end at screen `x`, `scale` px per metre. `lit` 0..1 switches the
 * gridshell panels on in a wave from west to east; `shimmer` (seconds) makes lit panels flicker slightly.
 */
export const YasHotel: React.FC<{
  x: number;
  ground: number;
  scale: number;
  lit: number;
  shimmer?: number;
}> = ({ x, ground, scale, lit, shimmer = 0 }) => {
  const map = (p: P): P => [x + p[0] * scale, ground - p[1] * scale];
  const west = smoothD(WEST_POLY, map);
  const east = smoothD(EAST, map);
  const X = (m: number) => x + m * scale;
  const Y = (m: number) => ground - m * scale;
  // hotel floors under the shells: bands of windows with balcony lines
  const floors: string[] = [];
  for (let k = 0; k < 9; k++) {
    const y = 4 + k * 3.1;
    floors.push(`M ${X(10 + k * 1.2)} ${Y(y)} L ${X(112 - k * 9)} ${Y(y)}`);
  }
  for (let k = 0; k < 3; k++) {
    const y = 4 + k * 3.1;
    floors.push(`M ${X(140)} ${Y(y)} L ${X(176 - k * 3)} ${Y(y)}`);
  }
  return (
    <g>
      {/* podium and the bridge over the track */}
      <rect x={X(-6)} y={Y(7)} width={160 * scale} height={7 * scale} fill={INK} stroke={PAPER} strokeWidth={2} />
      <rect x={X(150)} y={Y(5)} width={36 * scale} height={5 * scale} fill={INK} stroke={PAPER} strokeWidth={2} />
      <path
        d={`M ${X(112)} ${Y(9)} C ${X(124)} ${Y(12)} ${X(134)} ${Y(12)} ${X(146)} ${Y(9)} L ${X(146)} ${Y(6.5)} C ${X(134)} ${Y(9.5)} ${X(124)} ${Y(9.5)} ${X(112)} ${Y(6.5)} Z`}
        fill={PAPER}
        stroke={INK}
        strokeWidth={2}
      />
      {/* the blocks: dark glass, each floor a row of lit windows */}
      <path d={`M ${X(9)} ${Y(30)} L ${X(9)} ${Y(4)} L ${X(118)} ${Y(4)} L ${X(118)} ${Y(12)} Z`} fill={INK} stroke={PAPER} strokeWidth={2} />
      <path
        d={floors.join(" ")}
        stroke={PAPER}
        strokeWidth={Math.max(2, scale * 0.9)}
        strokeDasharray={`${scale * 1.6} ${scale * 0.9}`}
        opacity={0.85}
      />
      <path d={floors.join(" ")} transform={`translate(0 ${scale * 1.2})`} stroke={tone("light")} strokeWidth={Math.max(1, scale * 0.4)} />
      {/* gridshell: ink body, panels lit in a wave */}
      <path d={west} fill={INK} />
      <path d={east} fill={INK} />
      {PANELS.map((p, i) => {
        const on = lit * 1.25 - p.k - p.r * 0.25;
        if (on <= 0) return null;
        const a = Math.min(1, on * 6) * (shimmer ? 0.82 + 0.18 * Math.sin(shimmer * 7 + p.r * 40) : 1);
        const [cx, cy] = map([p.x, p.y]);
        const hw = (CELL.w / 2) * scale * 0.86;
        const hh = (CELL.h / 2) * scale * 0.82;
        return (
          <path
            key={i}
            d={`M ${cx - hw} ${cy} L ${cx} ${cy - hh} L ${cx + hw} ${cy} L ${cx} ${cy + hh} Z`}
            fill={p.r > 0.82 ? tone("light") : PAPER}
            opacity={a}
          />
        );
      })}
      {/* the steel lattice over the panels, and the shell outlines */}
      <path d={west} fill="none" stroke={PAPER} strokeWidth={Math.max(2.5, scale * 0.5)} />
      <path d={east} fill="none" stroke={PAPER} strokeWidth={Math.max(2.5, scale * 0.5)} />
      {/* raking struts under the west shell (photo: two diagonal columns) */}
      <path
        d={`M ${X(20)} ${Y(29)} L ${X(42)} ${Y(4)} M ${X(52)} ${Y(23)} L ${X(70)} ${Y(4)}`}
        stroke={PAPER}
        strokeWidth={Math.max(2, scale * 0.35)}
        opacity={0.8}
      />
    </g>
  );
};
