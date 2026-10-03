// Edit list for 巴林 2020 (bars 57–72), treatment shots 3.1–3.6. Facts on screen: docs/production/facts.md.
import { hitCue, type PartEdit } from "../../shot.ts";
import { at } from "../../timing.ts";

export const EDIT: PartEdit = {
  status: "cut",
  shots: [
    {
      id: "3.1",
      from: at(57),
      to: at(59),
      view: "title",
      content: "巴林夜间赛道全图墨线画出，3 号弯后的直道亮起",
      text: ["2020 · 巴林"],
    },
    {
      id: "3.2",
      from: at(59),
      to: at(61),
      view: "top",
      content:
        "第 1 圈 3 号弯后直道俯视：GRO 从左往右并线，右后轮擦到 KVY 左前轮，斜冲向右侧护栏",
      text: ["第 1 圈"],
      cues: [{ id: "bahrain2020.contact", at: at(60) }],
    },
    {
      id: "3.3",
      from: at(61),
      to: at(62),
      view: "closeup",
      content: "车头撞进三层护栏，画面定格成白底黑线的撞击星；音乐骤停",
      text: ["67G"],
      cues: [hitCue("bahrain2020.impact")],
    },
    {
      id: "3.4",
      from: at(62),
      to: at(66),
      view: "closeup",
      content:
        "断成两截的 Haas：前半截（座舱）卡在护栏里，后半截落在赛道一侧，火焰升起；只剩心跳",
    },
    {
      id: "3.5",
      from: at(66),
      to: at(70),
      view: "panel",
      content: "火中 halo 的特写，每小节第一拍加一格、推近一层",
      cues: [
        { id: "bahrain2020.panel1", at: at(66) },
        { id: "bahrain2020.panel2", at: at(67) },
        { id: "bahrain2020.panel3", at: at(68) },
        { id: "bahrain2020.panel4", at: at(69) },
      ],
    },
    {
      id: "3.6",
      from: at(70),
      to: at(73),
      view: "closeup",
      content: "GRO 从火里走出来；第 72 小节最后一拍切黑",
      text: ["28 秒"],
      cues: [
        { id: "bahrain2020.time", at: at(71) },
        { id: "bahrain2020.black", at: at(72, 4) },
      ],
    },
  ],
};

// On-screen facts, checked against docs/production/facts.md by scripts/check-bahrain2020.mjs.
export const FACTS = {
  impactG: 67, // "冲击约 67 G"
  escapeSeconds: 28, // "约 28 秒后 Grosjean 自己从火中脱身"
} as const;
