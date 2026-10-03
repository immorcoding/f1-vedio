# Shape inbox: feat/mv-bahrain2020 (ticket #9)

Lines for the area files, to merge on `main`.

## Signals

- art-direction · ART-10 · 2026-10-03 · the 2020 test photos are not square to the car (yaw and roll); a homography from the two Pirelli sidewall bands (both wheel centres level, one scale) rectified them before tracing. Worth keeping for any later trace from a slightly angled photo.
- art-direction · ART-8 · 2026-10-03 · the fire's palette is one parameter (`FirePalette` in `src/kit/fire.tsx`; `FIRE_PALETTE` in the part). Black and white and colour were rendered for review; the user approved colour. Only the big fire behind the cell throws coloured light; light from fires in front of the car washed it out and was dropped.
- art-direction · ART-16 · 2026-10-03 · people are a shared module, `src/kit/figure.tsx`: posed by joint angles, walk cycle after Muybridge's walking plates, outfit as data (suit, shade, seams, side band, gloves, boots, helmet or hood), optional firelight rim. No public-domain photo of GRO, the FIA doctor or a Bahrain marshal could be found, so their equipment is drawn from the 2020 helmet photo and general knowledge, not traced.
- art-direction · ART-8 · 2026-10-03 · the marshal's orange overalls are drawn as a mid grey (environment stays black and white); flag it if marshals should get the ART-8 colour exception too.
- story-and-facts · STO-3 · 2026-10-03 · scene geometry (29° into the triple guardrail, contact right-rear on left-front at 241 km/h, cell through the middle rail) and the easter eggs (Ian Roberts, the marshal with dry powder, the scorched intact halo) are registered in facts.md from the FIA investigation summary; `scripts/check-bahrain2020.mjs` checks that the 67G and 28 秒 on screen match the register.
- motion-and-timing · MOT-2 · 2026-10-03 · the top-view crash map is a schematic straight (track 15 m wide, run-off, barrier at 17 m from the centre line), not a survey of the real run-off; the circuit map in 3.1 is the real centre line.

## Proposed

- art-direction · treat a person's firelight rim as light, like the start lights' glow (intro inbox): coloured rim only when the fire is coloured.
