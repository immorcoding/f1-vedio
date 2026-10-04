# Shape inbox: feat/mv-type-d

## Signals

- 2026-10-04 · story · STO-5 (all English, minimal) decided every on-screen string; the translation table `out/prototype/type-system/translations.md` (English column) plus the lead's picks (BRAZIL 2008, CHICANE, LAST LAP, LAP 58, 0s/11s/27s, SKRRT!/CRASH!/BANG!/WHOOSH!, SCREECH/VROOOM!). Two strings had no row and were decided here: the 5.3 caption "第 58 圈，T5 发卡弯。" became "LAP 58 · TURN 5", and the Library review sheets' Chinese labels were translated too (they are review stills, not film, but the brush font that drew them is gone).
- 2026-10-04 · art-direction · ART-6 (type system D) decided the kit: `src/kit/lettering.tsx` now holds one component per role — `TitleText` (Big Shoulders Black, leaned 8°, year in outline), `BigText` (numerals), `Caption` (Titillium Web 700 in a paper box with a hard ink drop shadow, hugging its text), `Sfx` (Bangers, ink with a paper halo, jittered letters), `RubberStamp` (Saira Stencil Bold, red double-ruled box; ART-8's red exception). Ma Shan Zheng and ZCOOL KuaiLe are no longer loaded by production code (`src/prototype/` still imports them).
- 2026-10-04 · art-direction · User addition via the lead: every title card gets a short chequered strip and the circuit's full name (Titillium 600, letter-spaced caps) under the title, wiping in then typing on (`CircuitTag`). Suzuka 1989 keeps "TEAM-MATES · RIVALS" below it; the 1989 title moved up (baseline 610 → 430) so title, strip, name and story line all sit above the chicane callout.
- 2026-10-04 · art-direction · For one family across the film, the remaining Arial Black lettering also moved to D: champion cards (2.7, 5.8) and the points (4.2/5.7) to Big Shoulders Black; driver/position tags, turn labels (T5, Junção, map labels) and the 2.7 score names to Titillium Web Bold. Big Shoulders is narrower than Arial Black, so the champion-card lines are no longer stretched with `textLength`; each line is sized to the column with a cap-height ceiling. The car numbers drawn on the liveries (`MangaCar`) stay Arial Black: they are livery, not lettering.
- 2026-10-04 · art-direction · "27s" in 3.6 was a brush SFX; it is now Titillium Bold with a paper halo so it matches 3.5's time boxes (lead: Titillium, lowercase s). Bangers would render it "27S".

## Proposed

- **ART-6 addendum** · provisional · 标题卡统一格式：标题（地点 + 年份）下一条方格旗短条（两行方格），再下一行赛道全名，用 Titillium Web 600 宽字距大写；方格条先从左往右划入，赛道名随后逐字打出。_Why:_ 用户 2026-10-04 通过主管要求给每张标题卡加上。
