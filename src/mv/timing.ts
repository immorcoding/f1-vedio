// The beat map: the single source of time for the whole MV (MOT-4, AUD-3).
// The music generator, the composition and the check scripts all import this file; nothing else
// turns musical positions into seconds or frames.
//
// Pure TypeScript with no imports, so node can load it directly (`node scripts/*.mjs`).

export const BPM = 128;
export const BEATS_PER_BAR = 4;
export const FPS = 60;
/** Bars in the song. The song ends on the downbeat of bar BARS + 1. */
export const BARS = 112;
/** Audio sample rate of the score. 128 BPM puts every beat on a whole sample (22 500). */
export const SAMPLE_RATE = 48000;

export const SECONDS_PER_BEAT = 60 / BPM; // 0.46875 s, exact in binary
export const FRAMES_PER_BEAT = FPS * SECONDS_PER_BEAT; // 28.125
export const FRAMES_PER_BAR = FRAMES_PER_BEAT * BEATS_PER_BAR; // 112.5 — not a whole frame
export const SAMPLES_PER_BEAT = SAMPLE_RATE * SECONDS_PER_BEAT; // 22 500

/** A musical position: bar 1… and beat 1…4 within the bar (both 1-based, like the treatment). */
export type Pos = { readonly bar: number; readonly beat: number };

export const at = (bar: number, beat = 1): Pos => ({ bar, beat });

/** Beats from the start of the song (bar 1 beat 1 = 0). */
export const beatsAt = (p: Pos) => (p.bar - 1) * BEATS_PER_BAR + (p.beat - 1);
export const secondsAt = (p: Pos) => beatsAt(p) * SECONDS_PER_BEAT;
export const sampleAt = (p: Pos) => beatsAt(p) * SAMPLES_PER_BEAT;

/**
 * THE frame rounding rule — the only place a time becomes a frame number.
 * Round to the nearest frame; an exact half (every odd bar line: 112.5, 337.5 …) rounds up.
 * A position therefore shows at most half a frame (8.3 ms) after the music, never before it.
 * Durations are always differences of rounded positions, so shots tile without drift.
 */
export const toFrame = (seconds: number) => Math.floor(seconds * FPS + 0.5);
export const frameAt = (p: Pos) => toFrame(secondsAt(p));
export const framesBetween = (from: Pos, to: Pos) =>
  frameAt(to) - frameAt(from);

/** Song position (in beats, fractional) at a frame — for animation that follows the pulse. */
export const beatsAtFrame = (frame: number) => frame / FRAMES_PER_BEAT;

export const SONG_START: Pos = at(1);
export const SONG_END: Pos = at(BARS + 1);
export const TOTAL_FRAMES = frameAt(SONG_END); // 12 600
export const DURATION_SECONDS = secondsAt(SONG_END); // 210

/** True when p sits on a beat of the song (a whole bar and beat), from 1.1 up to and including the end. */
export const isOnGrid = (p: Pos) =>
  Number.isInteger(p.bar) &&
  Number.isInteger(p.beat) &&
  p.beat >= 1 &&
  p.beat <= BEATS_PER_BAR &&
  beatsAt(p) >= 0 &&
  beatsAt(p) <= beatsAt(SONG_END);

export const isBarLine = (p: Pos) => isOnGrid(p) && p.beat === 1;
export const posLabel = (p: Pos) => `${p.bar}.${p.beat}`;
export const samePos = (a: Pos, b: Pos) => beatsAt(a) === beatsAt(b);

// ── Sections of the song (docs/production/mv-treatment.md, "音乐骨架") ─────────────────
// `from` is the first downbeat of the section, `to` the first downbeat after it.

export type Section = {
  readonly id: string;
  readonly name: string;
  readonly from: Pos;
  readonly to: Pos;
};

export const SECTIONS = [
  { id: "intro", name: "前奏", from: at(1), to: at(9) },
  { id: "suzuka", name: "铃鹿 1989/1990", from: at(9), to: at(33) },
  { id: "brazil", name: "巴西 2008", from: at(33), to: at(57) },
  { id: "bahrain", name: "巴林 2020", from: at(57), to: at(73) },
  { id: "buildup", name: "蓄力", from: at(73), to: at(81) },
  { id: "abuDhabi", name: "阿布扎比 2021", from: at(81), to: at(105) },
  { id: "outro", name: "尾奏", from: at(105), to: at(113) },
] as const satisfies readonly Section[];

export type SectionId = (typeof SECTIONS)[number]["id"];

// ── Hits: accents written into the music that the picture must land on ─────────────
// Named "<part>.<event>"; the part that owns the moment must put an event with this id at
// this position in its edit list (checked by scripts/check-edit-list.mjs).

export const HITS = {
  "intro.light1": at(5, 1),
  "intro.light2": at(6, 1),
  "intro.light3": at(7, 1),
  "intro.light4": at(8, 1),
  "intro.light5": at(8, 3),
  "intro.lightsOut": at(9, 1),
  "suzuka1989.crash": at(19, 1),
  "suzuka1990.crash": at(28, 1),
  "brazil2008.pass": at(47, 1),
  "brazil2008.points": at(53, 1),
  "bahrain2020.impact": at(61, 1),
  "buildup.drop": at(81, 1),
  "abuDhabi2021.lockup": at(89, 1),
  "abuDhabi2021.finish": at(99, 1),
  "abuDhabi2021.points": at(101, 1),
} as const satisfies Record<string, Pos>;

export type HitId = keyof typeof HITS;
