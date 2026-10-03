import { useCurrentFrame } from "remotion";
import type { Part } from "./edit-list.ts";
import { frameAt } from "./timing.ts";

/**
 * Song frame (frame 0 = bar 1 beat 1) inside a part's scene. Scenes compare it with
 * `frameAt(pos)` so every beat lands on the same frame the edit list and the checks use.
 */
export const useSongFrame = (part: Part) =>
  useCurrentFrame() + frameAt(part.from);
