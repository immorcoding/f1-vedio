// Cover C, the playful one: the chequered flag fills the frame, rippling, with the title slammed across it, and Clawd
// (the post-credits stinger's mascot, Claude orange, ART-8's approved exception) peeking up from the bottom-left corner
// at it. Bottom right left to the flag (the duration badge).
import { INK, PAPER } from "../kit/colors";
import { SFX_FONT } from "../kit/lettering";
import { Clawd, type ClawdPose } from "../mv/parts/credits/Clawd";
import { CoverTitle, titleLayout } from "./CoverTitle";
import { CoverPage, W, ct, type CoverProps } from "./frame";

// The flag's cloth: a grid of checks displaced by a diagonal wave; each cell shaded by the slope it faces.
const Flag: React.FC<{ h: number }> = ({ h }) => {
  const cell = 150;
  const cols = Math.ceil(W / cell) + 3;
  const rows = Math.ceil(h / cell) + 3;
  const phase = (i: number, j: number) => i * 0.62 - j * 0.28;
  const pt = (i: number, j: number) => {
    const p = phase(i, j);
    return [
      (i - 1.5) * cell + Math.sin(p) * 26,
      (j - 1.5) * cell + Math.sin(p) * 46,
    ] as const;
  };
  const cells: React.ReactNode[] = [];
  const shades: React.ReactNode[] = [];
  for (let i = 0; i < cols; i++)
    for (let j = 0; j < rows; j++) {
      const q = [pt(i, j), pt(i + 1, j), pt(i + 1, j + 1), pt(i, j + 1)];
      const d = `M ${q.map((p) => `${p[0]} ${p[1]}`).join(" L ")} Z`;
      const dark = (i + j) % 2 === 0;
      cells.push(<path key={`${i}-${j}`} d={d} fill={dark ? INK : PAPER} />);
      const slope = Math.cos(phase(i + 0.5, j + 0.5));
      if (!dark && slope < -0.2)
        shades.push(
          <path
            key={`s${i}-${j}`}
            d={d}
            fill={slope < -0.7 ? ct("mid") : ct("light")}
          />,
        );
    }
  return (
    <g>
      {cells}
      {shades}
    </g>
  );
};

const PEEK: ClawdPose = {
  step: 0,
  planted: 1,
  stretch: 1.04,
  startle: 0.75,
  look: 0,
  reach: 0,
};

export const CoverC: React.FC<CoverProps> = ({ h }) => {
  const S = 178;
  const L = titleLayout(S, 0.52);
  const tx = W / 2 - L.mainW / 2 + 30;
  const ty = 120 + (h - 1080) * 0.45;
  const PW = 36;
  const clawdX = 300;
  return (
    <CoverPage h={h}>
      <Flag h={h} />
      <g transform={`rotate(-4 ${W / 2} ${ty + L.mainH / 2})`}>
        <CoverTitle x={tx} y={ty} S={S} sub={0.52} />
      </g>
      {/* Clawd peeks up from the bottom-left corner, feet below the frame, startled at the title */}
      <Clawd x={clawdX} y={h + PW * 1.85 * 1.15} lift={0} PW={PW} pose={PEEK} />
      <g transform={`rotate(-10 ${clawdX + 330} ${h - 330})`}>
        <text
          x={clawdX + 300}
          y={h - 300}
          fontFamily={SFX_FONT}
          fontSize={150}
          fill={INK}
          stroke={PAPER}
          strokeWidth={22}
          strokeLinejoin="round"
          paintOrder="stroke"
        >
          !?
        </text>
      </g>
    </CoverPage>
  );
};
