# Shape inbox: feat/mv-brazil-champion

## Signals

- 2026-10-04 · story-and-facts · STO-5 / STO-8 · 2.7 now carries English title lettering ("LEWIS HAMILTON / 2008 / WORLD / CHAMPION") like 5.8, but as facts, not a quote (5.8's team-radio line stays the film's only real quote). STO-5 says on-screen text is a few Chinese manga words plus three-letter codes; the champion cards are a second exception to it, worth writing into STO-5.
- 2026-10-04 · art-direction · ART-8 · the lettering uses paper, ink and gold only (gold under-stroke on the big words, gold sparkles); gold is a page/lettering colour like the red result stamps, not an environment colour. The helmet is the only livery colour on the page.
- 2026-10-04 · art-direction · ART-13 / ART-14 · a helmet close-up must be drawn alone (`src/mv/parts/brazil2008/HelmetCloseup.tsx`, from the car's `driver.helmet` data), not cut from the whole car: the prototype's crop carried cockpit bodywork clutter. It lives in the Brazil part for now; if another part needs a helmet close-up it should move to `src/kit/` or `src/cars/`.
- 2026-10-04 · motion-and-timing · MOT · a held title card pushes in per panel (each panel scales on its own subject) rather than pushing the whole page, so lettering near the frame edge is never cropped by the push.

## Proposed

- STO-5: allow a champion card's English title lettering (name / year / WORLD CHAMPION) as a standing exception.
- Move `HelmetCloseup` to a shared module if the Suzuka helmet cards are ever redrawn as helmet-only close-ups.
