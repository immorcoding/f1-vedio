# Shape inbox: feat/mv-outro

## Signals

- 2026-10-04 · story-and-facts · STO-7 · the outro's egg (VER's number turns from 33 to 1) was verified before use and registered in `facts.md` (Wikipedia, List of Formula One driver numbers: #1 from 2022 to 2025, #33 from 2015 to 2021). Because it is drawn on the 2021 car, the year caption turns from 2021 to 2022 on the same beat, so the picture does not claim he raced as #1 in 2021.
- 2026-10-04 · story-and-facts · STO-5 · new on-screen text in the outro: year captions (1989 · 1990, 2008, 2020, 2021 → 2022), the 2.7 score box reused (98 · 97, HAM / MAS) and the closing title `F1 · 1989–2021`. All English, all in the type D roles.
- 2026-10-04 · art-direction · ART-5 / ART-13 · the 1989/90 clash panel draws two helmets without a car, through a new `DriverHelmet` export in `src/cars/MangaCar.tsx` (the cars' own helmet renderer, scaled from the 44 px trace radius so line weights match).
- 2026-10-04 · story-and-facts · user correction via the lead: the helmet "family photo" planned for 6.3 was dropped for a bookend to the intro — the intro's start-light gantry, five lights on in bar 7, lights out on bar 8 beat 1, the title under the dark gantry. The intro's gantry art is now an exported `GantryArt` (+ `gantryCamera`) in `parts/intro/Scene.tsx`; the intro renders pixel-identical (checked at song frames 250 and 890).
- 2026-10-04 · art-direction · ART-6 · the closing title uses `TitleText` ("F1 ·" solid, "1989–2021" in outline) in paper on the black page, with the chequered strip of `CircuitTag` and no circuit name.
- 2026-10-04 · art-direction · ART-8 / ART-10 · user correction via the lead: the painted numbers of the RB16B (#33) and the STR3 (#15) sat in the wrong place. Checked against the photos: the RB16B's 33 is red, larger (caps 53 px in the trace photo) and lower on the engine cover; VET's 15 is red on top of the STR3's nose, 0.46 tyre diameters behind the front axle (2008 Singapore photo), so from the side it is a thin foreshortened strip. `numberAt` gained optional `color`, `angle` and `squash`; the other cars are unchanged. Proposal: check every car's number against its photo the same way (several are still the default paper-on-ink at a guessed spot).
- 2026-10-04 · art-direction · ART-8 · the 2020 flashback panel reuses 3.6's halo shot as it is, so its fire keeps the approved colour exception inside the panel.
- 2026-10-04 · motion-and-timing · MOT-4 · the outro has no music hits of its own; its cues follow the existing score (the kick pumps the flag on every beat of bars 1–2, the ping at outro 5.3 gets a glint on the halo, the five lights of bar 7 mirror the intro's, the pad dies out under the fade). The fifth light falls on the second half of beat 4, off the beat grid, so it is not a cue; it is placed half a beat after `outro.light4`. All outro positions are relative to the outro section's first bar (read from `SECTIONS` in timing.ts), and 5.8's slams now read their bar from the shot instead of the fixed `at(103, …)`, so the planned extra Bahrain bar moves both without edits.
- 2026-10-04 · art-direction · ART-14 · 5.8's radio line moved up about 175 px and a little left, centred in the dark area right of the trophy (block middle at y ≈ 560); it clears the trophy, the face and the bottom frame.

## Shared files touched

- `src/cars/MangaCar.tsx`, `src/cars/index.ts`, `src/cars/spec.ts`: additive `DriverHelmet` export; `numberAt` `color` / `angle` / `squash`.
- `src/cars/cars-2021.ts`, `src/cars/cars-2008.ts`: RB16B and STR3 number positions.
- `src/mv/parts/intro/Scene.tsx`: gantry art split out and exported, intro output unchanged.
- `src/mv/parts/brazil2008/Champion.tsx`: `ScoreBox`, `SCORE_W`, `SCORE_H` exported for the 2008 flashback; no change to 2.7.
