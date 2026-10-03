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
        {sorted.map((c) => {
          const a = cam.anchor({ x: c.x, z: c.z });
          const m = a.pxPerMetre;
          const rear = carPoint(c.car, "rearContact").x;
          const front = carPoint(c.car, "frontContact").x;
          return (
            <g key={c.car.name}>
              {/* front-wheel spray stays low, behind the car */}
              <Spray
                x={a.x + (front - 0.35) * m}
                y={a.y}
                m={m}
                t={t + 0.3}
                length={1.6}
                height={0.55}
                strength={(c.spray ?? 1) * 0.8}
                seed={`${c.car.name}-f`}
              />
              <WetCar cam={cam} car={c.car} x={c.x} z={c.z} state={c.state} />
              {/* the rear tyres throw the big plume, streaming back off the rear wing */}
              <Spray
                x={a.x + (rear - 0.35) * m}
                y={a.y}
                m={m}
                t={t}
                length={9}
                height={1.6}
                strength={c.spray ?? 1}
                seed={`${c.car.name}-r`}
              />
            </g>
          );
        })}
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
  children: React.ReactNode;
}> = ({ box, view = { x: 0, y: 0, w: 1920, h: 1080 }, children }) => {
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
      <rect
        x={box.x}
        y={box.y}
        width={box.w}
        height={box.h}
        fill="none"
        stroke={INK}
        strokeWidth={10}
      />
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
