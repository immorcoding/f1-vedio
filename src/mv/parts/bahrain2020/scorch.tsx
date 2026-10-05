// The wreck after the fire, and the torn-off rear in its shadow (user review 2026-10-04):
// - RearShadow: the rear piece pushed back behind the fire and GRO. A colour filter turns its white/red/black livery
//   into a muted grey-brown silhouette (scorched, in shadow), with only a faint rim of firelight on the side facing the
//   fire. Colour only: nothing in it depends on screen position, so it holds still as the camera moves.
// - Charred: the survival cell as it came out of the fire (the remains at the F1 Exhibition, London;
//   reference-register.md): charcoal-black and matte, ash-grey blistered patches, only faint traces of white and red.
//   A colour filter on the cell, then ash and soot drawn in the car's own photo space (cellTransform) and clipped to its
//   body, so they move with the car through the push in.
// - DyingFire: what is left of the fire along the rails in the halo finale: a low bed of glowing embers, a few small
//   B-style flames (ART-21) and sparks rising.
import { useId } from "react";
import { random } from "remotion";
import { VF20 } from "../../../cars";
import { Embers, Fire, type FirePalette } from "../../../kit/fire";
import { TonePattern } from "../../../kit/tone";

const rowsOf = (m: number[][]) => m.map((r) => r.join(" ")).join("  ");
// luminance weights
const LUM = [0.3, 0.59, 0.11];

// out = base + k·lum (+ a share of the original colour), per channel
const darkMatrix = (
  base: [number, number, number],
  k: [number, number, number],
  keep: number,
) =>
  rowsOf(
    [0, 1, 2]
      .map((c) => [
        ...LUM.map((w, j) => w * k[c] + (j === c ? keep : 0)),
        0,
        base[c],
      ])
      .concat([[0, 0, 0, 1, 0]]),
  );

// Rear piece: paper white → about #4f4236, red → a dull brown, ink stays ink.
const REAR = darkMatrix([0.05, 0.042, 0.035], [0.26, 0.22, 0.178], 0);
// Cell after the fire: white → charcoal #5a5650, black → #1a1918 (the ink lines stay a step darker), a faint trace of
// the red left in the red blocks.
const CHAR = darkMatrix([0.075, 0.073, 0.07], [0.27, 0.26, 0.25], 0.07);
// The rails once the fire is out: no firelight on them, paper → a night grey.
const RAILS_DIM = darkMatrix([0.05, 0.05, 0.05], [0.52, 0.52, 0.52], 0);

// Filter defs for the rear piece. `rimDx`: screen px toward the fire (negative: the fire is to the left).
export const RearShadowFilter: React.FC<{
  id: string;
  rim: string | null;
  rimDx?: number;
}> = ({ id, rim, rimDx = -5 }) => (
  <filter
    id={id}
    x="-5%"
    y="-5%"
    width="110%"
    height="110%"
    colorInterpolationFilters="sRGB"
  >
    <feColorMatrix type="matrix" values={REAR} result="dark" />
    {rim ? (
      <>
        {/* the edge facing the fire: the silhouette minus itself shifted away from the fire */}
        <feOffset in="SourceAlpha" dx={-rimDx} dy={2} result="shift" />
        <feComposite
          in="SourceAlpha"
          in2="shift"
          operator="out"
          result="edge"
        />
        <feGaussianBlur in="edge" stdDeviation={1.2} result="soft" />
        <feFlood floodColor={rim} floodOpacity={0.55} />
        <feComposite in2="soft" operator="in" result="rim" />
        <feMerge>
          <feMergeNode in="dark" />
          <feMergeNode in="rim" />
        </feMerge>
      </>
    ) : null}
  </filter>
);

export const CharFilter: React.FC<{ id: string }> = ({ id }) => (
  <filter id={id} colorInterpolationFilters="sRGB">
    <feColorMatrix type="matrix" values={CHAR} />
  </filter>
);

export const RailShadeFilter: React.FC<{ id: string }> = ({ id }) => (
  <filter id={id} colorInterpolationFilters="sRGB">
    <feColorMatrix type="matrix" values={RAILS_DIM} />
  </filter>
);

// Focus on GRO in the fire (user review 2026-10-05: GRO is the subject, not the wreck): the wreck around him recedes,
// darker (the heat haze already softens it; a blur here would smear its dot screens into streaks once the haze screens
// them again), while he stays crisp. `amount` 0–1: how far it recedes (ART-23: burnt wreckage does not
// steal the focus).
const recedeMatrix = (amount: number) => {
  const keep = 1 - 0.45 * amount; // the colour kept
  const warm = [0.035, 0.02, 0.008].map((w) => w * amount); // a little of the fire's warm dark
  return rowsOf(
    [0, 1, 2]
      .map((c) =>
        [0, 1, 2].map((j) => (j === c ? keep : 0)).concat([0, warm[c]]),
      )
      .concat([[0, 0, 0, 1, 0]]),
  );
};
export const RecedeFilter: React.FC<{ id: string; amount: number }> = ({
  id,
  amount,
}) => (
  <filter
    id={id}
    x="-5%"
    y="-5%"
    width="110%"
    height="110%"
    colorInterpolationFilters="sRGB"
  >
    <feColorMatrix type="matrix" values={recedeMatrix(amount)} />
  </filter>
);

// Depth of field for someone out of the focal plane (the doctor beside GRO in 3.6), or for a moment whose outcome is
// not known yet (the 0 秒 panel): a soft blur in screen pixels and a step darker, so the eye goes to what is sharp.
export const DefocusFilter: React.FC<{
  id: string;
  blur: number;
  dim?: number;
}> = ({ id, blur, dim = 1 }) => (
  <filter
    id={id}
    x="-20%"
    y="-20%"
    width="140%"
    height="140%"
    colorInterpolationFilters="sRGB"
  >
    <feGaussianBlur stdDeviation={blur} />
    {dim < 1 ? (
      <feColorMatrix
        type="matrix"
        values={`${dim} 0 0 0 0  0 ${dim} 0 0 0  0 0 ${dim} 0 0  0 0 0 1 0`}
      />
    ) : null}
  </filter>
);

// photo-space bounding box of the traced body
const BODY_NUMS = (VF20.body.match(/-?\d*\.?\d+/g) ?? []).map(Number);
const BODY_X = BODY_NUMS.filter((_, i) => i % 2 === 0);
const BODY_Y = BODY_NUMS.filter((_, i) => i % 2 === 1);
// the cell only: everything in front of the break (the car faces left in photo space)
const BREAK_NUMS = (VF20.breakLine?.match(/-?\d*\.?\d+/g) ?? []).map(Number);
const BREAK_X0 = Math.min(...BREAK_NUMS.filter((_, i) => i % 2 === 0));
const BOX = {
  x0: Math.min(...BODY_X),
  x1: Math.min(Math.max(...BODY_X), BREAK_X0 - 10),
  y0: Math.min(...BODY_Y),
  y1: Math.max(...BODY_Y),
};
// a soft irregular blob (no outline: ART-11)
const blob = (cx: number, cy: number, rx: number, ry: number, seed: string) => {
  const n = 9;
  const pts = Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    const k = 0.7 + 0.5 * random(`${seed}-${i}`);
    return [cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k];
  });
  const mid = (p: number[], q: number[]) => [
    (p[0] + q[0]) / 2,
    (p[1] + q[1]) / 2,
  ];
  const start = mid(pts[n - 1], pts[0]);
  return `M ${start[0].toFixed(1)} ${start[1].toFixed(1)} ${pts
    .map((p, i) => {
      const m = mid(p, pts[(i + 1) % n]);
      return `Q ${p[0].toFixed(1)} ${p[1].toFixed(1)} ${m[0].toFixed(1)} ${m[1].toFixed(1)}`;
    })
    .join(" ")} Z`;
};
// ash: long streaks along the top of the cell and a few on its flank (as on the remains: grey ash over the black
// carbon), drawn as a light dot screen
const ASH = Array.from({ length: 9 }, (_, i) => {
  const u = (i + 0.5) / 9;
  const top = i % 3 !== 2;
  return {
    cx: BOX.x0 + (BOX.x1 - BOX.x0) * (0.1 + 0.85 * u),
    cy:
      BOX.y0 + (BOX.y1 - BOX.y0) * (top ? 0.42 + 0.1 * random(`ay${i}`) : 0.68),
    rx: 70 + 60 * random(`ax${i}`),
    ry: 12 + 12 * random(`ar${i}`),
  };
});
// small blisters: raised paint bubbles, a light pock with a dark shadow under it
const BLISTERS = Array.from({ length: 10 }, (_, i) => ({
  x: BOX.x0 + (BOX.x1 - BOX.x0) * (0.2 + 0.75 * random(`bx${i}`)),
  y: BOX.y0 + (BOX.y1 - BOX.y0) * (0.5 + 0.3 * random(`by${i}`)),
  r: 3 + 3 * random(`br${i}`),
}));
const ASH_GREY = "#a39b91";

// Ash, soot and blisters over the charred cell, in the car's photo space (`transform`: cellTransform), clipped to its
// body outline.
export const CharMarks: React.FC<{ transform: string; k: number }> = ({
  transform,
  k,
}) => {
  const id = `cm${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  return (
    <g transform={transform}>
      <defs>
        <clipPath id={`${id}-c`}>
          <path d={VF20.body} />
          {VF20.regions?.sidepod ? <path d={VF20.regions.sidepod} /> : null}
        </clipPath>
        <TonePattern id={`${id}-s`} r={1.6 / k} gap={5 / k} />
        {/* ash: light grey dots on a fine screen, fixed in screen size like every tone */}
        <pattern
          id={`${id}-a`}
          width={6 / k}
          height={6 / k}
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <circle cx={3 / k} cy={3 / k} r={1.7 / k} fill={ASH_GREY} />
        </pattern>
      </defs>
      <g clipPath={`url(#${id}-c)`}>
        {/* soot: a fine dot screen over the whole cell */}
        <rect
          x={BOX.x0}
          y={BOX.y0}
          width={BOX.x1 - BOX.x0}
          height={BOX.y1 - BOX.y0}
          fill={`url(#${id}-s)`}
          opacity={0.45}
        />
        {ASH.map((a, i) => (
          <path
            key={`a${i}`}
            d={blob(a.cx, a.cy, a.rx, a.ry, `ash${i}`)}
            fill={`url(#${id}-a)`}
            opacity={0.85}
          />
        ))}
        {BLISTERS.map((b, i) => (
          <g key={`b${i}`}>
            <circle
              cx={b.x}
              cy={b.y + b.r * 0.35}
              r={b.r}
              fill="#121110"
              opacity={0.25}
            />
            <circle
              cx={b.x}
              cy={b.y}
              r={b.r * 0.8}
              fill="#6d6760"
              opacity={0.7}
            />
          </g>
        ))}
      </g>
    </g>
  );
};

// The last of the fire on the ground along the rails, `x0`..`x1` (screen px) at ground line `y`.
export const DyingFire: React.FC<{
  x0: number;
  x1: number;
  y: number;
  frame: number;
  palette: FirePalette;
  seed: string;
}> = ({ x0, x1, y, frame, palette, seed }) => {
  const id = `df${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const w = x1 - x0;
  const glow = palette.glow ?? palette.ember;
  // a few small flames, each breathing on its own
  const flames = [0.18, 0.47, 0.8].map((u, i) => ({
    x: x0 + w * u,
    h: 190 + 50 * random(`${seed}-h${i}`),
    w: 75 + 25 * random(`${seed}-w${i}`),
  }));
  // the bed: a low, uneven mound of charred debris along the rails, glowing through in long streaks that pulse slowly
  const N = 28;
  const mound = Array.from({ length: N + 1 }, (_, i) => {
    const u = i / N;
    const edge = Math.min(1, u * 8, (1 - u) * 8);
    return {
      x: x0 + w * u,
      y: y - edge * (10 + 9 * random(`${seed}-m${i}`)),
    };
  });
  const moundD = `M ${x0} ${y + 6} ${mound
    .map((p) => `L ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(" ")} L ${x1} ${y + 6} Z`;
  const streaks = Array.from({ length: 12 }, (_, i) => {
    const u = (i + 0.2 + 0.6 * random(`${seed}-sx${i}`)) / 12;
    const pulse =
      0.5 +
      0.5 *
        Math.sin(frame * (0.035 + 0.03 * random(`${seed}-sp${i}`)) + i * 2.3);
    return {
      x: x0 + w * u,
      y: y - 7 - 4 * random(`${seed}-sy${i}`),
      rx: w * (0.03 + 0.03 * random(`${seed}-sr${i}`)),
      pulse,
    };
  });
  return (
    <g>
      <defs>
        <radialGradient id={`${id}-g`}>
          <stop offset="0%" stopColor={glow} stopOpacity={0.5} />
          <stop offset="100%" stopColor={glow} stopOpacity={0} />
        </radialGradient>
        <filter id={`${id}-b`} x="-20%" y="-300%" width="140%" height="700%">
          <feGaussianBlur stdDeviation={3.5} />
        </filter>
      </defs>
      {/* the bed's low glow on the ground */}
      <ellipse
        cx={(x0 + x1) / 2}
        cy={y - 8}
        rx={w * 0.55}
        ry={36}
        fill={`url(#${id}-g)`}
        style={{ mixBlendMode: "screen" }}
      />
      <path d={moundD} fill="#14100d" />
      <g filter={`url(#${id}-b)`}>
        {streaks.map((c, i) => (
          <g key={i}>
            <ellipse
              cx={c.x}
              cy={c.y}
              rx={c.rx}
              ry={7}
              fill={palette.ember}
              opacity={0.45 + 0.55 * c.pulse}
            />
            <ellipse
              cx={c.x}
              cy={c.y}
              rx={c.rx * 0.4}
              ry={2.2}
              fill={palette.emberHot}
              opacity={0.7 * c.pulse}
            />
          </g>
        ))}
      </g>
      {flames.map((fl, i) => (
        <Fire
          key={i}
          x={fl.x}
          y={y - 4}
          w={fl.w}
          h={fl.h}
          frame={frame + i * 17}
          seed={`${seed}-f${i}`}
          tongues={2}
          embers={0}
          palette={{ ...palette, glow: null }}
          intensity={0.85 + 0.15 * Math.sin(frame * 0.07 + i * 2)}
          smoke={false}
        />
      ))}
      {flames.map((fl, i) => (
        <g key={`e${i}`} transform={`translate(${fl.x} ${y})`}>
          <Embers
            w={fl.w * 1.4}
            h={fl.h * 1.6}
            frame={frame + i * 29}
            seed={`${seed}-s${i}`}
            palette={palette}
            count={4}
            size={2.2}
          />
        </g>
      ))}
    </g>
  );
};
