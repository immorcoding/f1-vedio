// Picture for 阿布扎比 2021 (bars 82–105): 5.1 the charge to T5, 5.2 T5 from above, 5.3 the settled T5 panel (lock-up
// at 90.1), 5.4 the tow down the back straight, 5.5 the map run to the flag, 5.6 the finish (100.1), 5.7 the points (102.1), 5.8 the champion photo card (104.1).
import { AbsoluteFill } from "remotion";
import { T5Panel } from "../../../scenes/abu-dhabi-2021/T5Panel";
import { useSongFrame } from "../../clock";
import type { SceneProps } from "../../scenes";
import { ChampionCard } from "./ChampionCard";
import { Charge } from "./Charge";
import { Finish } from "./Finish";
import { Points } from "./Points";
import { shotAt, type ShotTime } from "./shotClock";
import { EDIT } from "./shots.ts";
import { T5Top } from "./T5Top";
import { ToFinish } from "./ToFinish";
import { Tow } from "./Tow";

// Shot 5.3 is the settled frame on its first frame (t = 0), then animates.
const Lockup: React.FC<{ st: ShotTime }> = ({ st }) => <T5Panel t={st.t} />;

const SHOTS: Record<string, React.FC<{ st: ShotTime }>> = {
  "5.1": Charge,
  "5.2": T5Top,
  "5.3": Lockup,
  "5.4": Tow,
  "5.5": ToFinish,
  "5.6": Finish,
  "5.7": Points,
  "5.8": ChampionCard,
};

export const Scene: React.FC<SceneProps> = ({ part }) => {
  const st = shotAt(EDIT, useSongFrame(part));
  const Shot = SHOTS[st.shot.id];
  return (
    <AbsoluteFill style={{ backgroundColor: "#0d0d0d" }}>
      <Shot st={st} />
    </AbsoluteFill>
  );
};
