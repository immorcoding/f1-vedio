// The triple guardrail's rails and posts, in metres (pure, so the wreck geometry can read them from node).
// Three W-beams stacked with only a hairline between them, the top edge 1.05 m up (FIA 3501-2017 safety barrier:
// 1.0–1.2 m), so it meets a 1.78 m person between hip and waist. Each beam is 3/4 of the earlier 0.305 m (user review
// 2026-10-04: thinner rails), so the stack hangs from the same top edge and its bottom edge sits higher.
// Bottom and top edge per rail, bottom rail first.
const TOP = 1.05;
const BEAM = 0.305 * 0.75; // 0.229 m
const HAIRLINE = 0.005;
export const RAILS: readonly [number, number][] = [2, 1, 0].map((k) => {
  const top = TOP - k * (BEAM + HAIRLINE);
  return [Number((top - BEAM).toFixed(4)), Number(top.toFixed(4))];
});
export const POST_TOP = 1.1;
