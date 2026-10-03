// 1989 McLaren-Honda MP4/5 (SEN #1, PRO #2), traced from "Alain Prost 1989 Belgian GP" by madagascarica,
// Wikimedia Commons, CC BY 2.0: a near side-on race photo of the real 1989 car (the trace frame is that photo's car
// cropped at x 650–1610, y 500–1040 and scaled ×2, `references/mclaren-1989/prost-1989-spa-2x.png`). Livery
// boundaries, sidepod, mirrors and wheels cross-checked with the Honda Collection Hall MP4/5 photos by Morio
// (CC BY-SA 3.0). Scale from the 1989 wheelbase, 2896 mm = 1072 px. See docs/assets/reference-register.md.
//
// Period car (ART-4): no halo, open cockpit with a small windscreen, 13-inch rims on tall Goodyear slicks with no
// coloured band, period full-face helmets. The two team-mates share this spec and differ only in `driver`.
import { roundedBox, symmetric, symmetricSide } from "./plan";
import type { Accent, CarPlan, CarSpec, Driver } from "./spec";

// Marlboro McLaren fluorescent red-orange and the white body.
const RED = "#ee3a24";

// Helmet designs in helmet units (centre 0 0, radius 1, facing left, y down; see Driver in ./spec).
// Senna 1989: yellow, a green band over the eyeport with a thin blue band under it, a thin green line under the visor
// (Honda F1 Exposition 2015 helmet photos by Morio, CC BY-SA 3.0).
const SENNA_GREEN = "#0f8a3c";
const SENNA_BLUE = "#1d3f95";
const SENNA_DESIGN: Accent[] = [
  {
    d: "M -1.1 -0.66 C -0.4 -0.74 0.4 -0.66 1.15 -0.38 L 1.15 -0.12 C 0.4 -0.4 -0.4 -0.46 -1.1 -0.42 Z",
    color: SENNA_GREEN,
  },
  {
    d: "M -1.1 -0.42 C -0.4 -0.46 0.4 -0.4 1.15 -0.12 L 1.15 -0.01 C 0.4 -0.3 -0.4 -0.35 -1.1 -0.31 Z",
    color: SENNA_BLUE,
  },
  {
    d: "M -1.1 0.15 C -0.5 0.11 0 0.11 0.25 0.13 L 0.25 0.2 C 0 0.18 -0.5 0.18 -1.1 0.23 Z",
    color: SENNA_GREEN,
  },
];

// Prost 1989: white, a blue panel round the visor and chin that sweeps back to a point, orange-red pin stripes
// (Alain Prost Integralhelm 1989, Commons, CC BY-SA 4.0; mirrored to face left).
const PROST_BLUE = "#1f3d9c";
const PROST_ORANGE = "#f05a28";
const PROST_DESIGN: Accent[] = [
  {
    d: "M 0.15 -0.41 L -0.74 -0.47 L -1.05 0.3 L -0.95 0.8 L -0.15 0.8 L 0.3 0.12 L 0.86 0.12 L 0.72 -0.03 L 0.3 -0.03 Z",
    color: PROST_BLUE,
  },
  {
    d: "M 0.75 -0.66 L -0.3 -0.66 L -0.3 -0.6 L 0.75 -0.6 Z",
    color: PROST_ORANGE,
  },
  {
    d: "M 0.9 -0.46 L 0.17 -0.43 L 0.17 -0.38 L 0.9 -0.4 Z",
    color: PROST_ORANGE,
  },
  {
    d: "M 0.88 0.48 L 0.2 0.48 L 0.17 0.54 L 0.88 0.54 Z",
    color: PROST_ORANGE,
  },
];

export const SEN_1989: Driver = {
  number: "1",
  helmet: {
    base: "#f7c600",
    stripe: SENNA_GREEN,
    shell: "classic",
    design: SENNA_DESIGN,
  },
};

export const PRO_1989: Driver = {
  number: "2",
  helmet: {
    base: "#f3f3f0",
    stripe: PROST_BLUE,
    shell: "classic",
    design: PROST_DESIGN,
  },
};

// Top view in metres (x forward from the rear end, y across). Wheelbase 2.896 m, track 1.82 m front / 1.67 m rear
// (1989 figures); positions along the car from the side trace, widths from the front and rear Honda Collection Hall
// photos. The MP4/5 is not the modern planform (CarSpec.top): one body in one piece, traced as one half, mirrored.
const PLAN_BODY = symmetric([
  [0.06, 0.2],
  [0.45, 0.26],
  [0.62, 0.42],
  [1.1, 0.62],
  [1.55, 0.7],
  [2.05, 0.7],
  [2.2, 0.62],
  [2.24, 0.42],
  [2.75, 0.4],
  [3.15, 0.3],
  [3.7, 0.17],
  [4.3, 0.12],
  [4.6, 0.08],
]);

const MP4_5_PLAN: CarPlan = {
  // wishbones from the tub to each wheel
  suspension:
    "M 3.12 0.24 L 3.28 0.78 M 3.42 0.2 L 3.28 0.78 M 3.12 -0.24 L 3.28 -0.78 M 3.42 -0.2 L 3.28 -0.78 " +
    "M 0.62 0.36 L 0.38 0.66 M 0.2 0.22 L 0.38 0.66 M 0.62 -0.36 L 0.38 -0.66 M 0.2 -0.22 L 0.38 -0.66",
  sidepods: PLAN_BODY,
  // inlets in the front of the sidepods, the airbox above the driver's head
  inlets: [1, -1].map((s) =>
    symmetricSide(s, [
      [2.04, 0.46],
      [2.19, 0.44],
      [2.17, 0.6],
      [2.02, 0.66],
    ]),
  ),
  airbox: roundedBox(2.1, 0, 0.14, 0.2),
  windscreen:
    "M 2.7 -0.22 C 2.84 -0.14 2.84 0.14 2.7 0.22 L 2.77 0.22 C 2.92 0.12 2.92 -0.12 2.77 -0.22 Z",
  // red mirror housings on short stalks
  mirrors: [
    roundedBox(2.82, 0.42, 0.1, 0.16),
    roundedBox(2.82, -0.42, 0.1, 0.16),
  ],
  outline: PLAN_BODY,
  livery: [
    // red nose top ending in a point, ahead of the cockpit
    {
      d: "M 2.72 -0.39 L 3.15 -0.3 L 3.75 0 L 3.15 0.3 L 2.72 0.39 L 2.9 0 Z",
      color: RED,
    },
    // red rear of the sidepods and engine cover, cut on the diagonal like the side view
    {
      d: "M 0.06 -0.2 L 0.45 -0.26 L 0.62 -0.42 L 1.1 -0.62 L 1.25 -0.64 L 0.8 0 L 1.25 0.64 L 1.1 0.62 L 0.62 0.42 L 0.45 0.26 L 0.06 0.2 Z",
      color: RED,
    },
  ],
  // the two halves of the front wing either side of the nose, which sits on top of it
  frontWing: {
    deck:
      "M 4.05 -0.7 L 4.6 -0.7 L 4.6 -0.08 L 4.3 -0.12 L 4.05 -0.141 Z " +
      "M 4.05 0.7 L 4.6 0.7 L 4.6 0.08 L 4.3 0.12 L 4.05 0.141 Z",
    // the flap along the whole trailing edge, either side of the nose
    flap:
      "M 4.06 -0.68 L 4.16 -0.68 L 4.16 -0.135 L 4.06 -0.14 Z " +
      "M 4.06 0.68 L 4.16 0.68 L 4.16 0.135 L 4.06 0.14 Z",
    endplates: "M 4.02 -0.7 L 4.62 -0.7 M 4.02 0.7 L 4.62 0.7",
  },
  rearWing: {
    top: "M 0 -0.5 L 0.6 -0.5 L 0.6 0.5 L 0 0.5 Z",
    color: RED,
    element: "M 0.36 -0.48 L 0.36 0.48",
    // red endplates, as in the side view
    endplates: "M -0.02 -0.52 L 0.62 -0.52 M -0.02 0.52 L 0.62 0.52",
    endplateColor: RED,
  },
  wheels: [
    { x: 3.28, y: -0.91, length: 0.635, width: 0.3, steer: true },
    { x: 3.28, y: 0.91, length: 0.635, width: 0.3, steer: true },
    { x: 0.384, y: -0.835, length: 0.66, width: 0.38 },
    { x: 0.384, y: 0.835, length: 0.66, width: 0.38 },
  ],
  cockpit:
    "M 2.25 -0.24 C 2.4 -0.27 2.6 -0.26 2.72 -0.18 L 2.72 0.18 C 2.6 0.26 2.4 0.27 2.25 0.24 Z",
  helmet: { x: 2.36, r: 0.13 },
};

export const MP4_5: CarSpec = {
  name: "1989 McLaren-Honda MP4/5",
  reference: "references/mclaren-1989/prost-1989-spa-2x.png",
  frame: { x: 1826, ground: 732, k: 0.675 },
  driver: SEN_1989,
  paint: {
    cover: "#f7f6f2",
    chassis: "#efede8",
    sidepod: "#ebe9e3",
    undercut: "#151518",
    wing: "#f3f1ec",
    frontDeck: "#ecebe5",
    rearTop: "#f2f0eb",
    mirror: RED,
  },
  livery: [
    // the chevron: red over the nose top and down the chassis flank in front of the cockpit
    { d: "M 520 466 L 814 450 L 738 542 L 520 516 Z", color: RED },
    // rear of the sidepod and engine cover, cut on the diagonal
    {
      d: "M 1322 676 L 1500 487 L 1560 490 L 1680 528 L 1780 540 L 1780 700 L 1322 700 Z",
      color: RED,
    },
  ],
  // red rear-wing endplate
  // airbox intake lip above the driver's head
  accents: [
    {
      d: "M 1003 318 C 1005 311 1009 308 1018 308 L 1026 312 C 1018 330 1013 350 1012 372 L 1003 374 Z",
      color: "#1b1b1e",
    },
  ],
  nearWheels: [
    { cx: 612, cy: 612, r: 120 },
    { cx: 1684, cy: 610, r: 122 },
  ],
  farWheels: [
    { cx: 410, cy: 500, r: 116 },
    { cx: 1468, cy: 514, r: 120 },
  ],
  rimR: 60,
  rim: "dark",
  // Goodyear slicks: plain black sidewalls (the lettering is a logo, ART-5), so no compound band.
  body:
    "M 108 566 L 530 478 L 650 470 L 800 463 L 842 462 L 1003 458 L 1003 316 " +
    "C 1004 310 1008 307 1016 306 L 1040 306 C 1160 318 1330 400 1530 492 L 1640 524 L 1770 540 L 1774 692 " +
    "L 690 694 L 600 690 L 520 560 L 470 530 L 140 612 C 122 606 110 590 108 566 Z",
  regions: {
    cover:
      "M 1003 300 L 1040 300 C 1160 312 1330 395 1540 490 L 1660 520 L 1660 562 L 1330 560 L 1003 552 Z",
    sidepod: "M 1003 552 L 1330 560 L 1660 562 L 1700 700 L 1003 700 Z",
    undercut: "M 560 540 L 735 540 L 1003 550 L 1003 700 L 560 700 Z",
    chassis:
      "M 90 560 L 530 470 L 1003 450 L 1003 552 L 735 540 L 480 560 L 300 640 L 90 640 Z",
  },
  glints: [
    "M 560 486 L 780 474 L 777 481 L 562 493 Z",
    "M 1505 500 L 1522 502 L 1380 662 L 1362 662 Z",
  ],
  floor: "M 690 690 L 1700 694 L 1696 706 L 696 702 Z",
  frontWing: {
    near: "M 240 612 L 470 572 L 482 692 L 240 694 Z",
    // far endplate: the near one seen further away (ART-17)
    farFrom: { dx: -140, dy: -36, scale: 0.95 },
    deck: "M 100 576 L 204 562 L 470 558 L 476 650 L 240 694 C 190 682 140 656 108 628 Z",
    flap: { d: "M 200 562 L 470 556 L 472 574 L 204 580 Z", color: "#d9d6cf" },
  },
  rearWing: {
    near: "M 1505 350 L 1824 348 L 1826 470 L 1650 470 Z",
    // red endplates, both of them (ART-17); the far one hides behind the near one and the wing top
    livery: [
      { d: "M 1505 350 L 1824 348 L 1826 470 L 1650 470 Z", color: RED },
    ],
    farFrom: { dx: -20, dy: -20, scale: 0.95 },
    top: "M 1496 324 L 1700 304 L 1828 334 L 1824 350 L 1505 352 Z",
    elements: [],
    pylon: "M 1600 470 L 1640 470 L 1650 525 L 1610 525 Z",
  },
  panelLines: [
    "M 1003 552 L 1003 690",
    "M 1006 552 C 1150 556 1260 558 1340 558",
  ],
  suspension: ["M 640 560 L 800 500", "M 650 640 L 820 610"],
  cockpit: {
    opening: "M 896 444 L 1003 440 L 1003 460 L 896 462 Z",
  },
  helmetAt: { cx: 955, cy: 408, r: 52 },
  windscreen: "M 836 463 C 846 446 860 438 880 436 L 906 436 L 904 462 Z",
  mirror: "M 770 452 L 808 448 L 810 466 L 772 470 Z M 790 470 L 794 480",
  numberAt: { x: 1700, y: 445, size: 72 },
  top: { plan: MP4_5_PLAN },
};

// The two cars of 1989, one spec (CarSpec.driver).
export const MP4_5_SEN: CarSpec = { ...MP4_5, driver: SEN_1989 };
export const MP4_5_PRO: CarSpec = { ...MP4_5, driver: PRO_1989 };
