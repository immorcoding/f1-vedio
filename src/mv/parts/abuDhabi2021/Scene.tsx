// Picture for 阿布扎比 2021 (bars 82–105). The run to T5 cuts its viewpoint every one or two bars (staging.ts is the
// race clock under all of them): 5.1 the drop slam from above (82), 5.1b wheel level in the tow (83), 5.1c low-angle
// tracking, VER pulls out (84–85), 5.1d wheel to wheel from above (86), 5.1e helmet panels (87), 5.2 T5 from above, braking (88–89)
// with HAM's mirror (the 2008 pass, six frames) before the cut; then 5.3 the settled T5 panel (lock-up at 90.1), 5.4
// the tow down the back straight, 5.5 the map run to the flag, 5.6 the finish (100.1), 5.7 the points (102.1), 5.8
// the champion photo card (104.1).
import { AbsoluteFill } from "remotion";
import { T5Panel } from "../../../scenes/abu-dhabi-2021/T5Panel";
import { useSongFrame } from "../../clock";
import type { SceneProps } from "../../scenes";
import { ChampionCard } from "./ChampionCard";
import { Charge } from "./Charge";
import { Finish } from "./Finish";
import { Helmets } from "./Helmets";
import { MIRROR_FROM, MirrorFlash } from "./MirrorFlash";
import { Points } from "./Points";
import { shotAt, type ShotTime } from "./shotClock";
import { EDIT } from "./shots.ts";
import { Slam } from "./Slam";
import { sinceDrop } from "./staging.ts";
import { T5Top } from "./T5Top";
import { ToFinish } from "./ToFinish";
import { TopSlice } from "./TopSlice";
import { Tow } from "./Tow";
import { WheelLevel } from "./WheelLevel";

// Shot 5.3 is the settled frame on its first frame (t = 0), then animates.
const Lockup: React.FC<{ st: ShotTime }> = ({ st }) => <T5Panel t={st.t} />;

const SHOTS: Record<string, React.FC<{ st: ShotTime; t0: number }>> = {
  "5.1": Slam,
  "5.1b": WheelLevel,
  "5.1c": Charge,
  "5.1d": TopSlice,
  "5.1e": Helmets,
  "5.2": T5Top,
  "5.3": Lockup,
  "5.4": Tow,
  "5.5": ToFinish,
  "5.6": Finish,
  "5.7": Points,
  "5.8": ChampionCard,
};

export const Scene: React.FC<SceneProps> = ({ part }) => {
  const f = useSongFrame(part);
  const st = shotAt(EDIT, f);
  const Shot = SHOTS[st.shot.id];
  const mirror = st.shot.id === "5.2" && f >= MIRROR_FROM;
  return (
    <AbsoluteFill style={{ backgroundColor: "#0d0d0d" }}>
      {mirror ? <MirrorFlash f={f} /> : <Shot st={st} t0={sinceDrop(st.shot.from)} />}
    </AbsoluteFill>
  );
};
