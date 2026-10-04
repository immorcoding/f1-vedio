// The Yas hotel (W Abu Dhabi – Yas Island, formerly Yas Viceroy) at night, seen from the circuit: the big west block
// on the left, the smaller east block on the right, the white link bridge between them over the track, and both blocks
// draped in the flowing gridshell canopy of diamond glass panels.
//
// Traced in photo pixel space (ART-10) from Aleš Jungmann's 2011 photograph
// (references/yas-marina/yas-hotel-2011.jpg, 552 × 285, CC BY-SA 3.0): the shell outlines, the curled lip of the west
// shell, the rim line under it, the floor slabs, the raking struts and the bridge. The night look (lit floors, glowing
// lattice, floodlights in front) follows Willo2173's 2015 race-night photograph
// (references/yas-marina/yas-hotel-fireworks-2015.jpg, CC BY 2.0). Black and white only (ART-8): a lit panel is paper.
import { INK, PAPER } from "../../kit/colors";

type P = readonly [number, number]; // photo px: x right, y down; the ground in the photo is y = 170

// West shell: outer (top) edge, measured column by column against the sky, tip to tail.
const WEST_TOP: P[] = [
  [21, 74],
  [22, 71],
  [28, 62],
  [34, 58],
  [40, 56],
  [52, 52],
  [64, 51],
  [82, 51],
  [100, 53],
  [118, 54],
  [136, 58],
  [154, 62],
  [172, 67],
  [190, 73],
  [208, 79],
  [226, 85],
  [244, 92],
  [256, 98],
  [268, 107],
  [280, 117],
  [288, 121.5],
];
// West shell: the rim (its lower front edge, the bright line running down over the tower), tip to tail.
const WEST_RIM: P[] = [
  [21, 74],
  [30, 78],
  [41, 80],
  [66, 86],
  [85, 95],
  [110, 106],
  [135, 116],
  [160, 126],
  [180, 131.5],
  [200, 132],
  [225, 127.5],
  [250, 123.5],
  [270, 122],
  [288, 121.5],
];
// The curled lip under the west tip: the shell's inner face, seen through the rim.
const WEST_LIP: P[] = [
  [21, 74],
  [24, 81],
  [29, 87.5],
  [35, 94],
  [40, 98.5],
  [50, 95],
  [62, 89],
  [41, 80],
  [30, 78],
];
// East shell, top edge then bottom edge back to its west end (behind the west shell's tail).
const EAST_TOP: P[] = [
  [286, 122],
  [300, 121],
  [325, 120.5],
  [350, 120],
  [362, 120.5],
  [372, 123],
  [377, 128],
  [379, 134],
];
const EAST_BOT: P[] = [
  [286, 122],
  [291, 132],
  [300, 143],
  [312, 148.5],
  [337, 151],
  [356, 150],
  [370, 144],
  [376, 140],
  [379, 134],
];

// Floor slabs of the west tower (photo y), its rounded west end at x = 40.6.
const WEST_SLABS = [89.4, 101, 112.5, 124, 135];
const PODIUM_TOP = 142;
// The track runs under the bridge: the podium is open between these photo x.
const GAP: P = [272, 305];

// Piecewise-linear y(x) along a polyline sorted by x.
const yAt = (pts: P[], x: number) => {
  if (x <= pts[0][0]) return pts[0][1];
  for (let i = 1; i < pts.length; i++)
    if (x <= pts[i][0]) {
      const [x0, y0] = pts[i - 1];
      const [x1, y1] = pts[i];
      return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
    }
  return pts[pts.length - 1][1];
};

// Smooth path through points (Catmull-Rom → cubic Bézier).
const smooth = (q: P[], close: boolean) => {
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

const hash = (a: number, b: number) => {
  const h = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
  return h - Math.floor(h);
};

type Cell = {
  d: string; // lattice diamond
  panel: string; // the glass panel inside it
  k: number; // 0..1 west → east, for the lighting wave
  r: number; // noise
  edge: number; // 0 at the shell's edges (surface turning away), 1 mid-surface
};

// The gridshell lattice of one shell: diamond cells whose two families of lines run diagonally along the shell between
// its top edge and its lower edge, bunching where the surface turns away (cosine spacing) and converging at the ends.
const lattice = (
  top: P[],
  bot: P[],
  x0: number,
  x1: number,
  du: number,
  nv: number,
  map: (p: P) => P,
  kOf: (x: number) => number,
): Cell[] => {
  const na = Math.ceil((x1 - x0) / du);
  const pt = (a: number, b: number): P => {
    const x = Math.min(x1, Math.max(x0, x0 + a * du));
    const s = Math.min(1, Math.max(0, b / nv));
    const v = (1 - Math.cos(Math.PI * s)) / 2;
    const yt = yAt(top, x);
    const yb = yAt(bot, x);
    return map([x, yt + (yb - yt) * v]);
  };
  const out: Cell[] = [];
  for (let b = 0; b <= nv; b++)
    for (let a = -1; a <= na + 1; a++) {
      if ((a + b) % 2 !== 0) continue;
      const q = [pt(a - 1, b), pt(a, b - 1), pt(a + 1, b), pt(a, b + 1)];
      const c = pt(a, b);
      const area = Math.abs(
        (q[2][0] - q[0][0]) * (q[3][1] - q[1][1]) -
          (q[3][0] - q[1][0]) * (q[2][1] - q[0][1]),
      );
      if (area < 4) continue;
      const ins = (p: P, f: number): P => [
        c[0] + (p[0] - c[0]) * f,
        c[1] + (p[1] - c[1]) * f,
      ];
      const pq = q.map((p) => ins(p, 0.7));
      const poly = (r: P[]) =>
        `M ${r[0][0]} ${r[0][1]} L ${r[1][0]} ${r[1][1]} L ${r[2][0]} ${r[2][1]} L ${r[3][0]} ${r[3][1]} Z`;
      const x = x0 + a * du;
      out.push({
        d: poly(q),
        panel: poly(pq),
        k: kOf(x),
        r: hash(a + x0, b),
        edge: Math.sin(Math.PI * Math.min(1, Math.max(0, b / nv))),
      });
    }
  return out;
};

/**
 * The hotel with its photo ground line (photo y = 170) on screen y `ground`, photo x = 0 at screen `x`, `scale` screen
 * px per photo px (shot 4.1 draws it at 0.5 m per photo px, so the opening under the bridge spans the straight).
 * `lit` 0..1 switches the gridshell panels on one by one in a wave from west to east (all on at 1); `t` (seconds) drives
 * the twinkle of lit panels and room lights. `id` keeps its clip paths unique.
 */
export const YasHotel: React.FC<{
  x: number;
  ground: number;
  scale: number;
  lit: number;
  t?: number;
  id?: string;
}> = ({ x, ground, scale, lit, t = 0, id = "yas" }) => {
  const map = (p: P): P => [x + p[0] * scale, ground + (p[1] - 170) * scale];
  const M = (pts: P[]) => pts.map(map);
  const X = (px: number) => x + px * scale;
  const Y = (py: number) => ground + (py - 170) * scale;
  const kOf = (px: number) => (px - 21) / (379 - 21);

  const westOutline = smooth(
    M([...WEST_TOP, ...[...WEST_RIM].reverse().slice(1, -1)]),
    true,
  );
  const eastOutline = smooth(
    M([...EAST_TOP, ...[...EAST_BOT].reverse().slice(1, -1)]),
    true,
  );
  const lip = smooth(M(WEST_LIP), true);
  const west = lattice(WEST_TOP, WEST_RIM, 21, 288, 3.1, 13, map, kOf);
  const east = lattice(EAST_TOP, EAST_BOT, 286, 379, 3.1, 7, map, kOf);

  // A panel switches on when the wave passes it, flashes, then glows with a slow twinkle.
  const panelLight = (c: Cell) => {
    const th = 0.06 + c.k * 0.78 + c.r * 0.14;
    const on = (lit - th) / 0.025;
    if (on <= 0) return 0;
    const flash = 0.5 * Math.exp(-on / 2.5);
    const twinkle = 0.86 + 0.14 * Math.sin(t * 5.3 + c.r * 37);
    return Math.min(1, (0.45 + 0.55 * c.edge) * twinkle + flash);
  };

  // Room lights: rows of windows between the slabs, most of them lit.
  const rooms = (
    x0: number,
    x1: number,
    ys: number[],
    pitch: number,
    seed: number,
  ) => {
    const out: React.ReactNode[] = [];
    for (let i = 0; i < ys.length - 1; i++) {
      const y0 = ys[i] + 1.4;
      const y1 = ys[i + 1] - 1;
      for (let px = x0; px < x1 - pitch * 0.6; px += pitch) {
        const r = hash(px * 3 + seed, i);
        if (r < 0.22) continue;
        const flick = r > 0.94 ? 0.55 + 0.45 * Math.sin(t * 9 + r * 50) : 1;
        out.push(
          <rect
            key={`${seed}-${i}-${px}`}
            x={X(px + 0.35)}
            y={Y(y0)}
            width={(pitch - 0.7) * scale}
            height={(y1 - y0) * scale}
            fill={PAPER}
            opacity={(r > 0.7 ? 0.95 : 0.6) * flick}
          />,
        );
      }
    }
    return out;
  };

  const westSlabs = [...WEST_SLABS, PODIUM_TOP];
  const lowSlabs = [124, 130.5, 137, PODIUM_TOP];
  const eastSlabs = [132, 137.5, PODIUM_TOP + 1];
  const sw = (w: number) => Math.max(1, w * scale);

  return (
    <g>
      <defs>
        <clipPath id={`${id}-west`}>
          <path d={westOutline} />
        </clipPath>
        <clipPath id={`${id}-east`}>
          <path d={eastOutline} />
        </clipPath>
        <filter id={`${id}-glow`} x="-20%" y="-50%" width="140%" height="200%">
          <feGaussianBlur stdDeviation={6 * scale} />
        </filter>
      </defs>
      {/* the canopy's glow on the night air, growing as the panels come on */}
      {lit > 0 ? (
        <g filter={`url(#${id}-glow)`} opacity={0.22 * lit}>
          <path d={westOutline} fill={PAPER} />
          <path d={eastOutline} fill={PAPER} />
        </g>
      ) : null}

      {/* east block: glass floors under the east shell */}
      <rect
        x={X(296)}
        y={Y(128)}
        width={78 * scale}
        height={(PODIUM_TOP + 1 - 128) * scale}
        fill="#151515"
      />
      {rooms(298, 372, eastSlabs, 2.4, 7)}
      {eastSlabs.map((y) => (
        <path
          key={`e${y}`}
          d={`M ${X(296)} ${Y(y)} L ${X(374)} ${Y(y)}`}
          stroke={PAPER}
          strokeWidth={sw(0.55)}
          opacity={0.8}
        />
      ))}

      {/* west tower: rounded west end, slabs as pale bands, rooms lit between them */}
      <path
        d={`M ${X(46)} ${Y(82)} L ${X(214)} ${Y(82)} ${WEST_TOP.filter(
          ([px]) => px > 214,
        )
          .map(([px, py]) => `L ${X(Math.min(px, 286))} ${Y(py + 1.5)}`)
          .join(
            " ",
          )} L ${X(286)} ${Y(PODIUM_TOP)} L ${X(46)} ${Y(PODIUM_TOP)} Q ${X(40.6)} ${Y(PODIUM_TOP)} ${X(40.6)} ${Y(PODIUM_TOP - 5)} L ${X(40.6)} ${Y(87)} Q ${X(40.6)} ${Y(82)} ${X(46)} ${Y(82)} Z`}
        fill="#141414"
      />
      {rooms(43, 200, [83, ...westSlabs], 2.5, 1)}
      {rooms(200, 284, lowSlabs, 2.4, 3)}
      {westSlabs.map((y, i) => (
        <path
          key={`w${y}`}
          d={`M ${X(40.6 + (i === westSlabs.length - 1 ? 0 : 0.6))} ${Y(y)} L ${X(i < 3 ? 200 : 286)} ${Y(y + (i < 3 ? 1.6 : 0))}`}
          stroke={PAPER}
          strokeWidth={sw(0.75)}
          strokeLinecap="round"
        />
      ))}
      {lowSlabs.slice(0, -1).map((y) => (
        <path
          key={`l${y}`}
          d={`M ${X(200)} ${Y(y)} L ${X(284)} ${Y(y)}`}
          stroke={PAPER}
          strokeWidth={sw(0.55)}
          opacity={0.85}
        />
      ))}

      {/* podium on both sides of the track, its lobby glowing; open under the bridge */}
      {[
        [-4, GAP[0]],
        [GAP[1], 384],
      ].map(([a, b]) => (
        <g key={a}>
          <rect
            x={X(a)}
            y={Y(PODIUM_TOP)}
            width={(b - a) * scale}
            height={(170 - PODIUM_TOP) * scale}
            fill="#1b1b1b"
          />
          <rect
            x={X(a)}
            y={Y(152)}
            width={(b - a) * scale}
            height={13 * scale}
            fill={PAPER}
            opacity={0.42}
          />
          {Array.from({ length: Math.floor((b - a) / 6) }, (_, i) => (
            <path
              key={i}
              d={`M ${X(a + 3 + i * 6)} ${Y(152)} L ${X(a + 3 + i * 6)} ${Y(165)}`}
              stroke={INK}
              strokeWidth={sw(0.5)}
            />
          ))}
          <path
            d={`M ${X(a)} ${Y(PODIUM_TOP)} L ${X(b)} ${Y(PODIUM_TOP)}`}
            stroke={PAPER}
            strokeWidth={sw(0.9)}
          />
        </g>
      ))}

      {/* raking struts under the west shell (a V to one foot) and beside the bridge */}
      <path
        d={`M ${X(70)} ${Y(91)} L ${X(116)} ${Y(PODIUM_TOP)} L ${X(160)} ${Y(129)} M ${X(284)} ${Y(124)} L ${X(277)} ${Y(150)} M ${X(289)} ${Y(124)} L ${X(331)} ${Y(167)} M ${X(358)} ${Y(149)} L ${X(338)} ${Y(167)}`}
        stroke={PAPER}
        strokeWidth={sw(0.8)}
        strokeLinecap="round"
        opacity={0.9}
        fill="none"
      />

      {/* deck arms tying the bridge into both blocks (behind the white body) */}
      <path
        d={`M ${X(236)} ${Y(149)} L ${X(268)} ${Y(150.5)} L ${X(268)} ${Y(158)} L ${X(236)} ${Y(158)} Z M ${X(309)} ${Y(150.5)} L ${X(342)} ${Y(149)} L ${X(342)} ${Y(158)} L ${X(309)} ${Y(158)} Z`}
        fill="#262626"
        stroke={PAPER}
        strokeWidth={sw(0.55)}
        opacity={0.95}
      />
      {/* the link bridge over the track: a white streamlined body with a dark band, the track passing underneath */}
      <path
        d={`M ${X(264)} ${Y(154.5)} C ${X(268)} ${Y(148.5)} ${X(302)} ${Y(147.5)} ${X(313)} ${Y(151)} L ${X(313)} ${Y(157)} C ${X(302)} ${Y(159.5)} ${X(272)} ${Y(159.5)} ${X(264)} ${Y(157.5)} Z`}
        fill={PAPER}
        stroke={INK}
        strokeWidth={sw(0.5)}
      />
      <path
        d={`M ${X(270)} ${Y(153)} C ${X(282)} ${Y(151.6)} ${X(298)} ${Y(151.4)} ${X(308)} ${Y(152.4)} L ${X(308)} ${Y(154.2)} C ${X(298)} ${Y(155)} ${X(282)} ${Y(155.1)} ${X(270)} ${Y(154.8)} Z`}
        fill="#4a4a4a"
      />
      {/* lit window bays along the bridge's glass band, so it reads as a solid body, not a hoop */}
      {Array.from({ length: 9 }, (_, n) => {
        const x = 273 + n * 4;
        return (
          <path
            key={`bw${n}`}
            d={`M ${X(x)} ${Y(152.6)} L ${X(x)} ${Y(154.6)}`}
            stroke={PAPER}
            strokeWidth={sw(1.4)}
            opacity={0.75}
          />
        );
      })}
      {/* the bridge is carried by the podium blocks: their lit faces either side of the track, and the deck's
          shadow line running into them, so it reads as built in rather than floating */}
      {[GAP[0], GAP[1]].map((x) => (
        <path
          key={x}
          d={`M ${X(x)} ${Y(PODIUM_TOP)} L ${X(x)} ${Y(170)}`}
          stroke={PAPER}
          strokeWidth={sw(0.9)}
          opacity={0.85}
        />
      ))}
      <path
        d={`M ${X(GAP[0] - 14)} ${Y(158.5)} L ${X(264)} ${Y(158)} M ${X(313)} ${Y(158)} L ${X(GAP[1] + 14)} ${Y(158.5)}`}
        stroke={PAPER}
        strokeWidth={sw(0.6)}
        opacity={0.7}
      />
      <rect
        x={X(GAP[0])}
        y={Y(159)}
        width={(GAP[1] - GAP[0]) * scale}
        height={4 * scale}
        fill={PAPER}
        opacity={0.12}
      />

      {/* east shell: dark glass, lattice, panels */}
      <path d={eastOutline} fill="#101010" />
      <g clipPath={`url(#${id}-east)`}>
        {east.map((c, i) => {
          const a = panelLight(c);
          return a > 0 ? (
            <path key={i} d={c.panel} fill={PAPER} opacity={a} />
          ) : null;
        })}
        <path
          d={east.map((c) => c.d).join(" ")}
          fill="none"
          stroke={lit > 0.86 ? PAPER : "#6a6a6a"}
          strokeWidth={sw(0.32)}
          opacity={lit > 0.86 ? 0.7 : 0.55}
        />
      </g>
      <path d={eastOutline} fill="none" stroke={PAPER} strokeWidth={sw(0.8)} />

      {/* west shell: its curled lip (inner face, darker) and the outer surface */}
      <path d={lip} fill="#1e1e1e" stroke={PAPER} strokeWidth={sw(0.6)} />
      {[0.2, 0.4, 0.6, 0.8].map((f, i) => {
        const p = map([24 + f * 18, 80 + f * 15]);
        return (
          <circle
            key={i}
            cx={p[0]}
            cy={p[1]}
            r={sw(0.9)}
            fill={PAPER}
            opacity={lit > f * 0.2 ? 0.9 : 0.35}
          />
        );
      })}
      <path d={westOutline} fill="#101010" />
      <g clipPath={`url(#${id}-west)`}>
        {west.map((c, i) => {
          const a = panelLight(c);
          return a > 0 ? (
            <path key={i} d={c.panel} fill={PAPER} opacity={a} />
          ) : null;
        })}
        <path
          d={west.map((c) => c.d).join(" ")}
          fill="none"
          stroke={lit > 0.86 ? PAPER : "#6a6a6a"}
          strokeWidth={sw(0.32)}
          opacity={lit > 0.86 ? 0.7 : 0.55}
        />
      </g>
      <path
        d={westOutline}
        fill="none"
        stroke={PAPER}
        strokeWidth={sw(0.9)}
        strokeLinejoin="round"
      />
    </g>
  );
};
