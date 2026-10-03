# Shape inbox: fix/endplates-suspension (shared-layer fix, spec #2)

Lines for the area files, to merge on `main` once the user approves the new candidates.

## Signals

- art-direction · ART-17 · 2026-10-03 · user decision: ART-17 covers the settled 2021 cars too. W12 and RB16B now draw both far endplates (front and rear) as the near one's perspective copy (`farFrom`); the traced `frontWing.far` and the free `wingLivery` field are gone, so every endplate colour block lives in its wing's `livery` and lands on both endplates. The W12's red far front-endplate top is dropped: the near (outer) face in the photo is black.
- art-direction · ART-17 · 2026-10-03 · rear wings of all ten cars: the far rear endplate (copy of the near one) is drawn behind the rear wing's `top`, the way the far front endplate sits behind the deck (ART-12). `top` now traces only the wing elements seen from above; it no longer doubles as a far endplate of its own shape. `top` is optional (the MP4-23 photo sees the wing edge-on).
- art-direction · ART-15 · 2026-10-03 · user decision: top-view suspension arms are one ink line 0.04 m wide (a faired wishbone) plus 1.5 screen px, the same on every car, drawn over the floor and sidepods and under the tub, cover and tyres, so they read at the sheet and map scales.

## Proposed

- art-direction · ART-7 · the settled references `cars-2021-sheet.png` and `style-b-manga-v2.png` (and a top-view reference, if wanted) are replaced by `out/review/15-cand-cars-2021-sheet.png` / `15-cand-abudhabi-t5.png` / `15-cand-cars-2021-top-sheet.png` once the user approves them.
- art-direction · ART-15 · add to the rule: suspension arms are about 0.04 m wide plus a constant ink edge, alike on every car.
