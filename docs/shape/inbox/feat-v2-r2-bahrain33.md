# Shape inbox · feat/v2-r2-bahrain33

Signals from issue #26 (review-2 #1, Bahrain 3.3 ground and sparks). Drain into the area files on `main`.

## art-direction.camera.md

- 2026-10-05 · cite · ART-39 · 3.3's ground comes from the top-view model (`src/mv/parts/bahrain2020/ground.ts`): the run-off is 3.2's (`PLAN_32.barrierY − TRACK_HALF` ≈ 7.6 m), so the track's white edge line and the barrier's foot run to one vanishing point, while the tyre marks along the 29° path run to another, and the car is square to the camera. The 51° then reads from the picture. The geometry diagram shows the edge line, the four tyre lines and the scrape stretch.
- 2026-10-05 · friction · ART-39 · The side-view sprite stands its near wheels at the car's depth (`CELL_Z`), which is the model's centre line, so it is drawn about 0.8 m deeper than the model car. The high far wheels sit about 1.55 m behind the near wheels on screen, which is close to the true 1.6 m track. 3.3's tyre marks start under the tyres as drawn (back-projected from the sprite), not at the model's wheel positions. Their direction (the 29° vanishing point) comes from the model.
- 2026-10-05 · cite · ART-33 · Only 3.3's slow motion changed: the ground and the sparks. The freeze (paper, focus lines, 67G), the white flash on the contact frame, the carbon flecks, the camera, the cut from 3.2 and the cut to 3.4 are as before. The run-off's tone went from dark to 3.2's mid tone (the track is light, and the ground behind the barrier stays dark) so the tyre marks and the edge line show. This is a look change the user may want to review.
- 2026-10-05 · correction · ART-33 · User review of #26 approved the direction and asked for the run-off one step darker: it is now a dot screen between dark and mid (r 2.25 on the 7 px screen), not 3.2's mid tone.
- 2026-10-05 · correction · new · Third time for "the barrier is not fully drawn": 3.3's rails stopped 45 m up the run, where the shared model's `RUN` starts, which left a visible end short of the vanishing point. 3.3 now draws the barrier on to 1.5 km (`ground.ts BARRIER_FAR_X`). Candidate rule: every shot's barrier, fence or wall runs to the frame edge or to its vanishing point, and a frame sweep over the whole shot (freeze included) checks it.
- 2026-10-05 · cite · ART-31 · 3.3's surroundings come from the 2017 SkySat image (crash side = the infield: a 5 m paved strip, then sand with small trees every 15–20 m), placed on a jittered grid at the measured density, not tree by tree. The grandstands in `floodlit-night.tsx` stand where the image shows desert (an existing liberty, left alone, now noted in facts.md).

## art-direction.effects.md

- 2026-10-05 · cite · new · Sparks are 3-D streaks in the world, projected through the shot's camera. They come off where the car's far side scrapes the rails (`scrapeAt`: from the right front-wing corner on the contact frame, then on along the barrier at about 0.48 m per metre of travel). They are thrown on along the rails in the direction of the slide and glance a little toward the track and upward. Each spark stays behind the car until it is 2.6 m nearer the camera than the car, so sparks never cover the car's near side.
