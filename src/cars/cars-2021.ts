// 2021 Mercedes W12 (HAM #44) and Red Bull RB16B (VER #33), traced from side-on photos by Lukas Raich,
// "FIA F1 Austria 2021 Nr. 44 Hamilton (side)" and "Nr. 33 Verstappen (side)", Wikimedia Commons, CC BY-SA 4.0.
// These two are the settled art standard (ART-7, docs/shape/references/cars-2021-sheet.png).
import type { CarSpec } from "./spec";

// Pirelli 2021 sidewall bands.
export const PIRELLI_2021 = { soft: "#e3262b", hard: "#f4f4f4" };

export const W12: CarSpec = {
  name: "2021 Mercedes-AMG W12",
  reference:
    "references/cars-2021/FIA_F1_Austria_2021_Nr._44_Hamilton_side.jpg",
  frame: { x: 1900, ground: 848, k: 0.8 },
  driver: { number: "44", helmet: { base: "#5b2d8e", stripe: "#f4f4f4" } },
  paint: {
    cover: "#5d6168",
    chassis: "#18181b",
    sidepod: "#121214",
    undercut: "#060607",
    wing: "#141416",
    frontDeck: "#1d1d20",
    rearTop: "#2a2b2f",
  },
  // red airbox cover ahead of the silver engine cover
  livery: [
    {
      d: "M 1034 468 C 1060 458 1100 458 1140 460 L 1340 461 L 1296 528 L 1034 530 Z",
      color: "#8e1430",
    },
  ],
  accents: [
    {
      d: "M 530 645 C 650 642 760 636 810 640 C 850 650 880 672 892 700 L 880 702 C 866 678 840 660 806 652 C 750 648 650 652 530 655 Z",
      color: "#00a19b",
    },
    {
      d: "M 960 722 C 1080 735 1250 738 1375 712 L 1378 721 C 1250 748 1080 746 958 732 Z",
      color: "#00a19b",
    },
  ],
  haloAccent: { d: "M 800 498 C 820 493 840 494 868 500", color: "#00a19b" },
  nearWheels: [
    { cx: 475, cy: 740, r: 105 },
    { cx: 1642, cy: 743, r: 106 },
  ],
  farWheels: [
    { cx: 452, cy: 592, r: 95 },
    { cx: 1585, cy: 590, r: 98 },
  ],
  // From a trackside camera the far side reads as on the STR3 (user, 2026-10-04): the far wheels hidden behind the
  // near ones, the far front endplate a sliver over the near one, the wing seen side-on, its elements rising from the
  // endplate to the nose (ART-26).
  farSide: {
    // HIGH camera: the car as traced (the photo camera looks down ~18°, like the MV's 2.6–3.2 m cameras); the far
    // wheels at 80% of the traced lift (user review 2026-10-04: still peeking, a little lower), x at the near wheels.
    high: {
      wheels: [
        { cx: 452, cy: 622, r: 95 },
        { cx: 1585, cy: 621, r: 98 },
      ],
    },
    low: {
      wheels: [
        { cx: 469, cy: 732, r: 101 },
        { cx: 1636, cy: 735, r: 102 },
      ],
      frontEndplate: { dx: 4, dy: -8, scale: 0.95 },
      // LOW camera: the body re-projected from the photo's 17.7° to a 4° trackside camera
      // (seenFrom.ts): the nose drops onto the wing, the floor to the ground, the undercut closes up, the top comes
      // down; the front wing is drawn side-on from the endplate to the nose.
      body: { photoElevation: 17.7, elevation: 4, floorY: 803, podY: 755, noseTo: 620 },
    },
  },
  rimR: 56,
  rim: "dark",
  rimAccent: "#00a19b",
  compound: PIRELLI_2021.hard,
  body:
    "M 127 697 C 200 675 300 645 420 612 C 500 590 560 566 610 556 L 705 552 L 730 566 L 930 566 L 1000 548 L 1030 530 L 1034 468 " +
    "C 1060 458 1100 458 1140 460 L 1340 461 C 1420 470 1520 492 1600 520 L 1640 560 L 1690 610 L 1712 640 L 1700 690 L 1560 760 L 1540 800 " +
    "L 620 800 L 600 790 L 598 700 C 520 706 440 716 360 724 C 280 729 200 730 150 726 L 132 717 Z",
  regions: {
    cover:
      "M 1034 468 C 1060 458 1100 458 1140 460 L 1340 461 C 1420 470 1520 492 1600 520 L 1640 560 L 1600 650 C 1560 630 1500 615 1420 600 C 1300 575 1150 545 1030 530 Z",
    sidepod:
      "M 872 602 C 980 606 1150 628 1300 660 C 1400 680 1480 700 1540 730 L 1520 765 C 1480 768 1440 770 1400 770 C 1200 760 1000 730 892 700 Z",
    undercut:
      "M 598 610 L 870 604 L 892 700 C 1000 730 1200 760 1400 770 L 1545 778 L 1540 800 L 620 800 L 600 790 Z",
    chassis:
      "M 560 560 L 705 552 L 730 566 L 930 566 L 1000 548 L 1030 530 C 1000 560 940 590 872 602 L 598 610 Z",
  },
  glints: [
    "M 1150 468 L 1330 465 L 1316 478 L 1160 483 Z",
    "M 1210 512 L 1252 508 L 1190 560 L 1160 562 Z",
    "M 1290 516 L 1310 514 L 1250 572 L 1236 572 Z",
    "M 900 610 C 1000 616 1150 636 1290 668 L 1286 676 C 1150 646 1000 626 900 620 Z",
    "M 300 652 C 380 628 460 600 560 572 L 564 580 C 460 610 380 638 304 662 Z",
  ],
  floor: "M 600 788 L 1545 798 L 1540 808 L 610 806 Z",
  frontWing: {
    // Both endplates black, as the near one's outer face in the photo (ART-17); the far one is its copy, its top
    // edge where the photo shows it.
    near: "M 152 756 L 330 756 L 330 813 L 317 825 L 162 825 L 147 810 Z",
    farFrom: { dx: -11, dy: -158, scale: 0.93 },
    deck: "M 140 642 L 305 640 L 330 758 L 330 800 L 162 825 C 128 804 102 744 104 712 C 106 698 124 668 140 642 Z",
    flap: { d: "M 262 641 L 305 640 L 330 758 L 282 757 Z", color: "#00a19b" },
  },
  rearWing: {
    // near endplate as in the photo, with the stepped cut-outs along its rear edge (the real shape; user review
    // 2026-10-04). Its front edge is straight, leaving the top front corner at ~70° (measured on the photo's
    // light panel edge, 1690 540 → 1668 600); the near rear wheel covers its lower end.
    near: "M 1695 525 L 1820 526 L 1821 540 L 1838 540 L 1838 552 L 1877 552 L 1847 600 L 1845 673 L 1640 678 Z",
    // far endplate (HIGH; LOW hides it): the near one's copy, lifted where the photo shows it. The tall dark piece above
    // the near endplate, with the curved top and the same steps at the rear, is the far endplate's upper part (user
    // review 2026-10-04): top front corner 1695 525 → ~1667 441, rear tip 1877 552 → ~1835 465; scaled 0.89 (user:
    // 0.95 read too big). Its lower part is behind the near endplate and the engine cover. No separate wing-top block:
    // from this camera the wing planes between the endplates are hidden behind the far endplate's inner face.
    farFrom: { dx: -16, dy: -84, scale: 0.89 },
    elements: [],
    pylon: "M 1640 500 L 1682 500 L 1690 612 L 1650 616 Z",
    beam: "M 1690 600 L 1840 600",
  },
  panelLines: [
    "M 872 604 L 886 604 L 890 700 L 876 700",
    "M 872 602 C 980 606 1150 628 1300 660 C 1400 680 1480 700 1540 730",
    "M 892 700 C 1000 730 1200 760 1400 770",
  ],
  suspension: ["M 470 655 L 610 580", "M 480 760 L 600 680"],
  halo: "M 703 570 C 725 540 760 512 800 508 L 1022 556",
  haloFar: "M 800 497 C 812 492 830 493 840 495 L 1037 523",
  cockpit: {
    headrest: "M 1000 566 C 1002 540 1012 524 1030 522 L 1040 528 L 1036 566 Z",
    hans: { cx: 958, cy: 566, rx: 48, ry: 15 },
  },
  helmetAt: { cx: 962, cy: 554, r: 44 },
  mirror: "M 790 572 L 840 570 L 842 590 L 792 594 Z M 815 592 L 820 606",
  tcam: "M 1052 462 L 1050 432 L 1066 432 L 1068 442 L 1094 442 L 1096 432 L 1112 432 L 1110 462 Z",
  antenna: "M 612 554 L 612 495",
  rainLight: "M 1700 640 L 1716 640 L 1716 654 L 1700 654 Z",
  numberAt: { x: 1500, y: 555 },
  // From above (side and rear reference photos): teal nose tip and sidepod stripe, red airbox top ahead of the silver
  // engine cover.
  top: {
    marks: { noseTip: "#00a19b", coverStripe: "#8e1430", podStripe: "#00a19b" },
  },
};

export const RB16B: CarSpec = {
  name: "2021 Red Bull RB16B",
  reference:
    "references/cars-2021/FIA_F1_Austria_2021_Nr._33_Verstappen_side.jpg",
  frame: { x: 1840, ground: 832, k: 0.8 },
  driver: { number: "33", helmet: { base: "#f5c518", stripe: "#d72a2e" } },
  paint: {
    cover: "#2c3870",
    chassis: "#232d5e",
    sidepod: "#1b2350",
    undercut: "#0b0e22",
    wing: "#161c40",
    frontDeck: "#1b2350",
    rearTop: "#1d2448",
  },
  livery: [],
  accents: [
    {
      d: "M 152 712 C 200 696 250 676 300 660 L 314 702 C 270 714 210 724 158 726 Z",
      color: "#ffcc00",
    },
    { d: "M 1022 444 L 1062 443 L 1082 522 L 1022 540 Z", color: "#ffcc00" },
    { d: "M 500 597 L 640 600 L 640 611 L 500 608 Z", color: "#e3262b" },
    {
      d: "M 960 608 C 1050 616 1150 622 1262 620 L 1264 630 C 1150 634 1050 628 958 619 Z",
      color: "#e3262b",
    },
  ],
  nearWheels: [
    { cx: 458, cy: 728, r: 105 },
    { cx: 1594, cy: 725, r: 106 },
  ],
  farWheels: [
    { cx: 450, cy: 590, r: 96 },
    { cx: 1565, cy: 590, r: 98 },
  ],
  // From a trackside camera the far side reads as on the STR3 (user, 2026-10-04): the far wheels hidden behind the
  // near ones, the far front endplate a sliver over the near one, the wing seen side-on, its elements rising from the
  // endplate to the nose (ART-26).
  farSide: {
    // HIGH camera: the car as traced (the photo camera looks down ~16°, like the MV's 2.6–3.2 m cameras); the far
    // wheels at 80% of the traced lift (user review 2026-10-04: still peeking, a little lower), x at the near wheels.
    high: {
      wheels: [
        { cx: 450, cy: 618, r: 96 },
        { cx: 1565, cy: 617, r: 98 },
      ],
    },
    low: {
      wheels: [
        { cx: 452, cy: 720, r: 101 },
        { cx: 1588, cy: 717, r: 102 },
      ],
      frontEndplate: { dx: 4, dy: -8, scale: 0.95 },
      // LOW camera: the body re-projected from the photo's 16.1° to a 4° trackside camera
      // (seenFrom.ts): the nose drops onto the wing, the floor to the ground, the undercut closes up, the top comes
      // down; the front wing is drawn side-on from the endplate to the nose.
      body: { photoElevation: 16.1, elevation: 4, floorY: 782, podY: 730, noseTo: 600 },
    },
  },
  rimR: 56,
  rim: "spoked",
  compound: PIRELLI_2021.soft,
  body:
    "M 152 712 C 220 690 300 650 420 600 C 470 580 520 560 560 554 L 700 552 L 718 566 L 930 568 L 1000 552 L 1022 540 L 1022 444 " +
    "C 1060 440 1120 440 1200 441 L 1335 437 L 1420 460 L 1555 510 L 1600 560 L 1650 600 L 1690 640 L 1700 690 L 1520 745 L 1490 770 " +
    "L 600 785 L 585 780 L 582 690 C 480 704 380 726 300 734 C 240 739 190 737 162 731 L 158 726 Z",
  regions: {
    cover:
      "M 1022 444 C 1060 440 1120 440 1200 441 L 1335 437 L 1420 460 L 1555 510 L 1600 560 L 1600 650 C 1560 625 1500 600 1420 585 C 1300 560 1150 548 1022 540 Z",
    sidepod:
      "M 870 580 C 980 585 1150 600 1300 625 C 1400 645 1470 670 1520 700 L 1490 750 L 1420 750 C 1200 740 1000 700 886 650 Z",
    undercut:
      "M 582 615 L 870 616 L 886 650 C 1000 700 1200 740 1420 750 L 1495 760 L 1490 770 L 600 785 L 585 780 Z",
    chassis:
      "M 560 556 L 700 552 L 718 566 L 930 568 L 1000 552 L 1022 540 C 990 560 930 575 870 580 L 582 615 Z",
  },
  glints: [
    "M 1100 446 L 1320 441 L 1306 452 L 1110 456 Z",
    "M 900 588 C 1000 594 1150 608 1290 632 L 1286 640 C 1150 618 1000 604 900 598 Z",
  ],
  floor: "M 585 774 L 1495 764 L 1492 776 L 590 788 Z",
  frontWing: {
    // far endplate: the near one's copy, its top edge where the photo shows it (ART-17)
    near: "M 136 752 L 318 752 L 318 809 L 305 822 L 145 822 L 130 807 Z",
    farFrom: { dx: 2, dy: -152, scale: 0.925 },
    deck: "M 135 640 L 305 638 L 318 752 L 318 800 L 145 822 C 118 800 100 744 104 714 C 108 700 122 668 135 640 Z",
    flap: { d: "M 262 639 L 305 638 L 318 752 L 272 752 Z", color: "#d72a2e" },
  },
  rearWing: {
    // near endplate as in the photo: higher at the front, a step down at the rear, curved lower edge
    near: "M 1630 493 L 1743 493 L 1750 506 L 1773 520 L 1827 520 L 1790 603 L 1787 643 L 1760 655 L 1700 662 L 1650 650 L 1610 612 L 1603 597 Z",
    // red endplate panel, on both endplates (ART-17); its front edge on the endplate's front edge (1630 493 → 1603 597),
    // as in the photo (user review 2026-10-04)
    livery: [
      {
        d: "M 1621.4 526 L 1825 524 L 1793 603 L 1602.7 598 Z",
        color: "#d72a2e",
      },
    ],
    // far endplate (HIGH; LOW hides it): the near one's copy, red panel included, lifted where the photo shows it: the
    // tall dark piece above the near endplate is its upper part (user review 2026-10-04). Top front corner 1630 493 →
    // ~1627 414, rear tip 1827 520 → ~1802 438. No separate wing-top block; the wing planes between the endplates come
    // later.
    farFrom: { dx: 0, dy: -79, scale: 0.89 },
    elements: [],
    pylon: "M 1595 455 L 1640 455 L 1645 610 L 1600 612 Z",
    beam: "M 1612 615 L 1788 615",
  },
  panelLines: [
    "M 862 582 L 882 580 L 886 650 L 868 652",
    "M 870 580 C 980 585 1150 600 1300 625 C 1400 645 1470 670 1520 700",
    "M 886 650 C 1000 700 1200 740 1420 750",
  ],
  suspension: ["M 455 640 L 590 585", "M 470 760 L 585 690"],
  halo: "M 693 557 C 715 528 745 503 780 500 L 1018 545",
  haloFar: "M 777 486 C 790 482 805 483 815 485 L 1027 507",
  cockpit: {
    headrest: "M 1002 568 C 1004 545 1012 532 1022 530 L 1030 536 L 1026 566 Z",
    hans: { cx: 960, cy: 566, rx: 48, ry: 15 },
  },
  helmetAt: { cx: 964, cy: 536, r: 44 },
  mirror: "M 780 558 L 822 556 L 824 574 L 782 577 Z M 800 576 L 805 590",
  tcam: "M 1040 446 L 1038 412 L 1054 412 L 1056 422 L 1080 422 L 1082 412 L 1098 412 L 1095 446 Z",
  antenna: "M 545 554 L 545 518 M 535 518 L 556 518",
  rainLight: "M 1650 640 L 1666 640 L 1666 654 L 1650 654 Z",
  // the red "33" on the engine cover below the bull's tail: x 1428–1522, caps 500–553 in the photo
  numberAt: { x: 1475, y: 553, size: 74, color: "#e5333f" },
  // From above (side and rear reference photos): yellow nose tip and red sidepod flash.
  top: { marks: { noseTip: "#ffcc00", podStripe: "#d72a2e" } },
};
