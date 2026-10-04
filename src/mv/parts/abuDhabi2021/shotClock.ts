// Shot-local time for the buildup and Abu Dhabi parts: which shot of an edit is on screen at a song frame, and how far
// into it we are. All positions come from the edit list (bars and beats), all frames from timing.ts.
import type { PartEdit, Shot } from "../../shot.ts";
import { FPS, frameAt, type Pos } from "../../timing.ts";

export type ShotTime = {
  shot: Shot;
  /** Song frame. */
  f: number;
  /** Frames since the shot's first frame. */
  frame: number;
  /** Seconds since the shot's first frame, and the shot's length in seconds. */
  t: number;
  dur: number;
};

export const shotAt = (edit: PartEdit, f: number): ShotTime => {
  const shots = edit.shots;
  let shot = shots[0];
  for (const s of shots) if (f >= frameAt(s.from)) shot = s;
  const f0 = frameAt(shot.from);
  return {
    shot,
    f,
    frame: f - f0,
    t: (f - f0) / FPS,
    dur: (frameAt(shot.to) - f0) / FPS,
  };
};

/** Seconds from the shot's start to a song position (negative if before it). */
export const secondsInShot = (st: ShotTime, p: Pos) =>
  (frameAt(p) - frameAt(st.shot.from)) / FPS;

export const cueAt = (edit: PartEdit, id: string): Pos => {
  for (const s of edit.shots)
    for (const c of s.cues ?? []) if (c.id === id) return c.at;
  throw new Error(`no cue ${id}`);
};

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
export const smooth = (v: number) => {
  const x = clamp01(v);
  return x * x * (3 - 2 * x);
};
/** 0 → 1 between seconds a and b. */
export const ramp = (t: number, a: number, b: number) =>
  smooth((t - a) / (b - a));
/** A hit that jumps to 1 at t = at and decays over `tau` seconds. */
export const hit = (t: number, at: number, tau: number) =>
  t < at ? 0 : Math.exp(-(t - at) / tau);
