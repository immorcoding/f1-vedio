// Shot 3.6 (bars 70–72): GRO climbs out over the rails beside the burning cell; the FIA doctor (Ian Roberts, from the
// medical car) reaches over the rail and takes his arm, then walks him away, a hand at his back, while a marshal turns
// a dry-powder extinguisher on the cockpit (facts.md, easter egg). 28 秒 comes up on bar 71; the last beat of bar 72
// is black. People from the shared people module (src/kit/figure.tsx, ART-16), no faces; staging in
// escape-staging.ts.
import { GRO_2020 } from "../../../cars";
import type { Camera } from "../../../kit/camera";
import { INK, PAPER } from "../../../kit/colors";
import { FIRE_PALETTES } from "../../../kit/fire";
import { Sfx } from "../../../kit/lettering";
import { ToneDefs } from "../../../kit/tone";
import { cueFrame, ramp, shotById, type PictureProps } from "./common";
import {
  DOCTOR,
  Figure,
  MARSHAL,
  driverOutfit,
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
import { PowderBillow } from "./powder";
import { WRECK_CAM, WreckWorld, heartbeat, zoomCam } from "./Wreck";

// Race suit of 2020 (Haas: black with a grey side band), GRO's helmet; the FIA doctor and the marshal from the cast.
const GRO_KIT: Outfit = driverOutfit(GRO_2020.helmet, "#1f1f23", {
  band: "#8d9099",
  gloves: "#2c2c31",
  boots: "#141416",
});

export const Escape: React.FC<PictureProps> = ({ f, palette }) => {
  const shot = shotById("3.6");
  const t = f - shot.from;
  const black = cueFrame("bahrain2020.black");
  const timeCue = cueFrame("bahrain2020.time");
  if (f >= black) {
    return (
      <svg viewBox="0 0 1920 1080" width={1920} height={1080}>
        <rect width={1920} height={1080} fill={INK} />
      </svg>
    );
  }
  const fire = FIRE_PALETTES[palette];
  const rim = fire.glow ? "#ffb347" : PAPER;
  // a held camera (he walks across the frame, not on the spot), creeping in a little
  const cam: Camera = zoomCam(
    WRECK_CAM,
    { x: CLIMB_X - 0.1, y: 1.0, z: WALK_Z },
    1.18 + 0.05 * ramp(t, 0, black - shot.from),
    { x: 980, y: 600 },
  );
  const { groBehind, groPose, groAt, docPose, docAt } = stage36(t);
  const g = (p: { x: number; z: number }) =>
    cam.project({ x: p.x, y: 0, z: p.z });
  const ppm = (p: { z: number }) => cam.pxPerMetre(p.z);
  // the marshal (on threes, like everyone): the jet leaves his nozzle for the cockpit
  const mPose = marshalPose(Math.floor(t / 3) * 3);
  const mppm = ppm(MARSHAL_AT);
  const mBase = g(MARSHAL_AT);
  const tipF = nozzleOf(mPose, MARSHAL_AIM).tip;
  const nozzle = { x: mBase.x - tipF.x * mppm, y: mBase.y - tipF.y * mppm }; // facing left
  const aim = cam.project(AIM);
  const hb = heartbeat(f);
  const text = ramp(f, timeCue, timeCue + 8);
  // the powder jet: a cone from the nozzle to the cockpit, billowing where it lands, redrawn on threes
  const jx = aim.x - nozzle.x;
  const jy = aim.y - nozzle.y;
  const jl = Math.hypot(jx, jy);
  const nx = -jy / jl;
  const ny = jx / jl;
  const spread = 0.35 * mppm;
  const jet = `M ${nozzle.x + nx * 4} ${nozzle.y + ny * 4} L ${aim.x + nx * spread} ${aim.y + ny * spread} L ${aim.x - nx * spread} ${aim.y - ny * spread} L ${nozzle.x - nx * 4} ${nozzle.y - ny * 4} Z`;
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
  // GRO in two passes while he is on the rails: the parts still behind the guardrail, and the rest in front of it
  const groFront = (["farLeg", "body", "nearLeg", "nearArm"] as BodyPart[]).filter(
    (p) => !groBehind.includes(p),
  );
  const people = [
    { z: groAt.z, node: groFront.length ? figure("gro", groAt, groPose, GRO_KIT, groFront) : null },
    { z: docAt.z, node: figure("doc", docAt, docPose, DOCTOR) },
    {
      z: MARSHAL_AT.z,
      node: figure("marshal", MARSHAL_AT, mPose, MARSHAL, undefined, {
        kind: "extinguisher",
        aim: MARSHAL_AIM,
      }),
    },
  ].sort((a, b) => b.z - a.z);
  return (
    <svg viewBox="0 0 1920 1080" width={1920} height={1080}>
      <defs>
        <ToneDefs prefix="b36" />
      </defs>
      <WreckWorld
        cam={cam}
        f={f}
        palette={palette}
        intensity={1}
        tonePrefix="b36"
        behindRails={
          groBehind.length ? figure("gro-behind", groAt, groPose, GRO_KIT, groBehind) : null
        }
        driver={false}
      />
      {/* deepest first: the doctor at the rail / a step deeper than GRO, GRO, the marshal at the cockpit */}
      {people.map((p) => p.node)}
      <path
        d={jet}
        fill={PAPER}
        stroke={INK}
        strokeWidth={2.5}
        strokeLinejoin="round"
        opacity={0.9}
      />
      <PowderBillow x={aim.x} y={aim.y} ppm={mppm} frame={f} />
      <rect width={1920} height={1080} fill={INK} opacity={0.12 * hb} />
      {text > 0 ? (
        <g
          opacity={text}
          transform={`translate(110 220) scale(${0.8 + 0.2 * text})`}
        >
          <Sfx x={0} y={0} size={210} rotate={-4}>
            {`${FACTS.escapeSeconds} 秒`}
          </Sfx>
        </g>
      ) : null}
    </svg>
  );
};
