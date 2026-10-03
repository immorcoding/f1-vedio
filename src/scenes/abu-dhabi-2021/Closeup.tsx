// A broadcast-style side close-up at Yas Marina by night (MOT-2): one manga panel, one pinhole camera tracking the
// cars along the outside wall (ART-9), the trackside background scrolling with true parallax, speed lines for pace.
// The T5 panel is this same set-up frozen at its settled frame; the other close-ups of the 2021 part reuse it.
import { useId } from "react";
import { MangaCar, type CarSpec, type CarState } from "../../cars";
import type { Camera } from "../../kit/camera";
import { INK, PAPER } from "../../kit/colors";
import { InkFilterDef, inkFilter } from "../../kit/ink";
import { speedLines } from "../../kit/lines";
import { ToneDefs } from "../../kit/tone";
import {
  Background,
  TrackSurface,
  TracksideDefs,
  type GroundMark,
  type TracksideLayout,
} from "./trackside";

export const PANEL = { x: 40, y: 40, w: 1840, h: 1000 };

export type CloseupCar = {
  car: CarSpec;
  /** Position relative to the camera along the track, m (car's rear end); + = ahead, to the right. */
  x: number;
  /** Distance from the camera, m: the racing surface spans 8.6–13.65. */
  z: number;
  state?: CarState;
};

// A long stretch of trackside for tracking shots: grandstands with gaps, floodlight towers, distant blocks.
export const trackLayout = (
  from: number,
  to: number,
  hotel?: TracksideLayout["hotel"],
): TracksideLayout => {
  const stands = [];
  for (let x = Math.floor(from / 110) * 110 - 110; x < to + 110; x += 110)
    stands.push({ x0: x, x1: x + 72 });
  const beams: [number, number][] = [];
  for (let x = Math.floor(from / 40) * 40 - 80; x < to + 80; x += 40)
    beams.push([x, (Math.abs(x / 40) % 2) * 0.3 + 0.6]);
  return {
    stands,
    buildings: [Math.floor(from / 9) - 10, Math.ceil(to / 9) + 10],
    hotel,
    beams,
  };
};

export const Closeup: React.FC<{
  cam: Camera;
  layout: TracksideLayout;
  camX: number;
  cars: readonly CloseupCar[];
  /** 0..1: speed-line density over the background. */
  speed?: number;
  /** Seed that changes every few frames so speed and focus lines flicker. */
  seed?: number;
  /** Panel tilt, degrees (the settled frame uses −3). */
  tilt?: number;
  marks?: readonly GroundMark[];
  straight?: boolean;
  focus?: { x: number; y: number };
  /** Extra camera shake, px. */
  shake?: { x: number; y: number };
  hotelGlow?: number;
  /** Drawn between the cars (screen space, before the nearer car): smoke, sparks. */
  between?: React.ReactNode;
  /** Drawn over the cars inside the tilted camera group (air lines, smoke in front). */
  over?: React.ReactNode;
  /** Drawn on top, inside the panel (lettering, insets). */
  children?: React.ReactNode;
}> = ({
  cam,
  layout,
  camX,
  cars,
  speed = 0,
  seed = 0,
  tilt = -3,
  marks,
  straight = true,
  focus,
  shake,
  hotelGlow,
  between,
  over,
  children,
}) => {
  const prefix = `cu${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const sorted = [...cars].sort((a, b) => b.z - a.z);
  return (
    <svg width={1920} height={1080}>
      <defs>
        <ToneDefs />
        <InkFilterDef />
        <clipPath id={`${prefix}-panel`}>
          <rect x={PANEL.x} y={PANEL.y} width={PANEL.w} height={PANEL.h} />
        </clipPath>
        <TracksideDefs cam={cam} layout={layout} camX={camX} prefix={prefix} />
      </defs>
      <rect width={1920} height={1080} fill={PAPER} />
      <g filter={inkFilter()}>
        <g clipPath={`url(#${prefix}-panel)`}>
          <g
            transform={`translate(${shake?.x ?? 0} ${shake?.y ?? 0}) rotate(${tilt} 960 540)`}
          >
            <Background
              cam={cam}
              layout={layout}
              camX={camX}
              prefix={prefix}
              hotelGlow={hotelGlow}
            />
            {speed > 0 ? (
              <path
                d={speedLines({
                  x: -300,
                  y: -150,
                  w: 2500,
                  h: cam.screenY(0, 25) + 150,
                  n: Math.round(40 + 60 * speed),
                  seed: `bg-${seed}`,
                  angle: 180,
                  thickness: 8,
                  length: [0.25, 0.7],
                })}
                fill={PAPER}
                opacity={Math.min(1, 0.9 * speed)}
              />
            ) : null}
            <TrackSurface
              cam={cam}
              camX={camX}
              prefix={prefix}
              marks={marks}
              straight={straight}
              focus={focus ? { ...focus, seed } : undefined}
            />
            {speed > 0 ? (
              <path
                d={speedLines({
                  x: -300,
                  y: cam.screenY(0, 13.65),
                  w: 2500,
                  h: 1200 - cam.screenY(0, 13.65),
                  n: Math.round(20 + 30 * speed),
                  seed: `fg-${seed}`,
                  angle: 180,
                  thickness: 6,
                  length: [0.2, 0.5],
                })}
                fill={INK}
                opacity={0.7 * speed}
              />
            ) : null}
            {sorted.map((c, i) => (
              <g key={c.car.name}>
                {i === sorted.length - 1 ? between : null}
                <MangaCar
                  car={c.car}
                  at={cam.anchor({ x: c.x, z: c.z })}
                  state={c.state}
                />
              </g>
            ))}
            {over}
          </g>
          {children}
        </g>
        <rect
          x={PANEL.x}
          y={PANEL.y}
          width={PANEL.w}
          height={PANEL.h}
          fill="none"
          stroke={INK}
          strokeWidth={10}
        />
      </g>
    </svg>
  );
};

/**
 * Slipstream (尾流): wavy air lines peeling off a car's rear wing and streaming back, in screen space. `at` is the
 * car's screen anchor (rear end on the ground) and `t` seconds animates the ripple.
 */
export const Slipstream: React.FC<{
  at: { x: number; y: number; pxPerMetre: number };
  t: number;
  length: number; // m
  strength?: number;
}> = ({ at, t, length, strength = 1 }) => {
  const m = at.pxPerMetre;
  const lines = [0.95, 0.75, 0.55, 0.35].map((h, i) => {
    const y0 = at.y - h * m;
    const pts: string[] = [];
    for (let k = 0; k <= 24; k++) {
      const u = k / 24;
      const x = at.x - u * length * m;
      const y =
        y0 + Math.sin(u * 9 - t * 14 + i * 1.3) * (4 + 14 * u) * strength;
      pts.push(`${k ? "L" : "M"} ${x} ${y}`);
    }
    return pts.join(" ");
  });
  const dash = (i: number) => `${60 + i * 20} ${30 + i * 12}`;
  return (
    <g opacity={Math.min(1, strength)}>
      {lines.map((d, i) => (
        <g key={i}>
          <path
            d={d}
            fill="none"
            stroke={INK}
            strokeWidth={10}
            strokeLinecap="round"
            strokeDasharray={dash(i)}
            strokeDashoffset={-t * 900}
          />
          <path
            d={d}
            fill="none"
            stroke={PAPER}
            strokeWidth={4.5}
            strokeLinecap="round"
            strokeDasharray={dash(i)}
            strokeDashoffset={-t * 900}
          />
        </g>
      ))}
    </g>
  );
};
