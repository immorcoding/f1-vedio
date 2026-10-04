# Shape inbox: feat/mv-suzuka-retime

Lines for the area files, to merge on `main`.

## Signals

- motion-and-timing · MOT-4 · 2026-10-04 · the user approved moving a music hit to fix the picture's pacing: `suzuka1990.crash` moved from 27.1 to 28.1 (the generator reads `HITS` from `src/mv/timing.ts`, so the impact moved with it; there was no fill aimed at 27.1, and the beat-4 clap that led into 27.1 now leads into 28.1). MOT-4 says "画面时长从节拍表算，不反过来改音乐"; this is a deliberate, user-made exception. Candidate wording: "the picture never moves the music on its own; a hit only moves when the user approves it, and the score is regenerated in the same change".
- motion-and-timing · MOT-4 · 2026-10-04 · user feedback on Suzuka pacing: rushed between the two crashes and slow after the second. The new edit gives 1.4's result a third bar (two stamps two beats apart, 20.3 and 21.1, then a one-bar hold), and shortens 1.8 from 4 bars to 3 (30.2 cards, 30.4 / 31.2 stamps, 31.4 line). Candidate rule: "a result beat gets at least one beat per stamp and a hold of one bar at most; a held picture keeps moving (push-in that gathers pace to the cut, never an ease-out to a stop)".
- code · 2026-10-04 · the part bar ranges in `src/mv/edit-list.ts` changed (suzuka1989 9–21, suzuka1990 22–32). Its header says "To cut a part, edit only src/mv/parts/<part>/ — this file does not change"; a re-time that moves a part boundary has to edit it.
