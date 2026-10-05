# Far side of a side-view car: perspective (feat/v2-far-side)

Code: `src/cars/far-side.ts`. Numbers: `out/calib/calib.ts` in the branch worktree (bundled with esbuild, run with node).

## Model

The scene camera is the shared level pinhole (`src/kit/camera.ts`): screen y = horizon + f·(h − y)/z.

A far part is its near twin moved one width W deeper (W = wheel track for a wheel, wing span for an endplate; from
the car's planform: 2021 1.70/1.60 m tracks, 2.00/1.05 m wings; 2008 1.53/1.44, 1.40/1.00; 1989–90 1.82/1.67,
1.40 (F641 1.68)/1.00). With the near part at depth z:

- scale: s = z / (z + W)
- every far point = VP + (near point − VP) · s, where VP is the vanishing point (horizon at camera height h)
- so the far part shows **(1 − s) · (h − y_part)** above its near twin (y_part = the part's height)
- a far wheel's top rises above the near tyre's top by **(1 − s) · (h − tyre top)**: zero or less while the camera is
  at or below tyre-top height; it only peeks out once the camera is higher than the tyres.
- horizontally the far part stays at its near part's x (the user-approved STR3 look). A scene can give the optical
  axis' position along the car (`camAxisAt`) for the horizontal convergence of an off-axis car: x shifts toward the
  axis by (1 − s)·(axis − x).

In the elevation form the renderer takes (`CarState.camElevation`, degrees above axle height, seen from the near
side; `camDistance` = z): h − axle = z·tan(elevation), so the far wheel lift is ≈ W · tan(elevation) · z/(z + W).
Scenes pass `carCamera(car, cam, z)`, which gives atan((cam.height − axle)/z) and z.

## Check against the traced photos

Back out each photo's camera from its traced far wheels: s = r_far/r_near gives z = W·s/(1 − s); the traced lift L
gives h − hub = L/(1 − s); elevation = atan((h − axle)/z). Then the model is run at the front wheel's camera to
predict the rear wheel's lift.

| car | front wheel: z, elevation | rear wheel: z, elevation | rear lift predicted vs traced |
|---|---|---|---|
| W12 | 16 m, 17.1° | 20 m, 18.3° | 0.45 vs 0.49 m |
| RB16B | 18 m, 15.8° | 20 m, 16.3° | 0.42 vs 0.43 m |
| VF-20 | 31 m, 20.8° | (76 m), 22.2° | 0.58 vs 0.64 m |
| AT01 | 31 m, 3.7° | 29 m, 12.6° | 0.10 vs 0.34 m (front far wheel traced at another yaw) |
| MP4-23 | 21 m, 5.1° | 23 m, 2.5° | 0.12 vs 0.06 m |
| TF108 | 29 m, 1.9° | 27 m, 1.9° | 0.05 vs 0.05 m |
| STR3 | 25 m, 5.9° | 24 m, 4.1° | 0.14 vs 0.10 m (front far wheel re-placed by hand) |
| F2008 | 25 m, 6.4° | 27 m, 6.6° | 0.15 vs 0.16 m |
| MP4/5 (and MP4/5B) | 33 m, 11.0° | 27 m, 11.9° | 0.31 vs 0.33 m |
| F641 | 39 m, 5.1° | 38 m, 5.2° | 0.14 vs 0.14 m |

Front and rear agree within ~1–2° on 7 of 10 cars, so one camera explains both traced wheels: the trace photos are
shot from 2–21° up, at 16–39 m. The three that disagree have a far wheel that was traced at a different yaw (AT01)
or moved by hand (STR3, MP4-23).

The traced far **front endplates** (farFrom dy/scale) give the same elevation where they were traced from the photo:
W12 15.1°, RB16B 14.6°, VF-20 20.7° (wheels: 17.1°, 15.8°, 20.8°). The others, and every rear endplate, were set by
hand to a sliver (ART-17) and back out to 1–5°.

## Offsets per shot camera

Lift = far front wheel centre above the near one; peek = how far the far tyre's top shows above the near tyre's top;
endplate = how far the far endplate's top shows above the near one's (negative = hidden below it).

| shot | car | camera h, z | elevation | far wheel lift | peeks over tyre | far front endplate | far rear endplate | wired? |
|---|---|---|---|---|---|---|---|---|
| default (no camera given) | 2021 cars | ~0.5 m, 10 m | 1.0° | 0.02–0.03 m | 0 | 0.03–0.04 m | hidden | — |
| default | 2008 cars | ~0.46 m, 10 m | 1.0° | 0.02 m | 0 | 0.00–0.02 m | hidden | — |
| default | 1989–90 cars | ~0.5 m, 10 m | 1.0° | 0.03 m | 0 | 0.02 m | hidden | — |
| Suzuka 1.2 low angle (bars 13–14), PRO | MP4/5 | 0.45 m, 5.5 m | 1.3° | 0.03 m | 0 | 0.02 m | hidden | yes |
| Suzuka 1.2 low angle, SEN | MP4/5 | 0.45 m, 8.5 m | 0.9° | 0.02 m | 0 | 0.01 m | hidden | yes |
| Suzuka 1.2 tower (bars 11–12), PRO / SEN | MP4/5 | 3.0 m, 8 / 11 m | 18.5° / 13.7° | 0.50 / 0.38 m | 0.44 / 0.34 m | 0.39 / 0.30 m | 0.22 / 0.17 m | no (default) |
| Brazil 2.2 chase | MP4-23 | 2.6 m, 10.5 m | 12.4° | 0.29 m | 0.26 m | 0.26 m | 0.16 m | no (default) |
| Bahrain 3.3 impact cam | VF-20 | 3.2 m, ~8.6 m | 18.4° | 0.47 m | 0.42 m | 0.54 m | 0.22 m | no (default) |
| Bahrain 3.4 wreck cam | VF-20 | 3.2 m, 7.5 m | 20.9° | 0.53 m | 0.47 m | 0.60 m | 0.25 m | no (default) |
| Abu Dhabi 5.1b wheel level | W12 | 0.3 m, 10 m | −0.2° | 0 | 0 | 0 | hidden | #23 (default ≈ same) |
| Abu Dhabi 5.1c low angle, HAM / VER | W12 / RB16B | 1.1 m, 10 / 12.5 m | 4.3° / 3.5° | 0.11 / 0.09 m | 0.06 / 0.05 m | 0.13 / 0.12 m | 0.01 / 0 m | #23 |
| Abu Dhabi 5.4 tow (T5_CAM), VER / HAM | RB16B / W12 | 2.9 m, 11.6 / 9.2 m | 12.5° / 15.5° | 0.33 / 0.40 m | 0.29 / 0.35 m | 0.39 / 0.47 m | 0.15 / 0.19 m | #23 |

(Before this branch every car drew its far wheels at half the traced lift whatever the camera: 0.22–0.32 m on the
2021 cars and VF-20, 0.03–0.17 m on the rest; and its far front endplate at the traced copy: about 0.5–0.65 m up on
W12, RB16B and VF-20.)

## What this means

- The low cameras (Suzuka 1.2 bars 13–14, Abu Dhabi 5.1b, and the default for the sheets and un-wired shots) truly
  see the far side hidden: the far wheels drop behind the near ones and the far endplates to a 0–4 cm sliver.
- **The 2.6–3.2 m cameras are not at car height.** Suzuka 1.2 bars 11–12 (3.0 m), Brazil 2.2 (2.6 m), Bahrain 3.3/3.4
  (3.2 m) and Abu Dhabi 5.4 (T5_CAM, 2.9 m) look down 12–21°, and correct perspective puts the far wheels
  0.3–0.5 m above the near ones. That is as high as in the traced photos, and higher than the old half-lift.
  Wiring them would move the far parts **up**, against the brief ("at minimum the far parts must move down"), so
  they stay on the default (hidden) for now. To make them both correct and hidden, lower those cameras to about
  tyre-top height (≤ ~0.6 m). Or accept the visible far wheels by passing `carCamera(car, cam, z)`.


## True perspective, every shot (feat/v2-far-side-2)

Every side-view car is now drawn from its scene's real camera (`carCamera(car, cam, z, { x, facing })`, which also sets the optical axis for the horizontal convergence and uses the lens's true distance for dollied/zoomed cameras). Lift = the far front wheel centre above the near one. "Far tyre over near" = how much of the far tyre shows above the near tyre top. "Endplate" = how far the far front endplate top sits above the near one (the swept wing surface fills the space between). Values are for the shot's representative car distance; the convergence toward the axis (a horizontal shift of (1 − s)·(axis − x)) is not in the table. Frames: `shots-true-perspective.png`.

| shot | car | camera h, z | elevation | far wheel lift | far tyre over near | far front endplate over near |
|---|---|---|---|---|---|---|
| default (no camera) | Mercedes-AMG W12 | —, 10.0 m | 1.0° | 0.02 m | hidden | 0.04 m |
| helmet long lens (1.2/1.4 cards, 4.2, 5.1e, 5.7) | Red Bull RB16B | 0.95 m, 20.0 m | 1.8° | 0.05 m | 0.02 m | 0.06 m |
| 1.2 tower (bars 11–12), PRO | McLaren-Honda MP4/5 | 3.00 m, 8.0 m | 18.5° | 0.50 m | 0.44 m | 0.39 m |
| 1.2 tower, SEN | McLaren-Honda MP4/5 | 3.00 m, 11.0 m | 13.7° | 0.38 m | 0.34 m | 0.30 m |
| 1.2 kerb (bars 13–14), PRO | McLaren-Honda MP4/5 | 0.45 m, 5.5 m | 1.3° | 0.03 m | hidden | 0.02 m |
| 1.2 kerb, SEN | McLaren-Honda MP4/5 | 0.45 m, 8.5 m | 0.9° | 0.02 m | hidden | 0.01 m |
| 1.4 crash panel, SEN | McLaren-Honda MP4/5 | 2.20 m, 8.0 m | 13.2° | 0.35 m | 0.29 m | 0.27 m |
| 1.4 crash panel, PRO (yawed) | McLaren-Honda MP4/5 | 2.20 m, 10.0 m | 10.6° | 0.29 m | 0.24 m | 0.22 m |
| 1.7/1.8 Turn 1, SEN | McLaren-Honda MP4/5B | 1.80 m, 8.0 m | 10.5° | 0.27 m | 0.22 m | 0.21 m |
| 1.7/1.8 Turn 1, PRO | Ferrari 641 | 1.80 m, 10.1 m | 8.3° | 0.22 m | 0.18 m | 0.21 m |
| 2.2 chase / 2.3 / 2.5 / 2.6, HAM | McLaren-Mercedes MP4-23 | 2.60 m, 10.5 m | 12.4° | 0.29 m | 0.26 m | 0.26 m |
| 2.5 Junção, GLO | Toyota TF108 | 2.60 m, 16.0 m | 8.2° | 0.20 m | 0.18 m | 0.18 m |
| 2.6 champion moment | McLaren-Mercedes MP4-23 | 1.40 m, 14.2 m | 4.5° | 0.11 m | 0.08 m | 0.09 m |
| 3.3 impact cam | Haas VF-20 | 3.20 m, 8.6 m | 18.4° | 0.47 m | 0.42 m | 0.54 m |
| 3.4–3.6 / finale wreck cam, cell | Haas VF-20 | 3.20 m, 7.5 m | 20.9° | 0.53 m | 0.47 m | 0.60 m |
| 4.3 restart, VER | Red Bull RB16B | 2.90 m, 12.2 m | 11.9° | 0.31 m | 0.27 m | 0.37 m |
| 5.1b wheel level, HAM | Mercedes-AMG W12 | 0.30 m, 10.0 m | -0.2° | −0.01 m | hidden | 0.00 m |
| 5.1c low tracking, HAM | Mercedes-AMG W12 | 1.10 m, 10.0 m | 4.3° | 0.11 m | 0.06 m | 0.13 m |
| 5.1c low tracking, VER | Red Bull RB16B | 1.10 m, 12.5 m | 3.5° | 0.09 m | 0.05 m | 0.12 m |
| 5.3 T5 panel, HAM | Mercedes-AMG W12 | 2.90 m, 10.0 m | 14.4° | 0.37 m | 0.32 m | 0.43 m |
| 5.3 T5 panel, VER | Red Bull RB16B | 2.90 m, 12.5 m | 11.6° | 0.31 m | 0.27 m | 0.36 m |
| 5.4 wide (92–93), HAM | Mercedes-AMG W12 | 2.90 m, 9.6 m | 14.9° | 0.38 m | 0.33 m | 0.45 m |
| 5.4 wide, VER | Red Bull RB16B | 2.90 m, 12.6 m | 11.5° | 0.31 m | 0.27 m | 0.36 m |
| 5.4 long lens (94–95), HAM | Mercedes-AMG W12 | 5.00 m, 34.6 m | 7.7° | 0.22 m | 0.20 m | 0.26 m |
| 5.4 long lens, VER | Red Bull RB16B | 5.00 m, 37.6 m | 7.1° | 0.20 m | 0.19 m | 0.24 m |
| 5.6 finish side close-up, VER | Red Bull RB16B | 2.90 m, 11.0 m | 13.1° | 0.34 m | 0.30 m | 0.41 m |

Reference photo cameras (sheets, Art check):
- 2021 Mercedes-AMG W12: 17.7°, 18 m
- 2021 Red Bull RB16B: 16.1°, 19 m
- 2020 Haas VF-20: 21.5°, 54 m
- 2020 AlphaTauri AT01: 8.1°, 30 m
- 2008 Toro Rosso STR3: 5.0°, 24 m
- 2008 McLaren-Mercedes MP4-23: 3.8°, 22 m
- 2008 Toyota TF108: 1.9°, 28 m
- 2008 Ferrari F2008: 6.5°, 26 m
- 1989 McLaren-Honda MP4/5: 11.5°, 30 m
- 1990 Ferrari 641: 5.1°, 38 m

Panels without a scene camera: the cockpit/helmet close-ups (1.2/1.4 helmet cards, 4.2, 5.1e, 5.7) use `HELMET_LENS` (0.95 m, 20 m, 1.8°); the sheets, Cars-States and the Art check use each car's photo camera (above); only the outro 6.1 ④ panel (blank RB16B → RB18) keeps the default (1°, 10 m).
