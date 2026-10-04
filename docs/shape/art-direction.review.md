# Art direction · review

质量底线与评审轮次怎么改。

[← Art direction](art-direction.md)

## Rules

- **ART-7** · settled · 质量底线：定版的 `cars-2021-sheet.png` 和 `style-b-manga-v2.png` 是所有素材的标准，新素材的精细度、画法和取舍都不得低于它们，也不得偏离。_Why:_ 用户 2026-10-03 定版："所有的都以这个为标准"。_Check:_ 资产评审，新素材与 References 并排对照。
- **ART-33** · provisional · 评审轮次只改用户点名的地方，其他画面原样保留；用户说"X 有问题"但指的是什么不清楚时，先问清楚再改。_Why:_ 巴林第二轮打磨顺手改了许多没被点名的地方，用户 2026-10-04 判定整体不如第一版，退回第一版只保留点名的修改。

## References

- `docs/shape/references/cars-2021-sheet.png`：定版素材标准，W12 与 RB16B 真实涂装素材表（ART-7）
- `docs/shape/references/style-b-manga-v2.png`：定版场景标准，阿布扎比 2021 第 58 圈 T5（ART-2、ART-6、ART-7、ART-9、ART-14）

## Signals

- 2026-10-03 · cite · ART-7 · 验收测试：正式代码的 `Cars-2021-Sheet` 和 `Scene-AbuDhabi2021-T5` 静帧与两张定版参考图逐像素一致（最大通道差 0）；镜头 5.3 的第一帧（歌曲帧 9900）也与 `style-b-manga-v2.png` 逐像素一致。对定版参考图做像素比对，是以后改 `src/kit` 或 `src/cars` 时便宜的回归检查。
- 2026-10-04 · contradiction · ART-7 · 阿布扎比标题卡（4.1）原来的酒店只是平的轮廓加粗糙的棋盘格，低于质量底线，用户说"太粗糙"；已在照片像素空间里重画（ART-10），放进完整的针孔夜景（ART-9）。
