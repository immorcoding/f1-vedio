# Shape inbox: feat/v2-car-high-low

Carries the signals of `prototype/car-high-low` (9de7c5e), whose car changes this branch folds into the film.

## Signals

- 2026-10-04 · correction · ART-26 · User (prototype): the 2021 side shots are filmed from different camera heights, and that, not car perspective, made the cars look wrong. Each car gets two looks: HIGH, the original trace, and LOW, with the far wheels hidden, the far endplate a sliver and the front wing on the nose, as on the STR3.
- 2026-10-04 · correction · ART-10 · User (prototype): in the low look the front wing floated because the nose was too thin. The measured cause was the nose's height: it is on the centre line, so the 16–22° trace cameras lift it 0.2–0.35 tyre diameters (h·cos e + d·sin e). The noses were also deepened to the wing pillars (W12 +0.07 D, RB16B +0.06 D, VF-20 +0.10 D, AT01 +0.05 D), in both looks.
- 2026-10-04 · cite · ART-26 · LOW look: `CarSpec.farSide.low.body` (BodyView) re-projects the body from the trace photo's elevation to a 4° camera (`src/cars/seenFrom.ts`). The nose drops onto the wing, the floor comes to 0.05–0.15 D, the sidepod undercut closes up and the top comes down to 1.6–1.9 D. The near wheels and near front endplate stay as traced. The low-angle Commons photos are registered (low-angle row).
- 2026-10-04 · friction · ART-17 · (prototype) In the LOW look the side-on wing deck is mostly hidden behind the dropped nose, so the accent flap shows only as a sliver or not at all.
- 2026-10-04 · correction · ART-26 · User verdict on the prototype: "Very close to correct. The RB16B is the most correct. Its front endplate hides the nose wing, and that is the right perspective proportion." In the RB16B LOW look the near front endplate covers the nose tip and the inner wing, and that is right. The W12, AT01 and VF-20 LOW looks now follow the same rule (camera still 4°):
  - Nose height: the nose underside 50 mm behind the tip (plane D-D, 2021 Technical Regulations Art. 15.5.6, which must be ≥135 mm above the reference plane) sits 0.145 m above the ground on every car. That is the RB16B trace re-projected, so the RB16B does not change. Each car's nose depth is backed out from that height (W12, VF-20 and AT01 traces lift the nose more than the RB16B's: photo yaw/lens).
  - Nose tip x: 0.07 m behind the near front endplate's leading edge on every car, as on the RB16B trace. The other traces had the tip 0.06–0.17 m ahead of the edge. Their photos are shot slightly from the front, so the centre line moves forward, and the far wheels show the same yaw.
  - Endplate tops from the photos are 0.26 (RB16B), 0.29 (W12), 0.32 (AT01) and 0.33 m (VF-20), within the 300 mm limit of Art. 3.3.3. The dropped nose tip tops are at or below them (0.26, 0.29, 0.23 and 0.28 m apparent at 4°, same order), and the tip lies inside the endplate's length, so the endplate hides the tip on all four cars.
  - Caveat: the 2021 rules put the nose tip ≥1075 mm ahead of the front axle (Art. 15.5.6) and the endplate's leading edge at about 1040 mm (Art. 3.3.3 planform). So in a true orthographic side view the tip would sit about 4 cm ahead of the endplate. The RB16B trace (tip 0.98 m) is shorter than that, and the user approved it. The LOW rule follows the RB16B, not the rule book, on this one dimension.
- 2026-10-04 · correction · ART-26 · User: for every car and look, each far wheel sits at its near wheel's x, and any traced horizontal offset is dropped (`drawnFarWheels`). This fixes the W12 and AT01 HIGH far front wheels. The STR3 keeps its approved traced x (`keepFarWheelX`). Side effect: on the VF-20 HIGH and AT01 HIGH the far front wheel now sits behind the nose and wing, and is mostly hidden.
- 2026-10-04 · correction · ART-26 · User: the RB16B and W12 HIGH far wheels sit at 80% of the traced lift (still peeking, a little lower).
- 2026-10-04 · cite · ART-26 · Every side-view shot of these cars passes an explicit `farSide`. HIGH: Bahrain 3.3–3.6, the halo finale and the outro's 2020 panel (Impact/Wreck, unchanged), 4.3 Restart, 5.3 T5Panel, 5.4 Tow (wide and long lens) and 5.6 Finish. LOW: 5.1b WheelLevel, 5.1c Charge, 4.2 Faceoff, 5.1e Helmets and 5.7 Points. The library sheets use the default (LOW). The outro's 6.1 ④ blank RB16B → RB18 panel keeps the default LOW. Check-Car-Looks is the new reference still.
- 2026-10-04 · correction · ART-8 · 5.5: user restored #23's track effects: the inked trail of VER's covered lap, the comet tails and the beat pulse, with the glow rings. The cars and their glow rings are the top layer, and the trail and tails are drawn underneath. VER's colour is now blue (`VER_GLOW = "blue"`, royal blue #1f3fe0) for the rings, tail and trail, well away from HAM's teal #00a19b.

## Proposed

- **ART-26 (amended again)** · provisional · 侧视车模每台车两套外观，按镜头机位高度选，每个镜头明确写 `CarState.farSide: "high" | "low"`：
  - 仰角约 8° 以上（2.6–5 m 机位：巴林 3.3–3.6 与终章、尾奏 2020 格、4.3、5.3、5.4、5.6）用 HIGH。HIGH 就是描线原样（加深后的鼻锥）。
  - 仰角约 5° 以下（贴地、低机位追拍、头盔长焦：5.1b、5.1c、4.2、5.1e、5.7，以及资料库静帧默认）用 LOW。LOW 把车身按 4° 机位重投影：鼻锥落到前翼上，底板贴地，侧箱下沿贴近底板，车顶降低；远侧车轮和端板藏在近侧后面。
  - LOW 以 RB16B 为标准（用户 2026-10-04 认可）：近侧前端板挡住鼻锥尖和它后面的翼面。每台车都按同一条规则放鼻锥：D-D 截面下沿离地 0.145 m，鼻尖在近侧端板前缘后 0.07 m。
  - 两套外观里，远侧车轮都与近侧车轮同一 x（STR3 保留已认可的描线位置）。RB16B 和 W12 的 HIGH 远侧车轮抬高为描线的 80%。
  - _Why:_ 描线照片是 8–22° 俯拍的，中线上的部件（鼻锥、发动机盖）被抬高 0.2–0.3 m。用户 2026-10-04 指出 2021 侧面镜头的问题来自机位高度不同，并认可 RB16B 的 LOW 端板遮挡比例。
