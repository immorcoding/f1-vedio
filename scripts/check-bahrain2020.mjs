// Fact check for the Bahrain 2020 part (STO-3): every number on screen must match the fact register.
// Run: node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON scripts/check-bahrain2020.mjs
// - the impact force and the escape time the scene draws (FACTS in shots.ts) are the ones in docs/production/facts.md
//   under "2020 巴林大奖赛";
// - the edit list's on-screen text for 3.3 and 3.6 carries the same numbers.
import { readFileSync } from "node:fs";
import { EDIT, FACTS } from "../src/mv/parts/bahrain2020/shots.ts";
import * as T from "../src/mv/timing.ts";
import {
  CAR_HALF_WIDTH,
  TRACK_HALF,
  carOverlap,
  planCrash,
} from "../src/mv/parts/bahrain2020/crash-geometry.ts";

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

// ART-18: shot 3.2's cars never overlap, except a few frames of real contact at the touch (max 0.1 m)
const s32 = EDIT.shots.find((s) => s.id === "3.2");
const contactCue = s32.cues.find((c) => c.id === "bahrain2020.contact");
const frames = T.framesBetween(s32.from, s32.to);
const contact = T.framesBetween(s32.from, contactCue.at);
const plan = planCrash(frames, contact);
const WINDOW = [contact - 4, contact + 15]; // the wheels rub for ~0.25 s (as registered in staging.ts)
let worst = { o: 0, f: -1 };
for (let f = 0; f <= frames; f++) {
  const o = carOverlap(plan, f);
  const inWindow = f >= WINDOW[0] && f <= WINDOW[1];
  if ((!inWindow && o > 0.001) || (inWindow && o > 0.1))
    problems.push(`3.2 frame ${f}: cars overlap by ${o.toFixed(3)} m`);
  if (o > worst.o) worst = { o, f };
  // both cars stay on the track or the run-off, inside the walls
  for (const [name, p] of [["GRO", plan.gro[f]], ["KVY", plan.kvy[f]]])
    if (p.y - CAR_HALF_WIDTH < -TRACK_HALF - 0.01)
      problems.push(`3.2 frame ${f}: ${name} off the left edge of the track`);
}
console.log(
  `3.2 overlap: worst ${worst.o.toFixed(3)} m at frame ${worst.f} (contact window ${WINDOW[0]}–${WINDOW[1]}, touch at ${contact})`,
);
console.log(`impact ${FACTS.impactG}G, escape ${FACTS.escapeSeconds} 秒`);
for (const p of problems) console.log(`FAIL  ${p}`);
console.log(problems.length ? `${problems.length} problem(s)` : "No problems found");
process.exit(problems.length ? 1 : 0);
