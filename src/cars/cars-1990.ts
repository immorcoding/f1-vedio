// 1990 cars at Suzuka: Ferrari 641 (PRO #1) and McLaren-Honda MP4/5B (SEN #27).
//
// Ferrari 641: traced from a side-on photo of a 641/2 at the Goodwood Festival of Speed 2017 (Neil, Flickr via
// Wikimedia Commons, CC BY 2.0), mirrored to face left, turned 1.3° so both tyre contact points sit on one ground line
// and scaled to 360 px per metre by the wheelbase (2855 mm): `references/ferrari-1990/f641-side.png`. The tyres come
// out at 0.63 m front and 0.66 m rear, the 1990 Goodyear sizes. Shape and colours checked against the Museo Ferrari
// photos by Morio (CC BY-SA 3.0: right side, front) and the MoMA photo by Bill Abbott (CC BY-SA 2.0). See
// docs/assets/reference-register.md.
//
// Period car (ART-4): no halo, open cockpit with a small tinted windscreen, black 13-inch Speedline rims on Goodyear
// slicks (no coloured band), period full-face helmets. All-red body; the wings are bare black carbon, with the yellow
// block at the top of each rear endplate (ART-12: the front wing stays black as on the real car).
//
// MP4/5B: Senna's 1990 car is the car the MP4/5 trace was taken from (Senna's #27 MP4/5B, cars-1989.ts), so it reuses
// that spec with the 1990 driver.
import { MP4_5, PRO_1989 } from "./cars-1989";
import { roundedBox, symmetric, symmetricSide } from "./plan";
import type { Accent, CarPlan, CarSpec, Driver } from "./spec";

const RED = "#dc1218";
const RED_LIT = "#e8242a";
const RED_SHADE = "#b80e14";
// bare carbon wings and floor
const CARBON = "#232327";
// Agip yellow at the top of the rear endplates (a colour block, no lettering: ART-5)
const YELLOW = "#f4cf00";

// Senna 1990 (Honda F1 Exposition 2015 helmet photo by Morio, CC BY-SA 3.0; Ayrton Senna Integralhelm 1990 by
// Auge=mit, CC BY-SA 4.0): yellow, a green band over the eyeport, a broad dark-blue band at the visor running back
// round the shell, thin green lines under it. Helmet units: centre 0 0, radius 1, facing left, y down.
const SENNA_GREEN = "#0f8a3c";
const SENNA_NAVY = "#14215e";
const SENNA_1990: Accent[] = [
  {
    d: "M -1.1 -0.7 C -0.4 -0.78 0.4 -0.7 1.15 -0.42 L 1.15 -0.12 C 0.4 -0.4 -0.4 -0.47 -1.1 -0.44 Z",
    color: SENNA_GREEN,
  },
  {
    d: "M -1.1 -0.06 C -0.4 -0.08 0.4 -0.04 1.15 0.1 L 1.15 0.4 C 0.4 0.26 -0.4 0.22 -1.1 0.24 Z",
    color: SENNA_NAVY,
  },
  {
    d: "M -1.1 0.3 C -0.4 0.28 0.4 0.32 1.15 0.46 L 1.15 0.52 C 0.4 0.38 -0.4 0.35 -1.1 0.36 Z",
    color: SENNA_GREEN,
  },
];

export const SEN_1990: Driver = {
  number: "27",
  helmet: {
    base: "#f7c600",
    stripe: SENNA_GREEN,
    shell: "classic",
    design: SENNA_1990,
  },
};

// Prost kept his helmet at Ferrari: white, the blue panel round visor and chin, orange-red pin stripes (1990 USA GP
// photo by Stuart Seeger, CC BY 2.0). Champion's number 1.
export const PRO_1990: Driver = { ...PRO_1989, number: "1" };

// Top view in metres (x forward from the rear end, y across). Lengths from the side trace (rear end at photo x 1645:
// rear axle 0.57 m, front axle 3.43 m, nose 4.13 m, sidepods from 0.7 to 2.88 m, cockpit 1.86–2.46 m); widths from the
// Museo Ferrari front photo and the 1990 track (1.80 m front, 1.67 m rear). One body in one piece: the long round
// sidepods reaching forward almost to the front wheels, the narrow nose. Traced as one half, mirrored.
const PLAN_BODY = symmetric([
  [0.05, 0.2],
  [0.45, 0.24],
  [0.72, 0.42],
  [1.1, 0.62],
  [1.6, 0.7],
  [2.45, 0.7],
  [2.78, 0.62],
  [2.88, 0.42],
  [3.05, 0.26],
  [3.45, 0.15],
  [3.9, 0.09],
  [4.12, 0.05],
]);

const F641_PLAN: CarPlan = {
  suspension:
    "M 3.25 0.24 L 3.43 0.78 M 3.6 0.18 L 3.43 0.78 M 3.25 -0.24 L 3.43 -0.78 M 3.6 -0.18 L 3.43 -0.78 " +
    "M 0.82 0.38 L 0.57 0.66 M 0.32 0.22 L 0.57 0.66 M 0.82 -0.38 L 0.57 -0.66 M 0.32 -0.22 L 0.57 -0.66",
  sidepods: PLAN_BODY,
  // the inlets in the rounded fronts of the sidepods
  inlets: [1, -1].map((s) =>
    symmetricSide(s, [
      [2.7, 0.44],
      [2.84, 0.42],
      [2.78, 0.62],
      [2.66, 0.64],
    ]),
  ),
  airbox: roundedBox(1.78, 0, 0.14, 0.2),
  windscreen:
    "M 2.5 -0.2 C 2.64 -0.12 2.64 0.12 2.5 0.2 L 2.57 0.2 C 2.72 0.1 2.72 -0.1 2.57 -0.2 Z",
  // red mirrors on stalks either side of the cockpit
  mirrors: [roundedBox(2.4, 0.4, 0.1, 0.16), roundedBox(2.4, -0.4, 0.1, 0.16)],
  outline: PLAN_BODY,
  livery: [],
  // the black wing either side of the nose, which sits on top of it
  frontWing: {
    deck:
      "M 3.62 -0.84 L 4.12 -0.84 L 4.12 -0.06 L 3.9 -0.09 L 3.62 -0.14 Z " +
      "M 3.62 0.84 L 4.12 0.84 L 4.12 0.06 L 3.9 0.09 L 3.62 0.14 Z",
    flap:
      "M 3.63 -0.82 L 3.74 -0.82 L 3.74 -0.135 L 3.63 -0.14 Z " +
      "M 3.63 0.82 L 3.74 0.82 L 3.74 0.135 L 3.63 0.14 Z",
    endplates: "M 3.6 -0.85 L 4.14 -0.85 M 3.6 0.85 L 4.14 0.85",
  },
  rearWing: {
    top: "M 0 -0.5 L 0.4 -0.5 L 0.4 0.5 L 0 0.5 Z",
    color: CARBON,
    element: "M 0.22 -0.48 L 0.22 0.48",
    endplates: "M -0.02 -0.52 L 0.42 -0.52 M -0.02 0.52 L 0.42 0.52",
  },
  wheels: [
    { x: 3.43, y: -0.9, length: 0.63, width: 0.3 },
    { x: 3.43, y: 0.9, length: 0.63, width: 0.3 },
    { x: 0.57, y: -0.835, length: 0.66, width: 0.38 },
    { x: 0.57, y: 0.835, length: 0.66, width: 0.38 },
  ].map((w) => (w.x > 2 ? { ...w, steer: true } : w)),
  cockpit:
    "M 1.86 -0.23 C 2.0 -0.26 2.25 -0.25 2.46 -0.17 L 2.46 0.17 C 2.25 0.25 2.0 0.26 1.86 0.23 Z",
  helmet: { x: 2.0, r: 0.13 },
};

// Rear endplate: one black plate (ART-17: the far one is its perspective copy, almost wholly hidden).
const REAR_ENDPLATE = "M 1503 503 L 1640 501 L 1640 702 L 1505 718 Z";
// Front endplate: the low black wedge ahead of the front tyre, rising to the back.
const FRONT_ENDPLATE =
  "M 158 822 C 160 814 168 810 178 806 L 305 757 L 342 750 L 344 836 L 166 836 C 158 834 156 828 158 822 Z";

export const F641: CarSpec = {
  name: "1990 Ferrari 641",
  reference: "references/ferrari-1990/f641-side.png",
  frame: { x: 1645, ground: 880, k: 250 / 360 },
  driver: PRO_1990,
  paint: {
    cover: RED_LIT,
    chassis: RED,
    sidepod: RED_SHADE,
    undercut: "#151518",
    wing: CARBON,
    frontDeck: CARBON,
    rearTop: "#2c2d31",
    mirror: RED,
  },
  livery: [],
  accents: [
    // the sidepod inlet, seen from the side as a dark red recess ahead of the sidepod
    {
      d: "M 524 700 C 550 694 580 692 610 692 L 610 828 L 540 822 C 530 790 526 740 524 700 Z",
      color: "#7e0a0f",
    },
    // cooling outlet slot in the sidepod flank
    {
      d: "M 760 706 C 760 702 763 700 767 700 L 798 700 C 802 700 804 703 804 707 L 804 744 C 804 748 801 750 797 750 L 766 750 C 762 750 760 747 760 743 Z",
      color: "#1b1b1e",
    },
    // airbox intake lip above the driver's head
    {
      d: "M 972 514 C 974 504 980 499 990 498 L 996 500 C 988 516 984 536 983 562 L 972 564 Z",
      color: "#1b1b1e",
    },
  ],
  nearWheels: [
    { cx: 411, cy: 767, r: 113 },
    { cx: 1438, cy: 762, r: 118 },
  ],
  farWheels: [
    { cx: 650, cy: 712, r: 108 },
    { cx: 1530, cy: 710, r: 113 },
  ],
  rimR: 62,
  rim: "dark",
  // Goodyear slicks: plain black sidewalls (the lettering is a logo, ART-5), so no compound band.
  body:
    "M 178 812 C 260 782 400 722 520 668 C 580 646 650 634 700 631 L 760 640 L 975 642 L 975 516 " +
    "C 976 504 982 498 995 497 L 1040 496 C 1120 498 1200 518 1280 553 C 1340 580 1390 606 1432 630 " +
    "L 1480 660 L 1556 718 L 1615 718 L 1656 772 L 1648 830 L 1340 832 L 610 828 L 520 818 L 420 818 " +
    "L 300 826 L 178 826 Z",
  regions: {
    // the lit top, nose to engine cover, one surface down to the sidepod shoulder
    cover:
      "M 140 470 L 1680 470 L 1680 712 C 1400 704 1150 698 960 698 C 800 694 700 694 612 694 L 520 702 L 140 806 Z",
    // the lower sidepod flank curving under, in shade
    sidepod:
      "M 610 772 C 900 766 1300 766 1680 772 L 1680 812 C 1300 812 900 812 610 814 Z",
    // the undercut at the foot of the sidepod and the black diffuser under the gearbox
    undercut:
      "M 520 814 C 900 812 1300 812 1680 812 L 1680 860 L 520 860 Z " +
      "M 1560 792 L 1656 784 L 1656 830 L 1560 830 Z",
    // the upper sidepod flank and the sides of the nose below the shoulder
    chassis:
      "M 140 806 L 520 702 L 612 694 C 700 694 800 694 960 698 C 1150 698 1400 704 1680 712 L 1680 772 " +
      "C 1300 766 900 766 610 772 L 610 860 L 140 860 Z",
  },
  glints: [
    // along the nose and the cockpit side
    "M 556 656 C 600 645 650 638 700 636 L 700 643 C 650 645 600 652 558 663 Z",
    // the engine cover crown
    "M 1000 506 C 1050 504 1100 507 1150 515 L 1148 522 C 1100 514 1050 512 1000 513 Z",
    // the sidepod shoulder
    "M 640 694 C 800 690 1000 688 1150 690 C 1230 692 1290 696 1330 702 L 1328 709 C 1290 703 1230 699 1150 697 C 1000 695 800 697 640 701 Z",
  ],
  floor: "M 560 828 L 1330 834 L 1328 850 L 566 846 Z",
  frontWing: {
    near: FRONT_ENDPLATE,
    // far endplate: the same plate across the car, all but hidden behind the near one (ART-17)
    farFrom: { dx: 8, dy: -6, scale: 0.98 },
    deck: "M 172 810 L 300 762 L 342 754 L 342 832 L 172 832 Z",
    // the wing is bare black carbon on the real car, flap included (ART-12)
    flap: { d: "M 302 762 L 342 754 L 342 800 L 304 802 Z", color: "#34353a" },
  },
  rearWing: {
    near: REAR_ENDPLATE,
    // the far endplate shows only as a sliver above the near one (ART-17)
    farFrom: { dx: 4, dy: -5, scale: 0.99 },
    livery: [
      { d: "M 1503 503 L 1640 501 L 1640 545 L 1503 547 Z", color: YELLOW },
    ],
    // the wing elements in profile along the top of the endplate
    top: "M 1497 504 L 1646 492 L 1652 502 L 1500 512 Z",
    elements: [],
    pylon: "M 1560 690 L 1590 690 L 1590 716 L 1560 716 Z",
  },
  // sidepod leading edge and the shoulder crease
  panelLines: ["M 610 694 L 610 826", "M 612 694 C 800 690 1100 688 1330 700"],
  suspension: ["M 470 728 L 612 736", "M 470 800 L 612 800"],
  cockpit: {
    opening: "M 752 626 C 800 624 900 624 975 626 L 975 652 L 752 650 Z",
  },
  helmetAt: { cx: 924, cy: 592, r: 52 },
  windscreen: "M 680 634 C 692 621 708 614 728 612 L 762 616 L 762 638 Z",
  mirror:
    "M 752 600 L 772 598 L 774 626 L 754 628 Z M 763 628 L 763 650 " +
    "M 822 590 L 848 588 L 849 610 L 823 612 Z M 834 612 L 834 640",
  numberAt: { x: 1572, y: 678, size: 84 },
  // an all-red car: lighter dots, or the red turns brown
  shade: 0.7,
  top: { plan: F641_PLAN },
};

// The two cars of Suzuka 1990.
export const F641_PRO: CarSpec = { ...F641, driver: PRO_1990 };
export const MP4_5B_SEN: CarSpec = {
  ...MP4_5,
  name: "1990 McLaren-Honda MP4/5B",
  driver: SEN_1990,
};

// The second row of the 1990 Suzuka grid (Jolpica/Ergast 1990 round 15: P3 Mansell #2, P4 Berger #28), seen only
// from above on the grid in shot 1.6, so their helmets carry just the base and crown colours (default design).
// Mansell: white with a red crown (1990 Jerez pit-stop photo, United Autosports, CC BY-SA 2.0). Berger: dark navy with
// a white band over the crown and red sides (Honda F1 Exposition 2015 helmet photo by Morio, CC BY-SA 3.0).
export const MAN_1990: Driver = {
  number: "2",
  helmet: { base: "#f3f3f0", stripe: "#d81a1f", shell: "classic" },
};
export const BER_1990: Driver = {
  number: "28",
  helmet: {
    base: "#15182a",
    stripe: "#f3f3f0",
    trim: "#d81a1f",
    shell: "classic",
  },
};
export const F641_MAN: CarSpec = { ...F641, driver: MAN_1990 };
export const MP4_5B_BER: CarSpec = { ...MP4_5B_SEN, driver: BER_1990 };
