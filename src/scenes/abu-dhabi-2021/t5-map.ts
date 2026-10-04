// The T5 hairpin of Yas Marina 2021 as a detailed top view: run-off, kerbs, wall and the North Grandstand that wraps
// the outside of the hairpin. Run-off widths and the grandstand's extent follow the 2018 SkySat image of the circuit
// (the hairpin itself was only widened for 2021; the centre line is the 2021 one from OpenStreetMap) and the 2024
// photo of the North Grandstand — see docs/assets/reference-register.md.
// Usage: <TrackSection track={YAS_MARINA_2021} view={view} from={900} to={2000} {...T5_SECTION} />
import {
  autoKerbs,
  YAS_MARINA_2021,
  type Side,
  type TrackSectionProps,
} from "../../tracks";

const S = YAS_MARINA_2021.corners;

// Outside run-off swells around the hairpin (wide asphalt run-off in the satellite image), narrow on the straights.
// The inside of the hairpin keeps a narrow strip before the infield.
const runoff = (s: number, side: Side) => {
  const d = Math.abs(s - S.t5Apex);
  return side === "right"
    ? 9 + 24 * Math.exp(-((d / 110) ** 2))
    : 7 - 2 * Math.exp(-((d / 60) ** 2));
};

// The night look of the section: floodlit paper surface, light-tone run-off behind a wall, tyre marks.
export const T5_SECTION = {
  surface: "paper",
  runoff,
  barrier: true,
  tyreMarks: true,
  kerbs: autoKerbs(YAS_MARINA_2021, 1250, 1700, 1 / 120),
  stands: [{ from: 1180, to: 1680, side: "right", depth: 26 }],
} satisfies Partial<TrackSectionProps>;
