// PROTOTYPE — asset sheet: the traced 2021 cars large on white, for review against the reference photos.
import { AbsoluteFill } from "remotion";
import { RB16B, W12 } from "./cars-2021";
import { MangaCar } from "./MangaCar";

const tone = (id: string, r: number, gap = 7) => (
  <pattern id={id} width={gap} height={gap} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
    <rect width={gap} height={gap} fill="#fbfaf6" />
    <circle cx={gap / 2} cy={gap / 2} r={r} fill="#0d0d0d" />
  </pattern>
);

export const CarSheet2021: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#fbfaf6" }}>
    <svg width={1920} height={1080}>
      <defs>
        {tone("b-tone-dark", 2.7)}
        {tone("b-tone-mid", 1.8)}
        {tone("b-tone-light", 1.05)}
      </defs>
      <MangaCar car={RB16B} id="s-ver" scheme="navy" x={180} ground={490} scale={1.1} />
      <MangaCar car={W12} id="s-ham" scheme="black" x={180} ground={1010} scale={1.1} />
    </svg>
  </AbsoluteFill>
);
