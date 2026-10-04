// A car seen from directly above, for the top-down track maps (MOT-2). Reached through <MangaCar view="top" />.
// Draws the car's CarPlan (planOf: its traced plan, or the modern planform built from the side trace) with the same
// manga treatment as the side view: livery colours as flat blocks, a dot screen on the shadowed (right-hand) side, a
// few ink lines, a white floodlight edge (ART-8, ART-11). Ink widths stay constant on screen at any map scale.
import { useId } from "react";
import { useCurrentFrame } from "remotion";
import type { ScreenAnchor } from "../kit/camera";
import { INK, PAPER } from "../kit/colors";
import { TonePattern } from "../kit/tone";
import type { CarState, Tread } from "./MangaCar";
import { planOf, roundedBox } from "./plan";
import {
  carPoint,
  isTopOnly,
  type CarPlan,
  type CarSpec,
  type TopOnlyCar,
} from "./spec";

const svgId = (raw: string) => `top${raw.replace(/[^a-zA-Z0-9_-]/g, "")}`;

// Width of a suspension arm seen from above, m: a faired wishbone, drawn as one ink line.
const SUSPENSION_ARM = 0.04;

// `at` is the middle of the car's rear end on screen; the nose points along state.heading (degrees clockwise from
// screen right). state.steer turns the front wheels, state.compound sets the tyre band.
export const TopCar: React.FC<{
  car: CarSpec | TopOnlyCar;
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
  const flapColor = isTopOnly(car) ? car.flap : car.frontWing.flap.color;
  const h = plan.helmet;
  // ink widths stay constant on screen
  const w = (px: number) => px / ppm;
  // the tyres turn as in the side view: state.wheelAngle (state.lockFront for locked front wheels) is how far they
  // have rolled, so the tread runs round at the true road speed and stops with the car (MOT-5)
  const locked = state.lockFront !== undefined;
  const rolled = (t: CarPlan["wheels"][number]) =>
    ((t.steer && locked ? state.lockFront! : (state.wheelAngle ?? 0)) / 360) *
    Math.PI *
    t.length;
  const blur = treadBlur(state.speed ?? 0);
  const frame = useCurrentFrame();
  return (
    <g
      transform={`translate(${at.x} ${at.y}) rotate(${state.heading ?? 0}) scale(${ppm})`}
    >
      <defs>
        <TonePattern id={`${id}-dot`} r={1.6 / ppm} gap={6 / ppm} />
        <clipPath id={`${id}-shade`}>
          <rect x={-1} y={0} width={8} height={1.5} />
        </clipPath>
        {/* everything but the tyres (the front ones as steered), for the suspension arms */}
        <mask
          id={`${id}-tyres`}
          maskUnits="userSpaceOnUse"
          x={-2}
          y={-2}
          width={10}
          height={4}
        >
          <rect x={-2} y={-2} width={10} height={4} fill="#fff" />
          {plan.wheels.map((t) => (
            <path
              key={`${t.x}${t.y}`}
              d={roundedBox(t.x, t.y, t.length, t.width)}
              transform={t.steer ? `rotate(${steer} ${t.x} ${t.y})` : undefined}
              fill="#000"
            />
          ))}
        </mask>
      </defs>
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
            <TreadMarks
              t={t}
              tread={state.tread ?? "dry"}
              grooves={car.tyreGrooves ?? 0}
              ink={w(1.6)}
              rolled={rolled(t)}
              blur={t.steer && locked ? 0 : blur}
              frame={frame}
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
      {/* suspension arms over the floor and sidepods but under the tub, the engine cover and the tyres (masked out):
          one ink line per arm, as wide as a faired wishbone (SUSPENSION_ARM) plus a constant ink edge, so they read
          at every map scale and alike on every car (ART-15) */}
      {plan.suspension ? (
        <path
          d={plan.suspension}
          stroke={INK}
          strokeWidth={SUSPENSION_ARM + w(1.5)}
          strokeLinecap="round"
          mask={`url(#${id}-tyres)`}
        />
      ) : null}
      {/* front wing: under the nose, which runs forward over it to its tip */}
      <path
        d={plan.frontWing.deck}
        fill={p.frontDeck}
        stroke={INK}
        strokeWidth={w(2)}
        strokeLinejoin="round"
      />
      {plan.frontWing.flap ? (
        <path d={plan.frontWing.flap} fill={flapColor} />
      ) : null}
      {plan.frontWing.endplates ? (
        <PlanEndplates
          d={plan.frontWing.endplates}
          color={p.wing}
          width={0.06}
          ink={w(2)}
        />
      ) : null}
      {(plan.inlets ?? []).map((d) => (
        <path key={d} d={d} fill={INK} />
      ))}
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
      {plan.airbox ? <path d={plan.airbox} fill={INK} /> : null}
      {plan.tcam ? (
        <path
          d={plan.tcam.d}
          fill={plan.tcam.color}
          stroke={INK}
          strokeWidth={w(1.4)}
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
      {plan.windscreen ? (
        <path
          d={plan.windscreen}
          fill="#2b3038"
          opacity={0.85}
          stroke={INK}
          strokeWidth={w(1.4)}
          strokeLinejoin="round"
        />
      ) : null}
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
      {/* rear wing */}
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
        <PlanEndplates
          d={plan.rearWing.endplates}
          color={plan.rearWing.endplateColor ?? p.wing}
          width={0.05}
          ink={w(2)}
        />
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

// The tread seen from above on a turning tyre (MOT-5): a few marks across the tread (the wet pattern's chevrons on a
// wet tyre) that run along the tyre as it rolls. The top of a rolling tyre moves forward relative to the car, at the
// road speed, so the marks run toward the nose by `rolled` metres and wrap round at the front. Past a walking pace
// the true rate aliases at 60 fps, so at speed (`blur` 0–1) the tread smears into a lighter band with a streak along
// both sidewall edges, and over it the marks creep forward at a readable rate (`frame`), as the side view's wheel
// blur does (suzuka1989 Motion.tsx). A dry tyre's longitudinal grooves (2008) stay put: they look the same all round.
const TreadMarks: React.FC<{
  t: CarPlan["wheels"][number];
  tread: Tread;
  grooves: number;
  ink: number;
  rolled: number;
  blur: number;
  frame: number;
}> = ({ t, tread, grooves, ink, rolled, blur, frame }) => {
  const half = t.length / 2 - 0.05;
  const hw = t.width / 2 - 0.03;
  const n = tread === "wet" ? 7 : 4;
  const pitch = (2 * half) / n;
  // past half blur the true roll aliases: show a steady forward creep of 0.3 pitch per frame instead
  const shown = blur < 0.5 ? rolled : frame * pitch * 0.3;
  const phase = ((shown % pitch) + pitch) % pitch;
  const xs = Array.from(
    { length: n },
    (_, i) => t.x - half + phase + i * pitch,
  );
  const marks =
    tread === "wet"
      ? xs
          .filter((x) => x - 0.05 >= t.x - half && x + 0.03 <= t.x + half)
          .map(
            (x) =>
              `M ${x - 0.05} ${t.y - hw} L ${x + 0.03} ${t.y} L ${x - 0.05} ${t.y + hw}`,
          )
          .join(" ")
      : xs.map((x) => `M ${x} ${t.y - hw} L ${x} ${t.y + hw}`).join(" ");
  const groove = grooves
    ? Array.from({ length: grooves }, (_, i) => {
        const y = t.y - t.width / 2 + ((i + 1) / (grooves + 1)) * t.width;
        return `M ${t.x - half} ${y} L ${t.x + half} ${y}`;
      }).join(" ")
    : "";
  return (
    <>
      {groove ? <path d={groove} stroke="#6a6a6a" strokeWidth={ink} /> : null}
      {blur > 0 ? (
        <>
          <rect
            x={t.x - half}
            y={t.y - t.width * 0.2}
            width={2 * half}
            height={t.width * 0.4}
            fill="#6e6e6e"
            opacity={0.5 * blur}
          />
          <path
            d={`M ${t.x - half} ${t.y - hw} L ${t.x + half} ${t.y - hw} M ${t.x - half} ${t.y + hw} L ${t.x + half} ${t.y + hw}`}
            stroke="#8c8c8c"
            strokeWidth={ink}
            opacity={0.55 * blur}
          />
        </>
      ) : null}
      {marks ? (
        <path
          d={marks}
          fill="none"
          stroke={tread === "wet" ? "#8a8a8a" : "#5e5e5e"}
          strokeWidth={ink}
          strokeLinejoin="round"
          opacity={1 - 0.4 * blur}
        />
      ) : null}
    </>
  );
};

// How much a top-view tyre's tread blurs at `speed` m/s (as seen on screen): none at a crawl, full from ~120 km/h.
const treadBlur = (speed: number) =>
  Math.max(0, Math.min(1, (Math.abs(speed) - 8) / 25));

// Both endplates of a wing seen from above: thin plates in the wing colour, inked so a light one reads on paper.
const PlanEndplates: React.FC<{
  d: string;
  color: string;
  width: number;
  ink: number;
}> = ({ d, color, width, ink }) => (
  <>
    <path d={d} stroke={INK} strokeWidth={width + ink} strokeLinecap="square" />
    <path d={d} stroke={color} strokeWidth={width} />
  </>
);

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
  car: CarSpec | TopOnlyCar,
  centre: ScreenAnchor,
  heading: number,
): ScreenAnchor => {
  const mid = wheelbaseMiddle(car) * centre.pxPerMetre;
  const a = (heading * Math.PI) / 180;
  return {
    x: centre.x - Math.cos(a) * mid,
    y: centre.y - Math.sin(a) * mid,
    pxPerMetre: centre.pxPerMetre,
  };
};

// The middle of the wheelbase, m from the rear end: from the side trace, or the measured lengths of a top-only car.
export const wheelbaseMiddle = (car: CarSpec | TopOnlyCar) => {
  if (isTopOnly(car)) return (car.lengths.rearAxle + car.lengths.frontAxle) / 2;
  return (carPoint(car, "rearAxle").x + carPoint(car, "frontAxle").x) / 2;
};
