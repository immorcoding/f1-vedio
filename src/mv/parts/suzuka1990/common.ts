// Timing helpers of the Suzuka 1990 part: shot and cue frames from the edit list, eased ramps.
import { Easing, interpolate } from "remotion";
import { frameAt } from "../../timing.ts";
import { EDIT } from "./shots.ts";

export const shotById = (id: string) => {
  const s = EDIT.shots.find((x) => x.id === id);
  if (!s) throw new Error(`suzuka1990: no shot ${id}`);
  return { from: frameAt(s.from), to: frameAt(s.to), text: s.text ?? [] };
};

export const cueFrame = (id: string) => {
  for (const s of EDIT.shots)
    for (const c of s.cues ?? []) if (c.id === id) return frameAt(c.at);
  throw new Error(`suzuka1990: no cue ${id}`);
};

export const ramp = (
  f: number,
  a: number,
  b: number,
  easing: (t: number) => number = Easing.inOut(Easing.cubic),
) =>
  interpolate(f, [a, b], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing,
  });

// Every picture of this part takes the song frame.
export type PictureProps = { f: number };
