// Edit list for 铃鹿 1990 (bars 22–32), treatment shots 1.5–1.8. Facts on screen: docs/production/facts.md.
import { hitCue, type PartEdit } from "../../shot.ts";
import { at } from "../../timing.ts";

export const EDIT: PartEdit = {
  status: "cut",
  shots: [
    {
      id: "1.5",
      from: at(22),
      to: at(24),
      view: "title",
      content:
        "1989 那一页（1.1 的成品：减速弯圈和放大小格、“TEAM-MATES · RIVALS”）翻过去，下一页是同一条铃鹿，圈落在 1 号弯；PRO 的头盔格落在 1.2 的左上位置，第 23 小节翻面，同一顶头盔从 McLaren 红白换到法拉利红；镜头推向发车直道",
      text: ["SUZUKA 1990", "SUZUKA INTERNATIONAL RACING COURSE", "PRO MOVES TO FERRARI", "78 VS 69", "SEN", "PRO"],
      cues: [
        { id: "suzuka1990.flip", at: at(22, 1) },
        { id: "suzuka1990.move", at: at(23, 1) },
        // the stakes in the points box (#17), then the gold stroke on SEN's 78
        { id: "suzuka1990.stakes", at: at(23, 2) },
        { id: "suzuka1990.stakesGold", at: at(23, 3) },
      ],
    },
    {
      id: "1.6",
      from: at(24),
      to: at(28),
      view: "top",
      content:
        "俯视发车区与 1 号弯：SEN 杆位在较脏的右侧（网点），PRO 在干净的行车线一侧；起步 PRO 领先，SEN 从内线冲向 1 号弯（彩蛋）；最后一拍（27.4）俯视图绕两车甩转半圈、越转越快，切进 1.7 时两车已是从右往左开，和镜像的撞击格同向",
      text: ["LAP 1", "POLE ON THE DIRTY SIDE"],
      cues: [
        { id: "suzuka1990.start", at: at(24, 3) },
        // the whip into the mirrored impact panel
        { id: "suzuka1990.whip", at: at(27, 4) },
      ],
    },
    {
      id: "1.7",
      from: at(28),
      to: at(30),
      view: "closeup",
      content:
        "1 号弯相撞，与 1989 的撞击格同一套画法、左右镜像、角色对调：SEN 左前轮撞上 PRO 右后轮，定格成撞击星加集中线，拟声字在镜像的一角；两车锁在一起冲出赛道，滑进砂石缓冲区，尘土与碎片飞起",
      text: ["BANG!"],
      cues: [hitCue("suzuka1990.crash")],
    },
    {
      id: "1.8",
      from: at(30),
      to: at(33),
      view: "panel",
      content:
        "尘土落定，两车停在缓冲区；30.2 画面压暗，1.2/1.4 的两格头盔放大回到左右对称的位置、面对面：30.4 PRO（法拉利）盖“1989 CHAMPION”，31.2 SEN 盖“1990 CHAMPION”（与 1.4 同款红章），31.4 最后一行小字；缓推到第 32 小节末尾切",
      text: ["1989 CHAMPION", "1990 CHAMPION", "SEN LATER ADMITTED IT WAS DELIBERATE"],
      cues: [
        { id: "suzuka1990.helmets", at: at(30, 2) },
        { id: "suzuka1990.stamp89", at: at(30, 4) },
        { id: "suzuka1990.stamp90", at: at(31, 2) },
        { id: "suzuka1990.admitted", at: at(31, 4) },
      ],
    },
  ],
};

// On-screen facts, from docs/production/facts.md ("1990 日本大奖赛").
export const FACTS = {
  lap: 1, // "第 1 圈第 1 个弯，Senna 撞上 Prost"
  champions: { 1989: "PRO", 1990: "SEN" },
} as const;
