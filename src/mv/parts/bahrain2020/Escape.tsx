// Shot 3.6 (bars 70–73): GRO hauls himself out of the burning cell by the halo, steps out over the cockpit side through
// the gap torn in the rails and down onto the floor's edge under the sidepod; the FIA doctor (Ian Roberts, from the medical car) reaches over the
// rail and takes his arm, then walks him away, a hand at his back, while a marshal turns a dry-powder extinguisher on
// the cockpit (facts.md, easter egg). 27s comes up on bar 71; from 72.1 the
// scorched halo closes the part (HaloFinale.tsx). People from the shared people module (src/kit/figure.tsx, ART-16), no faces; staging in
// escape-staging.ts.
import type { Camera } from "../../../kit/camera";
import { INK, PAPER } from "../../../kit/colors";
import { FIRE_PALETTES } from "../../../kit/fire";
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
  WALK_Z,
  marshalPose,
  stage36,
} from "./escape-staging.ts";
import { useGroExit } from "./GroExit";
import { Haze } from "./haze";
import { PowderJet } from "./powder";
import { WRECK_CAM, WreckWorld, heartbeat, heatZone, zoomCam } from "./Wreck";
import { CELL_FROM, CELL_Z, REAR_SPAN, REAR_Z } from "./wreck-geometry.ts";

// The ground the people cover over the whole shot (GRO from the cockpit out onto the track, the doctor beside him):
// sampled once, in world metres, so the haze's falloff reaches all of it.
const PATH_X = (() => {
  const shot = shotById("3.6");
  const end = cueFrame("bahrain2020.halo") - shot.from;
  let min = Infinity;
  for (let t = 0; t <= end; t += 6) {
    const s = stage36(t);
    min = Math.min(min, s.groAt.x, s.docAt.x);
  }
  return min;
})();

// The heat haze round the fire (haze.tsx `falloff`): full over the fire and the cell, fading smoothly with distance
// over GRO's whole way out, the doctor and the marshal, so everyone near the fire shares one focus (user review
// 2026-10-04: GRO stepping out of the haze onto a crisp track looked abrupt).
const escapeFalloff = (cam: Camera) => {
  const fire = cam.project({ x: CELL_FROM + 2.2, y: 1.6, z: CELL_Z + 0.5 });
  const zone = heatZone(cam);
  const left = cam.project({ x: PATH_X - 1.2, y: 0, z: WALK_Z }).x;
  const right = Math.max(
    zone.x + zone.w,
    cam.project({ x: REAR_SPAN.to + 1.0, y: 0, z: REAR_Z }).x,
  );
  // the far end of his walk sits on the slope (~0.4), the fire's top in the full haze
  const rx = Math.max(fire.x - left, right - fire.x) / 0.82;
  const ry = Math.max(fire.y - zone.y, zone.y + zone.h - fire.y) / 0.62;
  return { cx: fire.x, cy: fire.y, rx, ry };
};

export const Escape: React.FC<PictureProps> = ({ f, palette }) => {
  const shot = shotById("3.6");
  const t = f - shot.from;
  const black = cueFrame("bahrain2020.black");
  const timeCue = cueFrame("bahrain2020.time");
  const fire = FIRE_PALETTES[palette];
  const rim = fire.glow ? "#ffb347" : PAPER;
  // a held camera (he walks across the frame, not on the spot), creeping in a little: the cockpit he climbs out of
  // right of centre, the way he walks out to the left
  const cam: Camera = zoomCam(
    WRECK_CAM,
    { x: CLIMB_X - 0.25, y: 1.0, z: WALK_Z },
    // (the creep keeps the pace it had when 3.6 cut to black on 72.4)
    1.18 + 0.05 * ramp(t, 0, frameAt(at(72, 4)) - shot.from),
    { x: 1090, y: 600 }, // the torn-off rear mostly out of frame on the right (user review 2026-10-04)
  );
  const { groPose, groAt, groScaleZ, layers, holds, docPose, docAt } =
    stage36(t);
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
  const nozzle = { x: mBase.x - tipF.x * mppm, y: mBase.y - tipF.y * mppm }; // facing left
  const aim = cam.project(AIM);
  const hb = heartbeat(f);
  const text = ramp(f, timeCue, timeCue + 8);
  // everyone at the wreck stands in its heat haze with a lighter ripple, so they still read (haze.tsx)
  const calmAt = (at: { x: number; z: number }, k: number, s: number) => {
    const base = g(at);
    return { cx: base.x, cy: base.y - 0.95 * s, rx: 0.55 * s * k, ry: 1.0 * s };
  };
  const calm = [
    calmAt(groAt, 1.1, cam.pxPerMetre(groScaleZ)),
    calmAt(docAt, 1, ppm(docAt)),
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
      facing="left"
      rim={rim}
      rimSide="right"
      parts={parts}
      held={held}
    />
  );
  const marshal = figure("marshal", MARSHAL_AT, mPose, MARSHAL, undefined, {
    kind: "extinguisher",
    aim: MARSHAL_AIM,
  });
  // GRO and the doctor, deepest first; both are in front of the jet where they stand (it crosses behind them into
  // the cell), and neither overlaps the marshal
  const people = [
    { z: groAt.z, node: gro.front },
    { z: docAt.z, node: figure("doc", docAt, docPose, DOCTOR) },
  ].sort((a, b) => b.z - a.z);
  return (
    <svg viewBox="0 0 1920 1080" width={1920} height={1080}>
      <defs>
        <ToneDefs prefix="b36" />
      </defs>
      <Haze
        frame={f}
        zone={heatZone(cam)}
        falloff={escapeFalloff(cam)}
        calm={calm}
        calmHaze={{ disp: 8, blur: 1.0 }}
      >
        <WreckWorld
          cam={cam}
          f={f}
          palette={palette}
          intensity={1}
          tonePrefix="b36"
          cockpit={gro.cockpit}
          behindRails={gro.behindRails}
          driver={false}
        />
        {/* the marshal, his powder jet into the back of the cockpit, then GRO and the doctor in front of it */}
        {marshal}
        <PowderJet
          from={nozzle}
          to={aim}
          ppm={mppm}
          frame={f}
          seed="b36-powder"
        />
        {people.map((p) => p.node)}
      </Haze>
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
