// HAM's mirror (review-1 creative #1): the last six frames before the lock-up (90.1), from the last snare of the
// 89.4 fill, cut to a memory — 2008, Junção, HAM passing GLO for the fifth place that made him champion (shot 2.5,
// drawn by the Brazil part's own Pass, imported, at the beat his nose is past) — printed as a negative in monochrome
// inside a paper-edged frame with the year in the corner, so it reads as a flashback and not a glitch. Then the hard
// cut on 90.1 to the settled T5 panel: HAM, the one being passed this time.
import { CAPTION_FONT } from "../../../kit/lettering";
import { INK, PAPER } from "../../../kit/colors";
import { Pass } from "../brazil2008/Pass";
import { EDIT as BRAZIL } from "../brazil2008/shots.ts";
import { PASS_P5_AT } from "../brazil2008/staging.ts";
import { FPS, at, frameAt } from "../../timing.ts";

/** Frames of the flash, ending on the frame before the lock-up. */
export const MIRROR_FRAMES = 6;
export const MIRROR_FROM = frameAt(at(90)) - MIRROR_FRAMES;

const SHOT_25 = BRAZIL.shots.find((s) => s.id === "2.5")!;

export const MirrorFlash: React.FC<{ f: number }> = ({ f }) => {
  const k = f - MIRROR_FROM; // 0..5
  // the memory runs on in its own slow motion from the beat HAM's nose is past GLO
  const t = PASS_P5_AT + 0.02 + k / FPS;
  const st = { shot: SHOT_25, f, frame: Math.round(t * FPS), t, dur: 7.5 };
  const zoom = 1.06 - 0.01 * k;
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
