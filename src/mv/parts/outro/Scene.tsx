// Picture for 尾奏 (the last 8 bars): 6.1 the chequered flag sweeps the champion photo away to paper, 6.2 four
// flashback panels (1989/90, 2008, 2020, 2021), 6.3 the family photo of every driver's helmet and the title, fading to
// black.
import { AbsoluteFill } from "remotion";
import { useSongFrame } from "../../clock";
import type { SceneProps } from "../../scenes";
import { shotAt, type ShotTime } from "../abuDhabi2021/shotClock";
import { Family } from "./Family";
import { Flashbacks } from "./Flashbacks";
import { FlagShot } from "./Flag";
import { EDIT } from "./shots.ts";

const SHOTS: Record<string, React.FC<{ st: ShotTime }>> = {
  "6.1": FlagShot,
  "6.2": Flashbacks,
  "6.3": Family,
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
