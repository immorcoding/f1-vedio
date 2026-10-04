// Shot 5.6, first bar (100): the finish, looking back up the main straight from a camera 5 m up and 8 m ahead of VER
// that flies backwards with him (a cable-cam), so VER holds his place in the frame and the track streams away
// beneath him. On the hit (100.1, `abuDhabi2021.finish`) VER's nose is on the chequered line. The marshal's flag in
// the foreground is at the bottom of its downstroke, drawn with a smear of where it came from, and the frame flashes
// white. Far up the straight, small, comes HAM: 2.2 s behind (facts.md), about 150 m at ~250 km/h. Both run at the
// same speed, so the gap holds while the line recedes toward him. Everything is at true scale through one
// perspective camera, in slow motion (0.15× at the hit, 0.45× by the cut).
// The cars are drawn with the settled top-view art foreshortened onto the ground (the camera sees them from ~25°
// above). HAM, 150 m off, is too small for detail: a front silhouette at his true size, ~19 px wide.
import { MangaCar, PIRELLI_2021, RB16B, topAnchorAt } from "../../../cars";
import { INK, PAPER } from "../../../kit/colors";
import { InkFilterDef, inkFilter } from "../../../kit/ink";
import { CAPTION_FONT, useLettering } from "../../../kit/lettering";
import { focusLines } from "../../../kit/lines";
import { lattice } from "../../../scenes/abu-dhabi-2021/trackside";
import { ToneDefs, tone } from "../../../kit/tone";
import { ChequeredFlag } from "../../../scenes/abu-dhabi-2021/ChequeredFlag";
import { PANEL } from "../../../scenes/abu-dhabi-2021/Closeup";
import { hit, smooth } from "./shotClock";

// The camera: height H, C metres past the line (u = −C), pitched down P degrees, focal length F px; u runs back up
// the straight from the line, v across it (+ = right on screen), y up.
const H = 5;
const C = 8;
const P = (6 * Math.PI) / 180;
const F = 1500;
const CY = 248;
const proj = (u: number, v: number, y = 0) => {
  const fw = u + C;
  const up = y - H;
  const depth = fw * Math.cos(P) - up * Math.sin(P);
  const upc = fw * Math.sin(P) + up * Math.cos(P);
  return { x: 960 + (F * v) / depth, y: CY - (F * upc) / depth, ppm: F / depth };
};
const VP = { x: 960, y: CY - F * Math.tan(P) }; // the straight's vanishing point
const pts = (...ps: { x: number; y: number }[]) =>
  `M ${ps.map((p) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" L ")} Z`;
/** A patch of ground between u0..u1 and v0..v1 (at height y). */
const ground = (u0: number, u1: number, v0: number, v1: number, y = 0) =>
  pts(proj(u0, v0, y), proj(u0, v1, y), proj(u1, v1, y), proj(u1, v0, y));
/** A vertical face along the straight at v, from height y0 to y1. */
const wall = (u0: number, u1: number, v: number, y0: number, y1: number) =>
  pts(proj(u0, v, y0), proj(u1, v, y0), proj(u1, v, y1), proj(u0, v, y1));

const ROAD = 8; // half-width of the main straight, m
const NEAR = -4.5; // nearest ground the frame sees
const FAR = 900;

// Race time in the slow motion: 0.15× at the hit, easing to 0.45× by the cut (≈ 0.56 s of race in the bar).
const raceTime = (t: number) => {
  const n = 60;
  let s = 0;
  for (let i = 0; i < n; i++) {
    const x = ((i + 0.5) / n) * t;
    s += (0.15 + 0.3 * smooth(x / 1.875)) * (t / n);
  }
  return s;
};
const SPEED = 70; // m/s across the line (~250 km/h)
export const HAM_GAP = 2.2 * SPEED; // m: 154

// VER's line (right of centre as the camera sees it) and HAM's (left).
const VER_V = 1.8;
const HAM_V = -2.4;

/** HAM at 150 m: a W12 seen from the front, at its true size (2.0 m wide, ~0.95 m to the top of the airbox). */
const FrontW12: React.FC<{ x: number; y: number; ppm: number }> = ({ x, y, ppm }) => {
  const m = (v: number) => v * ppm;
  return (
    <g transform={`translate(${x} ${y})`}>
      <ellipse cx={0} cy={m(0.02)} rx={m(1.15)} ry={m(0.12)} fill={INK} opacity={0.5} />
      {/* rear tyres, then the body, the front tyres and the front wing */}
      {[-1, 1].map((s) => (
        <rect key={`r${s}`} x={s > 0 ? m(0.55) : m(-0.95)} y={m(-0.7)} width={m(0.4)} height={m(0.7)} rx={m(0.08)} fill={INK} />
      ))}
      <path
        d={`M ${m(-0.28)} ${m(-0.25)} L ${m(-0.2)} ${m(-0.78)} L ${m(0)} ${m(-0.95)} L ${m(0.2)} ${m(-0.78)} L ${m(0.28)} ${m(-0.25)} Z`}
        fill="#18181b"
        stroke={INK}
        strokeWidth={1}
      />
      <rect x={m(-0.5)} y={m(-1.0)} width={m(1.0)} height={m(0.1)} fill="#18181b" />
      <path d={`M ${m(-0.3)} ${m(-0.62)} Q 0 ${m(-0.9)} ${m(0.3)} ${m(-0.62)}`} fill="none" stroke={INK} strokeWidth={Math.max(1, m(0.05))} />
      <circle cx={0} cy={m(-0.7)} r={m(0.12)} fill="#6b3fa0" />
      {[-1, 1].map((s) => (
        <rect key={`f${s}`} x={s > 0 ? m(0.62) : m(-0.97)} y={m(-0.66)} width={m(0.35)} height={m(0.66)} rx={m(0.08)} fill={INK} />
      ))}
      <rect x={m(-0.9)} y={m(-0.16)} width={m(1.8)} height={m(0.1)} fill="#00a19b" stroke={INK} strokeWidth={1} />
    </g>
  );
};

export const FinishGantry: React.FC<{ t: number }> = ({ t }) => {
  useLettering();
  const tau = raceTime(t);
  // camera-relative: VER's nose stays at u = 0 and HAM at the gap; the world recedes by the distance run
  const travel = SPEED * tau;
  const verNose = 0;
  const hamNose = HAM_GAP;
  const every = (period: number, n: number) =>
    Array.from({ length: n }, (_, k) => k * period + (travel % period) - period).filter((u) => u >= NEAR);
  const flash = hit(t, 0, 0.09);
  const burst = hit(t, 0, 0.5);
  const shake = { x: Math.sin(t * 57) * 14 * burst, y: Math.cos(t * 49) * 10 * burst };
  // VER: the top-view art laid on the ground, foreshortened to where its nose and tail project
  const nose = proj(verNose, VER_V);
  const tail = proj(verNose + 5.57, VER_V);
  const mid = proj(verNose + 2.8, VER_V);
  const squash = (nose.y - tail.y) / (5.57 * mid.ppm);
  const verAt = topAnchorAt(RB16B, { x: mid.x, y: mid.y, pxPerMetre: mid.ppm }, 90);
  const ham = proj(hamNose, HAM_V);
  const tagAt = { x: ham.x - 170, y: ham.y - 30 };
  // the flag: the downstroke lands on the hit, then it waves (slowly, in the slow motion)
  const swing = 22 * Math.cos(tau * 2 * Math.PI * 1.6) - 6;
  return (
    <svg width={1920} height={1080}>
      <defs>
        <ToneDefs />
        <InkFilterDef />
        <clipPath id="gantry-panel">
          <rect x={PANEL.x} y={PANEL.y} width={PANEL.w} height={PANEL.h} />
        </clipPath>
      </defs>
      <rect width={1920} height={1080} fill={PAPER} />
      <g filter={inkFilter()}>
        <g clipPath="url(#gantry-panel)">
          <g transform={`translate(${shake.x} ${shake.y})`}>
            {/* night sky, then the stands on the right and the pit building on the left, all toward one point */}
            <rect x={-200} y={-200} width={2320} height={VP.y + 260} fill={INK} />
            <path d={wall(-4, FAR, ROAD + 6, 0, 14)} fill={tone("dark")} stroke={INK} strokeWidth={3} />
            {Array.from({ length: 9 }, (_, i) => (
              <path
                key={`row${i}`}
                d={`M ${proj(-4, ROAD + 6, 2 + i * 1.4).x} ${proj(-4, ROAD + 6, 2 + i * 1.4).y} L ${VP.x} ${VP.y}`}
                stroke={PAPER}
                strokeWidth={2}
                opacity={0.35}
              />
            ))}
            <path d={wall(-4, FAR, -ROAD - 5, 0, 9)} fill={tone("mid")} stroke={INK} strokeWidth={3} />
            {/* run-off and the road */}
            <path d={ground(NEAR, FAR, ROAD, ROAD + 6)} fill={tone("light")} />
            <path d={ground(NEAR, FAR, -ROAD - 5, -ROAD)} fill={tone("light")} />
            <path d={ground(NEAR, FAR, -ROAD, ROAD)} fill={PAPER} />
            <path d={ground(NEAR, FAR, -ROAD + 1, ROAD - 1)} fill={tone("light")} opacity={0.6} />
            {/* pit wall with its catch fence, on the left */}
            <path d={wall(NEAR, FAR, -ROAD - 0.6, 0, 1.1)} fill={PAPER} stroke={INK} strokeWidth={4} />
            <path d={wall(NEAR, FAR, -ROAD - 0.6, 1.1, 4)} fill="url(#gantry-fence)" stroke={INK} strokeWidth={2} />
            <defs>
              <pattern id="gantry-fence" width={24} height={24} patternUnits="userSpaceOnUse">
                <path d={lattice(0, 24, 0, 24, 12)} stroke={INK} strokeWidth={1.2} opacity={0.6} />
              </pattern>
            </defs>
            {/* white lines at the road's edges */}
            {[-ROAD + 0.4, ROAD - 0.4].map((v) => (
              <path key={v} d={ground(NEAR, FAR, v - 0.15, v + 0.15)} fill={PAPER} stroke={INK} strokeWidth={1.5} />
            ))}
            {/* the track streaming away under the camera: lane streaks on the road, joints in the pit wall */}
            {every(9, 26).map((u) =>
              [-4.2, 0, 4.2].map((v) => (
                <path key={`s${u}-${v}`} d={ground(u, u + 2.2, v - 0.12, v + 0.12)} fill={INK} opacity={0.35} />
              )),
            )}
            {every(4, 50).map((u) => (
              <path key={`j${u}`} d={wall(u, u + 0.12, -ROAD - 0.6, 0, 1.1)} fill={INK} />
            ))}
            {/* speed: lines streaming from the vanishing point */}
            <path d={focusLines(VP.x, VP.y, 120, 70, Math.floor(t * 10))} fill={PAPER} opacity={0.2 + 0.3 * burst} />
            {/* the start/finish line: two rows of chequers across the straight */}
            {Array.from({ length: 16 }, (_, i) =>
              [0, 1].map((r) => (
                <path
                  key={`c${i}-${r}`}
                  d={ground(travel + r * 0.5, travel + r * 0.5 + 0.5, -ROAD + i, -ROAD + i + 1)}
                  fill={(i + r) % 2 ? PAPER : INK}
                />
              )),
            )}
            {/* HAM, far up the straight, and his tag off to the side */}
            <path d={`M ${tagAt.x + 48} ${tagAt.y + 26} L ${ham.x - 6} ${ham.y - ham.ppm * 1.1}`} stroke={INK} strokeWidth={4} />
            <FrontW12 x={ham.x} y={ham.y} ppm={ham.ppm} />
            <g transform={`translate(${tagAt.x} ${tagAt.y})`}>
              <rect x={-52} y={-26} width={104} height={52} fill={PAPER} stroke={INK} strokeWidth={5} />
              <text y={14} textAnchor="middle" fontFamily={CAPTION_FONT} fontWeight={700} fontSize={38} fill={INK}>
                HAM
              </text>
            </g>
            {/* the hit: a white flash and focus lines behind VER */}
            <rect x={-200} y={-200} width={2320} height={1480} fill={PAPER} opacity={0.8 * flash} />
            <path d={focusLines(nose.x, nose.y - 120, 420, 140, Math.floor(t * 10) + 5)} fill={INK} opacity={0.15 + 0.45 * burst} />
            {/* VER on the line */}
            <path d={ground(verNose - 0.2, verNose + 5.8, VER_V - 1.1, VER_V + 1.1)} fill={INK} opacity={0.4} />
            <g transform={`translate(0 ${mid.y}) scale(1 ${squash}) translate(0 ${-mid.y})`}>
              <MangaCar car={RB16B} view="top" at={verAt} state={{ heading: 90, compound: PIRELLI_2021.soft }} />
            </g>
          </g>
          {/* the marshal's flag, foreground top left, landing its downstroke on the hit */}
          <g opacity={1}>
            {burst > 0.05 ? (
              <path
                d="M 140 760 A 640 640 0 0 1 700 160"
                fill="none"
                stroke={PAPER}
                strokeWidth={60 * burst}
                strokeLinecap="round"
                opacity={0.7 * burst}
              />
            ) : null}
            <ChequeredFlag x={250} y={160} w={560} h={330} t={0.6 * t} swing={swing} />
          </g>
        </g>
        <rect x={PANEL.x} y={PANEL.y} width={PANEL.w} height={PANEL.h} fill="none" stroke={INK} strokeWidth={10} />
      </g>
    </svg>
  );
};
