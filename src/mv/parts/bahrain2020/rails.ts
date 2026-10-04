// The triple guardrail's rails and posts, in metres (pure, so the wreck geometry can read them from node).
// Three W-beams of about 0.31 m stacked with only a hairline between them, the top edge 1.05 m up (FIA 3501-2017
// safety barrier: 1.0–1.2 m), so it meets a 1.78 m person between hip and waist. Bottom and top edge per rail.
export const RAILS: readonly [number, number][] = [
  [0.12, 0.425],
  [0.43, 0.735],
  [0.74, 1.05],
];
export const POST_TOP = 1.1;
