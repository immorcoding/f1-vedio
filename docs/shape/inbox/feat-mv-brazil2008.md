# Shape inbox: feat/mv-brazil2008 (#8)

## Signals

- 2026-10-03 · art-direction · ART-8 · Bridgestone-era tyres have no coloured sidewall band; dry vs wet is shown by tread instead: side view = cut sipes round a wet tyre's shoulder (`CarState.tread`), top view = 4 lengthwise grooves on a 2008 dry tyre (`CarSpec.tyreGrooves`) or chevron sipes on a wet one. Shared-file changes: `src/cars/spec.ts`, `src/cars/TopCar.tsx` (approved by the lead).
- 2026-10-03 · art-direction · ART-15 · 2008 top views are the modern planform narrowed to the 2008 rules (1.8 m overall, 1.4 m front wing, 1.0 m rear wing, 0.27/0.355 m tyres) via `top.plan` in `cars-2008.ts`.
- 2026-10-03 · art-direction · ART-9 · wet track: the car is mirrored in the asphalt (flipped, 28 % opacity) and tyre spray is one inked plume per wheel (union outline, dot-shaded underside, dashed wisps at the tail) — `src/kit/rain.tsx` (`Rain`, `Spray`, `Splashes`) is a new shared kit file for any later wet scene.
- 2026-10-03 · art-direction · ART-14 · top-view maps with three cars: the driver tags sit on the outer side of each car (not above every car) so they never stack.
- 2026-10-03 · motion-and-timing · MOT-2 · top-view cars are drawn 2–2.6× life size on corner maps (as #5 does for T5), otherwise they vanish at a scale that shows a whole corner.
- 2026-10-03 · story-and-facts · STO-3 · the open fact is settled: VET passed HAM on lap 69 (HAM 5th → 6th); HAM was 6th when MAS crossed the line; HAM passed GLO at Junção on lap 71. Shot 2.3's text "（被 VET 超过的圈数和名次待核实）" in the treatment can be removed.

## Proposed

- Treatment 2.3: drop the "待核实" note now that facts.md holds the answer.
