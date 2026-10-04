// Edit list for the intro (bars 1–8), treatment shots 0.1–0.3.
import { hitCue, type PartEdit } from "../../shot.ts";
import { at } from "../../timing.ts";

export const EDIT: PartEdit = {
  status: "cut",
  shots: [
    {
      id: "0.1",
      from: at(1),
      to: at(5),
      view: "closeup",
      content:
        "第一帧起灯架就在画面中央：整座灯架的铅笔底稿已在，五个灯箱和桁架已画出一部分、网点已起（#24：开头不黑，首帧可作缩略图）；第 1–4 小节墨线补完灯箱、桁架、横梁和吊杆，再逐盏画出二十盏灯，铅笔底稿随之淡去，网点在第 5 小节前铺满",
    },
    {
      id: "0.2",
      from: at(5),
      to: at(9),
      view: "closeup",
      content:
        "五盏红灯逐一亮起；第 9 小节第一拍五灯同时熄灭，切入铃鹿（镜头 0.3 即这个切点）",
      cues: [
        hitCue("intro.light1"),
        hitCue("intro.light2"),
        hitCue("intro.light3"),
        hitCue("intro.light4"),
        hitCue("intro.light5"),
        hitCue("intro.lightsOut"),
      ],
    },
  ],
};
