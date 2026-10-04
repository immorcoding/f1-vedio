# Art direction · lettering

画面文字的字体与版式。

[← Art direction](art-direction.md)

## Rules

- **ART-6** · provisional · 字体系统（D 版，全部 Google Fonts 的 OFL 授权字体，每个角色一个组件，在 `src/kit/lettering.tsx`）：标题和大号数字用 Big Shoulders Black（年份空心描边）；标签、说明和字幕用 Titillium Web 600/700，说明放在漫画说明框里；拟声字用 Bangers（墨色加纸色描边）；印章用 Saira Stencil。关键瞬间用漫画小格（inset panel）给特写。车上的车号是涂装，不归字体系统（ART-27）。_Why:_ 用户 2026-10-04 要求把毛笔字换成更符合赛车文化的字体，在原型 `prototype/type-system` 的四套里选了 D。
- **ART-32** · provisional · 每张标题卡的标题（地点 + 年份）下面是一条方格旗短条（两行方格），再下一行是赛道全名，用 Titillium Web 600 宽字距大写；方格条先从左往右划入，赛道名随后逐字打出（`CircuitTag`）。片尾标题也带这条方格条，但不写赛道名。_Why:_ 用户 2026-10-04 通过主管要求给每张标题卡加上。

## Signals

- 2026-10-04 · cite · ART-6 · 剩下的 Arial Black 文字也改成 D：夺冠卡（2.7、5.8）和积分（4.2/5.7）用 Big Shoulders Black，车手和名次标签、弯道标签、2.7 比分名字用 Titillium Web Bold。Big Shoulders 比 Arial Black 窄，夺冠卡的每行按栏宽定字号、限制大写高度，不再用 `textLength` 拉伸。
- 2026-10-04 · cite · ART-6 · 3.6 的"27s"用 Titillium Bold 加纸色描边，和 3.5 的时间框一致（Bangers 会写成"27S"）。
- 2026-10-04 · cite · ART-6 · 片尾标题用 `TitleText`（"F1 ·" 实心、"1989–2021" 空心），墨色字排在横过方格旗的纸色横幅上（墨色双线、硬墨投影、倾斜 3°），方格旗上也读得清。
- 2026-10-04 · cite · ART-6 · 巴林标语直接排在暗色的下三分之一，不加说明框：Titillium Web 700、60 px、0.12 em 字距、纸色。

## Rejected

- 毛笔字（Ma Shan Zheng、ZCOOL KuaiLe）：用户 2026-10-04 要求换成更符合赛车文化的字体，被 ART-6 的 D 版取代；正式代码已不再加载，只剩 `src/prototype/` 引用。
