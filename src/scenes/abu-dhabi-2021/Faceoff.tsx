// VER and HAM face to face (treatment 4.2 and 5.7): a split page of two manga panels, each a tight close-up of the
// driver's cockpit — the settled car art drawn ~700 px/m, so the helmet, halo and HANS are the real traced ones
// (ART-13) — VER's RB16B facing right on the left, HAM's W12 facing left on the right, looking at each other across
// the gutter. Below them, on the gutter, the points in the shared points box (src/kit/points-box.tsx, #17).
// `zoom` pushes both panels in on the helmets (4.2 steps in every bar, from the whole cockpit to the visor, #21) and
// `boxFlash` flashes the points box once (an inverted frame and a punch); 5.7 leaves both at their defaults.
import { MangaCar, RB16B, W12, type CarSpec } from "../../cars";
import { CAR_UNITS_PER_METRE } from "../../cars/spec";
import { INK, PAPER } from "../../kit/colors";
import { InkFilterDef, inkFilter } from "../../kit/ink";
import { useLettering } from "../../kit/lettering";
import { PointsBox, pointsBoxSize, type PointsColumn } from "../../kit/points-box";
import { focusLines, speedLines } from "../../kit/lines";
import { ToneDefs } from "../../kit/tone";

// Screen anchor that puts the car's helmet centre at (hx, hy) at `ppm` px per metre.
export const helmetAnchor = (car: CarSpec, hx: number, hy: number, ppm: number) => {
  const k = (car.frame.k * ppm) / CAR_UNITS_PER_METRE;
  return {
    x: hx - (car.frame.x - car.helmetAt.cx) * k,
    y: hy - (car.helmetAt.cy - car.frame.ground) * k,
    pxPerMetre: ppm,
  };
};

export type FaceoffSide = {
  /** Panel emphasis: 1 normal, > 1 grows (the winner), < 1 recedes (tone over it). */
  weight?: number;
};

/** The points box under the helmets: its columns (VER, HAM) and its slam and gold times (src/kit/points-box.tsx). */
export type FaceoffPoints = {
  columns: readonly PointsColumn[];
  /** Seconds since the box slams in (negative: not yet). */
  since: number;
  /** Seconds since the gold stroke lands on the leader (omitted: no gold). */
  goldSince?: number;
};

// The box's numeral size and centre height: where the two big numbers of v1 stood, under the cockpits.
const BOX_SIZE = 150;
const BOX_Y = 912;

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
  /** Radius around the helmet the focus lines keep clear. */
  clear: number;
}> = ({ id, poly, car, mirror, helmet, ppm, t, speed, dim, wheel, clear }) => {
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
            d={focusLines(helmet.x, helmet.y, clear, 120, Math.floor(t * 8) + (mirror ? 50 : 0))}
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

/**
 * `open` 0..1 slides the two panels in from the sides; `t` seconds drives the lines; `speed` 0..1 their intensity;
 * `shake` px. `ver` / `ham` weight the panels; `points` is the box on the gutter.
 */
export const Faceoff: React.FC<{
  t: number;
  open: number;
  speed: number;
  shake?: number;
  ver: FaceoffSide;
  ham: FaceoffSide;
  points: FaceoffPoints;
  flash?: number;
  /** Push-in on the helmets: 1 = the whole cockpit (default), ~3 = the visor fills the panel. */
  zoom?: number;
  /** 0..1: the points box flashes (inverts) and punches. */
  boxFlash?: number;
}> = ({ t, open, speed, shake = 0, ver, ham, points, flash = 0, zoom = 1, boxFlash = 0 }) => {
  useLettering();
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
  const ppm = 640 * zoom;
  // helmets sit a third of the way in from the gutter, eye to eye; pushed in, they back off from the gutter so the
  // visors are what meet across it
  const gap = 330 + 60 * (zoom - 1);
  const hy = 470 - 20 * (zoom - 1);
  const vh = { x: mid - gap + slideL, y: hy };
  const hh = { x: mid + gap + slideR, y: hy };
  const clear = 330 * Math.min(zoom, 1.6);
  const box = pointsBoxSize(points.columns, BOX_SIZE);
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
          clear={clear}
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
          clear={clear}
        />
        <g transform={`translate(${mid} ${BOX_Y}) rotate(-2) scale(${1 + 0.14 * boxFlash})`}>
          <PointsBox
            columns={points.columns}
            size={BOX_SIZE}
            since={points.since}
            goldSince={points.goldSince}
          />
          {boxFlash > 0.02 ? (
            <>
              {/* the flash: the box inverts (ink page, paper numerals) and throws a ring of ticks */}
              <rect
                x={-box.w / 2}
                y={-box.h / 2}
                width={box.w}
                height={box.h}
                fill="#ffffff"
                style={{ mixBlendMode: "difference" }}
                opacity={Math.min(1, boxFlash * 1.6)}
              />
              <path
                d={Array.from({ length: 16 }, (_, i) => {
                  const a = (i / 16) * Math.PI * 2 + 0.2;
                  const c = Math.cos(a);
                  const sn = Math.sin(a);
                  const rx = box.w / 2 + 30;
                  const ry = box.h / 2 + 30;
                  const l = 40 + 60 * boxFlash;
                  return `M ${c * rx} ${sn * ry} L ${c * (rx + l)} ${sn * (ry + l)}`;
                }).join(" ")}
                stroke={PAPER}
                strokeWidth={7}
                strokeLinecap="round"
                opacity={boxFlash}
              />
            </>
          ) : null}
        </g>
      </g>
      {flash > 0 ? <rect width={1920} height={1080} fill={PAPER} opacity={flash} /> : null}
    </svg>
  );
};
