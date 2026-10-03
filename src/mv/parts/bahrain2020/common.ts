// Shared timing helpers and the one open look decision of the Bahrain 2020 part.
import { Easing, interpolate } from "remotion";
import type { FirePaletteName } from "../../../kit/fire";
import { frameAt } from "../../timing.ts";
import { EDIT } from "./shots.ts";

// The fire's palette — the single switch for the open ART-8 question (is fire environment, black and white, or does it
// get colour?). Black and white until the user decides; "color" renders the alternative.
export const FIRE_PALETTE: FirePaletteName = "manga";

export const shotById = (id: string) => {
  const s = EDIT.shots.find((x) => x.id === id);
  if (!s) throw new Error(`bahrain2020: no shot ${id}`);
  return { from: frameAt(s.from), to: frameAt(s.to), text: s.text ?? [] };
};

export const cueFrame = (id: string) => {
  for (const s of EDIT.shots)
    for (const c of s.cues ?? []) if (c.id === id) return frameAt(c.at);
  throw new Error(`bahrain2020: no cue ${id}`);
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

// Every picture of this part takes the song frame and the fire palette.
export type PictureProps = { f: number; palette: FirePaletteName };
