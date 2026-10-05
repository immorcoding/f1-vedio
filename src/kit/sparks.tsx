// The spark burst where metal hits metal (a car into a guardrail): one big manga impact flash on the contact point, a
// bold star in the fire's colours (the ART-8 colour exception, ART-21 family): an orange rim, a yellow star and a
// white-hot core, with no ink outline. It lands at full size on the contact frame, flickers a little from frame to
// frame (seeded, so any frame renders on its own) and shrinks and fades by `fadeBy`. The scene places it on the
// contact point as that point moves, and draws it as its top layer. Used by shot 3.3
// (src/mv/parts/bahrain2020/Impact.tsx).
import { starPath } from "./impact";
import type { FirePalette } from "./fire";

export const SparkBurst: React.FC<{
  x: number;
  y: number;
  // radius at full size, px
  r: number;
  // frames since the contact
  t: number;
  // the frame by which it has shrunk away
  fadeBy: number;
  seed: string;
  palette: FirePalette;
}> = ({ x, y, r, t, fadeBy, seed, palette }) => {
  if (t < 0 || t >= fadeBy) return null;
  const u = t / fadeBy;
  // full size for the first third, then it shrinks and fades
  const k = u < 0.3 ? 1 : 1 - (u - 0.3) / 0.7;
  const size = r * (0.35 + 0.65 * k);
  const f = `${seed}-${Math.floor(t)}`;
  return (
    <g opacity={Math.min(1, 2.5 * k)}>
      <path
        d={starPath(x, y, size * 1.12, 12, `${f}-o`, 0.38)}
        fill={palette.orange}
      />
      <path d={starPath(x, y, size, 12, `${f}-y`, 0.4)} fill={palette.yellow} />
      <path
        d={starPath(x, y, size * 0.55, 9, `${f}-c`, 0.5)}
        fill={palette.core}
      />
    </g>
  );
};
