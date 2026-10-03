// Where the two McLarens are in every shot of the Suzuka 1989 part, as plain data: the pictures draw from it and the
// interpenetration check (src/mv/overlap.ts, ART-18) tests it. Pure TypeScript (no React, no Remotion) so node can
// load it.
import type { TopViewSampler } from "../../overlap.ts";
import { frameAt } from "../../timing.ts";
import {
  footprintOf,
  proAt,
  realTime,
  senAt,
  SHOT_SECONDS,
  SLOWMO_AT,
} from "./drive13.ts";
import { SUZUKA_1989 } from "../../../tracks/suzuka-1989.ts";
import { EDIT } from "./shots.ts";

const T = SUZUKA_1989;
export const CHICANE = T.corners.chicane;

// MP4/5 footprint from its top-view plan (cars-1989.ts): rear wing −0.02 m to front wing 4.24 m, tyres' outer edges
// ±1.06 m. Its centre lies 0.12 m ahead of the middle of the wheelbase, which is where topAnchorAt places a car.
export const MP45 = { length: 4.26, width: 2.12, centreAhead: 0.12 };

const shot = (id: string) => {
  const s = EDIT.shots.find((x) => x.id === id);
  if (!s) throw new Error(`suzuka1989: no shot ${id}`);
  return { from: frameAt(s.from), to: frameAt(s.to) };
};
const cue = (id: string) => {
  for (const s of EDIT.shots)
    for (const c of s.cues ?? []) if (c.id === id) return frameAt(c.at);
  throw new Error(`suzuka1989: no cue ${id}`);
};

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
export const smooth = (v: number, a: number, b: number) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// ── 1.3: the chicane from above, driven for real (drive13.ts) ─────────────────────────────────────────
// Song frame → screen seconds into the shot → real seconds (real speed, then the slow-motion dive).

export const SHOT_13 = shot("1.3");
export const tau13 = (f: number) => (f - SHOT_13.from) / 60;
export const real13 = (f: number) => realTime(tau13(f));
export const cars13 = (f: number) => {
  const t = real13(f);
  return { t, pro: proAt(t), sen: senAt(t) };
};
// The song frame of the touch, for the contact window and the picture.
export const CONTACT_13 = Math.ceil(SHOT_13.from + 60 * (SHOT_SECONDS - 0.12));

// Map scale, px per metre: close on the pair (the track streams past at real speed), closing in for the dive.
export const ppm13 = (f: number) => {
  const tau = tau13(f);
  const k = smooth(tau, SLOWMO_AT - 0.5, SLOWMO_AT + 1.5);
  return 26 + 14 * k;
};
// Cars are never drawn shorter than ~150 px (4.26 m × 36 px/m): larger than life on the wider framing.
export const CAR_PPM_MIN = 36;
export const carScale13 = (f: number) => Math.max(1, CAR_PPM_MIN / ppm13(f));

// ── 1.2 and 1.4: side-on panels, cars placed in world metres (x along the track, z away from the camera) ──────────
// The same plan seen from above: footprint x = world x of the car's middle, y = z.

export const SHOT_12 = shot("1.2");
export const SHOT_14 = shot("1.4");
export const HIT = cue("suzuka1989.crash");
export const PUSH = cue("suzuka1989.push");

// 1.2: rear ends in world metres; the camera's own x is camX12.
export const SPEED = 83; // m/s, 300 km/h (MOT-5)
export const Z_PRO_12 = 8;
export const Z_SEN_12 = 11;
export const cars12 = (f: number) => {
  const t = (f - SHOT_12.from) / 60;
  const dur = (SHOT_12.to - SHOT_12.from) / 60;
  // SEN, on the far line, closes from 1.5 m off PRO's gearbox until he runs alongside, his nose at PRO's cockpit
  // (treatment 1.2: "并排"); the lines are 3 m apart, so the cars never meet (ART-18)
  const gap = lerp(1.5, -2.6, smooth(t, 0.6, dur - 0.4));
  const pro = SPEED * t + 0.6 * Math.sin(t * 1.3);
  return { pro, sen: pro - MP45.length - gap, t };
};
// The camera starts ahead of the cars, so they sweep in from the left, then holds the pair centred: the middle of
// SEN's rear wing to PRO's nose on the optical axis.
export const camX12 = (f: number) => {
  const { pro, sen, t } = cars12(f);
  const mid = (sen + pro + MP45.length) / 2;
  return mid + 18 * Math.exp(-t / 0.55);
};

// 1.4: SEN on the near side, PRO alongside on the far side, a car width further away: SEN's nose wedged against
// PRO's right front wheel. Both slide on together after the hit and stop.
export const Z_SEN_14 = 8;
export const Z_PRO_14 = Z_SEN_14 + MP45.width; // tyres touching
const V0 = 22;
const TAU = 0.45;
export const slide14 = (f: number) =>
  V0 * TAU * (1 - Math.exp(-Math.max(0, (f - HIT) / 60) / TAU));
// Rear ends relative to the camera's x (which pans with the slide): PRO 1.1 m ahead, so SEN's left front wheel is
// jammed against PRO's right front wheel and sidepod.
export const SEN_X_14 = -3.6;
export const PRO_X_14 = SEN_X_14 + 1.1;

export const SAMPLERS: TopViewSampler[] = [
  {
    part: "suzuka1989",
    shot: "1.2",
    ...SHOT_12,
    poses: (f) => {
      const c = cars12(f);
      return [
        {
          id: "PRO",
          x: c.pro + MP45.length / 2,
          y: Z_PRO_12,
          heading: 0,
          length: MP45.length,
          width: MP45.width,
        },
        {
          id: "SEN",
          x: c.sen + MP45.length / 2,
          y: Z_SEN_12,
          heading: 0,
          length: MP45.length,
          width: MP45.width,
        },
      ];
    },
  },
  {
    part: "suzuka1989",
    shot: "1.3",
    ...SHOT_13,
    // PRO turns in across SEN and their front wheels touch: the last frames of the shot (true size by then)
    contact: [
      { from: CONTACT_13, to: SHOT_13.to, ids: ["PRO", "SEN"], depth: 0.1 },
    ],
    poses: (f) => {
      const c = cars13(f);
      const k = carScale13(f);
      return [footprintOf("PRO", c.pro, k), footprintOf("SEN", c.sen, k)];
    },
  },
  {
    part: "suzuka1989",
    shot: "1.4",
    from: SHOT_14.from,
    to: PUSH, // the push panel shows SEN alone
    // the hit itself: the cars touch, tyre to tyre, from 19.1 to the stop — touching, not passing through
    contact: [{ from: HIT, to: PUSH, ids: ["PRO", "SEN"], depth: 0.05 }],
    poses: (f) => {
      const s = slide14(f);
      return [
        {
          id: "SEN",
          x: s + SEN_X_14 + MP45.length / 2,
          y: Z_SEN_14,
          heading: 0,
          length: MP45.length,
          width: MP45.width,
        },
        {
          id: "PRO",
          x: s + PRO_X_14 + MP45.length / 2,
          y: Z_PRO_14,
          heading: 0,
          length: MP45.length,
          width: MP45.width,
        },
      ];
    },
  },
];
