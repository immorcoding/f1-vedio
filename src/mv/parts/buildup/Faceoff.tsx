// Shot 4.2 (bars 76–79): VER and HAM eye to eye across the split, tied on points. The panels slam in on 76.1 together
// with the points box (369.5 · 369.5, a tie: no leader mark); the camera pushes in one step on every downbeat — the
// whole cockpit on 76, then closer on 77, 78 and 79 until the visors fill the panels — and creeps on between the steps,
// so the frame never sits still under the riser. On the `buildup.tied` cue (78.1) the points box flashes once.
import { Faceoff as FaceoffPage } from "../../../scenes/abu-dhabi-2021/Faceoff";
import { scoreColumns } from "../../points";
import { at } from "../../timing.ts";
import {
  hit,
  ramp,
  secondsInShot,
  type ShotTime,
} from "../abuDhabi2021/shotClock";

// Zoom on each bar of the shot (1 = the whole cockpit, the 5.7 framing).
const STEPS = [1, 1.45, 2.05, 2.85];
const STEP_BARS = [76, 77, 78, 79];
const SNAP = 0.16; // seconds each push takes

export const FaceoffShot: React.FC<{ st: ShotTime }> = ({ st }) => {
  const { t, dur } = st;
  const tied = secondsInShot(st, at(78));
  const starts = STEP_BARS.map((b) => secondsInShot(st, at(b)));
  const rise = ramp(t, 0, dur);
  let zoom = STEPS[0];
  let kick = 0;
  for (let i = 1; i < STEPS.length; i++) {
    zoom += (STEPS[i] - STEPS[i - 1]) * ramp(t, starts[i], starts[i] + SNAP);
    kick += hit(t, starts[i], 0.12);
  }
  // the creep between steps: about 5 % over each bar
  const bar = starts[1] - starts[0];
  const inBar = (t - starts[Math.max(0, starts.filter((s) => t >= s).length - 1)]) / bar;
  zoom *= 1 + 0.05 * Math.min(1, Math.max(0, inBar));
  return (
    <FaceoffPage
      t={t}
      open={ramp(t, -0.1, 0.14)}
      speed={0.25 + 0.75 * rise}
      shake={1 + 5 * rise * rise + 6 * kick + 8 * hit(t, tied, 0.15)}
      ver={{}}
      ham={{}}
      zoom={zoom}
      points={{ columns: scoreColumns("abuDhabiBefore"), since: t + 0.04 }}
      boxFlash={hit(t, tied, 0.14)}
      flash={0.18 * hit(t, tied, 0.06)}
    />
  );
};
