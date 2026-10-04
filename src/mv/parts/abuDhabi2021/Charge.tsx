// Shot 5.1 (bars 82–85): the drop. Full speed up the straight to T5, the camera tracking at ~290 km/h. VER's nose is
// in HAM's gearbox, riding the slipstream; on 84.1 he pulls out to the inside (farther from the camera) and draws up
// alongside by the cut. The drop itself (82.1) lands as a white flash, focus lines and a jolt.
import { PIRELLI_2021, RB16B, W12 } from "../../../cars";
import { INK, PAPER } from "../../../kit/colors";
import { focusLines } from "../../../kit/lines";
import { Closeup, Slipstream, trackLayout } from "../../../scenes/abu-dhabi-2021/Closeup";
import { T5_CAM } from "../../../scenes/abu-dhabi-2021/T5Panel";
import { at } from "../../timing.ts";
import { hit, ramp, secondsInShot, type ShotTime } from "./shotClock";

const cam = T5_CAM;
const V = 80; // m/s
const LAYOUT = trackLayout(-60, 680, { x0: 250, x1: 330, z: 640, top: 38 });

export const Charge: React.FC<{ st: ShotTime }> = ({ st }) => {
  const { t, dur } = st;
  const out = secondsInShot(st, at(84)); // VER pulls out of the tow
  const camX = V * t;
  const pull = ramp(t, out - 0.2, out + 0.9);
  const draw = ramp(t, out + 0.4, dur);
  const hamX = -2.5 + 0.15 * Math.sin(t * 2.1);
  const verX = -8.6 + 1.2 * ramp(t, 0, out) + 3.4 * draw;
  const verZ = 10.2 + 2.3 * pull;
  const drop = hit(t, 0, 0.25);
  const ham = cam.anchor({ x: hamX, z: 10 });
  const wheel = t * 720;
  return (
    <Closeup
      cam={cam}
      layout={LAYOUT}
      camX={camX}
      seed={Math.floor(t * 20)}
      speed={1}
      tilt={-3 - 2 * drop}
      shake={{ x: Math.sin(t * 61) * (3 + 14 * drop), y: Math.cos(t * 53) * (2 + 10 * drop) }}
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
          z: 10,
          state: { wheelAngle: wheel + 17, compound: PIRELLI_2021.hard },
        },
      ]}
      between={
        <Slipstream at={ham} t={t} length={5 + 2 * (1 - pull)} strength={1 - 0.6 * pull} />
      }
    >
      <path
        d={focusLines(1000, 560, 620 - 200 * drop, 120, Math.floor(t * 12))}
        fill={INK}
        opacity={0.25 + 0.6 * drop}
      />
      <rect width={1920} height={1080} fill={PAPER} opacity={0.9 * drop} />
    </Closeup>
  );
};
