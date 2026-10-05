// Shot 4.3 (bars 80–81): the end of the last safety-car lap. A tight side close-up, the two cars one behind the other
// in depth: HAM fills the frame on the near line, VER's nose weaves at his gearbox from just beyond — VER on new softs
// (red bands), HAM on old hards (white bands), spelled out on 80.3 by the caption FRESH SOFTS vs OLD HARDS.
// The insets sit in the top band over the grandstand, clear of both cars' cockpits and HAM's halo (ART-14):
// - top right, the safety car from behind (Aston Martin Vantage, SC IN): its five amber roof lamps, drawn with the
//   intro's start-light lamp, flash in turn through bar 80, all burn on 81.1 like the five red lights, then go out one
//   by one from 81.3 (`buildup.scLightsOut`) on every third thirty-second of the snare roll, the last on 81.4& where the
//   music's one-eighth gap begins — and HAM launches into the silence, so the drop on 82.1 lands like a second start;
// - top middle, for bar 80 only, why the safety car was out (STO-7): a top-down panel of the turn-14 exit, Latifi's
//   Williams losing the rear, spinning and hitting the outside wall on 80.3, stopped across the track (LAP 53).
import { PIRELLI_2021, RB16B, W12 } from "../../../cars";
import { INK } from "../../../kit/colors";
import { Caption } from "../../../kit/lettering";
import { focusLines } from "../../../kit/lines";
import { Closeup, trackLayout } from "../../../scenes/abu-dhabi-2021/Closeup";
import { LATIFI_ASPECT, LatifiCrash } from "../../../scenes/abu-dhabi-2021/LatifiCrash";
import { SC_BOX, SC_LAMPS, SafetyCarRear } from "../../../scenes/abu-dhabi-2021/SafetyCarLights";
import { T5_CAM } from "../../../scenes/abu-dhabi-2021/T5Panel";
import { FPS, FRAMES_PER_BEAT, at } from "../../timing.ts";
import { hit, ramp, secondsInShot, type ShotTime } from "../abuDhabi2021/shotClock";

const cam = T5_CAM;
const LAYOUT = trackLayout(-50, 250, { x0: 60, x1: 122, z: 520, top: 30 });
const SC = { x: 1236, y: 62, w: 620 };
const SC_H = (SC.w * SC_BOX.h) / SC_BOX.w;
const EGG = { x: 392, y: 74, w: 640 };
const EGG_H = EGG.w * LATIFI_ASPECT;
const BEAT = FRAMES_PER_BEAT / FPS;
// The lamps go out three thirty-seconds apart: 81.3, 81.3 + 3/8, … , 81.4& (the start of the gap before the drop).
const OFF_STEP = 0.375 * BEAT;

export const Restart: React.FC<{ st: ShotTime }> = ({ st }) => {
  const { t, dur } = st;
  const allLit = secondsInShot(st, at(81));
  const firstOff = secondsInShot(st, at(81, 3));
  const offAt = Array.from({ length: SC_LAMPS }, (_, i) => firstOff + i * OFF_STEP);
  const go = offAt[SC_LAMPS - 1]; // the last lamp out: HAM floors it
  const tyres = secondsInShot(st, at(80, 3));
  const a = 30;
  const camX = 22 * t + (t > go ? 0.5 * a * (t - go) * (t - go) : 0);
  const launch = ramp(t, go, dur);
  const close = ramp(t, allLit, firstOff); // HAM backs the pair up, VER closes in
  const weave = t < allLit ? Math.sin(t * 5.5) * 0.45 * (1 - close) : 0;
  const hamX = -1.2 - 0.5 * close + 0.4 * launch;
  // VER's nose: 1.4 m off HAM's rear wing, then right on it
  const verX = hamX - 5.6 - 1.4 + 1.15 * close - 0.2 * launch;
  const wheel = camX * 40;

  // the safety car's lamps: alternate on the beat through bar 80, all on at 81.1, out one by one from 81.3
  const beat = Math.floor(t / BEAT);
  const sinceBeat = t - beat * BEAT;
  const lamps = offAt.map((off, i) => {
    if (t >= off) return { on: 0, age: 99 };
    if (t >= allLit) {
      const since = t - allLit;
      return { on: 1 + 0.4 * hit(t, allLit, 0.1), age: since * FPS };
    }
    const lit = (beat + i) % 2 === 0;
    return lit
      ? { on: 0.9 + 0.4 * Math.max(0, 1 - sinceBeat / (0.5 * BEAT)), age: sinceBeat * FPS }
      : { on: 0, age: 99 };
  });
  const lastOut = hit(t, go, 0.08);

  const scIn = ramp(t, 0, 0.18);
  const egg = ramp(t, 0, 0.15) * (1 - ramp(t, allLit - 0.15, allLit));
  const tyreIn = t >= tyres ? Math.min(1, (t - tyres) / 0.1) : 0;
  const tension = 0.15 + 0.35 * close + 0.5 * ramp(t, firstOff, dur);
  return (
    <Closeup
      cam={cam}
      layout={LAYOUT}
      camX={camX}
      seed={Math.floor(t * 15)}
      speed={0.12 + 0.88 * launch}
      tilt={-3 - 2 * close}
      shake={{
        x: Math.sin(t * 50) * (1 + 7 * launch) + 6 * lastOut,
        y: Math.cos(t * 43) * (1 + 5 * launch),
      }}
      cars={[
        {
          car: RB16B,
          x: verX,
          z: 12.2 + weave,
          // the 2.9 m camera looks down ~12°: the HIGH look (ART-26)
          state: { wheelAngle: wheel, compound: PIRELLI_2021.soft, tilt: 0.6 * launch, farSide: "high" },
        },
        {
          car: W12,
          x: hamX,
          z: 10,
          state: { wheelAngle: wheel + 30, compound: PIRELLI_2021.hard, tilt: 0.6 * launch, farSide: "high" },
        },
      ]}
    >
      <path
        d={focusLines(560, 640, 520 - 140 * tension, 120, Math.floor(t * 10))}
        fill={INK}
        opacity={0.12 + 0.35 * tension}
      />
      {/* the safety car, sliding down into the top-right corner */}
      <g opacity={Math.min(1, scIn * 1.5)} transform={`translate(0 ${(1 - scIn) * -SC_H})`}>
        <SafetyCarRear
          x={SC.x}
          y={SC.y}
          w={SC.w}
          on={lamps.map((l) => l.on)}
          age={lamps.map((l) => l.age)}
          t={t}
        />
        <rect x={SC.x} y={SC.y} width={SC.w} height={SC_H} fill="none" stroke={INK} strokeWidth={9} />
        <Caption x={SC.x + 22} y={SC.y + SC_H - 34} lines={["SC IN"]} size={44} />
      </g>
      {egg > 0 ? (
        <g opacity={Math.min(1, egg * 1.5)} transform={`translate(0 ${(1 - egg) * -(EGG_H + 90)})`}>
          <LatifiCrash x={EGG.x} y={EGG.y} w={EGG.w} t={t} />
          <Caption x={EGG.x + 22} y={EGG.y + EGG_H - 14} lines={["LAP 53"]} size={40} />
        </g>
      ) : null}
      <Caption x={90} y={80} lines={["LAP 58"]} size={56} />
      {tyreIn > 0 ? (
        <g
          opacity={tyreIn}
          transform={`translate(960 985) scale(${1.25 - 0.25 * tyreIn}) translate(-960 -985)`}
        >
          <Caption x={960} y={948} lines={["FRESH SOFTS vs OLD HARDS"]} size={44} boxAnchor="middle" />
        </g>
      ) : null}
    </Closeup>
  );
};
