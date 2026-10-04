// Shot 1.7 (bars 28–29): the crash at Turn 1. The camera stands on the inside of the corner (its kerb in the
// foreground), so the cars run right to left and SEN, on the inside, is the near car. On 28.1 SEN's left front tyre
// hits PRO's right rear tyre: the frame freezes on an impact star with "轰！", debris flies, then the frame shakes out
// and the two cars, locked together, slide off the outside of the corner — away from the camera, across the grass
// and into the gravel trap — throwing up dust, and stop. Staging (world metres) lives in staging.ts and is tested for
// interpenetration (ART-18).
import { Easing, random } from "remotion";
import {
  carPoint,
  F641_PRO,
  MangaCar,
  MP4_5B_SEN,
  type CarSpec,
} from "../../../cars";
import { pinhole, type Camera } from "../../../kit/camera";
import { INK, PAPER } from "../../../kit/colors";
import { ImpactStar } from "../../../kit/impact";
import { InkFilterDef, inkFilter } from "../../../kit/ink";
import { Sfx } from "../../../kit/lettering";
import { focusLines, speedLines } from "../../../kit/lines";
import { ToneDefs, tone } from "../../../kit/tone";
import {
  Trackside,
  TRACKSIDE_DEFAULT,
  type TracksideLayout,
} from "../../../scenes/suzuka-1989/trackside";
import { ramp, shotById, type PictureProps } from "./common";
import { Debris, GravelTrap, NearKerb } from "./effects";
import {
  cars17,
  drift17,
  HIT,
  yaw17,
  SLIDE_TOTAL,
  slide17,
  Z_SEN_17,
} from "./staging";

// The panel's camera: 1.8 m up on the inside of Turn 1, level, f = 1700 px (ART-9).
export const CAM_17: Camera = pinhole({
  f: 1700,
  horizon: 500,
  cx: 960,
  height: 1.8,
});
// Track from the inside edge (5 m from the camera) to the outside edge 13 m further; a strip of grass, then the
// gravel trap out to the guardrail.
export const LAYOUT_17: TracksideLayout = {
  ...TRACKSIDE_DEFAULT,
  nearEdge: 5,
  farEdge: 18,
  rail: 38,
  fence: 39.5,
  stand: 64,
  standFrom: -140,
  standTo: 80,
};
export const GRAVEL_17 = { z0: 19, z1: 37 };
const TYRE_R = 0.32;

// The middle of a car's wheelbase, m from its rear end.
const midM = (car: CarSpec) =>
  (carPoint(car, "rearAxle").x + carPoint(car, "frontAxle").x) / 2;

// Screen anchor (rear end on the ground) of a car facing left whose wheelbase middle is at world (x, z).
export const anchorLeft = (
  cam: Camera,
  camX: number,
  car: CarSpec,
  x: number,
  z: number,
) => cam.anchor({ x: x + midM(car) - camX, z });

// The camera pans with the slide, a little behind it, so the cars drift across the frame to the left as they stop.
export const camX17 = (f: number) => -2.2 - 0.97 * slide17(f);
// ...and dollies after them as they slide away across the grass, so they stay a good size in the frame (m).
export const camZ17 = (f: number) => 0.8 * drift17(f);
// The layout as seen from the dollied camera: every depth less camZ.
const layoutAt = (camZ: number): TracksideLayout => ({
  ...LAYOUT_17,
  nearEdge: LAYOUT_17.nearEdge - camZ,
  farEdge: LAYOUT_17.farEdge - camZ,
  rail: LAYOUT_17.rail - camZ,
  fence: LAYOUT_17.fence - camZ,
  stand: LAYOUT_17.stand - camZ,
});

// Skid marks: the track of each car's near and far tyres (front and rear axle) from the hit to frame f, on the ground,
// seen from the dollied camera. Wheelbase middles from staging; axles ±half a wheelbase; tyres ±0.85 m across.
const skids = (f: number, camX: number, camZ: number) => {
  if (f <= HIT) return [];
  const out: { d: string; w: number }[] = [];
  const frames: number[] = [];
  for (let k = HIT; k < f; k += 3) frames.push(k);
  frames.push(f);
  const cars = [
    { key: "sen" as const, half: 2.94 / 2 },
    { key: "pro" as const, half: 2.86 / 2 },
  ];
  for (const car of cars)
    for (const axle of [-1, 1])
      for (const side of [-0.85, 0.85]) {
        // only the stretch still in front of the dollied camera
        const pts = frames.flatMap((k) => {
          const c = cars17(k)[car.key];
          const x = c.x + axle * car.half - camX;
          const z = c.z + side - camZ;
          return z > 1.5 ? [CAM_17.project({ x, z })] : [];
        });
        if (pts.length < 2) continue;
        const zMid = cars17(f)[car.key].z + side - camZ;
        out.push({
          d: `M ${pts.map((p) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" L ")}`,
          w: Math.max(2, 0.12 * CAM_17.pxPerMetre(Math.max(1, zMid))),
        });
      }
  return out;
};

// A car turned by the yaw off the camera's axis after the hit, still drawn side-on (MangaCar has only the side view):
// shortened by cos(yaw) about the middle of its wheelbase, which stays in place. For 12° that is 2 % of the length.
const squash = (
  a: { x: number; y: number; pxPerMetre: number },
  car: CarSpec,
  f: number,
) => {
  const k = Math.cos((yaw17(f) * Math.PI) / 180);
  // facing left, the wheelbase middle lies midM px to the left of the rear end
  const mx = a.x - midM(car) * a.pxPerMetre;
  return `translate(${mx} 0) scale(${k} 1) translate(${-mx} 0)`;
};

// Everything of the crash panel at song frame f, without the frame border and the sound effect (1.8 reuses it).
// Dust thrown up behind a car in the gravel: puffs left along its path every few frames from the moment it crosses
// into the trap, each growing and rising as it ages, in world metres seen from the dollied camera. `extraAge` ages the
// whole cloud further (1.8, where it settles) and `fade` 0–1 thins and sinks it.
const TrailDust: React.FC<{
  f: number;
  car: "sen" | "pro";
  half: number;
  camX: number;
  camZ: number;
  extraAge: number;
  fade: number;
}> = ({ f, car, half, camX, camZ, extraAge, fade }) => {
  if (fade >= 1) return null;
  const puffs: { x: number; y: number; r: number; key: string; z: number }[] =
    [];
  for (let k = HIT; k <= f; k += 4) {
    const c = cars17(k)[car];
    // tyre smoke from the locked wheels on the track and grass, a full dust cloud once in the gravel
    const gravel = c.z >= GRAVEL_17.z0 - 0.5;
    if (!gravel && (k - HIT) % 8 !== 0) continue;
    const size = gravel ? 1 : 0.5;
    const age = (f - k) / 60 + extraAge;
    for (const side of [0.75, -0.75]) {
      const q = (n: string) => random(`td-${car}-${k}-${side}-${n}`);
      const zw = c.z + side + (q("z") - 0.5) * 0.6;
      const zv = zw - camZ;
      if (zv < 1.5) continue;
      const rM =
        Math.min(2.2, 0.35 + 0.95 * Math.pow(age, 0.8)) *
        (0.75 + 0.5 * q("r")) *
        size *
        (1 - 0.45 * fade);
      const hM =
        (0.25 + 0.9 * Math.pow(age, 0.7) * (0.6 + 0.6 * q("h"))) *
        (1 - 0.7 * fade);
      const xw = c.x + half + 0.4 + 0.5 * age + (q("x") - 0.5) * 1.2 - camX;
      const p = CAM_17.project({ x: xw, y: hM, z: zv });
      puffs.push({
        x: p.x,
        y: p.y,
        r: rM * CAM_17.pxPerMetre(zv) * 0.5,
        key: `${k}${side}`,
        z: zv,
      });
    }
  }
  puffs.sort((a, b) => b.z - a.z);
  return (
    <g opacity={1 - fade}>
      {puffs.map((p) => (
        <g key={p.key}>
          <circle
            cx={p.x}
            cy={p.y}
            r={p.r}
            fill={PAPER}
            stroke={INK}
            strokeWidth={2.4}
          />
          <path
            d={`M ${p.x - p.r * 0.8} ${p.y + p.r * 0.45} A ${p.r} ${p.r} 0 0 0 ${p.x + p.r * 0.9} ${p.y + p.r * 0.25}`}
            fill="none"
            stroke={tone("light")}
            strokeWidth={p.r * 0.5}
          />
        </g>
      ))}
    </g>
  );
};

export const CrashStage: React.FC<{
  f: number;
  dustFade?: number;
  dustAge?: number;
}> = ({ f, dustFade = 0, dustAge = 0 }) => {
  const t = (f - HIT) / 60;
  const camX = camX17(f);
  const camZ = camZ17(f);
  const layout = layoutAt(camZ);
  const c = cars17(f);
  const s = slide17(f);
  const moving = 1 - s / SLIDE_TOTAL;
  const senA = anchorLeft(CAM_17, camX, MP4_5B_SEN, c.sen.x, c.sen.z - camZ);
  const proA = anchorLeft(CAM_17, camX, F641_PRO, c.pro.x, c.pro.z - camZ);
  const wheel = (s / TYRE_R) * 57.3;
  // into the gravel: each car's dust starts as it crosses into the trap
  const inGravel = (z: number) =>
    ramp(z, GRAVEL_17.z0 - 1, GRAVEL_17.z0 + 3, Easing.linear);
  // the cars buck as they hit the grass edge and the gravel
  const bump = (z: number) =>
    1.6 * Math.sin(Math.max(0, z - GRAVEL_17.z0) * 2.2) * inGravel(z) * moving;
  return (
    <g>
      <Trackside cam={CAM_17} camX={camX} layout={layout} />
      <GravelTrap
        cam={CAM_17}
        camX={camX}
        z0={GRAVEL_17.z0 - camZ}
        z1={GRAVEL_17.z1 - camZ}
      />
      {/* the skid marks the four locked tyres of each car have left since the hit, across the track and grass */}
      {skids(f, camX, camZ).map((d, i) => (
        <path
          key={i}
          d={d.d}
          fill="none"
          stroke={INK}
          strokeWidth={d.w}
          strokeLinecap="round"
          opacity={0.75}
        />
      ))}
      {/* PRO beyond, then SEN on the near side */}
      <TrailDust
        f={f}
        car="pro"
        half={2.86 / 2}
        camX={camX}
        camZ={camZ}
        extraAge={dustAge}
        fade={dustFade}
      />
      <g transform={squash(proA, F641_PRO, f)}>
        <MangaCar
          car={F641_PRO}
          facing="left"
          at={proA}
          state={{ wheelAngle: wheel, tilt: bump(c.pro.z) }}
        />
      </g>
      <TrailDust
        f={f}
        car="sen"
        half={2.94 / 2}
        camX={camX}
        camZ={camZ}
        extraAge={dustAge}
        fade={dustFade}
      />
      {moving > 0.15 && t > 0.2 ? (
        <path
          d={speedLines({
            x: senA.x + 0.2 * senA.pxPerMetre,
            y: senA.y - 1.0 * senA.pxPerMetre,
            w: 700,
            h: 0.9 * senA.pxPerMetre,
            angle: 180,
            n: 12,
            seed: `s17-${Math.floor(f / 3)}`,
            thickness: 5,
          })}
          fill={INK}
          opacity={0.6 * moving}
        />
      ) : null}
      <g transform={squash(senA, MP4_5B_SEN, f)}>
        <MangaCar
          car={MP4_5B_SEN}
          facing="left"
          at={senA}
          state={{
            wheelAngle: wheel,
            lockFront: 30,
            tilt: -bump(c.sen.z) * 0.8,
          }}
        />
      </g>
      {layout.nearEdge > 1.6 ? (
        <NearKerb cam={CAM_17} camX={camX} edge={layout.nearEdge} />
      ) : null}
    </g>
  );
};

// The impact freeze, frames (as 1989's FREEZE_14).
const FREEZE = 14;

export const Crash: React.FC<PictureProps> = ({ f }) => {
  const shot = shotById("1.7");
  const t = (f - HIT) / 60;
  // The impact frame echoes 1989's (suzuka1989/Crash.tsx), mirrored because the cars now run right to left and the
  // roles are reversed (SEN runs into PRO): the same half-beat freeze on the same-size impact star, the same focus
  // lines, the frame tilted the other way, and the sound effect in the mirrored corner, over the space the cars left.
  const freeze = f - HIT < FREEZE;
  const shake = freeze ? 0 : 12 * Math.exp(-(f - HIT - FREEZE) / 10);
  const sx = shake * Math.sin((f - HIT) * 2.7);
  const sy = shake * Math.cos((f - HIT) * 2.1);
  // the contact: SEN's left front tyre against PRO's right rear tyre, halfway between the two cars' depths
  const camX = camX17(f);
  const c = cars17(f);
  const zC = Z_SEN_17 + 1.06 + (c.sen.z - Z_SEN_17) - camZ17(f);
  const senFrontX = c.sen.x - 2.94 / 2;
  const contact = CAM_17.project({ x: senFrontX - camX, y: 0.34, z: zC });
  const star = ramp(f, HIT, HIT + 8, Easing.out(Easing.cubic));
  const starFade = 1 - ramp(f, HIT + FREEZE + 6, HIT + FREEZE + 30);
  const sfx = ramp(f, HIT, HIT + 6, Easing.out(Easing.back(2.5)));
  const sfxFade = 1 - ramp(f, shot.to - 30, shot.to - 4);
  return (
    <svg viewBox="0 0 1920 1080" width={1920} height={1080}>
      <defs>
        <ToneDefs />
        <InkFilterDef />
      </defs>
      <rect width={1920} height={1080} fill="#fbfaf6" />
      <g filter={inkFilter()}>
        <g
          transform={`translate(${sx} ${sy}) rotate(${freeze ? 3 : 3 * (1 - ramp(f - HIT, FREEZE, FREEZE + 50))} 960 540)`}
        >
          <CrashStage f={f} />
          {freeze ? (
            <path
              d={focusLines(contact.x, contact.y, 240, 130, 5)}
              fill={INK}
            />
          ) : null}
          <Debris
            x={contact.x}
            y={contact.y}
            t={t}
            pxPerMetre={CAM_17.pxPerMetre(zC)}
            colors={["#dc1218", "#f1efea", "#1b1b1e", "#ee3a24"]}
            seed="d17"
          />
          {star * starFade > 0 ? (
            <g opacity={starFade}>
              <ImpactStar
                x={contact.x}
                y={contact.y - 20}
                r={150}
                seed="suzuka90"
                t={star}
              />
            </g>
          ) : null}
        </g>
        {sfx > 0 ? (
          <g
            opacity={sfxFade}
            transform={`translate(${1920 - 330 - 460} 300) scale(${0.6 + 0.4 * sfx})`}
          >
            <Sfx x={0} y={0} size={230} rotate={12}>
              {shot.text[0]}
            </Sfx>
          </g>
        ) : null}
        <rect
          x={0}
          y={0}
          width={1920}
          height={1080}
          fill="none"
          stroke={INK}
          strokeWidth={18}
        />
      </g>
    </svg>
  );
};
