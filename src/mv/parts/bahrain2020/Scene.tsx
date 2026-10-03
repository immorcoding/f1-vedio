// Picture for 巴林 2020 (bars 57–72), treatment shots 3.1–3.6: title map, the touch on the top-view map, the impact
// frozen into an impact star on the music's stop, the wreck and the fire under the heartbeat, the halo panels, and GRO
// walking out of the fire. Shot timing comes from shots.ts; facts on screen from docs/production/facts.md.
import { AbsoluteFill } from "remotion";
import type { FirePaletteName } from "../../../kit/fire";
import { useSongFrame } from "../../clock";
import type { SceneProps } from "../../scenes";
import { FIRE_PALETTE, shotById } from "./common";
import { CrashMap } from "./CrashMap";
import { Escape } from "./Escape";
import { Impact } from "./Impact";
import { TitleMap } from "./TitleMap";
import { HaloPanels, WreckShot } from "./Wreck";

const SHOTS = [
  { id: "3.1", Picture: TitleMap },
  { id: "3.2", Picture: CrashMap },
  { id: "3.3", Picture: Impact },
  { id: "3.4", Picture: WreckShot },
  { id: "3.5", Picture: HaloPanels },
  { id: "3.6", Picture: Escape },
].map((s) => ({ ...s, ...shotById(s.id) }));

// The part's picture at a song frame, in a given fire palette (the review stills render both palettes).
export const BahrainPicture: React.FC<{
  f: number;
  palette: FirePaletteName;
}> = ({ f, palette }) => {
  const shot =
    SHOTS.find((s) => f >= s.from && f < s.to) ?? SHOTS[SHOTS.length - 1];
  return (
    <AbsoluteFill style={{ backgroundColor: "#0d0d0d" }}>
      <shot.Picture f={f} palette={palette} />
    </AbsoluteFill>
  );
};

export const Scene: React.FC<SceneProps> = ({ part }) => {
  const f = useSongFrame(part);
  return <BahrainPicture f={f} palette={FIRE_PALETTE} />;
};
