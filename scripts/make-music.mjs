// Synthesises the MV score (AUD-1..3) and writes the beat map next to it.
//   public/music/mv.wav        48 kHz, 16-bit stereo, exactly 210 s
//   public/music/beat-map.json every section, bar line, beat and hit with its second, sample and frame
// Run: npm run music  (or: node scripts/make-music.mjs [outDir])
//
// Original, code-synthesised electronic track: 128 BPM, 4/4, 112 bars, D minor throughout.
// Every time comes from src/mv/timing.ts. Deterministic: seeded noise, no clocks, fixed order.
// This is the first cut (ticket #4): the section structure and the hits are final, the
// arrangement is rough and gets polished in ticket #10.
import fs from "node:fs";
import path from "node:path";
import * as T from "../src/mv/timing.ts";
import { integratedLoudness, limit } from "./lib/audio.mjs";
import { buildBeatMap, formatBeatMap } from "./lib/beat-map.mjs";

const SR = T.SAMPLE_RATE;
const N = T.sampleAt(T.SONG_END);
const BEAT = T.SAMPLES_PER_BEAT;
const at = T.at;
const S = (bar, beat = 1) => T.sampleAt(at(bar, beat));
const TARGET_LUFS = -14;
const CEILING_DB = -2.5; // true-peak ceiling of the limiter; leaves room under the −1 dBTP check

const L = new Float64Array(N);
const R = new Float64Array(N);
// Send bus for the ping-pong delay (pad, arp, stabs).
const DL = new Float64Array(N);
const DR = new Float64Array(N);

// 鈹€鈹€ helpers 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€
const mulberry32 = (seed) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);
const clamp01 = (x) => Math.min(1, Math.max(0, x));
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
// Piecewise-linear automation over song positions: [[Pos, value], 鈥.
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

// 鈹€鈹€ harmony: D minor, i鈥揤I鈥揑II鈥揤II (Dm | Bb | F | C) 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€
const CHORDS = [
  [50, 53, 57, 62], // Dm: D F A D
  [50, 53, 58, 62], // Bb: D F Bb D
  [48, 53, 57, 60], // F:  C F A C
  [48, 52, 55, 60], // C:  C E G C
];
const ROOTS = [38, 34, 41, 36]; // D2 Bb1 F2 C2
const chordAt = (bar) => {
  if (bar <= 8 || bar >= 109) return 0; // intro and the last bars: a Dm drone
  if (bar >= 61 && bar <= 72) return Math.floor((bar - 61) / 2) % 4; // Bahrain: half-time chords
  return (bar - 1) % 4;
};
const barOf = (n) => Math.floor(n / (BEAT * T.BEATS_PER_BAR)) + 1;

// 鈹€鈹€ kick pattern (also drives the sidechain duck) 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€
const kicks = [];
for (let bar = 1; bar <= T.BARS; bar++) {
  for (let beat = 1; beat <= 4; beat++) {
    const four = inBars(bar, [
      [9, 60],
      [81, 108],
    ]);
    const half = inBars(bar, [[73, 78]]) && (beat === 1 || beat === 3);
    if (four || half)
      kicks.push({ n: S(bar, beat), gain: bar >= 81 && bar <= 104 ? 1 : 0.85 });
  }
}
const duck = new Float64Array(N).fill(1);
for (const k of kicks) {
  const len = Math.round(BEAT * 0.9);
  for (let i = 0; i < len && k.n + i < N; i++) {
    const t = i / SR;
    duck[k.n + i] = Math.min(duck[k.n + i], 1 - 0.55 * Math.exp(-t / 0.11));
  }
}

// 鈹€鈹€ pad: 4 voices 脳 3 detuned saws, gliding chord changes, low-pass sweep 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€
{
  const level = curve([
    [at(1), 0],
    [at(3), 0.75],
    [at(9), 0.8],
    [at(9, 2), 0.45],
    [at(57), 0.45],
    [at(61), 0.45],
    [at(61, 2), 0.95],
    [at(72, 4), 0.95],
    [at(73), 0.5],
    [at(81), 0.5],
    [at(105), 0.55],
    [at(109), 0.8],
    [at(111), 0.8],
    [at(113), 0],
  ]);
  const cutoff = curve([
    [at(1), 300],
    [at(5), 700],
    [at(9), 1500],
    [at(33), 1500],
    [at(57), 2000],
    [at(61), 600],
    [at(73), 600],
    [at(81), 2600],
    [at(105), 2000],
    [at(109), 700],
    [at(113), 300],
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
    const chord = CHORDS[chordAt(barOf(n))];
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

// 鈹€鈹€ low pulse: intro, outro, and the heartbeat after Bahrain's impact 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€
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
    [at(105), 0.4],
    [at(109), 0.45],
    [at(112), 0.3],
    [at(113), 0],
  ]);
  for (let bar = 1; bar <= T.BARS; bar++) {
    for (let e = 0; e < 8; e++) {
      const n = S(bar) + (e * BEAT) / 2;
      if (bar <= 8 || bar >= 109)
        thump(
          n,
          110,
          midi(38),
          0.09,
          pulseGain(n) * (e % 2 === 0 ? 0.32 : 0.2),
        );
    }
    if (bar >= 61 && bar <= 72) {
      // heart at 64 BPM: lub on beats 1 and 3, dub a sixteenth later
      for (const beat of [1, 3]) {
        if (bar === 61 && beat === 1) continue; // the impact owns that downbeat
        const fade = bar === 72 && beat === 3 ? 0.6 : 1;
        thump(S(bar, beat), 90, 48, 0.12, 0.42 * fade);
        thump(S(bar, beat) + BEAT / 4, 80, 45, 0.09, 0.26 * fade);
      }
    }
  }
}

// 鈹€鈹€ kick 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€
for (const k of kicks) {
  addEvent(k.n, Math.round(SR * 0.45), (i) => {
    const t = i / SR;
    const ph =
      2 * Math.PI * (48 * t + ((160 - 48) * (1 - Math.exp(-t * 32))) / 32);
    const click = i < 96 ? (1 - i / 96) * 0.25 : 0;
    return (
      (Math.tanh(1.6 * Math.sin(ph)) * Math.exp(-t / 0.16) + click) *
      0.42 *
      k.gain
    );
  });
}

// 鈹€鈹€ saw bass 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€
{
  const rng = mulberry32(101);
  for (let bar = 9; bar <= 106; bar++) {
    if (bar >= 61 && bar <= 72) continue;
    const root = ROOTS[chordAt(bar)];
    const rolling = inBars(bar, [
      [33, 60],
      [81, 104],
    ]);
    const drop = inBars(bar, [[81, 104]]);
    const steps = rolling ? 16 : 8;
    for (let s = 0; s < steps; s++) {
      if (s % (steps / 4) === 0) continue; // leave the downbeats to the kick
      const n = S(bar) + (s * BEAT * 4) / steps;
      const octave = drop && s % 4 === 3 ? 12 : 0;
      const f = midi(root + octave);
      const len = Math.round(((BEAT * 4) / steps) * 0.9);
      const lp = lowpass(1.4);
      const cut =
        bar >= 73 && bar <= 80
          ? 300 + 1800 * ((bar - 73) / 8)
          : drop
            ? 1400
            : 900;
      let ph = rng();
      const g = (drop ? 0.2 : 0.16) * (bar >= 105 ? 0.7 : 1);
      addEvent(n, len, (i) => {
        const dt = f / SR;
        ph += dt;
        if (ph >= 1) ph -= 1;
        const saw = 2 * ph - 1 - polyblep(ph, dt);
        const env = Math.exp(-i / (SR * 0.06));
        const y =
          lp(saw, 120 + cut * env) *
          Math.min(1, i / 48) *
          Math.min(1, (len - i) / 96);
        return Math.tanh(y * 1.8) * g * duck[n + i];
      });
    }
  }
}

// 鈹€鈹€ hats, clap, crashes 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€
{
  const rng = mulberry32(202);
  const noise = () => rng() * 2 - 1;
  const hat = (n, gain, decay, pan) => {
    const hp = highpass1(7000);
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
      return (hp(noise()) * burst + body) * gain;
    });
  };
  for (let bar = 9; bar <= 106; bar++) {
    if (bar >= 61 && bar <= 80) continue;
    const dense = inBars(bar, [
      [33, 60],
      [81, 104],
    ]);
    if (bar >= 17) {
      for (let s = 0; s < 16; s++) {
        const n = S(bar) + (s * BEAT) / 4;
        if (s % 4 === 2)
          hat(
            n,
            bar >= 81 && bar <= 104 ? 0.11 : 0.08,
            bar >= 81 && bar <= 104 ? 0.05 : 0.02,
            0.2,
          );
        else if (dense && s % 2 === 1) hat(n, 0.035, 0.012, -0.25);
        else if (dense && s % 4 === 0) hat(n, 0.025, 0.01, 0);
      }
    }
    if (bar >= 25) {
      for (const beat of [2, 4])
        clap(S(bar, beat), bar >= 81 && bar <= 104 ? 0.3 : 0.24);
    }
  }
  // snare roll into the drop (bars 77鈥?0): eighths, sixteenths, then thirty-seconds
  for (let bar = 77; bar <= 80; bar++) {
    const div = bar <= 78 ? 2 : bar === 79 ? 4 : 8;
    for (let s = 0; s < 4 * div; s++) {
      const n = S(bar) + (s * BEAT) / div;
      const grow = (T.beatsAt(at(bar)) + s / div - T.beatsAt(at(77))) / 16;
      clap(Math.round(n), 0.06 + 0.2 * grow);
    }
  }
}

// 鈹€鈹€ rain: Brazil's high end is a hiss of drops (bars 33鈥?6) 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€
{
  const rng = mulberry32(303);
  const hp = highpass1(5000);
  const level = curve([
    [at(33), 0],
    [at(35), 0.05],
    [at(55), 0.07],
    [at(57), 0],
  ]);
  for (let n = S(33); n < S(57); n++) {
    const drop = rng() < 0.0009 ? 6 : 1;
    const s = hp(rng() * 2 - 1) * level(n) * drop;
    const pan = Math.sin(n / 9000) * 0.5;
    L[n] += s * (1 - pan);
    R[n] += s * (1 + pan);
  }
}

// 鈹€鈹€ arpeggio and stabs 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€
{
  const pluck = (n, note, len, gain, cut, pan) => {
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
        const env = Math.exp(-i / (SR * 0.09));
        const s =
          lp(saw, 300 + cut * env) *
          env *
          gain *
          Math.min(1, i / 40) *
          duck[n + i];
        return [s * (1 - pan), s * (1 + pan)];
      },
      [L, R],
      0.35,
    );
  };
  for (let bar = 25; bar <= 104; bar++) {
    if (bar >= 57 && bar <= 80) continue;
    const chord = CHORDS[chordAt(bar)];
    const tones = [chord[1] + 12, chord[2] + 12, chord[3] + 12, chord[2] + 24];
    const drop = bar >= 81;
    const gain = drop ? 0.07 : bar >= 41 ? 0.055 : 0.035;
    for (let s = 0; s < 16; s++) {
      pluck(
        S(bar) + (s * BEAT) / 4,
        tones[s % 4],
        Math.round(BEAT / 4),
        gain,
        drop ? 3500 : 2200,
        s % 2 ? 0.3 : -0.3,
      );
    }
    if (drop) {
      // off-beat chord stabs
      for (const beat of [1, 2, 3, 4]) {
        for (const note of chord)
          pluck(
            S(bar, beat) + BEAT / 2,
            note + 12,
            Math.round(BEAT * 0.45),
            0.03,
            2800,
            0,
          );
      }
    }
  }
}

// 鈹€鈹€ riser: bars 73鈥?0, noise sweep plus a climbing saw, cut dead at the drop 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€
{
  const rng = mulberry32(404);
  const lpN = lowpass(2.5);
  const lpS = lowpass(1);
  let ph = 0;
  const a = S(73);
  const b = S(81);
  for (let n = a; n < b; n++) {
    const x = (n - a) / (b - a);
    const f = midi(50) * Math.pow(2, 3 * x * x);
    const dt = f / SR;
    ph += dt;
    if (ph >= 1) ph -= 1;
    const saw = 2 * ph - 1 - polyblep(ph, dt);
    const s =
      (lpN(rng() * 2 - 1, 400 + 9000 * x * x) * 0.5 +
        lpS(saw, 400 + 3000 * x) * 0.25) *
      0.25 *
      x *
      x;
    L[n] += s;
    R[n] += s;
  }
}

// 鈹€鈹€ hits: the accents the picture lands on (timing.ts HITS) 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€
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
      const k = Number(id.slice(-1)); // 1鈥?, each one heavier
      thud(n, 0.35 + 0.05 * k);
      boom(n, 0.3 + 0.04 * k, 0.35 + 0.05 * k);
      stab(n, 0.02 + 0.004 * k);
    } else if (id === "intro.lightsOut" || id === "buildup.drop") {
      boom(n, 0.6, 0.9, 150, 34);
      crash(n, 0.22, 1.6);
      stab(n, 0.035, BEAT * 3);
    } else if (id === "bahrain2020.impact") {
      boom(n, 0.75, 1.4, 180, 30);
      crash(n, 0.3, 2.4);
      thud(n, 0.6);
    } else {
      boom(n, 0.5, 0.6);
      crash(n, 0.18, 1.2);
    }
  }
  // crashes that open the busy sections
  for (const bar of [33, 57, 105]) crash(S(bar), 0.12, 1.4);
}

// 鈹€鈹€ ping-pong delay (dotted eighth) on the send bus 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€
{
  const d = Math.round(BEAT * 0.75);
  for (let n = d; n < N; n++) {
    DL[n] += DR[n - d] * 0.35;
    DR[n] += DL[n - d] * 0.35;
  }
  const lpL = lowpass(0.7);
  const lpR = lowpass(0.7);
  for (let n = 0; n < N; n++) {
    L[n] += lpL(DL[n], 4000) * 0.5;
    R[n] += lpR(DR[n], 4000) * 0.5;
  }
}

// 鈹€鈹€ master: loudness to target, peak limit, hard silence at the very end 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€
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
  if (Math.abs(step) < 0.05) break;
  const g = Math.pow(10, step / 20);
  for (let n = 0; n < N; n++) {
    L[n] *= g;
    R[n] *= g;
  }
  gainDb += step;
  limit(L, R, SR, CEILING_DB);
}
const finalLufs = integratedLoudness(L, R, SR);

// 鈹€鈹€ write 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€
const outDir = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.join(import.meta.dirname, "..", "public", "music");
fs.mkdirSync(outDir, { recursive: true });
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
const q = (x) => Math.round(Math.max(-1, Math.min(1, x)) * 32767);
for (let n = 0; n < N; n++) {
  wav.writeInt16LE(q(L[n]), 44 + n * 4);
  wav.writeInt16LE(q(R[n]), 46 + n * 4);
}
fs.writeFileSync(path.join(outDir, "mv.wav"), wav);
fs.writeFileSync(
  path.join(outDir, "beat-map.json"),
  formatBeatMap(buildBeatMap()),
);
console.log(
  `wrote ${path.join(outDir, "mv.wav")} (${T.DURATION_SECONDS}s, gain ${gainDb.toFixed(2)} dB, ${finalLufs.toFixed(2)} LUFS by the internal meter)`,
);
