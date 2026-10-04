// Edit list for 巴西 2008 (bars 33–56), treatment shots 2.1–2.7 (facts: docs/production/facts.md, 2008 巴西).
import { hitCue, type PartEdit } from "../../shot.ts";
import { at } from "../../timing.ts";

export const EDIT: PartEdit = {
  status: "cut",
  shots: [
    {
      id: "2.1",
      from: at(33),
      to: at(35),
      view: "title",
      content: "标题卡：Interlagos 全图沿比赛方向画出，雨点落下",
      text: ["2008 · 巴西"],
    },
    {
      id: "2.2",
      from: at(35),
      to: at(39),
      view: "closeup",
      content: "雨中跟拍 HAM（McLaren MP4-23，半雨胎），后轮卷起水雾",
      text: ["最后一圈"],
    },
    {
      id: "2.3",
      from: at(39),
      to: at(43),
      view: "split",
      content:
        "分屏：左格 MAS 冲线、法拉利车库开始庆祝（彩蛋）；右格同一时刻 HAM 跟在 VET 后面，第 6 名，GLO 在前方",
    },
    {
      id: "2.4",
      from: at(43),
      to: at(47),
      view: "top",
      content:
        "俯视最后区段（雨天）：GLO 干地胎打滑，VET 先超过，HAM 跟上；小格对比两种胎面（彩蛋）",
      text: ["干地胎"],
    },
    {
      id: "2.5",
      from: at(47),
      to: at(49),
      view: "closeup",
      content: "Junção 出弯冲上坡：HAM 在第 47 小节第一拍超过 GLO",
      text: ["嗖！"],
      cues: [hitCue("brazil2008.pass")],
    },
    {
      id: "2.6",
      from: at(49),
      to: at(53),
      view: "closeup",
      content: "HAM 冲过终点线，第 5 名",
    },
    {
      id: "2.7",
      from: at(53),
      to: at(57),
      view: "title",
      content:
        "夺冠卡（同 5.8 的语言，只用事实）：第 53 小节第一拍积分 HAM 98 · MAS 97 砸入，随后飞到角落；第 54 小节四行字逐拍砸入，旁边是 HAM 头盔特写；55–56 小节推近定格，雨中闪光",
      text: ["98 · 97", "LEWIS HAMILTON", "2008", "WORLD", "CHAMPION"],
      cues: [
        hitCue("brazil2008.points"),
        { id: "brazil2008.gold98", at: at(53, 2) },
        { id: "brazil2008.corner", at: at(53, 3) },
        { id: "brazil2008.name", at: at(54, 1) },
        { id: "brazil2008.year", at: at(54, 2) },
        { id: "brazil2008.world", at: at(54, 3) },
        { id: "brazil2008.champion", at: at(54, 4) },
        { id: "brazil2008.hold", at: at(55, 1) },
      ],
    },
  ],
};
