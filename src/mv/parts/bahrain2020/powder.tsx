// The marshal's dry-powder extinguisher (shots 3.5 and 3.6) as small manga bubble smoke (ART-20; user review
// 2026-10-04 asked for the jet as small puffs instead of streaks): a stream of small round puffs leaves the nozzle,
// each growing as it flies to where the jet lands, and there they pile up into a light billow that swells and drifts
// up and away. One ink outline round the whole cloud, light grey-white powder, a light dot screen on each puff's
// underside. Every puff moves every frame along a smooth path; its size and spread are fixed when it is born.
import { useId } from "react";
import { random } from "remotion";
import { INK } from "../../../kit/colors";
import { TonePattern } from "../../../kit/tone";

const POWDER = "#eeeeea";
const FLIGHT = 0.36; // s from the nozzle to where the jet lands
const JET_EVERY = 2; // frames between puffs leaving the nozzle
const BILLOW_LIFE = 1.3; // s a puff of the billow lives
const BILLOW_EVERY = 3; // frames between new billow puffs

type Pt = { x: number; y: number };
type Puff = { x: number; y: number; r: number; op: number };

export const PowderJet: React.FC<{
  // the nozzle's tip and where the jet lands, on screen
  from: Pt;
  to: Pt;
  // px per metre at the landing point
  ppm: number;
  frame: number;
  seed: string;
  // 0..1: the jet opening up as the marshal starts spraying
  on?: number;
}> = ({ from, to, ppm, frame, seed, on = 1 }) => {
  const id = `pw${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  if (on <= 0) return null;
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const puffs: Puff[] = [];
  // the stream: puff k left the nozzle at frame k * JET_EVERY and is `age` (0..1) of the way there
  const flightF = FLIGHT * 60;
  for (
    let k = Math.floor(frame / JET_EVERY);
    k * JET_EVERY > frame - flightF;
    k--
  ) {
    const age = (frame - k * JET_EVERY) / flightF;
    if (age > on) continue;
    const R = (s: string) => random(`${seed}-j${k}-${s}`);
    // a slight fan across the jet, wider toward the landing; the path sags a little under gravity
    const across = (R("a") - 0.5) * 0.22 * age * ppm;
    const sag = 0.05 * ppm * Math.sin(Math.PI * age);
    puffs.push({
      x: from.x + dx * age + nx * across,
      y: from.y + dy * age + ny * across + sag,
      r:
        (0.025 + 0.06 * age) *
        ppm *
        (0.8 + 0.4 * R("r")) *
        Math.min(1, age / 0.08),
      op: 1,
    });
  }
  // the billow where it lands: puffs swelling and drifting up and back, then thinning out
  const lifeF = BILLOW_LIFE * 60;
  for (
    let k = Math.floor(frame / BILLOW_EVERY);
    k * BILLOW_EVERY > frame - lifeF;
    k--
  ) {
    const age = (frame - k * BILLOW_EVERY) / lifeF;
    if (age > on) continue;
    const R = (s: string) => random(`${seed}-b${k}-${s}`);
    const ang = (R("d") - 0.5) * 2.4 - Math.PI / 2; // mostly up
    const dist = (0.15 + 0.45 * R("s")) * age * ppm;
    const wob = Math.sin(age * 4 + k) * 0.03 * ppm;
    puffs.push({
      x: to.x + Math.cos(ang) * dist + (dx / len) * 0.12 * ppm * age + wob,
      y: to.y + Math.sin(ang) * dist - 0.25 * ppm * age * age,
      // swells, then shrinks away as it thins out (no see-through ink rims)
      r:
        (0.07 + 0.11 * age) *
        ppm *
        (0.75 + 0.5 * R("r")) *
        Math.min(1, age / 0.1) *
        (age > 0.6 ? Math.max(0, (1 - age) / 0.4) : 1),
      op: 1,
    });
  }
  // one ink outline round the whole cloud: every puff's ink disc first, then the powder over them, then the shade
  const lw = Math.max(1.5, Math.min(3, ppm * 0.012));
  return (
    <g>
      <defs>
        <TonePattern id={`${id}-dots`} r={1.05} gap={6} />
      </defs>
      {puffs.map((p, i) => (
        <circle
          key={`i${i}`}
          cx={p.x}
          cy={p.y}
          r={p.r + lw}
          fill={INK}
          opacity={p.op}
        />
      ))}
      {puffs.map((p, i) => (
        <circle
          key={`f${i}`}
          cx={p.x}
          cy={p.y}
          r={p.r}
          fill={POWDER}
          opacity={p.op}
        />
      ))}
      {puffs.map((p, i) => (
        // the dot screen on the lower half: each puff's shade
        <path
          key={`d${i}`}
          d={`M ${p.x - p.r * 0.92} ${p.y + p.r * 0.25} A ${p.r * 0.92} ${p.r * 0.92} 0 0 0 ${p.x + p.r * 0.92} ${p.y + p.r * 0.25} Z`}
          fill={`url(#${id}-dots)`}
          opacity={0.75 * p.op}
        />
      ))}
    </g>
  );
};
