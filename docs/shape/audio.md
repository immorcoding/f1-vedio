# Audio

听到什么：配乐和音效的来源与风格。

Next id: AUD-4

## Pillars

- 原创、由代码生成，不碰版权素材。
- 音乐是这支 MV 的骨架：铺垫 → 爆发 → 结局。

## Rules

- **AUD-1** · provisional · BGM 由 Claude 用代码合成原创音乐（node 脚本输出 WAV），不使用外部音乐、采样或 AI 生成音乐。_Why:_ 用户 2026-10-03 指定"bgm 你做"；与 ART-1"全部由你绘制"一致。
- **AUD-2** · provisional · BGM 以电子风为主：合成器 pad、锯齿贝斯、电子鼓，冲击段用 riser 和 impact。_Why:_ 用户 2026-10-03 指定"电子风为主"。
- **AUD-3** · provisional · BGM 是一首完整的 3–3.5 分钟纯音乐，没有人声和旁白；段落结构与 `docs/production/mv-treatment.md` 一致，生成时同时输出节拍表，剪辑按节拍表对齐（MOT-4）。_Why:_ 用户 2026-10-03 把片子定位为 MV。

## Open questions

- 引擎声、刹车声等音效要不要叠在音乐上，用什么方法合成。
