// Where everyone is in the 27 秒 panel and shot 3.6, frame by frame, in the trackside camera's world metres
// (wreck-geometry.ts). GRO gets out the way drivers do, by the halo (the people module's climbOutOfCockpit): both
// hands on it, he hauls himself up, steps out over the cockpit side through the torn gap in the rails, down onto the
// floor's edge under the sidepod and onto the track, then stumbles away with planted feet. The doctor reaches over the rail and takes
// his arm once he is out on the side of the cell, then walks a step behind him with a hand at his back; the marshal is
// braced, spraying the cockpit. Pure TypeScript, so the picture (Escape.tsx, Timeline27.tsx) and the interpenetration
// check (staging.ts, src/mv/overlap.ts) share it from node.
import { pinhole, type Camera, type WorldPoint } from "../../../kit/camera.ts";
import {
  EXIT_FORWARD,
  STUMBLE,
  climbOutOfCockpit,
  gaitDistance,
  reachTo,
  shiftPose,
  spray,
  stumble,
  walk,
  walkWithHands,
  type BodyPart,
  type CockpitExit,
  type ExitLayer,
  type GaitOptions,
} from "../../../kit/people/motion.ts";
import {
  add,
  lerpV,
  mixPose,
  solve,
  v,
  type Pose,
  type V,
} from "../../../kit/people/skeleton.ts";
import {
  CELL_Z,
  COCKPIT_FLOOR,
  HALO_FOOT,
  HALO_HOOP_GRIP,
  HALO_PILLAR_GRIP,
  HALO_WORLD,
  WRECK_CAM_SPEC,
  floorEdgeAt,
  cockpitRimAt,
} from "./wreck-geometry.ts";

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const smooth = (x: number) => {
  const u = clamp01(x);
  return u * u * (3 - 2 * u);
};
const BASE: Camera = pinhole(WRECK_CAM_SPEC);

// GRO's hip stands in the cockpit just behind the halo hoop's rear foot (so his legs clear the hoop going out), in
// front of the headrest. World x on the cell's plane.
export const STAND_X = HALO_FOOT.x + 0.1;
export const WALK_Z = 12.55; // GRO walks along the rails, 0.45 m in front of them
// The world x on his walking line that shows where he stood in the cockpit (same screen x in every zoomed copy of the
// wreck camera): his ground point for the climb and the start of the walk.
export const CLIMB_X = (STAND_X * WALK_Z) / CELL_Z;
const IN_Z = CELL_Z - 0.1; // his size while he is in the cockpit (standing on its centre line)
const RIM_Z = 13.45; // his body's depth out on the cell's near side
export const EXIT_S = 2.7; // seconds for the whole climb out (u 0..1)
export const PANEL_U = 0.12; // the 27 秒 panel ends with him hauling up (u); 3.6 picks up there
// 3.6: frames until he is down on the track and walks
export const CLIMB_END = Math.round((1 - PANEL_U) * EXIT_S * 60);

// How big he is drawn (the depth whose scale he takes): in the cockpit's centre line while inside, coming forward
// to his walking line as he steps out. His hands and feet are placed in screen space (below), so the change of
// scale never moves a planted foot or a hand on the halo.
export const exitScaleZ = (u: number) =>
  IN_Z + (WALK_Z - IN_Z) * smooth((u - 0.3) / 0.7);
// Where his body really is in depth, for the interpenetration check.
const exitDepth = (u: number) =>
  u < 0.36
    ? IN_Z
    : u < 0.6
      ? IN_Z + (RIM_Z - IN_Z) * smooth((u - 0.36) / 0.24)
      : RIM_Z + (WALK_Z - RIM_Z) * smooth((u - 0.6) / 0.4);

// The hands on the halo: the wrist just behind and above the tube, so the glove closes over it.
const GRIP_HOOP = v(-0.05, 0.05);
const GRIP_PILLAR = v(-0.06, 0.03);
// The climb's geometry in GRO's figure frame for a camera and a scale: everything measured on screen from his ground
// point (where he stood, on the walking line), in metres at that scale. Facing left: forward is −screen x.
export const exitGeometry = (cam: Camera, scaleZ: number) => {
  const origin = cam.project({ x: CLIMB_X, y: 0, z: WALK_Z });
  const s = cam.pxPerMetre(scaleZ);
  const fig = (p: WorldPoint): V => {
    const q = cam.project(p);
    return v((origin.x - q.x) / s, (origin.y - q.y) / s);
  };
  const cell = (x: number, y: number) => fig({ x, y, z: CELL_Z });
  // the near foot steps down onto the floor's edge under the near sidepod (all three rails are torn open here)
  const sillX = STAND_X - 0.14;
  // the near foot steps out onto the cockpit side's top edge as drawn (the shoulder behind the halo's rear foot)
  const stepX = STAND_X + 0.07;
  const g: CockpitExit = {
    floor: cell(STAND_X, COCKPIT_FLOOR).y,
    rim: cell(stepX, cockpitRimAt(stepX)).y,
    step: cell(stepX, 0).x,
    sill: cell(sillX, floorEdgeAt(sillX)),
    pillar: add(fig(HALO_PILLAR_GRIP), GRIP_PILLAR),
    hoop: add(fig(HALO_HOOP_GRIP), GRIP_HOOP),
  };
  return { origin, s, g, fig };
};
// GRO's pose in the climb at u, through `cam`.
export const exitAt = (cam: Camera, u: number) => {
  const scaleZ = exitScaleZ(u);
  const { s, g } = exitGeometry(cam, scaleZ);
  return { scaleZ, s, g, ...climbOutOfCockpit(u, g) };
};

// The doctor at the rail, a step behind where GRO comes out, then walking a step behind him.
const DOC_START = 1.0; // m behind (to the right of) GRO's ground point
const DOC_RAIL_Z = 12.45; // in front of the marshal's jet, which crosses behind him into the cell
const DOC_WALK_Z = 12.78; // walking: a step deeper than GRO, a step behind him
const DOC_GAP = 0.62;
const SPEED = 0.7; // m/s walking away
// The marshal at the back of the cell, facing it (left), braced and spraying into it: as far right as he can stand
// and still be seen past the torn-off rear on the track (REAR_SPAN starts 1.31 m along at z 10.4, i.e. 1.56 m on his
// line of sight at z 12.35), so the doctor has room at the rail between him and GRO.
const MARSHAL_X = HALO_WORLD.x + 2.75;
export const MARSHAL_AT = { x: MARSHAL_X, z: 12.35 };
// into the back of the cockpit and the fire at the break, clear of where GRO climbs out
export const AIM = { x: MARSHAL_X - 0.95, y: 0.8, z: 13.4 };
const NOZZLE = v(0.58, 1.08); // the marshal's near hand (figure frame)
// which way the nozzle points, figure frame (he faces left, so forward is −x in the world)
export const MARSHAL_AIM = v(MARSHAL_AT.x - AIM.x - NOZZLE.x, AIM.y - NOZZLE.y);
export const marshalPose = (t: number): Pose => spray(t / 60, NOZZLE);

export type GroLayers = Record<BodyPart, ExitLayer>;
const ALL_FRONT: GroLayers = {
  farLeg: "front",
  body: "front",
  nearLeg: "front",
  nearArm: "front",
};

// t = frames into shot 3.6
export const stage36 = (t: number) => {
  const step = Math.floor(t / 3) * 3; // poses and positions held together on threes
  const time = step / 60;
  const climbT = (1 - PANEL_U) * EXIT_S;
  const walkT = Math.max(0, time - climbT);
  const stride = STUMBLE.stride ?? 0.5;
  const d = gaitDistance(walkT, SPEED, { stride, uneven: 0.4 });
  const worldX = (fwd: number) => CLIMB_X - fwd; // they walk left, toward −x
  // GRO
  let groPose: Pose;
  let groScaleZ = WALK_Z;
  let layers = ALL_FRONT;
  let holds = { near: false, far: false };
  let groDepth = WALK_Z;
  let groFwd: number; // his ground point, forward of CLIMB_X
  let u = 1;
  if (time < climbT) {
    u = PANEL_U + time / EXIT_S;
    const e = exitAt(BASE, u);
    groPose = e.pose;
    groScaleZ = e.scaleZ;
    layers = e.layer;
    holds = e.holds;
    groDepth = exitDepth(u);
    groFwd = 0;
  } else {
    groPose = stumble(d);
    groFwd = EXIT_FORWARD + d;
  }
  const groAt = { x: worldX(groFwd), z: WALK_Z };
  // GRO's near upper arm on screen (base camera), for the doctor's hand
  const groOrigin = BASE.project({ x: groAt.x, y: 0, z: WALK_Z });
  const gs = BASE.pxPerMetre(groScaleZ);
  const j = solve(groPose).arms.near;
  const arm = lerpV(j.shoulder, j.elbow, 0.55);
  const armScreen = {
    x: groOrigin.x - arm.x * gs,
    y: groOrigin.y - arm.y * gs,
  };
  // the doctor
  const docOpts: GaitOptions = { stride, lean: 10, armSwing: 12, head: 6 };
  const PH = 0.27; // his steps fall between GRO's
  const catchUp = EXIT_FORWARD - DOC_GAP + DOC_START; // how far he has to come to walk a step behind
  const dd = d + catchUp * smooth(walkT / 1.1) + PH;
  const docFwd = -DOC_START + dd - PH;
  const docRail = { x: worldX(-DOC_START), z: DOC_RAIL_Z };
  const db = BASE.project({ x: docRail.x, y: 0, z: DOC_RAIL_Z });
  const dppm = BASE.pxPerMetre(DOC_RAIL_Z);
  const armAt = v((db.x - armScreen.x) / dppm, (db.y - armScreen.y) / dppm);
  // reaching over the rail toward the cockpit, then (once GRO is out on the side of the cell) holding his arm
  const ready = reachTo(v(0.5, 1.05), { grip: "open", t: time });
  const holding = reachTo(armAt, { grip: "hold", t: time });
  const take = smooth((u - 0.46) / 0.1);
  const atRail =
    take <= 0 ? ready : take >= 1 ? holding : mixPose(ready, holding, take);
  // walking behind, the near hand on his back once it reaches
  const groHip = groFwd + groPose.hip.x;
  const back = v(groHip - 0.15 - docFwd, 1.2);
  const onBack = smooth((0.8 - back.x) / 0.2);
  const walking = mixPose(
    walk(dd, docOpts),
    walkWithHands(
      dd,
      { near: { hand: back, grip: "flat", wrist: 25 } },
      docOpts,
    ),
    onBack,
  );
  const w = smooth((time - climbT * 0.85) / (climbT * 0.15 + 0.3));
  const docPose =
    w <= 0
      ? atRail
      : w >= 1
        ? walking
        : mixPose(shiftPose(atRail, -DOC_START - docFwd), walking, w);
  const cross = smooth(walkT / 1.1);
  const docAt = {
    x: worldX(docFwd),
    z: DOC_RAIL_Z + (DOC_WALK_Z - DOC_RAIL_Z) * cross,
  };
  return {
    u,
    groPose,
    groAt,
    groScaleZ,
    groDepth,
    layers,
    holds,
    docPose,
    docAt,
  };
};
