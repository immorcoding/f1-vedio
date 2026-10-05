// Picture for each part. Every part owns src/mv/parts/<part>/Scene.tsx; this map does not change.
import type { Part, PartId } from "./edit-list.ts";
import { Scene as Intro } from "./parts/intro/Scene";
import { Scene as Suzuka1989 } from "./parts/suzuka1989/Scene";
import { Scene as Suzuka1990 } from "./parts/suzuka1990/Scene";
import { Scene as Brazil2008 } from "./parts/brazil2008/Scene";
import { Scene as Bahrain2020 } from "./parts/bahrain2020/Scene";
import { Scene as Buildup } from "./parts/buildup/Scene";
import { Scene as AbuDhabi2021 } from "./parts/abuDhabi2021/Scene";
import { Scene as Outro } from "./parts/outro/Scene";
import { Scene as Credits } from "./parts/credits/Scene";

/** A part's scene is mounted inside a Sequence that starts at the part's first frame. */
export type SceneProps = { readonly part: Part };

export const SCENES: Record<PartId, React.FC<SceneProps>> = {
  intro: Intro,
  suzuka1989: Suzuka1989,
  suzuka1990: Suzuka1990,
  brazil2008: Brazil2008,
  bahrain2020: Bahrain2020,
  buildup: Buildup,
  abuDhabi2021: AbuDhabi2021,
  outro: Outro,
  credits: Credits,
};
