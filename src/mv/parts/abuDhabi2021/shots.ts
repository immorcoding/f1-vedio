// Edit list for 阿布扎比 2021 (bars 82–105), treatment shots 5.1–5.8. The drop at 82.1 is cued by the buildup part
// (it is the cut between the two).
import { hitCue, type PartEdit } from "../../shot.ts";
import { at } from "../../timing.ts";

export const EDIT: PartEdit = {
  status: "cut",
  shots: [
    {
      id: "5.1",
      from: at(82),
      to: at(86),
      view: "closeup",
      content: "两车冲向 5 号弯：VER 贴着 HAM 的尾流，向内线摆出",
    },
    {
      id: "5.2",
      from: at(86),
      to: at(90),
      view: "top",
      content: "俯视 T5 发卡弯：HAM 走外线，VER 内线晚刹车切入的走线",
    },
    {
      id: "5.3",
      from: at(90),
      to: at(92),
      view: "closeup",
      content:
        "定版那一格（style-b-manga-v2.png）：VER 锁死前轮冒烟，HAM 在外线；第一帧即定版画面",
      text: ["SCREECH", "VROOOM!", "LAP 58 · TURN 5"],
      cues: [hitCue("abuDhabi2021.lockup")],
    },
    {
      id: "5.4",
      from: at(92),
      to: at(96),
      view: "closeup",
      content: "出弯，HAM 在后直道借尾流反扑，VER 守住内线",
    },
    {
      id: "5.5",
      from: at(96),
      to: at(100),
      view: "top",
      content: "俯视全图：从后直道一路到终点线，VER 领先",
    },
    {
      id: "5.6",
      from: at(100),
      to: at(102),
      view: "closeup",
      content: "VER 冲线：第 100 小节第一拍前轮压上终点线，方格旗挥下；HAM 2.2 秒后过线",
      cues: [hitCue("abuDhabi2021.finish")],
    },
    {
      id: "5.7",
      from: at(102),
      to: at(104),
      view: "title",
      content: "积分翻牌定格",
      text: ["395.5 · 387.5"],
      cues: [hitCue("abuDhabi2021.points")],
    },
    {
      id: "5.8",
      from: at(104),
      to: at(106),
      view: "title",
      content: "夺冠照片卡（ART-19）：VER 领奖台彩色照片铺满，车队无线电原话逐拍砸入（STO-8）",
      text: ["MAX VERSTAPPEN, YOU ARE THE WORLD CHAMPION!"],
    },
  ],
};
