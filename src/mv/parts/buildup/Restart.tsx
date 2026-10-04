// Shot 4.3 (bars 79–80): the end of the last safety-car lap. A tight side close-up, the two cars one behind the other
// in depth: HAM fills the frame on the near line, VER's nose weaves at his gearbox from just beyond — VER on new softs
// (red bands), HAM on old hards (white bands). Top right, the safety car's amber roof lamps blink on the beat and go
// out on the `buildup.scLightsOut` cue (80.1); bottom right, for the first bar, why the safety car was out: Latifi's
// crash at turn 14 (STO-7 easter egg). HAM backs the pair up, VER closes to inches, then both floor it and the speed
// lines build to the drop (the cut at 81.1).
import { PIRELLI_2021, RB16B, W12 } from "../../../cars";
import { INK, PAPER } from "../../../kit/colors";
import { Caption } from "../../../kit/lettering";
import { focusLines } from "../../../kit/lines";
import { Closeup, trackLayout } from "../../../scenes/abu-dhabi-2021/Closeup";
import { LatifiCrash } from "../../../scenes/abu-dhabi-2021/LatifiCrash";
import { SafetyCarLights } from "../../../scenes/abu-dhabi-2021/SafetyCarLights";
import { T5_CAM } from "../../../scenes/abu-dhabi-2021/T5Panel";
import { FPS, FRAMES_PER_BEAT, at } from "../../timing.ts";
import { ramp, secondsInShot, type ShotTime } from "../abuDhabi2021/shotClock";

const cam = T5_CAM;
const LAYOUT = trackLayout(-50, 250, { x0: 60, x1: 122, z: 520, top: 30 });
const SC = { x: 1290, y: 70, w: 560, h: 330 };
const EGG = { x: 1420, y: 640, w: 430, h: 360 };
const BEAT = FRAMES_PER_BEAT / FPS;

export const Restart: React.FC<{ st: ShotTime }> = ({ st }) => {
  const { t, dur } = st;
  const off = secondsInShot(st, at(80));
  const go = off + 0.9; // HAM floors it
  const a = 14;
  const camX = 22 * t + (t > go ? 0.5 * a * (t - go) * (t - go) : 0);
  const launch = ramp(t, go, dur);
  const close = ramp(t, off, go); // HAM backs up, VER closes in
  const weave = t < go ? Math.sin(t * 5.5) * 0.45 * (1 - close) : 0;
  const hamX = -1.2 - 0.5 * close + 0.6 * launch;
  // VER's nose: 1.4 m off HAM's rear wing, then right on it
  const verX = hamX - 5.6 - 1.4 + 1.15 * close - 0.3 * launch;
  const beat = Math.floor(t / BEAT);
  const lit = t < off ? (beat % 2 === 0 ? [1, 0] : [0, 1]) : [0, 0];
  const pulse = t < off ? Math.max(0, 1 - ((t / BEAT) % 1) * 2.5) : 0;
  const wheel = camX * 40;
  const egg = ramp(t, 0, 0.15) * (1 - ramp(t, off - 0.12, off));
  const tension = 0.15 + 0.35 * close + 0.5 * launch;
  return (
    <Closeup
      cam={cam}
      layout={LAYOUT}
      camX={camX}
      seed={Math.floor(t * 15)}
      speed={0.12 + 0.88 * launch}
      tilt={-3 - 2 * close}
      shake={{
        x: Math.sin(t * 50) * (1 + 7 * launch),
        y: Math.cos(t * 43) * (1 + 5 * launch),
      }}
      cars={[
        {
          car: RB16B,
          x: verX,
          z: 12.2 + weave,
          state: { wheelAngle: wheel, compound: PIRELLI_2021.soft, tilt: 0.6 * launch },
        },
        {
          car: W12,
          x: hamX,
          z: 10,
          state: { wheelAngle: wheel + 30, compound: PIRELLI_2021.hard, tilt: 0.6 * launch },
        },
      ]}
    >
      <path
        d={focusLines(560, 640, 520 - 140 * tension, 120, Math.floor(t * 10))}
        fill={INK}
        opacity={0.12 + 0.35 * tension}
      />
      <defs>
        <clipPath id="sc-inset">
          <rect x={SC.x} y={SC.y} width={SC.w} height={SC.h} />
        </clipPath>
      </defs>
      <g clipPath="url(#sc-inset)">
        <SafetyCarLights
          x={SC.x}
          y={SC.y}
          left={lit[0] * (0.6 + 0.4 * pulse)}
          right={lit[1] * (0.6 + 0.4 * pulse)}
        />
      </g>
      <rect x={SC.x} y={SC.y} width={SC.w} height={SC.h} fill="none" stroke={INK} strokeWidth={9} />
      {egg > 0 ? (
        <g
          opacity={Math.min(1, egg * 1.5)}
          transform={`translate(${(1 - egg) * 480} 0)`}
        >
          <LatifiCrash x={EGG.x} y={EGG.y} w={EGG.w} h={EGG.h} t={t} />
        </g>
      ) : null}
      <Caption x={90} y={80} lines={["LAP 58"]} size={56} />
      {/* the white builds toward the drop */}
      <rect x={0} y={0} width={1920} height={1080} fill={PAPER} opacity={0.85 * ramp(t, dur - 0.22, dur)} />
    </Closeup>
  );
};
