// Shot 1.7 (bars 27–28): the crash at Turn 1. The camera stands on the inside of the corner (its kerb in the
// foreground), so the cars run right to left and SEN, on the inside, is the near car. On 27.1 SEN's left front tyre
// hits PRO's right rear tyre: the frame freezes on an impact star with "轰！", debris flies, then the frame shakes out
// and the two cars, locked together, slide off the outside of the corner — away from the camera, across the grass
// and into the gravel trap — throwing up dust, and stop. Staging (world metres) lives in staging.ts and is tested for
// interpenetration (ART-18).
import { Easing } from "remotion";
import {
  carPoint,
  F641_PRO,
  MangaCar,
  MP4_5B_SEN,
  type CarSpec,
} from "../../../cars";
import { pinhole, type Camera } from "../../../kit/camera";
import { INK } from "../../../kit/colors";
import { ImpactStar } from "../../../kit/impact";
import { InkFilterDef, inkFilter } from "../../../kit/ink";
import { Sfx } from "../../../kit/lettering";
import { focusLines, speedLines } from "../../../kit/lines";
import { ToneDefs } from "../../../kit/tone";
import {
  Trackside,
  TRACKSIDE_DEFAULT,
  type TracksideLayout,
} from "../../../scenes/suzuka-1989/trackside";
import { ramp, shotById, type PictureProps } from "./common";
import { Debris, Dust, GravelTrap, NearKerb } from "./effects";
import { cars17, HIT, SLIDE_TOTAL, slide17, Z_SEN_17 } from "./staging";

// The panel's camera: 1.2 m up on the inside of Turn 1, level, f = 1700 px (ART-9).
export const CAM_17: Camera = pinhole({
  f: 1700,
  horizon: 430,
  cx: 960,
  height: 1.2,
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
export const camX17 = (f: number) => -1.6 - 0.78 * slide17(f);

// Everything of the crash panel at song frame f, without the frame border and the sound effect (1.8 reuses it).
export const CrashStage: React.FC<{ f: number; dustFade?: number }> = ({
  f,
  dustFade = 0,
}) => {
  const t = (f - HIT) / 60;
  const camX = camX17(f);
  const c = cars17(f);
  const s = slide17(f);
  const moving = 1 - s / SLIDE_TOTAL;
  const senA = anchorLeft(CAM_17, camX, MP4_5B_SEN, c.sen.x, c.sen.z);
  const proA = anchorLeft(CAM_17, camX, F641_PRO, c.pro.x, c.pro.z);
  const wheel = (s / TYRE_R) * 57.3;
  // into the gravel: each car's dust starts as it crosses into the trap
  const inGravel = (z: number) =>
    ramp(z, GRAVEL_17.z0 - 1, GRAVEL_17.z0 + 3, Easing.linear);
  // the cars buck as they hit the grass edge and the gravel
  const bump = (z: number) =>
    1.6 * Math.sin(Math.max(0, z - GRAVEL_17.z0) * 2.2) * inGravel(z) * moving;
  const dustAt = (
    a: { x: number; y: number; pxPerMetre: number },
    len: number,
  ) => ({
    x: a.x - 0.4 * a.pxPerMetre,
    y: a.y - 0.1 * a.pxPerMetre,
    size: 0.55 * a.pxPerMetre,
    len,
  });
  const dPro = dustAt(proA, 4.2);
  const dSen = dustAt(senA, 4.3);
  return (
    <g>
      <Trackside cam={CAM_17} camX={camX} layout={LAYOUT_17} />
      <GravelTrap
        cam={CAM_17}
        camX={camX}
        z0={GRAVEL_17.z0}
        z1={GRAVEL_17.z1}
      />
      {/* PRO beyond, then SEN on the near side */}
      <Dust
        x={dPro.x}
        y={dPro.y}
        size={dPro.size}
        n={9}
        grow={inGravel(c.pro.z) * Math.min(1, 0.3 + (1 - moving) * 1.2)}
        fade={dustFade}
        dir={1}
        seed="dust-pro"
      />
      <MangaCar
        car={F641_PRO}
        facing="left"
        at={proA}
        state={{
          wheelAngle: wheel,
          lockFront: wheel * 0.2,
          tilt: bump(c.pro.z),
        }}
      />
      <Dust
        x={dSen.x}
        y={dSen.y}
        size={dSen.size}
        n={9}
        grow={inGravel(c.sen.z) * Math.min(1, 0.3 + (1 - moving) * 1.2)}
        fade={dustFade}
        dir={1}
        seed="dust-sen"
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
      <MangaCar
        car={MP4_5B_SEN}
        facing="left"
        at={senA}
        state={{ wheelAngle: wheel, lockFront: 30, tilt: -bump(c.sen.z) * 0.8 }}
      />
      <NearKerb cam={CAM_17} camX={camX} edge={LAYOUT_17.nearEdge} />
    </g>
  );
};

export const Crash: React.FC<PictureProps> = ({ f }) => {
  const shot = shotById("1.7");
  const t = (f - HIT) / 60;
  // the frame freezes for half a beat on the star, then shakes out
  const freeze = f - HIT < 14;
  const shake = freeze ? 0 : 16 * Math.exp(-(f - HIT - 14) / 12);
  const sx = shake * Math.sin((f - HIT) * 2.7);
  const sy = shake * Math.cos((f - HIT) * 2.1);
  // the contact: SEN's left front tyre against PRO's right rear tyre, halfway between the two cars' depths
  const camX = camX17(f);
  const c = cars17(f);
  const zC = Z_SEN_17 + 1.06 + (c.sen.z - Z_SEN_17);
  const senFrontX = c.sen.x - 2.94 / 2;
  const contact = CAM_17.project({ x: senFrontX - camX, y: 0.34, z: zC });
  const star = ramp(f, HIT, HIT + 10, Easing.out(Easing.cubic));
  const starFade = 1 - ramp(f, HIT + 30, HIT + 56);
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
          transform={`translate(${sx} ${sy}) rotate(${freeze ? 3 : 3 * (1 - ramp(t, 0.3, 1.2))} 960 540)`}
        >
          <CrashStage f={f} />
          {freeze ? (
            <path
              d={focusLines(contact.x, contact.y, 280, 130, 5)}
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
                y={contact.y}
                r={200}
                seed="suzuka90"
                t={star}
              />
            </g>
          ) : null}
        </g>
        {sfx > 0 ? (
          <g
            opacity={sfxFade}
            transform={`translate(240 330) scale(${0.6 + 0.4 * sfx})`}
          >
            <Sfx x={0} y={0} size={240} rotate={-10}>
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
