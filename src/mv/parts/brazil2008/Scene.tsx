// Picture for 巴西 2008 (bars 33–56): 2.1 title card, 2.2 HAM in the rain on the last lap ("HAM NEEDS P5"), 2.3 split
// panels (MAS wins, the Ferrari garage celebrates; HAM sixth behind VET), 2.4 the final sector from above (GLO on dry
// tyres), 2.5 HAM passes GLO at Junção in slow motion (47.1; tags flip 47.3), then on 49.1 cuts to real time from
// above as HAM pulls away (PullAway), 2.6 HAM crosses the
// line fifth (52.1, chequered-flag inset), 2.7 the title: the points slam to 98 · 97 (53.1), then
// LEWIS HAMILTON / 2008 / WORLD / CHAMPION slam in on the beats of bar 54 beside HAM's helmet.
import { AbsoluteFill } from "remotion";
import { useSongFrame } from "../../clock";
import type { SceneProps } from "../../scenes";
import { shotAt, type ShotTime } from "../abuDhabi2021/shotClock";
import { Champion } from "./Champion";
import { Chase } from "./Chase";
import { Juncao } from "./Juncao";
import { Line } from "./Line";
import { Pass } from "./Pass";
import { PullAway } from "./PullAway";
import { EDIT } from "./shots.ts";
import { PASS_SLOW_UNTIL } from "./staging.ts";
import { Split } from "./Split";
import { Title } from "./Title";

const SHOTS: Record<string, React.FC<{ st: ShotTime }>> = {
  "2.1": Title,
  "2.2": Chase,
  "2.3": Split,
  "2.4": Juncao,
  // 2.5 cuts inside the shot on its real-time cue (49.1): side-on slow motion, then the plan view
  "2.5": ({ st }) =>
    st.t >= PASS_SLOW_UNTIL ? <PullAway st={st} /> : <Pass st={st} />,
  "2.6": Line,
  "2.7": Champion,
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
