// Fact check for the Bahrain 2020 part (STO-3): every number on screen must match the fact register.
// Run: node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON scripts/check-bahrain2020.mjs
// - the impact force and the escape time the scene draws (FACTS in shots.ts) are the ones in docs/production/facts.md
//   under "2020 巴林大奖赛";
// - the edit list's on-screen text for 3.3 and 3.6 carries the same numbers.
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
  if (!new RegExp(`约\\s*${FACTS.escapeSeconds}\\s*秒`).test(section))
    problems.push(`facts.md does not register an escape after ${FACTS.escapeSeconds} 秒`);
  if (!/来源/.test(section)) problems.push("the Bahrain facts have no source");
}
const text = (id) => (EDIT.shots.find((s) => s.id === id)?.text ?? []).join(" ");
if (!text("3.3").includes(`${FACTS.impactG}G`))
  problems.push(`shot 3.3 text "${text("3.3")}" does not show ${FACTS.impactG}G`);
if (!text("3.6").includes(`${FACTS.escapeSeconds} 秒`))
  problems.push(`shot 3.6 text "${text("3.6")}" does not show ${FACTS.escapeSeconds} 秒`);

console.log(`impact ${FACTS.impactG}G, escape ${FACTS.escapeSeconds} 秒`);
for (const p of problems) console.log(`FAIL  ${p}`);
console.log(problems.length ? `${problems.length} problem(s)` : "No problems found");
process.exit(problems.length ? 1 : 0);
