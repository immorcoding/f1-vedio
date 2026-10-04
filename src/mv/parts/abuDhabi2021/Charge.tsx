// Shot 5.1c (bars 84–85): low-angle tracking. The camera drops to 1.1 m and tilts harder than the broadcast close-ups,
// tracking at the cars' true speed (staging.ts) so the road, wall and stands stream past with parallax. VER sits in
// HAM's gearbox; on 84.1 (`abuDhabi2021.pullOut`) he pulls out to the inside (away from the camera) with a jolt and a
// burst of focus lines, and draws up until his front wheels are level with HAM's rear wheels by the cut.
import { PIRELLI_2021, RB16B, W12 } from "../../../cars";
import { pinhole } from "../../../kit/camera";
import { INK } from "../../../kit/colors";
import { focusLines, speedLines } from "../../../kit/lines";
import { tone } from "../../../kit/tone";
import { Closeup, Slipstream, trackLayout } from "../../../scenes/abu-dhabi-2021/Closeup";
import { hit, type ShotTime } from "./shotClock";
import { hamDist, PULL_OUT, sidePlan } from "./staging.ts";

const cam = pinhole({ f: 2500, horizon: 300, cx: 960, height: 1.1 });
const LAYOUT = trackLayout(-200, 1400, { x0: 250, x1: 330, z: 640, top: 38 });
const HAM_X = -1.2;

export const Charge: React.FC<{ st: ShotTime; t0: number }> = ({ st, t0 }) => {
  const { t } = st;
  const race = t0 + t;
  const camX = hamDist(race);
  const plan = sidePlan(race, HAM_X);
  const pull = hit(race, PULL_OUT, 0.35);
  const ham = cam.anchor(plan.ham);
  const wheel = t * 900;
  const seed = st.frame >> 1;
  return (
    <Closeup
      cam={cam}
      layout={LAYOUT}
      camX={camX}
      seed={seed}
      speed={1}
      tilt={-6 - 1.5 * pull}
      shake={{ x: Math.sin(t * 61) * (3 + 12 * pull), y: Math.cos(t * 53) * (2 + 8 * pull) }}
      under={
        <g>
          <path d={cam.groundQuad(2, 8.6, -400, 400)} fill={tone("light")} />
          <path
            d={speedLines({
              x: -300,
              y: cam.screenY(0, 8.6),
              w: 2600,
              h: 1200 - cam.screenY(0, 8.6),
              n: 30,
              seed: `ch-near-${seed}`,
              angle: 180,
              thickness: 8,
              length: [0.3, 0.8],
            })}
            fill={INK}
            opacity={0.75}
          />
        </g>
      }
      cars={[
        {
          car: RB16B,
          ...plan.ver,
          state: { wheelAngle: wheel, compound: PIRELLI_2021.soft },
        },
        {
          car: W12,
          ...plan.ham,
          state: { wheelAngle: wheel + 17, compound: PIRELLI_2021.hard },
        },
      ]}
      between={
        <Slipstream
          at={ham}
          t={t}
          length={6}
          strength={race < PULL_OUT ? 1 : Math.max(0.25, 1 - (race - PULL_OUT) * 0.8)}
        />
      }
    >
      <path
        d={focusLines(1000, 560, 640 - 220 * pull, 120, seed)}
        fill={INK}
        opacity={0.22 + 0.6 * pull}
      />
    </Closeup>
  );
};
