# formula-one

手绘风 F1 比赛名场面合集视频，用 Remotion 制作（1920×1080，60 fps）。

- 预览：`npm run dev`；检查：`npm run lint`
- 渲染只能用 `npm run render` / `npm run still`：这两个命令把渲染限制在 8 个 CPU 核上，不要直接调用 `npx remotion render`。
- `src/prototype/` 是一次性原型代码，画风定稿以后会移走。

## Project shape

Current standards, one file per area. Before work that touches an area, read its file and raise any Proposed items with the user.
Levels: **exploring** is a bet (follow it, note friction); **provisional** is likely to hold (ask before breaking it); **settled** is proven (enforced).
Add a dated line to the area's Signals when a rule decides part of your change, gets in your way or is broken by code, and when the user corrects you. Decisions that should bind the project go through the `shape-your-project` skill.
Area files change only on `main` (the writer branch); on any other branch, write those lines and any drafts to `docs/shape/inbox/<branch>.md` instead.

- [Story & facts](docs/shape/story-and-facts.md): 名场面合集、中文、事实必须核实
- [Art direction](docs/shape/art-direction.md): 代码绘制的黑白漫画风，颜色只给配色和胎圈
- [Motion & timing](docs/shape/motion-and-timing.md): 1080p60，俯视加特写的混合视角

## Agent skills

### Issue tracker

Issues and specs live in GitHub Issues on immorcoding/f1-vedio, via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

The five default triage labels: needs-triage, needs-info, ready-for-agent, ready-for-human, wontfix. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `CONTEXT.md` and `docs/adr/` at the repo root, created as needed. See `docs/agents/domain.md`.
