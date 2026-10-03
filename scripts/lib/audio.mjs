// Audio helpers shared by make-music and check-audio: an ITU-R BS.1770-4 loudness meter,
// a look-ahead peak limiter and a 16-bit PCM WAV reader.
import fs from "node:fs";

const biquad = (b0, b1, b2, a1, a2) => {
  let x1 = 0;
  let x2 = 0;
  let y1 = 0;
  let y2 = 0;
  return (x) => {
    const y = b0 * x + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2;
    x2 = x1;
    x1 = x;
    y2 = y1;
    y1 = y;
    return y;
  };
};

// K-weighting filters (BS.1770-4, coefficients for 48 kHz).
const kWeight = () => {
  const shelf = biquad(
    1.53512485958697,
    -2.69169618940638,
    1.19839281085285,
    -1.69065929318241,
    0.73248077421585,
  );
  const hp = biquad(1.0, -2.0, 1.0, -1.99004745483398, 0.99007225036621);
  return (x) => hp(shelf(x));
};

/** Integrated loudness in LUFS (gated, 400 ms blocks with 75 % overlap). Stereo, 48 kHz only. */
export const integratedLoudness = (L, R, sampleRate) => {
  if (sampleRate !== 48000) throw new Error("integratedLoudness: 48 kHz only");
  const n = L.length;
  const kl = kWeight();
  const kr = kWeight();
  const step = sampleRate * 0.1; // 100 ms hops
  const hops = Math.floor(n / step);
  const hopEnergy = new Float64Array(hops);
  for (let h = 0; h < hops; h++) {
    let e = 0;
    for (let i = h * step; i < (h + 1) * step; i++) {
      const l = kl(L[i]);
      const r = kr(R[i]);
      e += l * l + r * r;
    }
    hopEnergy[h] = e;
  }
  const blocks = [];
  for (let h = 0; h + 4 <= hops; h++) {
    const ms =
      (hopEnergy[h] + hopEnergy[h + 1] + hopEnergy[h + 2] + hopEnergy[h + 3]) /
      (4 * step);
    blocks.push(ms);
  }
  const lufs = (ms) => -0.691 + 10 * Math.log10(ms);
  const abs = blocks.filter((ms) => ms > 0 && lufs(ms) > -70);
  if (!abs.length) return -Infinity;
  const relGate = lufs(abs.reduce((a, b) => a + b, 0) / abs.length) - 10;
  const rel = abs.filter((ms) => lufs(ms) > relGate);
  return lufs(rel.reduce((a, b) => a + b, 0) / rel.length);
};

// 4× oversampling taps (Hann-windowed sinc, 8 samples each side) for true-peak estimates.
const TAPS = 8;
const PHASES = [0.25, 0.5, 0.75].map((frac) => {
  const k = [];
  for (let j = -TAPS + 1; j <= TAPS; j++) {
    const x = j - frac;
    const sinc = Math.sin(Math.PI * x) / (Math.PI * x);
    const w = 0.5 + 0.5 * Math.cos((Math.PI * x) / TAPS);
    k.push(sinc * w);
  }
  return k;
});
/** Highest absolute value of the band-limited signal between sample i and i + 1 (sample peak included). */
const truePeakAt = (x, i) => {
  let pk = Math.abs(x[i]);
  if (i < TAPS || i + TAPS >= x.length) return pk;
  for (const k of PHASES) {
    let v = 0;
    for (let j = 0; j < k.length; j++) v += x[i - TAPS + 1 + j] * k[j];
    pk = Math.max(pk, Math.abs(v));
  }
  return pk;
};

/** Look-ahead true-peak limiter, in place: nothing above `ceilingDb` (dBTP, so dBFS too) afterwards. */
export const limit = (L, R, sampleRate, ceilingDb) => {
  const n = L.length;
  const ceil = Math.pow(10, ceilingDb / 20);
  const look = Math.round(sampleRate * 0.005);
  const release = Math.exp(-1 / (sampleRate * 0.08));
  const attack = Math.exp(-1 / look);
  const need = new Float64Array(n).fill(1);
  for (let i = 0; i < n; i++) {
    let pk = Math.max(Math.abs(L[i]), Math.abs(R[i]));
    // only pay for the interpolation where an inter-sample peak could reach the ceiling
    if (pk > ceil * 0.5) pk = Math.max(truePeakAt(L, i), truePeakAt(R, i));
    if (pk <= ceil) continue;
    // the inter-sample peak sits between i and i + 1: hold both samples down
    need[i] = Math.min(need[i], ceil / pk);
    if (i + 1 < n) need[i + 1] = Math.min(need[i + 1], ceil / pk);
  }
  // running minimum over the look-ahead window (monotonic deque)
  const minAhead = new Float64Array(n);
  const dq = new Int32Array(n);
  let head = 0;
  let tail = 0;
  for (let i = n - 1; i >= 0; i--) {
    while (tail > head && need[dq[tail - 1]] >= need[i]) tail--;
    dq[tail++] = i;
    while (dq[head] > i + look) head++;
    minAhead[i] = need[dq[head]];
  }
  let env = 1;
  for (let i = 0; i < n; i++) {
    const target = minAhead[i];
    env =
      target < env
        ? target + (env - target) * attack
        : target + (env - target) * release;
    const g = Math.min(env, target);
    L[i] *= g;
    R[i] *= g;
  }
};

/** Reads a PCM WAV file: format fields plus channel samples as Float64Arrays in −1…1. */
export const readWav = (file) => {
  const buf = fs.readFileSync(file);
  if (
    buf.toString("ascii", 0, 4) !== "RIFF" ||
    buf.toString("ascii", 8, 12) !== "WAVE"
  )
    throw new Error(`${file}: not a WAV file`);
  let off = 12;
  let fmt = null;
  let data = null;
  while (off + 8 <= buf.length) {
    const id = buf.toString("ascii", off, off + 4);
    const size = buf.readUInt32LE(off + 4);
    if (id === "fmt ") {
      fmt = {
        format: buf.readUInt16LE(off + 8),
        channels: buf.readUInt16LE(off + 10),
        sampleRate: buf.readUInt32LE(off + 12),
        bitsPerSample: buf.readUInt16LE(off + 22),
      };
    } else if (id === "data") {
      data = { start: off + 8, size };
    }
    off += 8 + size + (size % 2);
  }
  if (!fmt || !data) throw new Error(`${file}: missing fmt or data chunk`);
  if (fmt.format !== 1 || fmt.bitsPerSample !== 16)
    throw new Error(`${file}: expected 16-bit PCM`);
  const frames = data.size / (2 * fmt.channels);
  const samples = Array.from(
    { length: fmt.channels },
    () => new Float64Array(frames),
  );
  for (let i = 0; i < frames; i++) {
    for (let c = 0; c < fmt.channels; c++)
      samples[c][i] =
        buf.readInt16LE(data.start + (i * fmt.channels + c) * 2) / 32768;
  }
  return { ...fmt, frames, samples };
};
