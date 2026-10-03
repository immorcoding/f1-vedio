// Picture for 蓄力 (bars 73–80): 4.1 title card, 4.2 VER/HAM face-off, 4.3 safety car in, both cars launch to the drop.
import { AbsoluteFill } from "remotion";
import { useSongFrame } from "../../clock";
import type { SceneProps } from "../../scenes";
import { shotAt } from "../abuDhabi2021/shotClock";
import { FaceoffShot } from "./Faceoff";
import { Restart } from "./Restart";
import { EDIT } from "./shots.ts";
import { TitleCard } from "./TitleCard";

const SHOTS: Record<string, React.FC<{ st: ReturnType<typeof shotAt> }>> = {
  "4.1": TitleCard,
  "4.2": FaceoffShot,
  "4.3": Restart,
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
