# Shape inbox · feat/v2-latifi-top

Follow-up to #21: the shot-4.3 Latifi inset becomes a top view, with a top-only Williams FW43B.

## Signals

- 2026-10-04 · friction · ART-10 · The FW43B has no side trace, so it has no `Check-Trace` / `Check-Art` stills. It is a new kind of car, `TopOnlyCar` (`src/cars/spec.ts`): the modern planform (`modernPlanFrom`) built from five lengths measured on Lukas Raich's side photo at the W12/RB16B scale (312.5 px/m), plus the livery as plan colour blocks. It is checked on the new `Cars-2021-Top-Trio-Sheet` against W12/RB16B with axle guides instead. See the proposal below.
- 2026-10-04 · cite · ART-35 · The FW43B side photo is about 7–8° off square (the far front endplate sits 85 px ahead of the near one). Only lengths along the car are taken from it, and the cosine error is under 1 %, so no homography was done. Wheelbase 3.53 m and length 5.39 m are a little shorter than the W12 (3.73 / 5.75) and RB16B (3.63 / 5.57).
- 2026-10-04 · cite · ART-15 · The FW43B top view adds a new optional `CarPlan.tcam` (the fluorescent-yellow T-camera on the airbox, drawn over it). W12 and RB16B don't draw theirs from above, so the three 2021 cars now differ in that detail.
- 2026-10-04 · cite · ART-27 · No race number from above: #6 is set in `driver.number`, but no top view draws a number.
- 2026-10-04 · cite · ART-8 · Latifi's tyre compound isn't verified (facts.md), so the FW43B has no `compound` and its tyres are drawn without a band. In a top view, that looks the same as a pre-2011 plain sidewall.
- 2026-10-04 · cite · MOT-5 · Before the slip, the Latifi car's heading is its velocity (phase 1 of `latifi-t14.ts`). In the spin, heading and velocity separate on purpose, because that is what a spin is. The run is a 240 Hz rigid-body integration: 135 km/h on the exit, scrub braking set by the slip angle, and a corner impulse at the wall (restitution 0.1, wall friction 0.7). The contact lands 1 frame before 80.3, and the car stops at about 81.0 (1.55 s).
- 2026-10-04 · cite · ART-20 · The inset's smoke is fine bubble smoke laid in map space, so it stays where the tyres were and leaves a trail. Puffs come from the rear tyres while they slide, then grow, break into three smaller bubbles and shrink away within a second. Rubber marks from all four tyres sit under the smoke.
- 2026-10-04 · cite · ART-23 · Debris is eleven small, dark, unoutlined flecks that slide away from the struck corner and fade within 0.5–1.1 s, plus a black scuff on the wall face. There are no outlined shards; the #21 side-view shards are gone.
- 2026-10-04 · cite · STO-3, STO-7 · Sources say Latifi "spun" and stopped "horizontal across the track, speared into the barrier" at the exit of the T14 left-hander, i.e. on the outside (right-hand) wall. No source says which corner hit first or the exact final angle. The rear-right corner and about 60° across the track come from the simulation (facts.md).
- 2026-10-04 · friction · ART-14 · The inset keeps #21's box (640 × 249 at 392, 74). A 249 px tall box at real car size (13.5 px/m, car about 73 px) shows only about 18 m across, so the view is turned 22° off the run's direction to get the inside kerb at the top and the outside wall at the bottom.

## Proposals

- ART-10 (amend): A car that appears only on top-down maps may be a `TopOnlyCar`. Its lengths come from a registered side photo at the 2021 scale, its livery is plan colour blocks, and it is checked on a top-view sheet next to a traced car of its era, not with Trace/Art stills. If a later shot needs its side view, it gets traced as a full CarSpec.
