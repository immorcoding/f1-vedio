// Shot 3.6 (bars 70–73): GRO hauls himself out of the burning cell by the halo, steps out over the cockpit side through
// the gap torn in the rails and down onto the floor's edge under the sidepod; the FIA doctor (Ian Roberts, from the medical car) reaches over the
// rail and takes his arm, then walks him away, a hand at his back, while a marshal turns a dry-powder extinguisher on
// the cockpit (facts.md, easter egg). 27s comes up on bar 71; from 72.1 the
// scorched halo closes the part (HaloFinale.tsx). People from the shared people module (src/kit/figure.tsx, ART-16), no faces; staging in
// escape-staging.ts.
import type { Camera } from "../../../kit/camera";
import { INK, PAPER } from "../../../kit/colors";
import { Fire, FIRE_PALETTES } from "../../../kit/fire";
import { CAPTION_FONT } from "../../../kit/lettering";
import { ToneDefs } from "../../../kit/tone";
import { at, frameAt } from "../../timing.ts";
import { cueFrame, ramp, shotById, type PictureProps } from "./common";
import {
  DOCTOR,
  Figure,
  MARSHAL,
  nozzleOf,
  type BodyPart,
  type Held,
  type Outfit,
  type Pose,
} from "../../../kit/figure";
import { FACTS } from "./shots.ts";
import {
  AIM,
  CLIMB_X,
  MARSHAL_AIM,
  MARSHAL_AT,
  MARSHAL_FACING,
  WALK_Z,
  marshalPose,
  stage36,
} from "./escape-staging.ts";
import { useGroExit } from "./GroExit";
import { Haze } from "./haze";
import { PowderJet } from "./powder";
import { DefocusFilter } from "./scorch";
import {
  Flip,
  WRECK_CAM,
  WreckWorld,
  heartbeat,
  heatZone,
  zoomCam,
  type NearFire,
} from "./Wreck";
import {
  CELL_FROM,
  CELL_TO,
  CELL_Z,
  FIRES,
  REAR_SPAN,
  REAR_Z,
} from "./wreck-geometry.ts";

// The ground the people cover over the whole shot (GRO from the cockpit back toward the track, the doctor behind
// him): sampled once, in the wreck view's metres, so the haze's falloff reaches all of it.
const PATH_X = (() => {
  const shot = shotById("3.6");
  const end = cueFrame("bahrain2020.halo") - shot.from;
  let max = -Infinity;
  for (let t = 0; t <= end; t += 6) {
    const s = stage36(t);
    max = Math.max(max, s.groAt.x, s.docAt.x);
  }
  return max;
})();
// The fires of 3.6 (user reviews 2026-10-05). While he climbs out they are low: the big fire behind the cell only a
// little taller than the ones in front (about 2.4 m, not a wall over everything), the low fire along the rails
// about 1.3 m, and a fire right in front of the cockpit's side, where he climbs out and over it, ~1.7 m: his body is
// in it, his helmet and shoulders read over and through it, and it never covers him as he walks out. Once he is
// clear (71.1, in front of the rails, everything of him drawn over the fire) the fire takes the car: over 71.1–71.4
// it grows round the cell until only the top of the halo and the roll hoop show: he got out just in time.
const BACK_FIRE = 0.32;
// the fire in the gap (lower left) stands back toward the barrier, clear of GRO's feet on his way out (70.4–72.1)
const GAP_FIRE_BACK = 0.8;
const FRONT_FIRE = 0.8;
const COVER_FIRE = { x: CLIMB_X - 0.3, z: WALK_Z + 0.75, w: 2.2, h: 1.7 };
// the fire over the cell once he is out: across the whole cell, just in front of it
const ENGULF = {
  x: (CELL_FROM + CELL_TO) / 2,
  z: CELL_Z - 0.8,
  w: CELL_TO - CELL_FROM + 1.0,
  h: 1.75,
};
// how far the wreck recedes behind GRO (WreckWorld `recede`)
const RECEDE = 0.75;

// the side the fire lights someone from, in the unflipped picture
const rimSideAt = (x: number) => (x < FIRES.back.x ? "right" : "left");

// The heat haze round the fire (haze.tsx `falloff`): full over the fire and the cell, fading smoothly with distance
// over GRO's whole way out, the doctor and the marshal, so everyone near the fire shares one focus (user review
// 2026-10-04: GRO stepping out of the haze onto a crisp track looked abrupt).
const escapeFalloff = (cam: Camera) => {
  const fire = cam.project({ x: FIRES.back.x, y: 1.6, z: FIRES.back.z });
  const zone = heatZone(cam);
  const left = Math.min(
    zone.x,
    cam.project({ x: MARSHAL_AT.x - 0.8, y: 0, z: MARSHAL_AT.z }).x,
  );
  const right = Math.max(
    zone.x + zone.w,
    cam.project({ x: PATH_X + 1.2, y: 0, z: WALK_Z }).x,
    cam.project({ x: REAR_SPAN.to + 1.0, y: 0, z: REAR_Z }).x,
  );
  // the far end of his walk sits on the slope (~0.4), the fire's top in the full haze
  const rx = Math.max(fire.x - left, right - fire.x) / 0.82;
  const ry = Math.max(fire.y - zone.y, zone.y + zone.h - fire.y) / 0.62;
  return { cx: fire.x, cy: fire.y, rx, ry };
};

// Shot 3.6's camera at song frame f: held (he walks across the frame, not on the spot), creeping in a little: the
// cockpit he climbs out of right of centre on screen, the way he walks out to the left (the picture is flipped: in
// the camera's own picture the cockpit is left of centre and he walks right).
export const escapeCam = (f: number): Camera => {
  const shot = shotById("3.6");
  return zoomCam(
    WRECK_CAM,
    { x: CLIMB_X + 0.25, y: 1.0, z: WALK_Z },
    // the people at the size they had at 1.18 of the earlier camera (216 px/m on GRO's line); the creep keeps the
    // pace it had when 3.6 cut to black on 72.4
    (216 / WRECK_CAM.pxPerMetre(WALK_Z)) *
      (1 +
        (0.05 / 1.18) * ramp(f - shot.from, 0, frameAt(at(72, 4)) - shot.from)),
    { x: 1920 - 1090, y: 600 },
  );
};

export const Escape: React.FC<PictureProps> = ({ f, palette }) => {
  const shot = shotById("3.6");
  const t = f - shot.from;
  const black = cueFrame("bahrain2020.black");
  const timeCue = cueFrame("bahrain2020.time");
  const fire = FIRE_PALETTES[palette];
  const rim = fire.glow ? "#ffb347" : PAPER;
  const cam = escapeCam(f);
  const {
    groPose,
    groAt,
    groScaleZ,
    groFacing,
    layers,
    holds,
    docPose,
    docAt,
  } = stage36(t);
  const g = (p: { x: number; z: number }) =>
    cam.project({ x: p.x, y: 0, z: p.z });
  const ppm = (p: { z: number }) => cam.pxPerMetre(p.z);
  // GRO: in the cockpit, out over its side, in front of the rails (GroExit.tsx)
  const gro = useGroExit({
    at: g(groAt),
    ppm: cam.pxPerMetre(groScaleZ),
    pose: groPose,
    layers,
    holds,
    rim,
    facing: groFacing,
    rimSide: rimSideAt(groAt.x),
  });
  if (f >= black) {
    return (
      <svg viewBox="0 0 1920 1080" width={1920} height={1080}>
        <rect width={1920} height={1080} fill={INK} />
      </svg>
    );
  }
  // the marshal (on threes, like everyone): the jet leaves his nozzle for the cockpit
  const mPose = marshalPose(Math.floor(t / 3) * 3);
  const mppm = ppm(MARSHAL_AT);
  const mBase = g(MARSHAL_AT);
  const tipF = nozzleOf(mPose, MARSHAL_AIM).tip;
  const nozzle = {
    x: mBase.x + (MARSHAL_FACING === "right" ? 1 : -1) * tipF.x * mppm,
    y: mBase.y - tipF.y * mppm,
  };
  const aim = cam.project(AIM);
  const hb = heartbeat(f);
  const text = ramp(f, timeCue, timeCue + 8);
  // GRO comes out of the fire (user review 2026-10-05, as in the real footage): the low fire along the rails in front
  // of the cell burns high, between the camera and the cockpit, so while he hauls himself out and over the side he
  // is behind it, hidden but for glimpses between the tongues; as he steps down in front of the rails he walks out
  // of it, his legs first (~70.4), all of him by 71.1, as "27s" lands. The wreck recedes behind him.
  const fireLevel = 1;
  // the fire taking the car once he is clear of it
  const take = ramp(f, timeCue, frameAt(at(71, 4)));
  const frontFire = FRONT_FIRE * (1 + 0.5 * take);
  const backFire = BACK_FIRE * (1 + 0.6 * take);
  // the fire over the car, behind GRO (WreckWorld `subjectOverFires`)
  const nearFires: NearFire[] = [
    { ...ENGULF, h: ENGULF.h * take, seed: "engulf", tongues: 9, phase: 11 },
  ];
  // the near fire in front of the cockpit, in front of GRO: it partly covers him in the cockpit and as he walks out
  const cover = (() => {
    const base = cam.project({ x: COVER_FIRE.x, y: 0, z: COVER_FIRE.z });
    const s = cam.pxPerMetre(COVER_FIRE.z);
    return (
      <Fire
        key="cover"
        x={base.x}
        y={base.y}
        w={COVER_FIRE.w * s}
        h={COVER_FIRE.h * s}
        frame={f + 23}
        seed="wreck-cover"
        tongues={5}
        embers={5}
        palette={{ ...fire, glow: null }}
        intensity={fireLevel}
        smoke={false}
      />
    );
  })();
  // the doctor, a step off GRO's plane, is out of focus (depth of field, below); GRO and the marshal stand in the
  // heat haze with a light ripple, GRO's the lightest so he is the sharp one (haze.tsx)
  const calmAt = (at: { x: number; z: number }, k: number, s: number) => {
    const base = g(at);
    return { cx: base.x, cy: base.y - 0.95 * s, rx: 0.55 * s * k, ry: 1.0 * s };
  };
  const calm = [
    ...(layers.body === "front"
      ? [calmAt(groAt, 1.1, cam.pxPerMetre(groScaleZ))]
      : []),
    calmAt(MARSHAL_AT, 1, mppm),
  ];
  const figure = (
    key: string,
    at: { x: number; z: number },
    pose: Pose,
    outfit: Outfit,
    parts?: readonly BodyPart[],
    held?: Held,
  ) => (
    <Figure
      key={key}
      at={g(at)}
      pxPerMetre={ppm(at)}
      pose={pose}
      outfit={outfit}
      facing="right"
      rim={rim}
      rimSide={rimSideAt(at.x)}
      parts={parts}
      held={held}
    />
  );
  // the marshal, like the doctor, a little out of focus: GRO is the only one sharp (user review 2026-10-05)
  const marshal = (
    <g key="marshal" filter="url(#b36-defocus)">
      {figure("marshal", MARSHAL_AT, mPose, MARSHAL, undefined, {
        kind: "extinguisher",
        aim: MARSHAL_AIM,
      })}
    </g>
  );
  // in front of the wreck, back to front (the user's order, review 2026-10-05): GRO, the near fire in front of the
  // cockpit, the doctor, then the marshal nearest the camera; all are in front of the jet where they stand (it
  // crosses behind them into the cell)
  const people = [
    gro.front,
    cover,
    <g key="doc" filter="url(#b36-defocus)">
      {figure("doc", docAt, docPose, DOCTOR)}
    </g>,
    marshal,
  ];
  return (
    <svg viewBox="0 0 1920 1080" width={1920} height={1080}>
      <defs>
        <ToneDefs prefix="b36" />
        {/* the doctor and the marshal gently out of focus (depth of field): GRO is the one in focus; kept light so
            it looks like a lens, not a smear (user review 2026-10-05: "don't blur too much") */}
        <DefocusFilter id="b36-defocus" blur={1.1} dim={0.98} />
      </defs>
      <Flip>
        <Haze
          frame={f}
          zone={heatZone(cam)}
          falloff={escapeFalloff(cam)}
          calm={calm}
          calmHaze={{ disp: 5, blur: 0.5 }}
        >
          <WreckWorld
            cam={cam}
            f={f}
            palette={palette}
            intensity={fireLevel}
            frontFire={frontFire}
            tonePrefix="b36"
            cockpit={gro.cockpit}
            behindRails={gro.behindRails}
            driver={false}
            recede={RECEDE}
            nearFires={nearFires}
            backFire={backFire}
            gapFireBack={GAP_FIRE_BACK}
            debrisUnderFire
            subjectOverFires
          />
          {/* the marshal's powder jet into the front of the cockpit, then everyone, deepest first (it crosses
              behind GRO and the doctor into the cell) */}
          <g filter="url(#b36-defocus)">
          <PowderJet
            from={nozzle}
            to={aim}
            ppm={mppm}
            frame={f}
            seed="b36-powder"
          />
          </g>
          {people}
        </Haze>
      </Flip>
      <rect width={1920} height={1080} fill={INK} opacity={0.12 * hb} />
      {text > 0 ? (
        <g
          opacity={text}
          transform={`translate(110 220) scale(${0.8 + 0.2 * text})`}
        >
          {/* the time in Titillium with a lowercase s, as in 3.5's panels (ART-6), ink on a paper halo */}
          <text
            x={0}
            y={0}
            fontFamily={CAPTION_FONT}
            fontWeight={700}
            fontSize={210}
            fill={INK}
            stroke={PAPER}
            strokeWidth={26}
            strokeLinejoin="round"
            paintOrder="stroke"
            transform="rotate(-4)"
          >
            {`${FACTS.escapeSeconds}s`}
          </text>
        </g>
      ) : null}
    </svg>
  );
};
