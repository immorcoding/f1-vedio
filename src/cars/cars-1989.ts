// 1989 McLaren-Honda MP4/5 (SEN #1, PRO #2). Traced from a side-on photo of Senna's MP4/5B (#27, 1990) in the
// Instituto Ayrton Senna display, Flickr, CC BY 2.0, rectified with a homography on the near wheels so both axles and
// tyres stand at their real size (`references/mclaren-1989/mp45b-side-rectified.png`, 360 px per metre). The 5B
// shares the 1989 tub, bodywork and livery; its wheelbase is 44 mm longer (2940 vs 2896 mm), under 2 % and kept.
// 1989 details from 1989 race photos by lajotaylape (Flickr, CC BY-SA 2.0: Spa and Suzuka 1989), the Honda
// Collection Hall photos by Morio (CC BY-SA 3.0): the taller "sail" front endplates, the sidepod grille.
// See docs/assets/reference-register.md.
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

// Top view in metres (x forward from the rear end, y across). Positions along the car from the side trace (front
// axle 3.47 m, rear axle 0.53 m from the rear end, nose tip 4.13 m); track 1.82 m front / 1.67 m rear (1989 figures),
// widths from the front and rear Honda Collection Hall photos. One body in one piece, traced as one half, mirrored.
const PLAN_BODY = symmetric([
  [0.12, 0.2],
  [0.55, 0.26],
  [0.75, 0.4],
  [1.15, 0.6],
  [1.6, 0.7],
  [2.05, 0.7],
  [2.18, 0.62],
  [2.22, 0.42],
  [2.75, 0.4],
  [3.15, 0.3],
  [3.6, 0.17],
  [3.95, 0.12],
  [4.13, 0.07],
]);

const MP4_5_PLAN: CarPlan = {
  // wishbones from the tub to each wheel
  suspension:
    "M 3.3 0.26 L 3.47 0.78 M 3.62 0.2 L 3.47 0.78 M 3.3 -0.26 L 3.47 -0.78 M 3.62 -0.2 L 3.47 -0.78 " +
    "M 0.78 0.38 L 0.53 0.66 M 0.3 0.22 L 0.53 0.66 M 0.78 -0.38 L 0.53 -0.66 M 0.3 -0.22 L 0.53 -0.66",
  sidepods: PLAN_BODY,
  // inlets in the front of the sidepods, the airbox above the driver's head
  inlets: [1, -1].map((s) =>
    symmetricSide(s, [
      [2.02, 0.46],
      [2.17, 0.44],
      [2.15, 0.6],
      [2.0, 0.66],
    ]),
  ),
  airbox: roundedBox(1.92, 0, 0.14, 0.2),
  windscreen:
    "M 2.6 -0.22 C 2.74 -0.14 2.74 0.14 2.6 0.22 L 2.67 0.22 C 2.82 0.12 2.82 -0.12 2.67 -0.22 Z",
  // red mirror housings on short stalks
  mirrors: [
    roundedBox(2.42, 0.42, 0.1, 0.16),
    roundedBox(2.42, -0.42, 0.1, 0.16),
  ],
  outline: PLAN_BODY,
  livery: [
    // red nose top ending in a point, ahead of the cockpit
    {
      d: "M 2.4 -0.4 L 3.15 -0.3 L 3.45 0 L 3.15 0.3 L 2.4 0.4 L 2.62 0 Z",
      color: RED,
    },
    // red rear of the sidepods and engine cover, cut on the diagonal like the side view
    {
      d: "M 0.12 -0.2 L 0.55 -0.26 L 0.75 -0.4 L 1.15 -0.6 L 1.32 -0.66 L 0.9 0 L 1.32 0.66 L 1.15 0.6 L 0.75 0.4 L 0.55 0.26 L 0.12 0.2 Z",
      color: RED,
    },
  ],
  // the two halves of the front wing either side of the nose, which sits on top of it; all white
  frontWing: {
    deck:
      "M 3.7 -0.7 L 4.22 -0.7 L 4.22 -0.07 L 3.95 -0.12 L 3.7 -0.15 Z " +
      "M 3.7 0.7 L 4.22 0.7 L 4.22 0.07 L 3.95 0.12 L 3.7 0.15 Z",
    flap:
      "M 3.71 -0.68 L 3.81 -0.68 L 3.81 -0.145 L 3.71 -0.15 Z " +
      "M 3.71 0.68 L 3.81 0.68 L 3.81 0.145 L 3.71 0.15 Z",
    endplates: "M 3.68 -0.7 L 4.24 -0.7 M 3.68 0.7 L 4.24 0.7",
  },
  rearWing: {
    top: "M 0 -0.5 L 0.46 -0.5 L 0.46 0.5 L 0 0.5 Z",
    color: RED,
    element: "M 0.26 -0.48 L 0.26 0.48",
    // red endplates, as in the side view
    endplates: "M -0.02 -0.52 L 0.48 -0.52 M -0.02 0.52 L 0.48 0.52",
    endplateColor: RED,
  },
  wheels: [
    { x: 3.47, y: -0.91, length: 0.635, width: 0.3, steer: true },
    { x: 3.47, y: 0.91, length: 0.635, width: 0.3, steer: true },
    { x: 0.53, y: -0.835, length: 0.66, width: 0.38 },
    { x: 0.53, y: 0.835, length: 0.66, width: 0.38 },
  ],
  cockpit:
    "M 1.95 -0.24 C 2.1 -0.27 2.35 -0.26 2.55 -0.18 L 2.55 0.18 C 2.35 0.26 2.1 0.27 1.95 0.24 Z",
  helmet: { x: 2.1, r: 0.13 },
};

// Rear endplate, red with the race number (ART-17: the far one is its perspective copy).
const REAR_ENDPLATE = "M 1500 525 L 1665 518 L 1662 682 L 1500 700 Z";

export const MP4_5: CarSpec = {
  name: "1989 McLaren-Honda MP4/5",
  reference: "references/mclaren-1989/mp45b-side-rectified.png",
  frame: { x: 1668, ground: 880, k: 250 / 360 },
  driver: SEN_1989,
  paint: {
    cover: "#f7f6f2",
    chassis: "#f1efea",
    sidepod: "#ebe9e3",
    undercut: "#151518",
    wing: "#f3f1ec",
    frontDeck: "#efede8",
    rearTop: "#f2f0eb",
    mirror: RED,
  },
  livery: [
    // the chevron: red over the nose top and the chassis in front of the cockpit, cut on a diagonal at the back
    { d: "M 540 600 L 806 590 L 728 694 L 556 698 Z", color: RED },
    // red lower rear of the sidepod rising on the diagonal to the engine cover, round the gearbox
    {
      d: "M 1190 702 L 1300 700 L 1380 652 L 1440 626 L 1520 616 L 1630 636 L 1630 840 L 1190 816 Z",
      color: RED,
    },
  ],
  wingLivery: [],
  accents: [
    // radiator outlet grille on the sidepod flank
    {
      d: "M 1086 703 L 1190 702 L 1190 792 L 1089 793 Z",
      color: "#2c2d31",
    },
    // airbox intake lip above the driver's head
    {
      d: "M 976 492 C 978 485 982 481 990 481 L 997 484 C 990 500 986 520 985 545 L 976 547 Z",
      color: "#1b1b1e",
    },
  ],
  nearWheels: [
    { cx: 420, cy: 766, r: 114 },
    { cx: 1478, cy: 761, r: 119 },
  ],
  farWheels: [
    { cx: 650, cy: 645, r: 108 },
    { cx: 1430, cy: 642, r: 112 },
  ],
  rimR: 58,
  rim: "dark",
  // Goodyear slicks: plain black sidewalls (the lettering is a logo, ART-5), so no compound band.
  body:
    "M 180 778 C 260 750 360 700 450 660 C 520 630 590 612 640 606 L 760 598 L 800 600 L 832 630 L 975 632 " +
    "L 975 500 C 976 488 980 482 990 481 L 1010 481 C 1120 488 1250 528 1400 590 L 1460 618 L 1610 640 " +
    "L 1614 818 L 600 822 L 520 792 L 440 772 L 330 788 L 180 794 Z",
  regions: {
    cover:
      "M 975 470 L 1010 470 C 1120 478 1250 520 1410 585 L 1470 615 L 1640 640 L 1640 692 L 870 690 L 870 636 L 975 636 Z",
    sidepod: "M 870 690 L 1640 692 L 1640 840 L 870 840 Z",
    undercut: "M 540 690 L 870 690 L 870 830 L 540 830 Z",
    chassis:
      "M 150 760 L 450 650 L 640 596 L 975 590 L 975 690 L 540 690 L 440 790 L 150 800 Z",
  },
  glints: [
    "M 600 618 L 740 604 L 738 611 L 602 625 Z",
    "M 1330 690 L 1440 634 L 1446 641 L 1337 697 Z",
  ],
  floor: "M 600 814 L 1420 815 L 1418 829 L 604 828 Z",
  frontWing: {
    // tall at the back, sloping down to the front, as on the 1989 car
    near: "M 150 790 L 335 745 L 337 822 L 150 822 Z",
    // far endplate: the near one seen across the car (ART-17)
    farFrom: { dx: 290, dy: -150, scale: 0.85 },
    deck: "M 150 792 L 335 758 L 560 660 L 445 668 C 330 700 220 745 150 792 Z",
    // the whole wing is white on the real car (ART-12)
    flap: { d: "M 330 760 L 560 662 L 566 672 L 336 772 Z", color: "#e9e7e1" },
  },
  rearWing: {
    near: REAR_ENDPLATE,
    farFrom: { dx: -12, dy: -50, scale: 0.96 },
    livery: [{ d: REAR_ENDPLATE, color: RED }],
    top: "M 1486 478 L 1636 471 L 1665 518 L 1500 525 Z",
    elements: [],
    pylon: "M 1556 640 L 1590 640 L 1590 702 L 1556 702 Z",
  },
  panelLines: ["M 870 692 L 870 808", "M 872 690 C 1000 690 1150 692 1300 696"],
  suspension: ["M 430 722 L 640 690", "M 440 790 L 640 760"],
  cockpit: {
    opening: "M 836 602 L 975 596 L 975 634 L 836 634 Z",
  },
  helmetAt: { cx: 921, cy: 581, r: 52 },
  windscreen: "M 700 604 C 712 588 730 580 760 578 L 800 580 L 800 602 Z",
  mirror: "M 788 600 L 816 598 L 818 622 L 790 624 Z M 803 624 L 805 634",
  numberAt: { x: 1585, y: 660, size: 70 },
  top: { plan: MP4_5_PLAN },
};

// The two cars of 1989, one spec (CarSpec.driver).
export const MP4_5_SEN: CarSpec = { ...MP4_5, driver: SEN_1989 };
export const MP4_5_PRO: CarSpec = { ...MP4_5, driver: PRO_1989 };
