// Fact check for the Bahrain 2020 part (STO-3): every number on screen must match the fact register.
// Run: node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON scripts/check-bahrain2020.mjs
// - the impact force and the escape time (27 秒, the FIA summary's figure) the scene draws (FACTS in shots.ts) are the ones in docs/production/facts.md
//   under "2020 巴林大奖赛";
// - the edit list's on-screen text for 3.3, 3.5 and 3.6 carries the same numbers (in English: "67G", "11s", "27s");
// - the halo note on 3.6 ("HALO · MANDATORY SINCE 2018") matches the year registered in facts.md;
// - the 27-second stopwatch (STOPWATCH): its hand moves only on a heartbeat (beats 1 and 3 of bars 61–72 and 73.1, not
//   the impact's 61.1; scripts/make-music.mjs, MOT-6), never runs backwards, stops on 3.5's panels 1, 2 and 4 at the
//   times their labels show (0s, 11s, 27s) and not on panel 3 (the extinguisher, no verified time, STO-7), ends at the
//   escape time and hands over on 3.6's "27s" cue.
import { readFileSync } from "node:fs";
import { EDIT, FACTS, STOPWATCH } from "../src/mv/parts/bahrain2020/shots.ts";

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
  if (
    !new RegExp(`医疗车\\s*${FACTS.medicalCarSeconds}\\s*秒内到场`).test(
      section,
    )
  )
    problems.push(
      `facts.md does not register the medical car on scene within ${FACTS.medicalCarSeconds} 秒`,
    );
  if (
    !new RegExp(
      `从\\s*${FACTS.haloMandatorySince}\\s*赛季起所有 F1 赛车必须装 halo`,
    ).test(section)
  )
    problems.push(
      `facts.md does not register the halo as mandatory from ${FACTS.haloMandatorySince}`,
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
if (!text("3.6").includes(`HALO · MANDATORY SINCE ${FACTS.haloMandatorySince}`))
  problems.push(
    `shot 3.6 text "${text("3.6")}" does not show HALO · MANDATORY SINCE ${FACTS.haloMandatorySince}`,
  );

// the stopwatch
{
  const key = (p) => (p.bar - 1) * 4 + (p.beat - 1);
  const label = (p) => `${p.bar}.${p.beat}`;
  const cue = (id) => {
    for (const s of EDIT.shots)
      for (const c of s.cues ?? []) if (c.id === id) return c.at;
    problems.push(`no cue ${id}`);
    return { bar: 0, beat: 0 };
  };
  const heartbeat = (p) =>
    Number.isInteger(p.beat) &&
    (p.beat === 1 || p.beat === 3) &&
    key(p) > key({ bar: 61, beat: 1 }) &&
    key(p) <= key({ bar: 73, beat: 1 });
  let prev = -Infinity;
  let prevSec = 0;
  for (const t of STOPWATCH.ticks) {
    if (!heartbeat(t.at))
      problems.push(`stopwatch tick on ${label(t.at)} is not on a heartbeat`);
    if (key(t.at) <= prev)
      problems.push(`stopwatch tick on ${label(t.at)} is out of order`);
    if (t.seconds < prevSec)
      problems.push(`stopwatch runs backwards on ${label(t.at)}`);
    prev = key(t.at);
    prevSec = t.seconds;
  }
  const stopAt = (id) =>
    STOPWATCH.ticks.find((t) => t.stop && key(t.at) === key(cue(id)));
  const want = [
    ["bahrain2020.panel1", 0],
    ["bahrain2020.panel2", FACTS.medicalCarSeconds],
    ["bahrain2020.panel4", FACTS.escapeSeconds],
  ];
  for (const [id, n] of want) {
    const t = stopAt(id);
    if (!t) problems.push(`the stopwatch does not stop on ${id}`);
    else if (t.seconds !== n)
      problems.push(
        `the stopwatch stops on ${id} at ${t.seconds}s, its panel shows ${n}s`,
      );
  }
  if (stopAt("bahrain2020.panel3"))
    problems.push(
      "the stopwatch stops on the extinguisher panel, whose time is not verified (STO-7)",
    );
  for (const t of STOPWATCH.ticks)
    if (
      t.stop &&
      ![0, FACTS.medicalCarSeconds, FACTS.escapeSeconds].includes(t.seconds)
    )
      problems.push(
        `the stopwatch stops at ${t.seconds}s on ${label(t.at)}, not a registered time`,
      );
  const last = STOPWATCH.ticks[STOPWATCH.ticks.length - 1];
  if (!last.stop || last.seconds !== FACTS.escapeSeconds)
    problems.push(`the stopwatch's last stop is not ${FACTS.escapeSeconds}s`);
  if (key(STOPWATCH.out) !== key(cue("bahrain2020.time")))
    problems.push(
      "the stopwatch does not hand over on 3.6's 27s cue (bahrain2020.time)",
    );
  if (key(last.at) >= key(STOPWATCH.out))
    problems.push("the stopwatch ticks after it hands over");
}

// (3.2's cars are checked by the shared interpenetration check: npm run check:overlap, src/mv/top-views.ts)
console.log(
  `impact ${FACTS.impactG}G, medical car ${FACTS.medicalCarSeconds}s, escape ${FACTS.escapeSeconds}s, halo mandatory since ${FACTS.haloMandatorySince}; stopwatch stops ${STOPWATCH.ticks
    .filter((t) => t.stop)
    .map((t) => `${t.at.bar}.${t.at.beat}=${t.seconds}s`)
    .join(" ")}`,
);
for (const p of problems) console.log(`FAIL  ${p}`);
console.log(
  problems.length ? `${problems.length} problem(s)` : "No problems found",
);
process.exit(problems.length ? 1 : 0);
