// 2022 Red Bull RB18 (VER #1), for the outro's 2021 → 2022 turn-over (#24). Traced from Lukas Raich's side-on photo
// "FIA F1 Austria 2022 Nr. 1 Verstappen (side)" (Commons, CC BY-SA 4.0), the same series as the 2021 traces. The
// photo was taken on a panning shot with the car rolled 6.9° on the frame; it is levelled with a rotation about the
// near wheel centres (`references/cars-2022/rb18-side-rectified.jpg`, docs/assets/reference-register.md), which puts
// both near tyres at one size (r 108 px). Scale from the 2022 18-inch tyre (0.72 m): 300 px per metre.
//
// The 2022 shape against the RB16B (what a fan checks): 18-inch wheels with flat covers and a thin sidewall band
// (`rim: "dark"`), the sidepod falling steeply from a high, square inlet to the floor (deep undercut), the engine cover
// sloping down from a taller airbox with the T-camera on top, the rounded one-piece rear wing (no separate endplate
// corners) with a beam wing under it, and the high front wing hanging off a long low nose.
// Livery as colour blocks (ART-5, ART-8): matte navy, an orange airbox front running into a red block over the cover
// (the charging bull's mass, not its outline), the yellow-orange nose, a red pinstripe along the sidepod top and two
// red dashes on the chassis, the red endplate panel; the red 1 on the cover, low and forward of the rear wing.
import type { CarSpec, Driver } from "./spec";
import { PIRELLI_2021 } from "./cars-2021";

/** VER in 2022: the champion's number 1 and his helmet as on the reference photo (silver crown, red and yellow sides). */
export const VER_2022: Driver = {
  number: "1",
  helmet: { base: "#d3d5db", stripe: "#d72a2e", trim: "#f5a623" },
};

export const RB18: CarSpec = {
  name: "2022 Red Bull RB18",
  reference: "references/cars-2022/rb18-side-rectified.jpg",
  frame: { x: 1853, ground: 808, k: 250 / 300 },
  driver: VER_2022,
  paint: {
    cover: "#272b4f",
    chassis: "#20244a",
    sidepod: "#1a1d3e",
    undercut: "#0b0c1e",
    wing: "#15172f",
    frontDeck: "#1a1d3e",
    rearTop: "#1b1d3a",
  },
  livery: [
    // orange airbox front and the red block over the engine cover, edged in orange as on the car
    {
      d: "M 1074 446 C 1076 440 1082 436 1095 436 L 1172 434 C 1210 432 1262 436 1300 448 C 1360 466 1420 488 1452 512 C 1464 524 1472 538 1474 550 C 1420 547 1330 544 1240 543 C 1170 542 1110 545 1066 549 L 1070 500 Z",
      color: "#f7923a",
    },
    {
      d: "M 1168 442 C 1210 440 1258 444 1296 456 C 1352 474 1408 494 1438 516 C 1452 528 1460 538 1464 546 C 1410 542 1330 538 1250 536 C 1200 528 1170 506 1156 486 Z",
      color: "#e8302a",
    },
  ],
  accents: [
    // yellow-orange nose top
    {
      d: "M 100 694 C 140 668 230 640 330 614 L 392 598 L 398 628 C 320 650 230 678 150 704 L 108 708 Z",
      color: "#fdb746",
    },
    // red pinstripe along the sidepod top, and the two red dashes on the chassis
    {
      d: "M 878 578 C 980 586 1100 598 1226 614 L 1224 620 C 1100 605 980 592 876 584 Z",
      color: "#e3262b",
    },
    { d: "M 535 582 L 627 582 L 627 590 L 535 590 Z", color: "#e3262b" },
    { d: "M 735 584 L 797 584 L 797 592 L 735 592 Z", color: "#e3262b" },
  ],
  nearWheels: [
    { cx: 430, cy: 700, r: 108 },
    { cx: 1603, cy: 700, r: 108 },
  ],
  farWheels: [
    { cx: 536, cy: 572, r: 100 },
    { cx: 1650, cy: 578, r: 100 },
  ],
  rimR: 70,
  rim: "dark",
  compound: PIRELLI_2021.soft,
  body:
    "M 100 694 C 140 668 230 640 330 614 C 400 596 450 570 510 556 L 600 541 L 700 534 L 760 530 L 1000 528 L 1068 526 " +
    "L 1072 500 C 1072 470 1074 452 1080 442 L 1095 436 L 1190 433 L 1250 437 L 1300 446 L 1350 456 L 1420 469 L 1480 485 " +
    "L 1545 502 L 1600 532 L 1660 565 L 1700 592 L 1842 600 L 1846 655 L 1720 670 L 1700 700 L 1520 765 L 1490 790 " +
    "L 600 796 L 585 790 L 576 702 C 470 702 360 704 260 706 C 190 708 140 710 104 708 Z",
  regions: {
    cover:
      "M 1068 440 L 1190 433 L 1300 446 L 1420 469 L 1545 502 L 1660 565 L 1720 640 C 1600 652 1460 642 1350 630 C 1250 622 1140 604 1060 594 Z",
    sidepod:
      "M 752 600 C 800 586 900 580 1000 586 C 1130 596 1250 620 1350 630 C 1460 642 1600 652 1720 640 L 1700 700 L 1520 750 C 1300 740 1100 724 960 704 C 880 686 800 660 756 644 Z",
    undercut:
      "M 576 652 L 756 644 C 800 660 880 686 960 704 C 1100 724 1300 740 1520 750 L 1490 792 L 600 798 L 585 790 Z",
    chassis:
      "M 400 600 L 510 556 L 600 541 L 760 530 L 1068 526 L 1060 594 C 1000 586 900 580 800 588 L 752 600 L 756 644 L 576 652 L 576 702 L 400 704 Z",
  },
  glints: [
    "M 820 590 C 900 588 980 592 1060 600 L 1058 607 C 980 600 900 596 820 597 Z",
    "M 1100 440 L 1160 438 L 1150 446 L 1104 448 Z",
  ],
  floor: "M 590 788 L 1495 778 L 1492 790 L 595 798 Z",
  frontWing: {
    // the near endplate, low and curved; the far one is its copy with its top edge showing above the near one (ART-17)
    near: "M 92 688 L 296 642 L 300 742 L 286 784 L 150 788 L 112 764 L 88 722 Z",
    farFrom: { dx: 60, dy: -84, scale: 0.88 },
    // the high 2022 wing elements sweep up to the nose; drawn as one surface behind it (ART-12)
    deck: "M 140 600 L 300 586 L 296 742 L 280 780 L 150 786 C 118 762 100 730 98 704 C 108 660 124 626 140 600 Z",
    flap: { d: "M 256 590 L 300 586 L 296 742 L 260 744 Z", color: "#d72a2e" },
  },
  rearWing: {
    // the rounded one-piece 2022 wing: the endplate's top runs up into the wing tip, then a straight rear edge; the
    // lower part goes down past the beam wing (ART-17)
    near: "M 1660 452 C 1700 438 1760 424 1808 414 L 1852 452 L 1850 545 L 1840 600 L 1842 652 L 1722 664 L 1690 642 L 1664 600 L 1656 520 Z",
    // red endplate panel, on both endplates (ART-17)
    livery: [
      { d: "M 1657 546 L 1818 546 L 1818 592 L 1662 592 Z", color: "#d72a2e" },
    ],
    farFrom: { dx: 14, dy: -6, scale: 0.95 },
    // the upper flap seen from above as a thin band over the endplate's top
    top: "M 1660 452 C 1700 432 1758 416 1804 404 L 1816 410 L 1808 414 C 1760 424 1700 438 1660 452 Z",
    elements: ["M 1664 478 C 1720 462 1790 450 1848 450"],
    pylon: "M 1624 470 L 1656 464 L 1660 572 L 1630 576 Z",
    beam: "M 1700 640 L 1840 636",
  },
  panelLines: [
    "M 752 600 L 770 594 L 774 640 L 756 644",
    "M 800 586 C 950 584 1100 598 1226 616 C 1360 634 1520 646 1640 650",
    "M 774 640 C 850 680 960 706 1100 722 C 1250 738 1400 748 1500 750",
  ],
  suspension: ["M 430 640 L 580 590", "M 450 760 L 585 720"],
  halo: "M 760 530 C 772 506 792 490 822 484 L 1000 524",
  haloFar: "M 822 472 C 835 467 855 466 875 468 L 1068 490",
  cockpit: {
    headrest: "M 1040 528 C 1042 512 1050 500 1062 498 L 1070 504 L 1068 528 Z",
    hans: { cx: 1005, cy: 530, rx: 46, ry: 14 },
  },
  helmetAt: { cx: 1012, cy: 522, r: 42 },
  mirror: "M 548 520 L 590 518 L 592 532 L 550 535 Z M 568 534 L 572 552",
  // the T-camera on top of the airbox (black on the RB18)
  tcam: "M 1100 436 L 1098 400 L 1150 398 L 1153 436 Z",
  antenna: "M 725 530 L 725 494",
  rainLight: "M 1826 614 L 1842 614 L 1842 628 L 1826 628 Z",
  // the red 1 on the engine cover: x 1480–1522, caps 502–548 in the rectified photo
  numberAt: { x: 1500, y: 548, size: 64, color: "#e5333f" },
  top: { marks: { noseTip: "#fdb746", podStripe: "#e3262b" } },
};
