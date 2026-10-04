// Shots 6.2 and 6.3 (outro bars 5–8): the chequered flag, the race's real end signal, closes the film. A manga flag in
// black and white: the cloth rolls in travelling waves (dot tone in the folds, paper highlights on the crests). The
// score is winding down here (no kick after bar 4, back to the intro pad), so the flag moves calmly: no beat pump, low
// waves that keep slowing from its entrance to the end.
//   6.2 (bars 5–6)  on bar 5 beat 1 the flag sweeps in from the left over the last flashback panel, pole leading, in
//                   one unhurried eased move, small at first and growing until the cloth fills the frame around bar 6
//                   beat 1; the ping on bar 5 beat 3 gives it its one accent, a snap and a flash on the crests.
//   6.3 (bars 7–8)  the waves slow and settle to near-still; on bar 7 beat 1 a paper banner slams across the flag with
//                   the title F1 · 1989–2021 in ink; the ping on beat 3 glints on it and the chequered strip wipes in;
//                   the title holds through bar 7; from bar 8 beat 1 the flag sinks and the frame fades slowly to
//                   black with the score's last decay (the pad is near silent on the song's last frame).
// One clock for both shots: seconds since `outro.flag`, so the waves run on unbroken across the cut.
import { Easing, random } from "remotion";
import { INK, PAPER } from "../../../kit/colors";
import { CircuitTag, TitleText, titleWidth } from "../../../kit/lettering";
import { useLettering } from "../../../kit/lettering";
import { TonePattern } from "../../../kit/tone";
import { FPS, frameAt } from "../../timing";
import {
  cueAt,
  hit,
  shotAt,
  smooth,
  type ShotTime,
} from "../abuDhabi2021/shotClock";
import { Flashbacks } from "./Flashbacks";
import { EDIT } from "./shots.ts";

const CELL = 150; // one check, px
const COLS = 18;
const ROWS = 10;
const W = CELL * COLS; // 2700
const H = CELL * ROWS; // 1500
const TOP = (1080 - H) / 2;
const SUB = 4; // points per cell edge
const WAVE_HZ = 2.1; // waves running down the cloth per second, at full flap
const WAVE_L = 820; // wavelength along the cloth, px

/** Seconds from `outro.flag` to a cue. */
const cueS = (id: string) =>
  (frameAt(cueAt(EDIT, id)) - frameAt(cueAt(EDIT, "outro.flag"))) / FPS;

// ── the flag's state over time ─────────────────────────────────────────────────────────────────────────────────────
type FlagState = {
  /** Scale of the whole flag about the frame centre. */
  s: number;
  /** Pole x and a vertical offset, in the flag's own (unscaled) space. */
  px: number;
  dy: number;
  /** Wave clock (seconds at full flap) and wave height factor. */
  wt: number;
  amp: number;
  /** 0 → 1 once the flag is well in (sway on). */
  free: number;
  /** Sway strength (easing down with the waves). */
  live: number;
  /** The snap on the ping: 1 on the beat, decaying. */
  snap: number;
};

// The waves, from the flag's entrance to the end: speed (share of full flap) and height ease down all the way.
const RATE_REST = 0.08;
const RATE_START = 0.55;
const RATE_TAU = 2.2; // s
const AMP_REST = 0.25;
const AMP_START = 0.75;
const AMP_TAU = 2.6; // s

// screen x of the pole and the flag's scale, at tf seconds since `outro.flag`: one eased sweep to full frame, then
// a slow drift
const poleScreen = (tf: number, tFull: number) =>
  tf < tFull
    ? -40 + (2010 - -40) * Easing.inOut(Easing.sin)(tf / tFull)
    : 2010 + 40 * Math.min(1, (tf - tFull) / tFull);
const scaleAt = (tf: number, tFull: number) =>
  0.42 +
  (1.06 - 0.42) *
    Easing.inOut(Easing.sin)(Math.min(1, Math.max(0, tf / tFull)));

export const flagState = (tf: number): FlagState => {
  const tFull = cueS("outro.flagFull");
  const tSnap = cueS("outro.flagSnap");
  const tSink = cueS("outro.fade");
  const tEnd = cueS("outro.black");
  const place = (t: number) => {
    const s = scaleAt(t, tFull);
    return { s, px: 960 + (poleScreen(t, tFull) - 960) / s };
  };
  const { s, px } = place(tf);
  // the waves: gentle from the start and slowing to near-still by the end (the clock integrates the falling rate)
  const t = Math.max(0, tf);
  const slow = Math.exp(-t / RATE_TAU);
  const wt = RATE_REST * t + (RATE_START - RATE_REST) * RATE_TAU * (1 - slow);
  const amp = AMP_REST + (AMP_START - AMP_REST) * Math.exp(-t / AMP_TAU);
  // it rises a little as it comes in, and sinks away at the end
  const sink = smooth((tf - tSink) / (tEnd - tSink));
  const dy = 180 * (1 - smooth(tf / tFull)) + 160 * sink * sink;
  return {
    s,
    px,
    dy,
    wt,
    amp,
    free: smooth((tf - tFull * 0.5) / 0.6),
    live: Math.exp(-t / AMP_TAU),
    snap: hit(tf, tSnap, 0.22),
  };
};

// ── the cloth ──────────────────────────────────────────────────────────────────────────────────────────────────────
const ChequeredFlag: React.FC<{ tf: number; fs: FlagState }> = ({ tf, fs }) => {
  const { px, wt, amp: ampK, snap } = fs;

  // the cloth: u from the pole (0) back to the trailing edge (W), v down from the top
  const wave = (u: number, v: number) => {
    const amp = ampK * (18 + 125 * (u / W) ** 0.8);
    const ph =
      (2 * Math.PI * u) / WAVE_L - 2 * Math.PI * WAVE_HZ * wt + (v / H) * 1.3;
    return {
      x: px - u - amp * 0.45 * Math.cos(ph),
      y: TOP + v + amp * Math.sin(ph) + 0.015 * u,
      ph,
    };
  };
  const pt = (u: number, v: number) => {
    const p = wave(u, v);
    return `${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
  };
  // a cell's outline along the waved surface
  const cellPath = (i: number, j: number) => {
    const u0 = i * CELL;
    const v0 = j * CELL;
    const pts: string[] = [];
    for (let s = 0; s < SUB; s++) pts.push(pt(u0 + (CELL * s) / SUB, v0));
    for (let s = 0; s < SUB; s++)
      pts.push(pt(u0 + CELL, v0 + (CELL * s) / SUB));
    for (let s = SUB; s > 0; s--)
      pts.push(pt(u0 + (CELL * s) / SUB, v0 + CELL));
    for (let s = SUB; s > 0; s--) pts.push(pt(u0, v0 + (CELL * s) / SUB));
    return `M ${pts.join(" L ")} Z`;
  };
  const outline = (() => {
    const pts: string[] = [];
    const n = COLS * SUB;
    const m = ROWS * SUB;
    for (let s = 0; s <= n; s++) pts.push(pt((W * s) / n, 0));
    for (let s = 1; s <= m; s++) pts.push(pt(W, (H * s) / m));
    for (let s = n - 1; s >= 0; s--) pts.push(pt((W * s) / n, H));
    for (let s = m - 1; s > 0; s--) pts.push(pt(0, (H * s) / m));
    return `M ${pts.join(" L ")} Z`;
  })();

  const whites: string[] = [];
  const blacks: string[] = [];
  const folds: { d: string; o: number }[] = [];
  const shines: { d: string; o: number }[] = [];
  for (let i = 0; i < COLS; i++)
    for (let j = 0; j < ROWS; j++) {
      const d = cellPath(i, j);
      ((i + j) % 2 === 0 ? blacks : whites).push(d);
      // the fold facing away from the light: dot tone, deepest in the trough
      const c = wave(i * CELL + CELL / 2, j * CELL + CELL / 2);
      const shade = Math.max(0, Math.cos(c.ph));
      if (shade > 0.15) folds.push({ d, o: shade });
      // the crest catching the light: paper dots over the black checks
      const shine = Math.max(0, -Math.cos(c.ph));
      if ((i + j) % 2 === 0 && shine > 0.3) shines.push({ d, o: shine });
    }
  // crests: paper highlight streaks across the cloth (they show on the black checks), and ink crease lines in the
  // troughs (they show on the white ones)
  const ridge = (offset: number) => {
    const lines: string[] = [];
    const u0 = (v: number) =>
      ((offset + 2 * Math.PI * WAVE_HZ * wt - (v / H) * 1.3) * WAVE_L) /
      (2 * Math.PI);
    const k0 = -Math.ceil(u0(0) / WAVE_L) - 1;
    for (let k = k0; k < k0 + W / WAVE_L + 4; k++) {
      const pts: string[] = [];
      for (let s = 0; s <= 12; s++) {
        const v = (H * s) / 12;
        const u = u0(v) + WAVE_L * k;
        if (u < 0 || u > W) continue;
        pts.push(pt(u, v));
      }
      if (pts.length > 1) lines.push(`M ${pts.join(" L ")}`);
    }
    return lines.join(" ");
  };
  const poleTop = wave(0, 0);
  // the crests flare on the snap
  const shineK = Math.min(1, 0.75 + 0.6 * snap);

  return (
    <g>
      <defs>
        <TonePattern id="o6f-fold" r={3.4} gap={10} />
        <pattern
          id="o6f-shine"
          width={10}
          height={10}
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <circle cx={5} cy={5} r={2.6} fill={PAPER} />
        </pattern>
      </defs>
      <path d={whites.join(" ")} fill={PAPER} />
      <path d={blacks.join(" ")} fill={INK} />
      {shines.map((f, k) => (
        <path
          key={`s${k}`}
          d={f.d}
          fill="url(#o6f-shine)"
          opacity={(shineK * (f.o - 0.3)) / 0.7}
        />
      ))}
      {folds.map((f, k) => (
        <path key={k} d={f.d} fill="url(#o6f-fold)" opacity={0.85 * f.o} />
      ))}
      <path
        d={ridge(Math.PI)}
        fill="none"
        stroke={PAPER}
        strokeWidth={16 + 14 * snap}
        strokeLinecap="round"
        opacity={0.32 + 0.4 * snap}
      />
      <path
        d={ridge(Math.PI)}
        fill="none"
        stroke={PAPER}
        strokeWidth={5}
        strokeLinecap="round"
        opacity={0.55}
      />
      <path
        d={ridge(0)}
        fill="none"
        stroke={INK}
        strokeWidth={4}
        strokeLinecap="round"
        opacity={0.7}
      />
      <path
        d={outline}
        fill="none"
        stroke={INK}
        strokeWidth={10}
        strokeLinejoin="round"
      />
      {/* the pole, leading: from a knob just above the cloth down out of the frame */}
      <g>
        <rect
          x={poleTop.x - 24}
          y={TOP - 70}
          width={48}
          height={3000}
          fill={PAPER}
        />
        <rect
          x={poleTop.x - 17}
          y={TOP - 64}
          width={34}
          height={3000}
          fill={INK}
        />
        <rect
          x={poleTop.x - 6}
          y={TOP - 50}
          width={5}
          height={3000}
          fill={PAPER}
          opacity={0.7}
        />
        <circle
          cx={poleTop.x}
          cy={TOP - 78}
          r={30}
          fill={INK}
          stroke={PAPER}
          strokeWidth={7}
        />
      </g>
      {/* a few flecks thrown off the trailing edge on the snap */}
      {Array.from({ length: 10 }, (_, k) => {
        const age = (tf * 1.3 + random(`o61f${k}`)) % 1;
        const e = wave(W, H * random(`o61v${k}`));
        return (
          <path
            key={k}
            d={`M ${e.x - 30 - 140 * age} ${e.y} l ${-50 - 40 * random(`o61l${k}`)} ${8 - 16 * random(`o61d${k}`)}`}
            stroke={INK}
            strokeWidth={4}
            strokeLinecap="round"
            opacity={snap > 0.2 ? 0.8 * (1 - age) : 0}
          />
        );
      })}
    </g>
  );
};

// The flag placed in the frame: sweeping in and swaying gently (no beat pump: the score is winding down); the one
// accent is the snap on the 5.3 ping.
const FlagLayer: React.FC<{ tf: number }> = ({ tf }) => {
  const fs = flagState(tf);
  const k = fs.s * (1 + 0.04 * fs.free) * (1 + 0.03 * fs.snap);
  const rot = fs.free * fs.live * 3 * Math.sin(fs.wt * 2.6);
  return (
    <g
      transform={`translate(960 ${540 + fs.dy}) rotate(${rot}) scale(${k}) translate(-960 -540)`}
    >
      <ChequeredFlag tf={tf} fs={fs} />
    </g>
  );
};

// 6.2: the flag waves in over the last flashback panel (that panel keeps running underneath).
export const FlagIn: React.FC<{ st: ShotTime }> = ({ st }) => {
  const panels = shotAt(
    { ...EDIT, shots: EDIT.shots.filter((s) => s.id === "6.1") },
    st.f,
  );
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      <Flashbacks st={panels} />
      <svg width={1920} height={1080} style={{ position: "absolute" }}>
        <FlagLayer tf={st.t} />
      </svg>
    </div>
  );
};

// 6.3: the title on the settling flag, then the fade to black.
const TITLE = "F1 · 1989–2021";
const TITLE_SIZE = 150;
const BANNER_H = 270;
const BANNER_TILT = -3;
const STRIP = 34;

export const FlagTitle: React.FC<{ st: ShotTime }> = ({ st }) => {
  useLettering();
  const t0 = cueS("outro.title");
  const tf = t0 + st.t;
  const since = tf - t0;
  const glintAt = cueS("outro.titleGlint") - t0;
  const fadeAt = cueS("outro.fade") - t0;
  const endAt = cueS("outro.black") - t0;
  // the banner and title slam on together: from oversize, with a shake
  const slam = Math.min(1, since / 0.12);
  const bs = 1.25 - 0.25 * Easing.out(Easing.back(2))(slam);
  const punch = Math.max(0, 1 - since / 0.3) ** 2;
  const shakeX = punch * 12 * Math.sin(st.t * 97);
  const shakeY = punch * 9 * Math.cos(st.t * 83);
  const tw = titleWidth(TITLE, TITLE_SIZE);
  const ty = 540 + TITLE_SIZE * 0.26; // baseline: the caps centred on the banner, a little above for the strip
  const sq = Math.round(STRIP * 0.42);
  const checks = Math.round(tw / sq);
  const strip = Math.max(0, Math.min(1, (since - glintAt) / 0.3));
  const g = hit(since, glintAt, 0.3);
  const gs = 40 + 70 * g;
  const fade = Math.max(
    0,
    Math.min(1, smooth((st.t - fadeAt) / (endAt - fadeAt - 1 / FPS))),
  );
  const fs = flagState(tf);
  const sinkY = fs.dy; // the banner rides down with the flag
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        backgroundColor: INK,
      }}
    >
      <svg width={1920} height={1080} style={{ position: "absolute" }}>
        <g transform={`translate(${shakeX} ${shakeY})`}>
          <FlagLayer tf={tf} />
          <g
            transform={`translate(960 ${540 + sinkY}) rotate(${BANNER_TILT}) scale(${bs}) translate(-960 -540)`}
            opacity={Math.min(1, since * 30)}
          >
            {/* a paper banner across the flag: hard ink shadow, ink rules top and bottom */}
            <rect
              x={-200}
              y={540 - BANNER_H / 2 + 18}
              width={2320}
              height={BANNER_H}
              fill={INK}
            />
            <rect
              x={-200}
              y={540 - BANNER_H / 2}
              width={2320}
              height={BANNER_H}
              fill={PAPER}
            />
            <path
              d={`M -200 ${540 - BANNER_H / 2 + 14} H 2120 M -200 ${540 + BANNER_H / 2 - 14} H 2120`}
              stroke={INK}
              strokeWidth={4}
            />
            <path
              d={`M -200 ${540 - BANNER_H / 2} H 2120 M -200 ${540 + BANNER_H / 2} H 2120`}
              stroke={INK}
              strokeWidth={10}
            />
            <TitleText
              x={960 - tw / 2 + 8}
              y={ty}
              size={TITLE_SIZE}
              text={TITLE}
              colour={INK}
            />
            <CircuitTag
              x={960 - (checks * sq) / 2}
              y={ty + 26}
              text=""
              strip={strip}
              name={0}
              size={STRIP}
              checks={checks}
              colour={INK}
            />
            {/* the ping: a glint on the title's top right */}
            {g > 0.01 ? (
              <g
                transform={`translate(${960 + tw / 2 - 10} ${ty - TITLE_SIZE * 0.8}) rotate(${20 * g})`}
                opacity={Math.min(1, g * 1.6)}
              >
                <path
                  d={`M 0 ${-gs} Q ${gs * 0.1} ${-gs * 0.1} ${gs} 0 Q ${gs * 0.1} ${gs * 0.1} 0 ${gs} Q ${-gs * 0.1} ${gs * 0.1} ${-gs} 0 Q ${-gs * 0.1} ${-gs * 0.1} 0 ${-gs} Z`}
                  fill={PAPER}
                  stroke={INK}
                  strokeWidth={4}
                />
              </g>
            ) : null}
          </g>
        </g>
        <rect width={1920} height={1080} fill={INK} opacity={fade} />
      </svg>
    </div>
  );
};
