# Art direction

画面长什么样：画风、颜色、赛车与赛道的画法、透视、画面里的文字。

Next id: ART-45

## Pillars

- 日式赛车漫画：环境用墨线、网点、集中线的黑白画法，赛车穿着真实涂装从画面里跳出来。
- 一眼读懂：先轮廓与明暗对比，再细节；画不好的细节不画。
- 忠于真实那一刻：车型年代、涂装、轮胎、赛道特征、镜头机位都对得上当场比赛。

## Open questions

- 线条抖动（boil）在动画里要不要动、动多快。
- 侧视车模的描线照片多是略微俯拍的（VF-20 的远侧车轮比近侧高 180 照片像素，车的中线比相机地面高约 0.31 m）：以后的车模是只用平视照片描，还是把中线抬高作为数据（如 `frame.rise`）带上，让人和车站在同一个地面上？
- 参考照片放在被忽略的 `/references/` 里，Remotion 打包取不到，Check 静帧只能透明底、另外合成。可以接受一个被忽略的 `public/references` 链接吗？
- 巴林的救援人员橙色工作服画成中灰、FIA 医疗车画成环境（纸色、网点、黑玻璃），都没按真实颜色；要不要像安全车警示灯一样给它们开 ART-8 的例外？

## Titles

- [medium](art-direction.medium.md)：画面从哪来：代码绘制、参考照片登记、唯一的照片卡、肖像与 logo。
- [style](art-direction.style.md)：画风、配色与线条。
- [cars](art-direction.cars.md)：车模的描线与画法：侧视、俯视、翼、座舱、车轮、车号。
- [people](art-direction.people.md)：人物的画法、比例与共享人物模块。
- [camera](art-direction.camera.md)：透视、构图、遮挡与不穿模。
- [effects](art-direction.effects.md)：烟、火、热浪、撞车残骸与护栏。
- [lettering](art-direction.lettering.md)：画面文字的字体与版式。
- [review](art-direction.review.md)：质量底线与评审轮次怎么改。
