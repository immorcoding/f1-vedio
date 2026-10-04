// Shot 3.3 (bar 61, on the music's stop): the Haas hits the triple guardrail. Everything comes from the top-view model
// (wreck-geometry.ts): its path at 29° to the barrier, its body yawed 22° further right, so the nose meets the rails at
// 51°; it slides in along that path, nose first, through the rails until its roll structure is on the barrier line —
// the pose the wreck has in every later shot. Filmed from the wreck camera's spot (square to the car's flank, 3.2 m up,
// a little wider), so the rails cross in front of the nose at the angle they keep after the cut; the picture is
// flipped like the wreck's, so the car runs left → right as in 3.2. The contact lands on the bar's first beat; then an
// explicit slow motion of the 0.1 s that matter (MOT-5): sparks spray off the rails from the frame it touches, the
// middle rail splits back from the first touch as the nose slides on through it, the top and bottom rails bend back
// and split along the survival cell — their torn ends curling up and back, the gap every later shot shows
// (wreck-geometry.ts TEARS, tornCurl) — the car breaks at the engine bulkhead — the power unit and rear left behind on
// the track side — and the fuel cell bursts into a fireball, carbon shards flying. On the last beats the frame freezes
// into white paper and black line, an impact star round the nose with 67G, the fireball still burning in colour
// (facts.md; FIA accident investigation summary).
import { random } from "remotion";
import { MangaCar, VF20, carLength } from "../../../cars";
import { INK, PAPER } from "../../../kit/colors";
import { BubbleSmoke, FIRE_PALETTES, Fireball } from "../../../kit/fire";
import { BigText } from "../../../kit/lettering";
import { focusLines } from "../../../kit/lines";
import { ToneDefs } from "../../../kit/tone";
import { BentGuardrail, bump, type Deflection } from "./bent-rail";
import { BREAK_PIVOT, carPointOnScreen } from "./car-points";
import { ramp, shotById, type PictureProps } from "./common";
import { FloodlitNight } from "./floodlit-night";
import { RAILS } from "./night";
import { Flip, WRECK_CAM, zoomCam } from "./Wreck";
import {
  CELL_ANCHOR_X,
  CELL_POSE,
  CELL_Z,
  IMPACT_POINT,
  PATH_DIR,
  PIERCE,
  RUN,
  RUN_DIR_V,
  TEARS,
  TRACKWARD_V,
  along,
  dirToView,
  runS,
  tornCurl,
} from "./wreck-geometry.ts";
import { FACTS } from "./shots.ts";

// The wreck camera, opened up a little and framed on the whole slide, from the first touch to the rest pose.
export const IMPACT_CAM = zoomCam(WRECK_CAM, { x: 2.2, y: 0.5, z: 8.6 }, 0.95, {
  x: 960,
  y: 560,
});
const CAM = IMPACT_CAM;
// in the camera's own (unflipped) picture the car travels −x: sparks thrown back off it go +x
const MX = 1;
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
  // where the car is hitting the rails: its right front corner, on the far side of the nose
  const hit = CAM.project({ x: noseX + 0.3, y: 0.6, z: A.z + 0.9 });
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
  // sparks off the rails: streaks thrown back and up from the contact, under gravity, every frame
  const sparks = Array.from({ length: 46 }, (_, i) => {
    const born = (i * 37) % 44;
    const age = ts - born;
    if (age < 0 || age > 16) return null;
    const ang = -Math.PI * (0.05 + ((i * 0.618) % 1) * 0.55);
    const v = 16 + ((i * 7) % 11) * 2.2;
    const pos = (a: number) => ({
      x: hit.x + MX * Math.cos(ang) * v * a,
      y: hit.y + Math.sin(ang) * v * a + 0.45 * a * a,
    });
    return { a: pos(Math.max(0, age - 2.5)), b: pos(age), w: 3 + (i % 3) };
  }).filter((s) => s !== null);
  // the spark shower along the rails the car scrapes: from the stretch it has slid along so far — the first touch on
  // the contact frame, then on down the run as it goes through (no sparks before the car reaches the rails) — on each
  // rail's face, thrown back (away from the car's travel) and up in long streaks
  const scraped = travel * PATH_DIR.x + 0.15;
  const scrape = Array.from({ length: 120 }, (_, i) => {
    const born = (i * 13) % 52;
    const life = 10 + (i % 7);
    const age = ts - born;
    if (age < 0 || age > life || frozen) return null;
    const s = S_TOUCH + scraped * ((i * 0.618) % 1);
    const u = Math.max(0, Math.min(1, s / RUN_LEN));
    const rail = RAILS[i % 3];
    const o = CAM.project({
      x: RUN.a.x + (RUN.b.x - RUN.a.x) * u,
      y: (rail[0] + rail[1]) / 2,
      z: RUN.a.z + (RUN.b.z - RUN.a.z) * u,
    });
    const ang = -Math.PI * (0.02 + ((i * 0.377) % 1) * 0.32);
    const v = 22 + ((i * 11) % 13) * 2.4;
    const pos = (a: number) => ({
      x: o.x + MX * Math.cos(ang) * v * a,
      y: o.y + Math.sin(ang) * v * a + 0.6 * a * a,
    });
    return {
      a: pos(Math.max(0, age - 4)),
      b: pos(age),
      w: 4.5 + (i % 4) * 1.3,
      op: Math.min(1, 1.6 * (1 - age / life)),
    };
  }).filter((s) => s !== null);
  // a spray of fine carbon bits off the nose and the break (the finer-particle language of the Abu Dhabi lock-up
  // smoke): many small dark flecks, flung out and falling, each seen for a moment and gone (user review 2026-10-04:
  // the big shards read as stickers)
  const bits = Array.from({ length: 44 }, (_, i) => i).flatMap((i) => {
    const fromBreak = i % 3 === 0;
    const born = fromBreak ? BREAK_AT + (i % 9) : (i * 5) % 14;
    const life = 12 + ((i * 7) % 11);
    const age = ts - born;
    if (age < 0 || age > life) return [];
    const o = fromBreak ? breakAt : hit;
    const ang = -Math.PI * (0.05 + ((i * 0.618) % 1) * 0.9);
    const v = 9 + ((i * 5) % 9) * 1.6;
    const s = 2.2 + ((i * 3) % 5) * 1.1;
    return [
      {
        x: o.x + MX * Math.cos(ang) * v * age,
        y: o.y + Math.sin(ang) * v * age + 0.35 * age * age,
        s,
        rot: i * 47 + age * (i % 2 ? 14 : -11),
        grey: i % 4 === 1,
        op: Math.min(1, (1 - age / life) * 2),
      },
    ];
  });
  const lineArt = (children: React.ReactNode) =>
    frozen ? <g filter="url(#b33-lineart)">{children}</g> : children;
  return (
    <svg viewBox="0 0 1920 1080" width={1920} height={1080}>
      <defs>
        <ToneDefs prefix="b33" />
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
              <rect
                x={-200}
                y={-200}
                width={2320}
                height={1480}
                fill={PAPER}
              />
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
            <FloodlitNight cam={CAM} tonePrefix="b33" id="b33-night" />
          )}
          {lineArt(
            <>
              {/* the barrier up the run (behind the car), the rear piece, the cell, then the stretch down the run
                  that the nose goes through, in front of it */}
              <BentGuardrail
                cam={CAM}
                a={RUN.a}
                b={RUN.b}
                to={splitU}
                deflect={deflect}
                gaps={gaps}
                tonePrefix="b33"
              />
              <MangaCar
                car={VF20}
                facing="left"
                at={at}
                state={{
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
                  state={{ wheelAngle, split: { front, rear, show: "front" } }}
                />
              ) : null}
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
          {bits.map((s, i) => (
            <path
              key={`d${i}`}
              d={`M ${-s.s} ${-s.s * 0.3} L ${s.s * 0.2} ${-s.s * 0.6} L ${s.s} ${s.s * 0.1} L ${-s.s * 0.1} ${s.s * 0.5} Z`}
              transform={`translate(${s.x} ${s.y}) rotate(${s.rot})`}
              fill={s.grey ? "#6a6560" : "#1c1a19"}
              opacity={s.op}
            />
          ))}
          {scrape.map((s, i) => (
            <g key={`r${i}`} opacity={s.op}>
              <path
                d={`M ${s.a.x} ${s.a.y} L ${s.b.x} ${s.b.y}`}
                stroke={INK}
                strokeWidth={s.w + 4}
                strokeLinecap="round"
              />
              <path
                d={`M ${s.a.x} ${s.a.y} L ${s.b.x} ${s.b.y}`}
                stroke="#ffa31a"
                strokeWidth={s.w}
                strokeLinecap="round"
              />
              <path
                d={`M ${(s.a.x + s.b.x) / 2} ${(s.a.y + s.b.y) / 2} L ${s.b.x} ${s.b.y}`}
                stroke="#fffbe6"
                strokeWidth={s.w * 0.55}
                strokeLinecap="round"
              />
            </g>
          ))}
          {sparks.map((s, i) => (
            <g key={`s${i}`}>
              <path
                d={`M ${s.a.x} ${s.a.y} L ${s.b.x} ${s.b.y}`}
                stroke={INK}
                strokeWidth={s.w + 2}
                strokeLinecap="round"
              />
              <path
                d={`M ${s.a.x} ${s.a.y} L ${s.b.x} ${s.b.y}`}
                stroke={frozen ? INK : "#fff1b8"}
                strokeWidth={s.w}
                strokeLinecap="round"
              />
            </g>
          ))}
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
    </svg>
  );
};
