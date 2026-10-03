// Choreography of shot 2.4 (the run down to Junção on the last lap), as positions along the Interlagos lap. Pure data
// with no imports, so a node script can check every frame for overlapping cars (ART-18).
//
// Facts (docs/production/facts.md): GLO, on dry tyres, is slow and sliding; VET passes him first, then HAM closes up and
// arrives at Junção on GLO's inside — the pass itself completes in shot 2.5 (47.1). Lap distances s in metres; lateral
// offsets in metres to the driver's right (Junção is a left-hander, so the inside is negative); yaw in degrees.
// Every pass keeps a real lateral gap: GLO holds the outside (+1.6 m), the passing car takes the inside (−3.2 m), so
// with true 1.8 m widths there are ≥ 2.7 m of air between them (ART-18).

export type PlanCar = {
  code: "GLO" | "VET" | "HAM";
  s: number;
  lat: number;
  yaw: number;
};

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const smooth = (a: number, b: number, t: number) => {
  const x = clamp01((t - a) / (b - a));
  return x * x * (3 - 2 * x);
};

export const JUNCAO_SHOT_SECONDS = 7.5;

// GLO: 23 m/s, sliding on the outside line
export const gloS = (t: number) => 3240 + 23 * t;
// VET: starts 11 m behind GLO, 5.5 m/s quicker; dives inside, passes, drifts back to the middle once clear
const vetS = (t: number) => gloS(t) - 11 + 5.5 * t;
// HAM: 38 m behind, 4.8 m/s quicker; moves inside as he closes, ends half a length behind GLO's centre on the inside
const hamS = (t: number) => gloS(t) - 38 + 4.8 * t;

export const juncaoPlan = (t: number): PlanCar[] => {
  const slide = Math.sin(t * 3.1);
  return [
    { code: "GLO", s: gloS(t), lat: 1.6 + 0.35 * slide, yaw: 6 * slide },
    {
      code: "VET",
      s: vetS(t),
      lat: -3.2 * smooth(0.2, 1.3, t) + 2.4 * smooth(4.2, 5.6, t),
      yaw: -4 * (smooth(0.2, 0.75, t) - smooth(0.75, 1.3, t)),
    },
    {
      code: "HAM",
      s: hamS(t),
      lat: -3.2 * smooth(3.6, 5.2, t),
      yaw: -4 * (smooth(3.6, 4.4, t) - smooth(4.4, 5.2, t)),
    },
  ];
};
