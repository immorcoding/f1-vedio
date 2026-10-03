# Shape inbox: feat/mv-tracer-4 (ticket #4)

Lines for the area files, to merge on `main`.

## Signals

- motion-and-timing · MOT-4 · 2026-10-03 · decided the frame rounding rule: `frame = floor(seconds × 60 + 0.5)` in `src/mv/timing.ts` (`toFrame`), used by the music script, the composition and both checks. 1 bar = 112.5 frames, so every odd bar line shows half a frame (8.3 ms) after the beat, never before. Durations are differences of rounded positions, so shots tile with no drift.
- motion-and-timing · MOT-4 · 2026-10-03 · the edit list is split by ticket, not by music section: `src/mv/edit-list.ts` fixes each part's bars (Suzuka is one music section, two parts); a part edits only `src/mv/parts/<part>/`. Music hits are named `<part>.<event>` in `HITS`, and a cut part must put a cue with that id on that beat (`npm run check:edit`).
- story-and-facts · treatment 0.3 · 2026-10-03 · shot 0.3 (bar 9, lights out) is modelled as the cut at 9.1 with the `intro.lightsOut` cue on it, not as its own shot, because bar 9 belongs to Suzuka shot 1.1. The lights going out is the cut into Suzuka.
- art-direction · ART-8 · 2026-10-03 · the start lights' red is drawn as the real LED red (flat colour block, white-hot core, dark-red screentone) plus a soft red glow spilling onto the black-and-white gantry. The glow is light, not paint; flag it if it reads as breaking ART-8.
- art-direction · ART-4 · 2026-10-03 · start-light gantry drawn from the FIA driver-view diagram and a 2012 Sepang grid photo (registered); 5 hanging columns × 4 lamps (amber, green, red, red), one "light" = a column's red pair.

## Proposed

- audio · **AUD-4** (proposed, provisional) · the score is mastered to −14 LUFS integrated (accepted range −15…−13) with true peak ≤ −1 dBTP, 48 kHz 16-bit stereo, exactly 112 bars; `npm run check:audio` enforces it. _Why:_ spec #2 asks for "响度在约定范围" without a number; −14 LUFS is the common streaming target, and true peak (not only sample peak) keeps the AAC in the render from clipping.
- audio · **AUD-5** (proposed, provisional) · the score WAV is generated, not committed: `npm run music` rebuilds it byte-identically (checked), and only `public/music/beat-map.json` is committed. _Why:_ the WAV is 40 MB per revision; determinism makes it reproducible.
