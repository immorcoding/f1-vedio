// Edit list for 铃鹿 1989 (bars 9–20), treatment shots 1.1–1.4. Facts on screen: docs/production/facts.md.
import { hitCue, type PartEdit } from "../../shot.ts";
import { at } from "../../timing.ts";

export const EDIT: PartEdit = {
  status: "cut",
  shots: [
    {
      id: "1.1",
      from: at(9),
      to: at(11),
      view: "title",
      content: "铃鹿 8 字形赛道全图墨线画出，130R 之后的减速弯亮起",
      text: ["1989 · 铃鹿"],
    },
    {
      id: "1.2",
      from: at(11),
      to: at(15),
      view: "closeup",
      content:
        "白天的铃鹿，转播式侧面跟拍：两台 McLaren MP4/5 一前一后贴着跑，PRO 在前、SEN 紧咬；第 13 小节起两个头盔小格对比",
      cues: [{ id: "suzuka1989.helmets", at: at(13) }],
    },
    {
      id: "1.3",
      from: at(15),
      to: at(19),
      view: "top",
      content:
        "俯视 130R 之后的减速弯：PRO 走外侧准备右转入弯，SEN 从内线切入，走线箭头画出",
      text: ["第 47 圈"],
    },
    {
      id: "1.4",
      from: at(19),
      to: at(21),
      view: "panel",
      content:
        "两车相撞定格成撞击星，锁在一起滑停在减速弯入口；结尾小格：工作人员把 SEN 推上缓冲道，他发动后在路标之间穿过（彩蛋）",
      text: ["咔！"],
      cues: [
        hitCue("suzuka1989.crash"),
        { id: "suzuka1989.push", at: at(20, 1) },
      ],
    },
  ],
};

// On-screen facts, from docs/production/facts.md ("1989 日本大奖赛").
export const FACTS = {
  lap: 47, // "第 47 圈，Senna 在 130R 之后的减速弯 …"
} as const;
