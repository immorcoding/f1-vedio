// Engine sound synthesis for the SFX layer (ticket #15): one era preset per engine family, a driveline that turns a
// car's speed into rpm, gear and throttle, and an additive synth that turns rpm into sound. Deterministic: seeded
// noise, fixed order, no clocks. Two separate steps so later work (the drop's engine bass, #16) can take the rpm curve
// from `driveline` without the sound, or feed `synthEngine` its own rpm curve.
//
// Physics in one line: a four-stroke engine fires every cylinder once per two crank turns, so the firing frequency is
// rpm / 60 × cylinders / 2. The synth builds the sound on the engine cycle (rpm / 120): the firing order and its
// harmonics are the strong partials; the cycle's other orders (cylinder-to-cylinder differences) are the rasp.
// Facts behind the presets: docs/production/facts.md, "引擎声".

/** Engine families by era. `gearTop`: road speed (m/s) at `redline` in each gear, 1st first. */
export const PRESETS = {
  // Honda RA109E / RA100E, 3.5 L 72° V10, NA, ~13,000 rpm in the race; McLaren 6-speed manual (MP4/5, MP4/5B)
  "v10-1989": {
    name: "1989/90 Honda 3.5 L V10",
    cylinders: 10,
    idle: 4000,
    redline: 13200,
    shiftAt: 0.97,
    shiftMs: 90, // H-pattern manual: a lift and a gap
    gearTop: [36, 48, 59, 70, 80, 89],
    bright: 3600, // spectral roll-off, Hz
    slope: 1.5,
    rough: 0.42, // level of the non-firing cycle orders: the rasp
    formant: [2600, 900, 0.8], // exhaust resonance: centre Hz, width Hz, gain
    noise: 0.2,
    noiseLp: 7000,
    pops: 1,
    turbo: 0,
    ers: 0,
  },
  // Ferrari Tipo 036/037, 3.5 L 65° V12, NA, peak power at 12,750 rpm; Ferrari 7-speed semi-automatic (641, 1990)
  "v12-1990": {
    name: "1990 Ferrari 3.5 L V12",
    cylinders: 12,
    idle: 4000,
    redline: 12900,
    shiftAt: 0.97,
    shiftMs: 45, // paddle shift
    gearTop: [33, 43, 52, 61, 70, 79, 88],
    bright: 4200,
    slope: 1.6,
    rough: 0.3,
    formant: [3200, 1100, 0.7],
    noise: 0.17,
    noiseLp: 7500,
    pops: 0.9,
    turbo: 0,
    ers: 0,
  },
  // Mercedes FO 108V / Toyota RVX-08, 2.4 L V8, NA, 19,000 rpm limiter (2007–2008); 7-speed seamless
  "v8-2008": {
    name: "2008 2.4 L V8",
    cylinders: 8,
    idle: 5000,
    redline: 19000,
    shiftAt: 0.98,
    shiftMs: 12, // seamless shift
    gearTop: [33, 42, 50, 58, 66, 75, 85],
    bright: 6200,
    slope: 2.1,
    rough: 0.14, // a clean shriek
    formant: [4200, 1500, 0.6],
    noise: 0.11,
    noiseLp: 9000,
    pops: 0.8,
    turbo: 0,
    ers: 0,
  },
  // Honda RA620H/RA621H, Mercedes M12, Ferrari 065: 1.6 L V6 turbo hybrid, 15,000 rpm limit but fuel-flow bound to
  // ~10,500–12,000 rpm in the race; 8-speed seamless; turbo whistle and the MGU-K's electric whine
  "v6h-2021": {
    name: "2020/21 1.6 L V6 turbo hybrid",
    cylinders: 6,
    idle: 4000,
    redline: 11800,
    shiftAt: 0.98,
    shiftMs: 12,
    gearTop: [30, 39, 47, 55, 63, 71, 79, 88],
    bright: 1900, // the turbine sits in the exhaust: lower, fuller
    slope: 1.9,
    rough: 0.3,
    formant: [850, 450, 1.1],
    noise: 0.13,
    noiseLp: 3200,
    pops: 0.3,
    turbo: 1,
    ers: 1,
  },
};

const mulberry32 = (seed) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

// Sine table with linear interpolation: fast and bit-exact from run to run.
const TABLE = 4096;
const SINE = new Float64Array(TABLE + 1);
for (let i = 0; i <= TABLE; i++) SINE[i] = Math.sin((2 * Math.PI * i) / TABLE);
const sin1 = (phase) => {
  const x = (phase - Math.floor(phase)) * TABLE;
  const i = x | 0;
  return SINE[i] + (SINE[i + 1] - SINE[i]) * (x - i);
};

const svf = (sr) => {
  let ic1 = 0;
  let ic2 = 0;
  const k = 1 / 0.7;
  return (x, fc) => {
    const g = Math.tan((Math.PI * Math.min(fc, sr * 0.45)) / sr);
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

/**
 * The driveline: a car's road speed → engine rpm, throttle and gear, sample by sample.
 * - `speed(t)`: m/s at race time t (seconds since the start of the sound);
 * - `time(s)`: race seconds at screen second s (slow motion bends it; default: real time);
 * - `launch`: race second the clutch drops; before it the car sits on the grid, blipping the throttle.
 * Upshifts drop the rpm to the next gear (a lift on a manual box), downshifts under braking blip the throttle up to
 * the lower gear's rpm, and lifting off the throttle at high rpm marks the samples where the exhaust pops.
 * Returns per-sample Float64Arrays: rpm, load (0…1 throttle), rate (race seconds per screen second) and pop (0…1).
 */
export const driveline = (
  preset,
  { speed, time = (s) => s, launch },
  len,
  sr,
  seed = 1,
) => {
  const P = PRESETS[preset] ?? preset;
  const rng = mulberry32(seed * 7919 + 17);
  const G = P.gearTop.length;
  const rpm = new Float64Array(len);
  const load = new Float64Array(len);
  const rate = new Float64Array(len);
  const pop = new Float64Array(len);
  const CTRL = Math.round(sr / 1000); // control rate: 1 ms
  const wheel = (v, g) => (P.redline * v) / P.gearTop[g];
  // start in the gear that suits the first speed
  const t0 = time(0);
  let g = 0;
  while (g < G - 1 && wheel(speed(t0), g) > P.redline * P.shiftAt * 0.92) g++;
  let r =
    launch !== undefined && t0 < launch
      ? P.idle * 1.6
      : Math.max(P.idle, wheel(speed(t0), g));
  let th = 0.8;
  let shiftLeft = 0; // ms left in an upshift's gap
  let blipLeft = 0; // ms left in a downshift blip
  let lastDown = -1e9;
  let gridBlip = 0; // grid revs: ms left in this blip
  let gridTarget = 0.6;
  let prevTh = th;
  let liftAge = 1e9; // ms since the throttle closed
  for (let c = 0; c * CTRL < len; c++) {
    const s = (c * CTRL) / sr;
    const t = time(s);
    const dt = 1e-3;
    const rt =
      (time(s + dt) - time(Math.max(0, s - dt))) /
      (s + dt - Math.max(0, s - dt));
    const v = speed(t);
    const acc = (speed(t + 0.02) - speed(t - 0.02)) / 0.04;
    let target;
    let thTarget;
    if (launch !== undefined && t < launch) {
      // on the grid: the driver holds the revs up with quick blips
      if (gridBlip <= 0) {
        gridBlip = 90 + Math.floor(rng() * 160);
        gridTarget = 0.45 + 0.35 * rng();
      }
      gridBlip--;
      const toLaunch = launch - t;
      const hold = toLaunch < 0.6 ? 0.72 : gridTarget; // revs held for the launch
      target = P.redline * hold;
      thTarget = hold > 0.6 ? 1 : 0.4;
    } else {
      // gear changes
      if (shiftLeft <= 0 && blipLeft <= 0) {
        if (g < G - 1 && wheel(v, g) >= P.redline * P.shiftAt && acc > -0.5) {
          g++;
          shiftLeft = P.shiftMs;
        } else if (
          g > 0 &&
          acc < -3 &&
          wheel(v, g - 1) < P.redline * 0.93 &&
          c - lastDown > 110
        ) {
          g--;
          blipLeft = 70;
          lastDown = c;
        }
      }
      target = wheel(v, g);
      // clutch slip off the line: the revs hang above the road speed for the first second
      if (launch !== undefined) {
        const since = t - launch;
        if (since >= 0 && since < 1.4)
          target = Math.max(
            target,
            P.redline * 0.72 * (1 - since / 1.4) + target * (since / 1.4),
          );
      }
      thTarget = acc > 0.8 ? 1 : acc < -3 ? 0 : 0.85;
      if (shiftLeft > 0) {
        thTarget = P.shiftMs > 40 ? 0.1 : thTarget * 0.6; // a manual box cuts the power for the change
        shiftLeft--;
      }
      if (blipLeft > 0) {
        thTarget = blipLeft > 30 ? 1 : 0;
        target *= blipLeft > 30 ? 1.04 : 1;
        blipLeft--;
      }
    }
    target = Math.max(P.idle, Math.min(P.redline * 1.02, target));
    // crank inertia: fast to drop in a shift, a little slower to climb
    const tau = shiftLeft > 0 ? 0.012 : target > r ? 0.03 : 0.02;
    r += (target - r) * (1 - Math.exp(-dt / tau));
    th += (thTarget - th) * (1 - Math.exp(-dt / 0.015));
    if (prevTh >= 0.3 && th < 0.3) liftAge = 0;
    else if (th >= 0.3) liftAge = 1e9;
    else liftAge++;
    prevTh = th;
    // off-throttle crackle: strongest right after the lift, at high revs
    const p =
      th < 0.3 && r > P.redline * 0.45
        ? Math.exp(-liftAge / 900) * (r / P.redline)
        : 0;
    for (let i = 0; i < CTRL; i++) {
      const n = c * CTRL + i;
      if (n >= len) break;
      rpm[n] = r;
      load[n] = th;
      rate[n] = rt;
      pop[n] = p;
    }
  }
  return { rpm, load, rate, pop, preset: P };
};

/**
 * The engine's sound from a driveline (or any {rpm, load, rate, pop} arrays): mono, about −12 dBFS RMS at full
 * load. Slow motion (`rate` < 1) drops the pitch and darkens the sound, like a slowed tape.
 */
export const synthEngine = (drv, sr, seed = 1) => {
  const P = drv.preset;
  const { rpm, load, rate, pop } = drv;
  const len = rpm.length;
  const out = new Float64Array(len);
  const rng = mulberry32(seed * 104729 + 3);
  const cyl = P.cylinders;
  const K = Math.min(cyl * 7, 84); // cycle orders synthesised
  const phase = new Float64Array(K + 1);
  for (let k = 1; k <= K; k++) phase[k] = rng();
  // order weights: firing harmonics strong, crank orders (cylinder pairs) medium, the rest the rasp
  const weight = new Float64Array(K + 1);
  for (let k = 1; k <= K; k++)
    weight[k] =
      k % cyl === 0
        ? 1
        : k % 2 === 0
          ? P.rough * 0.6
          : P.rough * 0.35 * (k < cyl ? 1.4 : 1);
  const lpNoise = svf(sr);
  const hpState = { x: 0, y: 0 };
  const hpA = Math.exp((-2 * Math.PI * 250) / sr);
  const lpOut = svf(sr);
  let cyc = 0; // engine cycle phase (0…1 per two crank turns)
  let jitter = 1;
  let turboPh = 0;
  let boost = 0;
  let ersPh = 0;
  let popEnv = 0;
  let popF = 90;
  let popPh = 0;
  for (let n = 0; n < len; n++) {
    const rt = rate[n];
    const pitch = Math.pow(Math.max(0.05, rt), 0.6);
    const r = rpm[n] * pitch;
    const ld = load[n];
    const fc = r / 120; // engine cycle frequency
    cyc += fc / sr;
    if (cyc >= 1) {
      cyc -= 1;
      // every cycle burns a little differently
      jitter = 0.9 + 0.2 * rng();
    }
    // additive partials up to ~12 kHz
    const bright = P.bright * (0.55 + 0.45 * ld) * Math.min(1, 0.4 + 0.6 * rt);
    const [fF, fW, fG] = P.formant;
    let s = 0;
    for (let k = 1; k <= K; k++) {
      const f = fc * k;
      if (f > 12000) break;
      const env =
        (1 / (1 + Math.pow(f / bright, P.slope))) *
        (1 + fG * Math.exp(-(((f - fF) / fW) ** 2)));
      phase[k] += f / sr;
      if (phase[k] >= 1) phase[k] -= Math.floor(phase[k]);
      s += weight[k] * env * sin1(phase[k]);
    }
    s *= jitter;
    // the noise body, pulsing with the firing: the grit of the exhaust
    const fire = 0.5 + 0.5 * sin1(cyc * cyl);
    const w = rng() * 2 - 1;
    let nz = lpNoise(
      w,
      P.noiseLp * (0.5 + 0.5 * ld) * Math.min(1, 0.35 + 0.65 * rt),
    );
    hpState.y = hpA * (hpState.y + nz - hpState.x);
    hpState.x = nz;
    nz = hpState.y * fire * fire * P.noise * 3;
    let y = (s * 0.11 + nz) * (0.35 + 0.65 * ld);
    // turbo whistle: the turbine's speed lags the throttle
    if (P.turbo) {
      const want = ld * (rpm[n] / P.redline);
      boost +=
        (want - boost) *
        (1 - Math.exp(-1 / (sr * (want > boost ? 0.35 : 0.6))));
      const ft = (2600 + 4200 * boost) * pitch;
      turboPh += ft / sr;
      if (turboPh >= 1) turboPh -= 1;
      y += sin1(turboPh) * 0.012 * boost * P.turbo;
    }
    // MGU-K whine, geared to the crank: louder deploying (on throttle) and harvesting (braking)
    if (P.ers) {
      const fe = (rpm[n] / 60) * 13.3 * pitch;
      ersPh += fe / sr;
      if (ersPh >= 1) ersPh -= 1;
      const e = 0.4 + 0.6 * Math.abs(ld - 0.5) * 2;
      y += (sin1(ersPh) + 0.35 * sin1(ersPh * 2)) * 0.012 * e * P.ers;
    }
    // exhaust pops and crackle on the lift
    if (pop[n] > 0 && rng() < (pop[n] * 22 * P.pops) / sr) {
      popEnv = 0.5 + 0.5 * rng();
      popF = 70 + 90 * rng();
      popPh = 0;
    }
    if (popEnv > 1e-4) {
      popPh += popF / sr;
      const crack = (rng() * 2 - 1) * (popEnv > 0.25 ? 1 : 0.2);
      y += (sin1(popPh) * 0.5 + crack * 0.35) * popEnv * 0.5 * P.pops;
      popEnv *= Math.exp(-1 / (sr * 0.018));
    }
    // slow motion darkens the whole sound (12 kHz in real time)
    out[n] = lpOut(y, 1200 + 10800 * Math.min(1, rt * rt));
  }
  return out;
};
