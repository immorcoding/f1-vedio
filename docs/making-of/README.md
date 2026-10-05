# Making-of: the sketchbook

English · [中文](README.zh-CN.md)

A small selection of the work-in-progress images we made along the way: prototypes, comparisons, analysis charts, rejected ideas. There are over two hundred sets in total, so these are the ones that best show how things got fixed step by step.

Each file is named after the branch it came from, and the part after `__` says what the image shows:
- `main` is the main branch;
- `prototype-*` are throwaway prototype branches;
- `feat-v2-*` are v2 work branches;
- `review-*` are review analyses.

There are no real photographs here. Comparisons that included reference photos were left out or had the photo cropped off; the [main README](../../README.md) explains why under "Copyright and assets".

## Day 1: choosing the look

| Image | What it shows |
|---|---|
| `prototype-styles__A-ink-watercolor.jpg` | Style A: ink and watercolour |
| `prototype-styles__B-manga.jpg` | Style B: Japanese racing manga, the one we chose |
| `prototype-styles__C-illustration.jpg` | Style C: polished illustration |
| `main__cars-2021-sheet.jpg` | The 2021 Mercedes and Red Bull, the quality bar for the whole film |

## Prototypes: when unsure, build it and compare

| Image | What it shows |
|---|---|
| `prototype-fire-styles__compare.jpg` | Four kinds of fire. We picked B (flowing, no outline) and used it for the whole film |
| `prototype-type-system__compare.jpg` | Four type systems. We picked D |
| `prototype-gold-accent__compare.jpg` | Gold on every points box? The answer: only on the title moments |
| `prototype-car-high-low__sheet.jpg` | The same car drawn two ways, for a high camera and a low camera |
| `prototype-credits-gag__mascot-A-vs-B.jpg` | Two mascots for the stinger. We picked B (Clawd) |

## Reviews: let scripts and a "judge" find the faults

| Image | What it shows |
|---|---|
| `review-1__grid-bars81-88.jpg` | First review's frame grid: the Abu Dhabi drop, cell by cell |
| `review-2__audio-wave.jpg` | Second review's waveform and per-bar loudness of the whole film |
| `feat-v2-engine-sfx__era-spectra.jpg` | Spectra of the four eras' engine sounds: V10, V12, V8, V6 turbo hybrid |

## Detours and fixes

| Image | What it shows |
|---|---|
| `feat-v2-far-side__true-perspective-rejected.jpg` | The car's far side computed with true perspective. Right in theory, wrong to the eye, so it was rejected |
| `feat-v2-car-high-low__sheet.jpg` | Every car after switching to separate high and low models |
| `feat-v2__far-wheels-before-after.jpg` | Far wheels pushed down by a third, before and after |
| `feat-v2__ground-shadow-ellipse.jpg` | The high-camera ground shadow turned into an ellipse |
| `feat-v2-bahrain-geometry__diagram.jpg` | The top-down world model of the Bahrain crash: 29° path, 22° yaw, 51° body angle. Every camera is derived from it |
| `feat-v2-bahrain-geometry__before-after.jpg` | The impact shot before and after the world model |
| `feat-v2-r2-bahrain33__impact-flash-strip.jpg` | 12 frames from contact. A shower of sparks became one big impact flash on the top layer |
| `feat-v2-r2-haze__moire-before-after.jpg` | Heat haze twisting the screentone into moiré (left); warping the grey first and re-screening after (right) |
| `feat-v2-r2-flicker__5.1c-before-after.jpg` | A background flickering like cuts (top); with motion blur (bottom) |
| `feat-v2-r2-grolegs__step-down.jpg` | Grosjean's legs knotted as he climbs out (left); stepping down one foot at a time (right) |
| `feat-v2-r2-stopwatch__gro-walks-out-of-fire.jpg` | The final fire scene: he walks out of the flames, which swallow the car behind him |
| `feat-v2-r2-stopwatch__stopwatch-11s.jpg` | The 27-second stopwatch stopped at 11 s: the medical car arrives |
| `feat-v2-r2-ghost__trophy-8.jpg` | Hamilton's missing eighth title, as the ghost of a trophy engraved "8" |
| `feat-v2-r2-tyres__new-softs-old-hards.jpg` | New softs against old hards |
| `feat-v2-rb18-ride__rb16b-vs-rb18.jpg` | The 2021 RB16B and the 2022 RB18 at the same scale |

## How the cars were traced, and how the perspective was worked out

Every car is traced from a licensed photo, in the photo's own pixel coordinates. The wheels come first: from the known tyre diameter and the wheelbase in the regulations, an angled photo can be rectified to a pure side view, which also gives the real dimensions.

The reference photos themselves are not in the repo, so only the traced lines and computed results are shown here.

| Image | What it shows |
|---|---|
| `feat-v2-rb18-standard__trace-lines.jpg` | The RB18's tracing: magenta for body and wings, cyan for the wheels (two near, two far), yellow for the helmet. Scaled to the 2022 maximum wheelbase of 3.6 m |
| `feat-v2-far-side__haas-camera-elevations.jpg` | The same Haas at different camera heights: wreck camera 20.9°, impact camera 18.4°, mid 8°, low 1°. The higher the camera, the more of the far wheels and endplates show |
| `feat-v2-far-side__camera-elevation-2021-vs-str3.jpg` | The 2021 cars at 1° and 4.3°, next to the approved STR3, with the noses at 3× on the right |
| `prototype-car-high-low__noses-3x.jpg` | Noses and front wings at 3×: A the original, B high camera, C low camera (the body re-projected for a 4° camera, so the nose drops onto the wing) |
| `prototype-car-high-low__in-context-low.jpg` | Back in the low tracking shot 5.1c: the original on the left, the new low-camera drawing on the right |
| `feat-v2-rear-wing-low__near-endplate-hides-far.jpg` | From a low camera, the near rear endplate should hide the far endplate and the wing planes (right: after the fix) |
| `feat-v2-rb18-ride__level-guides.jpg` | Horizontal guide lines checking that both wheels are level and how high the floor sits |

The perspective model at the time worked like this:
- A far part is a perspective copy of its near twin, pushed back by one track width.
- It is scaled by s = z/(z+W).
- It sits (1 − s)·(camera height − part height) above the near part.

Working backwards from the far wheels traced in each photo, the photos were taken from about 2° to 22° above (W12 about 17°, RB16B about 16°, VF-20 about 21°). The full derivation and the camera table for each photo are in [`far-side-perspective.md`](far-side-perspective.md), the working notes from that day.

The numbers were accurate, but on a car drawn as a flat side view they looked wrong. So we gave up computing perspective shot by shot and gave each car just two drawings, high and low, chosen by camera height. It's my favourite lesson from this project: **right maths doesn't mean a right picture.**

### When a car looks wrong, it usually isn't the perspective

Looking back, "the perspective looks off" was often planted at the tracing stage. Photos have all sorts of traps, and if one thing is traced wrong, no amount of maths fixes it later. The ones we fell into:

- **Lighting swallowed the shape.**
  - On the Haas VF-20's rear-wing endplate, the original photo was dark and the leading edge sat in shadow, so it got traced as a vertical plate. A second, evenly lit oblique photo, rectified to a side view using the known ellipse of the rear tyre's outer face, revealed the real forward-leaning edge.
  - We also first thought the endplate's outer face was red; it took five photos to be sure it was black.
- **Shadow taken for bodywork.**
  - The RB18's floor was first traced together with the black shadow beneath it, so the nose sat low, the tail high, and the car looked like it was tipping forward. Seen again on a brightened crop, the floor edge was level.
  - The same car's tyres had the same problem: the black tyre edge vanished against the dark body and shadow, the radius came out too small, and the wheelbase came out 8% longer than the regulations allow.
- **Reflections taken for livery.** A highlight along the RB18's sidepod got drawn as a white livery stripe, and a little red dot under the rear endplate, actually the rain light, got drawn in too.
- **Real details taken for flaws.** The steps on the W12's rear endplate looked like messy tracing, so I "helpfully" smoothed them out. The real car has exactly those steps. Lesson: when something looks like a flaw, check the photo first.
- **The photo looks down on the car.** Most reference photos were taken from 8°–22° above. That lifts parts on the centre line (nose, engine cover) by 0.2–0.3 m, and lifts the far wheels too. Traced as is and dropped into a low camera shot in the film, the nose floats and the front wing hovers. That's why we ended up with separate high and low car models.
- **The photo is at an angle.** Some photos are a few degrees, up to 40°, off side-on, with front and rear wheels of different sizes. Before tracing, two wheels are used for a homography to rectify it to a true side view (ART-35).

So we settled on a few habits, all recorded in `docs/shape/`:

- before delivery, overlay the tracing on the photo, and put the finished drawing next to the photo (ART-10);
- measure dark tyres and floors on a brightened, gridded crop;
- when the photo and the regulations disagree, trust the regulations;
- when one photo can't show a part clearly, use another.

## The stinger: one banner, six rounds

| Image | What it shows |
|---|---|
| `feat-v2-credits-gag__release-attempt-rejected.jpg` | Round 3: pulled on a rope, springing back when released. Still wrong; no rope pulls a cloth that straight |
| `feat-v2-credits-gag__unroll-beats.jpg` | The final version: two poles, the roll threaded on the right one, and Clawd carrying it and unrolling as it goes |
