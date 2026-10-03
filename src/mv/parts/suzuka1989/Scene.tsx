// Picture for 铃鹿 1989 (bars 9–20), treatment shots 1.1–1.4: the title map, the two McLarens side by side with the
// helmet panels, the chicane from above on lap 47, and the crash on 19.1 with the push-start easter egg. Shot timing
// comes from shots.ts; facts on screen from docs/production/facts.md.
import { AbsoluteFill } from "remotion";
import { useSongFrame } from "../../clock";
import type { SceneProps } from "../../scenes";
import { Chicane } from "./Chicane";
import { shotById, type PictureProps } from "./common";
import { Crash } from "./Crash";
import { Pair } from "./Pair";
import { Title } from "./Title";

const SHOTS: { id: string; Picture: React.FC<PictureProps> }[] = [
  { id: "1.1", Picture: Title },
  { id: "1.2", Picture: Pair },
  { id: "1.3", Picture: Chicane },
  { id: "1.4", Picture: Crash },
];
const TIMED = SHOTS.map((s) => ({ ...s, ...shotById(s.id) }));

// The part's picture at a song frame (also used by review stills).
export const Suzuka1989Picture: React.FC<PictureProps> = ({ f }) => {
  const shot =
    TIMED.find((s) => f >= s.from && f < s.to) ?? TIMED[TIMED.length - 1];
  return (
    <AbsoluteFill style={{ backgroundColor: "#fbfaf6" }}>
      <shot.Picture f={f} />
    </AbsoluteFill>
  );
};

export const Scene: React.FC<SceneProps> = ({ part }) => {
  const f = useSongFrame(part);
  return <Suzuka1989Picture f={f} />;
};
