// Where the cars are in every shot of the Suzuka 1990 part, as plain data: the pictures draw from it and the
// interpenetration check (src/mv/overlap.ts, ART-18) tests it. Pure TypeScript (no React, no Remotion) so node can
// load it.
//
// 1.6 grid (facts.md): SEN pole on the right — the dirty side, off the racing line — PRO second on the left, on the
// clean line; MAN and BER in the second row. Slots 8 m apart, staggered. PRO launches better from the clean side and
// leads into Turn 1; SEN keeps to the inside (right) and his front wheel ends level with PRO's rear wheel as PRO
// turns in — the contact is the cut to 1.7.
import type { Footprint, TopViewSampler } from "../../overlap.ts";
import { frameAt } from "../../timing.ts";
import { poseAt } from "../../../tracks/track.ts";
import { SUZUKA_1989 } from "../../../tracks/suzuka-1989.ts";
import { EDIT } from "./shots.ts";

const T = SUZUKA_1989;

// Footprints from the top-view plans: overall length and width (outside of the tyres), and how far the footprint's
// centre lies ahead of the middle of the wheelbase (where topAnchorAt places a car).
// MP4/5(B): rear wing −0.02 m to front wing 4.24 m, tyres ±1.06 m (cars-1989.ts).
// 641: rear wing −0.02 m to front wing 4.14 m, tyres ±1.05 m, wheelbase middle 2.0 m (cars-1990.ts).
export const MP45 = { length: 4.26, width: 2.12, centreAhead: 0.12 };
export const F641 = { length: 4.16, width: 2.1, centreAhead: 0.06 };

export type CarId = "SEN" | "PRO" | "MAN" | "BER";
const SIZE: Record<CarId, typeof MP45> = {
  SEN: MP45,
  PRO: F641,
  MAN: F641,
  BER: MP45,
};

const shot = (id: string) => {
  const s = EDIT.shots.find((x) => x.id === id);
  if (!s) throw new Error(`suzuka1990: no shot ${id}`);
  return { from: frameAt(s.from), to: frameAt(s.to) };
};
const cue = (id: string) => {
  for (const s of EDIT.shots)
    for (const c of s.cues ?? []) if (c.id === id) return frameAt(c.at);
  throw new Error(`suzuka1990: no cue ${id}`);
};

const smooth01 = (x: number) => {
  const u = Math.min(1, Math.max(0, x));
  return u * u * (3 - 2 * u);
};

// ── 1.6: the start, from above ──────────────────────────────────────────────────────────────────────────────

export const SHOT_16 = shot("1.6");
// lights out: 23.3
export const START_FRAME = cue("suzuka1990.start");
// Lane centres either side of the centre line (track 13 m wide) and the slot spacing.
export const LANE = 3.25;
export const SLOT = 8;
// the pole car's wheelbase middle on the grid, just behind the line
export const POLE = -6;

// Distance covered τ s after lights out: hard launch, ~80 m/s top end; ≈ 358 m by the cut.
export const launch = (tau: number) =>
  tau <= 0 ? 0 : 80 * (tau - 2.2 * (1 - Math.exp(-tau / 2.2)));

export type CarPos = { id: CarId; s: number; lat: number };

// Lap distance (wheelbase middle) and lateral offset (+ = the driver's right) of each car at a song frame.
export const cars16 = (f: number): CarPos[] => {
  const tau = (f - START_FRAME) / 60;
  const d = launch(tau);
  // PRO's better launch from the clean side: 11.5 m gained over the first three seconds
  const gain = 11.5 * smooth01(tau / 3.2);
  // PRO turns in for Turn 1 over the last 2.4 s: from the left lane to just right of the centre line
  const tauEnd = (SHOT_16.to - START_FRAME) / 60;
  const turnIn = smooth01((tau - (tauEnd - 2.4)) / 2.4);
  return [
    { id: "SEN", s: POLE + d, lat: LANE + 0.35 * turnIn },
    { id: "PRO", s: POLE - SLOT + d + gain, lat: -LANE + 4.4 * turnIn },
    { id: "MAN", s: POLE - 2 * SLOT + 0.985 * d, lat: LANE },
    { id: "BER", s: POLE - 3 * SLOT + 0.99 * d, lat: -LANE },
  ];
};

// Map pose of a car: the wheelbase middle and the heading, with the yaw of a change of line.
export const pose16 = (f: number, c: CarPos) => {
  const p = poseAt(T, c.s, c.lat);
  const next = cars16(f + 1).find((x) => x.id === c.id) ?? c;
  const ds = next.s - c.s;
  const yaw =
    ds > 0.05 ? (Math.atan((next.lat - c.lat) / ds) * 180) / Math.PI : 0;
  return { x: p.x, y: p.y, heading: p.heading + yaw };
};

const footprint = (
  id: CarId,
  c: { x: number; y: number; heading: number },
): Footprint => {
  const a = (c.heading * Math.PI) / 180;
  const z = SIZE[id];
  return {
    id,
    x: c.x + Math.cos(a) * z.centreAhead,
    y: c.y + Math.sin(a) * z.centreAhead,
    heading: c.heading,
    length: z.length,
    width: z.width,
  };
};

// ── 1.7: the crash, side-on, cars placed in world metres (x along the track, z away from the camera) ───────────
// The camera stands on the inside of Turn 1, so the cars run right to left on screen (facing left) and SEN, on the
// inside, is the near car. On 27.1 SEN's left front tyre is against PRO's right rear tyre: PRO a car width further
// away (tyres touching) and SEN's front axle level with PRO's rear axle. Both slide on together off the outside of
// the corner into the gravel — away from the camera — and stop; PRO's Ferrari drifts a little further out, so they
// part after the hit.

export const SHOT_17 = shot("1.7");
export const HIT = cue("suzuka1990.crash");
// Slide after the hit: from 42 m/s to rest, exponential, τ = 0.9 s (≈ 38 m).
const V0 = 42;
const TAU = 0.9;
export const slide17 = (f: number) =>
  V0 * TAU * (1 - Math.exp(-Math.max(0, (f - HIT) / 60) / TAU));
export const SLIDE_TOTAL = V0 * TAU;
export const Z_SEN_17 = 8;
// tyres touching at the hit
export const Z_PRO_17 = Z_SEN_17 + (MP45.width + F641.width) / 2;
// away from the camera as they slide off the outside of the corner (m), and PRO's extra drift
export const drift17 = (f: number) => 13 * (slide17(f) / SLIDE_TOTAL);
export const part17 = (f: number) => 0.9 * smooth01((f - HIT) / 40);
// Wheelbase middles along x, relative to the slide: PRO ahead by a wheelbase, so SEN's front axle meets PRO's rear
// axle (MP4/5B wheelbase 2.94 m, 641 2.86 m: half of each).
export const SEN_X_17 = 0;
export const PRO_X_17 = SEN_X_17 + (2.94 + 2.86) / 2;

export const cars17 = (f: number) => {
  const s = slide17(f);
  const dz = drift17(f);
  return {
    sen: { x: -(s + SEN_X_17), z: Z_SEN_17 + dz },
    pro: { x: -(s + PRO_X_17), z: Z_PRO_17 + dz + part17(f) },
  };
};

export const SAMPLERS: TopViewSampler[] = [
  {
    part: "suzuka1990",
    shot: "1.6",
    ...SHOT_16,
    poses: (f) => cars16(f).map((c) => footprint(c.id, pose16(f, c))),
  },
  {
    part: "suzuka1990",
    shot: "1.7",
    ...SHOT_17,
    // the hit on 27.1: tyre to tyre, touching, not passing through, until the cars part
    contact: [{ from: HIT, to: HIT + 40, ids: ["SEN", "PRO"], depth: 0.05 }],
    poses: (f) => {
      const c = cars17(f);
      // cars run toward −x (facing left): heading 180°; x is the wheelbase middle
      const fp = (id: CarId, x: number, z: number): Footprint => ({
        id,
        x: x - SIZE[id].centreAhead,
        y: z,
        heading: 180,
        length: SIZE[id].length,
        width: SIZE[id].width,
      });
      return [fp("SEN", c.sen.x, c.sen.z), fp("PRO", c.pro.x, c.pro.z)];
    },
  },
];
