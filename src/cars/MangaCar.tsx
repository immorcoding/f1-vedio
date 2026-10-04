// The manga car renderer: draws any CarSpec as a manga panel car — real livery colours as flat fills, screentone dots
// for shading, inked outlines and white highlights (ART-8, ART-11, ART-12, ART-13). Layers go far side → body → near side.
// Self-contained: it defines its own patterns and clip paths under a unique id, so it needs nothing from the page's <defs>.
import { useId } from "react";
import { INK, PAPER } from "../kit/colors";
import type { ScreenAnchor } from "../kit/camera";
import { Ink } from "../kit/ink";
import { TonePattern, ToneDefs, tone } from "../kit/tone";
import {
  CAR_UNITS_PER_METRE,
  drawnFarWheels,
  endplateCopyTransform,
  photoPxPerMetre,
  type Accent,
  type CarSpec,
  type Driver,
  type EndplateCopy,
  type Wheel,
} from "./spec";
import { TopCar } from "./TopCar";

// How the car is seen: from the side (the traced view), or from above on a track map (TopCar).
export type CarView = "side" | "top";

// Where one piece of a broken car has gone, relative to where it sat on the intact car: metres forward (dx) and up (dy),
// and degrees of pitch (rotate, positive = that piece's front end up), about the middle of the break line.
export type PiecePose = { dx?: number; dy?: number; rotate?: number };

// What the car is doing, all optional; the default is a car at rest.
export type CarState = {
  // Torn in two along the spec's breakLine (side view): the front piece (survival cell, front wheels) and the rear
  // piece (power unit, gearbox, rear wheels, rear wing), each placed by its own pose. `show` draws only one piece, so a
  // scene can layer the pieces with what lies between them (a barrier). Ignored for a spec without a breakLine.
  split?: {
    front?: PiecePose;
    rear?: PiecePose;
    show?: "both" | "front" | "rear";
  };
  // Top view only: the direction the nose points, degrees clockwise from screen right.
  heading?: number;
  // Top view only: front-wheel steer angle, degrees (positive = to the car's right).
  steer?: number;
  // Rotation of the wheels, degrees (clockwise as the car rolls forward). Drive it from the frame to make them roll.
  wheelAngle?: number;
  // Front wheels locked under braking: when set, they stay at this angle and ignore wheelAngle.
  lockFront?: number;
  // Body pitch over the wheels, degrees, positive = nose up (negative for the nose dive under braking). The wheels stay
  // planted; the body turns about the middle of the wheelbase at axle height. Keep it to a few degrees.
  tilt?: number;
  // Tyre sidewall band colour for this race (e.g. PIRELLI_2021.soft); defaults to the spec's.
  compound?: string;
  // Tread: "dry" (slick or grooved: a smooth tyre, the default) or "wet" (intermediate/wet pattern cut into the
  // shoulder), for races where the tyre type matters (Brazil 2008: GLO stays on dry tyres in the rain).
  tread?: Tread;
  // false: an empty cockpit — no helmet, no HANS (the driver has got out).
  driver?: false;
};

export type Tread = "dry" | "wet";

const svgId = (raw: string) => `car${raw.replace(/[^a-zA-Z0-9_-]/g, "")}`;

const spokePath = (w: Wheel, r: number, n: number) =>
  Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    return `M ${w.cx + Math.cos(a) * r * 0.22} ${w.cy + Math.sin(a) * r * 0.22} L ${w.cx + Math.cos(a) * r * 0.94} ${w.cy + Math.sin(a) * r * 0.94}`;
  }).join(" ");

// Wet-weather tread seen from the side: slanted sipes cut into the shoulder all round, turning with the wheel.
const wetSipes = (w: Wheel) =>
  Array.from({ length: 30 }, (_, i) => {
    const a = (i / 30) * Math.PI * 2;
    const b = a + 0.07;
    return `M ${w.cx + Math.cos(a) * (w.r - 1)} ${w.cy + Math.sin(a) * (w.r - 1)} L ${w.cx + Math.cos(b) * (w.r - 15)} ${w.cy + Math.sin(b) * (w.r - 15)}`;
  }).join(" ");

const NearWheel: React.FC<{
  car: CarSpec;
  w: Wheel;
  angle: number;
  compound?: string;
  tread: Tread;
  id: string;
}> = ({ car, w, angle, compound, tread, id }) => (
  <g>
    <circle cx={w.cx} cy={w.cy} r={w.r} fill={INK} />
    {tread === "wet" ? (
      <path
        d={wetSipes(w)}
        transform={`rotate(${-angle} ${w.cx} ${w.cy})`}
        stroke="#5a5a5a"
        strokeWidth={4}
        strokeLinecap="round"
      />
    ) : null}
    <circle
      cx={w.cx}
      cy={w.cy}
      r={w.r - 6}
      fill="none"
      stroke="#2c2c2c"
      strokeWidth={3}
    />
    {compound ? (
      <circle
        cx={w.cx}
        cy={w.cy}
        r={w.r - 24}
        fill="none"
        stroke={compound}
        strokeWidth={6}
      />
    ) : null}
    <g transform={`rotate(${-angle} ${w.cx} ${w.cy})`}>
      {car.rim === "spoked" ? (
        <>
          <circle
            cx={w.cx}
            cy={w.cy}
            r={car.rimR}
            fill={tone("light", id)}
            stroke={INK}
            strokeWidth={4}
          />
          <path
            d={spokePath(w, car.rimR, 10)}
            stroke={INK}
            strokeWidth={6}
            strokeLinecap="round"
          />
          <path
            d={spokePath(w, car.rimR, 10)}
            stroke={PAPER}
            strokeWidth={2}
            strokeLinecap="round"
          />
        </>
      ) : (
        <>
          <circle
            cx={w.cx}
            cy={w.cy}
            r={car.rimR}
            fill={tone("dark", id)}
            stroke={INK}
            strokeWidth={4}
          />
          <path
            d={spokePath(w, car.rimR * 0.8, 12)}
            stroke={PAPER}
            strokeWidth={1.6}
            opacity={0.6}
          />
        </>
      )}
    </g>
    {car.rimAccent ? (
      <circle
        cx={w.cx}
        cy={w.cy}
        r={car.rimR}
        fill="none"
        stroke={car.rimAccent}
        strokeWidth={5}
      />
    ) : null}
    <circle
      cx={w.cx}
      cy={w.cy}
      r={12}
      fill={INK}
      stroke={PAPER}
      strokeWidth={2}
    />
    <path
      d={`M ${w.cx + w.r * 0.15} ${w.cy - w.r * 0.9} A ${w.r * 0.92} ${w.r * 0.92} 0 0 1 ${w.cx + w.r * 0.85} ${w.cy - w.r * 0.32}`}
      fill="none"
      stroke={PAPER}
      strokeWidth={6}
      strokeLinecap="round"
    />
  </g>
);

// A far-side wheel: we see its inner face, in shadow, so no sidewall band — a dark tyre, the dark inner rim and its
// spokes, and scuff marks round the tread. Rim, spokes, scuffs and a wet tread turn with `angle` like the near wheels.
const FarWheel: React.FC<{
  car: CarSpec;
  w: Wheel;
  angle: number;
  tread: Tread;
  id: string;
}> = ({ car, w, angle, tread, id }) => {
  const rimR = car.rimR * (w.r / car.nearWheels[0].r);
  const spin = `rotate(${-angle} ${w.cx} ${w.cy})`;
  return (
    <g>
      <circle cx={w.cx} cy={w.cy} r={w.r} fill={INK} />
      <g transform={spin}>
        {tread === "wet" ? (
          <path
            d={wetSipes(w)}
            stroke="#474747"
            strokeWidth={4}
            strokeLinecap="round"
          />
        ) : (
          Array.from({ length: 16 }, (_, i) => {
            const t = (i / 16) * Math.PI * 2;
            return (
              <path
                key={i}
                d={`M ${w.cx + Math.sin(t) * w.r * 0.7} ${w.cy - Math.cos(t) * w.r * 0.7} L ${w.cx + Math.sin(t) * w.r * 0.97} ${w.cy - Math.cos(t) * w.r * 0.97}`}
                stroke="#3a3a3a"
                strokeWidth={3}
              />
            );
          })
        )}
        <circle
          cx={w.cx}
          cy={w.cy}
          r={rimR}
          fill={tone("dark", id)}
          stroke="#2c2c2c"
          strokeWidth={3}
        />
        <path
          d={spokePath(w, rimR * 0.85, car.rim === "spoked" ? 10 : 12)}
          stroke="#4a4a4a"
          strokeWidth={car.rim === "spoked" ? 4 : 2}
          strokeLinecap="round"
        />
      </g>
      <circle cx={w.cx} cy={w.cy} r={9} fill={INK} />
      <path
        d={`M ${w.cx - w.r * 0.2} ${w.cy - w.r * 0.94} A ${w.r * 0.95} ${w.r * 0.95} 0 0 1 ${w.cx + w.r * 0.7} ${w.cy - w.r * 0.6}`}
        fill="none"
        stroke={PAPER}
        strokeWidth={4}
        opacity={0.8}
      />
    </g>
  );
};

// Side-view race helmet facing left (ART-13): shell with chin bar, tinted visor, livery stripes (or the driver's real
// design), and on a modern shell the top air intake and rear spoiler; shaded with dots. Sized like a real helmet
// (about 0.29 m long) by the trace.
const Helmet: React.FC<{
  car: Pick<CarSpec, "helmetAt" | "driver">;
  id: string;
}> = ({ car, id }) => {
  const { cx, cy, r } = car.helmetAt;
  const {
    base,
    stripe,
    trim = stripe,
    shell: era = "modern",
    design,
  } = car.driver.helmet;
  const P = (x: number, y: number) => `${cx + x * r} ${cy + y * r}`;
  const shell = `M ${P(-0.98, 0.45)} C ${P(-1.08, -0.1)} ${P(-0.75, -0.98)} ${P(0.05, -1)} C ${P(0.7, -1)} ${P(1.05, -0.55)} ${P(1.02, 0.05)} L ${P(0.95, 0.6)} L ${P(-0.6, 0.7)} Z`;
  return (
    <g>
      <defs>
        <clipPath id={`${id}-helmet`}>
          <path d={shell} />
        </clipPath>
      </defs>
      {era === "modern" ? (
        <>
          <path
            d={`M ${P(0.75, -0.75)} L ${P(1.02, -0.82)} L ${P(1.06, -0.58)} Z`}
            fill={base}
            stroke={INK}
            strokeWidth={3}
            strokeLinejoin="round"
          />
          <path
            d={`M ${P(-0.16, -0.99)} L ${P(-0.12, -1.12)} L ${P(0.2, -1.12)} L ${P(0.24, -0.99)} Z`}
            fill={INK}
          />
        </>
      ) : null}
      <path d={shell} fill={base} />
      <g clipPath={`url(#${id}-helmet)`}>
        {design ? (
          <g transform={`translate(${cx} ${cy}) scale(${r})`}>
            {design.map((a) => (
              <path key={a.d} d={a.d} fill={a.color} />
            ))}
          </g>
        ) : (
          <>
            <path
              d={`M ${P(-0.75, -0.7)} C ${P(-0.2, -0.95)} ${P(0.5, -0.86)} ${P(1, -0.32)}`}
              fill="none"
              stroke={stripe}
              strokeWidth={r * 0.2}
            />
            <path
              d={`M ${P(0.1, -0.02)} C ${P(0.45, -0.04)} ${P(0.8, 0.02)} ${P(1.05, 0.18)}`}
              fill="none"
              stroke={trim}
              strokeWidth={r * 0.13}
            />
          </>
        )}
        <path
          d={`M ${P(-0.2, 0.15)} L ${P(1.1, 0.15)} L ${P(1.1, 0.9)} L ${P(-1.1, 0.9)} Z`}
          fill={`url(#${id}-dm)`}
          opacity={0.45}
        />
      </g>
      <path
        d={`M ${P(-1, -0.12)} C ${P(-0.95, -0.42)} ${P(-0.6, -0.5)} ${P(-0.1, -0.46)} L ${P(0.12, -0.1)} C ${P(-0.3, 0.02)} ${P(-0.75, 0.05)} ${P(-1, 0.08)} Z`}
        fill="#15132a"
        stroke={INK}
        strokeWidth={3}
        strokeLinejoin="round"
      />
      <path
        d={`M ${P(-0.85, -0.34)} C ${P(-0.6, -0.42)} ${P(-0.3, -0.42)} ${P(-0.08, -0.38)}`}
        fill="none"
        stroke={PAPER}
        strokeWidth={3}
        strokeLinecap="round"
        opacity={0.85}
      />
      <path
        d={`M ${P(-0.88, 0.3)} L ${P(-0.62, 0.3)} M ${P(-0.86, 0.44)} L ${P(-0.6, 0.44)}`}
        stroke={INK}
        strokeWidth={3}
        strokeLinecap="round"
      />
      <path
        d={`M ${P(-0.55, -0.82)} C ${P(-0.3, -0.95)} ${P(0, -0.98)} ${P(0.25, -0.95)}`}
        fill="none"
        stroke={PAPER}
        strokeWidth={4}
        strokeLinecap="round"
        opacity={0.9}
      />
      <path
        d={shell}
        fill="none"
        stroke={INK}
        strokeWidth={4.5}
        strokeLinejoin="round"
      />
    </g>
  );
};

// A driver's helmet on its own (the outro's line-up of every driver in the film): the same side-view helmet the cars
// carry, drawn at the 44 px trace radius and scaled to `r`, so line weights match a car shown at that size. (x, y) is
// the helmet centre; `facing` as for MangaCar.
export const DriverHelmet: React.FC<{
  driver: Driver;
  x: number;
  y: number;
  r: number;
  facing?: "left" | "right";
}> = ({ driver, x, y, r, facing = "right" }) => {
  const id = svgId(useId());
  const s = r / 44;
  return (
    <g
      transform={`translate(${x} ${y}) scale(${facing === "left" ? s : -s} ${s})`}
    >
      <defs>
        <TonePattern id={`${id}-dm`} r={2.3} gap={9} />
      </defs>
      <Helmet car={{ helmetAt: { cx: 0, cy: 0, r: 44 }, driver }} id={id} />
    </g>
  );
};

// The car drawn in its reference photo's own pixel space, facing left as in the photo. MangaCar flips and places it;
// the Art check still draws it straight onto the photo's frame.
export const CarInPhotoSpace: React.FC<{ car: CarSpec; state?: CarState }> = ({
  car,
  state = {},
}) => {
  const id = svgId(useId());
  const defs = (
    <defs>
      <clipPath id={`${id}-body`}>
        <path d={car.body} />
      </clipPath>
      <ToneDefs prefix={id} />
      <TonePattern id={`${id}-dl`} r={1.4} gap={9} />
      <TonePattern id={`${id}-dm`} r={2.3} gap={9} />
      <TonePattern id={`${id}-dd`} r={3.2} gap={9} />
    </defs>
  );
  if (!state.split || !car.breakLine) {
    return (
      <g>
        {defs}
        <CarLayers car={car} state={state} id={id} />
      </g>
    );
  }
  const show = state.split.show ?? "both";
  const pieces = (["front", "rear"] as const).filter(
    (piece) => show === "both" || show === piece,
  );
  return (
    <g>
      {defs}
      <defs>
        {pieces.map((piece) => (
          <clipPath key={piece} id={`${id}-${piece}`}>
            <path d={piecePolygon(car.breakLine as string, piece)} />
          </clipPath>
        ))}
      </defs>
      {pieces.map((piece) => (
        <g
          key={piece}
          transform={poseTransform(car, state.split?.[piece])}
          clipPath={`url(#${id}-${piece})`}
        >
          <CarLayers car={car} state={state} id={id} />
          <TornEdge car={car} id={id} side={piece === "front" ? -1 : 1} />
        </g>
      ))}
    </g>
  );
};

// ── Broken car (CarState.split) ─────────────────────────────────────────────────────────

const breakPoints = (breakLine: string) => {
  const n = breakLine.replace(/[ML]/g, " ").trim().split(/\s+/).map(Number);
  return Array.from({ length: n.length / 2 }, (_, i) => ({
    x: n[2 * i],
    y: n[2 * i + 1],
  }));
};

// The middle of the break line, the point each piece turns about.
const breakPivot = (car: CarSpec) => {
  const pts = breakPoints(car.breakLine ?? "");
  const xs = pts.map((p) => p.x);
  const ys = pts.map((p) => p.y);
  return {
    x: (Math.min(...xs) + Math.max(...xs)) / 2,
    y: (Math.min(...ys) + Math.max(...ys)) / 2,
  };
};

// Everything on one side of the break line (photo space: the front piece is on the left, the car faces left).
const piecePolygon = (breakLine: string, piece: "front" | "rear") => {
  const pts = breakPoints(breakLine);
  const far = piece === "front" ? -20000 : 20000;
  const top = pts[0];
  const bottom = pts[pts.length - 1];
  return `${pts.map((p, i) => `${i ? "L" : "M"} ${p.x} ${p.y}`).join(" ")} L ${bottom.x} 20000 L ${far} 20000 L ${far} -20000 L ${top.x} -20000 Z`;
};

// A piece's pose in photo space: forward is −x and up is −y there, and nose-up pitch is a clockwise turn.
const poseTransform = (car: CarSpec, pose: PiecePose = {}) => {
  const ppm = photoPxPerMetre(car);
  const c = breakPivot(car);
  return `translate(${-(pose.dx ?? 0) * ppm} ${-(pose.dy ?? 0) * ppm}) rotate(${pose.rotate ?? 0} ${c.x} ${c.y})`;
};

// The torn face of a piece: a black band of exposed carbon along the break, with a few white splinters.
const TornEdge: React.FC<{ car: CarSpec; id: string; side: number }> = ({
  car,
  id,
  side,
}) => (
  <g clipPath={`url(#${id}-body)`}>
    <path
      d={car.breakLine}
      fill="none"
      stroke={INK}
      strokeWidth={34}
      strokeLinejoin="miter"
    />
    <path
      d={car.breakLine}
      fill="none"
      stroke={PAPER}
      strokeWidth={3}
      strokeLinejoin="miter"
      transform={`translate(${side * 22} 6)`}
      opacity={0.85}
    />
    <path
      d={car.breakLine}
      fill="none"
      stroke={`url(#${id}-dark)`}
      strokeWidth={10}
      strokeLinejoin="miter"
      transform={`translate(${side * 34} -4)`}
    />
  </g>
);

// Screen-space transform (MangaCar's frame; dir 1 = facing right, -1 = facing left) that follows the piece of a split
// car holding the race number, which MangaCar draws unmirrored outside the photo-space group.
const pieceScreenTransform = (
  car: CarSpec,
  state: CarState,
  k: number,
  dir: number,
) => {
  if (!state.split || !car.breakLine) return undefined;
  const pivot = breakPivot(car);
  const piece = car.numberAt.x < pivot.x ? "front" : "rear";
  const show = state.split.show ?? "both";
  if (show !== "both" && show !== piece) return "hidden";
  const pose = state.split[piece] ?? {};
  const ppm = photoPxPerMetre(car);
  const sx = (car.frame.x - pivot.x) * k * dir;
  const sy = (pivot.y - car.frame.ground) * k;
  return `translate(${(pose.dx ?? 0) * ppm * k * dir} ${-(pose.dy ?? 0) * ppm * k}) rotate(${-(pose.rotate ?? 0) * dir} ${sx} ${sy})`;
};

// A wing endplate with its colour blocks; with `copy`, the far endplate drawn as the perspective copy of the near
// one (ART-17).
const Endplate: React.FC<{
  d: string;
  livery?: Accent[];
  fill: string;
  w: number;
  copy?: EndplateCopy;
}> = ({ d, livery = [], fill, w, copy }) => (
  <g transform={copy ? endplateCopyTransform(d, copy) : undefined}>
    <path
      d={d}
      fill={fill}
      stroke={INK}
      strokeWidth={w}
      strokeLinejoin="round"
    />
    {livery.map((a) => (
      <path
        key={a.d}
        d={a.d}
        fill={a.color}
        stroke={INK}
        strokeWidth={4}
        strokeLinejoin="round"
      />
    ))}
  </g>
);

// The layers of the car in photo space, without its <defs> (shared through `id`). Drawn once, or once per piece of a
// split car.
const CarLayers: React.FC<{ car: CarSpec; state: CarState; id: string }> = ({
  car,
  state,
  id,
}) => {
  const p = car.paint;
  const fw = car.frontWing;
  const wheelAngle = state.wheelAngle ?? 0;
  const compound = state.compound ?? car.compound;
  const tread = state.tread ?? "dry";
  const [front, rear] = car.nearWheels;
  const pivot = { x: (front.cx + rear.cx) / 2, y: (front.cy + rear.cy) / 2 };
  const shade = car.shade ?? 1;
  return (
    <>
      {drawnFarWheels(car).map((w, i) => (
        <FarWheel
          key={`f${w.cx}`}
          car={car}
          w={w}
          angle={i === 0 ? (state.lockFront ?? wheelAngle) : wheelAngle}
          tread={tread}
          id={id}
        />
      ))}

      <g
        transform={
          state.tilt ? `rotate(${state.tilt} ${pivot.x} ${pivot.y})` : undefined
        }
      >
        {/* far side: far front endplate and wing surface, far rear endplate and rear wing top, airbox camera */}
        {fw.farFrom ? (
          <Endplate
            d={fw.near}
            livery={fw.livery}
            fill={p.wing}
            w={4}
            copy={fw.farFrom}
          />
        ) : null}
        <path d={fw.deck} fill={p.frontDeck} />
        <path d={fw.flap.d} fill={fw.flap.color} />
        <path
          d={fw.deck}
          fill="none"
          stroke={INK}
          strokeWidth={4}
          strokeLinejoin="round"
        />
        {/* rear wing: the far endplate behind the wing surface, as the far front endplate sits behind the deck */}
        {car.rearWing.farFrom ? (
          <Endplate
            d={car.rearWing.near}
            livery={car.rearWing.livery}
            fill={p.wing}
            w={5}
            copy={car.rearWing.farFrom}
          />
        ) : null}
        {car.rearWing.top ? (
          <>
            <path
              d={car.rearWing.top}
              fill={p.rearTop}
              stroke={INK}
              strokeWidth={5}
              strokeLinejoin="round"
            />
            <path d={car.rearWing.top} fill={`url(#${id}-dl)`} opacity={0.6} />
          </>
        ) : null}
        <path d={car.rearWing.pylon} fill={INK} />
        {car.rearWing.elements.map((d) => (
          <Ink key={d} d={d} w={5} />
        ))}
        {car.antenna ? <Ink d={car.antenna} w={3} /> : null}
        {car.tcam ? (
          <path
            d={car.tcam}
            fill={car.tcamColor ?? INK}
            stroke={INK}
            strokeWidth={car.tcamColor ? 3 : 0}
          />
        ) : null}

        {/* cockpit, seen through the open halo: far halo bar, HANS (or the open tub), driver, headrest */}
        {car.haloFar ? (
          <>
            <path
              d={car.haloFar}
              fill="none"
              stroke={INK}
              strokeWidth={14}
              strokeLinecap="round"
            />
            <path
              d={car.haloFar}
              fill="none"
              stroke={p.chassis}
              strokeWidth={7}
              strokeLinecap="round"
            />
          </>
        ) : null}
        {car.cockpit.opening ? (
          <path
            d={car.cockpit.opening}
            fill="#1b1b1e"
            stroke={INK}
            strokeWidth={3}
            strokeLinejoin="round"
          />
        ) : null}
        {car.cockpit.hans && state.driver !== false ? (
          <ellipse
            cx={car.cockpit.hans.cx}
            cy={car.cockpit.hans.cy}
            rx={car.cockpit.hans.rx}
            ry={car.cockpit.hans.ry}
            fill="#1b1b1e"
            stroke={INK}
            strokeWidth={3}
          />
        ) : null}
        {state.driver === false ? null : <Helmet car={car} id={id} />}
        {car.cockpit.headrest ? (
          <path
            d={car.cockpit.headrest}
            fill={p.chassis}
            stroke={INK}
            strokeWidth={4}
            strokeLinejoin="round"
          />
        ) : null}

        {/* body: livery colour per form region, then dot shading */}
        <path d={car.body} fill={p.sidepod} />
        <g clipPath={`url(#${id}-body)`}>
          <path d={car.regions.cover} fill={p.cover} />
          <path d={car.regions.chassis} fill={p.chassis} />
          <path d={car.regions.sidepod} fill={p.sidepod} />
          <path d={car.regions.undercut} fill={p.undercut} />
          {car.livery.map((a) => (
            <path key={a.d} d={a.d} fill={a.color} />
          ))}
          <path
            d={car.regions.chassis}
            fill={`url(#${id}-dl)`}
            opacity={0.5 * shade}
          />
          <path
            d={car.regions.sidepod}
            fill={`url(#${id}-dm)`}
            opacity={0.55 * shade}
          />
          <path
            d={car.regions.undercut}
            fill={`url(#${id}-dd)`}
            opacity={0.6}
          />
          {car.accents.map((a) => (
            <path key={a.d} d={a.d} fill={a.color} />
          ))}
          {car.glints.map((d) => (
            <path key={d} d={d} fill={PAPER} opacity={0.85} />
          ))}
          {/* floodlight catching the upper edge */}
          <path
            d={car.body}
            fill="none"
            stroke={PAPER}
            strokeWidth={10}
            opacity={0.85}
            transform="translate(0 4)"
          />
        </g>
        <path d={car.floor} fill={INK} />
        {car.panelLines.map((d) => (
          <g key={d}>
            <Ink d={d} w={6} />
            <Ink d={d} w={2.6} c={PAPER} o={0.8} />
          </g>
        ))}
        {car.suspension.map((d) => (
          <Ink key={d} d={d} w={6} />
        ))}
        <Ink d={car.body} w={6} />

        {/* near side: halo bar or windscreen, mirror, near front endplate, rear wing */}
        {car.halo ? (
          <>
            <path
              d={car.halo}
              fill="none"
              stroke={INK}
              strokeWidth={16}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d={car.halo}
              fill="none"
              stroke={p.chassis}
              strokeWidth={9}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d={car.halo}
              fill="none"
              stroke={PAPER}
              strokeWidth={3}
              strokeLinecap="round"
              transform="translate(0 -3)"
            />
          </>
        ) : null}
        {car.windscreen ? (
          <>
            <path
              d={car.windscreen}
              fill="#2b3038"
              opacity={0.85}
              stroke={INK}
              strokeWidth={4}
              strokeLinejoin="round"
            />
            <path d={car.windscreen} fill={`url(#${id}-dl)`} opacity={0.5} />
          </>
        ) : null}
        {car.haloAccent ? (
          <path
            d={car.haloAccent.d}
            fill="none"
            stroke={car.haloAccent.color}
            strokeWidth={8}
            strokeLinecap="round"
          />
        ) : null}
        <path
          d={car.mirror}
          fill={p.mirror ?? p.chassis}
          stroke={INK}
          strokeWidth={3}
        />
        <Endplate d={fw.near} livery={fw.livery} fill={p.wing} w={5} />
        <Endplate
          d={car.rearWing.near}
          livery={car.rearWing.livery}
          fill={p.wing}
          w={5}
        />
        {car.rearWing.beam ? <Ink d={car.rearWing.beam} w={7} /> : null}
        {car.rainLight ? (
          <path d={car.rainLight} fill="#ff2a2a" stroke={INK} strokeWidth={2} />
        ) : null}
      </g>

      <NearWheel
        car={car}
        w={front}
        angle={state.lockFront ?? wheelAngle}
        compound={compound}
        tread={tread}
        id={id}
      />
      <NearWheel
        car={car}
        w={rear}
        angle={wheelAngle}
        compound={compound}
        tread={tread}
        id={id}
      />
    </>
  );
};

// A car in a scene, facing right (nose to +x) by default. `at` is where the car's origin — its rear end, on the
// ground — lands on screen and how many px a metre is there; get it from the panel's camera (`camera.anchor({ x, z })`,
// ART-9) or, on an asset sheet, write it by hand. The car is drawn at its real traced size. `facing: "left"` shows the
// car's other side, nose to −x (a car seen from the other side of the track).
// With view "top", `at` is the middle of the car's rear end on a top-down map (TopCar; topAnchorAt places it by the
// middle of the wheelbase instead), the nose points along state.heading and state.steer turns the front wheels.
export const MangaCar: React.FC<{
  car: CarSpec;
  at: ScreenAnchor;
  view?: CarView;
  facing?: "right" | "left";
  state?: CarState;
}> = ({ car, at, view = "side", facing = "right", state = {} }) => {
  if (view === "top") {
    return <TopCar car={car} at={at} state={state} />;
  }
  const scale = at.pxPerMetre / CAR_UNITS_PER_METRE;
  // Photo px → screen px.
  const k = car.frame.k * scale;
  // Facing left the car is drawn as traced (the trace photos face left); facing right it is mirrored.
  const dir = facing === "left" ? -1 : 1;
  const [front, rear] = car.nearWheels;
  const toScreen = (px: number, py: number) => ({
    x: (car.frame.x - px) * k * dir,
    y: (py - car.frame.ground) * k,
  });
  // Race number in screen space, so it reads unmirrored; it pitches with the body.
  const num = toScreen(car.numberAt.x, car.numberAt.y);
  const pivot = toScreen((front.cx + rear.cx) / 2, (front.cy + rear.cy) / 2);
  const split = state.split && car.breakLine ? state.split : undefined;
  const numberPiece = pieceScreenTransform(car, state, k, dir);
  return (
    <g transform={`translate(${at.x} ${at.y})`}>
      {split ? null : (
        <ellipse
          cx={(car.frame.x - (front.cx + rear.cx) / 2) * k * dir}
          cy={2}
          rx={760 * scale}
          ry={14 * scale}
          fill={INK}
        />
      )}
      <g
        transform={`scale(${-k * dir} ${k}) translate(${-car.frame.x} ${-car.frame.ground})`}
      >
        <CarInPhotoSpace car={car} state={state} />
      </g>
      {numberPiece === "hidden" ? null : (
        <g transform={numberPiece}>
          <text
            x={num.x}
            y={num.y}
            textAnchor="middle"
            fontFamily="Arial Black, Arial, sans-serif"
            fontWeight={900}
            fontSize={(car.numberAt.size ?? 46) * k}
            fill={car.numberAt.color ?? PAPER}
            stroke={INK}
            strokeWidth={(car.numberAt.color ? 1.5 : 3) * k}
            paintOrder="stroke"
            fontStyle="italic"
            transform={
              [
                state.tilt
                  ? `rotate(${-state.tilt * dir} ${pivot.x} ${pivot.y})`
                  : "",
                // the photo faces left: mirrored (facing right) a clockwise turn becomes anticlockwise
                car.numberAt.angle
                  ? `rotate(${-dir * car.numberAt.angle} ${num.x} ${num.y})`
                  : "",
                car.numberAt.squash
                  ? `translate(${num.x} ${num.y}) scale(1 ${car.numberAt.squash}) translate(${-num.x} ${-num.y})`
                  : "",
              ]
                .join(" ")
                .trim() || undefined
            }
          >
            {car.driver.number}
          </text>
        </g>
      )}
    </g>
  );
};
