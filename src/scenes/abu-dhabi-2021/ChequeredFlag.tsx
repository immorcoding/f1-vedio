// The chequered flag, waving: a black-and-white cloth (allowed by ART-8 as it is black and white) on a pole, its
// grid displaced by a travelling wave so it ripples frame to frame. Drawn in a box of `w` × `h` at (x, y).
import { INK, PAPER } from "../../kit/colors";

export const ChequeredFlag: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  t: number;
  /** Swing of the whole flag, degrees (a marshal's wave). */
  swing?: number;
}> = ({ x, y, w, h, t, swing = 0 }) => {
  const cols = 8;
  const rows = 6;
  const cw = w / cols;
  const rh = h / rows;
  // cloth point (i, j) → screen, with a wave travelling away from the pole
  const pt = (i: number, j: number) => {
    const u = i / cols;
    const amp = u * h * 0.09;
    const dy = Math.sin(u * 5.5 - t * 9) * amp;
    const dx = -Math.abs(Math.sin(u * 5.5 - t * 9)) * u * cw * 0.25;
    return [x + i * cw + dx, y + j * rh + dy] as const;
  };
  const cells: { d: string; dark: boolean; shade: number }[] = [];
  for (let i = 0; i < cols; i++)
    for (let j = 0; j < rows; j++) {
      const a = pt(i, j);
      const b = pt(i + 1, j);
      const c = pt(i + 1, j + 1);
      const d = pt(i, j + 1);
      const slope = Math.cos(((i + 0.5) / cols) * 5.5 - t * 9);
      cells.push({
        d: `M ${a[0]} ${a[1]} L ${b[0]} ${b[1]} L ${c[0]} ${c[1]} L ${d[0]} ${d[1]} Z`,
        dark: (i + j) % 2 === 0,
        shade: slope,
      });
    }
  const outline = [
    ...Array.from({ length: cols + 1 }, (_, i) => pt(i, 0)),
    ...Array.from({ length: rows + 1 }, (_, j) => pt(cols, j)),
    ...Array.from({ length: cols + 1 }, (_, i) => pt(cols - i, rows)),
  ];
  return (
    <g transform={`rotate(${swing} ${x} ${y + h})`}>
      <path d={`M ${x - 6} ${y - 30} L ${x - 6} ${y + h * 2.2}`} stroke={INK} strokeWidth={16} strokeLinecap="round" />
      <path d={`M ${x - 6} ${y - 30} L ${x - 6} ${y + h * 2.2}`} stroke={PAPER} strokeWidth={5} strokeLinecap="round" />
      {cells.map((c, k) => (
        <path key={k} d={c.d} fill={c.dark ? INK : PAPER} />
      ))}
      {/* folds: the side of each ripple facing away from the light gets a dark sweep */}
      {cells.map((c, k) =>
        c.shade < -0.3 && !c.dark ? (
          <path key={`s${k}`} d={c.d} fill={INK} opacity={0.18 * -c.shade} />
        ) : null,
      )}
      <path
        d={`M ${outline.map((p) => `${p[0]} ${p[1]}`).join(" L ")} L ${x} ${y} Z`}
        fill="none"
        stroke={INK}
        strokeWidth={6}
        strokeLinejoin="round"
      />
    </g>
  );
};
