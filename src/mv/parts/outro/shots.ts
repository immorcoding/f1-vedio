// Edit list for 尾奏 (the last 8 bars of the song), treatment shots 6.1–6.3. Every position is written relative to the
// outro section's first bar (read from the beat map), so a bar added or removed earlier in the song moves this part
// without edits here. The score's outro is untouched: the drums and bass leave in bars 1–4, the intro pad and its two
// pings come back (bar 5 beat 3, bar 7 beat 3) and the pad dies out by the end of bar 8.
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
      to: ob(3),
      view: "closeup",
      content:
        "黑白漫画方格旗挥过整个画面：旗杆从左边扫进来，旗布盖满画面翻卷，再扫出右边，把 5.8 的夺冠照片卷走；旗尾在切点离开画面，第一格闪回紧接着砸在白纸上",
      cues: [
        { id: "outro.flag", at: ob(1) },
        { id: "outro.paper", at: ob(3) },
      ],
    },
    {
      id: "6.2",
      from: ob(3),
      to: ob(7),
      view: "panel",
      content:
        "四格闪回，每小节第一拍换一格（砸入 / 翻页交替）：1989/90 PRO 与 SEN 头盔相撞加撞击星；2008 积分 98 · 97（第二拍 98 下金色描边）；2020 烧黑但完好的 halo（第三拍随音乐 ping 一闪）；2021 VER 车号第三拍从 33 翻成 1，年份同时从 2021 翻成 2022（彩蛋，facts.md）",
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
        { id: "outro.flash1989", at: ob(3) },
        { id: "outro.flash2008", at: ob(4) },
        { id: "outro.gold98", at: ob(4, 2) },
        { id: "outro.flash2020", at: ob(5) },
        { id: "outro.haloGlint", at: ob(5, 3) },
        { id: "outro.flash2021", at: ob(6) },
        { id: "outro.number1", at: ob(6, 3) },
      ],
    },
    {
      id: "6.3",
      from: ob(7),
      to: ob(9),
      view: "title",
      content:
        "首尾呼应前奏：前奏的发车灯架快速墨线画出，五盏红灯每拍亮一盏（第 7 小节一至四拍，第五盏在第四拍后半拍，同前奏的节奏压缩到一小节）；第 8 小节第一拍五灯同时熄灭，镜头拉远，熄灭的灯架下第二拍砸入标题 F1 · 1989–2021 和方格条；第四拍起淡到全黑",
      text: ["F1 · 1989–2021"],
      cues: [
        { id: "outro.light1", at: ob(7) },
        { id: "outro.light2", at: ob(7, 2) },
        { id: "outro.light3", at: ob(7, 3) },
        { id: "outro.light4", at: ob(7, 4) },
        { id: "outro.lightsOut", at: ob(8) },
        { id: "outro.title", at: ob(8, 2) },
        { id: "outro.fade", at: ob(8, 4) },
        { id: "outro.black", at: ob(9) },
      ],
    },
  ],
};
