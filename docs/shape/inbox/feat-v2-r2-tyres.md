# Shape inbox: feat/v2-r2-tyres (#34, 5.1e tyre split panel)

## art-direction

- 2026-10-05 · correction · ART-13 · 用户否决了 5.1e 的单独侧面头盔特写（"头盔单独放着看着怪"）；改成轮胎小格：VER 新软胎、HAM 旧硬胎的侧面车轮特写，呼应 4.3 的 FRESH SOFTS vs OLD HARDS（facts.md 第 71、85 行）。
- 2026-10-05 · cite · ART-13 · 车轮用 `src/cars/MangaCar.tsx` 新导出的 `CarWheel`（车自己的 `NearWheel`：胎、Pirelli 胎圈、轮辋、轮辋色边，按描线尺寸缩放，同 `DriverHelmet` 的做法），胎圈颜色取 `PIRELLI_2021`。
- 2026-10-05 · cite · ART-11 · 旧硬胎的磨损只用两样：胎面一圈灰色网点（起粒）和九道随轮转动的浅灰擦痕；新软胎靠两层渐隐残影把辐条抹开、表现高速转动。夜色背景上黑胎的外缘会消失，所以加一圈纸色细边。
- 2026-10-05 · friction · MOT-4 · 镜头和提示仍叫 `Helmets.tsx`、`abuDhabi2021.helmetVer/helmetHam`（沿用被替换的头盔格），没改名，免得动剪辑表的提示 id；以后可以统一改成 tyre。
