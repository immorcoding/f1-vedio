# Story & facts

讲什么、怎么讲、怎么保证准确：片子的定位、名场面清单、画面文字、事实核查。

Next id: STO-11

## Pillars

- 这是一支 F1 比赛名场面的手绘 MV，由音乐驱动，不是故事片，也不是 F1 科普。
- 每个呈现出来的事实都经得起查证。

## Open questions

- 是否以后为 director 正式建立一个 MV Mode（要先有一支验证作品）。

## concept

片子的定位、篇幅、名场面的顺序与结局。

### Rules

- **STO-4** · provisional · 成片是 3–3.5 分钟的 MV，复刻 4 个名场面，按时间顺序：1989/1990 铃鹿 → 2008 巴西 → 2020 巴林 → 2021 阿布扎比（高潮）；每个名场面占一个音乐段落。v1 为 3 分 32 秒（113 小节，AUD-6）：用户为巴林结尾加的一小节过渡让它略超 3.5 分钟。_Why:_ 用户 2026-10-03 定位为"5 分钟以内的短片，类似 MV，不是故事片"，并选了这个篇幅和顺序。
- **STO-10** · provisional · 片子结束在方格旗上：方格旗是比赛真正的结束信号；起跑灯熄灭（lights out）在 F1 里代表发车，只用来开场。_Why:_ 用户 2026-10-04 觉得用起跑灯首尾呼应的结尾很牵强，改成方格旗。

### Proposed

- 2026-10-04 · exploring · 跨两年的段落（铃鹿 1989/1990）用同一套版式讲反复出现的主体：同一组头盔卡放在同样的位置、一种印章样式、镜像的撞击画面，靠重复的元素而不是文字把两年连成一个故事。_Why:_ 用户 2026-10-03 批准了铃鹿"队友变对手、两次相撞、各得一冠"的连贯叙事。（queued: unattended drain，来自 feat/mv-suzuka-narrative）

### Signals

- 2026-10-03 · cite · STO-4 · 铃鹿 1990 段从 1989 段导入头盔卡、印章和翻页（`suzuka1989/Helmets.tsx`、`Title.tsx`），而不是复制一份，有意越过"每个段落只改自己的文件夹"，因为它们是同一个音乐段落拆成的两段。若段落应保持独立，共享部分可移到 `src/scenes/suzuka/`。

### Rejected

- 5–10 个名场面、每个 30–90 秒的合集：用户改为 3–3.5 分钟的 MV。2026-10-03。（was STO-1）
- 片尾回到起跑灯（五盏灯亮起、灭灯、标题落在暗下来的灯架下）首尾呼应：灭灯代表发车，放在结尾读反了；被 STO-10 取代。2026-10-04。

## text

画面上出现哪些文字。

### Rules

- **STO-5** · provisional · 没有旁白。画面文字全部用英文、尽量少：每个名场面一张标题卡（地点 + 年份，如"SUZUKA 1989"），英文拟声字，以及极短的关键信息（如"LAP 58""PRO +16 PTS"）；车手用三字母缩写（VER、HAM），夺冠卡写车手全名。不用中文。_Why:_ 用户 2026-10-03 选了"只留少量漫画文字"；2026-10-04 要求全部改英文，"赛车文化起源于欧洲"。

### Signals

- 2026-10-04 · cite · STO-5 · 所有画面文字按翻译表 `out/prototype/type-system/translations.md` 的英文列加主管的选择定稿；5.3 的说明定为"LAP 58 · TURN 5"；Library 评审表的中文标签也一并翻译。
- 2026-10-04 · cite · STO-5 · 2.7 的夺冠字（"LEWIS HAMILTON / 2008 / WORLD / CHAMPION"）是事实不是引语，5.8 的车队无线电仍是全片唯一的原话（STO-8）。
- 2026-10-04 · cite · STO-5 · 巴林标语 `F1 SPEED ISN'T ONLY IN THE CARS.` 是标语不是引语，不受 STO-7/STO-8 的"不放原话"约束；已记在分镜表里。
- 2026-10-04 · cite · STO-5 · 片尾的新文字：年份（1989 · 1990、2008、2020、2021 → 2022）、复用的 2.7 比分框（98 · 97，HAM / MAS）和片尾标题 `F1 · 1989–2021`，全部英文，都在 D 版的角色里。

### Rejected

- 中文旁白：MV 不用旁白。2026-10-03。（was STO-2）
- 中文画面文字（中文漫画字、中文说明）：用户 2026-10-04 要求全部改英文，见 STO-5。

## facts

事实核查、彩蛋与引用。

### Rules

- **STO-3** · provisional · 画面上出现的每个事实（圈数、弯道、轮胎、积分、结果）都要先对照可靠来源核实，并按名场面记下来源。_Why:_ 原型里的事实是凭记忆写的，还没核实过。
- **STO-7** · provisional · 可以加入让车迷会心一笑的彩蛋，但每个彩蛋都必须是核实过的真实细节（登记在 `docs/production/facts.md`），不放人物原话（唯一例外见 STO-8）。当前彩蛋清单见 `docs/production/mv-treatment.md`。_Why:_ 用户 2026-10-03 要求"适当增加让车迷惊喜的细节"，并选定了五组彩蛋。
- **STO-8** · provisional · 阿布扎比 5.8 的夺冠照片卡（ART-19）引用红牛车队无线电原话"Max Verstappen, you are the world champion"，画面上不加出处小字；这是全片唯一一句人物原话，措辞和说话人都以登记在 `facts.md` 的来源为准（v1 时这条还没登记，已有跟进项）。_Why:_ 用户 2026-10-03 要求在夺冠卡上放这句话，并去掉了出处小字（"没有必要"）。_Source:_ [formula1.com：Say what, Abu Dhabi 2021 team radio](https://www.formula1.com/en/latest/article/say-what-enjoy-the-best-team-radio-from-the-abu-dhabi-season-finale.1pUHfdFT1FyhoP7J07jLy9)
- **STO-9** · provisional · 车手脱险按真实的程序画：手抓 halo 和座舱边，从车侧爬出，绝不翻越护栏。_Why:_ 用户 2026-10-04 纠正巴林段：车手是抓着 halo 出来的，不是翻护栏。

### Signals

- 2026-10-03 · cite · STO-3 · 巴林的场景几何（29° 撞向三层护栏、右后轮碰左前轮、241 km/h、座舱穿过中间横梁）和彩蛋（Ian Roberts、拿干粉的救援人员、烧焦但完好的 halo）按 FIA 调查摘要登记在 facts.md；`scripts/check-bahrain2020.mjs` 检查画面上的 67G 和 27 秒与登记一致。
- 2026-10-04 · cite · STO-3 · FIA 摘要里的"29 degrees … yaw of 22 degrees"是两个量：29° 是行驶方向与护栏的夹角，22° 是车头与行驶方向的夹角；摘要说车"yaw to the right"，所以片中车头再向护栏转 22°（车身与护栏约 51°），见 `crash-geometry.ts`。
- 2026-10-03 · cite · STO-7 · 铃鹿 1990 的"脏的那一侧杆位"不用文字表现：发车格右侧一道有灰尘网点和沙粒，左侧是深色的跑道胶线；维修区出口线（FIA 叫车手别越过）按环境黑白画成白线。
- 2026-10-03 · cite · STO-7 · 巴林 3.5 是"27s"时间线的四个不同时刻（0 秒、11 秒医疗车、救援人员拿灭火器、27 秒）；灭火器的时刻查不到，那一格不标秒数。
- 2026-10-03 · correction · new · 铃鹿 1.4 推车重新发动的彩蛋小格显得僵硬，被删掉，彩蛋改成结果本身（两枚印章）：核实过的事实，画不好也可以不用。
- 2026-10-04 · cite · STO-7 · 片尾彩蛋 VER 的车号 33 翻成 1，使用前核实并登记在 facts.md（#1 用于 2022–2025，#33 用于 2015–2021）；因为画的是 2021 年的车，年份同一拍从 2021 翻成 2022，画面不会声称他 2021 年就用 1 号。

## workflow

前期方法。

### Rules

- **STO-6** · provisional · 前期用 director 的方法做选题、研究和分镜，但 director 目前没有 MV Mode，不套用 Animated Explainer 的旁白结构；前期方案写在 `docs/production/`，制作按 shape 用 Remotion 代码绘制，不进入 director 的生成流程（ART-1）。_Why:_ 用户 2026-10-03 要求先走 /director，选了"只做前期"。

### Rejected

- 按 Animated Explainer 写旁白讲稿：不适合 MV。2026-10-03。
