# Shape inbox: feat/mv-outro

## Signals

- 2026-10-04 · story-and-facts · STO-7 · the outro's egg (VER's number turns from 33 to 1) was verified before use and registered in `facts.md` (Wikipedia, List of Formula One driver numbers: #1 from 2022 to 2025, #33 from 2015 to 2021). Because it is drawn on the 2021 car, the year caption turns from 2021 to 2022 on the same beat, so the picture does not claim he raced as #1 in 2021.
- 2026-10-04 · story-and-facts · STO-5 · new on-screen text in the outro: year captions (1989 · 1990, 2008, 2020, 2021 → 2022), the 2.7 score box reused (98 · 97, HAM / MAS), nine three-letter codes and the closing title `F1 · 1989–2021`. All English, all in the type D roles.
- 2026-10-04 · art-direction · ART-5 / ART-13 · the family photo (6.3) and the 1989/90 clash panel draw helmets on their own, without a car. They reuse the cars' own helmet renderer through a new `DriverHelmet` export in `src/cars/MangaCar.tsx` (same shell, design and dot shading; scaled from the 44 px trace radius so line weights match), so each driver's helmet is the one on their car. HAM appears in 2008 and 2021; the line-up uses his 2008 helmet (the yellow one of his first title, as in 2.7).
- 2026-10-04 · art-direction · ART-6 · the closing title uses `TitleText` ("F1 ·" solid, "1989–2021" in outline, the split falls on the last space) with the chequered strip of `CircuitTag` and no circuit name; the driver codes sit in ink chips with paper Titillium Bold, like the stakes chip of 1.2.
- 2026-10-04 · art-direction · ART-8 · the 2020 flashback panel reuses 3.6's halo shot as it is, so its fire keeps the approved colour exception inside the panel.
- 2026-10-04 · motion-and-timing · MOT-4 · the outro has no music hits of its own; its cues follow the existing score (the kick pumps the flag on every beat of bars 1–2, the two intro pings at outro 5.3 and 7.3 get a glint, the pad dies out under the fade). All outro positions are relative to the outro section's first bar (read from `SECTIONS` in timing.ts), and 5.8's slams now read their bar from the shot instead of the fixed `at(103, …)`, so the planned extra Bahrain bar moves both without edits.
- 2026-10-04 · art-direction · ART-14 · 5.8's radio line moved up about 175 px and a little left, centred in the dark area right of the trophy (block middle at y ≈ 560); it clears the trophy, the face and the bottom frame.

## Shared files touched

- `src/cars/MangaCar.tsx`, `src/cars/index.ts`: additive `DriverHelmet` export; the cars render exactly as before (the internal `Helmet` only had its prop type narrowed).
- `src/mv/parts/brazil2008/Champion.tsx`: `ScoreBox`, `SCORE_W`, `SCORE_H` exported for the 2008 flashback; no change to 2.7.
