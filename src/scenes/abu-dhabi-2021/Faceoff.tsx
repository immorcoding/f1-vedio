// VER and HAM face to face (treatment 4.2 and 5.7): a split page of two manga panels, each a tight close-up of the
// driver's cockpit — the settled car art drawn ~700 px/m, so the helmet, halo and HANS are the real traced ones
// (ART-13) — VER's RB16B facing right on the left, HAM's W12 facing left on the right, looking at each other across
// the gutter. Under each, the driver's points in big type.
import { MangaCar, RB16B, W12, type CarSpec } from "../../cars";
import { CAR_UNITS_PER_METRE } from "../../cars/spec";
import { INK, PAPER } from "../../kit/colors";
import { InkFilterDef, inkFilter } from "../../kit/ink";
import { CAPTION_FONT, TITLE_FONT, lean } from "../../kit/lettering";
import { focusLines, speedLines } from "../../kit/lines";
import { ToneDefs } from "../../kit/tone";

// Screen anchor that puts the car's helmet centre at (hx, hy) at `ppm` px per metre.
const helmetAnchor = (car: CarSpec, hx: number, hy: number, ppm: number) => {
  const k = (car.frame.k * ppm) / CAR_UNITS_PER_METRE;
  return {
    x: hx - (car.frame.x - car.helmetAt.cx) * k,
    y: hy - (car.helmetAt.cy - car.frame.ground) * k,
    pxPerMetre: ppm,
  };
};

export type FaceoffSide = {
  points: string;
  /** 0..1 how far the points have landed (scale-in / flip). */
  land: number;
  /** Panel emphasis: 1 normal, > 1 grows (the winner), < 1 recedes (tone over it). */
  weight?: number;
};

const GUTTER = 26;

// One panel: a quadrilateral with a slanted inner edge.
const Panel: React.FC<{
  id: string;
  poly: string;
  car: CarSpec;
  mirror: boolean;
  helmet: { x: number; y: number };
  ppm: number;
  t: number;
  speed: number;
  dim: number;
  wheel: number;
}> = ({ id, poly, car, mirror, helmet, ppm, t, speed, dim, wheel }) => {
  const a = helmetAnchor(car, helmet.x, helmet.y, ppm);
  const flip = mirror
    ? `translate(${helmet.x} 0) scale(-1 1) translate(${-helmet.x} 0)`
    : undefined;
  return (
    <g>
      <defs>
        <clipPath id={id}>
          <path d={poly} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id})`}>
        <rect x={0} y={0} width={1920} height={1080} fill={INK} />
        {/* night air streaming past: white speed lines, against the direction of travel */}
        <g transform={flip}>
          <path
            d={speedLines({
              x: -200,
              y: 60,
              w: 2300,
              h: 900,
              n: 46,
              seed: `${id}-${Math.floor(t * 15)}`,
              angle: 180,
              thickness: 5,
              length: [0.2, 0.55],
            })}
            fill={PAPER}
            opacity={0.35 + 0.4 * speed}
          />
          <path
            d={focusLines(helmet.x, helmet.y, 330, 120, Math.floor(t * 8) + (mirror ? 50 : 0))}
            fill={PAPER}
            opacity={0.1 + 0.25 * speed}
          />
          <MangaCar
            car={car}
            at={a}
            state={{ wheelAngle: wheel, compound: car.compound }}
          />
        </g>
        {dim > 0 ? (
          <rect x={0} y={0} width={1920} height={1080} fill={INK} opacity={0.6 * dim} />
        ) : null}
      </g>
      <path d={poly} fill="none" stroke={PAPER} strokeWidth={9} />
      <path d={poly} fill="none" stroke={INK} strokeWidth={4} />
    </g>
  );
};

const Points: React.FC<{
  x: number;
  y: number;
  code: string;
  side: FaceoffSide;
  anchor: "start" | "end";
}> = ({ x, y, code, side, anchor }) => {
  const s = side.land;
  if (s <= 0) return null;
  const pop = 1 + 0.35 * Math.max(0, 1 - s);
  return (
    <g transform={`translate(${x} ${y}) scale(${pop}) translate(${-x} ${-y})`} opacity={Math.min(1, s * 3)}>
      <text
        x={x}
        y={y}
        textAnchor={anchor}
        transform={lean(x, y)}
        fontFamily={TITLE_FONT}
        fontWeight={900}
        fontSize={168}
        fill={PAPER}
        stroke={INK}
        strokeWidth={14}
        paintOrder="stroke"
      >
        {side.points}
      </text>
      <text
        x={x}
        y={y - 150}
        textAnchor={anchor}
        fontFamily={CAPTION_FONT}
        fontWeight={700}
        fontSize={58}
        fill={PAPER}
        stroke={INK}
        strokeWidth={10}
        paintOrder="stroke"
      >
        {code}
      </text>
    </g>
  );
};

/**
 * `open` 0..1 slides the two panels in from the sides; `t` seconds drives the lines; `speed` 0..1 their intensity;
 * `shake` px. `ver` / `ham` are the points lines. `dot` 0..1 shows the "·" between the two numbers.
 */
export const Faceoff: React.FC<{
  t: number;
  open: number;
  speed: number;
  shake?: number;
  ver: FaceoffSide;
  ham: FaceoffSide;
  dot: number;
  flash?: number;
}> = ({ t, open, speed, shake = 0, ver, ham, dot, flash = 0 }) => {
  const vw = ver.weight ?? 1;
  const hw = ham.weight ?? 1;
  // The gutter: a slanted line through the middle, shifted toward the panel that recedes.
  const mid = 960 + (vw - hw) * 260;
  const top = mid + 70;
  const bot = mid - 70;
  const slideL = (1 - open) * -1000;
  const slideR = (1 - open) * 1000;
  const sx = Math.sin(t * 41) * shake;
  const sy = Math.cos(t * 37) * shake;
  const left = `M ${20 + slideL} 20 L ${top - GUTTER / 2 + slideL} 20 L ${bot - GUTTER / 2 + slideL} 1060 L ${20 + slideL} 1060 Z`;
  const right = `M ${top + GUTTER / 2 + slideR} 20 L ${1900 + slideR} 20 L ${1900 + slideR} 1060 L ${bot + GUTTER / 2 + slideR} 1060 Z`;
  const ppm = 640;
  // helmets sit a third of the way in from the gutter, eye to eye
  const vh = { x: mid - 330 + slideL, y: 470 };
  const hh = { x: mid + 330 + slideR, y: 470 };
  return (
    <svg width={1920} height={1080}>
      <defs>
        <ToneDefs />
        <InkFilterDef />
      </defs>
      <rect width={1920} height={1080} fill={PAPER} />
      <g filter={inkFilter()} transform={`translate(${sx} ${sy})`}>
        <Panel
          id="fo-ver"
          poly={left}
          car={RB16B}
          mirror={false}
          helmet={vh}
          ppm={ppm * (0.96 + 0.04 * vw)}
          t={t}
          speed={speed}
          dim={Math.max(0, 1 - vw) * 1.2}
          wheel={t * 400}
        />
        <Panel
          id="fo-ham"
          poly={right}
          car={W12}
          mirror
          helmet={hh}
          ppm={ppm * (0.96 + 0.04 * hw)}
          t={t}
          speed={speed}
          dim={Math.max(0, 1 - hw) * 1.2}
          wheel={t * 400}
        />
        <Points x={mid - 120} y={990} code="VER" side={ver} anchor="end" />
        <Points x={mid + 120} y={990} code="HAM" side={ham} anchor="start" />
        {dot > 0 ? (
          <circle cx={mid} cy={950} r={22 * dot} fill={PAPER} stroke={INK} strokeWidth={8} />
        ) : null}
      </g>
      {flash > 0 ? <rect width={1920} height={1080} fill={PAPER} opacity={flash} /> : null}
    </svg>
  );
};
