// The points motif (#17, review-1 creative idea #3): every standing the film shows, and the margin between the two
// drivers, from docs/production/facts.md. The parts draw them with the one points box (src/kit/points-box.tsx);
// `npm run check:points` checks these numbers against facts.md and against the edit lists' on-screen text.
// No React here: the check imports this file in node.

export type Standing = {
  /** Where in the film and when in the season. */
  label: string;
  /** The two drivers in the order the film shows them, with their points. */
  a: { code: string; pts: number };
  b: { code: string; pts: number };
};

export const STANDINGS = {
  // 1.2: before Suzuka 1989 (facts.md: Prost 76, Senna 60)
  suzuka1989: {
    label: "before Suzuka 1989",
    a: { code: "PRO", pts: 76 },
    b: { code: "SEN", pts: 60 },
  },
  // 1.5: before Suzuka 1990 (facts.md: Senna 78, Prost 69)
  suzuka1990: {
    label: "before Suzuka 1990",
    a: { code: "SEN", pts: 78 },
    b: { code: "PRO", pts: 69 },
  },
  // 2.7: final 2008 (facts.md: Hamilton 98, Massa 97)
  brazil2008: {
    label: "final 2008",
    a: { code: "HAM", pts: 98 },
    b: { code: "MAS", pts: 97 },
  },
  // 4.2: before Abu Dhabi 2021 (facts.md: both on 369.5)
  abuDhabiBefore: {
    label: "before Abu Dhabi 2021",
    a: { code: "VER", pts: 369.5 },
    b: { code: "HAM", pts: 369.5 },
  },
  // 5.7: final 2021 (facts.md: Verstappen 395.5, Hamilton 387.5)
  abuDhabiFinal: {
    label: "final 2021",
    a: { code: "VER", pts: 395.5 },
    b: { code: "HAM", pts: 387.5 },
  },
} as const satisfies Record<string, Standing>;

export type StandingId = keyof typeof STANDINGS;

/** The outro's margin sequence, in story order: 16 → 9 → 1 → 0 → 8. */
export const MARGIN_SEQUENCE: readonly StandingId[] = [
  "suzuka1989",
  "suzuka1990",
  "brazil2008",
  "abuDhabiBefore",
  "abuDhabiFinal",
];

const fmt = (n: number) => String(n);

/** Points gap between the two drivers (never negative). */
export const margin = (id: StandingId) => {
  const s: Standing = STANDINGS[id];
  return Math.abs(s.a.pts - s.b.pts);
};

/** The leader's code, or null on a tie. */
export const leader = (id: StandingId) => {
  const s: Standing = STANDINGS[id];
  return s.a.pts === s.b.pts ? null : s.a.pts > s.b.pts ? s.a.code : s.b.code;
};

/** One column of the points box: a big numeral, the driver code(s) under it, and whether it takes the gold stroke. */
export type PointsColumn = { value: string; code: string; gold?: boolean };

/** The two scores side by side ("98 VS 97"), gold on the leader; no gold on a tie. */
export const scoreColumns = (id: StandingId): PointsColumn[] => {
  const s: Standing = STANDINGS[id];
  const lead = leader(id);
  return [s.a, s.b].map((d) => ({
    value: fmt(d.pts),
    code: d.code,
    gold: lead === d.code,
  }));
};

/** The margin as one column ("+16" over "PRO", gold); a tie is "0" over both codes, no gold. */
export const marginColumns = (id: StandingId): PointsColumn[] => {
  const s: Standing = STANDINGS[id];
  const lead = leader(id);
  return lead === null
    ? [{ value: "0", code: `${s.a.code} VS ${s.b.code}` }]
    : [{ value: `+${fmt(margin(id))}`, code: lead, gold: true }];
};

/** The text a score box shows, as the edit lists write it ("98 VS 97"). */
export const scoreText = (id: StandingId) => {
  const s: Standing = STANDINGS[id];
  return `${fmt(s.a.pts)} VS ${fmt(s.b.pts)}`;
};
