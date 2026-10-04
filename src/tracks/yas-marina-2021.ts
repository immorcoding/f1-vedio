// Yas Marina Circuit, 2021 F1 layout (the one raced at the 2021 Abu Dhabi GP: 16 turns, 5.281 km).
// Centre line from OpenStreetMap (scripts/trace-track-yas.mjs), registered against the CC0 2021 layout map
// (docs/assets/reference-register.md): same shape at the map's 1 km scale bar, finish line on its chequered flag.
// Generated lap length 5281 m equals the official 5.281 km. Kerbs are not traced: use autoKerbs.
import { parseLine, type Track } from "./track.ts";
import { YAS_2021_LINE } from "./yas-marina-2021.line.ts";

export const YAS_MARINA_2021: Track = {
  name: "Yas Marina Circuit (2021)",
  lapLength: 5281,
  centreline: parseLine(YAS_2021_LINE),
  width: 15,
  // Places along the 2021 lap the Abu Dhabi scenes use, m.
  corners: {
    // T4 exit: start of the short straight up to the T5 hairpin
    t5Approach: 900,
    // T5 braking zone and turn-in
    t5TurnIn: 1350,
    t5Apex: 1424,
    t5Exit: 1490,
    // the back straight runs from the T5 exit to the turn 6 chicane
    t6: 2610,
  },
  // Only the turn the MV names (facts.md: the final-lap pass "into turn 5"). Apex at the north tip of the line.
  turns: [{ label: "T5", s: 1424, side: "left" }],
};
