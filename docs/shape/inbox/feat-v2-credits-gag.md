# Shape inbox: feat/v2-credits-gag (post-credits stinger, "MADE BY Immor × Claude")

## motion-and-timing

- 2026-10-05 · cite · MOT-4 · 用户要求加的彩蛋只经过 `src/mv/timing.ts` 加小节：`BARS` 113 → 119，新音乐段落 `credits`（114–119），两个冲击点 `credits.jump`（118.3）、`credits.end`（119.1）；剪辑表加一段 `credits`（7.1–7.3）。正片的帧号、提示和音频都没动：`mv.wav` 前 211.865 秒逐样本相同（只有最后 10 ms 原来的收尾淡出不再存在）。
- 2026-10-05 · friction · MOT-4 · 加段落又得改 `src/mv/edit-list.ts` 和 `src/mv/scenes.ts`（两个文件头都写着"这个文件不变"），同 2026-10-04 那条。
- 2026-10-05 · cite · MOT-6 · 彩蛋的重音只放在真实的声音上：Clawd 的 13 次落地各踩一记轻底鼓，方格条划入有一串小 tick，回头有 "?!" 两个音，起跳有 boing 加掐断的镲，旗子落下有一声布的呼啸，黑里最后一个 Dm 和弦。车掠过在 117.1，同拍落地的底鼓被引擎盖过。
- 2026-10-05 · correction · MOT-5 · 用户看了第一版构想后要求：镜头不动、场景里不要速度线和流动的背景（Clawd 很慢），只有车快：车本身拖残影和几条速度线，风吹 Clawd 和旗子，加上呼啸声；慢吞吞的小怪对极快的车就是笑点。

## audio

- 2026-10-05 · correction · AUD-7 · user 2026-10-05: stinger whoosh may exceed the music, AUD-7 exception. 只给 `credits.pass` 一个挂点（`src/mv/sfx.ts` 的 `aboveMusic`，按 id 写在 `scripts/check-audio.mjs` 的 `AUD7_EXCEPTIONS` 里）：117 小节比音乐高约 6.3 dB（RMS），音乐在它下面按它的包络压低 60%；其余挂点照旧至少低 14 dB。
- 2026-10-05 · cite · AUD-7 · 多普勒用"接收时刻 t = 发出时刻 τ + r(τ)/c"逐样本反解后对引擎重采样（`dopplerPass`，78 m/s、10.5 m），响度按 1/r^1.3，最近处叠一股低通气流噪声。
- 2026-10-05 · cite · AUD-4 · 母带增益只按正片（到 114.1 为止）测响度，彩蛋不改变正片的电平；全文件 −14.23 LUFS（ffmpeg），真峰值 −2.25 dBTP。
- 2026-10-05 · friction · AUD-6 · AUD-6 写着"全曲 113 小节（211.875 秒）"；现在全曲 119 小节、223.125 秒，正片仍是 113 小节。请在 main 上改 AUD-6 的数字。
- 2026-10-05 · cite · AUD-1 · 彩蛋的所有声音都是代码合成、带种子的噪声（`mulberry32(1140)`），不从冲击点那段的噪声里取，所以后面的镲一个样本都没变。

## story-and-facts

- 2026-10-05 · friction · STO-4 · 加上彩蛋全片 3 分 43 秒（223.125 秒），超过 STO-4 的 3–3.5 分钟；正片仍是 3 分 32 秒。用户要的彩蛋，篇幅是否改写进 STO-4 请用户定。
- 2026-10-05 · cite · STO-10 · 彩蛋也结束在方格旗上：Clawd 吓飞的旗子落回来盖住镜头，抹到全黑。
- 2026-10-05 · cite · STO-3 · "POLE AGAIN?!" 是真的：VER 在亚斯码头 2021、2022 连续拿杆位，来源登记在 `facts.md`"片尾彩蛋"。
- 2026-10-05 · cite · STO-5 · 对话框选短的 "POLE AGAIN?!"：从 5.2 到旗子盖住镜头约 1.2 秒，三个词读得完，"HOW IS HE ON POLE AGAIN?!" 读不完。

## art-direction

- 2026-10-05 · correction · ART-8 · 用户批准新的颜色例外：Clawd 用 Claude 橙 #D97757（阴影 #a9523a 加网点），只在片尾彩蛋里；它是黑白世界里唯一不是车的彩色东西。
- 2026-10-05 · cite · ART-32 · 彩蛋开场的方格条和片尾标题卡的同一条：同位置、同 −3° 倾斜、同 34 px、同格数（按 `F1 · 1989–2021` 150 px 的标题宽算），14 帧从左往右划入；位置常量是从 `outro/Flag.tsx` 抄过来的（没改别的段落的文件），尾奏改版式时要一起改。
- 2026-10-05 · cite · ART-6 · MADE BY 用 Titillium Web 600 宽字距大写（说明字的样式，30 px），Immor × Claude 用 Big Shoulders Black 实心（不走 TitleText，免得最后一个词变空心），字宽对齐方格条（140 px 封顶）；对话框里的话用 Titillium Web 700（字幕/说明的字），拟声字 BOING!、!! 用 Bangers。
- 2026-10-05 · cite · ART-14 · Clawd 永远在横幅展开的边缘右边，字只在它身后出现；走完后停在字的右边原地跳；惊吓线只画在远离横幅的一侧；对话框在横幅右上方，车已经开走。
- 2026-10-05 · friction · ART-14 · 方格条在横幅展开前就已经整条在画面上（匹配剪辑要它先回来），所以 Clawd 走路时方格条会伸出横幅、从旗子后面穿过去；读起来像横幅沿着方格条展开，但用户也许想让它收进横幅里。
