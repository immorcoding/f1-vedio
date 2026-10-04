// Manga fire: inked flame tongues in three layers (outer, mid, core), each with its own shapes and its own flicker,
// detached flicks torn off the top, embers and sparks streaking up, heat haze over the flames and wispy ink-stroke
// smoke. No round puffs anywhere: smoke is drawn as thin rising streaks, like brush strokes.
//
// It jumps rather than flows, like hand-drawn fire in a manga anime: the outer silhouette is redrawn every `step` frames
// (on threes by default), the mid and core layers on twos out of phase with it, so the layers never move together.
// Embers, smoke and haze move every frame.
//
// The whole look of the fire is one parameter, its palette. FIRE_MANGA keeps it in the page's black and white; FIRE_COLOR
// is the coloured fire the user approved for Bahrain (ART-8 exception).
import { useId } from "react";
import { random } from "remotion";
import { INK, PAPER } from "./colors";
import { TonePattern } from "./tone";

export type FirePalette = {
  readonly name: string;
  // Fills of the three flame layers, outside in.
  readonly outer: string;
  readonly mid: string;
  readonly core: string;
  // Lay a dot screen over the mid layer (how black-and-white fire gets its grey).
  readonly midDots: boolean;
  // The outline round the outer flames and the wisps.
  readonly line: string;
  // Smoke streaks: fill and the thin lit edge along them.
  readonly smoke: string;
  readonly smokeEdge: string;
  readonly ember: string;
  // Light thrown round the fire; none in black and white.
  readonly glow: string | null;
  // Heat haze strokes over the flames.
  readonly haze: string;
};

export const FIRE_MANGA: FirePalette = {
  name: "manga",
  outer: PAPER,
  mid: PAPER,
  core: PAPER,
  midDots: true,
  line: INK,
  smoke: "#4a4a4a",
  smokeEdge: "#9a9a9a",
  ember: PAPER,
  glow: null,
  haze: PAPER,
};

export const FIRE_COLOR: FirePalette = {
  name: "color",
  outer: "#d8321c",
  mid: "#f58a1f",
  core: "#ffe8a6",
  midDots: false,
  line: INK,
  smoke: "#4d4643",
  smokeEdge: "#a8826a",
  ember: "#ffc35a",
  glow: "#ff6a1a",
  haze: "#ffd9a0",
};

export const FIRE_PALETTES = { manga: FIRE_MANGA, color: FIRE_COLOR };
export type FirePaletteName = keyof typeof FIRE_PALETTES;

type Tongue = { bx: number; w: number; h: number; lean: number };

// One flame tongue standing on y = 0: a teardrop from its base up to a leaning tip, with a curl on one side.
const tonguePath = ({ bx, w, h, lean }: Tongue, s = 1) => {
  const W = w * s;
  const H = h * s;
  const L = lean * s;
  const l = bx - W / 2;
  const r = bx + W / 2;
  const tip = bx + L;
  // left flank up to a sharp tip, down the right flank to a small outward flick, then back to the base
  return (
    `M ${l} 0 C ${l - W * 0.15} ${-H * 0.3} ${tip - W * 0.5} ${-H * 0.55} ${tip - W * 0.1} ${-H * 0.8} ` +
    `L ${tip} ${-H} C ${tip + W * 0.06} ${-H * 0.84} ${tip + W * 0.22} ${-H * 0.72} ${tip + W * 0.2} ${-H * 0.6} ` +
    `L ${r + W * 0.16} ${-H * 0.64} C ${r - W * 0.06} ${-H * 0.48} ${r + W * 0.14} ${-H * 0.26} ${r} 0 Z`
  );
};

// A detached flame flick floating at height y (negative = up): a thin curved sliver, pointed at both ends — a lick of
// flame torn off the top, never a round-bottomed drop.
const wispPath = ({ bx, y, w, h, lean }: Tongue & { y: number }) => {
  const W = w * 0.5;
  const s = lean >= 0 ? 1 : -1;
  return (
    `M ${bx - s * W * 0.3} ${y} ` +
    `C ${bx + s * W * 0.9} ${y - h * 0.25} ${bx - s * W * 0.4} ${y - h * 0.6} ${bx + s * W * 0.5} ${y - h} ` +
    `C ${bx + s * W * 0.1} ${y - h * 0.62} ${bx + s * W * 1.5} ${y - h * 0.3} ${bx - s * W * 0.3} ${y} Z`
  );
};

// A tapered ribbon along a line of points (thin at both ends, widest at `peak`): one brush stroke of smoke.
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

// Rising ink-stroke smoke over a fire whose top is at y = -top: a few long wavering streaks, each broken into
// segments that climb every frame and drift with the wind (negative = to the left). Never round puffs.
export const SmokeStreaks: React.FC<{
  w: number;
  top: number;
  frame: number;
  seed: string;
  palette: FirePalette;
  // how high the smoke climbs above the flames, px
  rise: number;
  count?: number;
  wind?: number;
  opacity?: number;
}> = ({
  w,
  top,
  frame,
  seed,
  palette,
  rise,
  count = 6,
  wind = -0.35,
  opacity = 0.75,
}) => {
  const streaks = Array.from({ length: count }, (_, i) => {
    const x0 = (random(`${seed}-sx${i}`) - 0.5) * w * 0.7;
    const speed = 0.0045 + random(`${seed}-sv${i}`) * 0.003;
    const width = (0.035 + random(`${seed}-sw${i}`) * 0.04) * rise;
    const amp = (0.03 + random(`${seed}-sa${i}`) * 0.04) * rise;
    return [0, 0.5].map((off) => {
      // u: where this segment's head is along the climb, 0 = the flame tips, 1 = gone
      const u = (frame * speed + off + random(`${seed}-so${i}`)) % 1;
      const len = 0.28 + 0.1 * random(`${seed}-sl${i}`);
      const pts = Array.from({ length: 12 }, (_, k) => {
        const v = Math.max(0, u - (len * k) / 11);
        const y = -top - v * rise;
        const x =
          x0 +
          wind * v * rise +
          Math.sin(v * 7 + i * 1.9 + frame * 0.03) * amp * (0.4 + v);
        return { x, y };
      });
      const fade = Math.min(1, u / 0.15) * (1 - u);
      return { d: strokeRibbon(pts, width * (0.6 + u)), fade };
    });
  }).flat();
  return (
    <g>
      {streaks.map((s, i) => (
        <g key={i} opacity={opacity * s.fade}>
          <path d={s.d} fill={palette.smoke} />
          <path
            d={s.d}
            fill="none"
            stroke={palette.smokeEdge}
            strokeWidth={1.4}
            strokeLinejoin="round"
          />
        </g>
      ))}
    </g>
  );
};

// Embers and sparks climbing out of a fire (base at y = 0, flames `h` tall, `w` wide): each one rises every frame on
// its own wavering path with a short motion streak behind it, and burns out near the top.
export const Embers: React.FC<{
  w: number;
  h: number;
  frame: number;
  seed: string;
  palette: FirePalette;
  count: number;
  // embers' size, px
  size?: number;
}> = ({ w, h, frame, seed, palette, count, size = 4 }) => (
  <g>
    {Array.from({ length: count }, (_, i) => {
      const life = 34 + Math.floor(random(`${seed}-el${i}`) * 40);
      const shift = Math.floor(random(`${seed}-es${i}`) * life);
      const age = (frame + shift) % life;
      const gen = Math.floor((frame + shift) / life);
      const R = (k: string) => random(`${seed}-e${k}${i}-${gen}`);
      const x0 = (R("x") - 0.5) * w;
      const rise = h * (0.012 + R("v") * 0.016);
      const pos = (a: number) => ({
        x: x0 + Math.sin(a * 0.12 + R("p") * 6) * w * 0.04 + a * (R("d") - 0.5) * 1.5,
        y: -h * 0.35 - a * rise,
      });
      const p = pos(age);
      const q = pos(Math.max(0, age - 3));
      const r = size * (0.5 + R("r") * 0.8) * (1 - (age / life) * 0.6);
      const op = Math.min(1, age / 4) * (age > life * 0.7 ? (life - age) / (life * 0.3) : 1);
      return (
        <g key={i} opacity={op}>
          <path
            d={`M ${q.x} ${q.y} L ${p.x} ${p.y}`}
            stroke={INK}
            strokeWidth={r * 1.3 + 1.5}
            strokeLinecap="round"
          />
          <path
            d={`M ${q.x} ${q.y} L ${p.x} ${p.y}`}
            stroke={palette.ember}
            strokeWidth={r * 1.3}
            strokeLinecap="round"
          />
        </g>
      );
    })}
  </g>
);

// Heat haze over a fire (base at y = 0): thin sinuous strokes climbing out of the flame tips and wavering every frame —
// the manga way of drawing the shimmer.
export const HeatHaze: React.FC<{
  w: number;
  top: number;
  frame: number;
  seed: string;
  palette: FirePalette;
  height: number;
}> = ({ w, top, frame, seed, palette, height }) => (
  <g fill="none" stroke={palette.haze} strokeLinecap="round">
    {Array.from({ length: 6 }, (_, i) => {
      const x0 = ((i + 0.5) / 6 - 0.5) * w * 0.8 + (random(`${seed}-hx${i}`) - 0.5) * w * 0.08;
      const u = (frame * 0.012 + random(`${seed}-hu${i}`)) % 1;
      const y0 = -top - u * height * 0.3;
      const pts = Array.from({ length: 10 }, (_, k) => {
        const v = k / 9;
        return `${(x0 + Math.sin(v * 9 + frame * 0.35 + i * 2.1) * w * 0.018).toFixed(1)} ${(y0 - v * height * 0.6).toFixed(1)}`;
      });
      return (
        <path
          key={i}
          d={`M ${pts.join(" L ")}`}
          strokeWidth={Math.max(1.2, w * 0.004)}
          opacity={0.32 * Math.sin(u * Math.PI)}
        />
      );
    })}
  </g>
);

// Shimmer: draws `children`, then a copy of them warped by animated turbulence and shown only inside an ellipse (the
// hot air over a fire). Put the background the heat rises in front of into it.
export const HeatShimmer: React.FC<{
  frame: number;
  // the hot zone, screen px
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  // how far the air bends the picture, px
  scale?: number;
  children: React.ReactNode;
}> = ({ frame, cx, cy, rx, ry, scale = 14, children }) => {
  const id = `shim${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  return (
    <g>
      {children}
      <defs>
        <filter id={`${id}-f`} x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.004 0.03"
            numOctaves={2}
            seed={frame % 97}
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
          <stop offset="70%" stopColor="#fff" stopOpacity={0.8} />
          <stop offset="100%" stopColor="#fff" stopOpacity={0} />
        </radialGradient>
        <mask id={`${id}-m`} maskUnits="userSpaceOnUse">
          <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={`url(#${id}-g)`} />
        </mask>
      </defs>
      <g mask={`url(#${id}-m)`}>
        <g filter={`url(#${id}-f)`}>{children}</g>
      </g>
    </g>
  );
};

export type FireProps = {
  // Middle of the fire's base, on screen.
  x: number;
  y: number;
  // Width of the base and height of the tallest tongue, px.
  w: number;
  h: number;
  // Composition frame; the shapes change every `step` frames.
  frame: number;
  seed: string;
  palette: FirePalette;
  step?: number;
  // 0–1: how far the fire has grown.
  intensity?: number;
  // Finer drawing for close-ups: this many times more (and narrower) tongues. Default 1.
  detail?: number;
  // Draw the smoke streaks and the heat haze above the fire.
  smoke?: boolean;
};

// One layer of tongues, redrawn every `step` frames (shifted by `phase`), spread over `span` of the base, `tall` of
// the fire's height, each tongue breathing a little every frame on its own.
const layer = (
  key: string,
  n: number,
  span: number,
  tall: number,
  o: {
    w: number;
    h: number;
    frame: number;
    seed: string;
    step: number;
    phase: number;
    intensity: number;
  },
): Tongue[] => {
  const t = Math.floor((o.frame + o.phase) / o.step);
  const R = (k: string) => random(`${o.seed}-${key}${k}-${t}`);
  const W = o.w * span;
  return Array.from({ length: n }, (_, i) => {
    const u = (i + 0.5) / n - 0.5;
    const edge = 1 - Math.abs(u) * 1.35; // taller in the middle
    const leap = i % 3 === 1 ? 1 : 0.72; // every third tongue leaps higher
    const breathe = 1 + 0.09 * Math.sin(o.frame * 0.7 + i * 2.3 + key.length);
    return {
      bx: u * W * 0.95 + (R(`x${i}`) - 0.5) * (W / n) * 0.7,
      w: (W / n) * (1.6 + R(`w${i}`) * 1.1),
      h:
        o.h *
        tall *
        o.intensity *
        Math.max(0.18, edge) *
        leap *
        breathe *
        (0.58 + R(`h${i}`) * 0.42),
      lean: (R(`l${i}`) - 0.5) * (W / n) * 2,
    };
  });
};

export const Fire: React.FC<FireProps> = ({
  x,
  y,
  w,
  h,
  frame,
  seed,
  palette,
  step = 3,
  intensity = 1,
  smoke = true,
  detail = 1,
}) => {
  const id = `fire${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const n = Math.max(5, Math.round((w / (h * 0.11)) * detail));
  const common = { w, h, frame, seed, intensity };
  const outer = layer("o", n, 1, 1, { ...common, step, phase: 0 });
  const mid = layer("m", Math.round(n * 1.25), 0.8, 0.7, {
    ...common,
    step: 2,
    phase: 1,
  });
  const core = layer("c", Math.round(n * 1.4), 0.52, 0.42, {
    ...common,
    step: 2,
    phase: 0,
  });
  const t = Math.floor(frame / step);
  const wisps = Array.from(
    { length: Math.round((n / detail) * 0.5) },
    (_, i) => {
      const life = (t + i * 3) % 5; // each wisp rises and shrinks over five steps
      const u = random(`${seed}-wisp${i}-${Math.floor((t + i * 3) / 5)}`) - 0.5;
      const size = h * 0.07 * (1 - life / 6) * intensity;
      return {
        bx: u * w * 0.7,
        y: -h * intensity * (0.7 + life * 0.1),
        w: size * 0.9,
        h: size * 1.9,
        lean: size * 0.3 * (u > 0 ? 1 : -1),
      };
    },
  );
  const lineW = Math.max(3, (h * 0.012) / Math.sqrt(detail));
  const glowBeat = 0.85 + 0.15 * Math.sin(frame * 0.9) * Math.sin(frame * 0.37);

  return (
    <g transform={`translate(${x} ${y})`}>
      <defs>
        <TonePattern id={`${id}-dots`} r={2.1} gap={7} />
        {palette.glow ? (
          <radialGradient id={`${id}-glow`}>
            <stop offset="0%" stopColor={palette.glow} stopOpacity={0.55} />
            <stop offset="100%" stopColor={palette.glow} stopOpacity={0} />
          </radialGradient>
        ) : null}
      </defs>
      {palette.glow ? (
        <ellipse
          cx={0}
          cy={-h * 0.35 * intensity}
          rx={w * 1.1}
          ry={h * 0.9 * intensity + 40}
          fill={`url(#${id}-glow)`}
          opacity={glowBeat}
        />
      ) : null}
      {smoke ? (
        <SmokeStreaks
          w={w}
          top={h * intensity * 0.8}
          frame={frame}
          seed={seed}
          palette={palette}
          rise={h * 1.6}
        />
      ) : null}
      {/* outline first, all outer tongues, then the fills over it: one inked silhouette */}
      {[...outer.map((tg) => tonguePath(tg)), ...wisps.map(wispPath)].map(
        (d, i) => (
          <path
            key={`o${i}`}
            d={d}
            fill={palette.line}
            stroke={palette.line}
            strokeWidth={lineW * 2.2}
            strokeLinejoin="round"
          />
        ),
      )}
      {outer.map((tg, i) => (
        <path key={`f${i}`} d={tonguePath(tg)} fill={palette.outer} />
      ))}
      {wisps.map((s, i) => (
        <path key={`w${i}`} d={wispPath(s)} fill={palette.mid} />
      ))}
      {mid.map((tg, i) => (
        <g key={`m${i}`}>
          <path
            d={tonguePath(tg)}
            fill={palette.mid}
            stroke={palette.line}
            strokeWidth={lineW * 0.5}
            strokeLinejoin="round"
          />
          {palette.midDots ? (
            <path d={tonguePath(tg)} fill={`url(#${id}-dots)`} />
          ) : null}
        </g>
      ))}
      {core.map((tg, i) => (
        <path key={`c${i}`} d={tonguePath(tg)} fill={palette.core} />
      ))}
      {smoke ? (
        <HeatHaze
          w={w}
          top={h * intensity * 0.85}
          frame={frame}
          seed={seed}
          palette={palette}
          height={h * 0.9}
        />
      ) : null}
      <Embers
        w={w * 0.9}
        h={h * intensity}
        frame={frame}
        seed={seed}
        palette={palette}
        count={Math.round((n / detail) * 1.6)}
        size={Math.min(4, Math.max(2.2, h * 0.007))}
      />
    </g>
  );
};

// A fireball bursting out of a point (the fuel cell rupturing): a mass of curling flame tongues thrown out all round
// and mostly upward, in three layers that flicker independently (on twos), growing fast and lifting as it burns.
// `age` = frames since it lit; `r` = full reach of the tallest tongue, px.
export const Fireball: React.FC<{
  x: number;
  y: number;
  r: number;
  age: number;
  seed: string;
  palette: FirePalette;
}> = ({ x, y, r, age, seed, palette }) => {
  const id = `ball${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  if (age < 0) return null;
  const grow = 1 - Math.exp(-age / 5);
  const R0 = r * (0.2 + 0.8 * grow);
  const lift = r * 0.006 * age; // the hot mass rises
  const n = 15;
  // the tongues of one layer: angle (deg, -90 = straight up), reach, base width, lean
  const tongues = (
    key: string,
    k: number,
    phase: number,
    spread = 250,
    count = n,
  ) => {
    const t = Math.floor((age + phase) / 2);
    const R = (s: string) => random(`${seed}-${key}${s}-${t}`);
    return Array.from({ length: count }, (_, i) => {
      const a =
        -90 + ((i + 0.5) / count - 0.5) * spread + (R(`a${i}`) - 0.5) * 16;
      const up = Math.cos(((a + 90) * Math.PI) / 180); // 1 straight up, <0 pointing down
      const reach =
        R0 * k * (0.45 + 0.55 * Math.max(0, up)) * (0.7 + 0.5 * R(`r${i}`));
      return {
        a,
        tg: {
          bx: 0,
          w: R0 * k * (0.55 + 0.25 * R(`w${i}`)),
          h: reach,
          lean: (R(`l${i}`) - 0.5) * R0 * k * 0.5,
        },
      };
    });
  };
  const draw = (
    list: ReturnType<typeof tongues>,
    fill: string,
    stroke?: { color: string; w: number },
  ) =>
    list.map(({ a, tg }, i) => (
      <path
        key={i}
        d={tonguePath(tg)}
        transform={`rotate(${a + 90}) translate(0 ${R0 * 0.08})`}
        fill={fill}
        stroke={stroke?.color}
        strokeWidth={stroke?.w}
        strokeLinejoin="round"
      />
    ));
  const outer = tongues("o", 1, 0);
  const lineW = Math.max(3, r * 0.014);
  return (
    <g transform={`translate(${x} ${y - lift})`}>
      {palette.glow ? (
        <>
          <defs>
            <radialGradient id={`${id}-g`}>
              <stop offset="0%" stopColor={palette.glow} stopOpacity={0.5} />
              <stop offset="100%" stopColor={palette.glow} stopOpacity={0} />
            </radialGradient>
          </defs>
          <ellipse
            cx={0}
            cy={-R0 * 0.3}
            rx={R0 * 2.2}
            ry={R0 * 1.9}
            fill={`url(#${id}-g)`}
            opacity={grow}
          />
        </>
      ) : null}
      {/* one inked silhouette round the outer tongues, then the three layers */}
      {draw(outer, palette.line, { color: palette.line, w: lineW * 2.2 })}
      {draw(outer, palette.outer)}
      <circle cx={0} cy={0} r={R0 * 0.36} fill={palette.outer} />
      {draw(tongues("m", 0.7, 1, 210, 11), palette.mid, {
        color: palette.line,
        w: lineW * 0.45,
      })}
      <circle cx={0} cy={0} r={R0 * 0.26} fill={palette.mid} />
      {draw(tongues("c", 0.45, 0, 130, 7), palette.core)}
      <circle cx={0} cy={R0 * 0.02} r={R0 * 0.15} fill={palette.core} />
    </g>
  );
};
