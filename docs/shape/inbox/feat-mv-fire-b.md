# Shape inbox: feat/mv-fire-b

## Signals

- 2026-10-04 · art-direction · ART-8 (fire in colour is the exception) decided the palette: `FIRE_COLOR` keeps red / orange / yellow / white-yellow core; `FIRE_MANGA` is now the same B fire in greys (kept for the open black-and-white option and the Library fire sheet).
- 2026-10-04 · art-direction · ART-20 (all smoke is bubble smoke) decided the smoke: the kit's ink-stroke `SmokeStreaks` is gone, replaced by `BubbleSmoke` (over the wreck fire, after the 3.3 fireball, and smaller and without the firelight rim off the charred cell in the halo finale) and by a dark bubble-smoke burst behind the fireball in the 3.3 freeze. The extinguisher powder (`powder.tsx`) is still drawn as ink strokes: it is powder, not smoke, and its comment records an earlier user review asking for no bubbles there. Flagging it in case the lead reads ART-20 as covering it.
- 2026-10-04 · art-direction · The fireball keeps the approved prototype look: four soft bands round a hot disc, with no noise licking. The prototype's FireballB had no displacement either, and adding it would change a look the user signed off.
- 2026-10-04 · motion · Close-ups now show a few big tongues, not more and finer ones (the old `detail` / `fireDetail` knob is removed). In the 27 秒 panel the camera is inside the flame body, so the background is a wall of orange with yellow core streaks rather than separate tongues. That reads as fire, and the old fire looked the same way there.

## Proposed

- **ART-21** · provisional · 火焰统一用 B 型：几条大火舌，中线被向上流动的平滑噪声弯曲，共用一股风摆动，尖端收细，火舌顶端会脱落火苗；色带由外到内是红、橙、黄、白黄焰心，不描边；边缘的柔化来自分层模糊、噪声舔边（feTurbulence + feDisplacementMap）和光晕。柔化和舔边的尺寸固定在屏幕像素上（焰心模糊 2.5 px，外层按倍数加大，舔边 36 px），不随镜头推近或分格大小缩放。火星沿弯曲路径上升，火光暖色洗在附近的护栏和地面上，热浪平滑起伏，不逐帧重新随机。火焰画在浅色或白纸背景上时（如 3.3 定格），在火球后面垫一团深灰泡泡烟（ART-20），火光只落在火和烟上，纸面和画面文字不染色，火焰本身仍不描边。实现在 `src/kit/fire.tsx`，所有段落共用。_Why:_ 用户 2026-10-04 嫌原来的火"太乱"，在 `prototype/fire-styles` 的四种画法里选了 B，并在 3.3、3.5、3.6 的压力测试 v2 后确认。_Source:_ `prototype/fire-styles`（4860d7d），本分支 `feat/mv-fire-b`。
