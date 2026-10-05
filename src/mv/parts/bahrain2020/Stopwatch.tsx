// The 27-second stopwatch over 3.5 and the start of 3.6 (review 2, idea #1): a small manga stopwatch in the top-right
// corner whose hand jumps on each heartbeat and stops, with a click of the crown, on the times the panels carry (0, 11,
// 27 秒) and once more as GRO steps out. The schedule and why it looks like this are in shots.ts (STOPWATCH).
// Drawn over the picture (Scene.tsx), so it stays outside the heat haze and crisp (ART-22). A 60-second dial with no
// digits: the panels' time labels and 3.6's "27s" are its readout (ART-14: one time on screen at a time).
import { Easing } from "remotion";
import { INK, PAPER } from "../../../kit/colors";
import { ToneDefs, tone } from "../../../kit/tone";
import { frameAt } from "../../timing.ts";
import { ramp } from "./common";
import { STOPWATCH } from "./shots.ts";
import { heartbeat } from "./Wreck";

// the dial in the top-right corner of the frame (clear of every panel's label and of the subjects, 3.5 and 3.6)
const CX = 1792;
const CY = 168;
const R = 66;

const TICKS = STOPWATCH.ticks.map((t) => ({ ...t, f: frameAt(t.at) }));
const FROM = TICKS[0].f;
const OUT = frameAt(STOPWATCH.out);
const JUMP = 4; // frames the hand takes to land on its new second, overshooting a little like a real hand

// the hand's reading at frame f, in seconds
const reading = (f: number) => {
  let prev = 0;
  for (const t of TICKS) {
    if (f < t.f) break;
    const u = Math.min(1, (f - t.f) / JUMP);
    const k = Easing.out(Easing.back(2.2))(u);
    prev = prev + (t.seconds - prev) * k;
    if (u < 1) return prev;
    prev = t.seconds;
  }
  return prev;
};

// frames since the last stop's click (Infinity if none yet)
const sinceStop = (f: number) => {
  let since = Infinity;
  for (const t of TICKS) if ("stop" in t && t.stop && f >= t.f) since = f - t.f;
  return since;
};

const polar = (sec: number, r: number) => {
  const a = (sec / 60) * 2 * Math.PI;
  return { x: CX + Math.sin(a) * r, y: CY - Math.cos(a) * r };
};

export const Stopwatch: React.FC<{ f: number }> = ({ f }) => {
  if (f < FROM || f >= OUT + 12) return null;
  const pop = ramp(f, FROM, FROM + 8);
  const fade = 1 - ramp(f, OUT, OUT + 12);
  const op = pop * fade;
  const scale =
    (0.85 + 0.15 * pop) * (1 - 0.1 * (1 - fade)) * (1 + 0.035 * heartbeat(f));
  const sec = reading(f);
  const click = sinceStop(f);
  const press = click < 7 ? 7 * (1 - click / 7) : 0; // the crown pushed in on a stop
  const rays = click < 12 ? 1 - click / 12 : 0;
  const hand = polar(sec, R * 0.8);
  const tail = polar(sec + 30, R * 0.2);
  // the elapsed time as a screentone sector from 0 to the hand
  const end = polar(Math.max(0.001, sec), R * 0.86);
  const sector =
    sec > 0.05
      ? `M ${CX} ${CY - R * 0.86} A ${R * 0.86} ${R * 0.86} 0 ${sec > 30 ? 1 : 0} 1 ${end.x} ${end.y} L ${CX} ${CY} Z`
      : null;
  return (
    <svg
      viewBox="0 0 1920 1080"
      width={1920}
      height={1080}
      style={{ position: "absolute", inset: 0 }}
    >
      <defs>
        <ToneDefs prefix="b3sw" />
      </defs>
      <g
        opacity={op}
        transform={`translate(${CX} ${CY}) scale(${scale}) rotate(8) translate(${-CX} ${-CY})`}
      >
        {/* the click: short ink strokes flicking off round the crown */}
        {rays > 0
          ? [-38, 0, 38].map((d) => {
              const a = ((d - 0) * Math.PI) / 180;
              const r0 = R + 30 + 6 * (1 - rays);
              const r1 = r0 + 20 * rays + 6;
              const p = (r: number) => ({
                x: CX + Math.sin(a) * r,
                y: CY - Math.cos(a) * r,
              });
              const a0 = p(r0);
              const a1 = p(r1);
              return (
                <path
                  key={d}
                  d={`M ${a0.x} ${a0.y} L ${a1.x} ${a1.y}`}
                  stroke={INK}
                  strokeWidth={6}
                  strokeLinecap="round"
                  opacity={rays}
                />
              );
            })
          : null}
        {/* hard ink shadow, as under the caption boxes */}
        <circle cx={CX + 7} cy={CY + 7} r={R} fill={INK} />
        {/* crown: stem and button (pushed in on a stop), and the side button */}
        <rect
          x={CX - 9}
          y={CY - R - 14}
          width={18}
          height={16}
          fill={PAPER}
          stroke={INK}
          strokeWidth={4}
        />
        <rect
          x={CX - 18}
          y={CY - R - 30 + press}
          width={36}
          height={14}
          rx={3}
          fill={PAPER}
          stroke={INK}
          strokeWidth={4}
        />
        <g transform={`rotate(45 ${CX} ${CY})`}>
          <rect
            x={CX - 7}
            y={CY - R - 12}
            width={14}
            height={14}
            rx={2}
            fill={PAPER}
            stroke={INK}
            strokeWidth={4}
          />
        </g>
        <circle
          cx={CX}
          cy={CY}
          r={R}
          fill={PAPER}
          stroke={INK}
          strokeWidth={6}
        />
        {sector ? <path d={sector} fill={tone("mid", "b3sw")} /> : null}
        {/* 60 second marks, every fifth long */}
        {Array.from({ length: 60 }, (_, s) => {
          const long = s % 5 === 0;
          const a = polar(s, R - 6);
          const b = polar(s, R - (long ? 18 : 11));
          return (
            <path
              key={s}
              d={`M ${a.x} ${a.y} L ${b.x} ${b.y}`}
              stroke={INK}
              strokeWidth={long ? 4 : 2}
              strokeLinecap="round"
            />
          );
        })}
        <path
          d={`M ${tail.x} ${tail.y} L ${hand.x} ${hand.y}`}
          stroke={INK}
          strokeWidth={6}
          strokeLinecap="round"
        />
        <circle cx={CX} cy={CY} r={8} fill={INK} />
        <circle cx={CX} cy={CY} r={3} fill={PAPER} />
      </g>
    </svg>
  );
};
