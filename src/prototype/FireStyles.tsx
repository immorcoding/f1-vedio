// PROTOTYPE (throwaway): which fire style should Bahrain 2020 use? The user found the shipped fire "太乱" and wants it
// "更灵动". Same shot (3.4, the wreck at the barrier, bars 62–65, same camera dolly, same heartbeat) with only the fire
// swapped. Compositions Proto-Fire-Baseline / -A / -B / -C / -D, 4 s each, with the score from bar 62.
//
// All variants share one motion model: a handful of big tongues whose centrelines are bent by a smooth 1-D noise field
// that travels up the tongue (so S-curves rise through the flame), one shared wind that sways every tongue together,
// a breathing height, and wisps that tear off the tips and rise along the same flow. No per-frame randomness.
import { Audio } from "@remotion/media";
import { useId } from "react";
import { AbsoluteFill, staticFile, useCurrentFrame } from "remotion";
import { MangaCar, VF20 } from "../cars";
import type { Camera } from "../kit/camera";
import { INK, PAPER } from "../kit/colors";
import { ToneDefs, TonePattern } from "../kit/tone";
import { SCORE } from "../mv/MV";
import { BentGuardrail, type Deflection } from "../mv/parts/bahrain2020/bent-rail";
import { NightBackdrop } from "../mv/parts/bahrain2020/night";
import {
  CELL_FROM,
  heartbeat,
  RUN,
  Vignette,
  WRECK_BEND,
  WRECK_CAM,
  WreckShot,
  zoomCam,
} from "../mv/parts/bahrain2020/Wreck";
import {
  BARRIER_Z,
  CELL_ANCHOR_X,
  CELL_POSE,
  CELL_Z,
  HALO_WORLD,
  REAR_ANCHOR_X,
  REAR_POSE,
  REAR_Z,
} from "../mv/parts/bahrain2020/wreck-geometry";
import { ramp, shotById } from "../mv/parts/bahrain2020/common";
import { at, frameAt, FPS } from "../mv/timing";

export const FIRE_CLIP_START = frameAt(at(62));
export const FIRE_CLIP_FRAMES = 240;

// ── smooth noise ──────────────────────────────────────────────────────────────────────────────
export const hash = (i: number, s: number) => {
  let h = (Math.imul(i | 0, 374761393) + Math.imul(s | 0, 668265263)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967295;
};
const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
// 1-D gradient noise, about -1..1, C2-smooth.
export const n1 = (x: number, s = 0) => {
  const i = Math.floor(x);
  const f = x - i;
  const g0 = hash(i, s) * 2 - 1;
  const g1 = hash(i + 1, s) * 2 - 1;
  const a = g0 * f;
  const b = g1 * (f - 1);
  return (a + (b - a) * fade(f)) * 2;
};
export const fbm = (x: number, s = 0) => n1(x, s) * 0.7 + n1(x * 2.1 + 3.7, s + 91) * 0.3;
const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

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

// A closed ribbon round a centreline with half-widths `hw` (0 at the tip gives a sharp point; 0 at both ends a sliver).
export const ribbon = (c: P[], hw: number[], floor = Infinity) => {
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

// The open stroke along one side of a ribbon, between fractions a..b of its length (ink accents).
const sideStroke = (c: P[], hw: number[], side: 1 | -1, a: number, b: number) => {
  const n = c.length;
  const pts: P[] = [];
  for (let i = Math.round(a * (n - 1)); i <= Math.round(b * (n - 1)); i++) {
    const p = c[Math.max(0, i - 1)];
    const q = c[Math.min(n - 1, i + 1)];
    const len = Math.hypot(q.x - p.x, q.y - p.y) || 1;
    pts.push({
      x: c[i].x - ((q.y - p.y) / len) * hw[i] * side,
      y: c[i].y + ((q.x - p.x) / len) * hw[i] * side,
    });
  }
  return pts.length > 1 ? `M ${fmt(pts[0])}${cr(pts)}` : "";
};

// ── the flame model ───────────────────────────────────────────────────────────────────────────
export type Tongue = { bx: number; W: number; H: number; s: number; hook: number };

export type Flow = {
  // seconds
  t: number;
  // how fast the waves climb (cycles / s), how many waves fit on a tongue, how far they swing (× W)
  rise: number;
  wave: number;
  sway: number;
  // tip hook (× H), for manga curls
  curl: number;
  // tip sharpness: width profile exponent
  taper: number;
  // edge ripple (× width)
  ripple: number;
  // cel loop: periodic waves (period 1 s of t) instead of the noise field, so the poses cycle
  loop?: boolean;
};

const TAU = Math.PI * 2;
// The travelling wave on a tongue: smooth noise, or for a cel loop two sines with whole-number periods in t.
const wave = (x: number, fl: Flow, s: number) =>
  fl.loop
    ? 0.65 * Math.sin(TAU * x + s * 2.3) + 0.35 * Math.sin(TAU * 2 * x + s * 5.1)
    : fbm(x, s);

// The shared wind: one slow sway for the whole fire, a little to the left on average.
const wind = (t: number) => -0.25 + 0.55 * Math.sin(t * 0.9) + 0.35 * n1(t * 0.45, 7);

const breathe = (tg: Tongue, t: number, loop = false) =>
  loop
    ? 0.92 + 0.1 * Math.sin(TAU * t + tg.s * 1.7)
    : 0.86 + 0.2 * fbm(t * 0.85 + tg.s * 3.1, tg.s + 11);

// Centreline of a tongue (base at y = 0), sampled over v = 0..k of its height.
const centreline = (tg: Tongue, fl: Flow, k = 1, n = 16): P[] => {
  const H = tg.H * breathe(tg, fl.t, fl.loop);
  const w = fl.loop ? -0.2 + 0.25 * Math.sin((TAU * fl.t) / 2) : wind(fl.t);
  return Array.from({ length: n + 1 }, (_, j) => {
    const v = (k * j) / n;
    const x =
      tg.bx +
      w * H * 0.16 * v ** 1.8 +
      wave(v * fl.wave - fl.t * fl.rise, fl, tg.s) * tg.W * fl.sway * v ** 1.1 +
      tg.hook * H * fl.curl * smooth(0.55, 1, v) ** 2;
    return { x, y: -v * H };
  });
};

// Half-widths along a centreline of n+1 samples covering u = 0..1 of the shape, `W` wide at the base.
const tongueWidths = (tg: Tongue, fl: Flow, W: number, n = 16, phase = 0) =>
  Array.from({ length: n + 1 }, (_, j) => {
    const u = j / n;
    const prof = (1 - u) ** fl.taper * (0.88 + 0.4 * Math.sin(Math.PI * u * 0.9));
    const rip =
      1 +
      fl.ripple *
        (fl.loop
          ? Math.sin(TAU * (u * 1.6 - 2 * fl.t) + phase + tg.s)
          : n1(u * 3.2 - fl.t * fl.rise * 1.3 + phase, tg.s + 5));
    return (W / 2) * prof * rip;
  });

// A layer of a tongue: along its own centreline up to k of its height, `wf` of its width.
const layerPath = (tg: Tongue, fl: Flow, k: number, wf: number) => {
  const c = centreline(tg, fl, k);
  return { c, hw: tongueWidths(tg, fl, tg.W * wf, 16, k * 2), d: "" };
};
export const layerD = (tg: Tongue, fl: Flow, k: number, wf: number) => {
  const l = layerPath(tg, fl, k, wf);
  return ribbon(l.c, l.hw, 3);
};

// The tongues of a fire `w` wide, `h` tall: tallest in the middle, overlapping at the base.
const makeTongues = (n: number, w: number, h: number, seed: number, intensity: number): Tongue[] =>
  Array.from({ length: n }, (_, i) => {
    const u = (i + 0.5) / n - 0.5;
    const s = seed * 17 + i * 3 + 1;
    const tall = Math.max(0.3, 1 - 1.5 * Math.abs(u) ** 1.4) * (0.78 + 0.22 * hash(i, seed + 3));
    return {
      bx: u * w * 0.82 + (hash(i, seed + 1) - 0.5) * (w / n) * 0.3,
      W: (w / n) * (1.55 + 0.35 * hash(i, seed + 2)) * (0.6 + 0.4 * intensity),
      H: h * tall * intensity,
      s,
      hook: i % 2 === 0 ? 1 : -1,
    };
  });

// Wisps torn off the tips: each tongue sheds one every P seconds; it starts at the tip where it was at that moment and
// rises along the flow, shrinking. Returns centreline + widths of each live wisp.
const wisps = (tongues: Tongue[], fl: Flow, rate = 1) =>
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
        x: tip.x + wind(fl.t) * tg.H * 0.12 * age + n1(age * 1.5, k + tg.s) * tg.W * 0.15,
        y: tip.y - climb - Hw * 0.15,
      };
      const n = 10;
      const c = Array.from({ length: n + 1 }, (_, j) => {
        const v = j / n;
        return {
          x: base.x + n1(v * 1.6 - fl.t * fl.rise + k, tg.s + 43) * Hw * 0.2 * grow,
          y: base.y - v * Hw * (0.4 + 0.6 * grow),
        };
      });
      const hw = c.map((_, j) => {
        const u = j / n;
        return Hw * 0.22 * grow * Math.sin(Math.PI * u) ** 0.8 * (1 - u * 0.4);
      });
      return [{ c, hw, age, grow }];
    });
  });

// ── light, embers, haze ───────────────────────────────────────────────────────────────────────
// Firelight flicker, smooth, 0..1-ish around 0.5.
export const flicker = (t: number, s = 0) => 0.5 + 0.3 * n1(t * 2.3, s + 70) + 0.15 * n1(t * 5.3, s + 71);

export const Glow: React.FC<{ w: number; h: number; t: number; color: string; strength?: number; seed?: number }> = ({
  w,
  h,
  t,
  color,
  strength = 0.55,
  seed = 0,
}) => {
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

// Embers rising on curved paths: each lives 1.2–2.2 s, accelerates upward, drifts with the wind and swings on a slow
// spiral. Drawn as a short tapered streak along its own path plus a bright head.
export const Embers: React.FC<{
  w: number;
  h: number;
  t: number;
  seed: number;
  count: number;
  size: number;
  color: string;
  hot: string;
  outline?: string;
  glow?: boolean;
  // hold the embers on twos (C)
  hold?: number;
}> = ({ w, h, t, seed, count, size, color, hot, outline, glow }) => (
  <g>
    {Array.from({ length: count }, (_, i) => {
      const life = 1.2 + hash(i, seed + 50) * 1.0;
      const off = hash(i, seed + 51) * life;
      const gen = Math.floor((t + off) / life);
      const age = (t + off) / life - gen;
      const R = (k: number) => hash(gen * 31 + i, seed + k);
      const x0 = (R(52) - 0.5) * w * 0.8;
      const y0 = -h * (0.3 + 0.35 * R(53));
      const sp = h * (0.25 + 0.25 * R(54));
      const amp = w * (0.04 + 0.06 * R(55));
      const om = 3 + 3 * R(56);
      const ph = R(57) * 6.28;
      const pos = (a: number) => {
        const s = a * life;
        return {
          x: x0 + wind(t) * h * 0.12 * s ** 1.4 + Math.sin(om * s + ph) * amp * (0.3 + s),
          y: y0 - sp * s - h * 0.18 * s * s,
        };
      };
      const tail = [0, 1, 2, 3].map((k) => pos(Math.max(0, age - k * 0.005)));
      const r = size * (0.6 + 0.6 * R(58)) * (1 - age * 0.5);
      const op = Math.min(1, age / 0.08) * (age > 0.6 ? (1 - age) / 0.4 : 1);
      const d = `M ${fmt(tail[0])}${cr(tail)}`;
      return (
        <g key={i} opacity={op * (0.75 + 0.25 * n1(t * 9 + i, seed))}>
          {glow ? <circle cx={tail[0].x} cy={tail[0].y} r={r * 3} fill={color} opacity={0.25} /> : null}
          {outline ? (
            <path d={d} stroke={outline} strokeWidth={r * 1.1 + 2.5} strokeLinecap="round" fill="none" />
          ) : null}
          <path d={d} stroke={color} strokeWidth={r * 1.1} strokeLinecap="round" fill="none" />
          <circle cx={tail[0].x} cy={tail[0].y} r={r * 0.95} fill={color} />
          <circle cx={tail[0].x} cy={tail[0].y} r={r * 0.5} fill={hot} />
        </g>
      );
    })}
  </g>
);

// Manga bubble smoke (ART-20): round puffs, each a cluster of overlapping circles with one ink outline round the
// cluster, a smoke-grey fill and a dot screen over it, and a warm rim of firelight on the underside. The puffs leave
// the flame tips, rise and swell, drift with the wind and fade near the top. Continuous: every frame moves.
export const BubbleSmoke: React.FC<{
  w: number;
  // the flame tips (px above the base) and how high the smoke climbs above them
  top: number;
  rise: number;
  t: number;
  seed: number;
  count?: number;
}> = ({ w, top, rise, t, seed, count = 7 }) => {
  const id = `bs${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const puffs = Array.from({ length: count }, (_, i) => {
    const life = 2.6 + 0.8 * hash(i, seed + 60);
    const off = (i / count) * life + hash(i, seed + 61) * 0.4;
    const gen = Math.floor((t + off) / life);
    const age = (t + off) / life - gen;
    const R = (k: number) => hash(gen * 13 + i, seed + k);
    const x0 = (R(62) - 0.5) * w * 0.45;
    const r = w * (0.11 + 0.05 * R(63)) * (0.6 + 1.0 * age);
    const cx = x0 + wind(t) * rise * 0.25 * age + n1(age * 2 + i, seed + 64) * w * 0.05;
    const cy = -top - rise * age;
    const spin = t * 0.25 * (R(65) > 0.5 ? 1 : -1);
    const lobes = Array.from({ length: 4 }, (_, k) => {
      const a = spin + (k / 4) * Math.PI * 2 + R(66 + k) * 0.8;
      const d = r * (k === 0 ? 0 : 0.62);
      return { x: cx + Math.cos(a) * d, y: cy + Math.sin(a) * d * 0.8, r: r * (k === 0 ? 1 : 0.62 + 0.15 * R(70 + k)) };
    });
    const op = Math.min(1, age / 0.12) * (age > 0.65 ? (1 - age) / 0.35 : 1);
    return { lobes, op, age, r };
  }).sort((a, b) => b.age - a.age);
  const lw = Math.max(2.5, w * 0.006);
  return (
    <g>
      <defs>
        <TonePattern id={`${id}-dots`} r={1.9} gap={7} />
      </defs>
      {puffs.map((p, i) => (
        <g key={i} opacity={p.op}>
          {p.lobes.map((l, k) => (
            <circle key={`s${k}`} cx={l.x} cy={l.y} r={l.r} fill={INK} stroke={INK} strokeWidth={lw * 2} />
          ))}
          {p.lobes.map((l, k) => (
            <circle key={`f${k}`} cx={l.x} cy={l.y} r={l.r} fill="#77706b" />
          ))}
          {p.lobes.map((l, k) => (
            <circle key={`d${k}`} cx={l.x} cy={l.y} r={l.r} fill={`url(#${id}-dots)`} />
          ))}
          {/* firelight: one warm arc under the puff, fading as it climbs away from the flames */}
          <path
            d={`M ${p.lobes[0].x - p.r * 1.25} ${p.lobes[0].y + p.r * 0.55} A ${p.r * 1.45} ${p.r * 1.3} 0 0 0 ${p.lobes[0].x + p.r * 1.25} ${p.lobes[0].y + p.r * 0.55}`}
            fill="none"
            stroke="#ff9a3c"
            strokeWidth={lw * 1.3}
            strokeLinecap="round"
            opacity={0.9 * (1 - p.age) ** 1.5}
          />
        </g>
      ))}
    </g>
  );
};

// Smooth heat shimmer: the turbulence pattern scrolls upward (the filtered group is shifted one way and its contents
// the other), so the air ripples continuously instead of re-seeding every frame.
const Shimmer: React.FC<{
  t: number;
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  scale: number;
  children: React.ReactNode;
}> = ({ t, cx, cy, rx, ry, scale, children }) => {
  const id = `sh${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const scroll = -t * 90;
  return (
    <g>
      {children}
      <defs>
        <filter id={`${id}-f`} x={cx - rx * 1.2} y={cy - ry * 1.2 - scroll} width={rx * 2.4} height={ry * 2.4} filterUnits="userSpaceOnUse">
          <feTurbulence type="fractalNoise" baseFrequency="0.006 0.022" numOctaves={2} seed={4} result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale={scale} xChannelSelector="R" yChannelSelector="G" />
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

// ── palette ───────────────────────────────────────────────────────────────────────────────────
export const C = {
  ink: INK,
  deep: "#6e1006", // dark-red accents
  red: "#d9301a", // tips / outer
  orange: "#ff8a1e", // body
  yellow: "#ffcf3a",
  core: "#fff6cf", // white-yellow core
  glow: "#ff6a1a",
  ember: "#ffb43c",
  emberHot: "#fff3c4",
};

// ── fire styles ───────────────────────────────────────────────────────────────────────────────
export type FireArgs = {
  w: number;
  h: number;
  // song frame
  f: number;
  seed: number;
  intensity: number;
  // number of big tongues
  n: number;
  glow?: boolean;
  smoke?: boolean;
  embers?: number;
  // B only: a dark-red under-layer so the soft flames keep their edge on light grounds
  rimmed?: boolean;
  // B only: cap the softness in screen px (close-ups and panels), so big flames don't go out of focus
  crisp?: boolean;
  // B: where the fire's base sits on screen. The filter regions are clipped to the frame: a region much bigger than
  // the frame makes the browser rasterise the filter at reduced resolution (a zoomed-in fire went soft and smeared).
  at?: { x: number; y: number };
};

// A. Manga ink flames: few big tongues with hooked, curling tips, one bold ink silhouette round the whole fire, flat
// colour bands inside (red rim, orange body, yellow, cream core), and a couple of thin ink curls inside. 60 fps sway.
const FireA: React.FC<FireArgs> = ({ w, h, f, seed, intensity, n, glow = true, smoke = true, embers = 10 }) => {
  const t = f / FPS;
  const fl: Flow = { t, rise: 1.25, wave: 1.5, sway: 0.42, curl: 0.13, taper: 1.05, ripple: 0.12 };
  const tg = makeTongues(n, w, h, seed, intensity);
  const ws = wisps(tg, fl);
  const lw = Math.min(9, Math.max(3.5, h * 0.011));
  const outer = tg.map((x) => layerD(x, fl, 1, 1));
  const wd = ws.map((x) => ribbon(x.c, x.hw));
  const bands: [number, number, string][] = [
    [0.8, 0.66, C.orange],
    [0.56, 0.42, C.yellow],
    [0.34, 0.22, C.core],
  ];
  return (
    <g>
      {glow ? <Glow w={w} h={h * intensity} t={t} color={C.glow} seed={seed} /> : null}
      {smoke ? (
        <BubbleSmoke w={w} top={h * intensity * 0.85} t={t} seed={seed} rise={h * 1.4} />
      ) : null}
      {/* one bold silhouette: ink strokes behind, fills over them */}
      {[...outer, ...wd].map((d, i) => (
        <path key={`s${i}`} d={d} fill={C.ink} stroke={C.ink} strokeWidth={lw * 2} strokeLinejoin="round" />
      ))}
      {outer.map((d, i) => (
        <path key={`o${i}`} d={d} fill={C.red} />
      ))}
      {ws.map((x, i) => (
        <path key={`w${i}`} d={wd[i]} fill={x.grow > 0.5 ? C.orange : C.red} />
      ))}
      {bands.map(([k, wf, col]) =>
        tg.map((x, i) => <path key={`${col}${i}`} d={layerD(x, fl, k, wf)} fill={col} />),
      )}
      {/* sparse ink curls: the inside edge of the body of every other tongue */}
      {tg
        .filter((_, i) => i % 2 === 1)
        .map((x, i) => {
          const l = layerPath(x, fl, 0.8, 0.66);
          return (
            <path
              key={`c${i}`}
              d={sideStroke(l.c, l.hw, x.hook > 0 ? 1 : -1, 0.35, 0.92)}
              fill="none"
              stroke={C.deep}
              strokeWidth={lw * 0.55}
              strokeLinecap="round"
            />
          );
        })}
      <Embers w={w} h={h * intensity} t={t} seed={seed} count={embers} size={Math.max(2.5, h * 0.006)} color={C.ember} hot={C.emberHot} outline={C.ink} />
    </g>
  );
};

// B's softness in screen px: blur of the core band (outer bands are multiples), displacement, noise frequency.
export const B_BLUR_PX = 2.5;
export const B_DISP_PX = 36;
const B_NOISE_FREQ = "0.0036 0.0032";

// B. Flowing shapes: no outlines. More, narrower tongues in soft-edged translucent layers, their edges licked by a
// turbulence field that scrolls upward with the flame (feTurbulence + feDisplacementMap), a strong blurred glow, wisps
// that blur away as they rise, glowing embers.
const FireB: React.FC<FireArgs> = ({ w, h, f, seed, intensity, n, glow = true, smoke = true, embers = 10, rimmed = false, crisp = false, at }) => {
  const id = `fb${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const t = f / FPS;
  const fl: Flow = { t, rise: 1.5, wave: 1.8, sway: 0.55, curl: 0, taper: 1.3, ripple: 0.18 };
  const tg = makeTongues(Math.round(n * 1.2), w, h, seed, intensity).map((x) => ({ ...x, W: x.W * 1.15 }));
  const ws = wisps(tg, fl, 1.3);
  const scroll = -t * h * 0.55;
  // Softness and licking are constant in SCREEN pixels (not scaled with the fire's size on screen), so a fire zoomed
  // into a panel has the same edges as the fire in a wide shot.
  const blur = B_BLUR_PX;
  const disp = crisp ? Math.min(26, B_DISP_PX) : B_DISP_PX;
  // the filter region in the fire's own coordinates: its reach, cut to the frame (plus a margin)
  const M = 60;
  const rx0 = Math.max(-w * 1.5, at ? -at.x - M : -Infinity);
  const rx1 = Math.min(w * 1.5, at ? 1920 - at.x + M : Infinity);
  const ry0 = Math.max(-h * 2.2, at ? -at.y - M : -Infinity);
  const ry1 = Math.min(h * 0.4, at ? 1080 - at.y + M : Infinity);
  const region = { x: rx0, y: ry0, width: Math.max(1, rx1 - rx0), height: Math.max(1, ry1 - ry0) };
  const layer = (k: number, wf: number, fill: string, op: number, b: number, key: string) => (
    <g key={key} filter={`url(#${id}-b${key})`} opacity={op}>
      <defs>
        <filter id={`${id}-b${key}`} {...region} filterUnits="userSpaceOnUse">
          <feGaussianBlur stdDeviation={b} />
        </filter>
      </defs>
      {tg.map((x, i) => (
        <path key={i} d={layerD(x, fl, k, wf)} fill={fill} />
      ))}
    </g>
  );
  return (
    <g>
      {glow ? <Glow w={w} h={h * intensity} t={t} color={C.glow} strength={0.7} seed={seed} /> : null}
      {smoke ? (
        <BubbleSmoke w={w} top={h * intensity * 0.85} t={t} seed={seed} rise={h * 1.4} />
      ) : null}
      <defs>
        <filter id={`${id}-d`} {...region} y={region.y - scroll} filterUnits="userSpaceOnUse">
          <feTurbulence type="fractalNoise" baseFrequency={B_NOISE_FREQ} numOctaves={2} seed={seed} result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale={disp} xChannelSelector="R" yChannelSelector="G" />
        </filter>
        <filter id={`${id}-w`} {...region} filterUnits="userSpaceOnUse">
          <feGaussianBlur stdDeviation={blur * 1.6} />
        </filter>
      </defs>
      {/* the noise scrolls up with the flame: shift the filtered group, shift its contents back */}
      <g transform={`translate(0 ${scroll})`} filter={`url(#${id}-d)`}>
        <g transform={`translate(0 ${-scroll})`}>
          {rimmed ? layer(1.03, 1.1, C.deep, 1, blur * 0.7, "u") : null}
          {/* crisp: a near-hard silhouette (opaque, 1.5 px) with the softness kept inside, between the bands */}
          {layer(1, 1, C.red, crisp ? 1 : 0.92, crisp ? 1.5 : blur * 2.2, "r")}
          {layer(0.8, 0.72, C.orange, 0.95, crisp ? 5 : blur * 1.6, "o")}
          {layer(0.55, 0.46, C.yellow, 0.95, crisp ? 4 : blur * 1.3, "y")}
          {layer(0.36, 0.28, C.core, 1, crisp ? 3 : blur, "c")}
          {/* the white-hot mass at the base, glowing through */}
          <ellipse cx={0} cy={-h * intensity * 0.08} rx={Math.min(w * 0.36, h * 0.3)} ry={h * intensity * 0.1} fill={C.core} opacity={0.75 + 0.2 * flicker(t, seed + 5)} filter={`url(#${id}-w)`} />
          <g filter={`url(#${id}-w)`}>
            {ws.map((x, i) => (
              <path key={i} d={ribbon(x.c, x.hw)} fill={x.grow > 0.55 ? C.orange : C.red} opacity={0.9 * (1 - x.age * 0.6)} />
            ))}
          </g>
        </g>
      </g>
      <Embers w={w} h={h * intensity} t={t} seed={seed} count={embers} size={Math.max(2, h * 0.005)} color={C.ember} hot={C.emberHot} glow />
    </g>
  );
};

// C. Cel-animated loop: tongue poses held on twos at 12 fps (5 song frames each) from a 12-pose cycle (periodic waves,
// phase-offset per tongue, so they never pose together), crisp flat colour, no ink. Each heartbeat lub kicks the fire: the
// tongues jump taller for a pose or two and the glow flares, so the flicker locks to the music.
const FireC: React.FC<FireArgs> = ({ w, h, f, seed, intensity, n, glow = true, smoke = true, embers = 10 }) => {
  const HOLD = 5;
  const fh = Math.floor(f / HOLD) * HOLD; // the held frame
  const hb = heartbeat(fh);
  const kick = 1 + 0.16 * Math.min(1, hb);
  // pose time: the cycle of 12 poses spans 1 s; keyed time advances in pose-sized jumps
  const pose = Math.floor(f / HOLD);
  const tk = pose / 12;
  const fl: Flow = { t: tk, rise: 1, wave: 1.3, sway: 0.42, curl: 0.06, taper: 1.45, ripple: 0.2, loop: true };
  const tg = makeTongues(n, w, h * kick, seed, intensity);
  const ws = wisps(tg, fl, 1.1);
  const outlineCol = "#7a1408";
  const lw = Math.min(5, Math.max(2, h * 0.006));
  const outer = tg.map((x) => layerD(x, fl, 1, 1));
  return (
    <g>
      {glow ? <Glow w={w} h={h * intensity} t={fh / FPS} color={C.glow} strength={0.5 + 0.25 * Math.min(1, hb)} seed={seed} /> : null}
      {smoke ? (
        <BubbleSmoke w={w} top={h * intensity * 0.85} t={fh / FPS} seed={seed} rise={h * 1.4} />
      ) : null}
      {[...outer, ...ws.map((x) => ribbon(x.c, x.hw))].map((d, i) => (
        <path key={`s${i}`} d={d} fill={outlineCol} stroke={outlineCol} strokeWidth={lw * 2} strokeLinejoin="round" />
      ))}
      {outer.map((d, i) => (
        <path key={`o${i}`} d={d} fill={C.red} />
      ))}
      {ws.map((x, i) => (
        <path key={`w${i}`} d={ribbon(x.c, x.hw)} fill={x.grow > 0.5 ? C.orange : C.red} />
      ))}
      {/* the body and core are keyed separately (a pose behind), so the bands shift against the silhouette */}
      {tg.map((x, i) => (
        <path key={`b${i}`} d={layerD(x, { ...fl, t: tk - 1 / 12, ripple: 0.25 }, 0.74, 0.62)} fill={C.orange} />
      ))}
      {tg.map((x, i) => (
        <path key={`c${i}`} d={layerD(x, { ...fl, t: tk - 2 / 12 }, 0.45, 0.36)} fill={C.yellow} />
      ))}
      {tg.map((x, i) => (
        <path key={`k${i}`} d={layerD(x, { ...fl, t: tk - 2 / 12 }, 0.26, 0.2)} fill={C.core} />
      ))}
      <Embers w={w} h={h * intensity} t={fh / FPS} seed={seed} count={embers} size={Math.max(2.5, h * 0.006)} color={C.ember} hot={C.emberHot} />
    </g>
  );
};

// D. Hybrid: A's few big curling tongues and flat bands moving at 60 fps, but no black ink round the fire — the outer
// silhouette is a thin dark-red line, the bands meet softly (blurred core glowing through), the edges are licked by
// the scrolling turbulence of B (lightly), and one ink accent stroke per tongue keeps it manga.
const FireD: React.FC<FireArgs> = ({ w, h, f, seed, intensity, n, glow = true, smoke = true, embers = 10 }) => {
  const id = `fd${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const t = f / FPS;
  const fl: Flow = { t, rise: 1.3, wave: 1.5, sway: 0.45, curl: 0.1, taper: 1.15, ripple: 0.14 };
  const tg = makeTongues(n, w, h, seed, intensity);
  const ws = wisps(tg, fl);
  const lw = Math.min(5, Math.max(2, h * 0.005));
  const outer = tg.map((x) => layerD(x, fl, 1, 1));
  const wd = ws.map((x) => ribbon(x.c, x.hw));
  const scroll = -t * h * 0.5;
  const disp = Math.max(6, h * 0.025);
  const soft = Math.max(1.5, h * 0.006);
  return (
    <g>
      {glow ? <Glow w={w} h={h * intensity} t={t} color={C.glow} strength={0.65} seed={seed} /> : null}
      {smoke ? (
        <BubbleSmoke w={w} top={h * intensity * 0.85} t={t} seed={seed} rise={h * 1.4} />
      ) : null}
      <defs>
        <filter id={`${id}-d`} x={-w * 1.5} y={-h * 2.2 - scroll} width={w * 3} height={h * 2.6} filterUnits="userSpaceOnUse">
          <feTurbulence type="fractalNoise" baseFrequency={`${(2 / w).toFixed(5)} ${(3 / h).toFixed(5)}`} numOctaves={1} seed={seed} result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale={disp} xChannelSelector="R" yChannelSelector="G" />
        </filter>
        <filter id={`${id}-s`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation={soft} />
        </filter>
      </defs>
      <g transform={`translate(0 ${scroll})`} filter={`url(#${id}-d)`}>
        <g transform={`translate(0 ${-scroll})`}>
          {[...outer, ...wd].map((d, i) => (
            <path key={`s${i}`} d={d} fill={C.deep} stroke={C.deep} strokeWidth={lw * 2} strokeLinejoin="round" />
          ))}
          {outer.map((d, i) => (
            <path key={`o${i}`} d={d} fill={C.red} />
          ))}
          {ws.map((x, i) => (
            <path key={`w${i}`} d={wd[i]} fill={x.grow > 0.5 ? C.orange : C.red} />
          ))}
          {tg.map((x, i) => (
            <path key={`b${i}`} d={layerD(x, fl, 0.8, 0.66)} fill={C.orange} />
          ))}
          <g filter={`url(#${id}-s)`}>
            {tg.map((x, i) => (
              <path key={`y${i}`} d={layerD(x, fl, 0.58, 0.46)} fill={C.yellow} />
            ))}
            {tg.map((x, i) => (
              <path key={`c${i}`} d={layerD(x, fl, 0.38, 0.27)} fill={C.core} />
            ))}
          </g>
          {tg
            .filter((_, i) => i % 2 === 1)
            .map((x, i) => {
              const l = layerPath(x, fl, 1, 1);
              return (
                <path
                  key={`a${i}`}
                  d={sideStroke(l.c, l.hw, x.hook > 0 ? -1 : 1, 0.62, 0.93)}
                  fill="none"
                  stroke={C.ink}
                  strokeWidth={lw * 1.3}
                  strokeLinecap="round"
                />
              );
            })}
        </g>
      </g>
      <Embers w={w} h={h * intensity} t={t} seed={seed} count={embers} size={Math.max(2.2, h * 0.0055)} color={C.ember} hot={C.emberHot} glow />
    </g>
  );
};

const STYLES = { A: FireA, B: FireB, C: FireC, D: FireD } as const;
export type StyleId = keyof typeof STYLES;

// ── the scene: shot 3.4 rebuilt with a pluggable fire ─────────────────────────────────────────
const CELL_TO = CELL_ANCHOR_X - 2.4 - CELL_POSE.dx;
const along = (x: number) => (x - RUN.a.x) / (RUN.b.x - RUN.a.x);
const GAPS: [number, number][][] = [[], [[along(CELL_FROM + 0.9), along(CELL_TO + 0.5)]], []];

const shotCam = (f: number): Camera => {
  const shot = shotById("3.4");
  const t = f - shot.from;
  const len = shot.to - shot.from;
  const hb = heartbeat(f);
  const u = ramp(t, 0, len, (x) => x * x * (3 - 2 * x));
  const target = {
    x: HALO_WORLD.x + (REAR_ANCHOR_X - 1.5 - HALO_WORLD.x) * (1 - u),
    y: 0.9 * (1 - u) + HALO_WORLD.y * u,
    z: REAR_Z + (HALO_WORLD.z - REAR_Z) * u,
  };
  return zoomCam(WRECK_CAM, target, 0.82 + 0.45 * u + 0.01 * hb, { x: 960 + 160 * (1 - u), y: 560 });
};

// Warm firelight on the rails and the ground: a multiply wash (white paper turns warm, ink stays ink) plus a screen
// wash that lifts the dark asphalt, both flickering with the fire.
const FireLight: React.FC<{ cx: number; cy: number; rx: number; ry: number; t: number; amount: number }> = ({
  cx,
  cy,
  rx,
  ry,
  t,
  amount,
}) => {
  const id = `fl${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const k = amount * (0.8 + 0.4 * flicker(t, 3));
  return (
    <g>
      <defs>
        <radialGradient id={`${id}-m`}>
          <stop offset="0%" stopColor="#ff9a4a" />
          <stop offset="55%" stopColor="#ffc896" />
          <stop offset="100%" stopColor="#ffffff" />
        </radialGradient>
        <radialGradient id={`${id}-s`}>
          <stop offset="0%" stopColor="#ff5a10" stopOpacity={0.55} />
          <stop offset="100%" stopColor="#ff5a10" stopOpacity={0} />
        </radialGradient>
      </defs>
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={`url(#${id}-m)`} style={{ mixBlendMode: "multiply" }} opacity={Math.min(1, k)} />
      <ellipse cx={cx} cy={cy} rx={rx * 0.9} ry={ry * 0.8} fill={`url(#${id}-s)`} style={{ mixBlendMode: "screen" }} opacity={Math.min(1, k)} />
    </g>
  );
};

// WreckWorld (Wreck.tsx) rebuilt with a pluggable fire: night with shimmer, the big fire behind the cell, the cell, the
// rails, firelight, the low fire along the rails, the gap fire, the rear piece and the debris. Same props as WreckWorld.
export const WreckWorldB: React.FC<{
  cam: Camera;
  f: number;
  style: StyleId;
  intensity: number;
  tonePrefix: string;
  behindRails?: React.ReactNode;
  noGlow?: boolean;
  driver?: false;
  bend?: Deflection;
  // B-fixed: a dark-red under-layer under the soft flames
  rimmed?: boolean;
  // B-fixed: softness capped in screen px
  crisp?: boolean;
}> = ({ cam, f, style, intensity, tonePrefix, behindRails, noGlow = false, driver, bend = WRECK_BEND, rimmed, crisp }) => {
  const Fire = STYLES[style];
  const t = f / FPS;
  const fireAt = (x: number, z: number, w: number, h: number) => {
    const base = cam.project({ x, y: 0, z });
    const ppm = cam.pxPerMetre(z);
    return { x: base.x, y: base.y, w: w * ppm, h: h * ppm };
  };
  const back = fireAt(CELL_FROM + 2.2, CELL_Z + 0.5, 4.2, 7.5);
  const front = fireAt(CELL_FROM + 2.4, BARRIER_Z - 0.3, 4.6, 1.6);
  const gap = fireAt(CELL_TO + 1.0, (CELL_Z + REAR_Z) / 2, 2.0, 3.4);
  const cellAt = cam.anchor({ x: CELL_ANCHOR_X, z: CELL_Z });
  const rearAt = cam.anchor({ x: REAR_ANCHOR_X, z: REAR_Z });
  const railY = cam.screenY(0.6, BARRIER_Z);
  return (
    <g>
      <Shimmer
        t={t}
        cx={back.x}
        cy={back.y - back.h * intensity * 1.0}
        rx={back.w * 0.9}
        ry={back.h * 0.7}
        scale={Math.max(8, cam.pxPerMetre(CELL_Z) * 0.08)}
      >
        <NightBackdrop cam={cam} tonePrefix={tonePrefix} />
      </Shimmer>
      <g transform={`translate(${back.x} ${back.y})`}>
        <Fire at={back} w={back.w} h={back.h} f={f} seed={1} intensity={intensity} n={5} embers={14} glow={!noGlow} rimmed={rimmed} crisp={crisp} />
      </g>
      <MangaCar car={VF20} facing="left" at={cellAt} state={{ split: { front: CELL_POSE, show: "front" }, driver }} />
      {behindRails}
      <BentGuardrail cam={cam} a={RUN.a} b={RUN.b} gaps={GAPS} deflect={bend} tonePrefix={tonePrefix} />
      {noGlow ? null : (
        <FireLight cx={back.x} cy={railY} rx={back.w * 1.6} ry={cam.pxPerMetre(BARRIER_Z) * 2.2} t={t} amount={intensity} />
      )}
      <g transform={`translate(${front.x} ${front.y})`}>
        <Fire at={front} w={front.w} h={front.h} f={f + 7} seed={2} intensity={intensity} n={6} glow={false} smoke={false} embers={6} rimmed={rimmed} crisp={crisp} />
      </g>
      <g transform={`translate(${gap.x} ${gap.y})`}>
        <Fire at={gap} w={gap.w} h={gap.h} f={f + 13} seed={3} intensity={intensity * 0.9} n={3} glow={false} smoke={false} embers={4} rimmed={rimmed} crisp={crisp} />
      </g>
      <MangaCar car={VF20} facing="left" at={rearAt} state={{ split: { rear: REAR_POSE, show: "rear" }, compound: VF20.compound }} />
      {[
        [CELL_TO + 1.6, 11.6, 0.5],
        [CELL_TO + 2.6, 12.2, 0.3],
        [REAR_ANCHOR_X - 3.3, 9.6, 0.4],
        [REAR_ANCHOR_X + 0.6, 9.2, 0.25],
      ].map(([x, z, s]) => {
        const c = cam.project({ x, y: 0, z });
        const k = cam.pxPerMetre(z) * s;
        return (
          <path
            key={`${x}${z}`}
            d={`M ${c.x - k} ${c.y} L ${c.x - k * 0.2} ${c.y - k * 0.5} L ${c.x + k} ${c.y - k * 0.1} L ${c.x + k * 0.3} ${c.y + k * 0.15} Z`}
            fill={INK}
            stroke={PAPER}
            strokeWidth={1.5}
          />
        );
      })}
    </g>
  );
};

const FireScene: React.FC<{ f: number; style: StyleId }> = ({ f, style }) => {
  const shot = shotById("3.4");
  const intensity = 0.25 + 0.75 * ramp(f - shot.from, 0, 112);
  const hb = heartbeat(f);
  return (
    <svg viewBox="0 0 1920 1080" width={1920} height={1080}>
      <defs>
        <ToneDefs prefix="pf" />
      </defs>
      <WreckWorldB cam={shotCam(f)} f={f} style={style} intensity={intensity} tonePrefix="pf" />
      <Vignette amount={0.5 + 0.35 * hb} />
    </svg>
  );
};

// ── compositions ──────────────────────────────────────────────────────────────────────────────
const Clip: React.FC<{ children: (f: number) => React.ReactNode }> = ({ children }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ backgroundColor: INK }}>
      {children(FIRE_CLIP_START + frame)}
      <Audio src={staticFile(SCORE)} trimBefore={FIRE_CLIP_START} />
    </AbsoluteFill>
  );
};

export const FireBaseline: React.FC = () => <Clip>{(f) => <WreckShot f={f} palette="color" />}</Clip>;

export const FireStyle: React.FC<{ style: StyleId }> = ({ style }) => (
  <Clip>{(f) => <FireScene f={f} style={style} />}</Clip>
);
