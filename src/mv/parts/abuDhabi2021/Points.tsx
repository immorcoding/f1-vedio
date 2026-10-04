// Shot 5.7 (bars 102–105): the final points. The face-off page from 4.2 returns with the result: on the cut
// (102.1, `abuDhabi2021.points`) the points box slams in — VER 395.5 · HAM 387.5 (facts.md) — and on 102.2
// (`abuDhabi2021.pointsGold`) the gold under-stroke lands on VER's 395.5; then VER's panel widens and HAM's recedes
// under a screen of dots while the lines keep drifting.
import { Faceoff } from "../../../scenes/abu-dhabi-2021/Faceoff";
import { scoreColumns } from "../../points";
import { EDIT } from "./shots.ts";
import { cueAt, hit, ramp, secondsInShot, type ShotTime } from "./shotClock";

export const Points: React.FC<{ st: ShotTime }> = ({ st }) => {
  const { t, dur } = st;
  const win = ramp(t, 0.5, 2.2);
  const gold = secondsInShot(st, cueAt(EDIT, "abuDhabi2021.pointsGold"));
  return (
    <Faceoff
      t={t}
      open={1}
      speed={0.6 - 0.4 * ramp(t, 1, dur)}
      shake={14 * hit(t, 0, 0.18)}
      ver={{ weight: 1 + 0.3 * win }}
      ham={{ weight: 1 - 0.3 * win }}
      points={{
        columns: scoreColumns("abuDhabiFinal"),
        since: t,
        goldSince: t - gold,
      }}
      flash={0.5 * hit(t, 0, 0.1)}
    />
  );
};
