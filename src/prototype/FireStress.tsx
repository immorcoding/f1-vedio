// PROTOTYPE (throwaway): stress test of fire style B (flowing, no outlines) in the three hardest places of Bahrain
// 2020, each against the shipped fire: the 3.3 freeze (colour fireball on white paper), the 3.5 marshal panel (small
// panel, hard-edged figure against soft fire) and 3.6 (figures walking in front of the fire). The shipped scenes are
// imported as they are; the B versions rebuild only what holds the fire (see FireStyles.tsx WreckWorldB).
import { Audio } from "@remotion/media";
import { useId } from "react";
import { AbsoluteFill, staticFile, useCurrentFrame } from "remotion";
import { GRO_2020, VF20, carLength } from "../cars";
import { pinhole, type Camera } from "../kit/camera";
import { INK, PAPER } from "../kit/colors";
import {
  DOCTOR,
  Figure,
  MARSHAL,
  driverOutfit,
  nozzleOf,
  spray,
  v,
  type BodyPart,
  type Held,
  type Outfit,
  type Pose,
} from "../kit/figure";
import { Sfx } from "../kit/lettering";
import { ToneDefs } from "../kit/tone";
import { SCORE } from "../mv/MV";
import { BREAK_PIVOT, carPointOnScreen } from "../mv/parts/bahrain2020/car-points";
import { cueFrame, ramp, shotById } from "../mv/parts/bahrain2020/common";
import { Escape } from "../mv/parts/bahrain2020/Escape";
import {
  AIM,
  CLIMB_X,
  MARSHAL_AIM,
  MARSHAL_AT as MARSHAL_AT_36,
  WALK_Z,
  marshalPose,
  stage36,
} from "../mv/parts/bahrain2020/escape-staging";
import { Impact } from "../mv/parts/bahrain2020/Impact";
import { PowderBillow } from "../mv/parts/bahrain2020/powder";
import { FACTS } from "../mv/parts/bahrain2020/shots";
import { Timeline28 } from "../mv/parts/bahrain2020/Timeline28";
import { WRECK_CAM, heartbeat, zoomCam } from "../mv/parts/bahrain2020/Wreck";
import { BARRIER_Z, HALO_WORLD } from "../mv/parts/bahrain2020/wreck-geometry";
import { at, frameAt, FPS } from "../mv/timing";
import { BubbleSmoke, C, Glow, WreckWorldB, hash, layerD, type Flow, type Tongue } from "./FireStyles";

// ── frames under test ─────────────────────────────────────────────────────────────────────────
export const F33 = frameAt(at(61)) + 100; // deep in the freeze
export const F35 = frameAt(at(69)) + 30; // all four panels down, the marshal in the small bottom-left one
export const F36 = frameAt(at(70)) + 150; // GRO and the doctor walking away, 28 秒 up
export const CLIP36_FROM = frameAt(at(70)) + 100;
export const CLIP36_FRAMES = 120; // ends before the halo finale on bar 72

// ── 3.3: the kit fireball hidden, a B fireball laid over it at the same spot ──────────────────
// Impact.tsx's camera and freeze state, repeated here (the shot isn't parameterised by fire).
const CAM33 = pinhole({ f: 1500, horizon: 330, cx: 960, height: 1.3 });
const SLOW = 70;
const BALL_AT = 15;

const FireballB: React.FC<{ x: number; y: number; r: number; age: number; t: number; fixed?: boolean }> = ({
  x,
  y,
  r,
  age,
  t,
  fixed,
}) => {
  const id = `fbb${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const grow = 1 - Math.exp(-age / 5);
  const R0 = r * (0.2 + 0.8 * grow);
  const lift = r * 0.006 * age;
  const fl: Flow = { t, rise: 1.5, wave: 1.8, sway: 0.5, curl: 0, taper: 1.3, ripple: 0.18 };
  // B as in the night shots: blur scaled to the fire. Fixed for paper: longer, narrower tongues so the silhouette reads
  // as tongues, a fixed small blur (soft bands, crisp edge) and a crisp dark-red under-layer as the edge.
  const n = fixed ? 14 : 12;
  const tongues = Array.from({ length: n }, (_, i) => {
    const a = -90 + ((i + 0.5) / n - 0.5) * 250 + (hash(i, 9) - 0.5) * 14;
    const up = Math.cos(((a + 90) * Math.PI) / 180);
    const tg: Tongue = {
      bx: 0,
      W: R0 * (fixed ? 0.42 + 0.14 * hash(i, 10) : 0.62 + 0.2 * hash(i, 10)),
      H: R0 * (fixed ? 0.75 + 0.95 * Math.max(0, up) : 0.55 + 0.75 * Math.max(0, up)) * (0.8 + 0.3 * hash(i, 11)),
      s: i * 5 + 3,
      hook: 0,
    };
    return { a, tg };
  });
  const blur = fixed ? 2.5 : Math.max(2, R0 * 0.02);
  const layer = (k: number, wf: number, disc: number, fill: string, op: number, b: number, key: string) => (
    <g key={key} filter={`url(#${id}-${key})`} opacity={op}>
      <defs>
        <filter id={`${id}-${key}`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation={b} />
        </filter>
      </defs>
      {tongues.map(({ a, tg }, i) => (
        <path key={i} d={layerD(tg, fl, k, wf)} transform={`rotate(${a + 90}) translate(0 ${R0 * 0.12})`} fill={fill} />
      ))}
      <ellipse cy={fixed ? -R0 * disc * 0.35 : 0} rx={R0 * disc * (fixed ? 0.8 : 1)} ry={R0 * disc * (fixed ? 1.05 : 1)} fill={fill} />
    </g>
  );
  return (
    <g transform={`translate(${x} ${y - lift})`}>
      {fixed ? null : <Glow w={R0 * 1.6} h={R0 * 1.6} t={t} color={C.glow} strength={0.7} />}
      {fixed ? layer(1.04, 1.16, 0.4, C.deep, 1, 0.8, "u") : null}
      {layer(1, 1, fixed ? 0.36 : 0.45, C.red, fixed ? 1 : 0.92, blur * 2.2, "r")}
      {layer(0.78, 0.72, fixed ? 0.26 : 0.36, C.orange, 0.95, blur * 1.6, "o")}
      {layer(0.55, 0.46, fixed ? 0.17 : 0.26, C.yellow, 0.95, blur * 1.3, "y")}
      {layer(0.36, 0.28, fixed ? 0.1 : 0.17, C.core, 1, blur, "c")}
    </g>
  );
};

const Impact33: React.FC<{ f: number; style: "baseline" | "B" | "B-fixed" }> = ({ f, style }) => {
  if (style === "baseline") return <Impact f={f} palette="color" />;
  const shot = shotById("3.3");
  const t = f - shot.from;
  const ts = Math.min(t, SLOW);
  const L = carLength(VF20);
  const anchor = CAM33.anchor({ x: L - 4.2, z: 9 });
  const breakAt = carPointOnScreen(anchor, BREAK_PIVOT, { dx: (0.55 - 1.1) / 2 });
  const ppm = CAM33.pxPerMetre(9);
  const shake = t >= SLOW ? Math.exp(-(t - SLOW) / 10) * 14 : 0;
  const dx = Math.sin(t * 2.7) * shake;
  const dy = Math.cos(t * 3.1) * shake * 0.6;
  const push = 1.06 + 0.05 * ramp(t, SLOW, shot.to - shot.from);
  return (
    <AbsoluteFill>
      {/* hide the kit fireball (the group holding a gradient whose id starts with "ball") and its stroke smoke */}
      <style>
        {".hide-kit-ball g:has(> defs > radialGradient[id^='ball']), .hide-kit-ball path[fill='#4d4643'], .hide-kit-ball path[stroke='#a8826a'] { display: none; }"}
      </style>
      <AbsoluteFill className="hide-kit-ball">
        <Impact f={f} palette="color" />
      </AbsoluteFill>
      <AbsoluteFill>
        <svg viewBox="0 0 1920 1080" width={1920} height={1080}>
          <g transform={`translate(${960 + dx} ${540 + dy}) scale(${push}) translate(-960 -540)`}>
            {/* ART-20: bubble smoke in place of the kit's ink-stroke smoke, behind the fireball */}
            <g transform={`translate(${breakAt.x} ${breakAt.y - ppm * 0.6})`}>
              <BubbleSmoke w={ppm * 2.4} top={ppm * 1.4} rise={ppm * 3.2} t={ts / FPS} seed={33} />
            </g>
            <FireballB x={breakAt.x} y={breakAt.y} r={ppm * 2.5} age={ts - BALL_AT} t={ts / FPS} fixed={style === "B-fixed"} />
          </g>
        </svg>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ── 3.5: the page as shipped, the marshal panel redrawn with B fire ───────────────────────────
type Rect = { x: number; y: number; w: number; h: number };
const PANEL3: Rect = { x: 40, y: 544, w: 716, h: 496 }; // Timeline28 LAYOUTS[3][2]
const fitCam = (target: { x: number; y: number; z: number }, across: number, r: Rect, fx = 0.5, fy = 0.5): Camera =>
  zoomCam(WRECK_CAM, target, r.w / across / WRECK_CAM.pxPerMetre(target.z), {
    x: r.x + r.w * fx,
    y: r.y + r.h * fy,
  });
const MARSHAL_AT = { x: HALO_WORLD.x + 2.05, z: BARRIER_Z - 0.75 };
const COCKPIT = { x: HALO_WORLD.x + 0.35, y: 0.75, z: HALO_WORLD.z - 0.3 };

const PanelExtinguisherB: React.FC<{ r: Rect; f: number; age: number; crisp?: boolean }> = ({ r, f, age, crisp }) => {
  const cam = fitCam({ x: HALO_WORLD.x + 1.1, y: 1.0, z: BARRIER_Z - 0.3 }, 4.4, r, 0.5, 0.55);
  const step = Math.floor(age / 3) * 3;
  const pose = spray(step / 60);
  const tipF = nozzleOf(pose).tip;
  const aim = v(MARSHAL_AT.x - tipF.x - COCKPIT.x, COCKPIT.y - tipF.y);
  const reach = Math.hypot(aim.x, aim.y);
  const p = cam.project({ x: MARSHAL_AT.x, y: 0, z: MARSHAL_AT.z });
  const ppm = cam.pxPerMetre(MARSHAL_AT.z);
  const cock = cam.project(COCKPIT);
  return (
    <g>
      <WreckWorldB cam={cam} f={f} style="B" intensity={0.9} noGlow tonePrefix="s35" crisp={crisp} />
      <PowderBillow x={cock.x} y={cock.y} ppm={ppm} frame={f} />
      <Figure
        at={p}
        pxPerMetre={ppm}
        pose={pose}
        outfit={MARSHAL}
        facing="left"
        held={{ kind: "extinguisher", spray: (reach / 1.05) * ramp(age, 0, 6), aim }}
        rim="#ffb347"
        rimSide="left"
      />
    </g>
  );
};

const Panel35: React.FC<{ f: number; style: "baseline" | "B" | "B-fixed" }> = ({ f, style }) => (
  <AbsoluteFill>
    <Timeline28 f={f} palette="color" />
    {style !== "baseline" ? (
      <AbsoluteFill>
        <svg viewBox="0 0 1920 1080" width={1920} height={1080}>
          <defs>
            <ToneDefs prefix="s35" />
            <clipPath id="s35-clip">
              <rect x={PANEL3.x} y={PANEL3.y} width={PANEL3.w} height={PANEL3.h} />
            </clipPath>
          </defs>
          <g clipPath="url(#s35-clip)">
            <rect x={PANEL3.x} y={PANEL3.y} width={PANEL3.w} height={PANEL3.h} fill={INK} />
            <PanelExtinguisherB r={PANEL3} f={f} age={f - cueFrame("bahrain2020.panel3")} crisp={style === "B-fixed"} />
          </g>
          <rect x={PANEL3.x} y={PANEL3.y} width={PANEL3.w} height={PANEL3.h} fill="none" stroke={PAPER} strokeWidth={10} />
          <rect x={PANEL3.x} y={PANEL3.y} width={PANEL3.w} height={PANEL3.h} fill="none" stroke={INK} strokeWidth={4} />
        </svg>
      </AbsoluteFill>
    ) : null}
  </AbsoluteFill>
);

// ── 3.6: Escape.tsx with WreckWorldB ──────────────────────────────────────────────────────────
const GRO_KIT: Outfit = driverOutfit(GRO_2020.helmet, "#1f1f23", { band: "#8d9099", gloves: "#2c2c31", boots: "#141416" });

const EscapeB: React.FC<{ f: number }> = ({ f }) => {
  const shot = shotById("3.6");
  const t = f - shot.from;
  const black = cueFrame("bahrain2020.black");
  const timeCue = cueFrame("bahrain2020.time");
  const rim = "#ffb347";
  const cam: Camera = zoomCam(WRECK_CAM, { x: CLIMB_X - 0.1, y: 1.0, z: WALK_Z }, 1.18 + 0.05 * ramp(t, 0, black - shot.from), {
    x: 980,
    y: 600,
  });
  const { groBehind, groPose, groAt, docPose, docAt } = stage36(t);
  const g = (p: { x: number; z: number }) => cam.project({ x: p.x, y: 0, z: p.z });
  const ppm = (p: { z: number }) => cam.pxPerMetre(p.z);
  const mPose = marshalPose(Math.floor(t / 3) * 3);
  const mppm = ppm(MARSHAL_AT_36);
  const mBase = g(MARSHAL_AT_36);
  const tipF = nozzleOf(mPose, MARSHAL_AIM).tip;
  const nozzle = { x: mBase.x - tipF.x * mppm, y: mBase.y - tipF.y * mppm };
  const aim = cam.project(AIM);
  const hb = heartbeat(f);
  const text = ramp(f, timeCue, timeCue + 8);
  const jx = aim.x - nozzle.x;
  const jy = aim.y - nozzle.y;
  const jl = Math.hypot(jx, jy);
  const nx = -jy / jl;
  const ny = jx / jl;
  const spread = 0.35 * mppm;
  const jet = `M ${nozzle.x + nx * 4} ${nozzle.y + ny * 4} L ${aim.x + nx * spread} ${aim.y + ny * spread} L ${aim.x - nx * spread} ${aim.y - ny * spread} L ${nozzle.x - nx * 4} ${nozzle.y - ny * 4} Z`;
  const figure = (key: string, p: { x: number; z: number }, pose: Pose, outfit: Outfit, parts?: readonly BodyPart[], held?: Held) => (
    <Figure key={key} at={g(p)} pxPerMetre={ppm(p)} pose={pose} outfit={outfit} facing="left" rim={rim} rimSide="right" parts={parts} held={held} />
  );
  const groFront = (["farLeg", "body", "nearLeg", "nearArm"] as BodyPart[]).filter((p) => !groBehind.includes(p));
  const people = [
    { z: groAt.z, node: groFront.length ? figure("gro", groAt, groPose, GRO_KIT, groFront) : null },
    { z: docAt.z, node: figure("doc", docAt, docPose, DOCTOR) },
    { z: MARSHAL_AT_36.z, node: figure("marshal", MARSHAL_AT_36, mPose, MARSHAL, undefined, { kind: "extinguisher", aim: MARSHAL_AIM }) },
  ].sort((a, b) => b.z - a.z);
  return (
    <svg viewBox="0 0 1920 1080" width={1920} height={1080}>
      <defs>
        <ToneDefs prefix="s36" />
      </defs>
      <WreckWorldB
        cam={cam}
        f={f}
        style="B"
        intensity={1}
        tonePrefix="s36"
        behindRails={groBehind.length ? figure("gro-behind", groAt, groPose, GRO_KIT, groBehind) : null}
        driver={false}
      />
      {people.map((p) => p.node)}
      <path d={jet} fill={PAPER} stroke={INK} strokeWidth={2.5} strokeLinejoin="round" opacity={0.9} />
      <PowderBillow x={aim.x} y={aim.y} ppm={mppm} frame={f} />
      <rect width={1920} height={1080} fill={INK} opacity={0.12 * hb} />
      {text > 0 ? (
        <g opacity={text} transform={`translate(110 220) scale(${0.8 + 0.2 * text})`}>
          <Sfx x={0} y={0} size={210} rotate={-4}>
            {`${FACTS.escapeSeconds} 秒`}
          </Sfx>
        </g>
      ) : null}
    </svg>
  );
};

// ── compositions ──────────────────────────────────────────────────────────────────────────────
export type StressCase = "33-baseline" | "33-B" | "33-B-fixed" | "35-baseline" | "35-B" | "35-B-fixed" | "36-baseline" | "36-B";

export const FireStressStill: React.FC<{ which: StressCase }> = ({ which }) => {
  const [shot, style] = [which.slice(0, 2), which.slice(3)];
  return (
    <AbsoluteFill style={{ backgroundColor: INK }}>
      {shot === "33" ? <Impact33 f={F33} style={style as "baseline" | "B" | "B-fixed"} /> : null}
      {shot === "35" ? <Panel35 f={F35} style={style as "baseline" | "B" | "B-fixed"} /> : null}
      {shot === "36" ? style === "B" ? <EscapeB f={F36} /> : <Escape f={F36} palette="color" /> : null}
    </AbsoluteFill>
  );
};

export const FireStressClip36: React.FC = () => {
  const frame = useCurrentFrame();
  const f = CLIP36_FROM + frame;
  return (
    <AbsoluteFill style={{ backgroundColor: INK }}>
      <EscapeB f={f} />
      <Audio src={staticFile(SCORE)} trimBefore={CLIP36_FROM} />
    </AbsoluteFill>
  );
};
