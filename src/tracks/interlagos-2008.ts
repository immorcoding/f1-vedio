// Autódromo José Carlos Pace (Interlagos), the layout raced at the 2008 Brazilian GP (4.309 km, unchanged since 1990).
// Centre line from OpenStreetMap (scripts/trace-track-interlagos.mjs; © OpenStreetMap contributors, ODbL); generated
// lap 4294 m against the official 4309 m (0.4 % short: OSM's line cuts the corners a little). Anticlockwise.
// The finish line sits on the pit straight about 210 m after the pit entry, as on the circuit map
// (docs/assets/reference-register.md); corner distances are where OSM's named ways begin. Kerbs: autoKerbs.
import { INTERLAGOS_LINE } from "./interlagos-2008.line";
import { parseLine, type Track } from "./track";

export const INTERLAGOS_2008: Track = {
  name: "Interlagos (2008)",
  lapLength: 4309,
  centreline: parseLine(INTERLAGOS_LINE),
  width: 14,
  // Places along the lap the Brazil 2008 scenes use, m.
  corners: {
    // turn 1, the "S do Senna"
    senna: 496,
    // Mergulho: the downhill left before Junção
    mergulho: 3082,
    // Junção (turn 12): the slow left onto the long climb to the line — where HAM passed GLO on the last lap
    juncaoEntry: 3401,
    juncaoApex: 3440,
    juncaoExit: 3499,
    // the flat-out kinks up the hill (Café, Subida dos Boxes) to the line
    cafe: 3565,
    subida: 3789,
  },
  turns: [
    { label: "S do Senna", s: 520, side: "right" },
    { label: "Junção", s: 3440, side: "right" },
  ],
};
