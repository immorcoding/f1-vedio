// Edit list for 蓄力 (bars 74–81), treatment shots 4.1–4.3. The drop into the Abu Dhabi part is the cut at 82.1.
import { hitCue, type PartEdit } from "../../shot.ts";
import { at } from "../../timing.ts";

export const EDIT: PartEdit = {
  status: "cut",
  shots: [
    {
      id: "4.1",
      from: at(74),
      to: at(76),
      view: "title",
      content:
        "Yas Marina 夜景：起跑直道发车格通向 Yas 酒店，看台与照明灯塔；酒店网格天篷一格格亮起，2021 赛道全图在小格里画出",
      text: ["ABU DHABI 2021", "YAS MARINA CIRCUIT"],
      cues: [{ id: "buildup.hotelLit", at: at(75) }],
    },
    {
      id: "4.2",
      from: at(76),
      to: at(80),
      view: "split",
      content:
        "分屏：VER 与 HAM 头盔面对面（HAM 一格镜像）；每小节第一拍推近一档，从整个座舱推到面罩，档间继续缓推；积分框 76.1 随分屏砸入（平分，无领先标记），78.1 闪一次",
      text: ["369.5 VS 369.5"],
      cues: [
        { id: "buildup.pointsIn", at: at(76) },
        { id: "buildup.push2", at: at(77) },
        { id: "buildup.tied", at: at(78) },
        { id: "buildup.push4", at: at(79) },
      ],
    },
    {
      id: "4.3",
      from: at(80),
      to: at(82),
      view: "closeup",
      content:
        "两车贴近；VER 新软胎（红圈）、HAM 旧硬胎（白圈），80.3 打出 FRESH SOFTS vs OLD HARDS；右上小格是安全车（Vantage 车尾、车顶灯架，SC IN），五盏琥珀灯用片头起跑灯的画法，第 80 小节轮流闪，81.1 全亮，81.3 起每隔三个三十二分音符灭一盏，最后一盏灭在 81.4 后半拍（音乐空拍开始），HAM 起步，第 82 小节第一拍进 drop（切点）；第 80 小节上方中间小格是 Latifi 的 Williams 撞上 14 号弯墙（LAP 53）",
      text: ["LAP 58", "LAP 53", "SC IN", "FRESH SOFTS vs OLD HARDS"],
      cues: [
        { id: "buildup.tyres", at: at(80, 3) },
        { id: "buildup.scAllLit", at: at(81) },
        { id: "buildup.scLightsOut", at: at(81, 3) },
        hitCue("buildup.drop"),
      ],
    },
  ],
};
