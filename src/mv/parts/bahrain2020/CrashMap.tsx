// Shot 3.2 (bars 59–60): top view of the straight after turn 3 on lap 1 (MOT-2). Out of turn 3 GRO moves across from
// the left; on bar 60 beat 1 his right rear wheel touches KVY's left front wheel, the kick yaws the Haas right and,
// once its tail is clear of KVY's nose, it spears across the track and the run-off toward the guardrail, its path at
// 29° and its nose yawed 22° further right (FIA; the hit itself is the cut to 3.3). Positions come from crash-geometry.ts, which the overlap check also reads
// (ART-18: the cars touch, never overlap). The run-off is schematic; the facts are in docs/production/facts.md.
import { AT01, MangaCar, VF20, wheelAngleAt } from "../../../cars";
import { INK, PAPER } from "../../../kit/colors";
import { CAPTION_FONT, Caption, Sfx } from "../../../kit/lettering";
import { focusLines, speedLines } from "../../../kit/lines";
import { ToneDefs, tone } from "../../../kit/tone";
import { ramp, shotById, type PictureProps } from "./common";
import {
  L_GRO,
  L_KVY,
  TRACK_HALF,
  poseAtFrame,
  type CarPose,
} from "./crash-geometry.ts";
import { CLOCK_32, PLAN_32 } from "./staging.ts";

const PX = 42; // px per metre: a car is ~240 px long
const LEFT_EDGE = -TRACK_HALF - 6; // grass and wall on the left

const shot = shotById("3.2");
const PLAN = PLAN_32;
const CLOCK = CLOCK_32;
const BARRIER = PLAN.barrierY;

// Marks fixed on the ground (world metres), so the track streams past the tracking camera at true speed (MOT-5):
// rubber streaks, patches of repair, and the white line dashes of the track edge.
const MARKS = Array.from({ length: 160 }, (_, i) => {
  const r = (k: number) => {
    const h = Math.sin((i + 1) * 12.9898 + k * 78.233) * 43758.5453;
    return h - Math.floor(h);
  };
  return {
    x: -40 + i * 2.2 + r(1) * 1.5,
    y: -TRACK_HALF + 0.8 + r(2) * (2 * TRACK_HALF - 1.6),
    len: 1.5 + r(3) * 5,
    w: r(4) < 0.2 ? 0.5 : 0.12,
  };
});

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
  const shotT = Math.max(0, f - shot.from);
  // real-time frame of the choreography (slowed round the touch)
  const t = CLOCK.sim(shotT);
  const slow = CLOCK.slow(shotT);
  const tc = PLAN.contact;
  const gro = poseAtFrame(PLAN.gro, t);
  const kvy = poseAtFrame(PLAN.kvy, t);
  // the tyres roll with the distance driven along the track; their speed on screen (slowed round the touch) sets the
  // tread's blur (MOT-5)
  const tNext = CLOCK.sim(shotT + 1);
  const rolling = (poses: CarPose[], car: typeof VF20) => ({
    wheelAngle: wheelAngleAt(car, poseAtFrame(poses, t).x),
    speed: (poseAtFrame(poses, tNext).x - poseAtFrame(poses, t).x) * 60,
  });
  // camera: on the pair until the touch, then on GRO, panning down toward the guardrail
  const follow = ramp(t, tc - 10, tc + 40);
  const groNose = {
    x: gro.x + L_GRO * Math.cos((gro.heading * Math.PI) / 180),
    y: gro.y + L_GRO * Math.sin((gro.heading * Math.PI) / 180),
  };
  const camX =
    ((gro.x + kvy.x + L_KVY) / 2) * (1 - follow) + (groNose.x + 6) * follow;
  const camY =
    -1.5 * (1 - follow) +
    Math.max(-1.5, Math.min(BARRIER - 5.5, groNose.y + 2)) * follow;
  const sx = (x: number) => 960 + (x - camX) * PX;
  const sy = (y: number) => 540 + (y - camY) * PX;
  const at = (p: CarPose) => ({ x: sx(p.x), y: sy(p.y), pxPerMetre: PX });
  // shot frames since the touch (the star and the 擦 are timed in what the viewer sees)
  const sinceContact = shotT - CLOCK.shot(tc);
  const contact = { x: sx(PLAN.contactPoint.x), y: sy(PLAN.contactPoint.y) };
  // GRO's line ahead of him (dashed) until the touch
  const path = PLAN.gro
    .filter((_, i) => i % 4 === 0 && i <= tc + 60)
    .map((p, i) => {
      const h = (p.heading * Math.PI) / 180;
      return `${i ? "L" : "M"} ${sx(p.x + L_GRO * Math.cos(h)).toFixed(1)} ${sy(p.y + L_GRO * Math.sin(h)).toFixed(1)}`;
    })
    .join(" ");
  const x0 = camX - 960 / PX - 4;
  const x1 = camX + 960 / PX + 4;
  const kerb = (from: number, to: number, y0: number, y1: number) =>
    Array.from({ length: Math.ceil((to - from) / 1.5) }, (_, i) => {
      const x = from + i * 1.5;
      if (x > x1 || x + 1.5 < x0) return null;
      return (
        <rect
          key={i}
          x={sx(x)}
          y={sy(y0)}
          width={1.5 * PX}
          height={(y1 - y0) * PX}
          fill={i % 2 ? INK : PAPER}
          stroke={INK}
          strokeWidth={2}
        />
      );
    });
  const step = Math.floor(f / 3);
  const band = (y0: number, y1: number, fill: string) => (
    <rect x={0} y={sy(y0)} width={1920} height={(y1 - y0) * PX} fill={fill} />
  );
  // posts of the guardrail every 2 m, so the ground visibly rushes past
  const posts = Array.from(
    { length: Math.ceil((x1 - x0) / 2) + 1 },
    (_, i) => Math.floor(x0 / 2) * 2 + i * 2,
  );
  return (
    <svg viewBox="0 0 1920 1080" width={1920} height={1080}>
      <defs>
        <ToneDefs prefix="b32" />
      </defs>
      <rect width={1920} height={1080} fill={tone("dark", "b32")} />
      {band(LEFT_EDGE, -TRACK_HALF, tone("mid", "b32"))}
      {band(-TRACK_HALF, TRACK_HALF, PAPER)}
      {band(-TRACK_HALF, TRACK_HALF, tone("light", "b32"))}
      {band(TRACK_HALF, BARRIER, tone("mid", "b32"))}
      {/* rubber and repair marks fixed to the asphalt: they stream past at the cars' speed */}
      {MARKS.filter((m) => m.x + m.len > x0 && m.x < x1).map((m, i) => (
        <rect
          key={i}
          x={sx(m.x)}
          y={sy(m.y) - (m.w * PX) / 2}
          width={m.len * PX}
          height={m.w * PX}
          fill={INK}
          opacity={m.w > 0.3 ? 0.12 : 0.28}
        />
      ))}
      {/* turn 3 exit kerb and the corner number, in frame at the start */}
      {kerb(-30, 2, -TRACK_HALF, -TRACK_HALF + 1)}
      {sx(-12) > 40 ? (
        <g>
          <circle
            cx={sx(-12)}
            cy={sy(-TRACK_HALF - 2.4)}
            r={32}
            fill={PAPER}
            stroke={INK}
            strokeWidth={4}
          />
          <text
            x={sx(-12)}
            y={sy(-TRACK_HALF - 2.4) + 13}
            textAnchor="middle"
            fontFamily={CAPTION_FONT}
            fontSize={40}
            fill={INK}
          >
            3
          </text>
        </g>
      ) : null}
      {/* track edges */}
      {[-TRACK_HALF, TRACK_HALF].map((y) => (
        <rect
          key={y}
          x={0}
          y={sy(y) - 6}
          width={1920}
          height={12}
          fill={PAPER}
          stroke={INK}
          strokeWidth={3}
        />
      ))}
      {/* left wall; the triple guardrail on the right (three rails on posts) */}
      <rect x={0} y={sy(LEFT_EDGE) - 8} width={1920} height={10} fill={INK} />
      {[0, 0.22, 0.44].map((d) => (
        <rect
          key={d}
          x={0}
          y={sy(BARRIER + d) - 3}
          width={1920}
          height={6}
          fill={PAPER}
          stroke={INK}
          strokeWidth={2.5}
        />
      ))}
      {posts.map((x) => (
        <rect
          key={x}
          x={sx(x) - 5}
          y={sy(BARRIER + 0.6)}
          width={10}
          height={18}
          fill={INK}
        />
      ))}
      {/* speed: streaks on the asphalt, redrawn on threes */}
      <path
        d={speedLines({
          x: 0,
          y: sy(-TRACK_HALF) + 14,
          w: 1920,
          h: 2 * TRACK_HALF * PX - 28,
          n: 30,
          seed: `b32-${step}`,
          thickness: 5,
          length: [0.15, 0.4],
        })}
        fill={INK}
        opacity={0.3 * (1 - slow)}
      />
      {/* GRO's line, dashed, fading at the touch */}
      <path
        d={path}
        fill="none"
        stroke={INK}
        strokeWidth={5}
        strokeDasharray="20 16"
        opacity={0.8 * (1 - ramp(t, tc - 20, tc))}
      />
      {/* skid marks behind GRO after the kick */}
      {sinceContact > 0
        ? [-0.8, 0.8].map((side) => (
            <path
              key={side}
              d={PLAN.gro
                .slice(tc, t + 1)
                .filter((_, i) => i % 2 === 0)
                .map((p, i) => {
                  const h = (p.heading * Math.PI) / 180;
                  const x = p.x + 0.6 * Math.cos(h) - side * Math.sin(h);
                  const y = p.y + 0.6 * Math.sin(h) + side * Math.cos(h);
                  return `${i ? "L" : "M"} ${sx(x).toFixed(1)} ${sy(y).toFixed(1)}`;
                })
                .join(" ")}
              fill="none"
              stroke={INK}
              strokeWidth={9}
              strokeLinecap="round"
              opacity={0.55}
            />
          ))
        : null}
      {/* contact shadows under both cars */}
      {[
        { p: kvy, L: L_KVY },
        { p: gro, L: L_GRO },
      ].map(({ p, L }, i) => {
        const h = (p.heading * Math.PI) / 180;
        return (
          <ellipse
            key={i}
            cx={sx(p.x + (L / 2) * Math.cos(h)) + 6}
            cy={sy(p.y + (L / 2) * Math.sin(h)) + 8}
            rx={(L / 2) * PX}
            ry={1.05 * PX}
            transform={`rotate(${p.heading} ${sx(p.x + (L / 2) * Math.cos(h)) + 6} ${sy(p.y + (L / 2) * Math.sin(h)) + 8})`}
            fill={INK}
            opacity={0.35}
          />
        );
      })}
      {/* tyre smoke off GRO's rear wheels while he slides, on threes */}
      {sinceContact > 0
        ? Array.from({ length: 16 }, (_, k) => {
            const back = PLAN.gro[Math.max(tc, Math.floor(t) - Math.floor(k * 1.5))];
            if (!back) return null;
            const h = (back.heading * Math.PI) / 180;
            const age = k / 16;
            return [-0.8, 0.8].map((side) => (
              <circle
                key={`${k}${side}`}
                cx={sx(back.x + 0.4 * Math.cos(h) - side * Math.sin(h))}
                cy={sy(back.y + 0.4 * Math.sin(h) + side * Math.cos(h))}
                r={(0.55 + 1.3 * age) * PX}
                fill={PAPER}
                stroke={INK}
                strokeWidth={2.5}
                opacity={0.85 * (1 - age)}
              />
            ));
          })
        : null}
      <MangaCar
        car={AT01}
        view="top"
        at={at(kvy)}
        state={{
          heading: kvy.heading,
          steer: kvy.steer ?? 0,
          ...rolling(PLAN.kvy, AT01),
        }}
      />
      <MangaCar
        car={VF20}
        view="top"
        at={at(gro)}
        state={{
          heading: gro.heading,
          steer: gro.steer ?? 0,
          ...rolling(PLAN.gro, VF20),
        }}
      />
      {/* the touch: a small star where the wheels met */}
      {sinceContact >= 0 && sinceContact < 36 ? (
        <path
          d={
            Array.from({ length: 16 }, (_, i) => {
              const a = (i / 16) * Math.PI * 2;
              const r =
                (i % 2 ? 16 : 44 + (i % 4) * 7) *
                (0.6 + 0.4 * ramp(sinceContact, 0, 5));
              return `${i ? "L" : "M"} ${contact.x + Math.cos(a) * r} ${contact.y + Math.sin(a) * r}`;
            }).join(" ") + " Z"
          }
          fill={PAPER}
          stroke={INK}
          strokeWidth={5}
          opacity={1 - ramp(sinceContact, 24, 36)}
        />
      ) : null}
      {sinceContact >= 0 && sinceContact < 70 ? (
        <Sfx
          x={Math.min(1700, Math.max(230, contact.x))}
          y={contact.y - 110}
          size={96}
          rotate={-10}
          anchor="middle"
        >
          {shot.text[1]}
        </Sfx>
      ) : null}
      <Tag x={sx(gro.x + L_GRO * 0.5)} y={sy(gro.y) - 2.6 * PX}>
        GRO
      </Tag>
      {sx(kvy.x + L_KVY * 0.5) > 60 ? (
        <Tag x={sx(kvy.x + L_KVY * 0.5)} y={sy(kvy.y) + 2.9 * PX}>
          KVY
        </Tag>
      ) : null}
      {/* slow motion: the page goes still — paper border, focus lines on the touch */}
      {slow > 0 ? (
        <g opacity={slow}>
          <path
            d={focusLines(contact.x, contact.y, 420, 90, 3)}
            fill={INK}
            opacity={0.55}
          />
          <rect
            x={14}
            y={14}
            width={1892}
            height={1052}
            fill="none"
            stroke={PAPER}
            strokeWidth={28}
          />
          <rect
            x={28}
            y={28}
            width={1864}
            height={1024}
            fill="none"
            stroke={INK}
            strokeWidth={6}
          />
        </g>
      ) : null}
      <Caption
        x={1860}
        y={60}
        boxAnchor="end"
        lines={[shot.text[0]]}
        size={56}
      />
    </svg>
  );
};
