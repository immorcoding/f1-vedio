// Where everyone stands in shot 3.6, frame by frame, in the trackside camera's world metres (wreck-geometry.ts): GRO
// over the rails — hauled up, astride the top rail, stepping down — and stumbling away with planted feet; the doctor
// reaching over the rail to hold his arm, then walking a step behind him with a hand at his back; the marshal braced,
// spraying the cockpit. The poses come from the shared people module (src/kit/people, pure TypeScript), so the picture
// (Escape.tsx) and the interpenetration check (staging.ts, src/mv/overlap.ts) share this from node.
import {
  assistedEscape,
  spray,
  type BodyPart,
} from "../../../kit/people/motion.ts";
import { v, type Pose } from "../../../kit/people/skeleton.ts";
import { BARRIER_Z, HALO_WORLD } from "./wreck-geometry.ts";

const RAIL_TOP = 1.29; // the top rail's upper edge (night.tsx RAILS)

export const CLIMB_X = HALO_WORLD.x - 0.2;
const CLIMB_S = 1.6; // seconds over the rail
const DELAY_S = 0.1; // the shot opens with him already reaching for the top rail
export const OVER = Math.round((DELAY_S + CLIMB_S * 0.5) * 60); // frames until he is astride the top rail
export const CLIMB_END = Math.round((DELAY_S + CLIMB_S) * 60); // frames until he is down on the track side and walks
export const CLIMB_BEHIND_Z = 13.3; // GRO behind the rails, on the cell's side
export const WALK_Z = 12.55; // GRO walks along the rails, 0.45 m in front of them
const DOC_RAIL_Z = 12.7; // the doctor at the rail, reaching over
const DOC_WALK_Z = 12.78; // walking: a step deeper than GRO, a step behind him

// The marshal at the cockpit's open side, facing it (left), braced and spraying into it.
export const MARSHAL_AT = { x: CLIMB_X + 2.5, z: 12.35 };
export const AIM = { x: CLIMB_X + 1.25, y: 0.75, z: 13.4 }; // into the cockpit, beside where GRO came out
const NOZZLE = v(0.58, 1.08); // the marshal's near hand (figure frame)
// which way the nozzle points, figure frame (he faces left, so forward is −x in the world)
export const MARSHAL_AIM = v(MARSHAL_AT.x - AIM.x - NOZZLE.x, AIM.y - NOZZLE.y);
export const marshalPose = (t: number): Pose => spray(t / 60, NOZZLE);

// world x of a ground point `fwd` metres along the walk (they walk left, toward −x)
const worldX = (fwd: number) => CLIMB_X - fwd;

// t = frames into the shot
export const stage36 = (t: number) => {
  const step = Math.floor(t / 3) * 3; // poses and positions held together on threes
  const e = assistedEscape(step / 60 - DELAY_S, {
    climb: CLIMB_S,
    top: RAIL_TOP,
  });
  // GRO: 0 behind the rails → 0.5 astride them → 1 walking in front of them
  const c = e.gro.cross;
  const groZ =
    c < 0.5
      ? CLIMB_BEHIND_Z + (BARRIER_Z - CLIMB_BEHIND_Z) * (c / 0.5)
      : BARRIER_Z + (WALK_Z - BARRIER_Z) * ((c - 0.5) / 0.5);
  const groAt = { x: worldX(e.gro.x), z: groZ };
  const docAt = {
    x: worldX(e.doc.x),
    z: DOC_RAIL_Z + (DOC_WALK_Z - DOC_RAIL_Z) * e.doc.cross,
  };
  // GRO's parts drawn behind the guardrail this frame (the rest in front of it)
  const groBehind: BodyPart[] = e.gro.behind;
  return {
    behind: groBehind.length === 4,
    groBehind,
    groPose: e.gro.pose,
    groAt,
    docPose: e.doc.pose,
    docAt,
  };
};
