// Outfits as data (ART-16): what a person wears, as colour blocks. The cast of the film — race drivers in team
// colours with their own helmet, the FIA medical crew, marshals (grey, the user's decision), team mechanics and the
// crowd — is a set of these. Reference photos for each role: docs/assets/reference-register.md (people).
import type { Driver } from "../../cars/spec";

export type Head =
  // a full-face race helmet in the driver's design (same data as the helmet in the car, ART-13)
  | { kind: "helmet"; helmet: Driver["helmet"] }
  // an open-face helmet (marshals, medical crew)
  | { kind: "openHelmet"; color: string; stripe?: string }
  // a cap, peak forward; the face under it stays in shadow (ART-5)
  | { kind: "cap"; color: string; hair: string }
  // bare head seen from behind or the side: hair only
  | { kind: "hair"; hair: string };

export type Outfit = {
  fit: "race" | "overall"; // a snug race suit, or loose work overalls
  suit: string;
  shade?: string; // far limbs; default: the suit colour darkened
  band?: string; // a colour band down the side of the suit and leg
  shoulders?: string; // epaulettes / yoke
  belt?: string;
  cuffs?: string; // sleeve-end and hem colour
  armband?: string; // a band round the upper arm (medical crew)
  vest?: string; // a tabard over the overalls (marshals)
  gloves: string;
  boots: string;
  head: Head;
};

// ── Cast ─────────────────────────────────────────────────────────────────────────────────────────────────────────
// A race driver in team colours with his own helmet.
export const driverOutfit = (
  helmet: Driver["helmet"],
  suit: string,
  trim: { band?: string; shoulders?: string; belt?: string; gloves?: string; boots?: string } = {},
): Outfit => ({
  fit: "race",
  suit,
  band: trim.band,
  shoulders: trim.shoulders,
  belt: trim.belt,
  gloves: trim.gloves ?? suit,
  boots: trim.boots ?? "#1b1b1d",
  head: { kind: "helmet", helmet },
});

// FIA medical crew: white fireproof overalls, a red band on the arm, white open-face helmet.
export const DOCTOR: Outfit = {
  fit: "race",
  suit: "#ecebe6",
  shade: "#bdbcb6",
  band: "#d8d7d1",
  armband: "#d3262c",
  gloves: "#d9d8d2",
  boots: "#202022",
  head: { kind: "helmet", helmet: { base: "#f2f2ee", stripe: "#d3262c", shell: "classic" } },
};

// Marshal: loose grey overalls with a lighter reflective band, white helmet, work gloves and boots.
export const MARSHAL: Outfit = {
  fit: "overall",
  suit: "#8d8f93",
  shade: "#5f6165",
  band: "#cfd0d2",
  gloves: "#3b3b3d",
  boots: "#18181a",
  head: { kind: "openHelmet", color: "#f3f2ee", stripe: "#b9b9b9" },
};

// Team mechanic, e.g. Ferrari: red overalls, white band, red cap.
export const mechanicOutfit = (
  suit: string,
  trim: { band?: string; cap?: string; gloves?: string; boots?: string } = {},
): Outfit => ({
  fit: "overall",
  suit,
  band: trim.band,
  gloves: trim.gloves ?? "#1d1d1f",
  boots: trim.boots ?? "#1d1d1f",
  head: { kind: "cap", color: trim.cap ?? suit, hair: "#1d1a18" },
});
export const FERRARI_MECHANIC = mechanicOutfit("#d4201d", { band: "#f1efe9", cap: "#d4201d" });

// A fan or family member in street clothes, seen from behind or the side.
export const crowdOutfit = (shirt: string, hair = "#2a2420"): Outfit => ({
  fit: "overall",
  suit: shirt,
  gloves: "#d9b896",
  boots: "#2a2a2c",
  head: { kind: "hair", hair },
});
