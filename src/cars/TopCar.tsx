// A car seen from directly above, for the top-down track maps (MOT-2). Reached through <MangaCar view="top" />.
// Draws the car's CarPlan (planOf: its traced plan, or the modern planform built from the side trace) with the same
// manga treatment as the side view: livery colours as flat blocks, a dot screen on the shadowed (right-hand) side, a
// few ink lines, a white floodlight edge (ART-8, ART-11). Ink widths stay constant on screen at any map scale.
import { useId } from "react";
import type { ScreenAnchor } from "../kit/camera";
import { INK, PAPER } from "../kit/colors";
import { TonePattern } from "../kit/tone";
import type { CarState } from "./MangaCar";
import { planOf, roundedBox } from "./plan";
import { carPoint, type CarSpec } from "./spec";

const svgId = (raw: string) => `top${raw.replace(/[^a-zA-Z0-9_-]/g, "")}`;

// `at` is the middle of the car's rear end on screen; the nose points along state.heading (degrees clockwise from
// screen right). state.steer turns the front wheels, state.compound sets the tyre band.
export const TopCar: React.FC<{
  car: CarSpec;
  at: ScreenAnchor;
  state?: CarState;
}> = ({ car, at, state = {} }) => {
  const id = svgId(useId());
  const plan = planOf(car);
  const p = car.paint;
  const ppm = at.pxPerMetre;
  const band = state.compound ?? car.compound;
  const steer = state.steer ?? 0;
  const { base, stripe } = car.driver.helmet;
  const h = plan.helmet;
  // ink widths stay constant on screen
  const w = (px: number) => px / ppm;
  return (
    <g
      transform={`translate(${at.x} ${at.y}) rotate(${state.heading ?? 0}) scale(${ppm})`}
    >
      <defs>
        <TonePattern id={`${id}-dot`} r={1.6 / ppm} gap={6 / ppm} />
        <clipPath id={`${id}-shade`}>
          <rect x={-1} y={0} width={8} height={1.5} />
        </clipPath>
      </defs>
      {/* suspension arms, under everything */}
      {plan.suspension ? (
        <path
          d={plan.suspension}
          stroke={INK}
          strokeWidth={w(2.4)}
          strokeLinecap="round"
        />
      ) : null}
      {/* tyres: black, with the compound's sidewall band on the outer edge */}
      {plan.wheels.map((t) => {
        const s = Math.sign(t.y);
        return (
          <g
            key={`${t.x}${t.y}`}
            transform={t.steer ? `rotate(${steer} ${t.x} ${t.y})` : undefined}
          >
            <path d={roundedBox(t.x, t.y, t.length, t.width)} fill={INK} />
            {band ? (
              <path
                d={`M ${t.x - 0.26} ${t.y + s * (t.width / 2 - 0.035)} L ${t.x + 0.26} ${t.y + s * (t.width / 2 - 0.035)}`}
                stroke={band}
                strokeWidth={Math.max(0.035, w(2.2))}
                strokeLinecap="round"
              />
            ) : null}
            <path
              d={`M ${t.x - 0.2} ${t.y - s * 0.02} L ${t.x + 0.2} ${t.y - s * 0.02}`}
              stroke="#3a3a3a"
              strokeWidth={w(1.2)}
            />
          </g>
        );
      })}
      {/* floor, sidepods (dot-shaded on the far side), stripes, engine cover, livery, tub */}
      {plan.floor ? (
        <path
          d={plan.floor}
          fill={p.undercut}
          stroke={INK}
          strokeWidth={w(2)}
        />
      ) : null}
      <path
        d={plan.sidepods}
        fill={p.sidepod}
        stroke={INK}
        strokeWidth={w(2.2)}
      />
      <path
        d={`${plan.sidepods} ${plan.chassis ?? ""}`}
        fill={`url(#${id}-dot)`}
        opacity={0.5 * (car.shade ?? 1)}
        clipPath={`url(#${id}-shade)`}
      />
      {(plan.stripes ?? []).map((st) => (
        <path
          key={st.d}
          d={st.d}
          fill="none"
          stroke={st.color}
          strokeWidth={st.width}
          strokeLinecap="round"
        />
      ))}
      {plan.cover ? (
        <path d={plan.cover} fill={p.cover} stroke={INK} strokeWidth={w(2)} />
      ) : null}
      {plan.livery.map((a) => (
        <path key={a.d} d={a.d} fill={a.color} />
      ))}
      {plan.chassis ? (
        <path
          d={plan.chassis}
          fill={p.chassis}
          stroke={INK}
          strokeWidth={w(2)}
        />
      ) : null}
      {(plan.accents ?? []).map((a) => (
        <path
          key={a.d}
          d={a.d}
          fill={a.color}
          stroke={INK}
          strokeWidth={w(1.4)}
        />
      ))}
      {plan.outline ? (
        <path
          d={plan.outline}
          fill="none"
          stroke={INK}
          strokeWidth={w(2.4)}
          strokeLinejoin="round"
        />
      ) : null}
      {/* cockpit: opening, helmet from above (shell in the base colour, a stripe, the visor peak) */}
      <path d={plan.cockpit} fill={INK} />
      <circle
        cx={h.x}
        cy={0}
        r={h.r}
        fill={base}
        stroke={INK}
        strokeWidth={w(1.6)}
      />
      <path d={helmetStripe(h.x, h.r)} fill={stripe} />
      {/* halo, wrapping the opening */}
      {plan.halo ? (
        <>
          <path
            d={plan.halo}
            fill="none"
            stroke={INK}
            strokeWidth={0.1 + w(2)}
            strokeLinecap="round"
          />
          <path
            d={plan.halo}
            fill="none"
            stroke={p.chassis}
            strokeWidth={0.07}
            strokeLinecap="round"
          />
        </>
      ) : null}
      {(plan.mirrors ?? []).map((d) => (
        <path
          key={d}
          d={d}
          fill={p.mirror ?? p.chassis}
          stroke={INK}
          strokeWidth={w(1.4)}
        />
      ))}
      {/* wings */}
      <path
        d={plan.frontWing.deck}
        fill={p.frontDeck}
        stroke={INK}
        strokeWidth={w(2)}
        strokeLinejoin="round"
      />
      {plan.frontWing.flap ? (
        <path d={plan.frontWing.flap} fill={car.frontWing.flap.color} />
      ) : null}
      {plan.frontWing.endplates ? (
        <path d={plan.frontWing.endplates} stroke={p.wing} strokeWidth={0.06} />
      ) : null}
      <path
        d={plan.rearWing.top}
        fill={plan.rearWing.color ?? p.rearTop}
        stroke={INK}
        strokeWidth={w(2)}
      />
      {plan.rearWing.element ? (
        <path d={plan.rearWing.element} stroke={INK} strokeWidth={w(1.4)} />
      ) : null}
      {plan.rearWing.endplates ? (
        <path d={plan.rearWing.endplates} stroke={p.wing} strokeWidth={0.05} />
      ) : null}
      {/* floodlight on the left-hand upper edges */}
      {plan.glints ? (
        <path
          d={plan.glints}
          fill="none"
          stroke={PAPER}
          strokeWidth={w(1.6)}
          strokeLinecap="round"
          opacity={0.85}
        />
      ) : null}
    </g>
  );
};

// The helmet's stripe seen from above: a band across the crown, from the back of the shell to the visor.
const helmetStripe = (x: number, r: number) => {
  const k = r / 0.135;
  const X = (u: number) => x + u * k;
  const Y = (v: number) => v * k;
  return `M ${X(-0.11)} ${Y(-0.05)} C ${X(0)} ${Y(-0.09)} ${X(0.06)} ${Y(-0.09)} ${X(0.13)} ${Y(-0.04)} L ${X(0.13)} ${Y(0.04)} C ${X(0.06)} ${Y(0.09)} ${X(0)} ${Y(0.09)} ${X(-0.11)} ${Y(0.05)} Z`;
};

// The `at` that puts the middle of the wheelbase on screen point `centre` for a car heading `heading` degrees: for
// placing a top-view car by its centre (on a racing line, say) instead of by its rear end.
export const topAnchorAt = (
  car: CarSpec,
  centre: ScreenAnchor,
  heading: number,
): ScreenAnchor => {
  const mid =
    ((carPoint(car, "rearAxle").x + carPoint(car, "frontAxle").x) / 2) *
    centre.pxPerMetre;
  const a = (heading * Math.PI) / 180;
  return {
    x: centre.x - Math.cos(a) * mid,
    y: centre.y - Math.sin(a) * mid,
    pxPerMetre: centre.pxPerMetre,
  };
};
