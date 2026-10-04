// Audio check for the score (AUD-1..3). Run: npm run check:audio  (add --quick to skip the rebuild test)
// - format: 48 kHz, stereo, 16-bit PCM; length exactly the song (112 bars = 210 s)
// - peak: nothing above −1 dBFS, sample or true (inter-sample) peak; loudness: integrated −14 LUFS ± 1 (ffmpeg loudnorm, BS.1770)
// - beat map: public/music/beat-map.json equals the one rebuilt from src/mv/timing.ts
// - hits: every hit in the beat map is an audible attack in the audio, on its sample
// - determinism: two fresh builds are byte-identical, and identical to public/music/mv.wav
import { execFileSync, spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import * as T from "../src/mv/timing.ts";
import { readWav } from "./lib/audio.mjs";
import { buildBeatMap, formatBeatMap } from "./lib/beat-map.mjs";

const ROOT = path.join(import.meta.dirname, "..");
const WAV = path.join(ROOT, "public", "music", "mv.wav");
const MAP = path.join(ROOT, "public", "music", "beat-map.json");
const FFMPEG = path.join(
  ROOT,
  "node_modules",
  "@remotion",
  "compositor-win32-x64-msvc",
  "ffmpeg.exe",
);
const PEAK_MAX_DB = -1;
const LUFS_RANGE = [-15, -13];
const HIT_RISE_DB = 6; // the 25 ms after a hit must be this much louder than the 60 ms before it
const quick = process.argv.includes("--quick");

let failures = 0;
const report = (ok, label, detail) => {
  console.log(
    `${ok ? "PASS" : "FAIL"}  ${label}${detail ? ` — ${detail}` : ""}`,
  );
  if (!ok) failures++;
};
const db = (x) => 20 * Math.log10(x);

if (!fs.existsSync(WAV)) {
  console.log(
    `FAIL  ${path.relative(ROOT, WAV)} is missing — run npm run music`,
  );
  process.exit(1);
}
const wav = readWav(WAV);
const expectFrames = T.sampleAt(T.SONG_END);
report(
  wav.sampleRate === T.SAMPLE_RATE,
  "sample rate",
  `${wav.sampleRate} Hz (want ${T.SAMPLE_RATE})`,
);
report(wav.channels === 2, "channels", `${wav.channels} (want 2)`);
report(wav.bitsPerSample === 16, "bit depth", `${wav.bitsPerSample}-bit PCM`);
report(
  wav.frames === expectFrames,
  "duration",
  `${(wav.frames / wav.sampleRate).toFixed(4)} s, ${wav.frames} samples (want ${T.DURATION_SECONDS} s = ${expectFrames})`,
);

const [L, R] =
  wav.channels === 2 ? wav.samples : [wav.samples[0], wav.samples[0]];
let peak = 0;
for (let i = 0; i < L.length; i++)
  peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
report(
  db(peak) <= PEAK_MAX_DB,
  "sample peak",
  `${db(peak).toFixed(2)} dBFS (max ${PEAK_MAX_DB})`,
);

const ff = spawnSync(
  FFMPEG,
  [
    "-hide_banner",
    "-nostats",
    "-threads",
    "4",
    "-i",
    WAV,
    "-af",
    "loudnorm=print_format=json",
    "-f",
    "null",
    "-",
  ],
  { encoding: "utf8" },
);
const ln = JSON.parse(
  ff.stderr.slice(ff.stderr.lastIndexOf("{"), ff.stderr.lastIndexOf("}") + 1),
);
const lufs = Number(ln.input_i);
report(
  lufs >= LUFS_RANGE[0] && lufs <= LUFS_RANGE[1],
  "integrated loudness",
  `${lufs} LUFS (want ${LUFS_RANGE[0]}…${LUFS_RANGE[1]}), LRA ${ln.input_lra} LU`,
);
// inter-sample peaks survive into the AAC in the render, so hold them under the same ceiling
report(
  Number(ln.input_tp) <= PEAK_MAX_DB,
  "true peak",
  `${ln.input_tp} dBTP (max ${PEAK_MAX_DB})`,
);

// beat map file vs timing.ts
const expectedMap = formatBeatMap(buildBeatMap());
const mapOk =
  fs.existsSync(MAP) &&
  // git may check the file out with CRLF line endings
  fs.readFileSync(MAP, "utf8").replace(/\r\n/g, "\n") === expectedMap;
report(
  mapOk,
  "beat map",
  mapOk
    ? `${path.relative(ROOT, MAP)} matches src/mv/timing.ts`
    : `${path.relative(ROOT, MAP)} is stale — run npm run music`,
);
const map = JSON.parse(expectedMap);
const sectionsTile =
  map.sections[0].from.sample === 0 &&
  map.sections.at(-1).to.sample === expectFrames &&
  map.sections.every(
    (s, i) => i === 0 || s.from.sample === map.sections[i - 1].to.sample,
  );
report(
  sectionsTile,
  "sections",
  map.sections
    .map(
      (s) =>
        `${s.name} ${s.from.bar}–${s.to.bar - 1} (${s.from.seconds}–${s.to.seconds} s)`,
    )
    .join(", "),
);

// hits are audible attacks exactly on their sample
const rms = (a, b) => {
  let e = 0;
  for (let i = Math.max(0, a); i < Math.min(L.length, b); i++)
    e += L[i] * L[i] + R[i] * R[i];
  return Math.sqrt(e / Math.max(1, b - a) / 2) + 1e-9;
};
const ms = (x) => Math.round((x / 1000) * wav.sampleRate);
const weak = [];
for (const h of map.hits) {
  const rise = db(
    rms(h.sample, h.sample + ms(25)) / rms(h.sample - ms(60), h.sample),
  );
  const early = db(
    rms(h.sample - ms(10), h.sample) /
      rms(h.sample - ms(60), h.sample - ms(10)),
  );
  if (rise < HIT_RISE_DB || early > 3)
    weak.push(`${h.id} @${h.bar}.${h.beat} rise ${rise.toFixed(1)} dB`);
}
report(
  !weak.length,
  "hits",
  weak.length
    ? weak.join("; ")
    : `${map.hits.length} hits, each an attack of ≥ ${HIT_RISE_DB} dB starting on its sample`,
);

// loudness shape per section (information for the arrangement, not a pass/fail)
console.log("      section levels (RMS dBFS):");
for (const s of map.sections)
  console.log(
    `        ${s.name.padEnd(14)} ${db(rms(s.from.sample, s.to.sample)).toFixed(1)}`,
  );

// determinism
if (!quick) {
  const hash = (file) =>
    crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
  const builds = [1, 2].map((k) => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), `mv-music-${k}-`));
    execFileSync(
      process.execPath,
      [
        "--disable-warning=MODULE_TYPELESS_PACKAGE_JSON",
        path.join(ROOT, "scripts", "make-music.mjs"),
        dir,
      ],
      { stdio: "ignore" },
    );
    const h = hash(path.join(dir, "mv.wav"));
    fs.rmSync(dir, { recursive: true, force: true });
    return h;
  });
  const current = hash(WAV);
  report(
    builds[0] === builds[1] && builds[0] === current,
    "deterministic",
    `build 1 ${builds[0].slice(0, 12)}, build 2 ${builds[1].slice(0, 12)}, public ${current.slice(0, 12)}`,
  );
} else {
  console.log("skip  deterministic (--quick)");
}

console.log(
  failures ? `${failures} check(s) failed` : "All audio checks passed",
);
process.exit(failures ? 1 : 0);
