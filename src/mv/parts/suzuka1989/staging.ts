// Where the two McLarens are in every shot of the Suzuka 1989 part, as plain data: the pictures draw from it and the
// interpenetration check (src/mv/overlap.ts, ART-18) tests it. Pure TypeScript (no React, no Remotion) so node can
// load it.
import { corners, type Footprint, type TopViewSampler } from "../../overlap.ts";
import { frameAt } from "../../timing.ts";
import {
  footprintOf,
  proAt,
  realTime,
  senAt,
  SHOT_SECONDS,
  SLOWMO_AT,
  T_CONTACT,
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
  return 26 + 10 * k;
};
// Cars are never drawn shorter than ~150 px (4.26 m × 36 px/m): larger than life on the wider framing.
export const CAR_PPM_MIN = 36;
export const carScale13 = (f: number) => Math.max(1, CAR_PPM_MIN / ppm13(f));

// ── 1.2 and 1.4: side-on panels, cars placed in world metres (x along the track, z away from the camera) ──────────
// The same plan seen from above: footprint x = world x of the car's middle, y = z.

export const SHOT_12 = shot("1.2");
export const SHOT_14 = shot("1.4");
export const HIT = cue("suzuka1989.crash");
export const RESULT = cue("suzuka1989.result");

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

// 1.4: the two cars locked together exactly as they touched at the end of 1.3 (drive13.ts): SEN on the near side,
// PRO a car width and a bit further away, ~0.7 m ahead and yawed ~23° toward the camera — turned in across SEN's
// nose, so PRO's right front wheel sits over SEN's front wing (the interlocked noses of the 1989 photo). Seen from
// SEN's right, the 1.3 plan is mirrored (left of SEN = away from the camera); distances are kept. On 19.1 the
// picture freezes on the impact star for FREEZE_14 frames, then the pair slides on together and stops.
const P_TOUCH = proAt(T_CONTACT);
const S_TOUCH = senAt(T_CONTACT);
const REL = (() => {
  const h = (S_TOUCH.heading * Math.PI) / 180;
  const dx = P_TOUCH.x - S_TOUCH.x;
  const dy = P_TOUCH.y - S_TOUCH.y;
  return {
    ahead: dx * Math.cos(h) + dy * Math.sin(h),
    // map frame y down, headings clockwise: SEN's right is heading + 90°
    left: -(dx * -Math.sin(h) + dy * Math.cos(h)),
    yaw: P_TOUCH.heading - S_TOUCH.heading,
  };
})();
export const PRO_AHEAD_14 = REL.ahead; // m, PRO's middle of the wheelbase ahead of SEN's
export const PRO_YAW_14 = REL.yaw; // degrees, PRO's nose turned toward the camera
export const Z_SEN_14 = 8;
export const Z_PRO_14 = Z_SEN_14 + REL.left; // PRO's middle of the wheelbase
// Middle of the wheelbase from the car's rear end (MangaCar's origin), m.
export const MID_WHEELBASE = MP45.length / 2 - MP45.centreAhead;
// SEN's middle of the wheelbase relative to the camera's x (the camera pans with the slide).
export const SEN_MID_14 = -0.6;
export const FREEZE_14 = 14; // frames
const V0 = 22;
const TAU = 0.45;
export const slideTime14 = (f: number) =>
  Math.max(0, (f - HIT - FREEZE_14) / 60);
export const slide14 = (f: number) =>
  V0 * TAU * (1 - Math.exp(-slideTime14(f) / TAU));
export const slideSpeed14 = (f: number) =>
  f - HIT < FREEZE_14 ? 0 : V0 * Math.exp(-slideTime14(f) / TAU);
// PRO's heading in the side-on plan (x along the track, y = depth z): negative = nose toward the camera.
export const PRO_HEADING_14 = -PRO_YAW_14;
export const footprints14 = (f: number) => {
  const s = slide14(f);
  const a = (PRO_HEADING_14 * Math.PI) / 180;
  const sen: Footprint = {
    id: "SEN",
    x: s + SEN_MID_14 + MP45.centreAhead,
    y: Z_SEN_14,
    heading: 0,
    length: MP45.length,
    width: MP45.width,
  };
  const pro: Footprint = {
    id: "PRO",
    x: s + SEN_MID_14 + PRO_AHEAD_14 + Math.cos(a) * MP45.centreAhead,
    y: Z_PRO_14 + Math.sin(a) * MP45.centreAhead,
    heading: PRO_HEADING_14,
    length: MP45.length,
    width: MP45.width,
  };
  return { sen, pro };
};
// Where they touch: the corner of PRO's footprint nearest the camera (his right front wheel and wing end), x
// relative to the camera (slide taken out), z depth.
export const CONTACT_14 = (() => {
  const c = corners(footprints14(HIT).pro).reduce((m, p) =>
    p.y < m.y ? p : m,
  );
  return { x: c.x, z: c.y };
})();

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
    ...SHOT_14,
    // locked together from 19.1 to the end (the stopped pair stays behind the result after 20.1): PRO's right front
    // wheel over SEN's wing, the footprints touching, never passing through
    contact: [{ from: HIT, to: SHOT_14.to, ids: ["PRO", "SEN"], depth: 0.05 }],
    poses: (f) => {
      const { sen, pro } = footprints14(f);
      return [sen, pro];
    },
  },
];
