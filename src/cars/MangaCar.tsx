// The manga car renderer: draws any CarSpec as a manga panel car — real livery colours as flat fills, screentone dots
// for shading, inked outlines and white highlights (ART-8, ART-11, ART-12, ART-13). Layers go far side → body → near side.
// Self-contained: it defines its own patterns and clip paths under a unique id, so it needs nothing from the page's <defs>.
import { useId } from "react";
import { INK, PAPER } from "../kit/colors";
import type { ScreenAnchor } from "../kit/camera";
import { Ink } from "../kit/ink";
import { TonePattern, ToneDefs, tone } from "../kit/tone";
import { CAR_UNITS_PER_METRE, type CarSpec, type Wheel } from "./spec";

// How the car is seen. Side view only for now; a top view (track maps) comes with the track tickets.
export type CarView = "side";

// What the car is doing, all optional; the default is a car at rest.
export type CarState = {
  // Rotation of the wheels, degrees (clockwise as the car rolls forward). Drive it from the frame to make them roll.
  wheelAngle?: number;
  // Front wheels locked under braking: when set, they stay at this angle and ignore wheelAngle.
  lockFront?: number;
  // Body pitch over the wheels, degrees, positive = nose up (negative for the nose dive under braking). The wheels stay
  // planted; the body turns about the middle of the wheelbase at axle height. Keep it to a few degrees.
  tilt?: number;
  // Tyre sidewall band colour for this race (e.g. PIRELLI_2021.soft); defaults to the spec's.
  compound?: string;
};

const svgId = (raw: string) => `car${raw.replace(/[^a-zA-Z0-9_-]/g, "")}`;

const spokePath = (w: Wheel, r: number, n: number) =>
  Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    return `M ${w.cx + Math.cos(a) * r * 0.22} ${w.cy + Math.sin(a) * r * 0.22} L ${w.cx + Math.cos(a) * r * 0.94} ${w.cy + Math.sin(a) * r * 0.94}`;
  }).join(" ");

const NearWheel: React.FC<{
  car: CarSpec;
  w: Wheel;
  angle: number;
  compound: string;
  id: string;
}> = ({ car, w, angle, compound, id }) => (
  <g>
    <circle cx={w.cx} cy={w.cy} r={w.r} fill={INK} />
    <circle
      cx={w.cx}
      cy={w.cy}
      r={w.r - 6}
      fill="none"
      stroke="#2c2c2c"
      strokeWidth={3}
    />
    <circle
      cx={w.cx}
      cy={w.cy}
      r={w.r - 24}
      fill="none"
      stroke={compound}
      strokeWidth={6}
    />
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

const FarWheel: React.FC<{ w: Wheel; id: string }> = ({ w, id }) => (
  <g>
    <circle cx={w.cx} cy={w.cy} r={w.r} fill={INK} />
    <circle
      cx={w.cx}
      cy={w.cy}
      r={w.r * 0.62}
      fill={tone("dark", id)}
      stroke="#2c2c2c"
      strokeWidth={3}
    />
    {[-0.5, -0.25, 0, 0.25, 0.5].map((t) => (
      <path
        key={t}
        d={`M ${w.cx + Math.sin(t) * w.r * 0.66} ${w.cy - Math.cos(t) * w.r * 0.66} L ${w.cx + Math.sin(t) * w.r * 0.97} ${w.cy - Math.cos(t) * w.r * 0.97}`}
        stroke="#3a3a3a"
        strokeWidth={3}
      />
    ))}
    <path
      d={`M ${w.cx - w.r * 0.2} ${w.cy - w.r * 0.94} A ${w.r * 0.95} ${w.r * 0.95} 0 0 1 ${w.cx + w.r * 0.7} ${w.cy - w.r * 0.6}`}
      fill="none"
      stroke={PAPER}
      strokeWidth={4}
      opacity={0.8}
    />
  </g>
);

// Side-view race helmet facing left (ART-13): shell with chin bar, tinted visor, livery stripes, top air intake and
// rear spoiler, shaded with dots. Sized like a real helmet (about 0.29 m long) by the trace.
const Helmet: React.FC<{ car: CarSpec; id: string }> = ({ car, id }) => {
  const { cx, cy, r } = car.helmetAt;
  const { base, stripe } = car.driver.helmet;
  const P = (x: number, y: number) => `${cx + x * r} ${cy + y * r}`;
  const shell = `M ${P(-0.98, 0.45)} C ${P(-1.08, -0.1)} ${P(-0.75, -0.98)} ${P(0.05, -1)} C ${P(0.7, -1)} ${P(1.05, -0.55)} ${P(1.02, 0.05)} L ${P(0.95, 0.6)} L ${P(-0.6, 0.7)} Z`;
  return (
    <g>
      <defs>
        <clipPath id={`${id}-helmet`}>
          <path d={shell} />
        </clipPath>
      </defs>
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
      <path d={shell} fill={base} />
      <g clipPath={`url(#${id}-helmet)`}>
        <path
          d={`M ${P(-0.75, -0.7)} C ${P(-0.2, -0.95)} ${P(0.5, -0.86)} ${P(1, -0.32)}`}
          fill="none"
          stroke={stripe}
          strokeWidth={r * 0.2}
        />
        <path
          d={`M ${P(0.1, -0.02)} C ${P(0.45, -0.04)} ${P(0.8, 0.02)} ${P(1.05, 0.18)}`}
          fill="none"
          stroke={stripe}
          strokeWidth={r * 0.13}
        />
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

// The car drawn in its reference photo's own pixel space, facing left as in the photo. MangaCar flips and places it;
// the Art check still draws it straight onto the photo's frame.
export const CarInPhotoSpace: React.FC<{ car: CarSpec; state?: CarState }> = ({
  car,
  state = {},
}) => {
  const id = svgId(useId());
  const p = car.paint;
  const fw = car.frontWing;
  const wheelAngle = state.wheelAngle ?? 0;
  const compound = state.compound ?? car.compound;
  const [front, rear] = car.nearWheels;
  const pivot = { x: (front.cx + rear.cx) / 2, y: (front.cy + rear.cy) / 2 };
  return (
    <g>
      <defs>
        <clipPath id={`${id}-body`}>
          <path d={car.body} />
        </clipPath>
        <ToneDefs prefix={id} />
        <TonePattern id={`${id}-dl`} r={1.4} gap={9} />
        <TonePattern id={`${id}-dm`} r={2.3} gap={9} />
        <TonePattern id={`${id}-dd`} r={3.2} gap={9} />
      </defs>

      {car.farWheels.map((w) => (
        <FarWheel key={`f${w.cx}`} w={w} id={id} />
      ))}

      <g
        transform={
          state.tilt ? `rotate(${state.tilt} ${pivot.x} ${pivot.y})` : undefined
        }
      >
        {/* far side: far front endplate and wing surface, rear wing top, airbox camera */}
        <path d={fw.far} fill={p.wing} stroke={INK} strokeWidth={4} />
        <path d={fw.deck} fill={p.frontDeck} />
        <path d={fw.flap.d} fill={fw.flap.color} />
        <path
          d={fw.deck}
          fill="none"
          stroke={INK}
          strokeWidth={4}
          strokeLinejoin="round"
        />
        <path
          d={car.rearWing.top}
          fill={p.rearTop}
          stroke={INK}
          strokeWidth={5}
          strokeLinejoin="round"
        />
        <path d={car.rearWing.top} fill={`url(#${id}-dl)`} opacity={0.6} />
        <path d={car.rearWing.pylon} fill={INK} />
        {car.rearWing.elements.map((d) => (
          <Ink key={d} d={d} w={5} />
        ))}
        <Ink d={car.antenna} w={3} />
        <path d={car.tcam} fill={INK} />

        {/* cockpit, seen through the open halo: far halo bar, HANS, driver, headrest */}
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
        <ellipse
          cx={car.cockpit.hans.cx}
          cy={car.cockpit.hans.cy}
          rx={car.cockpit.hans.rx}
          ry={car.cockpit.hans.ry}
          fill="#1b1b1e"
          stroke={INK}
          strokeWidth={3}
        />
        <Helmet car={car} id={id} />
        <path
          d={car.cockpit.headrest}
          fill={p.chassis}
          stroke={INK}
          strokeWidth={4}
          strokeLinejoin="round"
        />

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
          <path d={car.regions.chassis} fill={`url(#${id}-dl)`} opacity={0.5} />
          <path
            d={car.regions.sidepod}
            fill={`url(#${id}-dm)`}
            opacity={0.55}
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

        {/* near side: halo bar, mirror, near front endplate, rear wing */}
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
        {car.haloAccent ? (
          <path
            d={car.haloAccent.d}
            fill="none"
            stroke={car.haloAccent.color}
            strokeWidth={8}
            strokeLinecap="round"
          />
        ) : null}
        <path d={car.mirror} fill={p.chassis} stroke={INK} strokeWidth={3} />
        <path
          d={fw.near}
          fill={p.wing}
          stroke={INK}
          strokeWidth={5}
          strokeLinejoin="round"
        />
        <path
          d={car.rearWing.near}
          fill={p.wing}
          stroke={INK}
          strokeWidth={5}
          strokeLinejoin="round"
        />
        {car.wingLivery.map((a) => (
          <path
            key={a.d}
            d={a.d}
            fill={a.color}
            stroke={INK}
            strokeWidth={4}
            strokeLinejoin="round"
          />
        ))}
        <Ink d={car.rearWing.beam} w={7} />
        <path d={car.rainLight} fill="#ff2a2a" stroke={INK} strokeWidth={2} />
      </g>

      <NearWheel
        car={car}
        w={front}
        angle={state.lockFront ?? wheelAngle}
        compound={compound}
        id={id}
      />
      <NearWheel
        car={car}
        w={rear}
        angle={wheelAngle}
        compound={compound}
        id={id}
      />
    </g>
  );
};

// A car in a scene, facing right (nose to +x). `at` is where the car's origin — its rear end, on the ground — lands on
// screen and how many px a metre is there; get it from the panel's camera (`camera.anchor({ x, z })`, ART-9) or, on an
// asset sheet, write it by hand. The car is drawn at its real traced size.
export const MangaCar: React.FC<{
  car: CarSpec;
  at: ScreenAnchor;
  view?: CarView;
  state?: CarState;
}> = ({ car, at, state = {} }) => {
  const scale = at.pxPerMetre / CAR_UNITS_PER_METRE;
  // Photo px → screen px.
  const k = car.frame.k * scale;
  const [front, rear] = car.nearWheels;
  const toScreen = (px: number, py: number) => ({
    x: (car.frame.x - px) * k,
    y: (py - car.frame.ground) * k,
  });
  // Race number in screen space, so it reads unmirrored; it pitches with the body.
  const num = toScreen(car.numberAt.x, car.numberAt.y);
  const pivot = toScreen((front.cx + rear.cx) / 2, (front.cy + rear.cy) / 2);
  return (
    <g transform={`translate(${at.x} ${at.y})`}>
      <ellipse
        cx={(car.frame.x - (front.cx + rear.cx) / 2) * k}
        cy={2}
        rx={760 * scale}
        ry={14 * scale}
        fill={INK}
      />
      <g
        transform={`scale(${-k} ${k}) translate(${-car.frame.x} ${-car.frame.ground})`}
      >
        <CarInPhotoSpace car={car} state={state} />
      </g>
      <text
        x={num.x}
        y={num.y}
        textAnchor="middle"
        fontFamily="Arial Black, Arial, sans-serif"
        fontWeight={900}
        fontSize={46 * k}
        fill={PAPER}
        stroke={INK}
        strokeWidth={3 * k}
        paintOrder="stroke"
        fontStyle="italic"
        transform={
          state.tilt
            ? `rotate(${-state.tilt} ${pivot.x} ${pivot.y})`
            : undefined
        }
      >
        {car.driver.number}
      </text>
    </g>
  );
};
