// The SFX cue list (ticket #15): where the engine sounds sit in the song, in bars and beats from timing.ts.
// scripts/make-music.mjs synthesises each cue (scripts/lib/engine.mjs) on its own bus and mixes it under the music
// before the master; scripts/check-edit-list.mjs checks every cue lies inside the shot it names, a shot with cars on
// screen; scripts/check-audio.mjs checks the engines stay under the music.
//
// A cue drives its cars by road speed, so the engines change gear where the picture's cars speed up and brake. Where a
// part already stages its cars as data (suzuka1989/drive13.ts, suzuka1990/staging.ts, brazil2008/staging.ts,
// bahrain2020/staging.ts) the speeds and the slow motion come straight from it; otherwise they follow the shot's
// numbers, noted at the cue. Pure TypeScript, so node can load it.
//
// Not placed on purpose: the lights out on 9.1 cuts to the 1.1 title map, a shot without cars, so it keeps only the
// music's hit (an engine must never play over a shot without cars).
import { at, secondsAt, type Pos } from "./timing.ts";
import { proAt, realTime, senAt } from "./parts/suzuka1989/drive13.ts";
import { launch as launch90 } from "./parts/suzuka1990/staging.ts";
import { passLead, passRaceTime } from "./parts/brazil2008/staging.ts";
import { CLOCK_32, PLAN_32 } from "./parts/bahrain2020/staging.ts";
import { hamSpeed, verSpeed } from "./parts/abuDhabi2021/staging.ts";

/** Engine families (scripts/lib/engine.mjs PRESETS; facts: docs/production/facts.md "引擎声"). */
export type EngineEra = "v10-1989" | "v12-1990" | "v8-2008" | "v6h-2021";

export type SfxCar = {
  /** Driver code, for the cue list and the stereo picture. */
  readonly who: string;
  readonly era: EngineEra;
  /** Road speed, m/s, at race second t since the cue's start. */
  readonly speed: (t: number) => number;
  /** Stereo position at screen second s since the cue's start: −1 left … +1 right (where the car is on screen). */
  readonly pan: (s: number) => number;
  /** Level against the cue's other cars, dB (0 = the lead car). */
  readonly db?: number;
  /** Race second the clutch drops; before it the car sits on the grid revving. */
  readonly launch?: number;
};

export type SfxCue = {
  /** "<part>.<event>", like the hits. */
  readonly id: string;
  /** The shot it plays over (treatment number); it must lie inside that shot. */
  readonly shot: string;
  readonly from: Pos;
  /** Where the sound ends: "cut" stops dead on this beat, "fade" fades out over the last quarter beat. */
  readonly to: Pos;
  readonly end: "cut" | "fade";
  readonly cars: readonly SfxCar[];
  /** Race seconds at screen second s (the shot's slow motion); real time if absent. */
  readonly time?: (s: number) => number;
  /** How far the cue's engines sit under the music, at least, in every bar of the cue (RMS, dB). */
  readonly underDb: number;
  /** Low-pass, Hz: an engine heard through rain. */
  readonly muffle?: number;
  readonly note: string;
};

const clamp = (v: number, a = -1, b = 1) => Math.min(b, Math.max(a, v));
const ramp = (t: number, a: number, b: number) =>
  clamp((t - a) / (b - a), 0, 1);
const smooth01 = (u: number) => {
  const k = clamp(u, 0, 1);
  return k * k * (3 - 2 * k);
};
/** Seconds from one song position to another. */
const span = (from: Pos, to: Pos) => secondsAt(to) - secondsAt(from);
/** Speed from a distance function (central difference). */
const rateOf = (d: (t: number) => number) => (t: number) =>
  (d(t + 0.005) - d(t - 0.005)) / 0.01;

// ── 1.3: speeds and slow motion from drive13.ts ─────────────────────────────────────────────────────────────
// ── 1.6: the launch curve from suzuka1990/staging.ts (lights out on 24.3) ────────────────────────────────────
const START_90 = span(at(24), at(24, 3));
const off90 = (k: number, gain = 0) =>
  rateOf((t) =>
    t < START_90
      ? 0
      : k * launch90(t - START_90) + gain * smooth01((t - START_90) / 3.2),
  );
// ── 2.5: the pass in slow motion (brazil2008/staging.ts) ──────────────────────────────────────────────────────
// ── 3.2: GRO and KVY from the crash plan (bahrain2020/staging.ts), in real-time frames ──────────────────────────
const planSpeed =
  (poses: readonly { x: number; y: number }[]) => (t: number) => {
    const f = clamp(t * 60, 0, poses.length - 2);
    const i = Math.floor(f);
    const a = poses[Math.max(0, i - 1)];
    const b = poses[i + 1];
    const frames = i + 1 - Math.max(0, i - 1);
    return (Math.hypot(b.x - a.x, b.y - a.y) * 60) / frames;
  };
const CONTACT_32 = PLAN_32.contact / 60; // race seconds into the shot
// ── 5.4: screen x of each car, as Tow.tsx places them (m along the track; the camera's centre
// sits near x = −2.5, so a car 12 m behind is at the left edge) ───────────────────────────────────────────────
const panX = (x: number) => clamp(0.2 + 0.12 * (x + 2.5), -0.8, 0.8);
const OUT_51 = span(at(82), at(84));
const PULL_54 = span(at(92), at(93, 3));
const ALONG_54 = span(at(92), at(94, 3));
const DUR_54 = span(at(92), at(96));
const hamX54 = (s: number) =>
  -1.6 -
  6.4 +
  4.6 * ramp(s, PULL_54 + 0.2, ALONG_54) -
  4.2 * ramp(s, ALONG_54 + 0.5, DUR_54);

export const SFX = [
  {
    id: "suzuka1989.pair",
    shot: "1.2",
    from: at(11),
    to: at(15),
    end: "cut",
    underDb: 14,
    note: "two McLaren-Honda V10s flat out, PRO ahead; they sweep in from the left, one upshift into top",
    cars: [
      {
        who: "PRO",
        era: "v10-1989",
        speed: (t) => 83 - 7 * Math.exp(-t / 1.1),
        pan: (s) => 0.2 - 0.7 * Math.exp(-s / 0.55),
      },
      {
        who: "SEN",
        era: "v10-1989",
        db: -1,
        speed: (t) => 83 - 8 * Math.exp(-t / 1.0),
        pan: (s) => -0.15 - 0.7 * Math.exp(-s / 0.55),
      },
    ],
  },
  {
    id: "suzuka1989.chicane",
    shot: "1.3",
    from: at(15),
    to: at(19),
    end: "cut",
    underDb: 14,
    time: realTime,
    note: "300 km/h out of 130R, braking and five downshifts into the chicane in half-speed slow motion; dead on the crash (19.1)",
    cars: [
      {
        who: "PRO",
        era: "v10-1989",
        speed: (t) => proAt(t).v,
        pan: () => -0.2,
      },
      {
        who: "SEN",
        era: "v10-1989",
        speed: (t) => senAt(t).v,
        pan: (s) => 0.06 * senAt(realTime(s)).lat,
      },
    ],
  },
  {
    id: "suzuka1990.start",
    shot: "1.6",
    from: at(24),
    to: at(28),
    end: "cut",
    underDb: 14,
    note: "the front of the grid revving, lights out on 24.3, launch and upshifts to Turn 1; dead on the crash (28.1). McLaren-Honda V10s, Ferrari V12s",
    cars: [
      {
        who: "SEN",
        era: "v10-1989",
        launch: START_90,
        speed: off90(1),
        pan: () => 0.1,
      },
      {
        who: "PRO",
        era: "v12-1990",
        launch: START_90,
        speed: off90(1, 11.5),
        pan: () => -0.1,
      },
      {
        who: "MAN",
        era: "v12-1990",
        db: -5,
        launch: START_90 + 0.05,
        speed: off90(0.985),
        pan: () => 0.3,
      },
      {
        who: "BER",
        era: "v10-1989",
        db: -6,
        launch: START_90 + 0.08,
        speed: off90(0.99),
        pan: () => -0.3,
      },
    ],
  },
  {
    id: "brazil2008.chase",
    shot: "2.2",
    from: at(35),
    to: at(39),
    end: "fade",
    underDb: 17,
    muffle: 1100,
    note: "HAM's Mercedes V8 alone in the rain, muffled; 62 m/s down the wet back straight (Chase.tsx), entering from the left",
    cars: [
      {
        who: "HAM",
        era: "v8-2008",
        speed: (t) => 62 - 12 * Math.exp(-t / 1.4),
        pan: (s) => -0.55 * Math.exp(-s / 0.8),
      },
    ],
  },
  {
    id: "brazil2008.pass",
    shot: "2.5",
    from: at(47),
    to: at(51),
    end: "fade",
    underDb: 14,
    muffle: 2600,
    time: passRaceTime,
    note: "the pass at Junção in slow motion (0.3×, bars 47–48), then real time from 49.1: HAM's V8 pulls up the hill away from GLO's Toyota V8",
    cars: [
      {
        who: "HAM",
        era: "v8-2008",
        speed: (t) => 35 + 1.2 * t,
        pan: () => 0.05,
      },
      {
        who: "GLO",
        era: "v8-2008",
        db: -2,
        speed: (t) => 30 + 0.3 * t,
        pan: (s) => -0.7 * ramp(passLead(s), 0, 12),
      },
    ],
  },
  {
    id: "bahrain2020.lap1",
    shot: "3.2",
    from: at(59),
    to: at(61),
    end: "cut",
    underDb: 14,
    time: (s) => CLOCK_32.sim(s * 60) / 60,
    note: "lap 1 after Turn 3: GRO's Ferrari V6 and KVY's Honda V6 at 241 km/h, the touch on 60.1 in slow motion, KVY brakes, GRO lifts; cut dead with the music on 61.1",
    cars: [
      {
        who: "GRO",
        era: "v6h-2021",
        speed: planSpeed(PLAN_32.gro),
        pan: (s) =>
          0.25 * ramp(CLOCK_32.sim(s * 60) / 60, CONTACT_32, CONTACT_32 + 1),
      },
      {
        who: "KVY",
        era: "v6h-2021",
        db: -1,
        speed: planSpeed(PLAN_32.kvy),
        pan: (s) =>
          -0.7 *
          ramp(CLOCK_32.sim(s * 60) / 60, CONTACT_32 + 0.2, CONTACT_32 + 1.4),
      },
    ],
  },
  {
    id: "abuDhabi2021.charge",
    shot: "5.1",
    from: at(82),
    to: at(90),
    end: "fade",
    underDb: 14,
    note: "the run to T5 across shots 5.1–5.2 (staging.ts race clock): flat out from T4, VER in HAM's tow, out on 84.1; HAM brakes on 88.4, VER 0.15 s later, down to the turn-in on 90.1",
    cars: [
      {
        who: "VER",
        era: "v6h-2021",
        speed: verSpeed,
        pan: (s) => (s < OUT_51 ? 0.15 : -0.25),
      },
      {
        who: "HAM",
        era: "v6h-2021",
        speed: hamSpeed,
        pan: () => 0.25,
      },
    ],
  },
  {
    id: "abuDhabi2021.tow",
    shot: "5.4",
    from: at(92),
    to: at(96),
    end: "fade",
    underDb: 14,
    note: "out of T5 down the back straight (Tow.tsx): upshifts; HAM pulls out on 93.3, alongside on 94.3, falls back. VER right, HAM left",
    cars: [
      {
        who: "VER",
        era: "v6h-2021",
        speed: (t) => 60 + 24 * (1 - Math.exp(-t / 3)),
        pan: () => panX(-1.6),
      },
      {
        who: "HAM",
        era: "v6h-2021",
        speed: (t) =>
          60 +
          24 * (1 - Math.exp(-t / 3)) +
          1.5 * ramp(t, PULL_54, ALONG_54) -
          2.5 * ramp(t, ALONG_54 + 0.5, DUR_54),
        pan: (s) => panX(hamX54(s)),
      },
    ],
  },
] as const satisfies readonly SfxCue[];

export type SfxId = (typeof SFX)[number]["id"];
