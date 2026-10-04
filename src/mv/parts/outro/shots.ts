// Edit list for 尾奏 (the last 8 bars of the song), treatment shots 6.1–6.3. Every position is written relative to the
// outro section's first bar (read from the beat map), so a bar added or removed earlier in the song moves this part
// without edits here. The score's outro is untouched: the drums and bass leave in bars 1–4 (the kick last, through
// bar 4), the intro pad, its low pulse and its two pings come back (bar 5 beat 3, bar 7 beat 3) and the pad dies out
// by the end of bar 8. The film ends on the chequered flag, the race's real end signal.
import type { PartEdit } from "../../shot.ts";
import { SECTIONS, at, type Pos } from "../../timing.ts";

const section = SECTIONS.find((s) => s.id === "outro");
if (!section) throw new Error("outro: no section in the beat map");

/** First bar of the outro in song bars. */
export const OUTRO_BAR = section.from.bar;
/** Bar `k` of the outro (1-based), beat `beat`. */
const ob = (k: number, beat = 1): Pos => at(OUTRO_BAR + k - 1, beat);

export const EDIT: PartEdit = {
  status: "cut",
  shots: [
    {
      id: "6.1",
      from: ob(1),
      to: ob(5),
      view: "panel",
      content:
        "四格闪回，每小节第一拍换一格，每格慢慢推近（每小节约 5%）：第一格直接砸在 5.8 的夺冠照片上（音乐还满）；之后音乐收下来，画面跟着静下来：2008 硬切，2020、2021 用 5 帧纸面叠化；每格的重点都在第三拍：1989/90 PRO 与 SEN 头盔相撞加撞击星；2008 积分 98 · 97（第三拍 98 下金色描边）；2020 烧黑但完好的 halo（第三拍一闪）；2021 VER 车号第三拍从 33 翻成 1，年份同时从 2021 翻成 2022（彩蛋，facts.md）；这一格完整留满一小节，“1”看清楚",
      text: [
        "1989 · 1990",
        "2008",
        "98 · 97",
        "HAM",
        "MAS",
        "2020",
        "2021",
        "2022",
      ],
      cues: [
        { id: "outro.flash1989", at: ob(1) },
        { id: "outro.flash2008", at: ob(2) },
        { id: "outro.gold98", at: ob(2, 3) },
        { id: "outro.flash2020", at: ob(3) },
        { id: "outro.haloGlint", at: ob(3, 3) },
        { id: "outro.flash2021", at: ob(4) },
        { id: "outro.number1", at: ob(4, 3) },
      ],
    },
    {
      id: "6.2",
      from: ob(5),
      to: ob(7),
      view: "closeup",
      content:
        "黑白漫画方格旗第 5 小节第一拍从左边进来，盖在最后一格（2022）上：旗杆领头，从容地横扫过去、慢慢变大，第 6 小节第一拍前后铺满画面；旗布轻轻翻卷，幅度和速度都小，并一路放缓到第 8 小节；不随节拍涨缩；只在第 5 小节第三拍的 ping 上一抖、浪尖白光一闪",
      cues: [
        { id: "outro.flag", at: ob(5) },
        { id: "outro.flagSnap", at: ob(5, 3) },
        { id: "outro.flagFull", at: ob(6) },
      ],
    },
    {
      id: "6.3",
      from: ob(7),
      to: ob(9),
      view: "title",
      content:
        "旗子的翻卷慢下来，几乎静止；第 7 小节第一拍一条白纸横幅砸在旗面上，横幅上是标题 F1 · 1989–2021（D 版标题字，墨色，年份空心）；第三拍 ping 上标题闪一下，方格条划入；标题在第 7 小节里停住；第 8 小节第一拍起旗子缓缓下沉、慢慢淡到全黑，跟着音乐最后的余音一起消失，曲终全黑",
      text: ["F1 · 1989–2021"],
      cues: [
        { id: "outro.title", at: ob(7) },
        { id: "outro.titleGlint", at: ob(7, 3) },
        { id: "outro.fade", at: ob(8) },
        { id: "outro.black", at: ob(9) },
      ],
    },
  ],
};
