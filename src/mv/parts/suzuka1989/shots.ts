// Edit list for 铃鹿 1989 (bars 9–21), treatment shots 1.1–1.4. Facts on screen: docs/production/facts.md.
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
      content:
        "铃鹿 8 字形赛道全图墨线画出，130R 之后的减速弯被圈出，放大成标题下的圆形小格：右左连弯和直行的缓冲道；标题下一行小字点出两人关系",
      text: ["SUZUKA 1989", "SUZUKA INTERNATIONAL RACING COURSE", "TEAM-MATES · RIVALS"],
    },
    {
      id: "1.2",
      from: at(11),
      to: at(15),
      view: "closeup",
      content:
        "白天的铃鹿，转播式侧面跟拍：两台 McLaren MP4/5 一前一后贴着跑，PRO 在前、SEN 紧咬；两个头盔小格 11.1（PRO）、11.3（SEN）先后砸入；第 13 小节切成贴地的低角度跟拍，SEN 咬在 PRO 变速箱后面，路面和路肩贴着镜头流过",
      text: ["PRO +16 PTS", "SEN MUST WIN"],
      cues: [
        // the helmet panels slam in, one per beat (review-1: no dead first half of the shot)
        { id: "suzuka1989.helmetPro", at: at(11, 1) },
        { id: "suzuka1989.helmetSen", at: at(11, 3) },
        // the new framing: a low-angle tracking shot from the kerb
        { id: "suzuka1989.lowAngle", at: at(13, 1) },
        // PRO's lead in the points box (#17), then its gold stroke
        { id: "suzuka1989.margin", at: at(13, 2) },
        { id: "suzuka1989.marginGold", at: at(13, 3) },
      ],
    },
    {
      id: "1.3",
      from: at(15),
      to: at(19),
      view: "top",
      content:
        "俯视 130R 之后的减速弯：PRO 走外侧准备右转入弯，SEN 从内线切入，走线箭头画出；SEN/PRO 标签一直保留到 18.4，在接触前淡出；减速弯标真名 CASIO TRIANGLE（facts.md）",
      text: ["LAP 47", "CASIO TRIANGLE"],
      cues: [{ id: "suzuka1989.tagsOut", at: at(18, 4) }],
    },
    {
      id: "1.4",
      from: at(19),
      to: at(22),
      view: "panel",
      content:
        "两车相撞定格成撞击星，锁在一起滑停在减速弯入口；第 20 小节结果页：撞停的两车压暗成背景，1.2 的两格头盔落回原位，20.3 SEN 盖红章“DISQUALIFIED”，21.1 PRO 盖红章“1989 CHAMPION”（彩蛋），第 21 小节停留缓推",
      text: ["CRASH!", "DISQUALIFIED", "1989 CHAMPION"],
      cues: [
        hitCue("suzuka1989.crash"),
        { id: "suzuka1989.result", at: at(20, 1) },
        { id: "suzuka1989.dsq", at: at(20, 3) },
        { id: "suzuka1989.champion", at: at(21, 1) },
      ],
    },
  ],
};

// On-screen facts, from docs/production/facts.md ("1989 日本大奖赛").
export const FACTS = {
  lap: 47, // "第 47 圈，Senna 在 130R 之后的减速弯 …"
} as const;
