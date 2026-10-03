// Shot 3.3 (bar 61, on the music's stop): the Haas hits the triple guardrail at 29°. The first frames are the hit in the
// panel's own inks; then the frame freezes into white paper and black line — the car and the rails as line art inside a
// manga impact star, with 67G.
import { MangaCar, VF20, carLength } from "../../../cars";
import { pinhole } from "../../../kit/camera";
import { INK, PAPER } from "../../../kit/colors";
import { BRUSH_FONT } from "../../../kit/lettering";
import { focusLines } from "../../../kit/lines";
import { ToneDefs } from "../../../kit/tone";
import { ramp, shotById, type PictureProps } from "./common";
import { Guardrail, NightBackdrop } from "./night";
import { FACTS } from "./shots.ts";

// Trackside camera, low, square to the car: the car is side-on, the barrier runs away from it at 29° (ART-9).
const CAM = pinhole({ f: 1500, horizon: 330, cx: 960, height: 1.3 });
const CAR_Z = 9;
const NOSE_X = -1.6; // world x of the nose at the contact
const ANGLE = (29 * Math.PI) / 180;
const L = carLength(VF20);
// The barrier through the contact point. The car faces left (we see its left side, the barrier on its right, behind):
// the barrier runs toward the camera on the left and away on the right.
const dir = { x: -Math.cos(ANGLE), z: -Math.sin(ANGLE) };
const CONTACT = { x: NOSE_X, z: CAR_Z + 0.15 };
const BAR_A = { x: NOSE_X + dir.x * 12, z: CAR_Z + 0.15 + dir.z * 12 };
const BAR_B = { x: NOSE_X - dir.x * 30, z: CAR_Z + 0.15 - dir.z * 30 };
const FREEZE = 5; // frames of motion before the freeze

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

export const Impact: React.FC<PictureProps> = ({ f }) => {
  const shot = shotById("3.3");
  const t = f - shot.from;
  const frozen = t >= FREEZE;
  // MOT-5: it arrives at 192 km/h (53 m/s, 0.9 m a frame) and the 67 G stop crushes ~2 m of it into the rails
  // within the motion frames: u² deceleration from full speed to rest, then held
  const u = Math.min(t, FREEZE) / FREEZE;
  const travel = 2.1 * (1 - (1 - u) * (1 - u));
  const at = CAM.anchor({ x: NOSE_X + L + 1.6 - travel, z: CAR_Z });
  // the wheels still turning at road speed until the stop (53 m/s on a 0.33 m wheel ≈ 150° a frame: drawn at 37°
  // steps, the spoke pattern's visible rate)
  const wheelAngle = 37 * Math.min(t, FREEZE) * (1 - u * 0.5);
  const nose = CAM.project({ x: NOSE_X - 0.1, y: 0.45, z: CAR_Z });
  const shake = frozen ? Math.exp(-(t - FREEZE) / 10) * 14 : 22;
  const dx = Math.sin(t * 2.7) * shake;
  const dy = Math.cos(t * 3.1) * shake * 0.6;
  const push = frozen ? 1 + 0.05 * ramp(t, FREEZE, shot.to - shot.from) : 1;
  const flash = t < FREEZE ? 0 : 1 - ramp(t, FREEZE, FREEZE + 6);
  const scene = (
    <>
      {/* the barrier behind the car (right of the contact, further away), the car, then the near stretch */}
      <Guardrail cam={CAM} a={CONTACT} b={BAR_B} tonePrefix="b33" />
      <MangaCar
        car={VF20}
        facing="left"
        at={at}
        state={{ tilt: frozen ? -2 : -1, wheelAngle }}
      />
      <Guardrail cam={CAM} a={BAR_A} b={CONTACT} tonePrefix="b33" />
    </>
  );
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
            <g filter="url(#b33-lineart)">{scene}</g>
          </>
        ) : (
          <>
            <NightBackdrop cam={CAM} tonePrefix="b33" />
            {scene}
            {/* the hit: shards off the nose */}
            {Array.from({ length: 9 }, (_, i) => {
              const a = -Math.PI * (0.15 + (i / 9) * 0.8);
              const r = 40 + t * 40 + (i % 3) * 30;
              const x = nose.x + Math.cos(a) * r;
              const y = nose.y + Math.sin(a) * r;
              return (
                <path
                  key={i}
                  d={`M ${x} ${y} L ${x + 18} ${y + 6} L ${x + 4} ${y + 20} Z`}
                  fill={i % 2 ? INK : PAPER}
                  stroke={INK}
                  strokeWidth={2}
                />
              );
            })}
          </>
        )}
      </g>
      {frozen ? (
        <text
          x={1290}
          y={300}
          fontFamily={BRUSH_FONT}
          fontSize={240}
          fill={INK}
          stroke={PAPER}
          strokeWidth={18}
          paintOrder="stroke"
          transform={`rotate(-8 1290 300) scale(1)`}
        >
          {`${FACTS.impactG}G`}
        </text>
      ) : null}
      <rect width={1920} height={1080} fill={PAPER} opacity={flash} />
    </svg>
  );
};
