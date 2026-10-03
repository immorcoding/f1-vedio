// Picture for 铃鹿 1990 (bars 21–32), treatment shots 1.5–1.8: the page turn to 1990, the start and the run to Turn 1
// from above (with the dirty-side pole easter egg), the crash on 27.1, and the two champions' helmets. Shot timing
// comes from shots.ts, car positions from staging.ts; facts on screen from docs/production/facts.md.
import { AbsoluteFill } from "remotion";
import { useSongFrame } from "../../clock";
import type { SceneProps } from "../../scenes";
import { shotById, type PictureProps } from "./common";
import { Crash } from "./Crash";
import { Settle } from "./Settle";
import { Start } from "./Start";
import { Title } from "./Title";

const SHOTS: { id: string; Picture: React.FC<PictureProps> }[] = [
  { id: "1.5", Picture: Title },
  { id: "1.6", Picture: Start },
  { id: "1.7", Picture: Crash },
  { id: "1.8", Picture: Settle },
];
const TIMED = SHOTS.map((s) => ({ ...s, ...shotById(s.id) }));

// The part's picture at a song frame (also used by review stills).
export const Suzuka1990Picture: React.FC<PictureProps> = ({ f }) => {
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
  return <Suzuka1990Picture f={f} />;
};
