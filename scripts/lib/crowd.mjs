// Grandstand crowd synthesis (ticket #33, review-2 idea #2 "巴西的寂静"): a distant stadium roar built only from code
// (AUD-1: no samples). Three layers, summed per side and then placed far away:
//   bed     two bands of decorrelated noise (the breath of thousands of voices at ~700 Hz and their sibilance at
//           ~2.3 kHz) with slow surges
//   voices  many detuned glottal-pulse voices (110–330 Hz) that shout in bursts: a rising "oh!"/"ah!" glide with
//           vibrato and jitter, through two vowel formant banks; more of them shout as the intensity rises
//   room    a high-pass, a distance low-pass and a short diffuse stadium reverb (four feedback combs per side)
// Deterministic: seeded noise, fixed order, no clocks. Level is left to the caller (it sets the crowd against the
// music bar by bar); the output only follows `intensity`.

const mulberry32 = (seed) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

// RBJ biquad, band-pass with 0 dB peak; returns a per-sample function.
const bandpass = (sr, fc, q) => {
  const w = (2 * Math.PI * fc) / sr;
  const alpha = Math.sin(w) / (2 * q);
  const a0 = 1 + alpha;
  const b0 = alpha / a0;
  const b2 = -alpha / a0;
  const a1 = (-2 * Math.cos(w)) / a0;
  const a2 = (1 - alpha) / a0;
  let x1 = 0;
  let x2 = 0;
  let y1 = 0;
  let y2 = 0;
  return (x) => {
    const y = b0 * x + b2 * x2 - a1 * y1 - a2 * y2;
    x2 = x1;
    x1 = x;
    y2 = y1;
    y1 = y;
    return y;
  };
};
const onePoleLp = (sr, fc) => {
  const a = Math.exp((-2 * Math.PI * fc) / sr);
  let y = 0;
  return (x) => (y = (1 - a) * x + a * y);
};
const onePoleHp = (sr, fc) => {
  const lp = onePoleLp(sr, fc);
  return (x) => x - lp(x);
};
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

// Vowel formants (F1, F2, F3 in Hz, relative gains): "ah" and "oh", the two sounds of a cheering crowd.
const VOWELS = [
  [
    [750, 1.0, 6],
    [1200, 0.6, 8],
    [2600, 0.25, 10],
  ],
  [
    [480, 1.0, 6],
    [850, 0.7, 8],
    [2500, 0.15, 10],
  ],
];

/**
 * @param {number} len samples
 * @param {number} sr sample rate
 * @param {number} seed
 * @param {(t: number) => number} intensity 0…1 at second t from the start: how many shout and how hard
 * @returns {[Float64Array, Float64Array]} left, right (unit-ish level; the caller sets the gain)
 */
export const synthCrowd = (len, sr, seed, intensity, voices = 64) => {
  const rng = mulberry32(seed);
  const outL = new Float64Array(len);
  const outR = new Float64Array(len);

  // -- bed ---------------------------------------------------------------------------------------------------------
  {
    const side = [0, 1].map(() => ({
      lo: bandpass(sr, 700, 0.7),
      hi: bandpass(sr, 2300, 1.1),
    }));
    const ph = [0, 1, 2].map(() => rng() * 2 * Math.PI);
    const BED = 0.55;
    for (let i = 0; i < len; i++) {
      const t = i / sr;
      const k = intensity(t);
      // surges: the crowd breathes in waves a few seconds long
      const surge =
        1 +
        0.18 * Math.sin(2 * Math.PI * 0.21 * t + ph[0]) +
        0.12 * Math.sin(2 * Math.PI * 0.47 * t + ph[1]) +
        0.07 * Math.sin(2 * Math.PI * 1.13 * t + ph[2]);
      const g = BED * (0.35 + 0.65 * k) * surge;
      const hiMix = 0.25 + 0.35 * k; // a louder crowd is brighter
      for (let c = 0; c < 2; c++) {
        const s = side[c];
        const v = s.lo(rng() * 2 - 1) + hiMix * s.hi(rng() * 2 - 1);
        (c ? outR : outL)[i] += v * g;
      }
    }
  }

  // -- voices -------------------------------------------------------------------------------------------------------
  // Each voice goes to one vowel group per side, by its pan (equal-power); each group is formant-filtered once.
  const groups = VOWELS.map(() => [new Float64Array(len), new Float64Array(len)]);
  for (let v = 0; v < voices; v++) {
    const f0 = rng() < 0.6 ? 105 + 70 * rng() : 190 + 140 * rng(); // men and women
    const pan = rng() * 1.8 - 0.9;
    const th = ((pan + 1) * Math.PI) / 4;
    const gl = Math.cos(th) * Math.SQRT2;
    const gr = Math.sin(th) * Math.SQRT2;
    const dist = 0.35 + 0.65 * rng(); // near voices louder
    const [bl, br] = groups[Math.floor(rng() * VOWELS.length)];
    const vibRate = 4.5 + 2 * rng();
    const lp = onePoleLp(sr, 1800 + 1200 * rng()); // glottal tilt
    let phase = rng();
    let jitter = 0;
    let i = Math.floor(rng() * sr * 1.5);
    while (i < len) {
      const k = intensity(i / sr);
      // gap before the next shout: long when the crowd is quiet, short when it roars
      if (rng() > 0.15 + 0.85 * k) {
        i += Math.floor(sr * (0.3 + 1.2 * rng()));
        continue;
      }
      const dur = Math.floor(sr * (0.45 + 1.8 * rng()));
      const glide = 2 + 5 * rng(); // semitones up over the shout ("ohhh!")
      const amp = dist * (0.5 + 0.5 * k) * (0.6 + 0.4 * rng());
      const atk = sr * (0.05 + 0.12 * rng());
      const rel = sr * (0.15 + 0.3 * rng());
      for (let j = 0; j < dur && i + j < len; j++) {
        const u = j / dur;
        const env = Math.min(1, j / atk, (dur - j) / rel);
        if (j % 64 === 0) jitter = (rng() * 2 - 1) * 0.012;
        const semis =
          glide * Math.sin(Math.min(1, u * 1.6) * (Math.PI / 2)) -
          1.5 * Math.max(0, u - 0.7); // rise, hold, fall away at the end
        const f =
          f0 *
          Math.pow(2, semis / 12) *
          (1 + 0.012 * Math.sin(2 * Math.PI * vibRate * (j / sr)) + jitter);
        const dt = f / sr;
        phase += dt;
        if (phase >= 1) phase -= 1;
        const saw = 2 * phase - 1 - polyblep(phase, dt);
        const s = lp(saw) * env * amp;
        bl[i + j] += s * gl;
        br[i + j] += s * gr;
      }
      i += dur + Math.floor(sr * 0.1 * rng());
    }
  }
  const VOX = 0.9 / Math.sqrt(voices);
  VOWELS.forEach((formants, gi) => {
    for (let c = 0; c < 2; c++) {
      const src = groups[gi][c];
      const bank = formants.map(([fc, g, q]) => [bandpass(sr, fc, q), g]);
      const out = c ? outR : outL;
      for (let i = 0; i < len; i++) {
        let y = 0;
        for (const [bp, g] of bank) y += bp(src[i]) * g;
        out[i] += y * VOX * 3;
      }
    }
  });

  // -- room: far away in a big open stadium ---------------------------------------------------------------------------
  const COMBS = [
    [1117, 1601, 1867, 2213],
    [1259, 1489, 1993, 2341],
  ];
  for (let c = 0; c < 2; c++) {
    const x = c ? outR : outL;
    const hp = onePoleHp(sr, 160);
    const lp = onePoleLp(sr, 4200);
    for (let i = 0; i < len; i++) x[i] = lp(hp(x[i]));
    const wet = new Float64Array(len);
    for (const d of COMBS[c]) {
      const buf = new Float64Array(d);
      let p = 0;
      const damp = onePoleLp(sr, 3000);
      for (let i = 0; i < len; i++) {
        const y = buf[p];
        buf[p] = x[i] + damp(y) * 0.62;
        wet[i] += y;
        p = (p + 1) % d;
      }
    }
    for (let i = 0; i < len; i++) x[i] = 0.7 * x[i] + 0.12 * wet[i];
  }
  return [outL, outR];
};
