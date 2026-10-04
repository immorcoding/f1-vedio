// People-Motion: the people module in motion (ART-16, MOT-5), nine cells looping — walk, helped over a guardrail and
// away, spraying, fist pump and jump on the beat, watching, high five into a hug, wave and head-back cheer, pushing.
// The ground in each cell has ticks every 0.5 m fixed to the world, so a sliding foot shows against them.
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { INK, PAPER } from "../kit/colors";
import { CAPTION_FONT } from "../kit/lettering";
import {
  DOCTOR,
  FERRARI_MECHANIC,
  Figure,
  MARSHAL,
  armsFolded,
  armsUp,
  assistedEscape,
  fistPump,
  handOnHead,
  headBack,
  highFive,
  hug,
  HUG_GAP,
  jump,
  nozzleOf,
  push,
  spray,
  walk,
  wave,
  type BodyPart,
  type Held,
  type Outfit,
  type Pose,
} from "../kit/figure";
import { SECONDS_PER_BEAT } from "../mv/timing";
import { POST_TOP, RAILS } from "../mv/parts/bahrain2020/rails";
import { FAN_LIGHT, FAN_RED, GROSJEAN, SENNA } from "./PeopleSheet";

export const PEOPLE_MOTION_FRAMES = 480;
const FPS = 60;
const W = 640;
const H = 360;
// the triple guardrail of Bahrain 2020: rail bottom and top heights, m (src/mv/parts/bahrain2020/rails.ts)
const TOP = RAILS[2][1];

type Person = {
  x: number; // ground point, m from the cell's world origin
  depth?: number; // 0 = on the ground line; deeper people stand higher up the cell and are drawn first
  pose: Pose;
  outfit: Outfit;
  facing: "left" | "right";
  held?: Held;
  parts?: readonly BodyPart[];
};

const Cell: React.FC<{
  i: number;
  title: string;
  s: number;
  people: Person[];
  camX?: number; // world x at the cell centre
  between?: React.ReactNode; // drawn after people with depth > 0.5 (a rail)
  under?: React.ReactNode;
}> = ({ i, title, s, people, camX = 0, between, under }) => {
  const ox = (i % 3) * W;
  const oy = Math.floor(i / 3) * H;
  const base = H - 46;
  const sx = (x: number) => W / 2 + (x - camX) * s;
  const ticks = [];
  for (let x = Math.floor(camX - 4); x <= camX + 4; x += 0.5) ticks.push(x);
  const fig = (p: Person, k: number) => (
    <Figure
      key={k}
      at={{ x: sx(p.x), y: base - (p.depth ?? 0) * 26 }}
      pxPerMetre={s}
      pose={p.pose}
      outfit={p.outfit}
      facing={p.facing}
      held={p.held}
      parts={p.parts}
    />
  );
  const sorted = people.map((p, k) => ({ p, k })).sort((a, b) => (b.p.depth ?? 0) - (a.p.depth ?? 0));
  return (
    <svg x={ox} y={oy} width={W} height={H} overflow="hidden">
      <rect width={W} height={H} fill={PAPER} />
      <line x1={0} x2={W} y1={base} y2={base} stroke={INK} strokeWidth={1.5} opacity={0.5} />
      {ticks.map((x) => (
        <line key={x} x1={sx(x)} x2={sx(x)} y1={base} y2={base + (Math.round(x) === x ? 12 : 6)} stroke={INK} strokeWidth={1.5} opacity={0.5} />
      ))}
      {under}
      {sorted.filter(({ p }) => (p.depth ?? 0) > 0.5).map(({ p, k }) => fig(p, k))}
      {between}
      {sorted.filter(({ p }) => (p.depth ?? 0) <= 0.5).map(({ p, k }) => fig(p, k))}
      <text x={12} y={28} fontFamily={CAPTION_FONT} fontSize={22} fill={INK}>
        {title}
      </text>
      <rect width={W} height={H} fill="none" stroke={INK} strokeWidth={3} />
    </svg>
  );
};

const frac = (x: number) => x - Math.floor(x);

export const PeopleMotion: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const beat = t / SECONDS_PER_BEAT;

  // 1 walk: four gait cycles across the cell, then round again (a whole number of cycles, so the pose wraps too)
  const L = 2 * 0.72;
  const dWalk = frac((1.35 * t) / (4 * L)) * 4 * L;

  // 2 helped over the rail and away (6 s, looping); the camera holds
  const te = t % 6;
  const esc = assistedEscape(te - 0.3, { top: TOP });
  const groDepth = 1 - esc.gro.cross;
  const docDepth = 0.2 + 0.18 * esc.doc.cross;
  const groBehind = esc.gro.behind;
  const groFront = (["farLeg", "body", "nearLeg", "nearArm"] as BodyPart[]).filter((p) => !groBehind.includes(p));
  const railY = (H - 46) - 0.5 * 26;
  const s2 = 92;
  const rail = (
    <g>
      {[-3, -1, 1, 3].map((x) => (
        <rect key={x} x={W / 2 + x * s2 - 4} y={railY - POST_TOP * s2} width={8} height={POST_TOP * s2} fill="#1a1a1a" />
      ))}
      {RAILS.map(([a, b]) => (
        <rect key={a} x={0} y={railY - b * s2} width={W} height={(b - a) * s2} fill={PAPER} stroke={INK} strokeWidth={3} />
      ))}
    </g>
  );
  // world x in the cell grows to the left (they walk left)
  const ex = (x: number) => 1.6 - x;

  // 3 marshal spraying
  const sprayPose = spray(t);

  // 6 high five, then a hug: B watches the screen (facing right with A), turns on the beat, slaps A's hand, hugs
  const tp = t % 5;
  const turned = tp > 0.9;
  const gapHF = 0.9;
  const gapHug = HUG_GAP;
  const hugIn = Math.min(1, Math.max(0, (tp - 2.1) / 0.5));
  const gap = gapHF + (gapHug - gapHF) * hugIn;
  const poseA: Pose = tp < 1.2 ? armsFolded({ t }) : tp < 2.2 ? highFive((tp - 1.2) / 1.0, gapHF) : hug((tp - 2.2) / 1.5, gap, tp);
  const poseB: Pose = tp < 0.9 ? handOnHead({ t: t + 1 }) : tp < 2.2 ? highFive((tp - 1.2) / 1.0, gapHF) : hug((tp - 2.2) / 1.5, gap, tp + 0.3);
  // during the hug each one's near arm wraps round the other: both bodies first, then both near arms
  const hugging = tp >= 2.2;

  // 9 pushing: three pushes' worth of distance, looping
  const dPush = frac((0.9 * t) / (3 * 1.32)) * 3 * 1.32;

  return (
    <AbsoluteFill style={{ backgroundColor: PAPER }}>
      <svg width={1920} height={1080}>
        <Cell
          i={0}
          title="WALK (GROUND TICKS 0.5 M)"
          s={105}
          camX={0}
          people={[{ x: -2.9 + dWalk, pose: walk(dWalk), outfit: SENNA, facing: "right" }]}
        />
        <Cell
          i={1}
          title="CLIMB THE RAIL · DOCTOR TAKES HIS ARM · HELPED AWAY"
          s={s2}
          camX={0}
          between={rail}
          people={[
            ...(groBehind.length
              ? [{ x: ex(esc.gro.x), depth: Math.max(0.51, groDepth), pose: esc.gro.pose, outfit: GROSJEAN, facing: "left" as const, parts: groBehind }]
              : []),
            ...(groFront.length
              ? [{ x: ex(esc.gro.x), depth: Math.min(0.5, groDepth), pose: esc.gro.pose, outfit: GROSJEAN, facing: "left" as const, parts: groFront }]
              : []),
            { x: ex(esc.doc.x), depth: docDepth, pose: esc.doc.pose, outfit: DOCTOR, facing: "left" },
          ]}
        />
        <Cell
          i={2}
          title="SPRAY EXTINGUISHER (FRONT KNEE BENT, FAR HAND LOW ON THE BOTTLE)"
          s={110}
          camX={0.6}
          people={[{ x: 0, pose: sprayPose, outfit: MARSHAL, facing: "right", held: { kind: "extinguisher", spray: 0.9 + 0.1 * Math.sin(t * 9), aim: nozzleOf(sprayPose).dir } }]}
        />
        <Cell
          i={3}
          title="FIST PUMP ON THE BEAT · BOTH FISTS UP"
          s={105}
          people={[
            { x: -1.1, pose: fistPump(beat), outfit: FERRARI_MECHANIC, facing: "right" },
            { x: 1.0, pose: armsUp(beat), outfit: FERRARI_MECHANIC, facing: "left" },
          ]}
        />
        <Cell
          i={4}
          title="JUMP (ONE JUMP PER TWO BEATS)"
          s={105}
          people={[
            { x: -1.0, pose: jump(frac(beat / 2)), outfit: FERRARI_MECHANIC, facing: "right" },
            { x: 1.0, pose: jump(frac(beat / 2 + 0.5)), outfit: FAN_RED, facing: "left" },
          ]}
        />
        <Cell
          i={5}
          title="TURN, HIGH FIVE → HUG"
          s={105}
          people={
            hugging
              ? [
                  { x: -gap / 2, pose: poseA, outfit: FERRARI_MECHANIC, facing: "right", parts: ["farLeg", "body", "nearLeg"] },
                  { x: gap / 2, pose: poseB, outfit: FERRARI_MECHANIC, facing: "left", parts: ["farLeg", "body", "nearLeg"] },
                  { x: -gap / 2, pose: poseA, outfit: FERRARI_MECHANIC, facing: "right", parts: ["nearArm"] },
                  { x: gap / 2, pose: poseB, outfit: FERRARI_MECHANIC, facing: "left", parts: ["nearArm"] },
                ]
              : [
                  { x: -gap / 2, pose: poseA, outfit: FERRARI_MECHANIC, facing: "right" },
                  { x: gap / 2, pose: poseB, outfit: FERRARI_MECHANIC, facing: turned ? "left" : "right" },
                ]
          }
        />
        <Cell
          i={6}
          title="WATCHING THE SCREEN: ARMS FOLDED / HAND ON HEAD (BOTH WAYS)"
          s={105}
          people={[
            { x: -1.6, pose: armsFolded({ t }), outfit: FERRARI_MECHANIC, facing: "right" },
            { x: -0.4, pose: handOnHead({ t: t + 2 }), outfit: FAN_LIGHT, facing: "right" },
            { x: 0.8, pose: armsFolded({ t: t + 4 }), outfit: FAN_RED, facing: "left" },
            { x: 1.9, pose: handOnHead({ t: t + 1 }), outfit: FERRARI_MECHANIC, facing: "left" },
          ]}
        />
        <Cell
          i={7}
          title="WAVE · HEAD-BACK CHEER"
          s={105}
          people={[
            { x: -1.0, pose: wave(t * 1.6), outfit: SENNA, facing: "right" },
            { x: 1.0, pose: headBack(t), outfit: FERRARI_MECHANIC, facing: "left" },
          ]}
        />
        <Cell
          i={8}
          title="PUSH THE CAR (FEET PLANTED)"
          s={100}
          camX={0}
          people={[{ x: -2.4 + dPush, pose: push(dPush), outfit: MARSHAL, facing: "right" }]}
          under={
            <rect x={W / 2 + (-2.4 + dPush + 0.82) * 100} y={H - 46 - 1.15 * 100} width={160} height={1.0 * 100} fill="#d8d8d8" stroke={INK} strokeWidth={3} />
          }
        />
      </svg>
    </AbsoluteFill>
  );
};
