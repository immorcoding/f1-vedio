# 幕后：过程稿

这里挑了一小部分我们一路做出来的过程稿：原型、对比、分析图、被否决的方案。完整的有两百多组，放不下，就挑了些最能说明"怎么一步步改过来"的。

文件名就是它来自的分支，`__` 后面是这张图在说什么。`main` 是主分支；`prototype-*` 是一次性原型分支；`feat-v2-*` 是 v2 的工作分支；`review-*` 是评审时的分析。

里面没有真实照片：带参考照片的对比图都没放进来，或者把照片那部分裁掉了，原因见主 README 的"版权与素材"。

## 第一天：定画风

| 图 | 说什么 |
|---|---|
| `prototype-styles__A-ink-watercolor.jpg` | 画风 A：钢笔水彩 |
| `prototype-styles__B-manga.jpg` | 画风 B：日式赛车漫画，最后选的就是它 |
| `prototype-styles__C-illustration.jpg` | 画风 C：精致插画 |
| `main__cars-2021-sheet.jpg` | 2021 年的梅奔和红牛，整支片子的质量底线 |

## 原型：拿不准的先做出来比一比

| 图 | 说什么 |
|---|---|
| `prototype-fire-styles__compare.jpg` | 四种火。选了 B（流动、无描边），后来全片统一用它 |
| `prototype-type-system__compare.jpg` | 四套字体系统。选了 D |
| `prototype-gold-accent__compare.jpg` | 金色要不要用在每个积分框上？结论：只给夺冠时刻 |
| `prototype-car-high-low__sheet.jpg` | 同一台车的高机位、低机位两套画法 |
| `prototype-credits-gag__mascot-A-vs-B.jpg` | 片尾彩蛋的两版吉祥物，选了 B（Clawd） |

## 评审：让脚本和"评委"挑刺

| 图 | 说什么 |
|---|---|
| `review-1__grid-bars81-88.jpg` | 第一轮评审的抽帧网格：阿布扎比 drop 段一格一格看 |
| `review-2__audio-wave.jpg` | 第二轮评审的全片波形和逐小节响度 |
| `feat-v2-engine-sfx__era-spectra.jpg` | 四个年代引擎声的频谱：V10、V12、V8、V6 涡轮混动 |

## 走过的弯路和修正

| 图 | 说什么 |
|---|---|
| `feat-v2-far-side__true-perspective-rejected.jpg` | 按真实透视推算车的远侧。理论上对，看着不对，被否决了 |
| `feat-v2-car-high-low__sheet.jpg` | 改成高、低两套车模之后的全部车型 |
| `feat-v2__far-wheels-before-after.jpg` | 远侧车轮往下压三分之一，前后对比 |
| `feat-v2__ground-shadow-ellipse.jpg` | 高机位的地面阴影改成椭圆 |
| `feat-v2-bahrain-geometry__diagram.jpg` | 巴林撞击的俯视世界模型：29° 轨迹、22° 偏航、51° 车身，每个机位都从这里推出来 |
| `feat-v2-bahrain-geometry__before-after.jpg` | 有了世界模型前后的撞击镜头 |
| `feat-v2-r2-bahrain33__impact-flash-strip.jpg` | 撞击接触后 12 帧。火星雨改成一个最上层的大撞击闪光 |
| `feat-v2-r2-haze__moire-before-after.jpg` | 热浪把网点扭成摩尔纹（左），先扭灰度再加网之后（右） |
| `feat-v2-r2-flicker__5.1c-before-after.jpg` | 背景闪得像在切镜头（上），改成运动模糊之后（下） |
| `feat-v2-r2-grolegs__step-down.jpg` | Grosjean 下车时腿打结（左），一步一步踩下来（右） |
| `feat-v2-r2-stopwatch__gro-walks-out-of-fire.jpg` | 火场最后一版：他从火里走出来，火在身后吞没赛车 |
| `feat-v2-r2-stopwatch__stopwatch-11s.jpg` | 27 秒秒表停在 11 秒：医疗车到了 |
| `feat-v2-r2-ghost__trophy-8.jpg` | Hamilton 没拿到的第八冠，一只刻着 8 的奖杯残影 |
| `feat-v2-r2-tyres__new-softs-old-hards.jpg` | 新软胎对旧硬胎 |
| `feat-v2-rb18-ride__rb16b-vs-rb18.jpg` | 2021 年 RB16B 和 2022 年 RB18，同一比例 |

## 车模是怎么描、怎么算透视的

车模全部是照着授权照片在像素坐标里描出来的。描线时先用车轮校正：已知轮胎直径和规则里的轴距，就能把斜拍的照片校正成纯侧视，顺便换算出真实尺寸。

参考照片本身没放进仓库，所以这里只放描好的线和算出来的结果。

| 图 | 说什么 |
|---|---|
| `feat-v2-rb18-standard__trace-lines.jpg` | RB18 的描线：品红是车身和翼，青色是车轮（近侧和远侧各两个），黄色是头盔。比例按 2022 年规则的最大轴距 3.6 m 定 |
| `feat-v2-far-side__haas-camera-elevations.jpg` | 同一台 Haas 在不同机位高度下：残骸机位 20.9°、撞击机位 18.4°、中间 8°、低机位 1°。机位越高，远侧车轮和端板露得越多 |
| `feat-v2-far-side__camera-elevation-2021-vs-str3.jpg` | 2021 年的车在 1° 和 4.3° 两个机位下，和已经认可的 STR3 对比，右边是车头的 3 倍放大 |
| `prototype-car-high-low__noses-3x.jpg` | 车头和前翼的 3 倍放大：A 原来的、B 高机位、C 低机位（车身按 4° 机位重新投影，鼻锥落到前翼上） |
| `prototype-car-high-low__in-context-low.jpg` | 放回 5.1c 的低机位镜头里，左边是原来的，右边是新的低机位画法 |
| `feat-v2-rear-wing-low__near-endplate-hides-far.jpg` | 低机位时，近侧尾翼端板应该挡住远侧端板和翼面（右：改后） |
| `feat-v2-rb18-ride__level-guides.jpg` | 用水平参考线检查前后轮是否同高、底板离地多少 |

透视算法当时是这样的：远侧部件是近侧部件往深处挪一个轮距的透视副本，缩放 s = z/(z+W)，高出近侧 (1 − s)·(机位高 − 部件高)。用照片里描出来的远侧车轮反推，每张照片的拍摄机位大约在 2°–22° 之间（W12 约 17°，RB16B 约 16°，VF-20 约 21°）。完整推导和每张照片反推出的机位表在 [`far-side-perspective.md`](far-side-perspective.md)（当时的英文工作笔记）。

算得很准，但放在一辆本身是平面侧视画法的车上，看起来反而不对。所以最后放弃了逐镜头算透视，改成每台车只有高、低两套画法，按机位高度选用。这是这个项目里我最喜欢的一个教训：**数学对，不等于画面对。**

## 片尾彩蛋：一块横幅改了六轮

| 图 | 说什么 |
|---|---|
| `feat-v2-credits-gag__release-attempt-rejected.jpg` | 第三轮：用绳子拉、松手回弹。还是不对，一块布哪能被一根绳子拉直 |
| `feat-v2-credits-gag__unroll-beats.jpg` | 最后一版：两根柱子，卷轴穿在右边那根上，Clawd 扛着它边走边放 |
