# Shape inbox: feat/people-2 (shared people module, spec #2)

## Signals

- 2026-10-03 · ART-16 decided the module's shape: one renderer (`src/kit/figure.tsx`) for every person, poses and
  gaits in `src/kit/people/*.ts` (no React, node-loadable), outfits as data. The user approved the style
  ("相当不错，沿用这个风格再打磨打磨") and asked for hands with fingers and thumb (no mittens), looser F1 overalls,
  a less stiff stand, a better wave, cheering arms that leave the head clear, and collar / zip / shoulder seams on
  close-ups. Open-face helmets and caps without features are accepted (ART-5).
- 2026-10-03 · ART-11 shaped the hand and suit detail: finger/knuckle strokes, zip and seams only from 150 px/m up,
  so group shots (≈104 px/m) keep just the silhouette and the thumb.
- 2026-10-03 · MOT-5 applied to people: gaits are functions of distance walked and callers move the ground point by
  the same distance; Bahrain 3.6 and Suzuka 1989 1.4 were migrated to this (the old 1.4 marshals slid in a frozen
  pose after the engine fired). Checked numerically for 3.6: worst flat-foot slide 1.4 mm.
- 2026-10-03 · ART-18 for people: interpenetration in group shots is kept out by spacing (≈0.9 m in the Brazil
  garage, the jumper at the end of the line); people in real contact (doctor's hand on GRO, the hug, the high five)
  are drawn in passes (`parts`) so arms wrap correctly. `check:overlap` still only sees footprints, not arms.

## Proposed

- ART-16 could record the hand rule: "hands are drawn as palm-and-fingers with a separate thumb; at close-up size
  one or two strokes between the fingers; never a mitten" (user correction 2026-10-03).
