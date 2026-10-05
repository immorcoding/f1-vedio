// Where everyone is in the 27 秒 panel and shot 3.6, frame by frame, in the wreck view's metres (V, wreck-geometry.ts;
// the picture is flipped on screen, so −x in V is screen right). GRO gets out the way drivers do, by the halo (the
// people module's climbOutOfCockpit): both hands on it, he hauls himself up facing the nose, steps out onto the cockpit
// side where it stands on the track side of the torn barrier (its rear, by the roll structure: the barrier crosses the
// cockpit at 51°), turns toward the track, steps down onto the floor's edge under the sidepod and onto the ground, then
// stumbles away from the barrier with planted feet (V +x: back toward the track, screen left). The doctor reaches in
// from the gap and takes his arm once he is out on the side of the cell, then walks a step behind him with a hand at
// his back; the marshal is braced on the track side of the barrier past the nose, spraying the cockpit. Everyone
// stands on the track side of the barrier line (checked by `onTrackSide`). Pure TypeScript, so the picture (Escape.tsx,
// Timeline27.tsx) and the interpenetration check (staging.ts, src/mv/overlap.ts) share it from node.
import { pinhole, type Camera, type WorldPoint } from "../../../kit/camera.ts";
import {
  EXIT_FORWARD,
  EXIT_TURN,
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

export type Facing = "left" | "right";
// In V the cell's nose points −x: GRO faces it (left) in the cockpit and turns to face the track (+x, right) once he
// is crouched on the cockpit side with both hands off the halo (climbOutOfCockpit's EXIT_TURN key).
export const TURN_U = EXIT_TURN;
export const groFacing = (u: number): Facing => (u < TURN_U ? "left" : "right");
const sign = (f: Facing) => (f === "left" ? -1 : 1);

// GRO's hip stands in the cockpit just behind the halo hoop's rear foot (so his legs clear the hoop going out), in
// front of the headrest. World x on the cell's plane.
export const STAND_X = HALO_FOOT.x + 0.1;
export const WALK_Z = CELL_Z - 1.55; // GRO walks away 1.55 m in front of the cell's centre line
// The world x on his walking line that shows where he stood in the cockpit (same screen x in every zoomed copy of the
// wreck camera): his ground point for the climb and the start of the walk.
export const CLIMB_X = (STAND_X * WALK_Z) / CELL_Z;
const IN_Z = CELL_Z - 0.1; // his size while he is in the cockpit (standing on its centre line)
const RIM_Z = CELL_Z - 0.65; // his body's depth out on the cell's near side
const BESIDE_Z = CELL_Z - 0.45; // the ground where his first foot comes down off the car (as drawn: just under its floor)
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
// The climb's geometry in GRO's figure frame for a camera, a scale and the way he faces: everything measured on screen
// from his ground point (where he stood, on the walking line), in metres at that scale.
export const exitGeometry = (
  cam: Camera,
  scaleZ: number,
  facing: Facing = "left",
) => {
  const origin = cam.project({ x: CLIMB_X, y: 0, z: WALK_Z });
  const s = cam.pxPerMetre(scaleZ);
  const k = sign(facing);
  const fig = (p: WorldPoint): V => {
    const q = cam.project(p);
    return v((k * (q.x - origin.x)) / s, (origin.y - q.y) / s);
  };
  const cell = (x: number, y: number) => fig({ x, y, z: CELL_Z });
  // the near foot steps down onto the floor's edge under the near sidepod, ahead of him the way he faces (all three
  // rails are torn open here)
  const sillX = STAND_X + 0.14 * k;
  // the near foot steps out onto the cockpit side's top edge as drawn (the shoulder behind the halo's rear foot)
  const stepX = STAND_X + 0.07;
  // the near foot comes down on the ground just off the car's side, a step on from the sill toward the track, as far
  // out (toward the camera) as a foot on the sill can reach down
  const besideX = sillX + 0.27 * k;
  const g: CockpitExit = {
    floor: cell(STAND_X, COCKPIT_FLOOR).y,
    rim: cell(stepX, cockpitRimAt(stepX)).y,
    step: cell(stepX, 0).x,
    sill: cell(sillX, floorEdgeAt(sillX)),
    beside: fig({ x: besideX * (BESIDE_Z / CELL_Z), y: 0, z: BESIDE_Z }),
    pillar: add(fig(HALO_PILLAR_GRIP), GRIP_PILLAR),
    hoop: add(fig(HALO_HOOP_GRIP), GRIP_HOOP),
  };
  return { origin, s, g, fig };
};
// GRO's pose in the climb at u, through `cam`: facing the nose until TURN_U, then the track (the same keys, read in
// the frame of the way he faces).
export const exitAt = (cam: Camera, u: number) => {
  const scaleZ = exitScaleZ(u);
  const facing = groFacing(u);
  const { s, g } = exitGeometry(cam, scaleZ, facing);
  return { scaleZ, s, g, facing, ...climbOutOfCockpit(u, g) };
};

// The doctor at the gap, a step behind where GRO comes out (on the nose side), then walking a step behind him.
const DOC_START = 1.0; // m behind GRO's ground point, the other way from his walk
const DOC_RAIL_Z = CELL_Z - 1.65; // in front of the marshal's jet, which crosses behind him into the cell
const DOC_WALK_Z = CELL_Z - 1.32; // walking: a step deeper than GRO, a step behind him
const DOC_GAP = 0.62;
const SPEED = 0.7; // m/s walking away
// The marshal on the track side of the barrier past the nose, facing the cockpit (+x in V), braced and spraying into
// it, with room at the gap between him and GRO for the doctor.
const MARSHAL_X = HALO_WORLD.x - 1.3;
export const MARSHAL_AT = { x: MARSHAL_X, z: CELL_Z - 2.9 };
export const MARSHAL_FACING: Facing = "right";
// into the front of the cockpit, clear of where GRO climbs out
export const AIM = { x: HALO_WORLD.x - 0.15, y: 0.8, z: CELL_Z - 0.6 };
const NOZZLE = v(0.58, 1.08); // the marshal's near hand (figure frame)
// which way the nozzle points, figure frame (he faces +x in V)
export const MARSHAL_AIM = v(AIM.x - MARSHAL_AT.x - NOZZLE.x, AIM.y - NOZZLE.y);
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
  const worldX = (fwd: number) => CLIMB_X + fwd; // they walk toward +x in V, back toward the track
  // GRO
  let groPose: Pose;
  let groScaleZ = WALK_Z;
  let layers = ALL_FRONT;
  let holds = { near: false, far: false };
  let groDepth = WALK_Z;
  let groFwd: number; // his ground point, forward of CLIMB_X
  let groFace: Facing = "right";
  let u = 1;
  if (time < climbT) {
    u = PANEL_U + time / EXIT_S;
    const e = exitAt(BASE, u);
    groPose = e.pose;
    groScaleZ = e.scaleZ;
    layers = e.layer;
    holds = e.holds;
    groFace = e.facing;
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
    x: groOrigin.x + sign(groFace) * arm.x * gs,
    y: groOrigin.y - arm.y * gs,
  };
  // the doctor (faces +x, the way they walk off)
  const docOpts: GaitOptions = { stride, lean: 10, armSwing: 12, head: 6 };
  const PH = 0.27; // his steps fall between GRO's
  const catchUp = EXIT_FORWARD - DOC_GAP + DOC_START; // how far he has to come to walk a step behind
  const dd = d + catchUp * smooth(walkT / 1.1) + PH;
  const docFwd = -DOC_START + dd - PH;
  const docRail = { x: worldX(-DOC_START), z: DOC_RAIL_Z };
  const db = BASE.project({ x: docRail.x, y: 0, z: DOC_RAIL_Z });
  const dppm = BASE.pxPerMetre(DOC_RAIL_Z);
  const armAt = v((armScreen.x - db.x) / dppm, (db.y - armScreen.y) / dppm);
  // reaching in toward the cockpit, then (once GRO is out on the side of the cell) holding his arm
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
    groFacing: groFace,
    layers,
    holds,
    docPose,
    docAt,
  };
};
