# Audio

听到什么：配乐和音效的来源与风格。

Next id: AUD-6

## Pillars

- 原创、由代码生成，不碰版权素材。
- 音乐是这支 MV 的骨架：铺垫 → 爆发 → 结局。

## Rules

- **AUD-1** · provisional · BGM 由 Claude 用代码合成原创音乐（node 脚本输出 WAV），不使用外部音乐、采样或 AI 生成音乐。_Why:_ 用户 2026-10-03 指定"bgm 你做"；与 ART-1"全部由你绘制"一致。
- **AUD-2** · provisional · BGM 以电子风为主：合成器 pad、锯齿贝斯、电子鼓，冲击段用 riser 和 impact。_Why:_ 用户 2026-10-03 指定"电子风为主"。
- **AUD-3** · provisional · BGM 是一首完整的 3–3.5 分钟纯音乐，没有人声和旁白；段落结构与 `docs/production/mv-treatment.md` 一致，生成时同时输出节拍表，剪辑按节拍表对齐（MOT-4）。_Why:_ 用户 2026-10-03 把片子定位为 MV。
- **AUD-4** · provisional · 母带标准：整体响度 −14 LUFS ±1，真峰值不超过 −1 dBTP，由音频检查脚本验证。_Why:_ #4 的 agent 提议，用户 2026-10-03 采纳。_Check:_ `npm run check:audio`。
- **AUD-5** · provisional · 生成的 WAV（约 40 MB）不进 git，签出后用 `npm run music` 重新生成；节拍表 `beat-map.json` 进 git，固定为 LF 换行。_Why:_ 生成结果可复现，没必要存大文件；#4 的 agent 提议，用户 2026-10-03 采纳。_Check:_ `.gitignore` 与 `.gitattributes`。

## Open questions

- 引擎声、刹车声等音效要不要叠在音乐上，用什么方法合成。
