// Shot 3.3 (bar 61, on the music's stop): the Haas hits the triple guardrail, its path at 29° and the car yawed 22°
// further (FIA), so the barrier meets the car's side at 51°. The contact lands on the bar's
// first beat; then an explicit slow motion of the 0.1 s that matter (MOT-5): sparks spray off the rails, the bottom and
// top rails bend round the nose and the middle rail tears as the survival cell goes through it, the car breaks at the
// engine bulkhead — the power unit and rear left behind on the track side — and the fuel cell bursts into a fireball,
// carbon shards flying. On the last beats the frame freezes into white paper and black line, an impact star round the
// nose with 67G, the fireball still burning in colour (facts.md; FIA accident investigation summary).
import { random } from "remotion";
import { MangaCar, VF20, carLength } from "../../../cars";
import { pinhole } from "../../../kit/camera";
import { INK, PAPER } from "../../../kit/colors";
import { BubbleSmoke, FIRE_PALETTES, Fireball } from "../../../kit/fire";
import { BigText } from "../../../kit/lettering";
import { focusLines } from "../../../kit/lines";
import { ToneDefs } from "../../../kit/tone";
import { BentGuardrail, bump, type Deflection } from "./bent-rail";
import { BREAK_PIVOT, carPointOnScreen } from "./car-points";
import { ramp, shotById, type PictureProps } from "./common";
import { NightBackdrop, RAILS } from "./night";
import { IMPACT_ANGLE, IMPACT_YAW } from "./crash-geometry.ts";
import { FACTS } from "./shots.ts";

// Trackside camera, low, square to the car: the car is side-on, the barrier runs away from it at 29° + 22° = 51° to
// the car's long axis (path angle plus yaw, crash-geometry.ts; ART-9).
const CAM = pinhole({ f: 1500, horizon: 330, cx: 960, height: 1.3 });
const CAR_Z = 9;
const NOSE_X = -1.6; // world x where the barrier crosses the car's line
const ANGLE = ((IMPACT_ANGLE + IMPACT_YAW) * Math.PI) / 180;
const NEAR = 5.6 / Math.sin(ANGLE); // metres of barrier on the camera side of the contact, ending ~3 m from the lens
const L = carLength(VF20);
// The barrier through the contact point. The car faces left (we see its left side, the barrier on its right, behind):
// the barrier runs toward the camera on the left and away on the right.
const dir = { x: -Math.cos(ANGLE), z: -Math.sin(ANGLE) };
const BAR_A = { x: NOSE_X + dir.x * NEAR, z: CAR_Z + 0.15 + dir.z * NEAR }; // near end
const BAR_B = { x: NOSE_X - dir.x * 30, z: CAR_Z + 0.15 - dir.z * 30 }; // far end
const RUN = Math.hypot(BAR_B.x - BAR_A.x, BAR_B.z - BAR_A.z);
const S_CONTACT = NEAR; // metres from the near end to the contact
const U_CONTACT = S_CONTACT / RUN;
// The car's far front corner meets the rails with the nose at world x 0 (the barrier crosses z = 10 there).
const NOSE0 = 0;
const SLOW = 70; // frames of slow motion before the freeze
const PIERCE = 4.2; // metres the cell travels into the barrier
const BREAK_AT = 12; // frame the car starts to tear in two
const BALL_AT = 15; // frame the fuel cell bursts

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
  // the cell drives on into the rails, pitching nose-down; the rear is left behind, kicking up and turning
  const front = { dx: 0.55 * split, rotate: -4 * split };
  const rear = {
    dx: -1.1 * split,
    dy: 0.35 * Math.sin(Math.PI * Math.min(1, split * 1.3)),
    rotate: 11 * split,
  };
  return { travel, split, front, rear, p };
};

// How the rails give: dragged along with the car round the contact, the top rail prised up and the bottom one pressed
// down where the cell goes through, more the further in it is.
const deflection =
  (travel: number): Deflection =>
  (s, rail) => {
    const k = bump(s, S_CONTACT - travel * 0.5, 1.0 + travel * 0.45);
    const d = travel * 0.5 * k;
    return {
      dx: -d * 0.8,
      dz: d * 0.15,
      dy:
        rail === 2
          ? 0.32 * k * Math.min(1, travel)
          : rail === 0
            ? -0.12 * k * Math.min(1, travel)
            : 0,
    };
  };

export const Impact: React.FC<PictureProps> = ({ f, palette }) => {
  const shot = shotById("3.3");
  const t = f - shot.from;
  const frozen = t >= SLOW;
  const fire = FIRE_PALETTES[palette];
  const { travel, split, front, rear } = stage(t);
  const at = CAM.anchor({ x: NOSE0 + L - travel, z: CAR_Z });
  // the wheels still turning, slowed with the picture (slow motion: ~1/12 of 150° a frame), stopping as it digs in
  const wheelAngle = 13 * Math.min(t, SLOW) * (1 - stage(t).p * 0.6);
  const nose = CAM.project({ x: NOSE0 - travel - 0.1, y: 0.45, z: CAR_Z });
  const hit = CAM.project({ x: NOSE0 - travel + 0.3, y: 0.6, z: CAR_Z + 0.9 });
  const breakAt = carPointOnScreen(at, BREAK_PIVOT, {
    dx: (front.dx + rear.dx) / 2,
  });
  const ppm = CAM.pxPerMetre(CAR_Z);
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
  // the middle rail fails first, then the cell is through it
  const gapW = Math.max(0, travel - 0.4) * 0.9;
  const gaps: [number, number][][] = [
    [],
    gapW > 0
      ? [[U_CONTACT - (gapW * 0.9) / RUN, U_CONTACT + (gapW * 0.6) / RUN]]
      : [],
    [],
  ];
  // sparks off the rails: streaks thrown back and up from the contact, under gravity, every frame
  const sparks = Array.from({ length: 46 }, (_, i) => {
    const born = (i * 37) % 44;
    const age = ts - born;
    if (age < 0 || age > 16) return null;
    const ang = -Math.PI * (0.05 + ((i * 0.618) % 1) * 0.55);
    const v = 16 + ((i * 7) % 11) * 2.2;
    const pos = (a: number) => ({
      x: hit.x + Math.cos(ang) * v * a,
      y: hit.y + Math.sin(ang) * v * a + 0.45 * a * a,
    });
    return { a: pos(Math.max(0, age - 2.5)), b: pos(age), w: 3 + (i % 3) };
  }).filter((s) => s !== null);
  // the spark shower along the rail the car scrapes: from points all along the stretch between the nose and where the
  // car first touched, on each rail's face, thrown back (right, away from the car's travel) and up in long streaks
  const scrape = Array.from({ length: 120 }, (_, i) => {
    const born = (i * 13) % 52;
    const life = 10 + (i % 7);
    const age = ts - born;
    if (age < 0 || age > life || frozen) return null;
    const along = S_CONTACT - (travel + 0.6) * ((i * 0.618) % 1) + 0.3;
    const u = Math.max(0, Math.min(1, along / RUN));
    const rail = RAILS[i % 3];
    const o = CAM.project({
      x: BAR_A.x + (BAR_B.x - BAR_A.x) * u,
      y: (rail[0] + rail[1]) / 2,
      z: BAR_A.z + (BAR_B.z - BAR_A.z) * u,
    });
    const ang = -Math.PI * (0.02 + ((i * 0.377) % 1) * 0.32);
    const v = 22 + ((i * 11) % 13) * 2.4;
    const pos = (a: number) => ({
      x: o.x + Math.cos(ang) * v * a,
      y: o.y + Math.sin(ang) * v * a + 0.6 * a * a,
    });
    return {
      a: pos(Math.max(0, age - 4)),
      b: pos(age),
      w: 4.5 + (i % 4) * 1.3,
      op: Math.min(1, 1.6 * (1 - age / life)),
    };
  }).filter((s) => s !== null);
  // carbon shards and splinters from the nose and the break, tumbling
  const shards = Array.from({ length: 18 }, (_, i) => i).flatMap((i) => {
    const fromBreak = i % 3 === 0;
    const born = fromBreak ? BREAK_AT + (i % 5) : i % 4;
    const age = ts - born;
    if (age < 0) return [];
    const o = fromBreak ? breakAt : hit;
    const ang = -Math.PI * (0.1 + ((i * 0.41) % 1) * 0.8);
    const v = 6 + ((i * 5) % 7) * 1.4;
    const s = (0.08 + ((i * 3) % 5) * 0.035) * ppm;
    const y = o.y + Math.sin(ang) * v * age + 0.2 * age * age;
    if (y > 1180) return [];
    return [
      {
        x: o.x + Math.cos(ang) * v * age,
        y,
        s,
        rot: i * 47 + age * (i % 2 ? 9 : -7),
        light: i % 4 === 1,
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
          <NightBackdrop cam={CAM} tonePrefix="b33" />
        )}
        {lineArt(
          <>
            {/* far stretch of the barrier (behind the car), the rear piece, the cell, then the near stretch the
                cell goes through */}
            <BentGuardrail
              cam={CAM}
              a={BAR_A}
              b={BAR_B}
              from={U_CONTACT - 0.4 / RUN}
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
              a={BAR_A}
              b={BAR_B}
              to={U_CONTACT - 0.4 / RUN}
              deflect={deflect}
              gaps={gaps}
              tonePrefix="b33"
            />
          </>,
        )}
        {/* the fuel cell bursts at the break: a fireball in the fire's colours, bubble smoke rising after it in the
            night; on the paper of the freeze a dark bubble-smoke burst goes behind it instead (ART-20) */}
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
        {shards.map((s, i) => (
          <path
            key={`d${i}`}
            d={`M ${-s.s} ${-s.s * 0.3} L ${s.s * 0.2} ${-s.s * 0.6} L ${s.s} ${s.s * 0.1} L ${-s.s * 0.1} ${s.s * 0.5} Z`}
            transform={`translate(${s.x} ${s.y}) rotate(${s.rot})`}
            fill={s.light ? PAPER : "#151515"}
            stroke={s.light ? INK : PAPER}
            strokeWidth={2}
            strokeLinejoin="miter"
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
      </g>
      {frozen ? (
        <g transform="rotate(-8 1330 250)">
          <BigText x={1330} y={250} size={200} haloWidth={22}>
            {`${FACTS.impactG}G`}
          </BigText>
        </g>
      ) : null}
      <rect width={1920} height={1080} fill={PAPER} opacity={flash} />
    </svg>
  );
};
