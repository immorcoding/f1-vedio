// Sync check (卡点检查) for the edit list against the beat map. Run: npm run check:edit
// - parts tile the song from 1.1 to the end (112 bars), each starting on a bar line
// - inside each part the shots tile its bars: first shot on the part's start, every cut is the
//   next shot's start (no gap, no overlap), last cut on the part's end
// - every cut and every cue sits on a beat of the grid (whole bar and beat) — so on a frame
//   produced by the one rounding rule in src/mv/timing.ts
// - cues sit inside their shot (the cut itself allowed); ids are unique
// - every music hit owned by a cut part has a cue with its id at its position (stub parts skip this)
// - every SFX cue (src/mv/sfx.ts) sits on beats, starts in the shot it names, and every shot under it has cars on screen
import * as T from "../src/mv/timing.ts";
import { PARTS } from "../src/mv/edit-list.ts";
import { SFX } from "../src/mv/sfx.ts";

const problems = [];
const problem = (where, msg) => problems.push(`${where}: ${msg}`);
const L = T.posLabel;
const B = T.beatsAt;

// parts tile the song
if (!T.samePos(PARTS[0].from, T.SONG_START))
  problem(PARTS[0].id, `starts at ${L(PARTS[0].from)}, not 1.1`);
if (!T.samePos(PARTS.at(-1).to, T.SONG_END))
  problem(
    PARTS.at(-1).id,
    `ends at ${L(PARTS.at(-1).to)}, not ${L(T.SONG_END)}`,
  );
PARTS.forEach((p, i) => {
  if (!T.isBarLine(p.from) || !T.isBarLine(p.to))
    problem(p.id, `bounds ${L(p.from)}–${L(p.to)} are not bar lines`);
  if (i > 0 && !T.samePos(PARTS[i - 1].to, p.from))
    problem(
      p.id,
      `starts at ${L(p.from)} but ${PARTS[i - 1].id} ends at ${L(PARTS[i - 1].to)}`,
    );
});

const shotIds = new Set();
const cueIds = new Map(); // id → { part, at }
for (const part of PARTS) {
  const shots = part.edit.shots;
  if (!shots.length) {
    problem(part.id, "no shots");
    continue;
  }
  if (!T.samePos(shots[0].from, part.from))
    problem(
      part.id,
      `first shot ${shots[0].id} starts at ${L(shots[0].from)}, part starts at ${L(part.from)}`,
    );
  if (!T.samePos(shots.at(-1).to, part.to))
    problem(
      part.id,
      `last shot ${shots.at(-1).id} cuts at ${L(shots.at(-1).to)}, part ends at ${L(part.to)}`,
    );
  shots.forEach((s, i) => {
    const where = `${part.id} shot ${s.id}`;
    if (shotIds.has(s.id)) problem(where, "duplicate shot id");
    shotIds.add(s.id);
    for (const [name, p] of [
      ["start", s.from],
      ["cut", s.to],
    ])
      if (!T.isOnGrid(p)) problem(where, `${name} ${L(p)} is not on a beat`);
    if (B(s.to) <= B(s.from))
      problem(where, `cut ${L(s.to)} is not after start ${L(s.from)}`);
    if (T.framesBetween(s.from, s.to) <= 0) problem(where, "lasts no frames");
    const next = shots[i + 1];
    if (next) {
      const gap = B(next.from) - B(s.to);
      if (gap > 0)
        problem(
          where,
          `gap of ${gap} beat(s) before ${next.id} (${L(s.to)} → ${L(next.from)})`,
        );
      if (gap < 0)
        problem(
          where,
          `overlaps ${next.id} by ${-gap} beat(s) (${L(next.from)} < ${L(s.to)})`,
        );
    }
    for (const c of s.cues ?? []) {
      if (!T.isOnGrid(c.at))
        problem(where, `cue ${c.id} at ${L(c.at)} is not on a beat`);
      if (B(c.at) < B(s.from) || B(c.at) > B(s.to))
        problem(
          where,
          `cue ${c.id} at ${L(c.at)} is outside the shot ${L(s.from)}–${L(s.to)}`,
        );
      if (cueIds.has(c.id)) problem(where, `duplicate cue id ${c.id}`);
      cueIds.set(c.id, { part: part.id, at: c.at });
    }
  });
}

// music hits ↔ cues
for (const [id, at] of Object.entries(T.HITS)) {
  const owner = PARTS.find((p) => id.startsWith(`${p.id}.`));
  if (!owner) {
    problem(`hit ${id}`, "names no part");
    continue;
  }
  const cue = cueIds.get(id);
  if (cue && !T.samePos(cue.at, at))
    problem(`hit ${id}`, `cue at ${L(cue.at)}, music hit at ${L(at)}`);
  if (owner.edit.status === "cut" && !cue)
    problem(
      `hit ${id}`,
      `${owner.id} has no cue for the music hit at ${L(at)}`,
    );
}

// SFX cues (src/mv/sfx.ts): on the grid, inside the shot they name, and that shot shows cars (not a title card or
// black); ids unique. An engine must never play over a shot without cars.
const sfxIds = new Set();
for (const c of SFX) {
  const where = `sfx ${c.id}`;
  if (sfxIds.has(c.id)) problem(where, "duplicate id");
  sfxIds.add(c.id);
  if (!T.isOnGrid(c.from) || !T.isOnGrid(c.to))
    problem(where, `${L(c.from)}–${L(c.to)} is not on beats`);
  if (B(c.to) <= B(c.from)) problem(where, "ends before it starts");
  const shot = PARTS.flatMap((p) => p.edit.shots).find((s) => s.id === c.shot);
  if (!shot) {
    problem(where, `names no shot ${c.shot}`);
    continue;
  }
  // a cue starts in the shot it names and may run on across the cuts into the following shots, as long as every
  // shot under it shows cars
  const all = PARTS.flatMap((p) => p.edit.shots);
  if (B(c.from) < B(shot.from) || B(c.from) >= B(shot.to))
    problem(
      where,
      `starts at ${L(c.from)}, outside shot ${shot.id} (${L(shot.from)}–${L(shot.to)})`,
    );
  const under = all.filter((s) => B(s.from) < B(c.to) && B(s.to) > B(c.from));
  for (const s of under)
    if (s.view === "title" || s.view === "black")
      problem(where, `runs over shot ${s.id}, a ${s.view} view, no cars on screen`);
}

// report
for (const part of PARTS) {
  const frames = `${T.frameAt(part.from)}–${T.frameAt(part.to)}`;
  console.log(
    `${part.edit.status === "stub" ? "stub" : "cut "}  ${part.id.padEnd(13)} ${L(part.from).padStart(5)}–${L(part.to).padEnd(5)} frames ${frames}`,
  );
  if (part.edit.status === "stub") continue;
  for (const s of part.edit.shots) {
    console.log(
      `        ${s.id.padEnd(6)} ${L(s.from).padStart(5)}–${L(s.to).padEnd(5)} frames ${T.frameAt(s.from)}–${T.frameAt(s.to)} (${T.framesBetween(s.from, s.to)})  ${s.view}`,
    );
    for (const c of s.cues ?? [])
      console.log(
        `               cue ${c.id.padEnd(20)} ${L(c.at).padStart(5)}  frame ${T.frameAt(c.at)}  ${T.secondsAt(c.at).toFixed(5)} s`,
      );
  }
}
for (const c of SFX)
  console.log(
    `sfx   ${c.id.padEnd(22)} ${L(c.from).padStart(5)}–${L(c.to).padEnd(5)} frames ${T.frameAt(c.from)}–${T.frameAt(c.to)}  shot ${c.shot}  ${c.end}  ${c.cars.map((x) => `${x.who} ${x.era}`).join(", ")}`,
  );
const total = T.frameAt(PARTS.at(-1).to) - T.frameAt(PARTS[0].from);
console.log(
  `Picture: ${T.BARS} bars, ${total} frames (${(total / T.FPS).toFixed(3)} s); ${shotIds.size} shots, ${cueIds.size} cues`,
);
for (const p of problems) console.log(`FAIL  ${p}`);
console.log(
  problems.length ? `${problems.length} problem(s)` : "No problems found",
);
process.exit(problems.length ? 1 : 0);
