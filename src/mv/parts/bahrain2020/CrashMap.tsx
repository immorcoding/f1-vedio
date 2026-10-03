// Shot 3.2 (bars 59–60): top view of the straight after turn 3 on lap 1 (MOT-2). GRO comes across from the left of the
// track to the right; his right rear wheel touches KVY's left front wheel (bar 60 beat 3) and the Haas spears right,
// across the run-off, into the triple guardrail at 29° — it reaches the rails on the cut to 3.3 (bar 61, the impact).
// Geometry per the FIA accident report as quoted in docs/production/facts.md; the map is a diagram, not a survey.
import { AT01, VF20, carLength, carPoint, MangaCar } from "../../../cars";
import { INK, PAPER } from "../../../kit/colors";
import { CAPTION_FONT, Caption, Sfx } from "../../../kit/lettering";
import { speedLines } from "../../../kit/lines";
import { ToneDefs, tone } from "../../../kit/tone";
import { cueFrame, ramp, shotById, type PictureProps } from "./common";

const PX = 36; // px per metre
const ROAD_Y = 360; // screen y of the track's centre line
const HALF_WIDTH = 7.5; // track half width, m
const BARRIER = 17; // the triple guardrail on the right, m from the centre line (behind the run-off)
const LEFT_WALL = -15;
const SPEED = 62; // m/s, ≈ 223 km/h on the way from 241 km/h at turn 3 to 192 km/h at the barrier
const ANGLE = 29; // impact angle to the barrier, degrees

const L_GRO = carLength(VF20);
const GRO_REAR_AXLE = carPoint(VF20, "rearAxle").x;
const KVY_FRONT_AXLE = carPoint(AT01, "frontAxle").x;
const HALF_TRACK = 0.8; // tyre centre lines from the car's centre line, m

// Lateral positions (m, + = right of the direction of travel = down the screen), rear-end reference.
const Y_KVY = -0.3;
const Y_CONTACT = Y_KVY - 2 * HALF_TRACK - 0.4; // tyre to tyre: GRO's right rear against KVY's left front
const Y_START = -5.6;
// After the contact the Haas turns right on a parabola that meets the rails at ANGLE with its nose.
const Y_IMPACT = BARRIER - L_GRO * Math.sin((ANGLE * Math.PI) / 180);

type Pose = { s: number; y: number; heading: number };

const poses = (t: number, tc: number, T: number) => {
  const kvy: Pose = { s: (SPEED * t) / 60, y: Y_KVY, heading: 0 };
  // GRO's rear axle level with KVY's front axle at the contact
  const lead = KVY_FRONT_AXLE - GRO_REAR_AXLE;
  let gro: Pose;
  if (t < tc) {
    const u = t / tc;
    const e = u * u * (3 - 2 * u);
    const dy = (Y_CONTACT - Y_START) * 6 * u * (1 - u); // derivative of e, per unit u
    gro = {
      s: kvy.s + lead + 1.2 * (1 - u),
      y: Y_START + (Y_CONTACT - Y_START) * e,
      heading: (Math.atan2(dy / (tc / 60), SPEED) * 180) / Math.PI,
    };
  } else {
    const dur = (T - tc) / 60;
    const u = Math.min(1, (t - tc) / (T - tc));
    const A = Y_IMPACT - Y_CONTACT;
    const dyds = (2 * A * u) / (SPEED * dur);
    gro = {
      // he scrubs a little speed against KVY's: 0.97 of the pace
      s: (SPEED * tc) / 60 + lead + SPEED * u * dur * 0.97,
      y: Y_CONTACT + A * u * u,
      heading: Math.min(ANGLE, (Math.atan(dyds) * 180) / Math.PI),
    };
  }
  return { kvy, gro };
};

const Tag: React.FC<{ x: number; y: number; children: string }> = ({
  x,
  y,
  children,
}) => (
  <g>
    <rect
      x={x - 52}
      y={y - 30}
      width={104}
      height={46}
      fill={PAPER}
      stroke={INK}
      strokeWidth={4}
    />
    <text
      x={x}
      y={y + 6}
      textAnchor="middle"
      fontFamily={CAPTION_FONT}
      fontSize={32}
      fill={INK}
    >
      {children}
    </text>
  </g>
);

export const CrashMap: React.FC<PictureProps> = ({ f }) => {
  const shot = shotById("3.2");
  const T = shot.to - shot.from;
  const tc = cueFrame("bahrain2020.contact") - shot.from;
  const t = f - shot.from;
  const { kvy, gro } = poses(t, tc, T);
  // the camera follows the pair, easing towards the Haas once it leaves the track
  const follow = ramp(t, tc, T);
  const camS = (kvy.s + 3) * (1 - follow) + (gro.s + 4) * follow;
  const sx = (s: number) => 960 + (s - camS) * PX;
  const sy = (y: number) => ROAD_Y + y * PX;
  const at = (p: Pose) => ({ x: sx(p.s), y: sy(p.y), pxPerMetre: PX });
  // where GRO's right rear met KVY's left front
  const contact = {
    x: sx((SPEED * tc) / 60 + KVY_FRONT_AXLE),
    y: sy(Y_KVY - HALF_TRACK - 0.2),
  };
  const sinceContact = t - tc;
  // the path GRO is about to take (dashed) and has taken (solid)
  const path = Array.from({ length: 41 }, (_, i) => {
    const p = poses((i / 40) * T, tc, T).gro;
    const h = (p.heading * Math.PI) / 180;
    return `${i ? "L" : "M"} ${sx(p.s + L_GRO * Math.cos(h)).toFixed(1)} ${sy(p.y + L_GRO * Math.sin(h)).toFixed(1)}`;
  }).join(" ");
  const kerb = (s0: number, s1: number, y0: number, y1: number) =>
    Array.from({ length: Math.ceil((s1 - s0) / 1.5) }, (_, i) => (
      <rect
        key={i}
        x={sx(s0 + i * 1.5)}
        y={sy(y0)}
        width={1.5 * PX}
        height={(y1 - y0) * PX}
        fill={i % 2 ? INK : PAPER}
        stroke={INK}
        strokeWidth={2}
      />
    ));
  const step = Math.floor(f / 3);
  return (
    <svg viewBox="0 0 1920 1080" width={1920} height={1080}>
      <defs>
        <ToneDefs prefix="b32" />
      </defs>
      <rect width={1920} height={1080} fill={PAPER} />
      {/* outside the left wall, the run-off, the track, the right run-off and, behind the barrier, the dark */}
      <rect
        x={0}
        y={0}
        width={1920}
        height={sy(LEFT_WALL)}
        fill={tone("dark", "b32")}
      />
      <rect
        x={0}
        y={sy(LEFT_WALL)}
        width={1920}
        height={(LEFT_WALL * -1 - HALF_WIDTH) * PX}
        fill={tone("mid", "b32")}
      />
      <rect
        x={0}
        y={sy(-HALF_WIDTH)}
        width={1920}
        height={2 * HALF_WIDTH * PX}
        fill={tone("light", "b32")}
      />
      <rect
        x={0}
        y={sy(HALF_WIDTH)}
        width={1920}
        height={(BARRIER - HALF_WIDTH) * PX}
        fill={tone("mid", "b32")}
      />
      <rect
        x={0}
        y={sy(BARRIER + 0.6)}
        width={1920}
        height={1080 - sy(BARRIER + 0.6)}
        fill={tone("dark", "b32")}
      />
      {/* turn 3 exit kerb at the left of the frame, and its number */}
      {kerb(-60, -14, HALF_WIDTH - 0.9, HALF_WIDTH)}
      <circle
        cx={sx(-14)}
        cy={sy(-HALF_WIDTH - 1.4)}
        r={30}
        fill={PAPER}
        stroke={INK}
        strokeWidth={4}
      />
      <text
        x={sx(-14)}
        y={sy(-HALF_WIDTH - 1.4) + 13}
        textAnchor="middle"
        fontFamily={CAPTION_FONT}
        fontSize={38}
        fill={INK}
      >
        3
      </text>
      {/* track edges: white lines with an ink border */}
      {[-HALF_WIDTH, HALF_WIDTH].map((y) => (
        <g key={y}>
          <rect
            x={0}
            y={sy(y) - 6}
            width={1920}
            height={12}
            fill={PAPER}
            stroke={INK}
            strokeWidth={3}
          />
        </g>
      ))}
      {/* the walls: triple guardrail on the right (three rails on posts), the left wall */}
      {[0, 0.25, 0.5].map((d) => (
        <path
          key={d}
          d={`M 0 ${sy(BARRIER + d)} L 1920 ${sy(BARRIER + d)}`}
          stroke={INK}
          strokeWidth={4}
        />
      ))}
      {Array.from({ length: 70 }, (_, i) => {
        const s = Math.floor(camS / 2) * 2 - 70 + i * 2;
        return (
          <rect
            key={i}
            x={sx(s) - 4}
            y={sy(BARRIER + 0.55)}
            width={8}
            height={14}
            fill={INK}
          />
        );
      })}
      <path
        d={`M 0 ${sy(LEFT_WALL)} L 1920 ${sy(LEFT_WALL)}`}
        stroke={INK}
        strokeWidth={8}
      />
      {/* speed: streaks on the asphalt, redrawn on threes */}
      <path
        d={speedLines({
          x: 0,
          y: sy(-HALF_WIDTH) + 14,
          w: 1920,
          h: 2 * HALF_WIDTH * PX - 28,
          n: 26,
          seed: `b32-${step}`,
          thickness: 4,
          length: [0.1, 0.3],
        })}
        fill={INK}
        opacity={0.35}
      />
      {/* GRO's line: dashed ahead of him, solid behind */}
      <path
        d={path}
        fill="none"
        stroke={INK}
        strokeWidth={5}
        strokeDasharray="18 14"
        opacity={1 - ramp(t, tc - 10, tc)}
      />
      <MangaCar
        car={AT01}
        view="top"
        at={at(kvy)}
        state={{ heading: kvy.heading }}
      />
      <MangaCar
        car={VF20}
        view="top"
        at={at(gro)}
        state={{ heading: gro.heading }}
      />
      {/* arrowhead where the line meets the rails */}
      {t < tc ? (
        <path
          d={`M ${sx(poses(T, tc, T).gro.s + L_GRO * 0.87) - 10} ${sy(BARRIER) - 34} L ${sx(poses(T, tc, T).gro.s + L_GRO * 0.87) + 22} ${sy(BARRIER) + 2} L ${sx(poses(T, tc, T).gro.s + L_GRO * 0.87) - 26} ${sy(BARRIER) - 4} Z`}
          fill={INK}
        />
      ) : null}
      {/* the touch: a small star where the wheels met, and the scrape */}
      {sinceContact >= 0 && sinceContact < 40 ? (
        <g transform={`translate(${contact.x} ${contact.y})`}>
          <path
            d={
              Array.from({ length: 16 }, (_, i) => {
                const a = (i / 16) * Math.PI * 2;
                const r = i % 2 ? 22 : 54 + (i % 4) * 8;
                return `${i ? "L" : "M"} ${Math.cos(a) * r} ${Math.sin(a) * r}`;
              }).join(" ") + " Z"
            }
            fill={PAPER}
            stroke={INK}
            strokeWidth={5}
            transform={`scale(${0.6 + 0.4 * ramp(sinceContact, 0, 6)})`}
          />
        </g>
      ) : null}
      {sinceContact >= 0 ? (
        <Sfx x={contact.x - 40} y={contact.y - 70} size={92} rotate={-10}>
          擦！
        </Sfx>
      ) : null}
      <Tag x={at(gro).x + L_GRO * 0.45 * PX} y={sy(gro.y) - 2.2 * PX}>
        GRO
      </Tag>
      <Tag x={at(kvy).x + carLength(AT01) * 0.45 * PX} y={sy(kvy.y) + 2.6 * PX}>
        KVY
      </Tag>
      <Caption
        x={1570}
        y={150}
        w={290}
        h={100}
        lines={[...shot.text]}
        size={56}
      />
    </svg>
  );
};
