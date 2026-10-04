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
      content:
        "第 61 小节第一拍撞上三层护栏（轨迹与护栏成 29°，车身再偏航 22°）、音乐骤停、镜头一震；慢动作：火花沿护栏刮擦四溅，上下两层护栏被压弯、中间一层被撕开，座舱穿过去，车在发动机舱壁处断成两截（动力单元和车尾留在赛道一侧），油箱爆出火球，碎片飞散；最后定格成白底黑线的撞击星，火球保留彩色；定格前一瞬白闪",
      text: ["67G"],
      cues: [hitCue("bahrain2020.impact")],
    },
    {
      id: "3.4",
      from: at(62),
      to: at(66),
      view: "closeup",
      content:
        "断成两截的 Haas：前半截（座舱）卡在被撕开、压弯的护栏里，后半截落在赛道一侧；分层火焰（外焰/中焰/焰心各自闪动）升起，热浪扭曲夜空，火星上飘，墨线烟丝；只剩心跳",
    },
    {
      id: "3.5",
      from: at(66),
      to: at(70),
      view: "panel",
      content:
        "“27 秒”四格时间线，每小节第一拍加一格：0 秒 halo 顶开护栏、座舱卡在护栏里；11 秒医疗车停下、医生冲向火场；工作人员用干粉灭火器对着座舱喷（时间未核实，不标秒数）；27 秒火光里 GRO 的身影从座舱站起、双手抓住护栏往上爬（头盔、手套可辨）",
      text: ["0 秒", "11 秒", "27 秒"],
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
      content:
        "GRO 从火里走出来；第 72 小节第一拍切到烧黑但完好的座舱侧面特写（照伦敦展出的残骸描：halo 中柱加环形主梁，彩蛋），烟丝上飘、缓慢推近，最后一拍切黑",
      text: ["27 秒"],
      cues: [
        { id: "bahrain2020.time", at: at(71) },
        { id: "bahrain2020.halo", at: at(72) },
        { id: "bahrain2020.black", at: at(72, 4) },
      ],
    },
  ],
};

// On-screen facts, checked against docs/production/facts.md by scripts/check-bahrain2020.mjs.
export const FACTS = {
  impactG: 67, // "冲击约 67 G"
  escapeSeconds: 27, // FIA summary: "out of car after 27 seconds" (Wikipedia: about 28)
  medicalCarSeconds: 11, // "医疗车 11 秒内到场"
} as const;
