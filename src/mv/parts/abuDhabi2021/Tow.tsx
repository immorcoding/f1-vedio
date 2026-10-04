// Shot 5.4 (bars 92–95): out of T5 and down the back straight. HAM tucks into VER's slipstream, pulls out on 93.3 and
// draws alongside; VER edges over to cover the inside and holds; by the cut HAM has dropped back into his wake.
// (facts.md: "Hamilton chased Verstappen on the run to Turn 9 but the Red Bull defended the inside".)
import { PIRELLI_2021, RB16B, W12 } from "../../../cars";
import { INK } from "../../../kit/colors";
import { focusLines } from "../../../kit/lines";
import { Closeup, Slipstream, trackLayout } from "../../../scenes/abu-dhabi-2021/Closeup";
import { T5_CAM } from "../../../scenes/abu-dhabi-2021/T5Panel";
import { at } from "../../timing.ts";
import { ramp, secondsInShot, type ShotTime } from "./shotClock";

const cam = T5_CAM;
const LAYOUT = trackLayout(-60, 760, { x0: 560, x1: 640, z: 700, top: 38 });

export const Tow: React.FC<{ st: ShotTime }> = ({ st }) => {
  const { t, dur } = st;
  const pullOut = secondsInShot(st, at(93, 3));
  const alongside = secondsInShot(st, at(94, 3));
  const camX = 70 * t + 2.2 * t * t;
  const out = ramp(t, pullOut, pullOut + 0.7);
  const gain = ramp(t, pullOut + 0.2, alongside);
  const fade = ramp(t, alongside + 0.5, dur);
  const verX = -1.6;
  const verZ = 11.6 - 0.7 * ramp(t, pullOut + 0.4, alongside); // edging over to cover
  const hamX = verX - 6.4 + 4.6 * gain - 4.2 * fade;
  const hamZ = 11.7 - 2.5 * out + 0.6 * fade;
  const ver = cam.anchor({ x: verX, z: verZ });
  const wheel = t * 720;
  return (
    <Closeup
      cam={cam}
      layout={LAYOUT}
      camX={camX}
      seed={Math.floor(t * 20)}
      speed={0.9}
      tilt={-2 + 2 * gain - 1.5 * fade}
      shake={{ x: Math.sin(t * 59) * 3, y: Math.cos(t * 47) * 2 }}
      cars={[
        {
          car: RB16B,
          x: verX,
          z: verZ,
          state: { wheelAngle: wheel, compound: PIRELLI_2021.soft },
        },
        {
          car: W12,
          x: hamX,
          z: hamZ,
          state: { wheelAngle: wheel + 23, compound: PIRELLI_2021.hard },
        },
      ]}
      between={
        hamZ > verZ ? null : (
          <Slipstream at={ver} t={t} length={6.5} strength={1 - 0.5 * out} />
        )
      }
      over={
        hamZ > verZ ? (
          <Slipstream at={ver} t={t} length={6.5} strength={1} />
        ) : null
      }
    >
      <path
        d={focusLines(960 + 300 * gain, 560, 640, 110, Math.floor(t * 12))}
        fill={INK}
        opacity={0.2 + 0.35 * gain * (1 - fade)}
      />
    </Closeup>
  );
};
