# Shape inbox: feat/mv-suzuka1989 (#6)

Lines for the area files, to merge on `main`.

## Signals

- art-direction · ART-4/ART-10 · 2026-10-03 · Commons had no usable side-on MP4/5; the trace source is a Flickr CC BY 2.0 museum photo of the MP4/5B, rectified to a true side view with a homography fitted to the near tyres (top and bottom of each, at the real wheelbase and tyre sizes). Rectifying an off-axis photo on the wheels is a cheap way to get a usable trace from near-side-on photos; worth noting in ART-10's _Check_.
- art-direction · ART-17 · 2026-10-03 · user correction on the MP4/5: a far endplate drawn as a visibly offset copy reads as a second slab. The near endplate is one plate following the photo; the far one sits almost wholly behind it (a sliver at most); the wing elements show as a profile band at the top. Applied in `cars-1989.ts` through `farFrom`.
- art-direction · ART-8 · 2026-10-03 · user correction: livery colour boundaries follow the body's curves (the MP4/5 red sweeps up diagonally from the rear wheel), no right-angle blocks; the lower sidepod is white with only a shadow band at the floor, not a black block.
- story-and-facts · STO-5 · 2026-10-03 · shots 1.3 uses "SEN"/"PRO" tags on the wide top view (fade before the cars close up), and the easter-egg panel in 1.4 has one extra sound effect "轰！" when the engine fires. Flag if that is more text than STO-5 wants.
- motion-and-timing · MOT-4 · 2026-10-03 · the part adds two non-hit cues: `suzuka1989.helmets` (13.1, the helmet panels drop in) and `suzuka1989.push` (20.1, the easter-egg panel).
- art-direction · ART-18 · 2026-10-03 · added the automatic check ART-18's _Check_ names: `npm run check:overlap` (`src/mv/overlap.ts`, registry `src/mv/top-views.ts`). A part registers a `TopViewSampler` per shot: car footprints (true length × width × the drawn scale) per song frame, plus contact windows where touching is allowed (with a maximum depth, so cars may touch but not pass through). Side-on panels staged in world metres register the same plan (x along the track, z as y). It caught the 1.3 zoom: cars drawn 5× life size on the wide map overlapped while 24 m apart in reality — enlarged cars need their gaps scaled too.
- motion-and-timing · ART-18 · 2026-10-03 · frame-grid QA: exact frames every 24 frames via one ffmpeg seek per frame (the bundled Remotion ffmpeg has no select/scale filters, and `-r` resampling mislabels frames).
