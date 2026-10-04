# Story & facts

讲什么、怎么讲、怎么保证准确：片子的定位、名场面清单、画面文字、事实核查。

Next id: STO-9

## Pillars

- 这是一支 F1 比赛名场面的手绘 MV，由音乐驱动，不是故事片，也不是 F1 科普。
- 每个呈现出来的事实都经得起查证。

## Rules

- **STO-4** · provisional · 成片是 3–3.5 分钟的 MV，复刻 4 个名场面，按时间顺序：1989/1990 铃鹿 → 2008 巴西 → 2020 巴林 → 2021 阿布扎比（高潮）；每个名场面占一个音乐段落。_Why:_ 用户 2026-10-03 定位为"5 分钟以内的短片，类似 MV，不是故事片"，并选了这个篇幅和顺序。
- **STO-5** · provisional · 没有旁白。画面文字只用少量中文漫画文字：每个名场面一张标题卡（年份 + 大奖赛），拟声字，以及极短的关键信息（如"LAP 58"）；车手用三字母缩写（VER、HAM）。_Why:_ 用户 2026-10-03 选了"只留少量漫画文字"。
- **STO-7** · provisional · 可以加入让车迷会心一笑的彩蛋，但每个彩蛋都必须是核实过的真实细节（登记在 `docs/production/facts.md`），不放人物原话（唯一例外见 STO-8）。当前彩蛋清单见 `docs/production/mv-treatment.md`。_Why:_ 用户 2026-10-03 要求"适当增加让车迷惊喜的细节"，并选定了五组彩蛋。
- **STO-8** · provisional · 阿布扎比 5.7 的夺冠照片卡（ART-19）引用红牛车队无线电原话"Max Verstappen, you are the world champion"（冲线后 Horner 所说），画面上不加出处小字；这是全片唯一一句人物原话，措辞以已核实的来源为准，登记在 `facts.md`。_Why:_ 用户 2026-10-03 要求在夺冠卡上放这句话，并去掉了出处小字（"没有必要"）。_Source:_ [formula1.com：Say what, Abu Dhabi 2021 team radio](https://www.formula1.com/en/latest/article/say-what-enjoy-the-best-team-radio-from-the-abu-dhabi-season-finale.1pUHfdFT1FyhoP7J07jLy9)
- **STO-3** · provisional · 画面上出现的每个事实（圈数、弯道、轮胎、积分、结果）都要先对照可靠来源核实，并按名场面记下来源。_Why:_ 原型里的事实是凭记忆写的，还没核实过。
- **STO-6** · provisional · 前期用 director 的方法做选题、研究和分镜，但 director 目前没有 MV Mode，不套用 Animated Explainer 的旁白结构；前期方案写在 `docs/production/`，制作按 shape 用 Remotion 代码绘制，不进入 director 的生成流程（ART-1）。_Why:_ 用户 2026-10-03 要求先走 /director，选了"只做前期"。

## Open questions

- 是否以后为 director 正式建立一个 MV Mode（要先有一支验证作品）。

## Rejected

- 5–10 个名场面、每个 30–90 秒的合集：用户改为 3–3.5 分钟的 MV。2026-10-03。（was STO-1）
- 中文旁白：MV 不用旁白。2026-10-03。（was STO-2）
- 按 Animated Explainer 写旁白讲稿：不适合 MV。2026-10-03。
