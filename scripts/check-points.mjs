// Fact check for the points motif (#17, STO-3): every score and margin the points box shows must match the fact
// register. Run: npm run check:points
// - each standing in src/mv/points.ts is registered in docs/production/facts.md (both drivers' points, in its race's
//   section), and so is its margin;
// - the outro's margin sequence is 16 → 9 → 1 → 0 → 8;
// - the edit lists' on-screen text of the shots that show a box carries the same numbers.
import { readFileSync } from "node:fs";
import {
  MARGIN_SEQUENCE,
  STANDINGS,
  margin,
  scoreText,
} from "../src/mv/points.ts";
import { PARTS } from "../src/mv/edit-list.ts";

const problems = [];
const md = readFileSync(
  new URL("../docs/production/facts.md", import.meta.url),
  "utf8",
);
const sections = md.split(/^## /m);
const section = (title) => sections.find((s) => s.startsWith(title)) ?? "";
const NAMES = {
  PRO: "Prost",
  SEN: "Senna",
  HAM: "Hamilton",
  MAS: "Massa",
  VER: "Verstappen",
};
const esc = (n) => String(n).replace(".", "\\.");

// Where each standing is registered, and how facts.md words its margin (a lead "领先 N 分", a title won "以 N 分夺冠",
// or a tie "同为 P 分 … 分差 0").
const REGISTER = {
  suzuka1989: { title: "1989 日本大奖赛", margin: (m) => `领先 ${m} 分` },
  suzuka1990: { title: "1990 日本大奖赛", margin: (m) => `领先 ${m} 分` },
  brazil2008: { title: "2008 巴西大奖赛", margin: (m) => `以 ${m} 分夺冠` },
  abuDhabiBefore: { title: "2021 阿布扎比大奖赛", margin: (m) => `分差 ${m}` },
  abuDhabiFinal: {
    title: "2021 阿布扎比大奖赛",
    margin: (m) => `以 ${m} 分夺冠`,
  },
};

for (const [id, s] of Object.entries(STANDINGS)) {
  const reg = REGISTER[id];
  if (!reg) {
    problems.push(`${id}: no facts.md register entry in this check`);
    continue;
  }
  const text = section(reg.title);
  if (!text) {
    problems.push(`${id}: facts.md has no '${reg.title}' section`);
    continue;
  }
  const [a, b] = [s.a, s.b];
  // both drivers' points: "Prost 76 分、Senna 60 分", "Hamilton 98、Massa 97", or a tie "Verstappen 与 Hamilton 同为 369.5 分"
  const pair =
    a.pts === b.pts
      ? new RegExp(
          `${NAMES[a.code]}\\s*与\\s*${NAMES[b.code]}\\s*同为\\s*${esc(a.pts)}\\s*分`,
        )
      : new RegExp(
          `${NAMES[a.code]}\\s*${esc(a.pts)}\\s*分?、\\s*${NAMES[b.code]}\\s*${esc(b.pts)}`,
        );
  if (!pair.test(text))
    problems.push(
      `${id} (${s.label}): facts.md '${reg.title}' does not register ${a.code} ${a.pts} · ${b.code} ${b.pts}`,
    );
  const m = margin(id);
  if (!text.includes(reg.margin(m)))
    problems.push(
      `${id} (${s.label}): facts.md '${reg.title}' does not register the margin "${reg.margin(m)}"`,
    );
  if (!/来源/.test(text)) problems.push(`${id}: '${reg.title}' has no source`);
}

const seq = MARGIN_SEQUENCE.map(margin);
if (seq.join(",") !== "16,9,1,0,8")
  problems.push(
    `margin sequence is ${seq.join(" → ")}, not 16 → 9 → 1 → 0 → 8`,
  );

// on-screen text of the shots that show the box
const shotText = (id) => {
  for (const p of PARTS)
    for (const s of p.edit.shots) if (s.id === id) return s.text ?? [];
  return null;
};
const expect = (shot, strings) => {
  const t = shotText(shot);
  if (!t) return problems.push(`no shot ${shot} in the edit list`);
  for (const str of strings)
    if (!t.includes(str))
      problems.push(`shot ${shot} text ${JSON.stringify(t)} lacks "${str}"`);
};
expect("1.2", [`PRO +${margin("suzuka1989")} PTS`]);
expect("1.5", [scoreText("suzuka1990"), "SEN", "PRO"]);
expect("2.7", [scoreText("brazil2008")]);
expect("4.2", [scoreText("abuDhabiBefore")]);
expect("5.7", [scoreText("abuDhabiFinal")]);
expect(
  "6.1",
  MARGIN_SEQUENCE.map((id) => (margin(id) ? `+${margin(id)} PTS` : "0 PTS")),
);

console.log(
  `margins ${seq.join(" → ")}; scores ${Object.keys(STANDINGS)
    .map((id) => scoreText(id))
    .join(", ")}`,
);
for (const p of problems) console.log(`FAIL  ${p}`);
console.log(
  problems.length ? `${problems.length} problem(s)` : "No problems found",
);
process.exit(problems.length ? 1 : 0);
