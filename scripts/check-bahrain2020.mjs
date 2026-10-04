// Fact check for the Bahrain 2020 part (STO-3): every number on screen must match the fact register.
// Run: node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON scripts/check-bahrain2020.mjs
// - the impact force and the escape time (27 秒, the FIA summary's figure) the scene draws (FACTS in shots.ts) are the ones in docs/production/facts.md
//   under "2020 巴林大奖赛";
// - the edit list's on-screen text for 3.3, 3.5 and 3.6 carries the same numbers (in English: "67G", "11s", "27s").
import { readFileSync } from "node:fs";
import { EDIT, FACTS } from "../src/mv/parts/bahrain2020/shots.ts";

const problems = [];
const md = readFileSync(
  new URL("../docs/production/facts.md", import.meta.url),
  "utf8",
);
const section = md.split(/^## /m).find((s) => s.startsWith("2020 巴林大奖赛"));
if (!section) problems.push("facts.md has no '2020 巴林大奖赛' section");
else {
  if (!new RegExp(`约\\s*${FACTS.impactG}\\s*G`).test(section))
    problems.push(`facts.md does not register an impact of ${FACTS.impactG} G`);
  if (!new RegExp(`${FACTS.escapeSeconds}\\s*秒[^\\n。]*脱身`).test(section))
    problems.push(
      `facts.md does not register an escape after ${FACTS.escapeSeconds} 秒`,
    );
  if (!new RegExp(`医疗车\\s*${FACTS.medicalCarSeconds}\\s*秒内到场`).test(section))
    problems.push(
      `facts.md does not register the medical car on scene within ${FACTS.medicalCarSeconds} 秒`,
    );
  if (!/来源/.test(section)) problems.push("the Bahrain facts have no source");
}
const text = (id) =>
  (EDIT.shots.find((s) => s.id === id)?.text ?? []).join(" ");
if (!text("3.3").includes(`${FACTS.impactG}G`))
  problems.push(
    `shot 3.3 text "${text("3.3")}" does not show ${FACTS.impactG}G`,
  );
// on screen the times are English, a lowercase s after the number (STO-5, ART-6): "0s", "11s", "27s"
const seconds = (id, n) =>
  (EDIT.shots.find((s) => s.id === id)?.text ?? []).includes(`${n}s`);
for (const n of [0, FACTS.medicalCarSeconds, FACTS.escapeSeconds])
  if (!seconds("3.5", n))
    problems.push(`shot 3.5 text "${text("3.5")}" does not show ${n}s`);
if (!seconds("3.6", FACTS.escapeSeconds))
  problems.push(
    `shot 3.6 text "${text("3.6")}" does not show ${FACTS.escapeSeconds}s`,
  );

// (3.2's cars are checked by the shared interpenetration check: npm run check:overlap, src/mv/top-views.ts)
console.log(
  `impact ${FACTS.impactG}G, medical car ${FACTS.medicalCarSeconds}s, escape ${FACTS.escapeSeconds}s`,
);
for (const p of problems) console.log(`FAIL  ${p}`);
console.log(
  problems.length ? `${problems.length} problem(s)` : "No problems found",
);
process.exit(problems.length ? 1 : 0);
