// The MV's edit list: the parts in song order, each with the bars it owns and its shots.
// Parts follow the tickets, not the music sections (Suzuka is one section, two parts).
// To cut a part, edit only src/mv/parts/<part>/ — this file does not change.
// Checked by scripts/check-edit-list.mjs.
import type { PartEdit } from "./shot.ts";
import { at, type Pos } from "./timing.ts";
import { EDIT as INTRO } from "./parts/intro/shots.ts";
import { EDIT as SUZUKA_1989 } from "./parts/suzuka1989/shots.ts";
import { EDIT as SUZUKA_1990 } from "./parts/suzuka1990/shots.ts";
import { EDIT as BRAZIL_2008 } from "./parts/brazil2008/shots.ts";
import { EDIT as BAHRAIN_2020 } from "./parts/bahrain2020/shots.ts";
import { EDIT as BUILDUP } from "./parts/buildup/shots.ts";
import { EDIT as ABU_DHABI_2021 } from "./parts/abuDhabi2021/shots.ts";
import { EDIT as OUTRO } from "./parts/outro/shots.ts";
import { EDIT as CREDITS } from "./parts/credits/shots.ts";

export type Part = {
  /** Also the prefix of the part's hits in timing.ts HITS ("intro.light1"). */
  readonly id: string;
  readonly name: string;
  readonly ticket: string;
  readonly from: Pos;
  readonly to: Pos;
  readonly edit: PartEdit;
};

export const PARTS = [
  {
    id: "intro",
    name: "前奏",
    ticket: "#4",
    from: at(1),
    to: at(9),
    edit: INTRO,
  },
  {
    id: "suzuka1989",
    name: "铃鹿 1989",
    ticket: "#6",
    from: at(9),
    to: at(22),
    edit: SUZUKA_1989,
  },
  {
    id: "suzuka1990",
    name: "铃鹿 1990",
    ticket: "#7",
    from: at(22),
    to: at(33),
    edit: SUZUKA_1990,
  },
  {
    id: "brazil2008",
    name: "巴西 2008",
    ticket: "#8",
    from: at(33),
    to: at(57),
    edit: BRAZIL_2008,
  },
  {
    id: "bahrain2020",
    name: "巴林 2020",
    ticket: "#9",
    from: at(57),
    to: at(74),
    edit: BAHRAIN_2020,
  },
  {
    id: "buildup",
    name: "蓄力",
    ticket: "#5",
    from: at(74),
    to: at(82),
    edit: BUILDUP,
  },
  {
    id: "abuDhabi2021",
    name: "阿布扎比 2021",
    ticket: "#5",
    from: at(82),
    to: at(106),
    edit: ABU_DHABI_2021,
  },
  {
    id: "outro",
    name: "尾奏",
    ticket: "#11",
    from: at(106),
    to: at(114),
    edit: OUTRO,
  },
  {
    id: "credits",
    name: "片尾彩蛋",
    ticket: "post-credits stinger",
    from: at(114),
    to: at(120),
    edit: CREDITS,
  },
] as const satisfies readonly Part[];

export type PartId = (typeof PARTS)[number]["id"];

export const partById = (id: PartId): Part => {
  const part = PARTS.find((p) => p.id === id);
  if (!part) throw new Error(`unknown part ${id}`);
  return part;
};
