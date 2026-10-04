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
      content: "黑底上发车灯架墨线画出，网点渐显",
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
