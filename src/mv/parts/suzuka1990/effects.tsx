// Effects of the Suzuka 1990 crash, drawn in a side-on panel's pinhole camera (ART-9): the gravel trap on the outside
// of Turn 1, the inside kerb in the foreground, dust thrown up by the cars in the gravel, and debris flying from the
// hit. All deterministic (seeded), all in the black-and-white environment style (ART-8) except the car fragments,
// which carry the cars' own colours.
import { random } from "remotion";
import type { Camera } from "../../../kit/camera";
import { INK, PAPER } from "../../../kit/colors";
import { tone } from "../../../kit/tone";

// Visible world x range at depth z.
const range = (cam: Camera, camX: number, z: number, margin = 200) =>
  [
    camX + ((-margin - cam.cx) * z) / cam.f,
    camX + ((1920 + margin - cam.cx) * z) / cam.f,
  ] as const;

// The gravel trap between depths z0 and z1: paper ground with a stipple of stones, finer with distance.
export const GravelTrap: React.FC<{
  cam: Camera;
  camX: number;
  z0: number;
  z1: number;
}> = ({ cam, camX, z0, z1 }) => {
  const Y = (z: number) => cam.screenY(0, z);
  const stones: string[] = [];
  const cell = 0.7;
  for (let zi = 0; zi < (z1 - z0) / cell; zi++) {
    const z = z0 + zi * cell;
    const [x0, x1] = range(cam, camX, z, 60);
    for (let k = Math.floor(x0 / cell); k <= Math.ceil(x1 / cell); k++) {
      const q = (s: string) => random(`gv-${s}-${zi}-${k}`);
      if (q("skip") < 0.35) continue;
      const x = k * cell + q("x") * cell - camX;
      const zz = z + q("z") * cell;
      const r = Math.max(0.8, (0.045 + 0.04 * q("r")) * cam.pxPerMetre(zz));
      const sx = cam.screenX(x, zz);
      const sy = Y(zz);
      stones.push(
        `M ${(sx - r).toFixed(1)} ${sy.toFixed(1)} a ${r.toFixed(1)} ${(r * 0.6).toFixed(1)} 0 1 0 ${(2 * r).toFixed(1)} 0 a ${r.toFixed(1)} ${(r * 0.6).toFixed(1)} 0 1 0 ${(-2 * r).toFixed(1)} 0`,
      );
    }
  }
  return (
    <g>
      <rect
        x={-400}
        y={Y(z1)}
        width={2720}
        height={Y(z0) - Y(z1)}
        fill={PAPER}
      />
      <path d={stones.join(" ")} fill={INK} opacity={0.55} />
      <path
        d={`M -400 ${Y(z0)} L 2320 ${Y(z0)}`}
        stroke={INK}
        strokeWidth={3}
      />
      <path
        d={`M -400 ${Y(z1)} L 2320 ${Y(z1)}`}
        stroke={INK}
        strokeWidth={2}
      />
    </g>
  );
};

// The inside kerb of Turn 1 along the near edge of the track, with grass below it to the bottom of the frame.
export const NearKerb: React.FC<{
  cam: Camera;
  camX: number;
  edge: number;
}> = ({ cam, camX, edge }) => {
  const inner = edge - 1.1;
  const Y = (z: number) => cam.screenY(0, z);
  const [x0, x1] = range(cam, camX, inner, 300);
  const blocks: { d: string; dark: boolean }[] = [];
  for (let k = Math.floor(x0 / 1.2); k <= Math.ceil(x1 / 1.2); k++) {
    const a = k * 1.2 - camX;
    const b = a + 1.2;
    blocks.push({
      d: `M ${cam.screenX(a, edge)} ${Y(edge)} L ${cam.screenX(b, edge)} ${Y(edge)} L ${cam.screenX(b, inner)} ${Y(inner)} L ${cam.screenX(a, inner)} ${Y(inner)} Z`,
      dark: k % 2 === 0,
    });
  }
  return (
    <g>
      <rect
        x={-400}
        y={Y(inner)}
        width={2720}
        height={1400}
        fill={tone("light")}
      />
      {blocks.map((b) => (
        <path
          key={b.d}
          d={b.d}
          fill={b.dark ? INK : PAPER}
          stroke={INK}
          strokeWidth={2}
        />
      ))}
      <path
        d={`M -400 ${Y(inner)} L 2320 ${Y(inner)}`}
        stroke={INK}
        strokeWidth={4}
      />
    </g>
  );
};

// A cloud of dust: overlapping inked puffs with a tone shadow on their lower side, billowing up and back from a
// point on the ground. `grow` 0–1 builds it up, `fade` 0–1 thins it out (it settles: puffs sink and shrink).
export const Dust: React.FC<{
  x: number;
  y: number;
  // size of one puff, px
  size: number;
  n: number;
  grow: number;
  fade?: number;
  // direction the cloud trails, -1 = to the left, 1 = to the right
  dir?: number;
  seed: string;
}> = ({ x, y, size, n, grow, fade = 0, dir = 1, seed }) => {
  if (grow <= 0 || fade >= 1) return null;
  return (
    <g opacity={1 - fade}>
      {Array.from({ length: n }, (_, i) => {
        const q = (k: string) => random(`${seed}-${k}-${i}`);
        const k = i / Math.max(1, n - 1);
        const appear = Math.min(1, Math.max(0, (grow - k * 0.6) / 0.4));
        if (appear <= 0) return null;
        const r =
          size *
          (0.55 + 0.7 * q("r")) *
          (0.5 + 0.5 * appear) *
          (1 - 0.35 * fade);
        const cx =
          x +
          dir * (k * size * 3.2 + (q("x") - 0.5) * size) * (0.6 + 0.4 * grow);
        const cy =
          y - size * (0.2 + 1.6 * q("y") * k) * grow + fade * size * 0.8;
        return (
          <g key={i}>
            <circle
              cx={cx}
              cy={cy}
              r={r}
              fill={PAPER}
              stroke={INK}
              strokeWidth={2.6}
            />
            <path
              d={`M ${cx - r * 0.75} ${cy + r * 0.55} A ${r} ${r} 0 0 0 ${cx + r * 0.9} ${cy + r * 0.3}`}
              fill="none"
              stroke={tone("light")}
              strokeWidth={r * 0.45}
            />
          </g>
        );
      })}
    </g>
  );
};

// Debris thrown from the hit: carbon and bodywork shards on ballistic arcs. `t` is seconds since the hit; `pxPerMetre`
// the scale at the contact's depth.
export const Debris: React.FC<{
  x: number;
  y: number;
  t: number;
  pxPerMetre: number;
  colors: string[];
  seed: string;
  n?: number;
}> = ({ x, y, t, pxPerMetre, colors, seed, n = 14 }) => {
  if (t < 0) return null;
  return (
    <g>
      {Array.from({ length: n }, (_, i) => {
        const q = (k: string) => random(`${seed}-${k}-${i}`);
        const vx = (q("vx") - 0.65) * 14;
        const vy = 3 + q("vy") * 7;
        const tt = Math.min(t, 1.4);
        const dx = vx * tt;
        const dy = vy * tt - 4.9 * tt * tt;
        if (dy < -0.3) return null;
        const sx = x + dx * pxPerMetre;
        const sy = y - dy * pxPerMetre;
        const s = (0.06 + 0.12 * q("s")) * pxPerMetre;
        const rot = q("rot") * 360 + t * 720 * (q("spin") - 0.5);
        return (
          <path
            key={i}
            d={`M ${-s} ${-s * 0.3} L ${s * 0.4} ${-s * 0.6} L ${s} ${s * 0.2} L ${-s * 0.2} ${s * 0.5} Z`}
            transform={`translate(${sx} ${sy}) rotate(${rot})`}
            fill={colors[i % colors.length]}
            stroke={INK}
            strokeWidth={2.5}
            strokeLinejoin="round"
          />
        );
      })}
    </g>
  );
};
