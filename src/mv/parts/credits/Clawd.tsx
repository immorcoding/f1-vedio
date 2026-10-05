// Clawd, the Claude Code welcome-screen critter, inked in the film's style for the post-credits stinger (user
// 2026-10-05, mascot B of the prototype `prototype/credits-gag`). Read off its block-character art
//     ▐▛███▜▌
//    ▝▜█████▛▘
//      ▘▘ ▝▝
// (a character cell is 2×2 quarter blocks, a quarter block about twice as tall as wide): a 12×4 body with two tall eye
// notches, one-block arms at mid height, four one-block legs. Claude orange (#D97757) is the one coloured thing in the
// black-and-white world that is not a car: an ART-8 exception the user approved for the stinger. Ink outline, a shade
// and dot tone on the lower body, a paper glint on the top edge (ART-7).
import { useId } from "react";
import { INK, PAPER } from "../../../kit/colors";

export const CLAUDE_ORANGE = "#D97757";
const SHADE = "#a9523a";

export type ClawdPose = {
  /** 0..1 through a step: the legs move in pairs. */
  step: number;
  /** Ground contact: 1 = feet planted (legs straight), 0 = in the air (legs tucked). */
  planted: number;
  /** Squash (<1) or stretch (>1) along y, about the feet; x keeps the volume. */
  stretch: number;
  /** 0 = calm, 1 = full startle: legs stretch, arms fly up, eyes go wide with a glint. */
  startle: number;
  /** Eyes: 0 = ahead (right), 1 = looking back over its shoulder (left). */
  look: number;
  /** The back (left) arm reaching back for the banner's cord: 0 = at its side, 1 = reaching. */
  reach: number;
};

// Quarter-block grid: col 1..17, row 0..5 (row 4 = legs). A block is PW wide, PW·1.85 tall; feet at y = 0, the body
// centred on col 9.
const BODY = { c0: 3, c1: 15, r0: 0, r1: 4 };
const EYES = [5, 12];
const LEGS = [4, 6, 11, 13];
const PH_K = 1.85;

/** Clawd's size from its block width, px. */
export const clawdSize = (PW: number) => ({ w: 16 * PW, h: 5 * PW * PH_K, body: 12 * PW });

/** Local points (feet at 0, 0) of the hands, for the cord and the flag pole. */
export const clawdHands = (PW: number, pose: ClawdPose) => {
  const PH = PW * PH_K;
  const s = pose.startle;
  const armRow = 2 - 1.6 * s;
  return {
    back: { x: (0.4 - 0.6 * s - 0.4 * pose.reach - 9) * PW, y: (armRow + 0.5 - 0.6 * pose.reach - 5) * PH },
    front: { x: (16.6 + 0.6 * s - 9) * PW, y: (armRow + 0.5 - 5) * PH },
  };
};

const ClawdBody: React.FC<{ PW: number; pose: ClawdPose }> = ({ PW, pose }) => {
  const id = `cw${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const PH = PW * PH_K;
  const s = pose.startle;
  const X = (c: number) => (c - 9) * PW;
  const Y = (r: number) => (r - 5) * PH;
  const rect = (c: number, r: number, w: number, h: number) => ({ x: X(c), y: Y(r), width: w * PW, height: h * PH });
  // legs: planted they stand full length; in the air they tuck up, in pairs a little out of step
  const tuck = (i: number) =>
    s > 0 ? 0 : (1 - pose.planted) * PH * (0.3 + 0.2 * Math.sin((pose.step + (i % 2) * 0.5) * Math.PI * 2));
  const legLen = 1 + 0.8 * s;
  const armRow = 2 - 1.6 * s;
  const backArm = { ...rect(1 - 0.6 * s - 0.4 * pose.reach, armRow - 0.6 * pose.reach, 2, 1) };
  const shapes = [
    rect(BODY.c0, BODY.r0, BODY.c1 - BODY.c0, BODY.r1 - BODY.r0),
    backArm,
    rect(15 + 0.6 * s, armRow, 2, 1),
    ...LEGS.map((c, i) => ({ ...rect(c, 4, 1, legLen - tuck(i) / PH) })),
  ];
  // raised arms bridge to the body
  const bridges =
    s > 0 || pose.reach > 0
      ? [
          rect(2.4, Math.min(armRow - 0.6 * pose.reach, 2), 0.8, Math.abs(2 - armRow + 0.6 * pose.reach) + 1),
          rect(14.8, Math.min(armRow, 2), 0.8, Math.abs(2 - armRow) + 1),
        ]
      : [];
  const all = [...shapes, ...bridges];
  const eyeH = 1 + 0.35 * s;
  const look = -0.55 * pose.look;
  return (
    <g>
      <defs>
        <clipPath id={`${id}-c`}>
          {all.map((r, i) => (
            <rect key={i} {...r} />
          ))}
        </clipPath>
        <pattern id={`${id}-d`} width={9} height={9} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <circle cx={4.5} cy={4.5} r={2.3} fill={INK} />
        </pattern>
      </defs>
      <g fill={INK} stroke={INK} strokeWidth={14} strokeLinejoin="miter">
        {all.map((r, i) => (
          <rect key={i} {...r} />
        ))}
      </g>
      <g fill={CLAUDE_ORANGE}>
        {all.map((r, i) => (
          <rect key={i} {...r} />
        ))}
      </g>
      <g clipPath={`url(#${id}-c)`}>
        {/* the bottom row of the body and the legs in shade and dots; the far side darker; a paper glint on top */}
        <rect x={X(0)} y={Y(3)} width={PW * 18} height={PH * 4} fill={SHADE} opacity={0.55} />
        <rect x={X(0)} y={Y(3)} width={PW * 18} height={PH * 4} fill={`url(#${id}-d)`} opacity={0.35} />
        <rect x={X(BODY.c1 - 1)} y={Y(0)} width={PW} height={PH * 3} fill={SHADE} opacity={0.35} />
        <rect x={X(3.35)} y={Y(0.3)} width={PW * 3.5} height={PW * 0.35} fill={PAPER} opacity={0.9} />
      </g>
      {EYES.map((c) => (
        <g key={c}>
          <rect
            x={X(c + look) - (s * PW) / 4}
            y={Y(1) - (eyeH - 1) * PH * 0.5}
            width={PW * (1 + s * 0.5)}
            height={PH * eyeH}
            fill={INK}
          />
          {s > 0.3 ? (
            <rect
              x={X(c + look) + PW * 0.15}
              y={Y(1) - (eyeH - 1) * PH * 0.3}
              width={PW * 0.4}
              height={PW * 0.4}
              fill={PAPER}
            />
          ) : null}
        </g>
      ))}
    </g>
  );
};

/**
 * Clawd standing with its feet centred on (x, y) (`lift` px above the ground at y, for its contact shadow). Squash and
 * stretch scale it about the feet. `children` are drawn inside its transform behind the body (the carried flag).
 */
export const Clawd: React.FC<{
  x: number;
  y: number;
  lift: number;
  PW: number;
  pose: ClawdPose;
  children?: React.ReactNode;
}> = ({ x, y, lift, PW, pose, children }) => {
  const sy = pose.stretch;
  const sx = 1 / Math.sqrt(sy);
  const { body } = clawdSize(PW);
  const shadow = Math.max(0.35, 1 - lift / 400);
  return (
    <g>
      {/* contact shadow on the ground, shrinking as it rises */}
      <ellipse cx={x} cy={y} rx={body * 0.55 * shadow} ry={PW * 0.7 * shadow} fill={INK} opacity={0.4 * shadow} />
      <g transform={`translate(${x} ${y - lift}) scale(${sx} ${sy})`}>
        {children}
        <ClawdBody PW={PW} pose={pose} />
      </g>
    </g>
  );
};
