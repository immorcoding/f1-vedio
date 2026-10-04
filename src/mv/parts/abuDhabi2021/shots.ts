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
      to: at(83),
      view: "top",
      content:
        "drop 的新画面：正上方压下来的俯视，两车斜着朝镜头冲来（VER 贴在 HAM 尾流里），整格砸入，前三帧反白（冲击帧），集中线从四边压向车头，赛道按真实速度流过",
    },
    {
      id: "5.1b",
      from: at(83),
      to: at(84),
      view: "closeup",
      content: "轮上视角：镜头贴地、在车轮高度，VER 的前轮紧跟 HAM 的后轮（尾流里 0.9 m），轮胎飞转，T4 出口的路肩和路面成片流过",
    },
    {
      id: "5.1c",
      from: at(84),
      to: at(86),
      view: "closeup",
      content: "低角度追拍：84.1 VER 从尾流里向内线摆出，追到前轮齐 HAM 后轮",
      cues: [{ id: "abuDhabi2021.pullOut", at: at(84) }],
    },
    {
      id: "5.1d",
      from: at(86),
      to: at(87),
      view: "top",
      content: "俯视切片：正上方贴近两车，VER 的前轮与 HAM 的后轮并排、轮胎间隔 0.7 m，VER/HAM 标签，路面按真实速度流过",
    },
    {
      id: "5.1e",
      from: at(87),
      to: at(88),
      view: "panel",
      content: "头盔小格：87.1 VER 一格从左砸入上半，87.3 HAM 一格从右砸入下半，两格斜切，夜色速度线流过",
      cues: [
        { id: "abuDhabi2021.helmetVer", at: at(87) },
        { id: "abuDhabi2021.helmetHam", at: at(87, 3) },
      ],
    },
    {
      id: "5.2",
      from: at(88),
      to: at(90),
      view: "top",
      content:
        "俯视推近到两车约占画面宽 1/4，VER/HAM 标签；VER 的内线虚线箭头画出来；88.4 HAM 刹车，VER 晚 0.15 s 刹、追平；89.4 加花上推近加速；切点前 6 帧闪回 2008 年 Junção HAM 超 GLO（2.5 的画面，反相单色），90.1 硬切回定版",
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
      content:
        "出弯，HAM 在后直道借尾流反扑，VER 守住内线（staging.ts towPlan）：92–93 小节宽侧面机位，两车整台入画，HAM 贴在尾流里，93.3 向外线摆出；94.1 切长焦机位（后退 25 m），HAM 在近处外线、大约 8%、位置更低，94.3 追到落后半个车身（座舱错开半车），并排时轮胎间隔 1 m，之后落回",
    },
    {
      id: "5.5",
      from: at(96),
      to: at(100),
      view: "top",
      content:
        "固定全图（同 1.1、3.1 标题图的画法，不旋转）：VER、HAM 两个发光点沿赛道跑到终点，VER 跑过的路涂黑，光晕每拍一闪；第 99 小节整页直推向终点线（不转），100.1 VER 的点正好到线",
    },
    {
      id: "5.6",
      from: at(100),
      to: at(102),
      view: "closeup",
      content:
        "VER 冲线：第 100 小节是倒飞的摄像机看回直道（慢动作），100.1 VER 车头压上终点线、前景方格旗正好挥到底、白闪，远处小小的 HAM（2.2 秒 ≈ 150 m，真实比例）；101.1 切回侧面特写，赛速，小格里旗子挥动",
      cues: [hitCue("abuDhabi2021.finish")],
    },
    {
      id: "5.7",
      from: at(102),
      to: at(104),
      view: "title",
      content:
        "积分定格（新构图，#23）：上下两格头盔（VER 在上、大格，HAM 在下、渐渐压上网点），第 102 小节第一拍积分框 395.5 VS 387.5 砸在斜格线上，第二拍 VER 的数字后落下网点块（领先者用网点，金色留给 5.8）",
      text: ["395.5 VS 387.5"],
      cues: [
        hitCue("abuDhabi2021.points"),
        { id: "abuDhabi2021.pointsLead", at: at(102, 2) },
      ],
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
