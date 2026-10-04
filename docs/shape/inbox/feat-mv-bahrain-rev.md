# Shape inbox: feat/mv-bahrain-rev (Bahrain 2020 revision after user review)

Lines for the area files, to merge on `main`.

## Signals

- art-direction · ART-8 · 2026-10-03 · user review: "巴林撞车和火特效再优化". Fire (`src/kit/fire.tsx`) is now three independent layers (outer on threes, mid and core on twos out of phase, each tongue breathing every frame), heat haze strokes plus a turbulence shimmer of the night behind the fire, embers that rise every frame with motion streaks, and smoke as thin ink-stroke ribbons. The round smoke puffs are gone everywhere in the kit and in 3.4; the user had called out the bubble-shaped black smoke. Sparks and the 3.3 fireball are drawn in the fire's colours (treated as part of the fire exception).
- art-direction · ART-8 · 2026-10-03 · the FIA medical car is drawn as environment (paper, screentone, black glass, a paper light bar), not in its real livery. Ask the user if it should get an exception like the safety car's amber light.
- story-and-facts · STO-7 · 2026-10-03 · user review: "四格都在车手头部重复". 3.5 became a "28 秒" timeline of four different moments (0 s halo prising the barrier open, 11 s medical car, the marshal with the extinguisher, 28 s the glove on the rail). The extinguisher's time could not be verified (FIA summary, The Race, ESPN, RaceFans, Motorsport Technology), so that panel carries no seconds label. The FIA summary gives "out of car after 27 seconds" against Wikipedia's 28; the film keeps 28 until the user decides.
- art-direction · ART-14 · 2026-10-03 · the time labels sit in a panel corner the subject is not in (top-left, or top-right for the medical car, whose fire is on the left).
- motion-and-timing · MOT-5 · 2026-10-03 · 3.3 puts the contact on the bar's first beat and then runs an explicit slow motion of the hit (rails bending and tearing, the car breaking at the bulkhead, the fireball) before the freeze. The rails are a deflection field (`bent-rail.tsx`), so the same barrier is drawn straight, bending or torn.
- art-direction · ART-16 · 2026-10-03 · the glove on the rail in the 28 s panel draws the people module's near arm twice: behind the rails with the flames over the shoulder, then again only in a window round the hand above the rail's top edge, so the hand comes out of the fire over the rail.
