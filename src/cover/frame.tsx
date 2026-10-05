// Shared pieces of the cover stills: the page (an SVG in a 1920-wide user space whose height follows the output's
// aspect, so 16:9 is 1920×1080, Bilibili's 16:10 is 1920×1201 and 4:3 is 1920×1440), panel geometry and a coarse cover screentone.
import { AbsoluteFill } from "remotion";
import { INK, PAPER } from "../kit/colors";
import { TonePattern, ToneDefs } from "../kit/tone";

export const W = 1920;
export type CoverProps = { h: number };
export const H_16x9 = 1080;
export const H_16x10 = (1920 * 717) / 1146;
export const H_4x3 = 1440;

export const CoverPage: React.FC<{ h: number; children: React.ReactNode }> = ({
  h,
  children,
}) => (
  <AbsoluteFill style={{ backgroundColor: PAPER }}>
    <svg
      width="100%"
      height="100%"
      viewBox={`0 0 ${W} ${h}`}
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <ToneDefs />
        {/* coarse screens for the cover: big enough dots to read as manga tone in a feed */}
        <TonePattern id="ct-light" r={2.6} gap={12} paper />
        <TonePattern id="ct-mid" r={4.2} gap={12} paper />
        <TonePattern id="ct-dark" r={5.6} gap={12} paper />
        <TonePattern id="ct-glaze" r={3.4} gap={12} />
      </defs>
      {children}
    </svg>
  </AbsoluteFill>
);

export const ct = (level: "light" | "mid" | "dark" | "glaze") =>
  `url(#ct-${level})`;

export type Pt = { x: number; y: number };
export const poly = (pts: Pt[]) =>
  `M ${pts.map((p) => `${p.x} ${p.y}`).join(" L ")} Z`;

// Line through a, b (infinite) intersected with the line through c, d.
export const meet = (a: Pt, b: Pt, c: Pt, d: Pt): Pt => {
  const r = { x: b.x - a.x, y: b.y - a.y };
  const s = { x: d.x - c.x, y: d.y - c.y };
  const den = r.x * s.y - r.y * s.x;
  const t = ((c.x - a.x) * s.y - (c.y - a.y) * s.x) / den;
  return { x: a.x + t * r.x, y: a.y + t * r.y };
};

/** A panel border: heavy ink line round a path. */
export const PanelBorder: React.FC<{ d: string; width?: number }> = ({
  d,
  width = 9,
}) => (
  <path d={d} fill="none" stroke={INK} strokeWidth={width} strokeLinejoin="miter" />
);
