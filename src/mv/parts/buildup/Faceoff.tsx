// Shot 4.2 (bars 76–79): VER and HAM eye to eye across the split, tied on points. The panels slam in on 76.1, the
// two 369.5s land on the `buildup.tied` cue (78.1), and the riser pushes the speed lines and shake up to the cut.
import { Faceoff as FaceoffPage } from "../../../scenes/abu-dhabi-2021/Faceoff";
import { at } from "../../timing.ts";
import { clamp01, hit, ramp, secondsInShot, type ShotTime } from "../abuDhabi2021/shotClock";

export const FaceoffShot: React.FC<{ st: ShotTime }> = ({ st }) => {
  const { t, dur } = st;
  const tied = secondsInShot(st, at(78));
  const land = clamp01((t - tied) * 6);
  const rise = ramp(t, 0, dur);
  return (
    <FaceoffPage
      t={t}
      open={ramp(t, 0, 0.3)}
      speed={0.25 + 0.75 * rise}
      shake={1 + 5 * rise * rise + 10 * hit(t, tied, 0.15)}
      ver={{ points: "369.5", land }}
      ham={{ points: "369.5", land }}
      dot={land}
      flash={0.7 * hit(t, tied, 0.08)}
    />
  );
};
