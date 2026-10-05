// Shot 5.4 (bars 92–95): out of T5 and down the back straight, on the plan in staging.ts (`towPlan`). HAM tucks into
// VER's slipstream, pulls out on 93.3 and draws up to half a car behind on 94.3 while VER holds the inside, then
// drops back into his wake. (facts.md: "Hamilton chased Verstappen on the run to Turn 9 but the Red Bull defended
// the inside".)
// Two viewpoints, cut on 94.1 so the four bars keep the drop's 1–2 bar rhythm:
// - 92.1–94.1, the wide side camera (the 5.3 camera pulled back): both cars whole in frame, VER ahead, HAM in the tow
//   with the slipstream lines between them, then pulling out toward the camera.
// - 94.1–96.1, a long lens from 25 m further back: HAM, the near car on the outside, is ~8 % larger and sits lower
//   than VER on the inside, the cockpits half a car apart. The background is compressed and streams slowly, like the
//   broadcast's long-lens shots.
import { PIRELLI_2021, RB16B, W12 } from "../../../cars";
import { pinhole, type Camera, type CameraSpec } from "../../../kit/camera";
import { INK } from "../../../kit/colors";
import { focusLines } from "../../../kit/lines";
import { tone } from "../../../kit/tone";
import { Closeup, Slipstream, trackLayout } from "../../../scenes/abu-dhabi-2021/Closeup";
import { at, secondsAt } from "../../timing.ts";
import { hit, type ShotTime } from "./shotClock";
import { TOW_TIMES, towPlan } from "./staging.ts";

/** A pinhole camera pulled `back` metres behind the usual one: the world keeps its depths (the trackside module's
 * racing surface at 8.6–13.65 m), the lens sees them from `back` m further away. */
const dollied = (spec: CameraSpec, back: number): Camera => {
  const p = pinhole(spec);
  const screenX = (x: number, z: number) => p.screenX(x, z + back);
  const screenY = (y: number, z: number) => p.screenY(y, z + back);
  const pxPerMetre = (z: number) => p.pxPerMetre(z + back);
  return {
    ...spec,
    screenX,
    screenY,
    pxPerMetre,
    project: ({ x, y = 0, z }) => ({ x: screenX(x, z), y: screenY(y, z) }),
    anchor: ({ x, y = 0, z }) => ({ x: screenX(x, z), y: screenY(y, z), pxPerMetre: pxPerMetre(z) }),
    groundQuad: (z0, z1, x0, x1) =>
      `M ${screenX(x0, z0)} ${screenY(0, z0)} L ${screenX(x1, z0)} ${screenY(0, z0)} L ${screenX(x1, z1)} ${screenY(0, z1)} L ${screenX(x0, z1)} ${screenY(0, z1)} Z`,
  };
};

// Wide: the 5.3 camera height, a shorter lens and the axis shifted so the pair (HAM's rear wing at x −8 to VER's
// nose at +4) fills the panel.
const WIDE = pinhole({ f: 1800, horizon: 300, cx: 1230, height: 2.9 });
// Long lens: 25 m further back and 5 m up; HAM (outside, z 9.6) 173 px/m, VER (inside, z 12.6) 160 px/m.
const LONG = dollied({ f: 6000, horizon: 63, cx: 1000, height: 5 }, 25);

const LAYOUT = trackLayout(-60, 760, { x0: 560, x1: 640, z: 700, top: 38 });
const LAYOUT_LONG = trackLayout(-60, 760);
const CUT = secondsAt(at(94)) - secondsAt(at(92));

export const Tow: React.FC<{ st: ShotTime }> = ({ st }) => {
  const { t } = st;
  const plan = towPlan(t);
  const { ver: v, ham: h, out, gain, fall } = plan;
  const long = t >= CUT;
  const cam = long ? LONG : WIDE;
  // the camera runs with VER: out of T5 at ~250 km/h, pulling up toward 300
  const camX = 70 * t + 2.2 * t * t;
  const wheel = t * 720;
  const verA = cam.anchor({ x: v.x, z: v.z });
  // the cut lands with a jolt; HAM's lunge (93.3) gets a smaller one
  const jolt = 12 * hit(t, CUT, 0.18) + 6 * hit(t, TOW_TIMES.pull, 0.25);
  const lunge = gain * (1 - fall);
  return (
    <Closeup
      cam={cam}
      layout={long ? LAYOUT_LONG : LAYOUT}
      camX={camX}
      seed={Math.floor(t * 20)}
      speed={long ? 0.6 + 0.3 * lunge : 0.9}
      tilt={long ? -1.5 + 1.5 * lunge : -2}
      hotelGlow={long ? 0 : 1}
      // the crowd and the floodlight beams smeared over one frame of camera travel, so they stream instead of strobing
      smear={(70 + 4.4 * t) / 60}
      shake={{ x: Math.sin(t * 59) * (3 + jolt), y: Math.cos(t * 47) * (2 + jolt * 0.6) }}
      under={long ? <path d={cam.groundQuad(1, 6, -40, 40)} fill={tone("light")} /> : null}
      cars={[
        {
          car: RB16B,
          x: v.x,
          z: v.z,
          // the 2.9 m / 5 m cameras look down 7–15°: the HIGH look
          state: { wheelAngle: wheel, compound: PIRELLI_2021.soft, farSide: "high" },
        },
        {
          car: W12,
          x: h.x,
          z: h.z,
          state: { wheelAngle: wheel + 23, compound: PIRELLI_2021.hard, farSide: "high" },
        },
      ]}
      between={
        // VER is the far car: his wake is drawn before HAM, who drives through it
        <Slipstream at={verA} t={t} length={long ? 7 : 6.5} strength={1 - 0.6 * out} />
      }
    >
      <path
        d={focusLines(
          long ? 960 : 960 + 300 * gain,
          long ? 620 : 520,
          long ? 700 : 640,
          110,
          Math.floor(t * 12),
        )}
        fill={INK}
        opacity={0.2 + 0.35 * lunge}
      />
    </Closeup>
  );
};
