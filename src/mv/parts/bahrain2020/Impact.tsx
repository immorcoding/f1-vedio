// Shot 3.3 (bar 61, on the music's stop): the Haas hits the triple guardrail. Everything comes from the top-view model
// (wreck-geometry.ts): its path at 29° to the barrier, its body yawed 22° further right, so the nose meets the rails at
// 51°; it slides in along that path, nose first, through the rails until its roll structure is on the barrier line —
// the pose the wreck has in every later shot. Filmed from the wreck camera's spot (square to the car's flank, 3.2 m up,
// a little wider), so the rails cross in front of the nose at the angle they keep after the cut; the picture is
// flipped like the wreck's, so the car runs left → right as in 3.2. The contact lands on the bar's first beat; then an
// explicit slow motion of the 0.1 s that matter (MOT-5): a big spark burst lands on the frame it touches, on the far
// front corner where it meets the rails, and rides along with it (ground.ts scrapeAt), drawn over everything; the
// middle rail splits back from the first touch as the nose slides on through it, the top and bottom rails bend back
// and split along the survival cell — their torn ends curling up and back, the gap every later shot shows
// (wreck-geometry.ts TEARS, tornCurl) — the car breaks at the engine bulkhead — the power unit and rear left behind on
// the track side — and the fuel cell bursts into a fireball. On the last beats the frame freezes
// into white paper and black line, an impact star round the nose with 67G, the fireball still burning in colour
// (facts.md; FIA accident investigation summary). The ground comes from the same model (ground.ts): the run-off, the
// track's white edge line and the barrier's foot run to one vanishing point, the tyre marks along the 29° path to
// another, so the 51° between the car and the rails reads on screen (review-2 #1).
import { random } from "remotion";
import { MangaCar, VF20, carLength } from "../../../cars";
import { INK, PAPER } from "../../../kit/colors";
import { BubbleSmoke, FIRE_PALETTES, Fireball } from "../../../kit/fire";
import { BigText } from "../../../kit/lettering";
import { focusLines } from "../../../kit/lines";
import { SparkBurst } from "../../../kit/sparks";
import { ToneDefs, TonePattern, tone } from "../../../kit/tone";
import { BentGuardrail, bump, type Deflection } from "./bent-rail";
import { BREAK_PIVOT, carPointOnScreen } from "./car-points";
import { ramp, shotById, type PictureProps } from "./common";
import { FloodlitNight } from "./floodlit-night";
import { Flip, WRECK_CAM, zoomCam } from "./Wreck";
import {
  CELL_ANCHOR_X,
  CELL_POSE,
  CELL_Z,
  IMPACT_POINT,
  PATH_DIR,
  PIERCE,
  PPM,
  RUN,
  RUN_DIR_V,
  RUN_W,
  TEARS,
  TRACKWARD_V,
  along,
  dirToView,
  runS,
  toView,
  tornCurl,
  type P2,
} from "./wreck-geometry.ts";
import {
  BARRIER_FAR_X,
  EDGE_LINE,
  SERVICE_STRIP,
  SHRUBS,
  TRACK_EDGE_Y,
  TRACK_FAR_Y,
  scrapeAt,
} from "./ground.ts";
import { FACTS } from "./shots.ts";
import type { Camera } from "../../../kit/camera";

// The wreck camera, opened up a little and framed on the whole slide, from the first touch to the rest pose.
export const IMPACT_CAM = zoomCam(WRECK_CAM, { x: 2.2, y: 0.5, z: 8.6 }, 0.95, {
  x: 960,
  y: 560,
});
const CAM = IMPACT_CAM;
const L = carLength(VF20);
const SLOW = 70; // frames of slow motion before the freeze
const BREAK_AT = 12; // frame the car starts to tear in two
const BALL_AT = 15; // frame the fuel cell bursts
// The car's travel along its path, V: from the touch (its right front-wing corner on the rails) to the rest pose.
const PATH_V = dirToView(PATH_DIR);
// The car's anchor (its rear end) after `travel` metres, with the front piece pushed `frontDx` on along it by the
// split: the front piece itself only ever moves along the path, and lands on the wreck's cell (WreckWorld) at rest.
const anchorAt = (travel: number, frontDx: number) => ({
  x: CELL_ANCHOR_X - CELL_POSE.dx + frontDx + PATH_V.x * (travel - PIERCE),
  z: CELL_Z + PATH_V.z * (travel - PIERCE),
});
// metres along the run (wreck-geometry.ts RUN) of the first touch, and of where the cell's body crosses the rails at
// rest; the middle rail fails first, then the top rail, then the bottom one as the cell rides over it; each splits
// from the first touch outward and is fully open (ends curled) well before the freeze
const S_TOUCH = runS(IMPACT_POINT.x);
const SPLIT_AT = [3.2, 0.6, 2.4]; // travel (m) when each rail starts to split
const SPLIT_OPEN = 1.6; // more metres of travel until it is fully open
const opened = (travel: number, rail: number) =>
  Math.min(1, Math.max(0, (travel - SPLIT_AT[rail]) / SPLIT_OPEN));
// The torn stretch of a rail (metres along the run) as it splits: from the first touch (or, for the rails torn only
// where the cell went through, from where it crosses them) out to the full gap.
const gapAt = (travel: number, rail: number): [number, number] => {
  const g = opened(travel, rail);
  const [a, b] = TEARS[rail].map(runS);
  const c = Math.min(Math.max(S_TOUCH, a), b);
  return [c + (a - c) * g, c + (b - c) * g];
};
const RUN_LEN = Math.hypot(RUN.b.x - RUN.a.x, RUN.b.z - RUN.a.z);

// ── The ground (ground.ts): what the car and the rails stand on, so the 51° reads (review-2 #1) ─────────────────────
// The run-off in 3.2's mid tone between the track's white edge line and the barrier, the track beyond the line in its
// light tone, the ground behind the barrier left dark; the barrier's foot as a line along the ground; and the tyre marks
// the car lays down along its 29° path. The edge line and the barrier's foot run to one vanishing point, the tyre marks
// to another, and the car is square to the camera: the three directions of the top view, on screen.
const NEAR_Z = 0.5; // the ground in front of the camera
const FAR = 3000; // metres up and down the barrier, to the horizon
const pathOf = (cam: Camera, ps: { x: number; z: number }[]) =>
  ps
    .map((p, i) => {
      const s = cam.project(p);
      return `${i ? "L" : "M"} ${s.x.toFixed(1)} ${s.y.toFixed(1)}`;
    })
    .join(" ");
// A ground polygon given on the top view, through the camera: clipped to the ground in front of it.
const groundPolygon = (cam: Camera, ps: P2[]) => {
  const v = ps.map(toView);
  const out: { x: number; z: number }[] = [];
  v.forEach((a, i) => {
    const b = v[(i + 1) % v.length];
    if (a.z >= NEAR_Z) out.push(a);
    if (a.z >= NEAR_Z !== b.z >= NEAR_Z) {
      const k = (NEAR_Z - a.z) / (b.z - a.z);
      out.push({ x: a.x + (b.x - a.x) * k, z: NEAR_Z });
    }
  });
  return out.length > 2 ? `${pathOf(cam, out)} Z` : "";
};
// a band of ground along the barrier, between W y0 and y1
const band = (cam: Camera, y0: number, y1: number) =>
  groundPolygon(cam, [
    { x: -FAR, y: y0 },
    { x: FAR, y: y0 },
    { x: FAR, y: y1 },
    { x: -FAR, y: y1 },
  ]);
const MARK_W = 0.3; // a tyre's sliding mark, m
const MARK_LEN = 80; // back up the path, out of the picture
// The car's tyres where the picture draws them (VF-20, the high far side, ART-26), as points on the ground in V: the
// near tyres stand at the car's depth; the far ones, drawn higher, stand where the ground is that high on screen.
const tyresOnGround = (
  cam: Camera,
  at: { x: number; y: number },
  depth: number,
  front: number, // V x shift of the front piece, metres
  rear: number,
) => {
  const ppm = cam.pxPerMetre(depth);
  const far = VF20.farSide?.high?.wheels ?? VF20.farWheels;
  const onGround = (
    w: { cx: number; cy: number; r: number },
    dx: number,
    near: boolean,
  ) => {
    const sx = at.x + ((w.cx - VF20.frame.x) / PPM + dx) * ppm;
    if (near) return { x: (sx - cam.cx) / ppm, z: depth };
    const sy = at.y + ((w.cy + w.r - VF20.frame.ground) / PPM) * ppm;
    const z = (cam.f * cam.height) / (sy - cam.horizon);
    return { x: ((sx - cam.cx) * z) / cam.f, z };
  };
  return [
    onGround(far[0], front, false),
    onGround(far[1], rear, false),
    onGround(VF20.nearWheels[0], front, true),
    onGround(VF20.nearWheels[1], rear, true),
  ];
};
// One tyre's mark: a band from the tyre back along the path, darkest under the tyre.
const tyreMark = (cam: Camera, p: { x: number; z: number }) => {
  const n = { x: -PATH_V.z * (MARK_W / 2), z: PATH_V.x * (MARK_W / 2) };
  const back = { x: p.x - PATH_V.x * MARK_LEN, z: p.z - PATH_V.z * MARK_LEN };
  return `${pathOf(cam, [
    { x: p.x + n.x, z: p.z + n.z },
    { x: back.x + n.x, z: back.z + n.z },
    { x: back.x - n.x, z: back.z - n.z },
    { x: p.x - n.x, z: p.z - n.z },
  ])} Z`;
};

// The run-off's tone: one step darker than 3.2's mid tone, lighter than the night's dark (user review of #26).
const RUNOFF_TONE_R = 2.25;
// The infield's trees behind the barrier (ground.ts SHRUBS), read as distant low vegetation (user review of #26): low,
// wider-than-tall mounds in a lighter screentone than the ground, standing on the ground line with a faint darker base
// and no outline. Only those in front of the grandstands (floodlit-night.tsx stands from 118 m), farthest first.
const SHRUB_MAX_Z = 110;
const Shrubs: React.FC<{ cam: Camera }> = ({ cam }) => (
  <>
    {SHRUBS.map((s) => ({ s, v: toView(s.at) }))
      .filter(({ v }) => v.z > 3 && v.z < SHRUB_MAX_Z)
      .sort((a, b) => b.v.z - a.v.z)
      .map(({ s, v }) => {
        const base = cam.project({ x: v.x, z: v.z });
        if (base.x < -300 || base.x > 2220) return null;
        const k = cam.pxPerMetre(v.z);
        const w = s.w * k;
        const h = s.h * 0.55 * k; // flattened: the crown seen across the ground
        const r = (j: number) => 0.8 + 0.4 * ((s.seed * (j + 3) * 0.618) % 1);
        // three mounds standing on the ground line, the middle one a little higher
        const mounds = [
          { x: -0.3 * w, rx: 0.3 * w * r(1), ry: 0.6 * h * r(1) },
          { x: 0.28 * w, rx: 0.3 * w * r(2), ry: 0.65 * h * r(2) },
          { x: 0, rx: 0.36 * w * r(3), ry: 0.9 * h * r(3) },
        ];
        const d = mounds
          .map(
            (m) =>
              `M ${(m.x - m.rx).toFixed(1)} 0 A ${m.rx.toFixed(1)} ${m.ry.toFixed(1)} 0 0 1 ${(m.x + m.rx).toFixed(1)} 0 Z`,
          )
          .join(" ");
        return (
          <g key={s.seed} transform={`translate(${base.x} ${base.y})`}>
            <path d={d} fill={tone("mid", "b33")} opacity={0.75} />
            <ellipse
              cx={0}
              cy={0}
              rx={0.5 * w}
              ry={Math.max(1, 0.08 * h)}
              fill="#2a2a2a"
              opacity={0.5}
            />
          </g>
        );
      })}
  </>
);

// ── The impact flash (user review of #26, round 3): one big spark burst on the contact point, no spark shower ────────
const BURST_HEIGHT = 0.6; // where the far front corner meets the rails, m
const BURST_R = 150 * 0.85; // px at full size (85 %, user review of #26)
// a small nudge to the right on screen, off the nose and onto the rails (the picture is flipped: −x before the flip)
const BURST_NUDGE = 32;
const BURST_FADE_BY = BALL_AT + 6; // gone as the fireball grows

const star = (
  cx: number,
  cy: number,
  r0: number,
  r1: number,
  n: number,
  seed: number,
) =>
  Array.from({ length: n * 2 }, (_, i) => {
    const a = (i / (n * 2)) * Math.PI * 2 + seed;
    const jitter = 0.75 + 0.5 * Math.abs(Math.sin(i * 7.3 + seed * 3));
    const r = i % 2 ? r0 : r1 * jitter;
    return `${i ? "L" : "M"} ${cx + Math.cos(a) * r} ${cy + Math.sin(a) * r * 0.8}`;
  }).join(" ") + " Z";

// Where everything is at slow-motion frame t (held from the freeze on).
const stage = (t: number) => {
  const tt = Math.min(t, SLOW);
  const p = Math.min(1, tt / 60);
  const travel = PIERCE * (1 - (1 - p) * (1 - p));
  const split = ramp(tt, BREAK_AT, 58);
  // the cell drives on into the rails, pitching nose-down, into its rest pose; the rear is left behind, kicking up
  // and turning
  const front = { dx: CELL_POSE.dx * split, rotate: CELL_POSE.rotate * split };
  const rear = {
    dx: -1.1 * split,
    dy: 0.35 * Math.sin(Math.PI * Math.min(1, split * 1.3)),
    rotate: 11 * split,
  };
  return { travel, split, front, rear, p };
};

// How the rails give: pushed back and dragged along with the car where it is going through them, the bottom one
// pressed down, more the further in it is; once a rail splits, its torn ends curl (no rail bulges up).
const deflection =
  (travel: number): Deflection =>
  (s, rail) => {
    const centre = S_TOUCH + travel * PATH_DIR.x * 0.7;
    const k = bump(s, centre, 1.0 + travel * 0.35);
    const d = Math.min(travel, 2.5) * 0.25 * k;
    const g = opened(travel, rail);
    const c = g > 0 ? tornCurl(s, ...gapAt(travel, rail), rail, g) : null;
    const out = (c ? c.out : 0) - d; // toward the track (−: pushed back)
    const run = 0.3 * d + (c ? c.along : 0);
    return {
      dx: out * TRACKWARD_V.x + run * RUN_DIR_V.x,
      dz: out * TRACKWARD_V.z + run * RUN_DIR_V.z,
      dy: (rail === 0 ? -0.12 * k * Math.min(1, travel) : 0) + (c ? c.up : 0),
    };
  };

export const Impact: React.FC<PictureProps> = ({ f, palette }) => {
  const shot = shotById("3.3");
  const t = f - shot.from;
  const frozen = t >= SLOW;
  const fire = FIRE_PALETTES[palette];
  const { travel, split, front, rear, p } = stage(t);
  const A = anchorAt(travel, front.dx);
  const at = CAM.anchor({ x: A.x, z: A.z });
  // the wheels still turning, slowed with the picture (slow motion: ~1/12 of 150° a frame), stopping as it digs in
  const wheelAngle = 13 * Math.min(t, SLOW) * (1 - p * 0.6);
  const noseX = A.x - L - front.dx;
  const nose = CAM.project({ x: noseX - 0.1, y: 0.45, z: A.z });
  const breakAt = carPointOnScreen(
    at,
    BREAK_PIVOT,
    { dx: (front.dx + rear.dx) / 2 },
    "left",
  );
  const ppm = CAM.pxPerMetre(A.z);
  // camera: a hard, jagged jolt on the contact (a few frames, random direction each frame), then the slow motion's
  // long shudder, and a last kick as the frame freezes
  const jolt = 46 * Math.exp(-t / 4);
  const shake = frozen ? Math.exp(-(t - SLOW) / 10) * 18 : jolt + 5;
  const jx = random(`b33-jx${t}`) - 0.5;
  const jy = random(`b33-jy${t}`) - 0.5;
  const dx = jolt > 2 ? jx * 2 * shake : Math.sin(t * 2.7) * shake;
  const dy = jolt > 2 ? jy * 1.4 * shake : Math.cos(t * 3.1) * shake * 0.6;
  const push = frozen
    ? 1.06 + 0.05 * ramp(t, SLOW, shot.to - shot.from)
    : 1 + 0.06 * ramp(t, 0, SLOW);
  // white flashes: on the contact, and a short burn-out just before the freeze (the frame whites out, then the line
  // art comes up out of it)
  const flash =
    t < 3
      ? 1 - t / 3
      : frozen
        ? 1 - ramp(t, SLOW, SLOW + 6)
        : t >= SLOW - 5
          ? ramp(t, SLOW - 5, SLOW - 1, (x) => x)
          : 0;
  const ts = Math.min(t, SLOW);
  const deflect = deflection(travel);
  // the middle rail fails first, then the top rail, then the bottom one; each splits along the way the car went
  const gaps: [number, number][][] = [0, 1, 2].map((rail) => {
    if (opened(travel, rail) <= 0) return [];
    const [a, b] = gapAt(travel, rail);
    return [[a / RUN_LEN, b / RUN_LEN]];
  });
  // the stretch of the barrier down the run from where it crosses the car's plane is nearer than the car: in front
  const splitU = along((A.z - CELL_Z) / RUN_DIR_V.z);
  // the impact flash sits where the far front corner scrapes the rails (ground.ts scrapeAt), in the camera's world V
  const scrape = toView(scrapeAt(travel));
  const burstAt = CAM.project({ x: scrape.x, y: BURST_HEIGHT, z: scrape.z });
  // the tyres on the ground as drawn: the front ones on the front piece, the rear ones on the piece left behind
  const tyres = tyresOnGround(CAM, at, A.z, -front.dx, -rear.dx);
  // the car: the rear piece, then the cell once it splits
  const car = (
    <>
      <MangaCar
        car={VF20}
        facing="left"
        at={at}
        state={{
          // the impact camera is 3.2 m up: the VF-20's high far side (ART-26)
          farSide: "high",
          wheelAngle,
          ...(split > 0
            ? { split: { front, rear, show: "rear" as const } }
            : { tilt: -1 }),
        }}
      />
      {split > 0 ? (
        <MangaCar
          car={VF20}
          facing="left"
          at={at}
          state={{
            farSide: "high",
            wheelAngle,
            split: { front, rear, show: "front" },
          }}
        />
      ) : null}
    </>
  );
  const lineArt = (children: React.ReactNode) =>
    frozen ? <g filter="url(#b33-lineart)">{children}</g> : children;
  return (
    <svg viewBox="0 0 1920 1080" width={1920} height={1080}>
      <defs>
        <ToneDefs prefix="b33" />
        <TonePattern id="b33-runoff" r={RUNOFF_TONE_R} paper />
        {/* line art: the drawing's edges and silhouette in black on white, every fill gone */}
        <filter id="b33-lineart" x="-5%" y="-5%" width="110%" height="110%">
          <feColorMatrix
            in="SourceGraphic"
            type="luminanceToAlpha"
            result="lum"
          />
          <feConvolveMatrix
            in="lum"
            order="3"
            kernelMatrix="-1 -1 -1 -1 8 -1 -1 -1 -1"
            preserveAlpha="false"
            result="edge"
          />
          <feComponentTransfer in="edge" result="edgeT">
            <feFuncA type="discrete" tableValues="0 1 1 1 1 1" />
          </feComponentTransfer>
          <feMorphology
            in="edgeT"
            operator="dilate"
            radius="1"
            result="edgeW"
          />
          <feMorphology
            in="SourceAlpha"
            operator="dilate"
            radius="3"
            result="fat"
          />
          <feComposite
            in="fat"
            in2="SourceAlpha"
            operator="out"
            result="outline"
          />
          <feFlood floodColor={PAPER} result="paper" />
          <feComposite
            in="paper"
            in2="SourceAlpha"
            operator="in"
            result="fill"
          />
          <feMerge>
            <feMergeNode in="fill" />
            <feMergeNode in="edgeW" />
            <feMergeNode in="outline" />
          </feMerge>
        </filter>
      </defs>
      <g
        transform={`translate(${960 + dx} ${540 + dy}) scale(${push}) translate(-960 -540)`}
      >
        <Flip>
          {frozen ? (
            <>
              <rect x={-200} y={-200} width={2320} height={1480} fill={PAPER} />
              <path d={focusLines(nose.x, nose.y, 380, 140, 61)} fill={INK} />
              <path
                d={star(nose.x, nose.y, 210, 470, 14, 0.3)}
                fill={PAPER}
                stroke={INK}
                strokeWidth={10}
                strokeLinejoin="miter"
              />
              <path
                d={star(nose.x, nose.y, 120, 250, 11, 1.1)}
                fill="none"
                stroke={INK}
                strokeWidth={5}
                strokeLinejoin="miter"
              />
            </>
          ) : (
            <>
              <FloodlitNight cam={CAM} tonePrefix="b33" id="b33-night" />
              <path d={band(CAM, TRACK_EDGE_Y, 0)} fill="url(#b33-runoff)" />
              {/* the paved strip behind the barrier, then the infield desert and its trees */}
              <path
                d={band(CAM, SERVICE_STRIP.from, SERVICE_STRIP.to)}
                fill="url(#b33-runoff)"
              />
              <Shrubs cam={CAM} />
              <path
                d={band(CAM, TRACK_FAR_Y, TRACK_EDGE_Y)}
                fill={tone("light", "b33")}
              />
              <path
                d={band(CAM, TRACK_EDGE_Y - EDGE_LINE, TRACK_EDGE_Y)}
                fill={PAPER}
                stroke={INK}
                strokeWidth={2.5}
                strokeLinejoin="round"
              />
              {/* the barrier's foot */}
              <path
                d={pathOf(CAM, [
                  toView({ x: -FAR, y: 0 }),
                  toView({ x: RUN_W.to, y: 0 }),
                ])}
                stroke={INK}
                strokeWidth={4}
              />
              {tyres.map((p, i) => (
                <path
                  key={`m${i}`}
                  d={tyreMark(CAM, p)}
                  fill={INK}
                  opacity={0.62}
                />
              ))}
            </>
          )}
          {lineArt(
            <>
              {/* the barrier up the run (behind the car), the rear piece, the cell, then the stretch down the run
                  that the nose goes through, in front of it; first the barrier on up the run past the model's
                  RUN, out to the vanishing point */}
              <BentGuardrail
                cam={CAM}
                a={toView({ x: BARRIER_FAR_X, y: 0 })}
                b={RUN.a}
                tonePrefix="b33"
              />
              <BentGuardrail
                cam={CAM}
                a={RUN.a}
                b={RUN.b}
                to={splitU}
                deflect={deflect}
                gaps={gaps}
                tonePrefix="b33"
              />
              {car}
              <BentGuardrail
                cam={CAM}
                a={RUN.a}
                b={RUN.b}
                from={splitU}
                deflect={deflect}
                gaps={gaps}
                tonePrefix="b33"
              />
            </>,
          )}
          {/* the fuel cell bursts at the break: a fireball in the fire's colours, bubble smoke rising after it in
              the night; on the paper of the freeze a dark bubble-smoke burst goes behind it instead (ART-20) */}
          {ts >= BALL_AT + 10 && !frozen ? (
            <g transform={`translate(${breakAt.x} ${breakAt.y - ppm * 0.6})`}>
              <BubbleSmoke
                w={ppm * 2.4}
                top={ppm * 1.4}
                rise={ppm * 3.2}
                frame={ts}
                seed="b33-smoke"
                palette={fire}
                opacity={0.85 * ramp(ts, BALL_AT + 10, BALL_AT + 30)}
              />
            </g>
          ) : null}
          <Fireball
            x={breakAt.x}
            y={breakAt.y}
            r={ppm * 2.5}
            age={ts - BALL_AT}
            seed="b33-ball"
            palette={fire}
            backing={frozen}
          />
        </Flip>
      </g>
      {frozen ? (
        <g transform="rotate(-8 590 250)">
          {/* on the left, clear of the impact star round the nose on the right */}
          <BigText x={590} y={250} size={200} haloWidth={22} anchor="end">
            {`${FACTS.impactG}G`}
          </BigText>
        </g>
      ) : null}
      <rect width={1920} height={1080} fill={PAPER} opacity={flash} />
      {/* the impact flash on the contact point: the top layer, over the car's nose, the rails and the white flash,
          so it lands on the contact frame; it moves with the scrape point and is gone as the fireball grows */}
      {frozen ? null : (
        <g
          transform={`translate(${960 + dx} ${540 + dy}) scale(${push}) translate(-960 -540)`}
        >
          <Flip>
            <SparkBurst
              x={burstAt.x - BURST_NUDGE}
              y={burstAt.y}
              r={BURST_R}
              t={ts}
              fadeBy={BURST_FADE_BY}
              seed="b33-burst"
              palette={fire}
            />
          </Flip>
        </g>
      )}
    </svg>
  );
};
