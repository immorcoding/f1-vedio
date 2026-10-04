// Edit-list vocabulary. Every time is a musical position (src/mv/timing.ts); frames are derived.
// Pure TypeScript (type-only imports), so the check scripts can load it with node.
import { HITS, type HitId, type Pos } from "./timing.ts";

/** Camera / layout of a shot, as in the treatment's 视角 column. */
export type View =
  | "closeup" // 特写: broadcast-style side tracking
  | "top" // 俯视: top-down track map (MOT-2)
  | "panel" // 小格: manga close-up panels
  | "split" // 分屏
  | "title" // 标题卡
  | "black"; // nothing on screen

/** A sync point inside a shot: something on screen happens exactly on this beat. */
export type Cue = { readonly id: string; readonly at: Pos };

export type Shot = {
  /** Treatment number, e.g. "0.2". Unique across the whole MV. */
  readonly id: string;
  /** First beat on screen. */
  readonly from: Pos;
  /** The cut: first beat of the next shot (exclusive). */
  readonly to: Pos;
  readonly view: View;
  /** What is on screen, one line (内容). */
  readonly content: string;
  /** On-screen text, exactly as in the treatment (STO-5). */
  readonly text?: readonly string[];
  /** Sync points (卡点). A cue may sit on the shot's own cut (`to`). */
  readonly cues?: readonly Cue[];
};

/**
 * One part's slice of the edit list. Each part owns its file in src/mv/parts/<part>/shots.ts
 * and nothing else, so parts can be cut in parallel. Its shots must tile the part's bars.
 */
export type PartEdit = {
  /** "stub" = placeholder until the part's ticket lands; the hit checks skip stubs. */
  readonly status: "stub" | "cut";
  readonly shots: readonly Shot[];
};

/** A cue on a music hit: id and position both come from the beat map. */
export const hitCue = (id: HitId): Cue => ({ id, at: HITS[id] });

/** Placeholder edit for a part whose ticket has not landed: one black shot over its bars. */
export const stubEdit = (
  part: string,
  from: Pos,
  to: Pos,
  ticket: string,
): PartEdit => ({
  status: "stub",
  shots: [
    {
      id: `${part}.stub`,
      from,
      to,
      view: "black",
      content: `待做（${ticket}）`,
    },
  ],
});
