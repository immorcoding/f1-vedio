// Choreography of shot 2.4 (the run down Mergulho to Junção on the last lap), as positions along the Interlagos lap.
// Pure data with no imports, so a node script can check every frame for overlapping cars (ART-18).
//
// Facts (docs/production/facts.md): GLO, on dry tyres in the rain, is far off the pace and sliding; VET passes him
// first, then HAM closes up and arrives at Junção on GLO's inside — the pass itself completes in shot 2.5 (47.1).
//
// Real driving (MOT-5): every car runs at a true wet-weather speed — HAM and VET ~52 m/s down Mergulho braking to
// ~32 m/s for Junção, GLO ~6 m/s slower all the way — so the track streams past. The readable moment (HAM drawing
// alongside GLO) is an explicit slow-motion beat: shot time t is mapped to race time τ, which slows to 0.3× near the
// end, instead of the cars driving slowly. Headings follow the velocity (the change of line adds yaw); only GLO's
// body swings across it, because he really is sliding.
//
// Lap distances s in metres; lateral offsets in metres to the driver's right (Mergulho and Junção are left-handers,
// so the inside is negative); yaw in degrees on top of the track heading.

export type PlanCar = {
  code: "GLO" | "VET" | "HAM";
  s: number;
  lat: number;
  yaw: number;
  // race position at this moment (facts.md: GLO 4th, VET 5th, HAM 6th at the start of the last lap)
  pos: number;
  speed: number; // m/s along the track
};

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const smooth = (a: number, b: number, t: number) => {
  const x = clamp01((t - a) / (b - a));
  return x * x * (3 - 2 * x);
};

export const JUNCAO_SHOT_SECONDS = 7.5;

// Slow motion: race time runs at 1× until SLOW_FROM, then eases to 0.3× over 0.5 s.
export const SLOW_FROM = 5.4;
const SLOW_RATE = 0.3;
// how slowed the picture is at shot time t: 0 = real time, 1 = full slow motion
export const slowMo = (t: number) => smooth(SLOW_FROM, SLOW_FROM + 0.5, t);
// race time τ at shot time t (the integral of the rate)
export const raceTime = (t: number) => {
  const n = 60;
  let tau = 0;
  for (let i = 0; i < n; i++) {
    const u = ((i + 0.5) / n) * t;
    tau += (1 - (1 - SLOW_RATE) * slowMo(u)) * (t / n);
  }
  return tau;
};

// The common pace: 52 m/s braking gently to ~33 m/s at τ = 6.6
const V0 = 52;
const DECEL = 2.9;
const baseS = (tau: number) => 3115 + V0 * tau - 0.5 * DECEL * tau * tau;
const baseV = (tau: number) => V0 - DECEL * tau;

// Each car's place relative to the common pace, m: GLO starts 30 m up the road and loses 6 m/s; VET starts 18 m
// behind GLO at GLO's pace + 6; HAM is the pace car of the group, 38 m behind GLO at the start.
const off = {
  GLO: (tau: number) => 30 - 6 * tau,
  VET: () => 12,
  HAM: () => -8,
};
const relV = { GLO: -6, VET: 0, HAM: 0 };

const lats = {
  // GLO keeps the outside line, his car fishtailing on slicks
  GLO: (tau: number) => 1.6 + 0.35 * Math.sin(tau * 3.1),
  // VET dives inside, passes GLO around τ = 3, then drifts back to the middle once clear
  VET: (tau: number) =>
    -3.2 * smooth(1.2, 2.2, tau) + 3 * smooth(4.2, 5.4, tau),
  // HAM moves inside as he closes on GLO
  HAM: (tau: number) => -3.2 * smooth(3.8, 5.2, tau),
};

export const juncaoPlan = (t: number): PlanCar[] => {
  const tau = raceTime(t);
  const d = 0.02;
  const s = (code: keyof typeof off, x: number) => baseS(x) + off[code](x);
  const pass = s("VET", tau) > s("GLO", tau);
  return (["GLO", "VET", "HAM"] as const).map((code) => {
    const ds = s(code, tau + d) - s(code, tau - d);
    const dl = lats[code](tau + d) - lats[code](tau - d);
    // heading along the velocity: the change of line turns the car
    const yawLine = (Math.atan2(dl, ds) * 180) / Math.PI;
    const yaw =
      code === "GLO" ? yawLine + 7 * Math.sin(tau * 3.1 + 0.6) : yawLine;
    const pos =
      code === "HAM" ? 6 : code === "VET" ? (pass ? 4 : 5) : pass ? 5 : 4;
    return {
      code,
      s: s(code, tau),
      lat: lats[code](tau),
      yaw,
      pos,
      speed: baseV(tau) + relV[code],
    };
  });
};
