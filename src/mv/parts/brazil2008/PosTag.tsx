// Race-position tag for the side shots: a black square with the position and the driver's three-letter code (STO-5),
// so a casual viewer can follow the stakes (HAM needs 5th; facts.md). `big` for the driver the shot is about.
import { INK, PAPER } from "../../../kit/colors";
import { CAPTION_FONT } from "../../../kit/lettering";

export const PosTag: React.FC<{
  x: number;
  y: number;
  code: string;
  pos: number;
  big?: boolean;
}> = ({ x, y, code, pos, big = false }) => {
  const k = big ? 1.4 : 1;
  return (
    <g transform={`translate(${x} ${y}) scale(${k})`}>
      <rect
        x={-74}
        y={-26}
        width={148}
        height={46}
        fill={PAPER}
        stroke={INK}
        strokeWidth={big ? 6 : 4}
      />
      <rect x={-74} y={-26} width={46} height={46} fill={INK} />
      <text
        x={-51}
        y={10}
        textAnchor="middle"
        fontFamily={CAPTION_FONT}
        fontWeight={700}
        fontSize={30}
        fill={PAPER}
      >
        {pos}
      </text>
      <text
        x={24}
        y={10}
        textAnchor="middle"
        fontFamily={CAPTION_FONT}
        fontWeight={700}
        fontSize={28}
        fill={INK}
      >
        {code}
      </text>
    </g>
  );
};
