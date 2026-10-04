// Picture for 尾奏 (the last 8 bars): 6.1 four flashback panels (1989/90, 2008, 2020, 2021), the first slammed onto
// 5.8's champion photo; 6.2 the chequered flag waves in over the last panel and fills the frame; 6.3 the flag settles,
// the title lands on it on a paper banner, and the frame fades to black. The film ends on the race's end signal.
import { AbsoluteFill } from "remotion";
import { useSongFrame } from "../../clock";
import type { SceneProps } from "../../scenes";
import { shotAt, type ShotTime } from "../abuDhabi2021/shotClock";
import { Flashbacks } from "./Flashbacks";
import { FlagIn, FlagTitle } from "./Flag";
import { EDIT } from "./shots.ts";

const SHOTS: Record<string, React.FC<{ st: ShotTime }>> = {
  "6.1": Flashbacks,
  "6.2": FlagIn,
  "6.3": FlagTitle,
};

export const Scene: React.FC<SceneProps> = ({ part }) => {
  const st = shotAt(EDIT, useSongFrame(part));
  const Shot = SHOTS[st.shot.id];
  return (
    <AbsoluteFill style={{ backgroundColor: "#fbfaf6" }}>
      <Shot st={st} />
    </AbsoluteFill>
  );
};
