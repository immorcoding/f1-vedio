// Picture for 巴西 2008 (bars 33–56): 2.1 title card, 2.2 HAM in the rain on the last lap, 2.3 split panels (MAS
// wins, the Ferrari garage celebrates; HAM sixth behind VET), 2.4 the final sector from above (GLO on dry tyres),
// 2.5 HAM passes GLO at Junção (47.1), 2.6 HAM crosses the line fifth, 2.7 the points flip to 98 · 97 (53.1).
import { AbsoluteFill } from "remotion";
import { useSongFrame } from "../../clock";
import type { SceneProps } from "../../scenes";
import { shotAt, type ShotTime } from "../abuDhabi2021/shotClock";
import { Chase } from "./Chase";
import { Juncao } from "./Juncao";
import { Line } from "./Line";
import { Pass } from "./Pass";
import { Points } from "./Points";
import { EDIT } from "./shots.ts";
import { Split } from "./Split";
import { Title } from "./Title";

const SHOTS: Record<string, React.FC<{ st: ShotTime }>> = {
  "2.1": Title,
  "2.2": Chase,
  "2.3": Split,
  "2.4": Juncao,
  "2.5": Pass,
  "2.6": Line,
  "2.7": Points,
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
