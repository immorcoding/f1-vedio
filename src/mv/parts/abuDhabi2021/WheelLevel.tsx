// Wheel-level shot (5.1b, bar 83): the camera sits on the outside kerb at hub height, 30 cm off the road,
// with a wide lens, so the near tyres stand tall, the kerb and the road surface rush at the lens and away to the
// vanishing point, and the far side (wall, stands, the night) sits low on the horizon. One pinhole camera (ART-9);
// everything on the ground streams past at the cars' true speed (MOT-5), smeared over the distance it covers in a
// frame. The wheels turn at a readable stylised rate under a rotational blur (the true 37 rev/s would strobe).
// VER's front wheel is tucked up behind HAM's rear wheel, in his slipstream (0.9 m nose to gearbox).
import { carCamera, carPoint, MangaCar, PIRELLI_2021, RB16B, W12, type CarSpec } from "../../../cars";
import { pinhole, type Camera } from "../../../kit/camera";
import { INK, PAPER } from "../../../kit/colors";
import { InkFilterDef, inkFilter } from "../../../kit/ink";
import { speedLines } from "../../../kit/lines";
import { ToneDefs, tone } from "../../../kit/tone";
import { Slipstream, trackLayout } from "../../../scenes/abu-dhabi-2021/Closeup";
import { Background, TracksideDefs } from "../../../scenes/abu-dhabi-2021/trackside";
import { hamDist, sidePlan } from "./staging.ts";
import { type ShotTime } from "./shotClock";

// 30 cm up, horizon low in the frame, wide (f = 1600 px): HAM at 4.6 m is ~350 px/m.
const CAM = pinhole({ f: 1600, horizon: 590, cx: 960, height: 0.3 });
// Ground bands, distance from the camera (m): the camera stands on the outside kerb.
const KERB = [2.4, 3.8];
const EDGE = [3.8, 4.0];
const ROAD = [3.8, 18.8];
const WALL_Z = 25;
// The side-on plan's distances (staging.ts, z 10 / 12.5 from the broadcast camera) moved up to this camera.
const NEAR = 4.6;
const DZ = 10 - NEAR;

const LAYOUT = trackLayout(-200, 1400);

// Rotational blur over a turning wheel: ink and grey arcs swept round the hub, re-dealt every frame.
const SpinBlur: React.FC<{ x: number; y: number; r: number; seed: number }> = ({ x, y, r, seed }) => (
  <g>
    <circle cx={x} cy={y} r={r * 0.62} fill={tone("dark")} opacity={0.55} />
    {Array.from({ length: 7 }, (_, i) => {
      const rr = r * (0.22 + 0.11 * i);
      const a0 = ((seed * 47 + i * 83) % 360) * (Math.PI / 180);
      const sweep = 1.6 + ((i * 37 + seed * 13) % 9) * 0.12;
      const p = (a: number) => `${x + Math.cos(a) * rr} ${y + Math.sin(a) * rr}`;
      return (
        <path
          key={i}
          d={`M ${p(a0)} A ${rr} ${rr} 0 0 1 ${p(a0 + sweep)}`}
          fill="none"
          stroke={i % 2 ? "#9a9a9a" : PAPER}
          strokeWidth={i % 2 ? 3 : 2}
          strokeLinecap="round"
          opacity={0.75}
        />
      );
    })}
  </g>
);

const frontHub = (cam: Camera, car: CarSpec, x: number, z: number) => {
  const a = carPoint(car, "frontAxle");
  return { x: cam.screenX(x + a.x, z), y: cam.screenY(a.y, z) };
};
const rearHub = (cam: Camera, car: CarSpec, x: number, z: number) => {
  const a = carPoint(car, "rearAxle");
  return { x: cam.screenX(x + a.x, z), y: cam.screenY(a.y, z) };
};

export const WheelLevel: React.FC<{ st: ShotTime; t0: number }> = ({ st, t0 }) => {
  const { t } = st;
  const race = t0 + t;
  const cam = CAM;
  const camX = hamDist(race);
  // where HAM's rear end sits relative to the camera: the camera frames VER's front wheel and HAM's rear wheel
  const hamX = 1.0;
  const plan = sidePlan(race, hamX);
  const hamZ = plan.ham.z - DZ;
  const verZ = plan.ver.z - DZ;
  const wheel = t * 1500; // stylised
  const seed = st.frame;
  const X = (x: number, z: number) => cam.screenX(x, z);
  // ground features stream: world x minus the distance travelled, smeared over one frame's travel (1.4 m)
  const smear = 1.4;
  const kerbBlocks = [];
  for (let i = Math.floor((camX - 12) / 1); i < Math.floor((camX + 40) / 1); i++) {
    if (i % 2) continue;
    const x0 = i - camX;
    for (let k = 0; k < 3; k++) {
      const off = (k * smear) / 3;
      kerbBlocks.push(
        <path
          key={`${i}-${k}`}
          d={cam.groundQuad(KERB[0], KERB[1], x0 + off - smear / 3, x0 + 1 + off)}
          fill={INK}
          opacity={k === 0 ? 0.9 : 0.35}
        />,
      );
    }
  }
  // rubbered-in streaks on the road, one every few metres at fixed places, smeared
  const streaks = [];
  for (let i = Math.floor((camX - 20) / 3); i < Math.floor((camX + 60) / 3); i++) {
    const z = ROAD[0] + 0.6 + ((i * 7.31) % 1) * 9;
    const x0 = i * 3 + ((i * 3.7) % 2) - camX;
    streaks.push(
      <path
        key={i}
        d={`M ${X(x0, z)} ${cam.screenY(0, z)} L ${X(x0 + 2 + smear, z)} ${cam.screenY(0, z)}`}
        stroke={INK}
        strokeWidth={Math.max(1.2, 9 / z)}
        opacity={0.55}
      />,
    );
  }
  const cars = [
    { car: W12, x: plan.ham.x, z: hamZ, compound: PIRELLI_2021.hard, w: wheel + 30 },
    { car: RB16B, x: plan.ver.x, z: verZ, compound: PIRELLI_2021.soft, w: wheel },
  ];
  // far first
  cars.sort((a, b) => b.z - a.z);
  const ham = cam.anchor({ x: plan.ham.x, z: hamZ });
  const bounce = (k: number) => Math.sin(t * 38 + k) * 1.6;
  return (
    <svg width={1920} height={1080}>
      <defs>
        <ToneDefs />
        <InkFilterDef />
        <clipPath id="wl-panel">
          <path d="M 40 40 L 1880 40 L 1880 1040 L 40 1040 Z" />
        </clipPath>
        <TracksideDefs cam={cam} layout={LAYOUT} camX={camX} prefix="wl" />
      </defs>
      <rect width={1920} height={1080} fill={PAPER} />
      <g filter={inkFilter()}>
        <g clipPath="url(#wl-panel)">
          <g transform={`rotate(-4 960 540) translate(0 ${Math.sin(t * 29) * 2})`}>
            <Background cam={cam} layout={LAYOUT} camX={camX} prefix="wl" />
            {/* the night above the wall streams too: white streaks */}
            <path
              d={speedLines({
                x: -300,
                y: -200,
                w: 2600,
                h: cam.horizon + 160,
                n: 60,
                seed: `wl-sky-${seed}`,
                angle: 180,
                thickness: 6,
                length: [0.2, 0.6],
              })}
              fill={PAPER}
              opacity={0.6}
            />
            {/* far run-off, wall foot */}
            <path d={cam.groundQuad(ROAD[1], WALL_Z, -400, 400)} fill={tone("light")} />
            {/* the road */}
            <path d={cam.groundQuad(ROAD[0], ROAD[1], -400, 400)} fill={PAPER} />
            {streaks}
            <path
              d={cam.groundQuad(EDGE[0], EDGE[1], -400, 400)}
              fill={PAPER}
              stroke={INK}
              strokeWidth={2.5}
            />
            {/* the outside kerb the camera sits on, rushing past */}
            <path d={cam.groundQuad(KERB[0], KERB[1], -400, 400)} fill={PAPER} />
            {kerbBlocks}
            <path d={cam.groundQuad(KERB[0], KERB[1], -400, 400)} fill="none" stroke={INK} strokeWidth={3} />
            {/* run-off right under the lens */}
            <path d={cam.groundQuad(0.5, KERB[0], -400, 400)} fill={tone("light")} />
            <path
              d={speedLines({
                x: -300,
                y: cam.screenY(0, KERB[0]) + 4,
                w: 2600,
                h: 1100 - cam.screenY(0, KERB[0]),
                n: 26,
                seed: `wl-near-${seed}`,
                angle: 180,
                thickness: 9,
                length: [0.3, 0.8],
              })}
              fill={INK}
              opacity={0.8}
            />
            {/* HAM's wake, peeling off his rear wing over VER's nose */}
            <Slipstream at={ham} t={t} length={4.5} strength={0.9} />
            {cars.map((c, k) => {
              const a = cam.anchor({ x: c.x, z: c.z });
              const at = { ...a, y: a.y + bounce(k) };
              const f = frontHub(cam, c.car, c.x, c.z);
              const r = rearHub(cam, c.car, c.x, c.z);
              const rr = 0.36 * a.pxPerMetre;
              return (
                <g key={c.car.name}>
                  <MangaCar car={c.car} at={at} state={{ ...carCamera(c.car, cam, c.z, { x: c.x }), wheelAngle: c.w, compound: c.compound }} />
                  <SpinBlur x={f.x} y={f.y + bounce(k)} r={rr * 0.78} seed={seed + k * 5} />
                  <SpinBlur x={r.x} y={r.y + bounce(k)} r={rr * 0.78} seed={seed + k * 5 + 2} />
                </g>
              );
            })}
          </g>
        </g>
        <path d="M 40 40 L 1880 40 L 1880 1040 L 40 1040 Z" fill="none" stroke={INK} strokeWidth={10} />
      </g>
    </svg>
  );
};
