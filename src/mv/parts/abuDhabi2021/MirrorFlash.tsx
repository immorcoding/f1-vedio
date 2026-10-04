// HAM's mirror (review-1 creative #1): the last beat before the lock-up (89.4 → 90.1, ~28 frames) cuts to a memory —
// 2008, Junção, HAM passing GLO for the fifth place that made him champion (shot 2.5, drawn by the Brazil part's own
// Pass, imported) — printed as a negative in monochrome inside a paper-edged frame with the year in the corner, so it
// reads as a flashback and not a glitch. It snaps in on 89.4 (VER's dive is committed by then), holds with a very slow
// push while HAM's nose goes past GLO (the user: six frames were too fast to read, 2026-10-04), stutters back to the
// T5 top view for two frames and to the memory for one, then the hard cut on 90.1 to the settled T5 panel: HAM, the
// one being passed this time.
import { CAPTION_FONT } from "../../../kit/lettering";
import { INK, PAPER } from "../../../kit/colors";
import { Pass } from "../brazil2008/Pass";
import { EDIT as BRAZIL } from "../brazil2008/shots.ts";
import { PASS_P5_AT } from "../brazil2008/staging.ts";
import { FPS, SECONDS_PER_BEAT, at, frameAt } from "../../timing.ts";

/** The flash runs from 89.4 to the frame before the lock-up (90.1). */
export const MIRROR_FROM = frameAt(at(89, 4));
export const MIRROR_FRAMES = frameAt(at(90)) - MIRROR_FROM;
const SNAP = 3; // frames of the snap-in
/** The stutter: the second- and third-last frames flick back to the T5 top view (5.2), the last one to the memory. */
export const mirrorShowsNow = (f: number) => {
  const k = f - MIRROR_FROM;
  return k === MIRROR_FRAMES - 3 || k === MIRROR_FRAMES - 2;
};
// The memory's own clock (Brazil 2.5's shot seconds): it starts on 2.5's hit (47.1, noses level), two beats before
// the tags flip (47.3, PASS_P5_AT), and reaches just past the flip at the end of the hold, so HAM visibly draws past
// GLO and his place tag turns to 5 (2.5 is in 0.3× slow motion, so this plays the pass at about 0.8× race speed).
const MEMORY_FROM = PASS_P5_AT - 2 * SECONDS_PER_BEAT;
const MEMORY_RATE = (2 * SECONDS_PER_BEAT + 0.12) / ((MIRROR_FRAMES - 4) / FPS);

const SHOT_25 = BRAZIL.shots.find((s) => s.id === "2.5")!;

export const MirrorFlash: React.FC<{ f: number }> = ({ f }) => {
  const k = f - MIRROR_FROM; // 0 .. MIRROR_FRAMES − 1
  const t = MEMORY_FROM + (MEMORY_RATE * k) / FPS;
  const st = { shot: SHOT_25, f, frame: Math.round(t * FPS), t, dur: 7.5 };
  // snap in from a little bigger with a paper flash, then a very slow push through the hold
  const snap = Math.min(1, k / SNAP);
  const zoom = 1.06 + 0.08 * (1 - snap) + 0.03 * (k / MIRROR_FRAMES);
  const flash = k < SNAP ? 0.7 * (1 - k / SNAP) : 0;
  return (
    <div style={{ position: "absolute", inset: 0, backgroundColor: PAPER }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          filter: "grayscale(1) invert(1) contrast(1.25)",
          transform: `scale(${zoom})`,
        }}
      >
        <Pass st={st} />
      </div>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        {/* a paper edge round the memory, and its year */}
        <rect x={14} y={14} width={1892} height={1052} fill="none" stroke={PAPER} strokeWidth={28} />
        <rect x={28} y={28} width={1864} height={1024} fill="none" stroke={INK} strokeWidth={6} />
        {flash > 0 ? <rect width={1920} height={1080} fill={PAPER} opacity={flash} /> : null}
        <g transform="translate(1720 990) rotate(-4)">
          <rect x={-110} y={-44} width={220} height={88} fill={PAPER} stroke={INK} strokeWidth={6} />
          <text y={22} textAnchor="middle" fontFamily={CAPTION_FONT} fontWeight={700} fontSize={64} fill={INK}>
            2008
          </text>
        </g>
      </svg>
    </div>
  );
};
