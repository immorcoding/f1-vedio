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
      content: "分屏：VER 与 HAM 头盔对望，积分并列",
      text: ["369.5 · 369.5"],
      cues: [{ id: "buildup.tied", at: at(78) }],
    },
    {
      id: "4.3",
      from: at(80),
      to: at(82),
      view: "closeup",
      content:
        "安全车灯熄灭，两车贴近；VER 新软胎（红圈）、HAM 旧硬胎（白圈）；第 82 小节第一拍进 drop（切点）",
      text: ["LAP 58"],
      cues: [{ id: "buildup.scLightsOut", at: at(81) }, hitCue("buildup.drop")],
    },
  ],
};
