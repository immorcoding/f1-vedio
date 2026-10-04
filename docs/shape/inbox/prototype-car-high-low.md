# Shape inbox: prototype/car-high-low

## Signals

- 2026-10-04 · correction · ART-26 · User: the 2021 side shots are filmed from different camera heights, and that, not car perspective, made the cars look wrong. Each car gets two looks: HIGH, the original trace (far wheels where the photo has them), and LOW, with the far wheels hidden, the far endplate a sliver and the front wing on the nose, as on the STR3.
- 2026-10-04 · correction · ART-10 · User: in the low look the front wing floats because the nose is too thin. Measured on the trace photos, the nose depth is not the main cause. The traced nose sits 0.2–0.35 tyre diameters too high, because it is on the centre line and the trace cameras look down 16–22° (h·cos e + d·sin e). The noses were still deepened to the wing pillars: W12 +0.07 D, RB16B +0.06 D, VF-20 +0.10 D, AT01 +0.05 D at the pillar.
- 2026-10-04 · cite · ART-26 · Prototype LOW look: `CarSpec.farSide.low.body` (BodyView) re-projects the body from the photo's elevation to 4° (`src/cars/seenFrom.ts`). The nose drops onto the wing, the floor to 0.05–0.15 D, the sidepod undercut closes up, and the top comes down to 1.6–1.9 D. Wheels and the near front endplate stay as traced. Low-angle Commons photos are registered (low-angle row).
- 2026-10-04 · friction · ART-17 · In the LOW look the side-on wing deck is mostly hidden behind the dropped nose, so the accent flap shows only as a sliver or not at all. The STR3 shows a visible flap stripe.

## Proposed

- **ART-26 (amended again)** · provisional · 侧视车模每台车两套外观，按镜头机位高度选：仰角 ≳8°（2.6–3.2 m 机位：3.3–3.6、4.3、5.3、5.4、5.6）用 HIGH = 描线原样（远侧车轮照描线位置）；仰角 ≲5°（贴地、追拍、头盔长焦：5.1b、5.1c、头盔小格）用 LOW = 车身按 4° 机位重投影（鼻锥落到前翼上、底板贴地、侧箱下沿贴近底板、车顶降低），远侧车轮和端板藏在近侧后面。_Why:_ 描线照片是 8–22° 俯拍的，中线上的部件（鼻锥、发动机盖）被抬高 0.2–0.3 m；用户 2026-10-04 指出 2021 侧面镜头的问题来自机位高度不同。
