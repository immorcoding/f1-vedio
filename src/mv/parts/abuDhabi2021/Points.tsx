// Shot 5.7 (bars 101–104): the final points. The face-off page from 4.2 returns with the result: on the cut
// (101.1, `abuDhabi2021.points`) the numbers slam in — VER 395.5, HAM 387.5 (facts.md) — then VER's panel widens
// and HAM's recedes under a screen of dots while the lines keep drifting.
import { Faceoff } from "../../../scenes/abu-dhabi-2021/Faceoff";
import { clamp01, hit, ramp, type ShotTime } from "./shotClock";

export const Points: React.FC<{ st: ShotTime }> = ({ st }) => {
  const { t, dur } = st;
  const land = clamp01(0.55 + t * 5);
  const win = ramp(t, 0.5, 2.2);
  return (
    <Faceoff
      t={t}
      open={1}
      speed={0.6 - 0.4 * ramp(t, 1, dur)}
      shake={14 * hit(t, 0, 0.18)}
      ver={{ points: "395.5", land, weight: 1 + 0.3 * win }}
      ham={{ points: "387.5", land, weight: 1 - 0.3 * win }}
      dot={land}
      flash={0.5 * hit(t, 0, 0.1)}
    />
  );
};
