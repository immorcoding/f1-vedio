# Shape inbox: feat/v2-r2-crowd (#33, Brazil crowd A/B)

## Audio

- 2026-10-05 · decided · AUD-1 · The grandstand crowd is synthesised only (`scripts/lib/crowd.mjs`: filtered noise bed plus 64 detuned glottal-pulse voices through vowel formants and a short comb reverb); no samples.
- 2026-10-05 · decided · AUD-7 · The crowd is not an engine cue, so it does not live in `src/mv/sfx.ts`; it has its own bus in `make-music.mjs` after the engines (their levels stay byte-identical) and is set against the music per bar like them, but further down: 26 dB under at bar 39 rising to 18 dB under at bar 46, cut dead on 47.1. `check:audio` checks it at ≥ 14 dB under (AUD-7's engine level) and silent from 47.1 when it is on.
- 2026-10-05 · friction · AUD-5 · The crowd is behind a switch (`CROWD_DEFAULT` in `make-music.mjs`, or `MV_CROWD=1`), default OFF until the user picks from the A/B. `check:audio` rebuilds with the same environment, so it has to run with the same `MV_CROWD` as `npm run music`, or the determinism check fails.
- Proposed (if the user picks B): an AUD-8 sfx rule: "Brazil carries a synthesised grandstand crowd from 39.1, under the music by ≥ 18 dB, cut on 47.1 so the pass lands in silence", and `CROWD_DEFAULT = true`.
