// Interlagos in the rain, seen from the track (ART-8, ART-9): the black-and-white environment behind the Brazil 2008
// side shots — a low overcast sky in dark tone with rain squalls, the São Paulo apartment towers that ring the circuit
// on the skyline, a crowded grandstand and the catch fence (the shared trackside pieces from Suzuka), and a wet,
// dark track that mirrors the cars. Drawn after the 2008 race photos (docs/assets/reference-register.md).
//
// Everything sits in world metres through the panel's one pinhole camera; `camX` is how far the camera has tracked
// along the track (m), so near things slide past faster than far ones. A car at world x is drawn at
// cam.anchor({ x: x - camX, z }).
import { random } from "remotion";
import {
  carCamera,
  MangaCar,
  type CarSpec,
  type CarState,
} from "../../cars";
import { pinhole, type Camera } from "../../kit/camera";
import { INK, PAPER } from "../../kit/colors";
import { tone } from "../../kit/tone";
import {
  Barriers,
  Grandstand,
  type TracksideLayout,
} from "../suzuka-1989/trackside";

// The close-up camera of the Brazil part: 2.6 m up, level, f = 2300 px; the cars run 9–14 m away.
export const BRAZIL_CAM = pinhole({
  f: 2300,
  horizon: 250,
  cx: 960,
  height: 2.6,
});

export const INTERLAGOS_LAYOUT: TracksideLayout = {
  nearEdge: 7,
  farEdge: 20,
  rail: 22,
  fence: 23.5,
  stand: 46,
  standFrom: -120,
  standTo: 900,
};

type P = { cam: Camera; camX: number; layout?: TracksideLayout };

// Low cloud: a dark-tone sky with lighter bands and slanting squall streaks hanging from the cloud base.
export const StormSky: React.FC<P> = ({ cam, camX }) => {
  const shift = ((camX * cam.f) / 6000) % 2400;
  const bands = [0.18, 0.42, 0.66].map((v, i) => {
    const y = cam.horizon * v;
    let d = `M -400 ${y}`;
    for (let k = 0; k <= 14; k++) {
      const x = -400 + k * 200 - (shift % 200);
      d += ` Q ${x + 100} ${y - 18 - 20 * random(`sky-${i}-${k}`)} ${x + 200} ${y}`;
    }
    return d + ` L 2320 ${y + 40} L -400 ${y + 40} Z`;
  });
  return (
    <g>
      <rect
        x={-400}
        y={-400}
        width={2720}
        height={cam.horizon + 400}
        fill={tone("mid")}
      />
      {bands.map((d, i) => (
        <path
          key={i}
          d={d}
          fill={i === 1 ? tone("dark") : tone("light")}
          opacity={0.9}
        />
      ))}
      {/* squalls: rain falling from the cloud base far away */}
      <g opacity={0.35}>
        {Array.from({ length: 40 }, (_, i) => {
          const x = ((((i * 61 - shift) % 2600) + 2600) % 2600) - 340;
          return (
            <path
              key={i}
              d={`M ${x} ${cam.horizon * 0.3} L ${x - 60} ${cam.horizon}`}
              stroke={PAPER}
              strokeWidth={1.5}
            />
          );
        })}
      </g>
    </g>
  );
};

// São Paulo's apartment blocks round the circuit: slabs of many storeys on the skyline, windows in rows.
export const Skyline: React.FC<P> = ({ cam, camX }) => {
  const z = 700;
  const blocks = Array.from({ length: 40 }, (_, i) => {
    const r = (k: string) => random(`sp-${i}-${k}`);
    return {
      x: -400 + i * 38 + r("x") * 14,
      w: 14 + r("w") * 16,
      h: 18 + r("h") * 34,
    };
  });
  const span = 40 * 38;
  const sx = camX % span;
  return (
    <g>
      {blocks.map((b, i) => {
        const x = ((((b.x - sx) % span) + span) % span) - 300;
        const X0 = cam.screenX(x, z);
        const X1 = cam.screenX(x + b.w, z);
        const Y0 = cam.screenY(b.h, z);
        const Y1 = cam.screenY(0, z);
        const rows = Math.floor(b.h / 3);
        return (
          <g key={i}>
            <rect
              x={X0}
              y={Y0}
              width={X1 - X0}
              height={Y1 - Y0}
              fill={i % 3 ? tone("dark") : INK}
            />
            <path
              d={Array.from({ length: rows }, (_, k) => {
                const y = Y0 + ((k + 0.5) * (Y1 - Y0)) / rows;
                return `M ${X0 + 2} ${y.toFixed(1)} L ${X1 - 2} ${y.toFixed(1)}`;
              }).join(" ")}
              stroke={PAPER}
              strokeWidth={0.8}
              strokeDasharray="2 2"
              opacity={0.5}
            />
          </g>
        );
      })}
      {/* the wooded ridge in front of the city */}
      <path
        d={`M -400 ${cam.screenY(0, z)} ${Array.from({ length: 30 }, (_, k) => {
          const x = -400 + k * 95;
          return `Q ${x + 47} ${cam.screenY(0, z) - 14 - 10 * random(`ridge-${k}`)} ${x + 95} ${cam.screenY(0, z) - 4}`;
        }).join(
          " ",
        )} L 2320 ${cam.screenY(0, 120)} L -400 ${cam.screenY(0, 120)} Z`}
        fill={tone("mid")}
        stroke={INK}
        strokeWidth={1.5}
      />
    </g>
  );
};

// The wet track: dark asphalt with a sheen of standing water — streaks of reflected light slide past, ripples open.
export const WetTrack: React.FC<P & { t: number }> = ({
  cam,
  camX,
  layout = INTERLAGOS_LAYOUT,
}) => {
  const Y = (z: number) => cam.screenY(0, z);
  const sheen: string[] = [];
  for (let i = 0; i < 46; i++) {
    const z =
      layout.nearEdge +
      0.5 +
      random(`wz-${i}`) * (layout.farEdge - layout.nearEdge - 1);
    const span = 50;
    const xw =
      ((((random(`wx-${i}`) * span - camX) % span) + span) % span) - span / 4;
    sheen.push(
      `M ${cam.screenX(xw, z).toFixed(1)} ${Y(z).toFixed(1)} L ${cam.screenX(xw + 2 + 5 * random(`wl-${i}`), z).toFixed(1)} ${Y(z).toFixed(1)}`,
    );
  }
  const seamList: string[] = [];
  const rub: string[] = [];
  const near = layout.nearEdge + 0.5;
  const far = layout.farEdge;
  const xa = camX + ((-400 - cam.cx) * near) / cam.f;
  const xb = camX + ((2320 - cam.cx) * far) / cam.f;
  for (let k = Math.floor(xa / 9); k <= Math.ceil(xb / 9); k++) {
    const x = k * 9 - camX;
    seamList.push(
      `M ${cam.screenX(x, near).toFixed(1)} ${Y(near).toFixed(1)} L ${cam.screenX(x, far).toFixed(1)} ${Y(far).toFixed(1)}`,
    );
  }
  const zr = (near + far) / 2 + 1.2;
  for (let k = Math.floor(xa / 6); k <= Math.ceil(xb / 6); k++) {
    const x = k * 6 - camX;
    rub.push(
      `M ${cam.screenX(x, zr).toFixed(1)} ${Y(zr).toFixed(1)} L ${cam.screenX(x + 3, zr).toFixed(1)} ${Y(zr).toFixed(1)}`,
    );
  }
  const seams = seamList.join(" ");
  const rubber = rub.join(" ");
  return (
    <g>
      {/* wet verge between the far edge and the guardrail */}
      <rect
        x={-400}
        y={Y(layout.rail)}
        width={2720}
        height={Y(layout.farEdge) - Y(layout.rail)}
        fill={tone("mid")}
      />
      {/* racing surface: dark, wet */}
      <rect
        x={-400}
        y={Y(layout.farEdge)}
        width={2720}
        height={1400}
        fill={tone("dark")}
      />
      <path
        d={`M -400 ${Y(layout.farEdge)} L 2320 ${Y(layout.farEdge)}`}
        stroke={PAPER}
        strokeWidth={4}
      />
      <path
        d={`M -400 ${Y(layout.farEdge)} L 2320 ${Y(layout.farEdge)}`}
        stroke={INK}
        strokeWidth={1.5}
        transform="translate(0 -3)"
      />
      <path
        d={sheen.join(" ")}
        stroke={PAPER}
        strokeWidth={3}
        opacity={0.55}
        strokeLinecap="round"
      />
      {/* the near edge line, white paint */}
      <path
        d={`M -400 ${Y(layout.nearEdge + 0.4)} L 2320 ${Y(layout.nearEdge + 0.4)}`}
        stroke={PAPER}
        strokeWidth={10}
        opacity={0.85}
      />
      {/* tar seams across the asphalt every 9 m and a dashed line of rubber, streaming past at the camera's speed */}
      <path d={seams} stroke={INK} strokeWidth={2.4} opacity={0.55} />
      <path
        d={rubber}
        stroke={INK}
        strokeWidth={5}
        opacity={0.35}
        strokeLinecap="round"
      />
    </g>
  );
};

// Marker boards along the guardrail every 50 m (plain blocks, no text, ART-5), passing at true speed (MOT-5).
export const MarkerBoards: React.FC<P> = ({
  cam,
  camX,
  layout = INTERLAGOS_LAYOUT,
}) => {
  const z = layout.rail - 0.6;
  const boards: React.ReactNode[] = [];
  const x0 = camX + ((-300 - cam.cx) * z) / cam.f;
  const x1 = camX + ((2220 - cam.cx) * z) / cam.f;
  for (let k = Math.floor(x0 / 50); k <= Math.ceil(x1 / 50); k++) {
    const x = k * 50 - camX;
    const X0 = cam.screenX(x, z);
    const X1 = cam.screenX(x + 1.6, z);
    const top = cam.screenY(1.9, z);
    const mid = cam.screenY(1.1, z);
    const foot = cam.screenY(0, z);
    boards.push(
      <g key={k}>
        <path
          d={`M ${X0 + 4} ${mid} L ${X0 + 4} ${foot} M ${X1 - 4} ${mid} L ${X1 - 4} ${foot}`}
          stroke={INK}
          strokeWidth={4}
        />
        <rect
          x={X0}
          y={top}
          width={X1 - X0}
          height={mid - top}
          fill={PAPER}
          stroke={INK}
          strokeWidth={3}
        />
        <rect
          x={X0 + 6}
          y={top + (mid - top) * 0.3}
          width={X1 - X0 - 12}
          height={(mid - top) * 0.4}
          fill={INK}
        />
      </g>,
    );
  }
  return <g>{boards}</g>;
};

// A chequered finish line painted across the track at world x (2.6), seen in perspective.
export const FinishStripe: React.FC<P & { x: number }> = ({
  cam,
  camX,
  x,
  layout = INTERLAGOS_LAYOUT,
}) => {
  const cells: React.ReactNode[] = [];
  const cw = 0.5;
  const rows = 2;
  for (let z = layout.nearEdge; z < layout.farEdge; z += cw) {
    for (let r = 0; r < rows; r++) {
      const x0 = x - camX + r * cw;
      const black = (Math.round((z - layout.nearEdge) / cw) + r) % 2 === 0;
      cells.push(
        <path
          key={`${z}-${r}`}
          d={`M ${cam.screenX(x0, z)} ${cam.screenY(0, z)} L ${cam.screenX(x0 + cw, z)} ${cam.screenY(0, z)} L ${cam.screenX(x0 + cw, z + cw)} ${cam.screenY(0, z + cw)} L ${cam.screenX(x0, z + cw)} ${cam.screenY(0, z + cw)} Z`}
          fill={black ? INK : PAPER}
        />,
      );
    }
  }
  return <g>{cells}</g>;
};

// A car with its reflection in the wet track below it.
export const WetCar: React.FC<{
  cam: Camera;
  car: CarSpec;
  x: number;
  z: number;
  state?: CarState;
}> = ({ cam, car, x, z, state: given }) => {
  const a = cam.anchor({ x, z });
  // the far side as this camera sees it (ART-26)
  const state = { ...carCamera(car, cam, z, { x }), ...given };
  return (
    <g>
      <g transform={`translate(0 ${2 * a.y}) scale(1 -1)`} opacity={0.28}>
        <MangaCar car={car} at={a} state={state} />
      </g>
      <MangaCar car={car} at={a} state={state} />
    </g>
  );
};

// All the layers behind the cars, far to near.
export const RainTrackside: React.FC<P & { t: number; stands?: boolean }> = ({
  stands = true,
  ...p
}) => {
  const layout = p.layout ?? INTERLAGOS_LAYOUT;
  return (
    <g>
      <StormSky {...p} />
      <Skyline {...p} />
      {stands ? <Grandstand cam={p.cam} camX={p.camX} layout={layout} /> : null}
      <Barriers cam={p.cam} camX={p.camX} layout={layout} />
      <MarkerBoards cam={p.cam} camX={p.camX} layout={layout} />
      <WetTrack {...p} layout={layout} />
    </g>
  );
};
