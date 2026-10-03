// Edit list for 铃鹿 1990 (bars 21–32), treatment shots 1.5–1.8. Facts on screen: docs/production/facts.md.
import { hitCue, type PartEdit } from "../../shot.ts";
import { at } from "../../timing.ts";

export const EDIT: PartEdit = {
  status: "cut",
  shots: [
    {
      id: "1.5",
      from: at(21),
      to: at(23),
      view: "title",
      content:
        "1989 那一页（减速弯画着圈）翻过去，下一页是同一条铃鹿，圈落在 1 号弯，镜头推向发车直道",
      text: ["1990 · 铃鹿"],
      cues: [{ id: "suzuka1990.flip", at: at(21, 1) }],
    },
    {
      id: "1.6",
      from: at(23),
      to: at(27),
      view: "top",
      content:
        "俯视发车区与 1 号弯：SEN 杆位在较脏的右侧（网点），PRO 在干净的行车线一侧；起步 PRO 领先，SEN 从内线冲向 1 号弯（彩蛋）",
      text: ["第 1 圈"],
      cues: [{ id: "suzuka1990.start", at: at(23, 3) }],
    },
    {
      id: "1.7",
      from: at(27),
      to: at(29),
      view: "closeup",
      content:
        "1 号弯相撞：SEN 左前轮撞上 PRO 右后轮，定格成撞击星；两车锁在一起冲出赛道，滑进砂石缓冲区，尘土与碎片飞起",
      text: ["轰！"],
      cues: [hitCue("suzuka1990.crash")],
    },
    {
      id: "1.8",
      from: at(29),
      to: at(33),
      view: "panel",
      content:
        "尘土落定，两车停在缓冲区；第 30 小节两格头盔一左一右滑入：1989 年冠军 PRO、1990 年冠军 SEN",
      text: ["89 PRO · 90 SEN"],
      cues: [{ id: "suzuka1990.helmets", at: at(30) }],
    },
  ],
};

// On-screen facts, from docs/production/facts.md ("1990 日本大奖赛").
export const FACTS = {
  lap: 1, // "第 1 圈第 1 个弯，Senna 撞上 Prost"
  champions: { 1989: "PRO", 1990: "SEN" },
} as const;
