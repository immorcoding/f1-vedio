// Synthesises the MV score (AUD-1..3) and writes the beat map next to it.
//   public/music/mv.wav        48 kHz, 16-bit stereo, exactly 210 s
//   public/music/beat-map.json every section, bar line, beat and hit with its second, sample and frame
// Run: npm run music  (or: node scripts/make-music.mjs [outDir])
//
// Original, code-synthesised electronic track: 128 BPM, 4/4, 113 bars, D minor throughout.
// Under it, the SFX layer (#15): era engine sounds at the cues of src/mv/sfx.ts (scripts/lib/engine.mjs), on their
// own bus, mixed in before the master. `--stems` also writes the engines alone and sfx-report.json.
// Every time comes from src/mv/timing.ts. Deterministic: seeded noise, no clocks, fixed order.
//
// Final arrangement (ticket #10). Tempo, bars, sections and hits are untouched (timing.ts);
// only the orchestration and the energy curve live here. Each section has its own sound:
//   intro    1-8    dark pad + low pulse + sparse high pings, five heavy hits (5-8)
//   suzuka   9-32   tense verse: soft kick, dry staccato bass, tresillo pluck, thin ticks
//   brazil   33-60  rising: rolling bass, 16th arp that opens up, rain (hiss + drops + pings), fills
//   bahrain  57-73  bars 57-60 drive on; hard stop on 61.1 (everything gated); heartbeat + long pad;
//                   bar 73 is the bridge: the pad settles on Dm and decays under a last soft lub on 73.1,
//                   then a reverse swell rises from 73.3 into the riser
//   buildup  74-81  riser, snare roll, half-time then quarter kick, one-eighth gap before the drop
//   abuDhabi 82-105 strongest: heavy kick, the engine bass (#16: a saw/engine voice on an rpm curve, one gear a bar),
//                   supersaw lead, stabs, open hats, snare; inside it (#16): break on 89 (no kick, filtered sweep, a
//                   sixteenth of silence), the biggest impact on 90.1, hats doubling 96-99, a gap and crash + impact on
//                   100.1, drums out 102-103 (pad and bass), a snare on every beat of 104; 1.5 dB under v1's level
//   outro    106-113 layers leave in order: arp/drums, bass, kick; ends on the intro pad and pings
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import * as T from "../src/mv/timing.ts";
import { integratedLoudness, limit } from "./lib/audio.mjs";
import { buildBeatMap, formatBeatMap } from "./lib/beat-map.mjs";
import { driveline, synthEngine } from "./lib/engine.mjs";
import { SFX } from "../src/mv/sfx.ts";

const SR = T.SAMPLE_RATE;
const N = T.sampleAt(T.SONG_END);
const BEAT = T.SAMPLES_PER_BEAT;
const at = T.at;
const S = (bar, beat = 1) => Math.round(T.sampleAt(at(bar, beat)));
const TARGET_LUFS = -14;
const CEILING_DB = -2.5; // true-peak ceiling of the limiter; leaves room under the -1 dBTP check

const L = new Float64Array(N);
const R = new Float64Array(N);
// Send bus for the ping-pong delay (pad, arp, stabs).
const DL = new Float64Array(N);
const DR = new Float64Array(N);

// Silent windows: the hard stop on bar 61 and the breath before the drop. Everything except
// the named hits is cut inside them, including the delay tails.
const GATES = [
  [S(61), S(61, 3)],
  [S(81, 4.5), S(82)],
  // #16: a sixteenth of silence in front of the lock-up (90.1) and the finish (100.1), so both land as attacks
  ...["abuDhabi2021.lockup", "abuDhabi2021.finish"].map((id) => {
    const { bar } = T.HITS[id];
    return [S(bar - 1, 4.75), S(bar)];
  }),
];

// -- helpers ------------------------------------------------------------------------------
const mulberry32 = (seed) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);
const clamp01 = (x) => Math.min(1, Math.max(0, x));
// Linear ramp over bars: v0 before bar a, v1 after bar b.
const ramp = (bar, a, b, v0, v1) =>
  v0 + (v1 - v0) * clamp01((bar - a) / (b - a));
const polyblep = (t, dt) => {
  if (t < dt) {
    t /= dt;
    return t + t - t * t - 1;
  }
  if (t > 1 - dt) {
    t = (t - 1) / dt;
    return t * t + t + t + 1;
  }
  return 0;
};
// Topology-preserving state-variable low-pass; returns a per-sample function of (input, cutoff Hz).
const lowpass = (q = 0.8) => {
  let ic1 = 0;
  let ic2 = 0;
  const k = 1 / q;
  return (x, fc) => {
    const g = Math.tan((Math.PI * Math.min(fc, SR * 0.45)) / SR);
    const a1 = 1 / (1 + g * (g + k));
    const a2 = g * a1;
    const a3 = g * a2;
    const v3 = x - ic2;
    const v1 = a1 * ic1 + a2 * v3;
    const v2 = ic2 + a2 * ic1 + a3 * v3;
    ic1 = 2 * v1 - ic1;
    ic2 = 2 * v2 - ic2;
    return v2;
  };
};
const highpass1 = (fc) => {
  const a = Math.exp((-2 * Math.PI * fc) / SR);
  let px = 0;
  let py = 0;
  return (x) => {
    py = a * (py + x - px);
    px = x;
    return py;
  };
};
// Piecewise-linear automation over song positions: [[Pos, value], ...].
const curve = (points) => {
  const pts = points.map(([p, v]) => [T.sampleAt(p), v]);
  return (n) => {
    if (n <= pts[0][0]) return pts[0][1];
    for (let i = 1; i < pts.length; i++) {
      if (n <= pts[i][0]) {
        const [n0, v0] = pts[i - 1];
        const [n1, v1] = pts[i];
        return v0 + ((v1 - v0) * (n - n0)) / (n1 - n0);
      }
    }
    return pts[pts.length - 1][1];
  };
};
const inBars = (bar, ranges) => ranges.some(([a, b]) => bar >= a && bar <= b);
// Mix one event into a bus, sample by sample: fn(i) returns [left, right] or a mono number.
const addEvent = (start, len, fn, bus = [L, R], send = 0) => {
  for (let i = 0; i < len; i++) {
    const n = start + i;
    if (n >= N) break;
    if (n < 0) continue;
    const v = fn(i);
    const l = typeof v === "number" ? v : v[0];
    const r = typeof v === "number" ? v : v[1];
    bus[0][n] += l;
    bus[1][n] += r;
    if (send) {
      DL[n] += l * send;
      DR[n] += r * send;
    }
  }
};

// -- harmony: D minor, i-VI-III-VII (Dm | Bb | F | C) -------------------------------------
const CHORDS = [
  [50, 53, 57, 62], // Dm: D F A D
  [50, 53, 58, 62], // Bb: D F Bb D
  [48, 53, 57, 60], // F:  C F A C
  [48, 52, 55, 60], // C:  C E G C
];
const ROOTS = [38, 34, 41, 36]; // D2 Bb1 F2 C2
// The bridge (bar 73): Bahrain's pad settles on its home chord, Dm, and decays under a last soft heartbeat; from 73.3 a
// reverse swell (filtered noise and a backwards Dm pad) rises into the riser on 74.1. No key change: the buildup also
// starts on Dm.
const BRIDGE = 73;
const chordAt = (bar) => {
  if (bar <= 8 || bar >= 110) return 0; // intro and the last bars: a Dm drone
  if (bar >= 61 && bar <= 72) return Math.floor((bar - 61) / 2) % 4; // Bahrain: half-time chords
  if (bar === BRIDGE) return 0; // the bridge: home on Dm
  // the bridge bar sits between Bahrain and the buildup, so from 74 on the four-bar cycle counts from bar 2
  return bar > BRIDGE ? (bar - 2) % 4 : (bar - 1) % 4;
};
const barOf = (n) => Math.floor(n / (BEAT * T.BEATS_PER_BAR)) + 1;
const DROP = [82, 105];
const padChord = (n) => CHORDS[chordAt(barOf(n))];
// The drop's inner shape (ticket #16): it is no longer one 24-bar wall. Bar lines from timing.ts's Abu Dhabi hits.
const LOCKUP = T.HITS["abuDhabi2021.lockup"].bar; // 90
const FINISH = T.HITS["abuDhabi2021.finish"].bar; // 100
const POINTS = T.HITS["abuDhabi2021.points"].bar; // 102
const BREAK = LOCKUP - 1; // 89: no kick, a filtered riser sweep, a sixteenth of silence before the lock-up
const CHASE = [FINISH - 4, FINISH - 1]; // 96-99: the hats double and build to the line
const BARE = [POINTS, POINTS + 1]; // 102-103: no drums; pad and the engine bass alone
const SLAM = POINTS + 2; // 104: a snare on every beat under the radio line

// -- kick pattern (also drives the sidechain duck) ----------------------------------------
const kickGain = (bar) => {
  if (bar <= 16) return 0.7; // Suzuka opening: soft and dry
  if (bar <= 32) return 0.8;
  if (bar <= 60) return ramp(bar, 33, 60, 0.85, 0.95);
  if (bar <= 79) return ramp(bar, 74, 79, 0.8, 0.95);
  if (bar <= 105) return 1.15;
  return ramp(bar, 106, 109, 0.9, 0.45); // outro: the kick fades out last
};
const kicks = [];
for (let bar = 1; bar <= T.BARS; bar++) {
  for (let beat = 1; beat <= 4; beat++) {
    // the drop's kick rests in the break (89) and the bare bars (102-103)
    const four = inBars(bar, [
      [9, 60],
      [78, 79],
      [82, BREAK - 1],
      [LOCKUP, BARE[0] - 1],
      [SLAM, 109],
    ]);
    const half = inBars(bar, [[74, 77]]) && (beat === 1 || beat === 3);
    // the lock-up's impact owns 90.1 alone, so the limiter spends its headroom on it and not on a kick under it
    const lockup = bar === LOCKUP && beat === 1;
    if ((four || half) && !lockup)
      kicks.push({
        n: S(bar, beat),
        gain: kickGain(bar),
        drop: bar >= DROP[0] && bar <= DROP[1],
        depth: bar >= DROP[0] && bar <= DROP[1] ? 0.68 : bar <= 32 ? 0.4 : 0.55,
      });
  }
}
const duck = new Float64Array(N).fill(1);
for (const k of kicks) {
  const len = Math.round(BEAT * 0.9);
  for (let i = 0; i < len && k.n + i < N; i++) {
    const t = i / SR;
    duck[k.n + i] = Math.min(duck[k.n + i], 1 - k.depth * Math.exp(-t / 0.11));
  }
}

// -- pad: 4 voices x 3 detuned saws, gliding chord changes, low-pass sweep ----------------
{
  const level = curve([
    [at(1), 0],
    [at(3), 0.75],
    [at(9), 0.8],
    [at(9, 2), 0.3], // Suzuka: the pad steps back, the verse is bass and kick
    [at(33), 0.3],
    [at(57), 0.4],
    [at(60, 4.8), 0.42],
    [at(61), 0], // hard stop
    [at(61, 3), 0.15],
    [at(63), 0.95], // the long pad grows out of the silence
    [at(BRIDGE), 0.95], // the bridge: the Dm pad sustains and decays into the buildup's level
    [at(74), 0.5],
    [at(82), 0.6],
    [at(BREAK), 0.56], // the break: the pad swells with the sweep
    [at(BREAK, 4.75), 0.85],
    [at(LOCKUP), 0.56],
    [at(BARE[0]), 0.52],
    [at(BARE[0], 2), 0.8], // drums out: the pad carries 102-103 with the bass
    [at(SLAM), 0.75],
    [at(SLAM + 1), 0.48],
    [at(106), 0.45],
    [at(110), 0.8],
    [at(112), 0.8],
    [at(114), 0],
  ]);
  const cutoff = curve([
    [at(1), 300],
    [at(5), 700],
    [at(9), 1100],
    [at(33), 1100],
    [at(33, 1), 1300],
    [at(57), 3200], // Brazil: the filter keeps opening
    [at(61), 600],
    [at(65), 500],
    [at(73), 520],
    [at(73, 3), 520], // the bridge holds closed, then opens with the swell into the buildup
    [at(74), 1100],
    [at(82), 3200],
    [at(BREAK), 3000],
    [at(BREAK, 1.25), 450], // the break's filtered sweep: closes, then opens wide into the lock-up
    [at(BREAK, 4.75), 6000],
    [at(LOCKUP), 3000],
    [at(BARE[0]), 2600],
    [at(BARE[1], 4), 1500], // 102-103 darken; the slam opens it again
    [at(SLAM), 2600],
    [at(106), 2000],
    [at(110), 700],
    [at(114), 300],
  ]);
  const phase = new Float64Array(12);
  const freq = new Float64Array(12);
  const det = [-0.006, 0, 0.0055];
  const lpL = lowpass(0.7);
  const lpR = lowpass(0.7);
  const glide = 1 - Math.exp(-1 / (SR * 0.06));
  for (let v = 0; v < 4; v++)
    for (let d = 0; d < 3; d++)
      freq[v * 3 + d] = midi(CHORDS[0][v]) * (1 + det[d]);
  for (let n = 0; n < N; n++) {
    const chord = padChord(n);
    let sl = 0;
    let sr = 0;
    for (let v = 0; v < 4; v++) {
      for (let d = 0; d < 3; d++) {
        const k = v * 3 + d;
        const target = midi(chord[v]) * (1 + det[d]);
        freq[k] += (target - freq[k]) * glide;
        const dt = freq[k] / SR;
        phase[k] += dt;
        if (phase[k] >= 1) phase[k] -= 1;
        const s = 2 * phase[k] - 1 - polyblep(phase[k], dt);
        sl += s * (d === 2 ? 0.35 : 1);
        sr += s * (d === 0 ? 0.35 : 1);
      }
    }
    const fc =
      cutoff(n) * (1 + 0.15 * Math.sin((2 * Math.PI * n) / (SR * 7.5)));
    const g = level(n) * 0.03 * (0.5 + 0.5 * duck[n]);
    const l = lpL(sl, fc) * g;
    const r = lpR(sr, fc) * g;
    L[n] += l;
    R[n] += r;
    DL[n] += l * 0.25;
    DR[n] += r * 0.25;
  }
}

// -- low pulse: intro, outro, and the heartbeat after Bahrain's impact --------------------
{
  const thump = (n, f0, f1, decay, gain) =>
    addEvent(n, Math.round(SR * decay * 6), (i) => {
      const t = i / SR;
      const ph =
        2 * Math.PI * (f1 * t + ((f0 - f1) * (1 - Math.exp(-t * 25))) / 25);
      return (
        (Math.sin(ph) + 0.3 * Math.sin(2 * ph)) *
        Math.exp(-t / decay) *
        gain *
        Math.min(1, i / 60)
      );
    });
  const pulseGain = curve([
    [at(1), 0.25],
    [at(5), 0.5],
    [at(9), 0.55],
    [at(106), 0.4],
    [at(110), 0.45],
    [at(113), 0.3],
    [at(114), 0],
  ]);
  for (let bar = 1; bar <= T.BARS; bar++) {
    for (let e = 0; e < 8; e++) {
      const n = S(bar) + (e * BEAT) / 2;
      if (bar <= 8 || bar >= 110)
        thump(
          n,
          110,
          midi(38),
          0.09,
          pulseGain(n) * (e % 2 === 0 ? 0.32 : 0.2),
        );
    }
    if (bar >= 61 && bar <= BRIDGE) {
      // heart at 64 BPM: lub on beats 1 and 3, dub a sixteenth later; it softens into the bridge and stops after a
      // last, quieter beat on 73.1 (the resolution)
      for (const beat of [1, 3]) {
        if (bar === 61 && beat === 1) continue; // the impact owns that downbeat
        if (bar === BRIDGE && beat === 3) continue;
        const fade = bar === BRIDGE ? 0.45 : bar === 72 && beat === 3 ? 0.6 : 1;
        thump(S(bar, beat), 90, 48, 0.12, 0.5 * fade);
        thump(S(bar, beat) + BEAT / 4, 80, 45, 0.09, 0.3 * fade);
      }
    }
  }
}

// -- kick ---------------------------------------------------------------------------------
for (const k of kicks) {
  const drop = k.drop;
  addEvent(k.n, Math.round(SR * (drop ? 0.55 : 0.45)), (i) => {
    const t = i / SR;
    const ph =
      2 * Math.PI * (48 * t + ((160 - 48) * (1 - Math.exp(-t * 32))) / 32);
    const click = i < 96 ? (1 - i / 96) * (drop ? 0.4 : 0.25) : 0;
    return (
      (Math.tanh((drop ? 2.2 : 1.6) * Math.sin(ph)) *
        Math.exp(-t / (drop ? 0.2 : 0.16)) +
        click) *
      0.42 *
      k.gain
    );
  });
}

// -- bass: saw bass outside the drop (the drop has the engine bass) -----------------------------------
{
  const rng = mulberry32(101);
  for (let bar = 9; bar <= 107; bar++) {
    if (bar >= 61 && bar <= BRIDGE) continue;
    if (inBars(bar, [DROP])) continue; // the drop has the engine bass (below)
    const root = ROOTS[chordAt(bar)];
    const suz = bar <= 32;
    const buildup = bar >= 74 && bar <= 81;
    // Suzuka: dry and staccato (bars 9-16 only two notes a bar); Brazil rolls in 16ths.
    const steps = suz
      ? bar <= 16
        ? 8
        : bar <= 28
          ? 8
          : 16
      : buildup
        ? bar <= 77
          ? 8
          : 16
        : bar >= 106
          ? 8
          : 16;
    const sparse = bar <= 16;
    for (let s = 0; s < steps; s++) {
      if (s % (steps / 4) === 0) continue; // leave the downbeats to the kick
      if (sparse && s !== 3 && s !== 7) continue;
      if (suz && steps === 16 && s % 2 === 0) continue; // fill: off-sixteenths only
      const n = S(bar) + (s * BEAT * 4) / steps;
      const octave = suz && bar > 16 && s % 4 === 3 ? 12 : 0;
      const f = midi(root + octave);
      const len = Math.round(((BEAT * 4) / steps) * (suz ? 0.6 : 0.9));
      const lp = lowpass(suz ? 2.2 : 1.4);
      const cut = suz
        ? 500 + 250 * clamp01((bar - 9) / 20)
        : buildup
          ? 300 + 1800 * ((bar - 74) / 8)
          : ramp(bar, 33, 60, 800, 1700);
      let ph = rng();
      const g =
        (suz ? 0.15 : ramp(bar, 33, 60, 0.15, 0.2)) *
        (buildup ? 0.7 + 0.3 * ((bar - 74) / 8) : 1) *
        (bar >= 106 ? ramp(bar, 106, 107, 0.7, 0.5) : 1);
      addEvent(n, len, (i) => {
        const dt = f / SR;
        ph += dt;
        if (ph >= 1) ph -= 1;
        const saw = 2 * ph - 1 - polyblep(ph, dt);
        const env = Math.exp(-i / (SR * (suz ? 0.045 : 0.06)));
        const y =
          lp(saw, 120 + cut * env) *
          Math.min(1, i / 48) *
          Math.min(1, (len - i) / 96);
        return Math.tanh(y * 1.8) * g * duck[n + i];
      });
    }
  }
}

// -- the drop's engine bass (#16): a saw and an engine in one voice, its pitch on an rpm curve ---------------------
// Each bar is a gear. The revs pull up through the bar and the gear change drops them on the next bar line; every
// landing is the chord's root and every top a chord tone (the fifth or the octave), so the glide stays in D minor:
//   Dm D2 -> A2 | Bb Bb1 -> Bb2 | F F2 -> C3 | C C2 -> G2, each shift a drop of a fourth to an octave.
// The break (89) revs C2 -> C3 like a riser and the shift lands the lock-up (90.1) on D2; the chase (96-99) pulls
// harder; after the finish the driver lifts (102.1: exhaust pops) and the bass cruises on the roots through 102-103.
// The sound: a polyBLEP saw whose filter opens with the revs, a sine sub on the same pitch, and engine.mjs's synth fed
// this rpm curve (the firing frequency is the note, the other cycle orders and the per-cycle jitter are the rasp).
// Under the 5.1 and 5.4 SFX engines (82-85, 92-95) the voice is darker, so the cars' V6s sit above it.
{
  const GEARS = [
    [38, 45], // Dm
    [34, 46], // Bb
    [41, 48], // F
    [36, 43], // C
  ];
  const plan = (bar) => {
    const [from, to] = GEARS[chordAt(bar)];
    if (bar === BREAK) return { from: 36, to: 48, shape: "rev" }; // C2 -> C3, the riser
    if (inBars(bar, [BARE])) return { from, to: from, shape: "coast" };
    return { from, to, shape: inBars(bar, [CHASE]) ? "chase" : "pull" };
  };
  const ease = (shape, u) =>
    shape === "rev"
      ? Math.pow(Math.min(1, u / 0.94), 1.8) // tops out on 89.4.75, where the gap starts
      : shape === "coast"
        ? 0
        : (1 - Math.exp(-u / (shape === "chase" ? 0.2 : 0.35))) /
          (1 - Math.exp(-1 / (shape === "chase" ? 0.2 : 0.35)));
  const a = S(DROP[0]);
  const top = S(DROP[1] + 1); // the last shift lands on 106.1 (D2, where the outro bass takes over) and fades in a beat
  const b = top + BEAT;
  const len = b - a;
  const semi = new Float64Array(len);
  const CYL = 6;
  const rpm = new Float64Array(len);
  const load = new Float64Array(len);
  const pop = new Float64Array(len);
  const rate = new Float64Array(len).fill(1);
  const SHIFT = Math.round(SR * 0.025); // the power cut before each change
  let cur = 38;
  for (let i = 0; i < len; i++) {
    const n = a + i;
    const bar = Math.min(barOf(n), DROP[1] + 1);
    let target;
    let ld = 1;
    if (bar > DROP[1]) target = 38;
    else {
      const p = plan(bar);
      const u = (n - S(bar)) / (S(bar + 1) - S(bar));
      target = p.from + (p.to - p.from) * ease(p.shape, u);
      if (p.shape === "coast") ld = 0.4;
      else if (S(bar + 1) - n < SHIFT) ld = 0.55;
    }
    // crank inertia, as in engine.mjs's driveline: quick to drop in a shift, a little slower to climb
    const tau = target < cur ? 0.012 : 0.03;
    cur += (target - cur) * (1 - Math.exp(-1 / (SR * tau)));
    semi[i] = cur;
    rpm[i] = (midi(cur) * 120) / CYL; // firing frequency = the note
    load[i] = ld;
    // the lift after the finish: pops and crackle on 102.1
    const since = (n - S(POINTS)) / SR;
    pop[i] = since >= 0 && since < 2.5 ? 0.9 * Math.exp(-since / 0.8) : 0;
  }
  const BASS_ENGINE = {
    name: "drop engine bass",
    cylinders: CYL,
    idle: 0,
    redline: 1,
    shiftAt: 1,
    shiftMs: 12,
    gearTop: [1],
    bright: 900,
    slope: 1.6,
    rough: 0.16,
    formant: [320, 160, 0.6],
    noise: 0.09,
    noiseLp: 1800,
    pops: 0.7,
    turbo: 0,
    ers: 0,
  };
  const body = synthEngine(
    { rpm, load, rate, pop, preset: BASS_ENGINE },
    SR,
    1601,
  );
  const lp = lowpass(1.5);
  const sixteenth = BEAT / 4;
  let ph = 0;
  let phs = 0;
  for (let i = 0; i < len; i++) {
    const n = a + i;
    const bar = barOf(n);
    const f = midi(semi[i]);
    const dt = f / SR;
    ph += dt;
    if (ph >= 1) ph -= 1;
    phs += dt;
    if (phs >= 1) phs -= 1;
    const saw = 2 * ph - 1 - polyblep(ph, dt);
    const dim = inBars(bar, [
      [82, 85],
      [92, 95],
    ])
      ? 0.6
      : 1;
    const rev = clamp01((semi[i] - 33) / 16);
    const fc = (180 + 1500 * rev * load[i]) * dim;
    // a throttle pulse on the sixteenths keeps the drop's drive (not in the bare bars)
    const k = (n - a) % sixteenth;
    const pulse = inBars(bar, [BARE])
      ? 1
      : 0.82 + 0.18 * Math.exp(-k / (SR * 0.035));
    const sub = Math.sin(2 * Math.PI * phs);
    const s =
      0.55 * lp(saw, fc) * (0.6 + 0.4 * load[i]) +
      1.1 * body[i] * dim +
      0.55 * sub;
    const fade =
      i < 400 ? i / 400 : n >= top ? Math.max(0, 1 - (n - top) / BEAT) : 1;
    const y = Math.tanh(1.4 * s) * 0.2 * pulse * fade * duck[n];
    L[n] += y;
    R[n] += y;
  }
}

// -- drums: hats, clap, snare, toms, fills ------------------------------------------------
{
  const rng = mulberry32(202);
  const noise = () => rng() * 2 - 1;
  const HISS = Math.pow(10, -3 / 20); // rev 2: every hiss-type layer (hats, clap and snare noise, rain, wind, riser noise) sits 3 dB lower
  const hat = (n, gain, decay, pan, fc = 7000) => {
    gain *= HISS;
    const hp = highpass1(fc);
    addEvent(n, Math.round(SR * decay * 5), (i) => {
      const s = hp(noise()) * Math.exp(-i / (SR * decay)) * gain;
      return [s * (1 - pan), s * (1 + pan)];
    });
  };
  const clap = (n, gain) => {
    const hp = highpass1(900);
    addEvent(n, Math.round(SR * 0.3), (i) => {
      const t = i / SR;
      // three quick bursts then a tail, like a hand clap
      const burst =
        t < 0.03
          ? Math.exp(-((t * 1000) % 10) / 2.5)
          : Math.exp(-(t - 0.03) / 0.07);
      const body = Math.sin(2 * Math.PI * 190 * t) * Math.exp(-t / 0.04) * 0.4;
      return (hp(noise()) * burst * HISS + body) * gain;
    });
  };
  const snare = (n, gain, decay = 0.13) => {
    const hp = highpass1(1400);
    addEvent(n, Math.round(SR * decay * 5), (i) => {
      const t = i / SR;
      const body =
        Math.sin(2 * Math.PI * (185 + 90 * Math.exp(-t * 60)) * t) *
        Math.exp(-t / 0.07);
      return (
        (hp(noise()) * Math.exp(-t / decay) * 0.8 * HISS + body * 0.6) * gain
      );
    });
  };
  const tom = (n, f0, gain) => {
    addEvent(n, Math.round(SR * 0.4), (i) => {
      const t = i / SR;
      const ph =
        2 *
        Math.PI *
        (f0 * 0.6 * t + (f0 * 0.4 * (1 - Math.exp(-t * 30))) / 30);
      return Math.sin(ph) * Math.exp(-t / 0.12) * gain;
    });
  };
  for (let bar = 9; bar <= 60; bar++) {
    const suz = bar <= 32;
    if (bar >= 17) {
      for (let s = 0; s < 16; s++) {
        const n = S(bar) + (s * BEAT) / 4;
        if (suz) {
          // thin and closed: offbeat ticks, sixteenths only in the second half
          if (s % 4 === 2) hat(n, 0.05, 0.015, 0.15, 9000);
          else if (bar >= 25 && s % 2 === 1) hat(n, 0.018, 0.008, -0.2, 9000);
        } else {
          const up = ramp(bar, 33, 56, 0.8, 1.35);
          if (s % 4 === 2) hat(n, 0.085 * up, 0.045, 0.2);
          else if (s % 2 === 1) hat(n, 0.04 * up, 0.012, -0.25);
          else if (s % 4 === 0) hat(n, 0.025 * up, 0.01, 0);
        }
      }
    }
    // backbeat
    if (suz) {
      if (bar >= 25) clap(S(bar, 4), 0.14); // only beat 4: the verse limps
    } else {
      for (const beat of [2, 4]) {
        clap(S(bar, beat), ramp(bar, 33, 56, 0.17, 0.26));
        if (bar >= 41) snare(S(bar, beat), ramp(bar, 41, 60, 0.05, 0.16));
      }
    }
    // fills: a tom run into 33, snare sixteenths into 49 and 57
    if (bar === 32) {
      [0, 1, 2, 3].forEach((k) =>
        tom(S(bar, 4) + (k * BEAT) / 4, [210, 170, 140, 110][k], 0.32),
      );
    } else if (bar === 48 || bar === 56) {
      for (let k = 0; k < 4; k++)
        snare(S(bar, 4) + (k * BEAT) / 4, 0.1 + 0.04 * k, 0.09);
    }
  }
  // buildup: offbeat hats come in at 76, then the snare roll (bars 78-81): eighths, sixteenths,
  // thirty-seconds, growing; the last eighth of bar 81 is the gap (GATES)
  for (let bar = 76; bar <= 77; bar++)
    for (let s = 0; s < 8; s++)
      hat(S(bar) + (s * BEAT) / 2, 0.03 + 0.012 * (bar - 76), 0.025, 0.2);
  for (let bar = 78; bar <= 81; bar++) {
    const div = bar <= 79 ? 2 : bar === 80 ? 4 : 8;
    for (let s = 0; s < 4 * div; s++) {
      const n = S(bar) + (s * BEAT) / div;
      const grow = (T.beatsAt(at(bar)) + s / div - T.beatsAt(at(78))) / 16;
      snare(Math.round(n), 0.06 + 0.3 * grow, 0.07);
      if (bar >= 80) hat(Math.round(n), 0.03 + 0.05 * grow, 0.01, 0);
    }
  }
  // the drop (#16): full groove, then the break (89), the chase (96-99, the hats double), the bare bars (102-103: no
  // drums) and the slam (104: a snare and clap on every beat under the radio line); fills into 98 and 106
  for (let bar = DROP[0]; bar <= DROP[1]; bar++) {
    if (inBars(bar, [BARE])) continue;
    if (bar === BREAK) {
      // offbeat open hats only, and a snare roll that grows from eighths to sixteenths up to the gap on 89.4.75
      for (const beat of [1, 2, 3, 4])
        hat(S(bar, beat) + BEAT / 2, 0.08, 0.06, 0.2);
      for (let s = 0; s < 15; s++) {
        const pos = s < 4 ? s * 2 : 8 + (s - 4); // eighths over beats 1-2, then sixteenths
        if (pos >= 15) break;
        snare(S(bar) + (pos * BEAT) / 4, 0.05 + 0.25 * (pos / 14) ** 1.5, 0.07);
      }
      continue;
    }
    if (bar === SLAM) {
      for (const beat of [1, 2, 3, 4]) {
        snare(S(bar, beat), 0.32, 0.16);
        clap(S(bar, beat), 0.3);
      }
      continue;
    }
    const chase = inBars(bar, [CHASE]);
    const grow = chase ? (bar - CHASE[0]) / 3 : 0;
    const div = chase && bar >= CHASE[0] + 2 ? 32 : 16; // 96-97 sixteenths, 98-99 thirty-seconds
    for (let s = 0; s < div; s++) {
      const n = Math.round(S(bar) + (s * BEAT * 4) / div);
      const q = (s * 16) / div; // position in sixteenths
      if (q % 4 === 2) hat(n, 0.13, 0.075, 0.2);
      else if (chase) {
        // every other step, each bar louder, and a crescendo inside the bar
        const inBar = s / div;
        hat(
          n,
          (0.045 + 0.05 * grow) * (0.75 + 0.5 * inBar),
          0.012,
          s % 2 ? -0.25 : 0.25,
        );
      } else if (q % 2 === 1) hat(n, 0.05, 0.012, -0.25);
      else if (q % 4 === 0) hat(n, 0.035, 0.01, 0);
    }
    for (const beat of [2, 4]) {
      clap(S(bar, beat), 0.28);
      snare(S(bar, beat), 0.2);
    }
    if (bar === CHASE[0] + 1 || bar === DROP[1]) {
      for (let k = 0; k < 4; k++)
        snare(S(bar, 4) + (k * BEAT) / 4, 0.2 + 0.05 * k, 0.09);
    }
  }
}

// -- rain: Brazil only (bars 33-56). A soft band-limited bed plus sparse droplet ticks that thicken
// toward the final laps, then recede. Deterministic, stereo, always under the music. ----------
{
  const rng = mulberry32(303);
  const hpDrop = highpass1(2500);
  // bed: noise low-passed around 2 kHz and high-passed at 350 Hz, one decorrelated copy per side,
  // with a slow swell so it never sounds like a static hiss
  const lpL = lowpass(0.6);
  const lpR = lowpass(0.6);
  const hpL = highpass1(350);
  const hpR = highpass1(350);
  const level = curve([
    [at(33), 0],
    [at(34), 0.12],
    [at(43), 0.45],
    [at(52), 1],
    [at(56), 0.12],
    [at(57), 0],
  ]);
  const BED = 0.2;
  for (let n = S(33); n < S(57); n++) {
    const t = n / SR;
    const swell = 0.8 + 0.2 * Math.sin(2 * Math.PI * t * 0.13 + 1.3);
    const fc = 1900 + 500 * Math.sin(2 * Math.PI * t * 0.07);
    const g = BED * level(n) * swell;
    L[n] += hpL(lpL(rng() * 2 - 1, fc)) * g;
    R[n] += hpR(lpR(rng() * 2 - 1, fc)) * g;
  }
  // droplets: short band-limited ticks at random sample positions, random pan, density and size
  // growing with the level
  for (let bar = 33; bar <= 56; bar++) {
    const len = S(bar + 1) - S(bar);
    const count = Math.round(ramp(bar, 33, 52, 3, 26) * (bar > 52 ? 0.5 : 1));
    for (let k = 0; k < count; k++) {
      const n = S(bar) + Math.floor(rng() * len);
      const lv = level(n);
      if (lv <= 0) continue;
      const pan = rng() * 1.6 - 0.8;
      const f = 1800 + 3200 * rng();
      const gain = (0.016 + 0.025 * rng()) * (0.3 + 0.7 * lv);
      const decay = 0.002 + 0.003 * rng();
      const lpD = lowpass(1.2);
      addEvent(
        n,
        Math.round(SR * decay * 7),
        (i) => {
          const t = i / SR;
          const s = lpD(hpDrop(rng() * 2 - 1), f) * Math.exp(-t / decay) * gain;
          return [s * (1 - pan), s * (1 + pan)];
        },
        [L, R],
        0.5,
      );
    }
  }
  // sparse, wet pings: D minor pentatonic in the top octaves, a few per bar, growing in number
  const penta = [86, 89, 91, 93, 96, 98];
  for (let bar = 35; bar <= 60; bar++) {
    const count = Math.round(ramp(bar, 35, 56, 2, 7));
    for (let k = 0; k < count; k++) {
      const n = S(bar) + Math.floor(rng() * 16) * (BEAT / 4);
      const note = penta[Math.floor(rng() * penta.length)];
      const pan = rng() * 1.2 - 0.6;
      const f = midi(note);
      const gain = 0.02 + 0.012 * rng();
      addEvent(
        n,
        Math.round(SR * 0.4),
        (i) => {
          const t = i / SR;
          const s = Math.sin(2 * Math.PI * f * t) * Math.exp(-t / 0.07) * gain;
          const tick =
            hpDrop(rng() * 2 - 1) * Math.exp(-t / 0.004) * gain * 0.6;
          return [(s + tick) * (1 - pan), (s + tick) * (1 + pan)];
        },
        [L, R],
        0.7,
      );
    }
  }
}

// -- plucks: Suzuka tresillo, Brazil arpeggio, drop arpeggio, stabs and lead -------------
{
  const pluck = (n, note, len, gain, cut, pan, send = 0.35, decay = 0.09) => {
    const f = midi(note);
    const lp = lowpass(1.2);
    let ph = 0;
    addEvent(
      n,
      len,
      (i) => {
        const dt = f / SR;
        ph += dt;
        if (ph >= 1) ph -= 1;
        const saw = 2 * ph - 1 - polyblep(ph, dt);
        const env = Math.exp(-i / (SR * decay));
        const s =
          lp(saw, 300 + cut * env) *
          env *
          gain *
          Math.min(1, i / 40) *
          duck[n + i];
        return [s * (1 - pan), s * (1 + pan)];
      },
      [L, R],
      send,
    );
  };
  for (let bar = 17; bar <= 105; bar++) {
    if (bar >= 57 && bar <= 81) continue;
    if (inBars(bar, [[BARE[0], SLAM]])) continue; // 102-104: pad, bass (and the slam's snares) only
    const chord = CHORDS[chordAt(bar)];
    if (bar <= 32) {
      // Suzuka: dry 3+3+2 pluck, low and tight, nothing like the later arpeggios
      for (const s of [0, 3, 6, 8, 11, 14]) {
        const note =
          chord[s === 6 || s === 14 ? 2 : s === 3 || s === 11 ? 1 : 0];
        pluck(
          S(bar) + (s * BEAT) / 4,
          note + 12,
          Math.round(BEAT / 3),
          ramp(bar, 17, 32, 0.05, 0.07),
          900,
          0,
          0.08,
          0.05,
        );
      }
      continue;
    }
    const tones = [chord[1] + 12, chord[2] + 12, chord[3] + 12, chord[2] + 24];
    const drop = bar >= DROP[0];
    const gain = drop ? 0.075 : ramp(bar, 33, 56, 0.035, 0.07);
    const cut = drop ? 4500 : ramp(bar, 33, 56, 1500, 4200);
    const high = bar >= 98; // last phrase of the drop: arpeggio an octave higher
    for (let s = 0; s < 16; s++) {
      // the break (89) sweeps the arpeggio's filter shut and then wide open into the lock-up
      const sweep =
        bar === BREAK ? (s < 2 ? 0.12 : 0.12 + 1.3 * ((s - 2) / 13) ** 2) : 1;
      pluck(
        S(bar) + (s * BEAT) / 4,
        tones[s % 4] + (high && s % 8 >= 4 ? 12 : 0),
        Math.round(BEAT / 4),
        gain,
        cut * sweep,
        s % 2 ? 0.3 : -0.3,
      );
    }
    if (drop && bar !== BREAK) {
      // off-beat chord stabs
      for (const beat of [1, 2, 3, 4]) {
        for (const note of chord)
          pluck(
            S(bar, beat) + BEAT / 2,
            note + 12,
            Math.round(BEAT * 0.45),
            0.032,
            2800,
            0,
          );
      }
    }
  }
  // Supersaw lead on the drop's four-bar hook: 7 detuned saws, a long delay, entering in 82
  // an octave down and doubled up from 90.
  const hook = [
    [
      [0, 74, 1.5],
      [1.5, 77, 0.5],
      [2, 81, 2],
    ],
    [
      [0, 82, 1.5],
      [1.5, 81, 0.5],
      [2, 77, 2],
    ],
    [
      [0, 77, 1.5],
      [1.5, 81, 0.5],
      [2, 84, 2],
    ],
    [
      [0, 79, 1.5],
      [1.5, 76, 0.5],
      [2, 72, 1.5],
    ],
  ];
  const detune = [-0.012, -0.007, -0.003, 0, 0.003, 0.007, 0.012];
  const lead = (n, note, beats, gain) => {
    const len = Math.round(beats * BEAT * 0.97);
    const lp = lowpass(0.8);
    const ph = detune.map((_, k) => (k * 0.137) % 1);
    const f = midi(note);
    addEvent(
      n,
      len + 2400,
      (i) => {
        let s = 0;
        detune.forEach((d, k) => {
          const dt = (f * (1 + d)) / SR;
          ph[k] += dt;
          if (ph[k] >= 1) ph[k] -= 1;
          s += 2 * ph[k] - 1 - polyblep(ph[k], dt);
        });
        const env =
          Math.min(1, i / 300) *
          (i < len ? 1 : Math.max(0, 1 - (i - len) / 2400));
        const sl = lp(s, 2200 + 3000 * Math.exp(-i / (SR * 0.3))) * env * gain;
        return [sl * 0.9, sl * 0.9];
      },
      [L, R],
      0.45,
    );
  };
  for (let bar = DROP[0]; bar <= DROP[1]; bar++) {
    if (inBars(bar, [[BARE[0], SLAM]])) continue;
    const phrase = hook[(bar - DROP[0]) % 4];
    const gain = bar < 90 ? 0.016 : bar < 98 ? 0.022 : 0.026;
    for (const [off, note, beats] of phrase) {
      const n = S(bar) + Math.round(off * BEAT);
      lead(n, note - (bar < 90 ? 12 : 0), beats, gain);
      if (bar >= 98) lead(n, note + 12, beats, gain * 0.55);
    }
  }
}

// -- bahrain: wind, a ringing ear, a high shimmer over the heartbeat -----------------------
{
  const rng = mulberry32(606);
  const lp = lowpass(1.6);
  const a = S(61, 3);
  const b = S(BRIDGE + 1);
  const wind = curve([
    [at(61, 3), 0],
    [at(64), 0.5],
    [at(72), 1],
    [at(BRIDGE), 0.8],
    [at(BRIDGE + 1), 0], // the wind dies away under the bridge; the riser takes over
  ]);
  for (let n = a; n < b; n++) {
    const t = (n - a) / SR;
    const fc =
      260 +
      500 * (0.5 + 0.5 * Math.sin((2 * Math.PI * t) / 6.3)) +
      400 * clamp01((n - S(64)) / (S(BRIDGE) - S(64)));
    const g = 0.045 * 0.708 * wind(n);
    const s = lp(rng() * 2 - 1, fc) * g;
    const pan = 0.35 * Math.sin((2 * Math.PI * t) / 9.1);
    L[n] += s * (1 - pan);
    R[n] += s * (1 + pan);
  }
  // tinnitus after the impact: a high sine that fades over three bars
  const ringEnd = S(64);
  for (let n = S(61); n < ringEnd; n++) {
    const t = (n - S(61)) / SR;
    const g = 0.012 * Math.exp(-t / 1.6) * Math.min(1, t / 0.05);
    const s =
      (Math.sin(2 * Math.PI * 3150 * t) +
        0.5 * Math.sin(2 * Math.PI * 4720 * t)) *
      g;
    L[n] += s;
    R[n] += s * 0.8;
  }
  // shimmer: octave sines of the long pad, breathing in for bars 65-72, then following it through the bridge and fading
  const sh = curve([
    [at(65), 0],
    [at(BRIDGE), 1],
    [at(BRIDGE, 3), 0.8],
    [at(BRIDGE + 1), 0],
  ]);
  for (let n = S(65); n < b; n++) {
    const t = n / SR;
    const chord = padChord(n);
    let s = 0;
    for (const note of [chord[1] + 24, chord[2] + 24, chord[3] + 24])
      s += Math.sin(2 * Math.PI * midi(note) * t);
    const breath = 0.6 + 0.4 * Math.sin((2 * Math.PI * t) / 3.75);
    const g = 0.0045 * sh(n) * breath;
    L[n] += s * g;
    R[n] += s * g;
    DL[n] += s * g * 0.5;
    DR[n] += s * g * 0.5;
  }
}

// -- intro and outro pings: the same two sparse high notes open and close the song --------
{
  const ping = (n, note, gain) => {
    const f = midi(note);
    addEvent(
      n,
      Math.round(SR * 1.2),
      (i) => {
        const t = i / SR;
        return (
          (Math.sin(2 * Math.PI * f * t) +
            0.25 * Math.sin(2 * Math.PI * f * 2 * t)) *
          Math.exp(-t / 0.3) *
          gain *
          Math.min(1, i / 60)
        );
      },
      [L, R],
      0.7,
    );
  };
  for (const [bar, note] of [
    [1, 81],
    [3, 86],
    [110, 81],
    [112, 86],
  ])
    ping(S(bar, 3), note, 0.03);
}

// -- the bridge's reverse swell: 73.3 -> 74.1, then it hands over to the riser -------------
// Filtered noise whose cutoff climbs, plus a backwards Dm pad (D4 F4 A4 sines), both on a curve that grows
// exponentially to 74.1 and then releases over two beats while the riser comes up. #16: 2.5 dB stronger than v1, so
// the breath before the buildup shows in the waveform.
const SWELL = Math.pow(10, 7 / 20);
{
  const rng = mulberry32(707);
  const lp = lowpass(1.2);
  const a = S(BRIDGE, 3);
  const top = S(BRIDGE + 1);
  const end = S(BRIDGE + 1, 3);
  const notes = [62, 65, 69].map(midi);
  for (let n = a; n < end; n++) {
    const rise = n < top ? (n - a) / (top - a) : 1;
    const env =
      n < top ? Math.pow(rise, 1.7) : Math.pow(1 - (n - top) / (end - top), 2);
    const fc = 300 + 2600 * rise * rise;
    const t = n / SR;
    let pad = 0;
    for (const f of notes) pad += Math.sin(2 * Math.PI * f * t);
    const noise = lp(rng() * 2 - 1, fc);
    const s = (noise * 0.05 + pad * 0.012) * env * SWELL;
    L[n] += s;
    R[n] += s;
    DL[n] += s * 0.3;
    DR[n] += s * 0.3;
  }
}

// -- riser: bars 74-81, noise sweep plus a climbing saw and an upward sine -----------------
{
  const rng = mulberry32(404);
  const lpN = lowpass(2.5);
  const lpS = lowpass(1);
  let ph = 0;
  let ph2 = 0;
  const a = S(74);
  const b = S(82);
  for (let n = a; n < b; n++) {
    const x = (n - a) / (b - a);
    const f = midi(50) * Math.pow(2, 3 * x * x);
    const dt = f / SR;
    ph += dt;
    if (ph >= 1) ph -= 1;
    const saw = 2 * ph - 1 - polyblep(ph, dt);
    ph2 += (midi(62) * Math.pow(2, 3.5 * x * x * x)) / SR;
    const s =
      (lpN(rng() * 2 - 1, 400 + 9000 * x * x) * 0.5 * 0.708 +
        lpS(saw, 400 + 3000 * x) * 0.25 +
        Math.sin(2 * Math.PI * ph2) * 0.12) *
      0.38 *
      x *
      x;
    L[n] += s;
    R[n] += s;
  }
}

// -- the break's riser (#16): bar 89, a noise sweep whose band climbs to the gap on 89.4.75 ------------------------
{
  const rng = mulberry32(808);
  const lp = lowpass(3);
  const hp = highpass1(250);
  const a = S(BREAK);
  const b = S(BREAK, 4.75);
  for (let n = a; n < b; n++) {
    const x = (n - a) / (b - a);
    const s = hp(lp(rng() * 2 - 1, 300 + 9000 * x * x)) * 0.11 * x * x;
    L[n] += s;
    R[n] += s;
  }
}

// Outro: no layer of its own; everything leaves by the rules above (arp and drums at 106, bass at 108,
// kick fades through 109) and the pad, pulse and pings of the intro stay.

// -- energy curve: a slow trim over the whole mix (hits are added after it) ---------------
// The layers above decide the character of each section; this decides how loud it is relative
// to its neighbours: soft Suzuka, Brazil climbing to its peak, a quiet Bahrain, a rising
// buildup, and the drop at full level.
const DROP_TRIM = -1.5;
{
  const trimDb = curve([
    [at(1), 0],
    [at(9), 0],
    [at(9, 2), -1.5],
    [at(32), 0],
    [at(33), -1.5],
    [at(56), 0.5], // rev 2: the old rain spikes used to push the limiter down here; keep the loudness the user heard
    [at(60, 4.8), 0.5],
    [at(61, 3), -2],
    [at(63), -5],
    [at(72), -3.5],
    [at(BRIDGE), -3.5],
    [at(BRIDGE + 1), -3],
    [at(81), 0.5],
    [at(81, 4.5), 0.5],
    // #16: the drop's layers sit lower, so its named hits (added after this trim) have headroom over them
    [at(82), DROP_TRIM],
    [at(105, 4), DROP_TRIM],
    [at(106), 0],
  ]);
  for (let n = 0; n < N; n++) {
    const g = Math.pow(10, trimDb(n) / 20);
    L[n] *= g;
    R[n] *= g;
    DL[n] *= g;
    DR[n] *= g;
  }
}

// -- gates: hard stop on 61.1, a breath before the drop ------------------------------------
for (const [a, b] of GATES)
  for (let n = a; n < b; n++) {
    L[n] = 0;
    R[n] = 0;
  }

// -- hits: the accents the picture lands on (timing.ts HITS) --------------------------------
{
  const rng = mulberry32(505);
  const noise = () => rng() * 2 - 1;
  const boom = (n, gain, decay = 0.6, f0 = 120, f1 = 38) =>
    addEvent(n, Math.round(SR * decay * 5), (i) => {
      const t = i / SR;
      const ph =
        2 * Math.PI * (f1 * t + ((f0 - f1) * (1 - Math.exp(-t * 14))) / 14);
      return Math.tanh(2 * Math.sin(ph)) * Math.exp(-t / decay) * gain;
    });
  const crash = (n, gain, decay = 1.2) => {
    const hp = highpass1(3500);
    const hpR = highpass1(3500);
    addEvent(n, Math.round(SR * decay * 4), (i) => {
      const env = Math.exp(-i / (SR * decay)) * Math.min(1, i / 24);
      return [hp(noise()) * env * gain, hpR(noise()) * env * gain];
    });
  };
  const thud = (n, gain) => {
    // noise burst + low tom: the "clunk" of a big lamp switching on
    const lp = lowpass(1);
    addEvent(n, Math.round(SR * 0.5), (i) => {
      const t = i / SR;
      const tom =
        Math.sin(2 * Math.PI * (75 * t + (85 * (1 - Math.exp(-t * 20))) / 20)) *
        Math.exp(-t / 0.18);
      const burst = lp(noise(), 2500) * Math.exp(-t / 0.035);
      return (tom * 0.8 + burst * 0.9) * gain;
    });
  };
  const stab = (n, gain, len = BEAT * 2) => {
    // the whole Dm chord hit at once, a brass-like saw stab
    const notes = [38, 50, 53, 57, 62];
    const lp = lowpass(0.9);
    const ph = notes.map(() => 0);
    addEvent(
      n,
      Math.round(len),
      (i) => {
        const t = i / SR;
        let s = 0;
        notes.forEach((note, k) => {
          const dt = midi(note) / SR;
          ph[k] += dt;
          if (ph[k] >= 1) ph[k] -= 1;
          s += 2 * ph[k] - 1 - polyblep(ph[k], dt);
        });
        return (
          lp(s, 400 + 3000 * Math.exp(-t / 0.15)) *
          Math.exp(-t / 0.4) *
          gain *
          Math.min(1, i / 30)
        );
      },
      [L, R],
      0.3,
    );
  };
  for (const [id, pos] of Object.entries(T.HITS)) {
    const n = T.sampleAt(pos);
    if (/^intro\.light\d$/.test(id)) {
      const k = Number(id.slice(-1)); // 1-5, each one heavier
      thud(n, 0.35 + 0.05 * k);
      boom(n, 0.3 + 0.04 * k, 0.35 + 0.05 * k);
      stab(n, 0.02 + 0.004 * k);
    } else if (id === "intro.lightsOut") {
      boom(n, 0.6, 0.9, 150, 34);
      crash(n, 0.22, 1.6);
      stab(n, 0.035, BEAT * 3);
    } else if (id === "buildup.drop") {
      // the biggest moment: sub boom, wide crash, full stab, a second low thud
      boom(n, 0.85, 1.1, 170, 32);
      crash(n, 0.34, 2.0);
      stab(n, 0.06, BEAT * 3);
      thud(n, 0.5);
    } else if (id === "bahrain2020.impact") {
      boom(n, 0.8, 1.4, 180, 30);
      crash(n, 0.3, 1.5);
      thud(n, 0.65);
    } else if (id === "abuDhabi2021.lockup") {
      // the biggest impact of the song (#16): out of the break's gap, a longer, lower boom than the drop's, the
      // widest crash, the full stab and a double thud
      boom(n, 1.5, 1.8, 190, 28);
      crash(n, 0.7, 2.6);
      stab(n, 0.12, BEAT * 4);
      thud(n, 0.8);
      thud(n + Math.round(BEAT / 4), 0.4);
      boom(n + Math.round(BEAT / 2), 0.6, 0.9, 120, 30); // a second, lower blow: the tyres locking
    } else if (id === "abuDhabi2021.finish") {
      // the line: crash and impact out of the chase's gap
      boom(n, 1.05, 0.9, 165, 32);
      crash(n, 0.48, 2.2);
      stab(n, 0.05, BEAT * 3);
      thud(n, 0.45);
    } else if (/^abuDhabi2021\./.test(id)) {
      // the points (102.1): the drums stop here, the crash rings over pad and bass
      boom(n, 0.45, 0.7, 150, 34);
      crash(n, 0.24, 2.4);
    } else {
      boom(n, 0.5, 0.6);
      crash(n, 0.18, 1.2);
    }
  }
  // crashes that open the busy sections
  for (const bar of [33, 57, 98, 106])
    crash(S(bar), bar === 98 ? 0.2 : 0.12, 1.4);
}

// -- ping-pong delay (dotted eighth) on the send bus ---------------------------------------
{
  const d = Math.round(BEAT * 0.75);
  const gated = (n) => GATES.some(([a, b]) => n >= a && n < b);
  for (let n = 0; n < N; n++) {
    if (gated(n)) {
      DL[n] = 0;
      DR[n] = 0;
      continue;
    }
    if (n >= d) {
      DL[n] += DR[n - d] * 0.35;
      DR[n] += DL[n - d] * 0.35;
    }
  }
  const lpL = lowpass(0.7);
  const lpR = lowpass(0.7);
  for (let n = 0; n < N; n++) {
    L[n] += lpL(DL[n], 4000) * 0.5;
    R[n] += lpR(DR[n], 4000) * 0.5;
  }
}

// -- SFX: the engines (src/mv/sfx.ts), on their own bus, mixed under the music ---------------
// Each cue drives its cars by road speed (scripts/lib/engine.mjs). Its level is set against the music it plays over:
// in every bar of the cue the engines sit at least `underDb` under the music's RMS in that bar, then pump with the kick's sidechain so the
// music's transients stay on top. "cut" cues stop dead on their end beat (Bahrain's 61.1 goes with the music's stop).
const SL = new Float64Array(N);
const SR_ = new Float64Array(N);
const sfxCues = [];
{
  const rmsOf = (a, b, chans) => {
    let e = 0;
    for (let n = a; n < b; n++) for (const c of chans) e += c[n] * c[n];
    return Math.sqrt(e / Math.max(1, (b - a) * chans.length));
  };
  SFX.forEach((cue, ci) => {
    const a = S(cue.from.bar, cue.from.beat);
    const b = S(cue.to.bar, cue.to.beat);
    const len = b - a;
    const cl = new Float64Array(len);
    const cr = new Float64Array(len);
    cue.cars.forEach((car, k) => {
      const seed = 1000 * (ci + 1) + k;
      const drv = driveline(
        car.era,
        { speed: car.speed, time: cue.time, launch: car.launch },
        len,
        SR,
        seed,
      );
      const y = synthEngine(drv, SR, seed);
      const g = Math.pow(10, (car.db ?? 0) / 20);
      for (let i = 0; i < len; i++) {
        const p = Math.max(-1, Math.min(1, car.pan(i / SR)));
        const th = ((p + 1) * Math.PI) / 4;
        cl[i] += y[i] * g * Math.cos(th) * Math.SQRT2;
        cr[i] += y[i] * g * Math.sin(th) * Math.SQRT2;
      }
    });
    if (cue.muffle) {
      const lpL = lowpass(0.7);
      const lpR = lowpass(0.7);
      for (let i = 0; i < len; i++) {
        cl[i] = lpL(cl[i], cue.muffle);
        cr[i] = lpR(cr[i], cue.muffle);
      }
    }
    // edges: 5 ms in; a 2 ms ramp onto a cut, a quarter-beat fade otherwise
    const tail =
      cue.end === "cut" ? Math.round(SR * 0.002) : Math.round(BEAT / 4);
    for (let i = 0; i < len; i++) {
      const env = Math.min(1, i / (SR * 0.005), (len - i) / tail);
      cl[i] *= env;
      cr[i] *= env;
    }
    // the loudest bar of the cue, against the music in that bar, sets the level: every bar sits at least underDb under
    let gain = Infinity;
    for (
      let bar = cue.from.bar;
      bar < cue.to.bar + (cue.to.beat > 1 ? 1 : 0);
      bar++
    ) {
      const x0 = Math.max(a, S(bar));
      const x1 = Math.min(b, S(bar + 1));
      if (x1 - x0 < BEAT) continue;
      const own = rmsOf(x0 - a, x1 - a, [cl, cr]);
      if (own > 0)
        gain = Math.min(
          gain,
          (rmsOf(x0, x1, [L, R]) * Math.pow(10, -cue.underDb / 20)) / own,
        );
    }
    if (!Number.isFinite(gain)) gain = 0;
    for (let i = 0; i < len; i++) {
      const pump = 0.55 + 0.45 * duck[a + i];
      SL[a + i] += cl[i] * gain * pump;
      SR_[a + i] += cr[i] * gain * pump;
    }
    sfxCues.push({ cue, a, b, gainDb: 20 * Math.log10(gain) });
  });
  for (let n = 0; n < N; n++) {
    L[n] += SL[n];
    R[n] += SR_[n];
  }
}

// Per-bar RMS of the music and of the engines, measured on their buses before the master (the master's gain is added
// below); the SFX report and check-audio's "engines under the music" test read it.
const barEnergy = (() => {
  const rows = [];
  for (let bar = 1; bar <= T.BARS; bar++) {
    const a = S(bar);
    const b = S(bar + 1);
    let m = 0;
    let x = 0;
    for (let n = a; n < b; n++) {
      const ml = L[n] - SL[n];
      const mr = R[n] - SR_[n];
      m += ml * ml + mr * mr;
      x += SL[n] * SL[n] + SR_[n] * SR_[n];
    }
    rows.push({ bar, music: m / (2 * (b - a)), sfx: x / (2 * (b - a)) });
  }
  return rows;
})();
const sfxHash = crypto
  .createHash("sha256")
  .update(new Uint8Array(SL.buffer))
  .update(new Uint8Array(SR_.buffer))
  .digest("hex");

// -- master: loudness to target, peak limit, hard silence at the very end ------------------
for (let i = 0; i < SR * 0.01; i++) {
  const g = i / (SR * 0.01);
  L[N - 1 - i] *= g;
  R[N - 1 - i] *= g;
}
let gainDb = 0;
for (let pass = 0; pass < 4; pass++) {
  const lufs = integratedLoudness(L, R, SR);
  const step = TARGET_LUFS - lufs;
  if (process.env.MUSIC_DEBUG) {
    let pk = 0;
    for (let n = 0; n < N; n++)
      pk = Math.max(pk, Math.abs(L[n]), Math.abs(R[n]));
    console.log(
      `master pass ${pass}: ${lufs.toFixed(2)} LUFS, peak ${(20 * Math.log10(pk)).toFixed(2)} dBFS`,
    );
  }
  // the first pass always limits (the mix can sit on target before the limiter has held its peaks)
  if (pass > 0 && Math.abs(step) < 0.05) break;
  const g = Math.pow(10, step / 20);
  for (let n = 0; n < N; n++) {
    L[n] *= g;
    R[n] *= g;
  }
  gainDb += step;
  limit(L, R, SR, CEILING_DB);
}
const finalLufs = integratedLoudness(L, R, SR);

// -- write ---------------------------------------------------------------------------------
// node scripts/make-music.mjs [outDir] [--stems]
// --stems also writes the engines alone (sfx.wav, at the master's gain) and sfx-report.json: every cue with its
// bar/beat, time and level, the per-bar RMS of music and engines, and a hash of the SFX bus (check-audio reads it).
const args = process.argv.slice(2);
const stems = args.includes("--stems");
const dirArg = args.find((a) => !a.startsWith("--"));
const outDir = dirArg
  ? path.resolve(dirArg)
  : path.join(import.meta.dirname, "..", "public", "music");
fs.mkdirSync(outDir, { recursive: true });
const q = (x) => Math.round(Math.max(-1, Math.min(1, x)) * 32767);
const writeWav = (file, A, B, g = 1) => {
  const wav = Buffer.alloc(44 + N * 4);
  wav.write("RIFF", 0);
  wav.writeUInt32LE(36 + N * 4, 4);
  wav.write("WAVEfmt ", 8);
  wav.writeUInt32LE(16, 16);
  wav.writeUInt16LE(1, 20);
  wav.writeUInt16LE(2, 22);
  wav.writeUInt32LE(SR, 24);
  wav.writeUInt32LE(SR * 4, 28);
  wav.writeUInt16LE(4, 32);
  wav.writeUInt16LE(16, 34);
  wav.write("data", 36);
  wav.writeUInt32LE(N * 4, 40);
  for (let n = 0; n < N; n++) {
    wav.writeInt16LE(q(A[n] * g), 44 + n * 4);
    wav.writeInt16LE(q(B[n] * g), 46 + n * 4);
  }
  fs.writeFileSync(file, wav);
};
writeWav(path.join(outDir, "mv.wav"), L, R);
fs.writeFileSync(
  path.join(outDir, "beat-map.json"),
  formatBeatMap(buildBeatMap()),
);
if (stems) {
  const master = Math.pow(10, gainDb / 20);
  writeWav(path.join(outDir, "sfx.wav"), SL, SR_, master);
  const dB = (e) =>
    e > 0 ? Number((10 * Math.log10(e) + gainDb).toFixed(2)) : null;
  const pos = (p) => ({
    pos: T.posLabel(p),
    seconds: T.secondsAt(p),
    frame: T.frameAt(p),
  });
  const report = {
    note: "Engines (SFX bus) vs music, RMS dBFS per bar at the master's gain, measured before the limiter.",
    sfxHash,
    masterGainDb: Number(gainDb.toFixed(3)),
    cues: sfxCues.map(({ cue, gainDb: g }) => ({
      id: cue.id,
      shot: cue.shot,
      from: pos(cue.from),
      to: pos(cue.to),
      end: cue.end,
      underDb: cue.underDb,
      muffle: cue.muffle ?? null,
      cars: cue.cars.map((c) => `${c.who} ${c.era}`),
      levelDb: Number(g.toFixed(2)),
      note: cue.note,
    })),
    bars: barEnergy.map((r) => ({
      bar: r.bar,
      music: dB(r.music),
      sfx: dB(r.sfx),
    })),
  };
  fs.writeFileSync(
    path.join(outDir, "sfx-report.json"),
    JSON.stringify(report, null, 2) + "\n",
  );
}
console.log(
  `wrote ${path.join(outDir, "mv.wav")} (${T.DURATION_SECONDS}s, gain ${gainDb.toFixed(2)} dB, ${finalLufs.toFixed(2)} LUFS by the internal meter; ${SFX.length} SFX cues, bus ${sfxHash.slice(0, 12)})`,
);
