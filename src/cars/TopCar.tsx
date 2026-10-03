// A car seen from directly above, for the top-down track maps (MOT-2): a schematic planform in the car's livery
// colours, built from the traced spec's real length and axle positions plus the common dimensions of a 2017–2021 car
// (2.0 m wide, 0.305 m / 0.405 m wide tyres, 0.67 m tall). There is no plan-view photo to trace, so it stays a
// map-scale symbol: outline, livery blocks, tyres, halo and helmet — no detail that would need tracing (ART-11).
import { useId } from "react";
import type { ScreenAnchor } from "../kit/camera";
import { INK, PAPER } from "../kit/colors";
import { TonePattern } from "../kit/tone";
import { carLength, carPoint, photoPxPerMetre, type CarSpec } from "./spec";

const TYRE_D = 0.67;
const HALF_TRACK = 0.8; // tyre centre lines, metres from the car's centre line

// Mirror a list of (x, y) points (car frame, y to the car's right) into a closed outline symmetric about y = 0.
const symmetric = (half: [number, number][]) => {
  const right = half.map(([x, y]) => `${x} ${y}`);
  const left = [...half].reverse().map(([x, y]) => `${x} ${-y}`);
  return `M ${[...right, ...left].join(" L ")} Z`;
};

export const TopCar: React.FC<{
  car: CarSpec;
  at: ScreenAnchor;
  heading: number;
}> = ({ car, at, heading }) => {
  const id = `top${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const p = car.paint;
  const L = carLength(car);
  const xf = carPoint(car, "frontAxle").x;
  const xr = carPoint(car, "rearAxle").x;
  // the helmet's place along the car, from the side-view trace
  const xh = (car.frame.x - car.helmetAt.cx) / photoPxPerMetre(car);
  const ink = 2.2 / at.pxPerMetre; // a 2.2 px pen at any map scale

  const floor = symmetric([
    [xr - 0.15, 0.55],
    [xr + 0.4, 0.78],
    [xf - 0.75, 0.78],
    [xf - 0.45, 0.45],
  ]);
  const sidepods = symmetric([
    [xr + 0.15, 0.26],
    [xr + 0.75, 0.46],
    [xh + 0.15, 0.7],
    [xh + 0.35, 0.7],
    [xh + 0.4, 0.3],
  ]);
  const cover = symmetric([
    [0.35, 0.09],
    [xr + 0.2, 0.2],
    [xh - 0.35, 0.3],
    [xh - 0.25, 0.32],
  ]);
  const chassis = symmetric([
    [xh - 0.3, 0.33],
    [xh + 0.9, 0.3],
    [xf + 0.05, 0.2],
    [L - 0.55, 0.12],
    [L - 0.42, 0.07],
  ]);
  const frontWing = symmetric([
    [L - 0.62, 0.98],
    [L - 0.32, 0.98],
    [L - 0.14, 0.5],
    [L - 0.04, 0.12],
  ]);
  const rearWing = `M 0 -0.52 L 0.34 -0.52 L 0.34 0.52 L 0 0.52 Z`;
  const tyre = (x: number, side: number, w: number) =>
    `M ${x - TYRE_D / 2} ${side * HALF_TRACK - w / 2} L ${x + TYRE_D / 2} ${side * HALF_TRACK - w / 2} L ${x + TYRE_D / 2} ${side * HALF_TRACK + w / 2} L ${x - TYRE_D / 2} ${side * HALF_TRACK + w / 2} Z`;
  const { base, stripe } = car.driver.helmet;

  return (
    <g
      transform={`translate(${at.x} ${at.y}) rotate(${heading}) scale(${at.pxPerMetre})`}
    >
      <defs>
        <TonePattern id={`${id}-d`} r={0.012} gap={0.05} />
      </defs>
      {/* tyres sit outside the body; wishbones run out to them */}
      {[xf, xr].map((x) =>
        [-1, 1].map((s) => (
          <path
            key={`${x}${s}`}
            d={`M ${x} ${s * 0.25} L ${x} ${s * (HALF_TRACK - 0.1)}`}
            stroke={INK}
            strokeWidth={ink * 1.6}
          />
        )),
      )}
      {[-1, 1].map((s) => (
        <g key={s}>
          <path
            d={tyre(xf, s, 0.305)}
            fill={INK}
            stroke={INK}
            strokeWidth={ink}
            strokeLinejoin="round"
          />
          <path
            d={tyre(xr, s, 0.405)}
            fill={INK}
            stroke={INK}
            strokeWidth={ink}
            strokeLinejoin="round"
          />
        </g>
      ))}
      <path d={floor} fill={p.undercut} stroke={INK} strokeWidth={ink} />
      <path d={sidepods} fill={p.sidepod} stroke={INK} strokeWidth={ink} />
      <path d={sidepods} fill={`url(#${id}-d)`} opacity={0.35} />
      <path d={cover} fill={p.cover} stroke={INK} strokeWidth={ink} />
      <path d={chassis} fill={p.chassis} stroke={INK} strokeWidth={ink} />
      {/* front wing, with the accent flap along its trailing edge */}
      <path d={frontWing} fill={p.frontDeck} stroke={INK} strokeWidth={ink} />
      <path
        d={`M ${L - 0.6} -0.96 L ${L - 0.6} 0.96`}
        stroke={car.frontWing.flap.color}
        strokeWidth={0.1}
      />
      <path
        d={`M ${L - 0.62} -1 L ${L - 0.32} -1 M ${L - 0.62} 1 L ${L - 0.32} 1`}
        stroke={p.wing}
        strokeWidth={0.06}
      />
      <path d={rearWing} fill={p.rearTop} stroke={INK} strokeWidth={ink} />
      {car.wingLivery.length ? (
        <path
          d={`M 0.04 -0.4 L 0.3 -0.4 L 0.3 0.4 L 0.04 0.4 Z`}
          fill={car.wingLivery[car.wingLivery.length - 1].color}
        />
      ) : null}
      {/* cockpit opening, helmet, halo */}
      <ellipse cx={xh + 0.1} cy={0} rx={0.42} ry={0.23} fill={INK} />
      <circle
        cx={xh}
        cy={0}
        r={0.13}
        fill={base}
        stroke={INK}
        strokeWidth={ink}
      />
      <path
        d={`M ${xh - 0.12} 0 L ${xh + 0.12} 0`}
        stroke={stripe}
        strokeWidth={0.07}
      />
      <path
        d={`M ${xh + 0.62} 0 L ${xh + 0.35} 0 M ${xh - 0.1} -0.3 C ${xh + 0.25} -0.34 ${xh + 0.38} -0.2 ${xh + 0.38} 0 C ${xh + 0.38} 0.2 ${xh + 0.25} 0.34 ${xh - 0.1} 0.3`}
        fill="none"
        stroke={INK}
        strokeWidth={0.1}
        strokeLinecap="round"
      />
      <path
        d={`M ${xh + 0.62} 0 L ${xh + 0.35} 0 M ${xh - 0.1} -0.3 C ${xh + 0.25} -0.34 ${xh + 0.38} -0.2 ${xh + 0.38} 0 C ${xh + 0.38} 0.2 ${xh + 0.25} 0.34 ${xh - 0.1} 0.3`}
        fill="none"
        stroke={car.haloAccent?.color ?? p.chassis}
        strokeWidth={0.05}
        strokeLinecap="round"
      />
      {/* sheen along the spine */}
      <path
        d={`M 0.5 -0.05 L ${xh - 0.4} -0.12`}
        stroke={PAPER}
        strokeWidth={0.04}
        opacity={0.8}
      />
    </g>
  );
};
