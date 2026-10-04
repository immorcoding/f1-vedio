// Fire, style B (user-approved 2026-10-04, prototype/fire-styles): a few big flame tongues with no outlines. Each
// tongue's centreline is bent by smooth noise that travels up it, so S-curves climb through the flame; one shared wind
// sways every tongue together; the tips taper and wisps tear off them and rise. Colour bands run red, orange, yellow and
// a white-yellow core, each band blurred and the whole fire's edges licked by a turbulence field that scrolls upward
// with the flame (feTurbulence + feDisplacementMap). Embers rise on curved paths; the heat haze ripples smoothly.
//
// Softness and licking are a CONSTANT size in screen pixels (B_BLUR_PX, B_DISP_PX, fixed noise frequency): they never
// scale with the fire's size on screen, so a fire zoomed into a panel has the same edges as the fire in a wide shot.
// This holds because every fire here is drawn in screen space (the user unit is one screen pixel).
//
// Nothing re-randomises per frame: all motion comes from smooth noise of time. Filter regions are cut to the frame (or
// to a panel): a region much bigger than the frame makes the browser rasterise the filter at reduced resolution.
//
// Smoke anywhere is manga bubble smoke (ART-20): BubbleSmoke over a fire, SmokeBurst behind a fireball on paper.
import { useId } from "react";
import { INK, PAPER } from "./colors";
import { TonePattern } from "./tone";

// The project's frame rate (src/mv/timing.ts FPS); the kit keeps no dependency on the MV.
const FPS = 60;

export type FirePalette = {
  readonly name: string;
  // the flame bands, outside in
  readonly red: string;
  readonly orange: string;
  readonly yellow: string;
  readonly core: string;
  // light thrown round the fire (radial glow); null: none (close-ups, black and white)
  readonly glow: string | null;
  readonly ember: string;
  readonly emberHot: string;
  // bubble smoke: puff fill, and the warm rim of firelight under each puff (null: none)
  readonly smoke: string;
  readonly smokeRim: string | null;
  // firelight on the rails and the ground (multiply wash); null: a faint paper pool instead
  readonly light: string | null;
};

export const FIRE_COLOR: FirePalette = {
  name: "color",
  red: "#d9301a",
  orange: "#ff8a1e",
  yellow: "#ffcf3a",
  core: "#fff6cf",
  glow: "#ff6a1a",
  ember: "#ffb43c",
  emberHot: "#fff3c4",
  smoke: "#77706b",
  smokeRim: "#ff9a3c",
  light: "#ff9a4a",
};

// The same fire in the page's black and white (the open ART-8 alternative): grey bands, a paper core.
export const FIRE_MANGA: FirePalette = {
  name: "manga",
  red: "#5c5c5c",
  orange: "#8e8e8e",
  yellow: "#c9c9c9",
  core: PAPER,
  glow: null,
  ember: PAPER,
  emberHot: PAPER,
  smoke: "#6f6f6f",
  smokeRim: null,
  light: null,
};

export const FIRE_PALETTES = { manga: FIRE_MANGA, color: FIRE_COLOR };
export type FirePaletteName = keyof typeof FIRE_PALETTES;

// B's softness in screen px: blur of the core band (the outer bands are multiples of it), and how far the noise licks
// the edges. Never scaled with zoom or panel size.
export const B_BLUR_PX = 2.5;
export const B_DISP_PX = 36;
const B_NOISE_FREQ = "0.0036 0.0032";

// A screen rectangle (the frame, or a panel) that filter regions are cut to.
export type ScreenRect = { x: number; y: number; w: number; h: number };
const FRAME: ScreenRect = { x: 0, y: 0, w: 1920, h: 1080 };

// ── smooth noise ──────────────────────────────────────────────────────────────────────────────
const hash = (i: number, s: number) => {
  let h = (Math.imul(i | 0, 374761393) + Math.imul(s | 0, 668265263)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967295;
};
// A string seed as a number (FNV-1a), so callers keep their readable seeds.
const seedOf = (s: string) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return (h >>> 0) % 100000;
};
const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
// 1-D gradient noise, about -1..1, C2-smooth.
const n1 = (x: number, s = 0) => {
  const i = Math.floor(x);
  const f = x - i;
  const g0 = hash(i, s) * 2 - 1;
  const g1 = hash(i + 1, s) * 2 - 1;
  const a = g0 * f;
  const b = g1 * (f - 1);
  return (a + (b - a) * fade(f)) * 2;
};
const fbm = (x: number, s = 0) =>
  n1(x, s) * 0.7 + n1(x * 2.1 + 3.7, s + 91) * 0.3;
// Firelight flicker, smooth, around 0.5.
const flicker = (t: number, s = 0) =>
  0.5 + 0.3 * n1(t * 2.3, s + 70) + 0.15 * n1(t * 5.3, s + 71);
// The shared wind: one slow sway for the whole fire, a little to the left on average.
const wind = (t: number) =>
  -0.25 + 0.55 * Math.sin(t * 0.9) + 0.35 * n1(t * 0.45, 7);

// ── shapes ────────────────────────────────────────────────────────────────────────────────────
type P = { x: number; y: number };
const fmt = (p: P) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`;

// Catmull-Rom through the points as cubic Béziers (continuing an open path).
const cr = (pts: P[]) => {
  let d = "";
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1 = { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 };
    const c2 = { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 };
    d += ` C ${fmt(c1)} ${fmt(c2)} ${fmt(p2)}`;
  }
  return d;
};

// A closed ribbon round a centreline with half-widths `hw` (0 at the tip gives a sharp point), cut off below `floor`.
const ribbon = (c: P[], hw: number[], floor = Infinity) => {
  const n = c.length;
  const L: P[] = [];
  const R: P[] = [];
  for (let i = 0; i < n; i++) {
    const a = c[Math.max(0, i - 1)];
    const b = c[Math.min(n - 1, i + 1)];
    const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
    const nx = -(b.y - a.y) / len;
    const ny = (b.x - a.x) / len;
    L.push({ x: c[i].x + nx * hw[i], y: Math.min(floor, c[i].y + ny * hw[i]) });
    R.push({ x: c[i].x - nx * hw[i], y: Math.min(floor, c[i].y - ny * hw[i]) });
  }
  R.reverse();
  return `M ${fmt(L[0])}${cr(L)} L ${fmt(R[0])}${cr(R)} Z`;
};

// A tapered ribbon along a line of points (thin at both ends, widest at `peak`): one brush stroke. Used by the
// extinguisher's powder (src/mv/parts/bahrain2020/powder.tsx), which is powder, not smoke.
export const strokeRibbon = (
  pts: { x: number; y: number }[],
  width: number,
  peak = 0.55,
) => {
  const n = pts.length;
  if (n < 2) return "";
  const side = (sgn: number) =>
    pts.map((p, i) => {
      const a = pts[Math.max(0, i - 1)];
      const b = pts[Math.min(n - 1, i + 1)];
      const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
      const u = i / (n - 1);
      const k = u < peak ? u / peak : (1 - u) / (1 - peak);
      const w = width * Math.sin((k * Math.PI) / 2) * 0.5;
      return {
        x: p.x - ((b.y - a.y) / len) * w * sgn,
        y: p.y + ((b.x - a.x) / len) * w * sgn,
      };
    });
  const L = side(1);
  const R = side(-1).reverse();
  const f = (p: { x: number; y: number }) =>
    `${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
  return `M ${L.map(f).join(" L ")} L ${R.map(f).join(" L ")} Z`;
};

// ── the flame model ───────────────────────────────────────────────────────────────────────────
type Tongue = { bx: number; W: number; H: number; s: number };

// How the tongues move: seconds; how fast the waves climb (cycles / s), how many waves fit on a tongue, how far they
// swing (× W); tip sharpness (width profile exponent); edge ripple (× width).
type Flow = {
  t: number;
  rise: number;
  wave: number;
  sway: number;
  taper: number;
  ripple: number;
};
const FLOW = { rise: 1.5, wave: 1.8, sway: 0.55, taper: 1.3, ripple: 0.18 };

const breathe = (tg: Tongue, t: number) =>
  0.86 + 0.2 * fbm(t * 0.85 + tg.s * 3.1, tg.s + 11);

// Centreline of a tongue (base at y = 0), sampled over v = 0..k of its height.
const centreline = (tg: Tongue, fl: Flow, k = 1, n = 16): P[] => {
  const H = tg.H * breathe(tg, fl.t);
  const w = wind(fl.t);
  return Array.from({ length: n + 1 }, (_, j) => {
    const v = (k * j) / n;
    const x =
      tg.bx +
      w * H * 0.16 * v ** 1.8 +
      fbm(v * fl.wave - fl.t * fl.rise, tg.s) * tg.W * fl.sway * v ** 1.1;
    return { x, y: -v * H };
  });
};

// Half-widths along a centreline of n+1 samples, `W` wide at the base.
const tongueWidths = (tg: Tongue, fl: Flow, W: number, n = 16, phase = 0) =>
  Array.from({ length: n + 1 }, (_, j) => {
    const u = j / n;
    const prof =
      (1 - u) ** fl.taper * (0.88 + 0.4 * Math.sin(Math.PI * u * 0.9));
    const rip =
      1 + fl.ripple * n1(u * 3.2 - fl.t * fl.rise * 1.3 + phase, tg.s + 5);
    return (W / 2) * prof * rip;
  });

// One band of a tongue: along its own centreline up to k of its height, wf of its width.
const bandD = (tg: Tongue, fl: Flow, k: number, wf: number) =>
  ribbon(centreline(tg, fl, k), tongueWidths(tg, fl, tg.W * wf, 16, k * 2), 3);

// The tongues of a fire `w` wide, `h` tall: tallest in the middle, overlapping at the base.
const makeTongues = (
  n: number,
  w: number,
  h: number,
  seed: number,
  intensity: number,
): Tongue[] =>
  Array.from({ length: n }, (_, i) => {
    const u = (i + 0.5) / n - 0.5;
    const tall =
      Math.max(0.3, 1 - 1.5 * Math.abs(u) ** 1.4) *
      (0.78 + 0.22 * hash(i, seed + 3));
    return {
      bx: u * w * 0.82 + (hash(i, seed + 1) - 0.5) * (w / n) * 0.3,
      W:
        (w / n) *
        (1.55 + 0.35 * hash(i, seed + 2)) *
        (0.6 + 0.4 * intensity) *
        1.15,
      H: h * tall * intensity,
      s: seed * 17 + i * 3 + 1,
    };
  });

// Wisps torn off the tips: each tongue sheds one every P seconds; it starts at the tip where it was at that moment and
// rises along the flow, shrinking.
const wisps = (tongues: Tongue[], fl: Flow, rate = 1.3) =>
  tongues.flatMap((tg, i) => {
    const P = (0.75 + 0.5 * hash(i, tg.s + 40)) / rate;
    const off = hash(i, tg.s + 41) * P;
    const life = 0.85;
    return [0, 1].flatMap((back) => {
      const k = Math.floor((fl.t - off) / P) - back;
      const tb = k * P + off;
      const age = (fl.t - tb) / life;
      if (age < 0 || age >= 1) return [];
      const tip = centreline(tg, { ...fl, t: tb }, 1, 16)[16];
      const Hw = tg.H * (0.16 + 0.08 * hash(k, tg.s + 42));
      const grow = Math.min(1, age / 0.18) * (1 - age) ** 0.9;
      const climb = tg.H * 0.55 * age + tg.H * 0.25 * age * age;
      const base = {
        x:
          tip.x +
          wind(fl.t) * tg.H * 0.12 * age +
          n1(age * 1.5, k + tg.s) * tg.W * 0.15,
        y: tip.y - climb - Hw * 0.15,
      };
      const n = 10;
      const c = Array.from({ length: n + 1 }, (_, j) => {
        const v = j / n;
        return {
          x:
            base.x +
            n1(v * 1.6 - fl.t * fl.rise + k, tg.s + 43) * Hw * 0.2 * grow,
          y: base.y - v * Hw * (0.4 + 0.6 * grow),
        };
      });
      const hw = c.map((_, j) => {
        const u = j / n;
        return Hw * 0.22 * grow * Math.sin(Math.PI * u) ** 0.8 * (1 - u * 0.4);
      });
      return [{ d: ribbon(c, hw), age, grow }];
    });
  });

// ── light, embers, smoke, haze ────────────────────────────────────────────────────────────────
// The radial glow round a fire (base at y = 0).
const Glow: React.FC<{
  w: number;
  h: number;
  t: number;
  color: string;
  strength?: number;
  seed?: number;
}> = ({ w, h, t, color, strength = 0.55, seed = 0 }) => {
  const id = `glow${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  return (
    <>
      <defs>
        <radialGradient id={id}>
          <stop offset="0%" stopColor={color} stopOpacity={strength} />
          <stop offset="45%" stopColor={color} stopOpacity={strength * 0.4} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </radialGradient>
      </defs>
      <ellipse
        cx={0}
        cy={-h * 0.4}
        rx={w * 1.3}
        ry={h * 0.95}
        fill={`url(#${id})`}
        opacity={0.75 + 0.35 * flicker(t, seed)}
      />
    </>
  );
};

// Embers rising out of a fire (base at y = 0, flames `h` tall, `w` wide) on curved paths: each lives 1.2–2.2 s,
// accelerates upward, drifts with the wind and swings on a slow spiral; a short streak along its path, a bright head
// and a soft glow.
export const Embers: React.FC<{
  w: number;
  h: number;
  frame: number;
  seed: string;
  palette: FirePalette;
  count: number;
  // embers' size, px
  size: number;
}> = ({ w, h, frame, seed, palette, count, size }) => {
  const t = frame / FPS;
  const sd = seedOf(seed);
  return (
    <g>
      {Array.from({ length: count }, (_, i) => {
        const life = 1.2 + hash(i, sd + 50) * 1.0;
        const off = hash(i, sd + 51) * life;
        const gen = Math.floor((t + off) / life);
        const age = (t + off) / life - gen;
        const R = (k: number) => hash(gen * 31 + i, sd + k);
        const x0 = (R(52) - 0.5) * w * 0.8;
        const y0 = -h * (0.3 + 0.35 * R(53));
        const sp = h * (0.25 + 0.25 * R(54));
        const amp = w * (0.04 + 0.06 * R(55));
        const om = 3 + 3 * R(56);
        const ph = R(57) * 6.28;
        const pos = (a: number) => {
          const s = a * life;
          return {
            x:
              x0 +
              wind(t) * h * 0.12 * s ** 1.4 +
              Math.sin(om * s + ph) * amp * (0.3 + s),
            y: y0 - sp * s - h * 0.18 * s * s,
          };
        };
        const tail = [0, 1, 2, 3].map((k) => pos(Math.max(0, age - k * 0.005)));
        const r = size * (0.6 + 0.6 * R(58)) * (1 - age * 0.5);
        const op =
          Math.min(1, age / 0.08) * (age > 0.6 ? (1 - age) / 0.4 : 1);
        return (
          <g key={i} opacity={op * (0.75 + 0.25 * n1(t * 9 + i, sd))}>
            <circle
              cx={tail[0].x}
              cy={tail[0].y}
              r={r * 3}
              fill={palette.ember}
              opacity={0.25}
            />
            <path
              d={`M ${fmt(tail[0])}${cr(tail)}`}
              stroke={palette.ember}
              strokeWidth={r * 1.1}
              strokeLinecap="round"
              fill="none"
            />
            <circle cx={tail[0].x} cy={tail[0].y} r={r * 0.95} fill={palette.ember} />
            <circle cx={tail[0].x} cy={tail[0].y} r={r * 0.5} fill={palette.emberHot} />
          </g>
        );
      })}
    </g>
  );
};

// Manga bubble smoke (ART-20) rising over a fire whose tips are `top` px above the base (y = 0): round puffs, each a
// cluster of overlapping circles with one ink outline round the cluster, a smoke-grey fill with a dot screen, and a warm
// rim of firelight on the underside. The puffs leave the flame tips, rise `rise` px, swell, drift with the wind and fade
// near the top. Every frame moves.
export const BubbleSmoke: React.FC<{
  w: number;
  top: number;
  rise: number;
  frame: number;
  seed: string;
  palette: FirePalette;
  count?: number;
  // puff size (× the default, which is set by `w`)
  size?: number;
  // the firelight rim under the puffs (off once the fire is out)
  warm?: boolean;
  opacity?: number;
}> = ({
  w,
  top,
  rise,
  frame,
  seed,
  palette,
  count = 7,
  size = 1,
  warm = true,
  opacity = 1,
}) => {
  const id = `bs${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const t = frame / FPS;
  const sd = seedOf(seed);
  const puffs = Array.from({ length: count }, (_, i) => {
    const life = 2.6 + 0.8 * hash(i, sd + 60);
    const off = (i / count) * life + hash(i, sd + 61) * 0.4;
    const gen = Math.floor((t + off) / life);
    const age = (t + off) / life - gen;
    const R = (k: number) => hash(gen * 13 + i, sd + k);
    const x0 = (R(62) - 0.5) * w * 0.45;
    const r = w * size * (0.11 + 0.05 * R(63)) * (0.6 + 1.0 * age);
    const cx =
      x0 + wind(t) * rise * 0.25 * age + n1(age * 2 + i, sd + 64) * w * 0.05;
    const cy = -top - rise * age;
    const spin = t * 0.25 * (R(65) > 0.5 ? 1 : -1);
    const lobes = Array.from({ length: 4 }, (_, k) => {
      const a = spin + (k / 4) * Math.PI * 2 + R(66 + k) * 0.8;
      const d = r * (k === 0 ? 0 : 0.62);
      return {
        x: cx + Math.cos(a) * d,
        y: cy + Math.sin(a) * d * 0.8,
        r: r * (k === 0 ? 1 : 0.62 + 0.15 * R(70 + k)),
      };
    });
    const op = Math.min(1, age / 0.12) * (age > 0.65 ? (1 - age) / 0.35 : 1);
    return { lobes, op, age, r };
  }).sort((a, b) => b.age - a.age);
  const lw = Math.min(6, Math.max(2.5, w * 0.006));
  const rim = warm ? palette.smokeRim : null;
  return (
    <g opacity={opacity}>
      <defs>
        <TonePattern id={`${id}-dots`} r={1.9} gap={7} />
      </defs>
      {puffs.map((p, i) => (
        <g key={i} opacity={p.op}>
          {p.lobes.map((l, k) => (
            <circle
              key={`s${k}`}
              cx={l.x}
              cy={l.y}
              r={l.r}
              fill={INK}
              stroke={INK}
              strokeWidth={lw * 2}
            />
          ))}
          {p.lobes.map((l, k) => (
            <circle key={`f${k}`} cx={l.x} cy={l.y} r={l.r} fill={palette.smoke} />
          ))}
          {p.lobes.map((l, k) => (
            <circle
              key={`d${k}`}
              cx={l.x}
              cy={l.y}
              r={l.r}
              fill={`url(#${id}-dots)`}
            />
          ))}
          {rim ? (
            <path
              d={`M ${p.lobes[0].x - p.r * 1.25} ${p.lobes[0].y + p.r * 0.55} A ${p.r * 1.45} ${p.r * 1.3} 0 0 0 ${p.lobes[0].x + p.r * 1.25} ${p.lobes[0].y + p.r * 0.55}`}
              fill="none"
              stroke={rim}
              strokeWidth={lw * 1.3}
              strokeLinecap="round"
              opacity={0.9 * (1 - p.age) ** 1.5}
            />
          ) : null}
        </g>
      ))}
    </g>
  );
};

// Heat shimmer: draws `children`, then a copy of them warped by turbulence and shown only inside an ellipse (the hot air
// over a fire). The turbulence pattern scrolls upward smoothly (the filtered group is shifted one way and its contents
// the other), so the air ripples continuously instead of re-seeding every frame. Put the background the heat rises in
// front of into it.
export const HeatShimmer: React.FC<{
  frame: number;
  // the hot zone, screen px
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  // how far the air bends the picture, px
  scale?: number;
  // filter regions are cut to this (default: the frame)
  clip?: ScreenRect;
  children: React.ReactNode;
}> = ({ frame, cx, cy, rx, ry, scale = 14, clip = FRAME, children }) => {
  const id = `shim${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const scroll = -(frame / FPS) * 90;
  const M = scale + 8;
  const x0 = Math.max(cx - rx * 1.2, clip.x - M);
  const x1 = Math.min(cx + rx * 1.2, clip.x + clip.w + M);
  const y0 = Math.max(cy - ry * 1.2, clip.y - M);
  const y1 = Math.min(cy + ry * 1.2, clip.y + clip.h + M);
  if (x1 <= x0 || y1 <= y0) return <g>{children}</g>;
  return (
    <g>
      {children}
      <defs>
        <filter
          id={`${id}-f`}
          x={x0}
          y={y0 - scroll}
          width={x1 - x0}
          height={y1 - y0}
          filterUnits="userSpaceOnUse"
        >
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.006 0.022"
            numOctaves={2}
            seed={4}
            result="n"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="n"
            scale={scale}
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
        <radialGradient id={`${id}-g`}>
          <stop offset="0%" stopColor="#fff" stopOpacity={1} />
          <stop offset="65%" stopColor="#fff" stopOpacity={0.8} />
          <stop offset="100%" stopColor="#fff" stopOpacity={0} />
        </radialGradient>
        <mask id={`${id}-m`} maskUnits="userSpaceOnUse">
          <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={`url(#${id}-g)`} />
        </mask>
      </defs>
      <g mask={`url(#${id}-m)`}>
        <g transform={`translate(0 ${scroll})`} filter={`url(#${id}-f)`}>
          <g transform={`translate(0 ${-scroll})`}>{children}</g>
        </g>
      </g>
    </g>
  );
};

// Warm firelight on the rails and the ground round (cx, cy): a multiply wash (white paper turns warm, ink stays ink)
// plus a screen wash that lifts the dark asphalt, both flickering with the fire. In black and white: a faint paper pool.
export const FireLight: React.FC<{
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  frame: number;
  palette: FirePalette;
  // 0–1, with the fire's intensity
  amount: number;
}> = ({ cx, cy, rx, ry, frame, palette, amount }) => {
  const id = `fl${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const k = Math.min(1, amount * (0.8 + 0.4 * flicker(frame / FPS, 3)));
  if (!palette.light || !palette.glow) {
    return (
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={PAPER} opacity={0.12 * amount} />
    );
  }
  return (
    <g>
      <defs>
        <radialGradient id={`${id}-m`}>
          <stop offset="0%" stopColor={palette.light} />
          <stop offset="55%" stopColor="#ffc896" />
          <stop offset="100%" stopColor="#ffffff" />
        </radialGradient>
        <radialGradient id={`${id}-s`}>
          <stop offset="0%" stopColor={palette.glow} stopOpacity={0.55} />
          <stop offset="100%" stopColor={palette.glow} stopOpacity={0} />
        </radialGradient>
      </defs>
      <ellipse
        cx={cx}
        cy={cy}
        rx={rx}
        ry={ry}
        fill={`url(#${id}-m)`}
        style={{ mixBlendMode: "multiply" }}
        opacity={k}
      />
      <ellipse
        cx={cx}
        cy={cy}
        rx={rx * 0.9}
        ry={ry * 0.8}
        fill={`url(#${id}-s)`}
        style={{ mixBlendMode: "screen" }}
        opacity={k}
      />
    </g>
  );
};

// ── the fire ──────────────────────────────────────────────────────────────────────────────────
export type FireProps = {
  // Middle of the fire's base, on screen.
  x: number;
  y: number;
  // Width of the base and height of the tallest tongue, px.
  w: number;
  h: number;
  // Composition frame (time = frame / 60 s; the flames move smoothly every frame).
  frame: number;
  seed: string;
  palette: FirePalette;
  // 0–1: how far the fire has grown.
  intensity?: number;
  // How many big tongues (default from the fire's proportions: few, big ones).
  tongues?: number;
  // Draw the bubble smoke above the fire.
  smoke?: boolean;
  // How many embers (default twice the tongues).
  embers?: number;
  // Filter regions are cut to this screen rectangle (default: the frame); pass a panel's rectangle in a panel.
  clip?: ScreenRect;
};

export const Fire: React.FC<FireProps> = ({
  x,
  y,
  w,
  h,
  frame,
  seed,
  palette,
  intensity = 1,
  tongues,
  smoke = true,
  embers,
  clip = FRAME,
}) => {
  const id = `fire${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const sd = seedOf(seed);
  const t = frame / FPS;
  const fl: Flow = { t, ...FLOW };
  const n =
    tongues ?? Math.max(3, Math.min(8, Math.round(4 + (1.5 * w) / h)));
  const tg = makeTongues(n, w, h, sd, intensity);
  const ws = wisps(tg, fl);
  const scroll = -t * h * 0.55;
  // the filter region in the fire's own coordinates: its reach, cut to the clip rectangle (plus a margin)
  const M = B_DISP_PX + 24;
  const rx0 = Math.max(-w * 1.5, clip.x - x - M);
  const rx1 = Math.min(w * 1.5, clip.x + clip.w - x + M);
  const ry0 = Math.max(-h * 2.2, clip.y - y - M);
  const ry1 = Math.min(h * 0.4, clip.y + clip.h - y + M);
  const visible = rx1 > rx0 && ry1 > ry0;
  const region = {
    x: rx0,
    y: ry0,
    width: Math.max(1, rx1 - rx0),
    height: Math.max(1, ry1 - ry0),
  };
  const band = (
    k: number,
    wf: number,
    fill: string,
    op: number,
    blur: number,
    key: string,
  ) => (
    <g key={key} filter={`url(#${id}-${key})`} opacity={op}>
      <defs>
        <filter id={`${id}-${key}`} {...region} filterUnits="userSpaceOnUse">
          <feGaussianBlur stdDeviation={blur} />
        </filter>
      </defs>
      {tg.map((x, i) => (
        <path key={i} d={bandD(x, fl, k, wf)} fill={fill} />
      ))}
    </g>
  );
  return (
    <g transform={`translate(${x} ${y})`}>
      {palette.glow ? (
        <Glow
          w={w}
          h={h * intensity}
          t={t}
          color={palette.glow}
          strength={0.7}
          seed={sd}
        />
      ) : null}
      {smoke ? (
        <BubbleSmoke
          w={w}
          top={h * intensity * 0.85}
          rise={h * 1.4}
          frame={frame}
          seed={seed}
          palette={palette}
        />
      ) : null}
      {visible ? (
        <>
          <defs>
            <filter
              id={`${id}-d`}
              {...region}
              y={region.y - scroll}
              filterUnits="userSpaceOnUse"
            >
              <feTurbulence
                type="fractalNoise"
                baseFrequency={B_NOISE_FREQ}
                numOctaves={2}
                seed={sd % 997}
                result="n"
              />
              <feDisplacementMap
                in="SourceGraphic"
                in2="n"
                scale={B_DISP_PX}
                xChannelSelector="R"
                yChannelSelector="G"
              />
            </filter>
            <filter id={`${id}-w`} {...region} filterUnits="userSpaceOnUse">
              <feGaussianBlur stdDeviation={B_BLUR_PX * 1.6} />
            </filter>
          </defs>
          {/* the noise scrolls up with the flame: shift the filtered group, shift its contents back */}
          <g transform={`translate(0 ${scroll})`} filter={`url(#${id}-d)`}>
            <g transform={`translate(0 ${-scroll})`}>
              {band(1, 1, palette.red, 0.92, B_BLUR_PX * 2.2, "r")}
              {band(0.8, 0.72, palette.orange, 0.95, B_BLUR_PX * 1.6, "o")}
              {band(0.55, 0.46, palette.yellow, 0.95, B_BLUR_PX * 1.3, "y")}
              {band(0.36, 0.28, palette.core, 1, B_BLUR_PX, "c")}
              {/* the white-hot mass at the base, glowing through */}
              <ellipse
                cx={0}
                cy={-h * intensity * 0.08}
                rx={Math.min(w * 0.36, h * 0.3)}
                ry={h * intensity * 0.1}
                fill={palette.core}
                opacity={0.75 + 0.2 * flicker(t, sd + 5)}
                filter={`url(#${id}-w)`}
              />
              <g filter={`url(#${id}-w)`}>
                {ws.map((x, i) => (
                  <path
                    key={i}
                    d={x.d}
                    fill={x.grow > 0.55 ? palette.orange : palette.red}
                    opacity={0.9 * (1 - x.age * 0.6)}
                  />
                ))}
              </g>
            </g>
          </g>
        </>
      ) : null}
      <Embers
        w={w}
        h={h * intensity}
        frame={frame}
        seed={seed}
        palette={palette}
        count={embers ?? n * 2}
        size={Math.min(6, Math.max(2, h * 0.005))}
      />
    </g>
  );
};

// ── the fireball ──────────────────────────────────────────────────────────────────────────────
// A burst of dark manga bubble smoke behind a fireball on paper (ART-20): round puffs on a ragged ring round the burst,
// mostly upward and to the sides, a few in the middle. Kept small enough that the car under the fireball still reads.
const burstPuffs = (R0: number) =>
  Array.from({ length: 16 }, (_, i) => {
    const ring = i < 12;
    const a = ring
      ? -Math.PI / 2 +
        ((i + 0.5) / 12 - 0.5) * Math.PI * 1.45 +
        (hash(i, 80) - 0.5) * 0.3
      : hash(i, 81) * Math.PI * 2;
    const up = Math.max(0, -Math.sin(a));
    const d = ring
      ? R0 * (0.48 + 0.28 * up + 0.08 * hash(i, 82))
      : R0 * 0.22 * hash(i, 83);
    return {
      x: Math.cos(a) * d * 0.75,
      y: Math.sin(a) * d - R0 * 0.28,
      r: R0 * (ring ? 0.16 + 0.07 * hash(i, 84) + 0.04 * up : 0.3),
    };
  });

const SmokeBurst: React.FC<{ R0: number; id: string }> = ({ R0, id }) => {
  const puffs = burstPuffs(R0);
  const lw = Math.min(6, Math.max(3, R0 * 0.012));
  return (
    <g>
      <defs>
        <TonePattern id={`${id}-dots`} r={2.2} gap={7} />
      </defs>
      {puffs.map((p, i) => (
        <circle
          key={`s${i}`}
          cx={p.x}
          cy={p.y}
          r={p.r}
          fill={INK}
          stroke={INK}
          strokeWidth={lw * 2}
        />
      ))}
      {puffs.map((p, i) => (
        <circle key={`f${i}`} cx={p.x} cy={p.y} r={p.r} fill="#3b3734" />
      ))}
      {puffs.map((p, i) => (
        <circle
          key={`d${i}`}
          cx={p.x}
          cy={p.y}
          r={p.r}
          fill={`url(#${id}-dots)`}
        />
      ))}
      {/* each puff's lower edge drawn again in ink, so the cluster reads as bubbles, not one blob */}
      {puffs.map((p, i) => (
        <path
          key={`e${i}`}
          d={`M ${p.x - p.r * 0.92} ${p.y + p.r * 0.38} A ${p.r} ${p.r} 0 0 0 ${p.x + p.r * 0.92} ${p.y + p.r * 0.38}`}
          fill="none"
          stroke={INK}
          strokeWidth={lw * 0.8}
          strokeLinecap="round"
        />
      ))}
    </g>
  );
};

// A fireball bursting out of a point (the fuel cell rupturing): B flame tongues thrown out all round and mostly upward
// in the four soft colour bands, round a hot disc, growing fast and lifting as it burns. `age` = frames since it lit;
// `r` = full reach of the tallest tongue, px. `backing`: it is drawn on a light page (the 3.3 freeze), so a dark
// bubble-smoke burst goes behind it and its glow is clipped to fire and smoke, never tinting the page.
export const Fireball: React.FC<{
  x: number;
  y: number;
  r: number;
  age: number;
  seed: string;
  palette: FirePalette;
  backing?: boolean;
}> = ({ x, y, r, age, seed, palette, backing = false }) => {
  const id = `ball${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  if (age < 0) return null;
  const sd = seedOf(seed);
  const t = age / FPS;
  const grow = 1 - Math.exp(-age / 5);
  const R0 = r * (0.2 + 0.8 * grow);
  const lift = r * 0.006 * age; // the hot mass rises
  const fl: Flow = { t, ...FLOW, sway: 0.5 };
  const n = 12;
  const tongues = Array.from({ length: n }, (_, i) => {
    const a = -90 + ((i + 0.5) / n - 0.5) * 250 + (hash(i, sd + 9) - 0.5) * 14;
    const up = Math.cos(((a + 90) * Math.PI) / 180);
    const tg: Tongue = {
      bx: 0,
      W: R0 * (0.62 + 0.2 * hash(i, sd + 10)),
      H: R0 * (0.55 + 0.75 * Math.max(0, up)) * (0.8 + 0.3 * hash(i, sd + 11)),
      s: sd + i * 5 + 3,
    };
    return { a, tg };
  });
  const band = (
    k: number,
    wf: number,
    disc: number,
    fill: string,
    op: number,
    blur: number,
    key: string,
  ) => (
    <g key={key} filter={`url(#${id}-${key})`} opacity={op}>
      <defs>
        <filter id={`${id}-${key}`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation={blur} />
        </filter>
      </defs>
      {tongues.map(({ a, tg }, i) => (
        <path
          key={i}
          d={bandD(tg, fl, k, wf)}
          transform={`rotate(${a + 90}) translate(0 ${R0 * 0.12})`}
          fill={fill}
        />
      ))}
      <ellipse rx={R0 * disc} ry={R0 * disc} fill={fill} />
    </g>
  );
  return (
    <g transform={`translate(${x} ${y - lift})`}>
      {backing ? (
        <>
          <SmokeBurst R0={R0} id={id} />
          {palette.glow ? (
            <g>
              <defs>
                <clipPath id={`${id}-clip`}>
                  {burstPuffs(R0).map((p, i) => (
                    <circle key={i} cx={p.x} cy={p.y} r={p.r} />
                  ))}
                </clipPath>
              </defs>
              <g clipPath={`url(#${id}-clip)`}>
                <Glow
                  w={R0 * 1.2}
                  h={R0 * 1.8}
                  t={t}
                  color={palette.glow}
                  strength={0.6}
                />
              </g>
            </g>
          ) : null}
        </>
      ) : palette.glow ? (
        <Glow w={R0 * 1.6} h={R0 * 1.6} t={t} color={palette.glow} strength={0.7} />
      ) : null}
      {band(1, 1, 0.45, palette.red, 0.92, B_BLUR_PX * 2.2, "r")}
      {band(0.78, 0.72, 0.36, palette.orange, 0.95, B_BLUR_PX * 1.6, "o")}
      {band(0.55, 0.46, 0.26, palette.yellow, 0.95, B_BLUR_PX * 1.3, "y")}
      {band(0.36, 0.28, 0.17, palette.core, 1, B_BLUR_PX, "c")}
    </g>
  );
};
