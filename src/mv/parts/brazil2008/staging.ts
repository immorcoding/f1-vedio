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
// slow motion — race time τ runs at 0.3× from the cue (47.1) to the real-time cue (49.1), then eases back to real
// time over 0.4 s — not by slow cars. Shot seconds come from the edit list's cues, so a retime keeps them on the beat.
const SHOT_25_FROM = shot("2.5").from;
const cueSeconds = (id: string) => {
  for (const s of EDIT.shots)
    for (const c of s.cues ?? [])
      if (c.id === id) return seconds(frameAt(c.at), SHOT_25_FROM);
  throw new Error(`brazil2008: no cue ${id}`);
};
const PASS_RATE = 0.3;
const PASS_EASE = 0.4;
/** Shot seconds of the beat HAM is past GLO (the tags flip, 47.3) and of the snap back to real time (49.1). */
export const PASS_P5_AT = cueSeconds("brazil2008.p5");
export const PASS_SLOW_UNTIL = cueSeconds("brazil2008.realTime");
export const passRaceTime = (t: number) => {
  if (t <= PASS_SLOW_UNTIL) return PASS_RATE * t;
  const u = t - PASS_SLOW_UNTIL;
  const ease = Math.min(u, PASS_EASE);
  // rate eases from PASS_RATE to 1 over PASS_EASE
  return (
    PASS_RATE * PASS_SLOW_UNTIL +
    PASS_RATE * ease +
    ((1 - PASS_RATE) * ease * ease) / (2 * PASS_EASE) +
    Math.max(0, u - PASS_EASE)
  );
};
export const passSlow = (t: number) =>
  t <= PASS_SLOW_UNTIL
    ? 1
    : Math.max(0, 1 - (t - PASS_SLOW_UNTIL) / PASS_EASE);
export const PASS_GLO_SPEED = 30;
const PASS_GAIN = 5; // HAM's extra speed, m/s
/** HAM's nose ahead of GLO's, m (both 4.65 m cars, so rear ends and noses are the same gap). */
export const passLead = (t: number) => 0.5 + PASS_GAIN * passRaceTime(t);
export const pass25 = (t: number) => {
  const tau = passRaceTime(t);
  // on the hit (47.1) HAM's nose is just level-and-ahead (0.5 m); by 47.3 he leads by ~2 m, the tags flip
  const d = passLead(t);
  // the camera drifts from GLO to HAM: HAM settles left of centre with his nose clear of the right edge (BRAZIL_CAM,
  // 230 px/m at 10 m: rear end ≥ −2.8 m, nose ≤ 1800 px), GLO falls back out of the left of the frame
  const ham = -3 + 1.8 * (1 - Math.exp(-d / 5));
  const glo = ham - d;
  // the camera's place along the road (world m): GLO is at PASS_GLO_SPEED · τ, on screen at `glo`
  const camX = PASS_GLO_SPEED * tau - glo;
  return { tau, camX, glo: { x: glo, z: 16 }, ham: { x: ham, z: 10 } };
};

// ── 2.5, bars 49–50: real time, from above (review-2 #4) ─────────────────────────────────────────────────────
// On 49.1 the picture cuts from the side-on slow motion to the plan (MOT-2): out of Junção and up the hill, HAM ahead
// on the inside, GLO still on the outside line, twitching on slicks. Same clocks as the side shot — race time from
// passRaceTime (which eases back to 1× over 0.4 s, as the engine sound does) and the lead from passLead — so HAM
// leads by ~6 m on the cut and ~24 m by 51.1. Lap distances s (centre of each car), lateral offsets in m to the
// driver's right (Junção is a left-hander: the inside is negative), yaw in degrees on top of the track heading.
const PULL_FROM = PASS_SLOW_UNTIL;
/** GLO's lap distance on the cut (49.1): just past the Junção apex (interlagos-2008.ts: apex 3440, exit 3499). */
const PULL_GLO_S = 3452;
const smooth01 = (x: number) => {
  const c = Math.min(1, Math.max(0, x));
  return c * c * (3 - 2 * c);
};
type PlanPose = { s: number; lat: number; yaw: number; speed: number };
export const pullAway25 = (t: number): { glo: PlanPose; ham: PlanPose } => {
  const tau = passRaceTime(t) - passRaceTime(PULL_FROM); // race seconds since 49.1
  const gloS = (x: number) => PULL_GLO_S + PASS_GLO_SPEED * x;
  // HAM's lead in race time: passLead runs on shot time, so map τ back (both clocks run at 1× after the ease)
  const lead = (x: number) =>
    0.5 + PASS_GAIN * (passRaceTime(PULL_FROM) + x);
  const hamS = (x: number) => gloS(x) + lead(x);
  // HAM unwinds from the inside (−3.2 m, where 2.4 left him) to the racing line up the hill; GLO keeps the outside
  const hamLat = (x: number) => -3.2 + 1.8 * smooth01(x / 2.6);
  const gloLat = (x: number) => 1.6 + 0.35 * Math.sin(x * 3.1);
  const d = 0.02;
  const pose = (
    s: (x: number) => number,
    lat: (x: number) => number,
    wobble: number,
  ): PlanPose => {
    const ds = s(tau + d) - s(tau - d);
    const dl = lat(tau + d) - lat(tau - d);
    return {
      s: s(tau),
      lat: lat(tau),
      // heading along the velocity: the change of line turns the car (MOT-5)
      yaw: (Math.atan2(dl, ds) * 180) / Math.PI + wobble,
      speed: ds / (2 * d),
    };
  };
  return {
    glo: pose(gloS, gloLat, 7 * Math.sin(tau * 3.1 + 0.6)),
    ham: pose(hamS, hamLat, 0),
  };
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
      const t = seconds(f, SHOT_25.from);
      if (t >= PASS_SLOW_UNTIL) {
        // bars 49–50: the plan view
        const c = pullAway25(t);
        return (["GLO", "HAM"] as const).map((id) => {
          const q = id === "GLO" ? c.glo : c.ham;
          const p = poseAt(INTERLAGOS_2008, q.s, q.lat);
          const heading = p.heading + q.yaw;
          const a = (heading * Math.PI) / 180;
          return {
            id,
            x: p.x + Math.cos(a) * CAR_2008.centreAhead,
            y: p.y + Math.sin(a) * CAR_2008.centreAhead,
            heading,
            length: CAR_2008.length,
            width: CAR_2008.width,
          };
        });
      }
      const c = pass25(t);
      return [sideOn("GLO", c.glo), sideOn("HAM", c.ham)];
    },
  },
];
