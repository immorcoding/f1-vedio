// Shared pieces of the Brazil 2008 shots: the rainy side close-up (one camera, wet trackside, cars with reflections,
// tyre spray and falling rain) and a frame helper for manga panels.
import { useId } from "react";
import { type CarSpec, type CarState, carPoint } from "../../../cars";
import type { Camera } from "../../../kit/camera";
import { INK, PAPER } from "../../../kit/colors";
import { InkFilterDef, inkFilter } from "../../../kit/ink";
import { speedLines } from "../../../kit/lines";
import { Rain, Spray } from "../../../kit/rain";
import { ToneDefs } from "../../../kit/tone";
import {
  BRAZIL_CAM,
  RainTrackside,
  WetCar,
} from "../../../scenes/brazil-2008/trackside";

export type RainCar = {
  car: CarSpec;
  // rear end relative to the camera along the track, m (+ = ahead, to the right), and distance from the camera, m
  x: number;
  z: number;
  state?: CarState;
  // spray strength 0–1 (a car on dry tyres throws less: its tread holds no water)
  spray?: number;
};

// One car's spray: the low front-wheel mist (`front`), or the big rear plume (`low` = shorter and flatter).
const CarSpray: React.FC<{
  c: RainCar;
  cam: Camera;
  t: number;
  front?: boolean;
  low?: boolean;
}> = ({ c, cam, t, front = false, low = false }) => {
  const a = cam.anchor({ x: c.x, z: c.z });
  const m = a.pxPerMetre;
  const wheel = carPoint(c.car, front ? "frontContact" : "rearContact").x;
  return front ? (
    <Spray
      x={a.x + (wheel - 0.35) * m}
      y={a.y}
      m={m}
      t={t + 0.3}
      length={1.6}
      height={0.55}
      strength={(c.spray ?? 1) * 0.8}
      seed={`${c.car.name}-f`}
    />
  ) : (
    <Spray
      x={a.x + (wheel - 0.35) * m}
      y={a.y}
      m={m}
      t={t}
      length={low ? 6 : 9}
      height={low ? 0.9 : 1.6}
      strength={c.spray ?? 1}
      seed={`${c.car.name}-r`}
    />
  );
};

// Spinning wheels (MOT-5): ink arcs of motion blur sweeping round each near wheel, faster the faster the car goes
// (the spokes alone strobe at 60 fps).
const WheelBlur: React.FC<{ cam: Camera; c: RainCar; t: number }> = ({
  cam,
  c,
  t,
}) => {
  const a = cam.anchor({ x: c.x, z: c.z });
  const k = (a.pxPerMetre * c.car.frame.k) / 250;
  return (
    <g>
      {c.car.nearWheels.map((w, i) => {
        const cx = a.x + (c.car.frame.x - w.cx) * k;
        const cy = a.y + (w.cy - c.car.frame.ground) * k;
        const r = c.car.rimR * k;
        const spin = t * 1500 + i * 40;
        const arc = (rr: number, from: number, len: number) => {
          const p0 = (from * Math.PI) / 180;
          const p1 = ((from + len) * Math.PI) / 180;
          return `M ${cx + rr * Math.cos(p0)} ${cy + rr * Math.sin(p0)} A ${rr} ${rr} 0 0 1 ${cx + rr * Math.cos(p1)} ${cy + rr * Math.sin(p1)}`;
        };
        return (
          <g key={i} opacity={0.75}>
            {[0, 120, 240].map((o) => (
              <path
                key={o}
                d={arc(r * 0.72, spin + o, 70)}
                fill="none"
                stroke="#2a2a2a"
                strokeWidth={r * 0.28}
                strokeLinecap="round"
              />
            ))}
            {[60, 180, 300].map((o) => (
              <path
                key={o}
                d={arc(r * 1.25, spin + o, 50)}
                fill="none"
                stroke="#fbfaf6"
                strokeWidth={2.5}
                strokeLinecap="round"
                opacity={0.7}
              />
            ))}
          </g>
        );
      })}
    </g>
  );
};

// A rainy side close-up filling the frame (1920×1080); put it in a Panel to frame it smaller.
export const RainCloseup: React.FC<{
  t: number;
  camX: number;
  cars: readonly RainCar[];
  cam?: Camera;
  speed?: number;
  stands?: boolean;
  tilt?: number;
  shake?: { x: number; y: number };
  // drawn on the track, under the cars (finish stripe)
  ground?: React.ReactNode;
  // draw all the spray under all the cars, lower and shorter (for shots where one car passes another)
  sprayUnder?: boolean;
  children?: React.ReactNode;
}> = ({
  t,
  camX,
  cars,
  cam = BRAZIL_CAM,
  speed = 0.6,
  stands = true,
  tilt = -2,
  shake,
  ground,
  sprayUnder = false,
  children,
}) => {
  const sorted = [...cars].sort((a, b) => b.z - a.z);
  const seed = Math.floor(t * 20);
  return (
    <g filter={inkFilter()}>
      <g
        transform={`translate(${shake?.x ?? 0} ${shake?.y ?? 0}) rotate(${tilt} 960 540)`}
      >
        <RainTrackside cam={cam} camX={camX} t={t} stands={stands} />
        {ground}
        {speed > 0 ? (
          <path
            d={speedLines({
              x: -300,
              y: -150,
              w: 2500,
              h: cam.screenY(0, 24) + 150,
              n: Math.round(30 + 50 * speed),
              seed: `bg-${seed}`,
              angle: 180,
              thickness: 7,
            })}
            fill={PAPER}
            opacity={0.5 * speed}
          />
        ) : null}
        {/* spray: "under" draws every plume before any car, so no car's spray hides another car (ART-18) */}
        {sprayUnder
          ? sorted.map((c) => (
              <CarSpray key={`s-${c.car.name}`} c={c} cam={cam} t={t} low />
            ))
          : null}
        {sorted.map((c) => (
          <g key={c.car.name}>
            {sprayUnder ? null : <CarSpray c={c} cam={cam} t={t} front />}
            <WetCar
              cam={cam}
              car={c.car}
              x={c.x}
              z={c.z}
              state={{
                ...c.state,
                // the chassis rides the bumps (MOT-5)
                tilt: (c.state?.tilt ?? 0) + 0.25 * Math.sin(t * 21 + c.z),
              }}
            />
            <WheelBlur cam={cam} c={c} t={t} />
            {sprayUnder ? null : <CarSpray c={c} cam={cam} t={t} />}
          </g>
        ))}
      </g>
      <Rain
        t={t}
        color={INK}
        n={170}
        width={2}
        opacity={0.55}
        seed="rain-ink"
      />
      <Rain
        t={t + 0.37}
        color={PAPER}
        n={110}
        width={3}
        length={90}
        opacity={0.8}
        seed="rain-paper"
      />
      {children}
    </g>
  );
};

// A manga panel: draws `children` (laid out for a full 1920×1080 frame) into a box, cropped to the frame's
// `view` rectangle, inside a heavy ink border.
export const Panel: React.FC<{
  box: { x: number; y: number; w: number; h: number };
  view?: { x: number; y: number; w: number; h: number };
  // ink border round the panel (off for a full-frame crop)
  border?: boolean;
  children: React.ReactNode;
}> = ({
  box,
  view = { x: 0, y: 0, w: 1920, h: 1080 },
  border = true,
  children,
}) => {
  const id = `pn${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  return (
    <g>
      <svg
        x={box.x}
        y={box.y}
        width={box.w}
        height={box.h}
        viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`}
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <clipPath id={id}>
            <rect x={view.x} y={view.y} width={view.w} height={view.h} />
          </clipPath>
        </defs>
        <rect
          x={view.x}
          y={view.y}
          width={view.w}
          height={view.h}
          fill={PAPER}
        />
        <g clipPath={`url(#${id})`}>{children}</g>
      </svg>
      {border ? (
        <rect
          x={box.x}
          y={box.y}
          width={box.w}
          height={box.h}
          fill="none"
          stroke={INK}
          strokeWidth={10}
        />
      ) : null}
    </g>
  );
};

// The page every shot draws on: paper, the tone screens and the ink wobble filter.
export const Page: React.FC<{ children: React.ReactNode; dark?: boolean }> = ({
  children,
  dark = false,
}) => (
  <svg width={1920} height={1080}>
    <defs>
      <ToneDefs />
      <InkFilterDef />
    </defs>
    <rect width={1920} height={1080} fill={dark ? INK : PAPER} />
    {children}
  </svg>
);
