// Picture for 巴林 2020 (bars 57–73), treatment shots 3.1–3.6: title map, the touch on the top-view map, the impact in
// slow motion (rails tearing, the car breaking in two, the fireball) frozen into an impact star on the music's stop, the
// wreck and the fire under the heartbeat, the 27 seconds in four panels, GRO walking out of the fire, and the
// scorched halo under the tagline, fading to black into the buildup. Shot timing comes from shots.ts; facts on screen from docs/production/facts.md.
import { AbsoluteFill } from "remotion";
import type { FirePaletteName } from "../../../kit/fire";
import { useSongFrame } from "../../clock";
import type { SceneProps } from "../../scenes";
import { FIRE_PALETTE, cueFrame, shotById } from "./common";
import { CrashMap } from "./CrashMap";
import { Escape } from "./Escape";
import { Impact } from "./Impact";
import { TitleMap } from "./TitleMap";
import { HaloFinale } from "./HaloFinale";
import { Stopwatch } from "./Stopwatch";
import { Timeline27 } from "./Timeline27";
import { WreckShot } from "./Wreck";

const SHOTS = [
  { id: "3.1", Picture: TitleMap },
  { id: "3.2", Picture: CrashMap },
  { id: "3.3", Picture: Impact },
  { id: "3.4", Picture: WreckShot },
  { id: "3.5", Picture: Timeline27 },
  { id: "3.6", Picture: Escape },
].map((s) => ({ ...s, ...shotById(s.id) }));

// The part's picture at a song frame, in a given fire palette (the review stills render both palettes).
export const BahrainPicture: React.FC<{
  f: number;
  palette: FirePaletteName;
}> = ({ f, palette }) => {
  const shot =
    SHOTS.find((s) => f >= s.from && f < s.to) ?? SHOTS[SHOTS.length - 1];
  // the last two bars of 3.6, from 72.1 to the black on 74.1, are the scorched halo and the tagline
  const finale =
    f >= cueFrame("bahrain2020.halo") && f < cueFrame("bahrain2020.black");
  const Picture = finale ? HaloFinale : shot.Picture;
  return (
    <AbsoluteFill style={{ backgroundColor: "#0d0d0d" }}>
      <Picture f={f} palette={palette} />
      {/* the 27-second stopwatch over 3.5 and into 3.6, above the heat haze */}
      <Stopwatch f={f} />
    </AbsoluteFill>
  );
};

export const Scene: React.FC<SceneProps> = ({ part }) => {
  const f = useSongFrame(part);
  return <BahrainPicture f={f} palette={FIRE_PALETTE} />;
};
