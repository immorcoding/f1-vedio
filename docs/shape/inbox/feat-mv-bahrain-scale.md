# Shape inbox: feat/mv-bahrain-scale

- 2026-10-04 · art-direction · ART-16 (people at real proportions) was broken by code: the skeleton's head top stood at 1.70 m, not the 1.78 m its comment promised (ribcage frame too short, head centre too low), so every person read about 5 % small next to real-size cars and barriers. Fixed in `src/kit/people/skeleton.ts` (`BONES.chestY`, `BONES.headUp`). Proposed: a node check that asserts the upright stature (hip 0.92, shoulder 1.46, skull top 1.78) so this cannot drift again.
- 2026-10-04 · story-and-facts · The Bahrain T3 guardrail was modelled 1.29 m tall (chest height). The user corrected it to the real triple W-beam barrier, top edge about 1.05 m (FIA 3501-2017: 1.0–1.2 m). It now meets a 1.78 m person between hip and waist (59 % of stature).
