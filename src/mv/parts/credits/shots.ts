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
        "一镜到底的彩蛋。第 1 小节第二到第三拍：灯亮起来，静止机位的夜里亚斯码头赛道边（2021 段的同一套赛道边）；左边两根立柱并排，一根上绕着卷得紧紧的布横幅（外面露的是素灰的布背面），布头系在另一根上；第四拍 Clawd（Claude Code 的像素小怪，Claude 橙，墨线网点）扛着方格旗从左边跳进来，每拍一跳、落地踩在底鼓上，压扁拉伸；卷轴绕在左边立柱上，布的右端系在第二根立柱上，Clawd 后手扛着这根立柱往右走，布在两根立柱之间展开（扛着时微微下垂、随每一跳晃一下），卷轴越展越细，露出 MADE BY 和 Immor × Claude（字只在它身后出现，它不挡字）；第 3 小节第四拍把立柱“咚”地插进地里（THUNK!），之后横幅是挂在两根固定立柱之间的布：上下边微微下垂、几道软褶，Clawd 在右边原地继续跳；第 4 小节第一拍 VER 的 RB18 #1 以真实车速从后面赛道上掠过，在画面正中定格 3 帧（纸白闪光、集中线），再继续开走；镜头不动、场景没有速度线，只有车拖残影和几条速度线，风吹 Clawd 和旗子，横幅上一道波纹顺着布跑过去再慢慢平息；Clawd 没看见，头上冒音符；第 5 小节第一拍最后一跳落地，第二拍才回头（迟到的反应），旁边蹦出手写喊声 POLE AGAIN?!（Bangers，无框，强调线）；第三拍吓得跳起来（!!、BOING），喊声一抖，旗子脱手飞出画面；第四拍旗子从上面掉回来，越来越大，盖满画面，抹成全黑",
      text: ["MADE BY", "Immor × Claude", "POLE AGAIN?!", "BOING!", "!!"],
      cues: [
        { id: "credits.lights", at: cb(1, 2) },
        { id: "credits.hopIn", at: cb(1, 4) },
        { id: "credits.firstLanding", at: FIRST_LANDING },
        { id: "credits.plant", at: cb(3, 4) },
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
