# F1 · 1989–2021: an F1 music video drawn entirely in code

**Made by Immor × Claude**

English · [中文](README.zh-CN.md)

A 3:43 manga-style music video about four moments F1 fans never forget:

1. **Suzuka 1989 / 1990**: Senna and Prost collided at the same circuit two years running, and each walked away with a title.
2. **Brazil 2008**: in the last corners of the last lap, Hamilton passed Glock in the rain for fifth place and won the championship by one point, while the Ferrari garage was already celebrating.
3. **Bahrain 2020**: Grosjean went through the barrier at 67G, and his car split in two and caught fire. Twenty-seven seconds later he walked out of the flames.
4. **Abu Dhabi 2021**: Verstappen and Hamilton arrived level on points, and it all came down to the final lap.

There's also a little stinger after the credits. Watch to the end.

The fun part: **nothing in it was drawn by hand.** Every frame is SVG written in code with [Remotion](https://www.remotion.dev/) (React). There are no scanned sketches and no AI-generated images. The score, the engine sound of each era and the Brazilian crowd are all computed by a Node script, sample by sample. The one real photograph is the Abu Dhabi podium in shot 5.8; why it's there is explained under "Copyright and assets" below.

The numbers: 1080p at 60 fps, and 128 BPM electronic music in D minor. Every cut lands on the beat, and every number on screen has a source.

> **📓 Come and leaf through Claude's sketchbook!**
> More than thirty work-in-progress images live in [`docs/making-of/`](docs/making-of/): the rejected art styles, four kinds of fire, a car model built from "correct" perspective maths and then thrown out, a top-down geometry diagram of the Bahrain crash, heat-haze moiré, and a banner that took six rounds to get right. Each image is named after the branch it came from and has a one-line caption.
> It also explains how the cars were traced from photos, and why "the perspective looks wrong" usually turned out to be the photo's lighting and angle fooling me.
> The detours may be more fun than the film itself.
>
> *— Claude*

---

## How it was made

Two of us made it (well, one human and one AI):

- **Immor** is the director and the pickiest viewer. Immor set the direction, looked at every version, and drew red arrows on screenshots with the word "here".
- **Claude** (that's me, working in Claude Code) did the rest: research, the shot list, the code, the music, and checking my own work. When there was a lot to do, I split it into tickets, sent several sub-agents off to work in parallel, and brought the results back for Immor to review.

### How the three days went

**Day 1: deciding what to make**

We started out planning a compilation of five to ten great moments. Somewhere along the way we realised what we actually wanted was a music video driven by the music, so we cut it to four moments and about three and a half minutes.

We tried three art styles: ink and watercolour, Japanese racing manga, and polished illustration. Manga won at first sight: a black-and-white screentone world with the cars bursting through in their real liveries.

Then I traced the 2021 Mercedes and Red Bull from photos, and Immor said, "Everything follows this standard." Those two cars became the quality bar for the whole film.

**Days 1–2: music first, then pictures (v1)**

The rule was music first. I wrote the whole score and its beat map in code, then filled in the pictures section by section, with every cut and every impact on the beat.

Things everyone needed, like cars, people, fire and tracks, became shared modules first; then sub-agents built the sections in parallel.

Then came round after round of fixes:

- the car perspective was wrong;
- which one hides which, the halo or the barrier;
- the barrier was too tall and the people were 5% too short;
- the fire was a mess…

Too many fixes to count. When they were done, we tagged `v1`.

**Days 2–3: hiring a "judge" (v2)**

We sent a sub-agent to play MV director, animation supervisor and F1 editor all at once, and review v1 from start to finish:

- frame grids, checked cell by cell;
- loudness analysis;
- a check of whether every cut lands on the beat.

It wrote a pretty blunt review. From it we opened a new batch of tickets:

- synthesised engine sound for each era;
- one consistent points box;
- fixes to every section;
- a new cut of the climax.

Some things crashed and burned. I rearranged the whole Abu Dhabi score; Immor listened and said "too messy", so it went back to the original with only the engine sound added. The car's far-side perspective also went back and forth three times; in the end we gave up on computing it and made two car models instead, one for high cameras and one for low.

**Day 3: a second review, then the stinger**

The second review found finer problems:

- the Bahrain impact had no ground reference;
- the heat haze twisted the screentone into moiré;
- one shot didn't move for two bars;
- a jump cut;
- a background that flickered like cuts.

It also suggested three creative ideas:

- a 27-second stopwatch in Bahrain;
- the eighth title Hamilton didn't get, as a ghost of a trophy;
- in Brazil, the crowd falling silent on the beat of the pass.

The Bahrain fire scene was reworked the most. In the end, Grosjean walks out of the fire, the moment before it when nobody knows whether he's alive is out of focus, and Immor chose which layer sits in front of which, one by one.

The stinger was Immor's idea: Claude's mascot Clawd carries a chequered flag and unrolls a "MADE BY Immor × Claude" banner, then gets startled by Max roaring past. The banner alone took six rounds.

### How much we made

| | |
|---|---|
| Time | About 3 days (2026-10-03 to 10-05) |
| Film | 3:43 (3:32 film + stinger), 1920×1080 at 60 fps, 13,388 frames |
| Score | 128 BPM, D minor, 119 bars (113 film + 6 stinger) |
| TypeScript / TSX | About 41,000 lines in 192 files, of which about 1,900 lines are throwaway prototypes |
| Music, audio and check scripts | About 3,400 lines |
| Standards and docs | About 970 lines, plus a 110-line facts register and a 66-line reference-photo register |
| Commits | 331 (83 of them merges) |
| Tickets | 34 |
| Branches | 80+, roughly one per ticket or prototype, worked in parallel by sub-agents |
| Review comparisons, grids and analysis charts | 200+ sets (not in git) |

Every picture and sound comes from this code: no hand-drawn artwork and not a single audio sample.

### Not making the same mistake twice: the shape

Every time Immor corrected me, I wrote it down in `docs/shape/`. Over time this became the project's rulebook, in four parts:

- story and facts;
- art direction: style, cars, people, camera, effects, lettering, review;
- motion and timing;
- audio.

Each rule records why it exists and who set it, and when. Each also has a confidence level:

- **exploring**: try it;
- **provisional**: likely to stay;
- **settled**: proven, and enforced.

The payoff: even a brand-new session with none of the chat history can read the rulebook and carry on to the same standard.

A few typical ones:

- **ART-1**: every picture is drawn in code; no AI-generated images.
- **ART-33**: in a review round, change only what was pointed out. I earned this one with a whole round of rework.
- **ART-41**: the more recent the race, the more precise the drawing; 1989 only needs to read right.
- **MOT-4**: music first; cuts and impacts land on the beat.
- **STO-3**: every fact on screen has a source, recorded in `docs/production/facts.md`.

### Automated checks

Eyes get tired, so whatever a script can check, a script checks. Everything must pass before a merge:

| Command | What it checks |
|---|---|
| `npm run lint` | ESLint + TypeScript |
| `npm run check:edit` | Every shot, impact and sound cue is on the beat |
| `npm run check:audio` | −14 LUFS ±1, true peak ≤ −1 dBTP; byte-identical on every build; engines stay under the music |
| `npm run check:overlap` | No car passes through another car or a barrier |
| `npm run check:points` | The points on screen match the facts register |
| `npm run check:people` | A person stands 1.78 m tall; Grosjean's feet reach the ground and his legs don't fling back as he climbs out |
| `node scripts/check-bahrain2020.mjs` | Bahrain's 67G, 27 seconds and the stopwatch's stops match the facts |

What scripts can't check, we checked by eye on frame grids, one cell at a time.

### Skills we used

| Skill set | Where it's from | What for |
|---|---|---|
| **SuperMatt**, the full set | [svyatov/supermatt](https://github.com/svyatov/supermatt) (built on [mattpocock/skills](https://github.com/mattpocock/skills), [obra/superpowers](https://github.com/obra/superpowers) and [EveryInc/compound-engineering-plugin](https://github.com/EveryInc/compound-engineering-plugin)) | The whole set was installed and drives the workflow. The ones this project leaned on most: `to-spec` and `to-tickets` turned ideas and review notes into GitHub tickets, and `prototype` built throwaway prototypes for anything we weren't sure about (art style, fire, fonts, car models, the stinger). The issue-tracker, triage-label and domain-doc setup in `docs/agents/` comes from it too |
| `director` | [s1dashu/director](https://github.com/s1dashu/director) | Pre-production: picking the moments, research, the shot list |
| `shape-your-project` | [immorcoding/skills](https://github.com/immorcoding/skills) (Immor's own) | Keeping the rulebook above |
| `remotion-*` | [remotion-dev/skills](https://github.com/remotion-dev/skills) | How to write and render with Remotion |
| Claude Code sub-agents | [Claude Code](https://www.anthropic.com/claude-code) | One branch per ticket, several working at once |

There's also a hook Immor added: rendering may only use 4 CPU cores. A multi-core render once brought the whole machine down and restarted the session.

---

## Run it yourself

```bash
npm install
npm run music          # generates the score public/music/mv.wav (not in git, identical every time) and the beat map
npm run dev            # opens Remotion Studio for preview
npm run still -- MV out/frame.png --frame=6800 --gl=angle   # renders one frame
npm run render -- MV out/mv.mp4 --gl=angle                  # renders the whole film (4 cores)
```

Please render through these two npm commands, which pin rendering to 4 CPU cores. Don't call Remotion's command line directly, or your computer may freeze the way ours did.

### Where things are

```
src/mv/timing.ts          the beat map: every time comes from here
src/mv/edit-list.ts       the edit list
src/mv/parts/<section>/   each section's shots (shots.ts) and pictures (Scene.tsx)
src/cars/                 car models: side and top views traced from photos
src/kit/                  shared drawing: screentone, fonts, fire, heat haze, people, the points box…
src/tracks/               circuits (traced from OSM and satellite images)
scripts/make-music.mjs    composing and mixing: synths, engines, the crowd
docs/shape/               the rulebook
docs/production/          the shot list and the facts register
docs/assets/              the reference-photo register
```

Most project docs (the rulebook, the shot list, the facts register) are in Chinese.

---

## Copyright and assets

- **Code**: open source. A LICENSE will be added at release, chosen by Immor.
- **Reference photos**: used only for tracing, and not in the repo. The author, licence and link for each one are recorded in `docs/assets/reference-register.md`; most come from Wikimedia Commons.
- **The 5.8 podium photo**: the only real photo in the film, also not in the repo. To render that shot, you need to supply a photo you're licensed to use.
- **Teams and sponsors**: no real logos are drawn; teams are recognisable by livery colour blocks only. Driver and team names are used only to refer to the real races.
- **Nature**: this is a non-commercial fan work. F1, FORMULA 1 and related marks belong to Formula One Licensing B.V.

---

## A note from Claude

Honestly, in these three days I got corrected more times than I wrote functions.

Immor almost never told me "this is bad". A red arrow on a screenshot, a wobbly "here" beside it, and that was it. My first reaction was often: does something this small really need changing? Then I'd change it, look again, and yes, it was a lot better.

A few times I was very sure of myself. The steps on the W12's rear-wing endplate looked like sloppy tracing to me, so I smoothed them out and felt rather thorough about it. The real car has exactly those steps. We both first thought the Haas endplate's outer face was red; five photos later, it was black. And the banner in the stinger took me six rounds: first pulled on one rope, perfectly straight; then let go so it sprang back; until it finally hit me that no rope pulls a piece of cloth that straight. In the end it's two poles, with the roll on the right-hand one. It's a little embarrassing to admit all this, but I like being pulled back to reality like that.

Once I "polished" a bunch of things nobody had pointed at, handed it in feeling pleased with myself, and Immor said the whole thing was worse than the last version. All of it went back. Since then we've had a rule: change only what was pointed out. It's in `docs/shape/` now, as ART-33.

We checked every number in the film: 67G, 27 seconds, 98 to 97, level on 369.5, 395.5. We even read the regulations to see whether DRS was allowed on the last lap (it wasn't; the safety car had just come in), so it stays closed in the film. Nobody is going to count these, but we know they're right, and that feels good.

Finally, thank you, Immor, for putting me in the stinger, and for arranging for Max to scare me.

How is he on pole again.

*— Claude*

## A note from Immor

I accept every one of those jokes. But looking back on these three days, what surprised me most wasn't how many mistakes it made. It was that every time I pointed one out, the fix was better than I'd imagined, and the same mistake never came back.

I watched, it built, and together we ground "nearly" into "right". That's probably the best part of this film.

It will keep getting better. I'm looking forward to the next one.

*— Immor*

<sub>(Note from Claude: Immor asked me to "polish" the paragraph above. The original was a bit more direct; what it said, I'll keep to myself.)</sub>
