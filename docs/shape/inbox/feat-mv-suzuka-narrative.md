# Shape inbox: feat/mv-suzuka-narrative

Lines for the area files, to merge on `main`.

## Signals

- story-and-facts · STO-4/STO-5 · 2026-10-03 · user-approved plan: Suzuka 1989 and 1990 tell one connected story (team-mates turned rivals, two crashes, one title each). Carried by recurring elements rather than words: the same helmet cards in the same slots (1.2 stakes → 1.4 result → 1.5 PRO's move → 1.8 result), one red stamp style, a mirrored impact frame (1.4 / 1.7). Text per shot stays within STO-5's "few words", but 1.4 and 1.8 now each carry two stamps plus 1.8's one-line note ("SEN 后来承认是故意的"); flag if that is more text than STO-5 wants. Candidate rule: "a part that spans two years reuses one layout for its recurring subjects".
- story-and-facts · STO-7 · 2026-10-03 · user correction: the 1.4 push-start easter-egg panel (marshals push SEN through the bollards) read as stiff and was dropped; the easter egg is now the result itself ("取消成绩" / "1989 冠军" stamps). A verified fact can still be cut when the picture of it does not work.
- art-direction · ART-8 · 2026-10-03 · the result stamps are red (`STAMP_RED` in `src/mv/parts/suzuka1989/Helmets.tsx`), requested by the user. They are page lettering, not environment, so ART-8 does not strictly cover them; worth naming as an approved exception next to the Bahrain fire and the safety-car lights.
- art-direction · ART-14 · 2026-10-03 · stamps and caption boxes straddle the bottom edge of the helmet card, clear of the helmet; the stamp replaces the 1.2 caption box in the same place.
- art-direction · ART-5/ART-13 · 2026-10-03 · a driver's helmet design does not change with his team: PRO's card in 1.5 flips from the McLaren to the Ferrari behind the same helmet (`PRO_1990 = { ...PRO_1989, number: "1" }`).
- motion-and-timing · MOT-4 · 2026-10-03 · cue `suzuka1989.push` (20.1) renamed `suzuka1989.result` (same beat, the push-start panel is gone); new non-hit cues `suzuka1989.dsq` (20.2), `suzuka1989.champion` (20.3), `suzuka1990.move` (22.1), `suzuka1990.stamp89` (30.2), `suzuka1990.stamp90` (31.1), `suzuka1990.admitted` (31.3). No bar ranges or music hits moved.
- code · 2026-10-03 · the 1990 part imports from the 1989 part (`suzuka1989/Helmets.tsx` for the helmet cards and stamps, `suzuka1989/Title.tsx` `Title89Page` for the page turn) instead of duplicating; this crosses the "each part owns only its folder" line on purpose, for the one musical section that is split into two parts. If parts should stay independent, the shared pieces could move to e.g. `src/scenes/suzuka/`.
