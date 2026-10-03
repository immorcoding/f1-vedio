# Shape inbox: feat/mv-suzuka1990 (ticket #7)

Lines for the area files, to merge on `main`.

## Signals

- art-direction · ART-10 · 2026-10-03 · the Ferrari 641 was traced from a panning shot at Goodwood (a distant camera, so little perspective): mirrored, levelled on the two tyre contact points, scaled by the wheelbase; the tyres then came out at the real 1990 Goodyear sizes, a free check of the scale. The photo's far rear endplate sat 75 px off the near one (yaw/perspective); the user's wing rule (far endplate a sliver at most) overrides the photo there.
- art-direction · ART-5 · 2026-10-03 · the user approved the plain yellow block at the top of the 641's rear endplates (the Agip sticker as a colour block, no lettering). Precedent for other sponsor-coloured blocks that identify a car.
- art-direction · ART-12 · 2026-10-03 · the 641's front wing is bare black carbon flap included (no accent colour), as on the real car — the "accent colour as on the real car" clause allows a wing with no contrasting flap.
- art-direction · ART-18 · 2026-10-03 · 1.6 (top view) and 1.7 (side-on crash, staged in world metres) register with `src/mv/top-views.ts`; the run to Turn 1 keeps ≥ 0.34 m between SEN and PRO, the crash touches tyre to tyre on 27.1 and the cars part within 40 frames.
- art-direction · ART-9 · 2026-10-03 · the crash panel's camera dollies after the cars as they slide away from it (every depth less camZ), so they stay a readable size; the skid marks are re-projected from the world path each frame.
- story-and-facts · STO-7 · 2026-10-03 · the dirty-side pole is shown without text: dust tone and grit on the right lane of the grid vs a dark rubbered racing line on the left. The pit-exit line on the right (which the FIA told drivers not to cross) is drawn as a white line, not yellow (ART-8: environment black and white).

## Proposed

- story-and-facts · the shot 1.8 text "89 PRO · 90 SEN" uses Latin letters; STO-5 asks for Chinese manga lettering with three-letter driver codes. It is drawn in the driver-tag style (Arial Black italic) rather than the brush font, which has no matching Latin glyphs.
