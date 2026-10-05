// Edit list for 片尾彩蛋, the post-credits stinger (user 2026-10-05): after the film's fade to black, the end title's
// chequered strip comes back, Clawd (the Claude Code critter) hops in carrying the chequered flag and pulls a paper
// banner open behind it: "MADE BY Immor × Claude". VER's RB18 #1 whips past behind it in bar 4; Clawd notices a
// beat late, jumps, the flag flies off and falls back over the camera, and the film ends on the chequered flag again
// (STO-10). Treatment shots 7.1–7.3. Every position is relative to the section's first bar (read from the beat map).
//
// The gag is one continuous take (7.2): the match cut from the outro, the walk, the pass and the jump flow on without
// a cut. The score under it (scripts/make-music.mjs): a light kick on every hop's landing with hats between, the
// RB18's Doppler pass as an SFX cue (src/mv/sfx.ts), a boing and a choked cymbal on the jump, a clean last note on
// the black.
import type { PartEdit } from "../../shot.ts";
import { hitCue } from "../../shot.ts";
import { SECTIONS, at, type Pos } from "../../timing.ts";

const section = SECTIONS.find((s) => s.id === "credits");
if (!section) throw new Error("credits: no section in the beat map");

/** First bar of the stinger in song bars. */
export const CREDITS_BAR = section.from.bar;
/** Bar `k` of the stinger (1-based), beat `beat`. */
export const cb = (k: number, beat = 1): Pos => at(CREDITS_BAR + k - 1, beat);

/** The hops: Clawd lands on every beat from bar 2 beat 1 to bar 5 beat 1 (13 landings, a kick each). */
export const FIRST_LANDING = cb(2);
export const LAST_LANDING = cb(5);

export const EDIT: PartEdit = {
  status: "cut",
  shots: [
    {
      id: "7.1",
      from: cb(1),
      to: cb(1, 2),
      view: "black",
      content: "片子淡到全黑之后停一拍全黑（无声，尾奏的余音散尽）",
    },
    {
      id: "7.2",
      from: cb(1, 2),
      to: cb(6),
      view: "closeup",
      content:
        "一镜到底的彩蛋。第 1 小节第二拍：黑底上，片尾标题下那条方格条在同一位置、同样倾斜从左往右划回来（CircuitTag 的动作）；第三拍起黑幕往上收，露出夜里亚斯码头赛道边（5.6 的同一套赛道边）；第四拍 Clawd（Claude Code 的像素小怪，Claude 橙，墨线网点）扛着方格旗从左边跳进来，每拍一跳、落地踩在底鼓上，压扁拉伸；它的后手拽着纸横幅的卷轴往右走，横幅跟着它展开，露出 MADE BY 和 Immor × Claude（字只在它身后出现，它不挡字）；第 3 小节末走到字的右边停在原地继续跳；第 4 小节 VER 的 RB18 #1 从后面赛道上呼啸而过（镜头跟车甩、背景带运动模糊和速度线，同 5.6），Clawd 没看见，头上冒一个音符；第 5 小节第一拍最后一跳落地，第二拍才回头（迟到的反应），冒出对话框 POLE AGAIN?!；第三拍吓得跳起来（!!、BOING），旗子脱手飞出画面；第四拍旗子从上面掉回来，越来越大，盖满画面，拖成全黑",
      text: ["MADE BY", "Immor × Claude", "POLE AGAIN?!", "BOING!", "!!"],
      cues: [
        { id: "credits.strip", at: cb(1, 2) },
        { id: "credits.lights", at: cb(1, 3) },
        { id: "credits.hopIn", at: cb(1, 4) },
        { id: "credits.firstLanding", at: FIRST_LANDING },
        { id: "credits.revealed", at: cb(4) },
        { id: "credits.pass", at: cb(4) },
        { id: "credits.lastLanding", at: LAST_LANDING },
        { id: "credits.doubleTake", at: cb(5, 2) },
        hitCue("credits.jump"),
        { id: "credits.flagFall", at: cb(5, 4) },
      ],
    },
    {
      id: "7.3",
      from: cb(6),
      to: cb(7),
      view: "black",
      content: "全黑，最后一个干净的音在黑里响完，曲终",
      cues: [hitCue("credits.end")],
    },
  ],
};
