// A manga page turning over: the fold is a slanted line x = c + K (y − H/2) that sweeps from the right edge (c = OFF_RIGHT,
// nothing lifted) to past the left edge (c = OFF_LEFT, the page gone). The old page keeps the part left of the fold;
// the part right of it is lifted and lies folded back over, mirrored across the fold, showing the page's blank back.
// Used by Suzuka 1990's title (1989 → 1990) and by the Suzuka → Brazil turn at the end of 1.8.
import { INK, PAPER } from "./colors";
import { inkFilter } from "./ink";
import { tone } from "./tone";

const W = 1920;
const H = 1080;
const K = 0.42;

/** Fold positions: no lift at all, and the page fully turned off the frame. */
export const FOLD_OFF_RIGHT = W + 700;
export const FOLD_OFF_LEFT = -1500;
/** Fold position for a turn's progress 0…1. */
export const foldAt = (turn: number) =>
  FOLD_OFF_RIGHT - (FOLD_OFF_RIGHT - FOLD_OFF_LEFT) * turn;

type Pt = { x: number; y: number };
const side = (p: Pt, c: number) => p.x - (c + K * (p.y - H / 2));
const clipRight = (poly: Pt[], c: number): Pt[] => {
  const out: Pt[] = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    const sa = side(a, c);
    const sb = side(b, c);
    if (sa >= 0) out.push(a);
    if (sa * sb < 0) {
      const u = sa / (sa - sb);
      out.push({ x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u });
    }
  }
  return out;
};
const reflect = (p: Pt, c: number): Pt => {
  const n = Math.hypot(K, 1);
  const d = { x: K / n, y: 1 / n };
  const A = { x: c, y: H / 2 };
  const t = (p.x - A.x) * d.x + (p.y - A.y) * d.y;
  const foot = { x: A.x + t * d.x, y: A.y + t * d.y };
  return { x: 2 * foot.x - p.x, y: 2 * foot.y - p.y };
};
const poly = (pts: Pt[]) =>
  pts.length
    ? `M ${pts.map((p) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" L ")} Z`
    : "";

/** The region left of the fold, for a clipPath around the old page. */
export const leftOfFold = (c: number) =>
  `M -2000 -2000 L ${c + K * (-2000 - H / 2)} -2000 L ${c + K * (3000 - H / 2)} 3000 L -2000 3000 Z`;

/** The lifted flap (the page's blank back) and the shadow it throws on the page under it. */
export const PageFlap: React.FC<{ c: number }> = ({ c }) => {
  const page = [
    { x: 0, y: 0 },
    { x: W, y: 0 },
    { x: W, y: H },
    { x: 0, y: H },
  ];
  const flap = poly(clipRight(page, c).map((p) => reflect(p, c)));
  return (
    <g filter={inkFilter()}>
      <path
        d={flap}
        fill={tone("mid")}
        opacity={0.35}
        transform="translate(18 14)"
      />
      <path d={flap} fill={PAPER} />
      <path d={flap} fill={tone("light")} opacity={0.5} />
      <path
        d={flap}
        fill="none"
        stroke={INK}
        strokeWidth={5}
        strokeLinejoin="round"
      />
    </g>
  );
};
