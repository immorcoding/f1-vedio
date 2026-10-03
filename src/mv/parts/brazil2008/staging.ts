// Where the cars are in the Brazil 2008 shots that move more than one car, as plain data: the pictures draw from it
// and the interpenetration check (src/mv/overlap.ts, ART-18) tests it. Pure TypeScript so node can load it.
// Nobody touches anybody in this part (the Junção pass is clean), so no shot declares a contact window.
import type { Footprint, TopViewSampler } from "../../overlap.ts";
import { FPS, frameAt } from "../../timing.ts";
import { poseAt } from "../../../tracks/track.ts";
import { INTERLAGOS_2008 } from "../../../tracks/interlagos-2008.ts";
import { juncaoPlan } from "./juncao-plan.ts";
import { EDIT } from "./shots.ts";

// The 2008 cars' footprint (cars-2008.ts traces and the 2008 rules): 4.65 m rear wing to front wing, 1.8 m over the
// tyres; the centre lies ~0.2 m ahead of the middle of the wheelbase, which is where topAnchorAt places a car.
export const CAR_2008 = { length: 4.65, width: 1.8, centreAhead: 0.2 };

const shot = (id: string) => {
  const s = EDIT.shots.find((x) => x.id === id);
  if (!s) throw new Error(`brazil2008: no shot ${id}`);
  return { from: frameAt(s.from), to: frameAt(s.to) };
};
const seconds = (f: number, from: number) => (f - from) / FPS;

// ── 2.3: HAM behind VET (bottom panel, side-on, positions in m relative to the camera; z = distance) ────────────
export const split23 = (t: number) => {
  const gap = 0.8 + 0.6 * Math.sin(t * 1.3);
  return { vet: { x: 0.6 + gap, z: 15 }, ham: { x: -4.6, z: 11 } };
};

// ── 2.5: HAM passes GLO up the hill (side-on) ────────────────────────────────────────────────────────────────
// True speeds (MOT-5): GLO crawls out of Junção on slicks at ~30 m/s, HAM ~5 m/s quicker. The pass is shown in
// slow motion — race time τ runs at 0.3× for the first 1.4 s after the cue, then back to real time — not by slow cars.
const PASS_SLOW_UNTIL = 1.4;
export const passRaceTime = (t: number) => {
  if (t <= PASS_SLOW_UNTIL) return 0.3 * t;
  const u = t - PASS_SLOW_UNTIL;
  const ease = Math.min(u, 0.4);
  // rate eases from 0.3 to 1 over 0.4 s
  return (
    0.3 * PASS_SLOW_UNTIL +
    0.3 * ease +
    (0.7 * ease * ease) / 0.8 +
    Math.max(0, u - 0.4)
  );
};
export const passSlow = (t: number) =>
  t <= PASS_SLOW_UNTIL ? 1 : Math.max(0, 1 - (t - PASS_SLOW_UNTIL) / 0.4);
export const PASS_GLO_SPEED = 30;
export const pass25 = (t: number) => {
  const tau = passRaceTime(t);
  // HAM's nose level with GLO's at the cue, then 5 m/s quicker
  const d = -0.3 + 5 * tau;
  const glo = -3 - 0.8 * d; // the camera rides with HAM as he pulls away
  return { tau, glo: { x: glo, z: 16 }, ham: { x: glo + d, z: 10 } };
};

// A side-on car (rear end at x, distance z) as a footprint on the plan.
const sideOn = (id: string, c: { x: number; z: number }): Footprint => ({
  id,
  x: c.x + CAR_2008.length / 2,
  y: c.z,
  heading: 0,
  length: CAR_2008.length,
  width: CAR_2008.width,
});

const SHOT_23 = shot("2.3");
const SHOT_24 = shot("2.4");
const SHOT_25 = shot("2.5");

export const SAMPLERS: TopViewSampler[] = [
  {
    part: "brazil2008",
    shot: "2.3",
    ...SHOT_23,
    poses: (f) => {
      const c = split23(seconds(f, SHOT_23.from));
      return [sideOn("VET", c.vet), sideOn("HAM", c.ham)];
    },
  },
  {
    part: "brazil2008",
    shot: "2.4",
    ...SHOT_24,
    poses: (f) =>
      juncaoPlan(seconds(f, SHOT_24.from)).map((c) => {
        const p = poseAt(INTERLAGOS_2008, c.s, c.lat);
        const heading = p.heading + c.yaw;
        const a = (heading * Math.PI) / 180;
        return {
          id: c.code,
          x: p.x + Math.cos(a) * CAR_2008.centreAhead,
          y: p.y + Math.sin(a) * CAR_2008.centreAhead,
          heading,
          length: CAR_2008.length,
          width: CAR_2008.width,
        };
      }),
  },
  {
    part: "brazil2008",
    shot: "2.5",
    ...SHOT_25,
    poses: (f) => {
      const c = pass25(seconds(f, SHOT_25.from));
      return [sideOn("GLO", c.glo), sideOn("HAM", c.ham)];
    },
  },
];
