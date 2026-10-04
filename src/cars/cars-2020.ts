// 2020 Haas VF-20 (GRO #8) and AlphaTauri AT01 (KVY #26), traced from side-on photos by Artes Max, "2020 Formula One
// tests Barcelona, Haas VF-20, Grosjean" and "... AlphaTauri AT01, Pierre Gasly", Wikimedia Commons, CC BY-SA 2.0.
// The photos show the cars' left sides facing right; the trace photos (`*_side.jpg`) are mirrored to face left like the
// 2021 traces, and rectified with a homography from the Pirelli sidewall bands so both wheel centres sit level at one
// scale (docs/assets/reference-register.md). Tyre diameter 0.672 m sets the scale, as for the 2021 cars.
import type { CarSpec, Driver } from "./spec";

// Pirelli 2020 sidewall bands. At the 2020 Bahrain GP start GRO was on the hard, KVY on the medium (Pirelli race report).
export const PIRELLI_2020 = {
  soft: "#e3262b",
  medium: "#f2c81b",
  hard: "#f4f4f4",
};

// Helmets as seen in the 2020 race photos: GRO white with a blue crown, KVY white with a red crown.
export const GRO_2020: Driver = {
  number: "8",
  helmet: { base: "#f1f1f3", stripe: "#2747b0" },
};
export const KVY_2020: Driver = {
  number: "26",
  helmet: { base: "#f1f1f3", stripe: "#d8262e" },
};

const HAAS_RED = "#d6282d";

export const VF20: CarSpec = {
  name: "2020 Haas VF-20",
  reference:
    "references/cars-2020/2020_tests_Barcelona_Haas_VF-20_Grosjean_side.jpg",
  frame: { x: 1892, ground: 855, k: 0.866 },
  shade: 0.45,
  driver: GRO_2020,
  paint: {
    cover: "#e9eaee",
    chassis: "#161619",
    sidepod: "#e1e2e7",
    undercut: "#09090b",
    wing: "#141417",
    frontDeck: "#1a1a1d",
    rearTop: "#26262a",
  },
  // black shark fin over the white engine cover; red chevron on the nose; the red sidepod lettering as plain slashes
  livery: [
    {
      d: "M 1192 458 L 1360 449 C 1450 458 1520 476 1556 492 L 1600 548 L 1600 588 C 1500 572 1400 545 1330 520 C 1270 498 1225 478 1192 462 Z",
      color: "#17171a",
    },
    { d: "M 586 560 L 618 549 L 646 560 L 622 574 Z", color: HAAS_RED },
    {
      d: "M 1040 676 L 1112 664 L 1104 716 L 1032 726 Z M 1130 662 L 1172 656 L 1160 716 L 1118 720 Z M 1190 652 L 1232 646 L 1218 712 L 1176 716 Z M 1250 642 L 1292 636 L 1276 702 L 1234 708 Z M 1310 632 L 1360 626 L 1340 690 L 1292 698 Z",
      color: HAAS_RED,
    },
  ],
  // red flick on the near front endplate, red top of the rear wing
  // No wing colour blocks: the red diagonal on the near front endplate and the red far rear endplate broke ART-17
  // (endplates of one wing are one shape, coloured alike; the flap carries the red).
  // white top of the nose and of the chassis flank
  accents: [
    {
      d: "M 236 700 C 300 676 420 628 520 592 C 570 574 610 560 640 552 L 646 562 C 612 572 572 586 524 604 C 424 640 306 688 242 712 Z",
      color: "#ecedf1",
    },
    { d: "M 646 570 L 860 572 L 860 582 L 646 580 Z", color: "#ecedf1" },
  ],
  nearWheels: [
    { cx: 572, cy: 758, r: 97 },
    { cx: 1665, cy: 758, r: 97 },
  ],
  farWheels: [
    { cx: 546, cy: 581, r: 92 },
    { cx: 1588, cy: 573, r: 95 },
  ],
  rimR: 53,
  rim: "dark",
  compound: PIRELLI_2020.hard,
  body:
    "M 222 712 C 250 692 320 664 400 632 C 480 600 570 566 640 546 L 772 549 C 784 551 792 560 800 568 C 805 573 810 576 822 576 " +
    "L 952 576 C 976 576 994 568 1010 560 C 1026 552 1044 546 1062 543 L 1062 460 " +
    "L 1150 460 L 1360 449 C 1450 458 1520 476 1556 492 L 1600 540 L 1640 600 L 1700 640 L 1702 690 L 1590 760 L 1580 795 " +
    "L 690 795 L 668 780 L 660 700 C 560 698 450 700 360 708 C 300 714 252 722 226 724 Z",
  regions: {
    cover:
      "M 1062 460 L 1150 460 L 1360 449 C 1450 458 1520 476 1556 492 L 1600 540 L 1600 655 C 1500 650 1300 625 1100 610 L 990 605 L 978 602 L 996 576 L 1000 530 L 1062 530 Z",
    sidepod:
      "M 965 602 L 990 605 C 1100 610 1300 625 1500 650 L 1600 655 L 1600 664 C 1450 676 1300 708 1150 728 L 1000 726 L 970 726 Z",
    undercut:
      "M 640 640 L 965 602 L 970 726 L 1000 726 L 1150 728 C 1300 708 1450 676 1600 664 L 1600 800 L 680 800 Z",
    chassis:
      "M 200 730 L 222 712 C 250 692 320 664 400 632 C 480 600 570 566 640 546 L 772 549 L 812 574 L 996 574 L 978 602 L 965 602 L 640 640 L 660 700 C 560 698 450 700 360 708 Z",
  },
  glints: [
    "M 1215 466 L 1352 457 L 1340 467 L 1222 474 Z",
    "M 1080 470 L 1140 468 L 1136 476 L 1082 478 Z",
    "M 1000 612 C 1120 616 1300 630 1480 656 L 1478 664 C 1300 640 1120 626 1000 622 Z",
  ],
  floor: "M 690 784 L 1585 784 L 1580 796 L 700 798 Z",
  frontWing: {
    near: "M 260 764 L 416 760 L 418 830 L 404 846 L 272 848 L 258 834 Z",
    // the wing seen dead level, within the endplate's length: the elements below the endplate top, the flap rising
    // to just above it at the trailing edge (as on the STR3); swept across the span for the camera (far-side.ts)
    deckSide:
      "M 258 826 L 380 818 L 384 752 L 416 752 L 418 830 L 404 846 L 272 848 L 258 834 Z",
    flapSide: "M 384 752 L 416 752 L 416 762 L 382 762 Z",
    // far endplate: the near one seen further away (ART-17)
    farFrom: { dx: 12, dy: -188, scale: 0.8625 },
    deck: "M 272 618 L 404 616 L 416 762 L 416 820 L 272 848 C 238 826 214 762 218 718 C 222 690 248 646 272 618 Z",
    flap: { d: "M 364 617 L 404 616 L 416 762 L 380 762 Z", color: HAAS_RED },
  },
  rearWing: {
    near: "M 1688 520 L 1892 516 L 1834 626 L 1800 640 L 1700 640 L 1688 600 Z",
    // far endplate: the near one's copy, nearly all behind it; a sliver shows along the top and rear edges (ART-17)
    farFrom: { dx: 16, dy: -6, scale: 0.95 },
    // the wing elements (mainplane and flap) between the endplates, seen from above as a curved band
    top: "M 1688 520 L 1592 470 C 1588 452 1590 432 1600 419 C 1660 414 1730 414 1780 416 L 1792 444 L 1800 520 Z",
    elements: ["M 1596 462 C 1660 460 1740 462 1796 470"],
    pylon: "M 1606 468 L 1632 468 L 1642 612 L 1616 614 Z",
    beam: "M 1700 626 L 1830 626",
  },
  panelLines: [
    "M 962 600 L 976 600 L 980 726 L 966 726",
    "M 990 605 C 1100 610 1300 625 1500 650 L 1600 655",
    "M 1000 726 C 1150 728 1300 708 1450 676 L 1600 664",
  ],
  suspension: ["M 572 680 L 662 602", "M 590 758 L 680 690"],
  halo: "M 775 563 C 783 549 800 529 820 521 C 828 517 834 515 842 515 L 1018 559",
  haloFar: "M 826 518 C 842 500 866 491 892 489 L 1046 518",
  cockpit: {
    headrest: "M 1026 560 C 1028 534 1036 517 1052 513 L 1064 514 L 1064 560 Z",
    hans: { cx: 996, cy: 566, rx: 42, ry: 14 },
  },
  helmetAt: { cx: 1003, cy: 532, r: 43 },
  mirror:
    "M 842 572 L 880 570 L 900 590 L 896 604 L 858 600 Z M 872 600 L 876 612",
  tcam: "M 1072 456 L 1075 426 L 1092 420 L 1120 422 L 1130 440 L 1128 458 Z",
  antenna: "M 646 548 L 646 522",
  rainLight: "M 1772 640 L 1788 640 L 1788 652 L 1772 652 Z",
  numberAt: { x: 1450, y: 520 },
  breakLine:
    "M 1196 400 L 1188 470 L 1206 520 L 1180 566 L 1200 612 L 1172 660 L 1192 708 L 1170 752 L 1186 860",
};

const AT_NAVY = "#1f2a4f";

export const AT01: CarSpec = {
  name: "2020 AlphaTauri AT01",
  reference:
    "references/cars-2020/2020_tests_Barcelona_AlphaTauri_AT01_Gasly_side.jpg",
  frame: { x: 1852, ground: 795, k: 0.866 },
  shade: 0.45,
  driver: KVY_2020,
  paint: {
    cover: AT_NAVY,
    chassis: "#eceef3",
    sidepod: "#e4e6ec",
    undercut: "#0e1226",
    wing: "#1c2546",
    frontDeck: "#e6e8ee",
    rearTop: "#1d2649",
  },
  // the navy sweep down the white sidepod, from the cockpit shoulder under the halo's rear foot
  livery: [
    {
      d: "M 944 578 L 954 556 L 994 548 L 1000 556 C 1060 568 1110 592 1140 632 C 1172 682 1222 714 1300 722 C 1380 728 1440 712 1472 690 L 1472 714 C 1420 744 1360 752 1300 750 C 1200 744 1148 716 1116 670 C 1088 626 1050 598 1000 586 L 1000 578 Z",
      color: AT_NAVY,
    },
  ],
  // navy nose tip
  accents: [
    {
      d: "M 195 712 C 215 700 236 690 256 682 L 262 702 C 240 708 218 714 198 720 Z",
      color: AT_NAVY,
    },
  ],
  // the AT01 halo is navy
  haloAccent: {
    d: "M 708 575 C 732 556 756 528 780 518 C 792 514 806 513 820 516 L 994 550",
    color: AT_NAVY,
  },
  nearWheels: [
    { cx: 560, cy: 698, r: 97 },
    { cx: 1694, cy: 698, r: 97 },
  ],
  farWheels: [
    { cx: 452, cy: 668, r: 92 },
    { cx: 1628, cy: 600, r: 92 },
  ],
  rimR: 53,
  rim: "spoked",
  compound: PIRELLI_2020.medium,
  body:
    "M 195 712 C 240 690 300 664 360 640 C 430 612 520 584 600 574 L 700 570 L 720 578 L 934 577 C 942 576 946 562 954 556 L 994 548 L 990 520 L 990 470 " +
    "C 1010 462 1050 462 1100 464 L 1300 470 C 1380 476 1440 490 1480 505 L 1520 540 L 1560 590 L 1600 620 L 1640 640 L 1650 690 " +
    "L 1600 770 L 1590 780 L 640 782 L 620 772 L 612 700 C 520 698 420 700 330 706 C 270 710 225 716 198 720 Z",
  regions: {
    cover:
      "M 990 470 C 1010 462 1050 462 1100 464 L 1300 470 C 1380 476 1440 490 1480 505 L 1520 540 L 1560 590 L 1600 620 L 1640 640 L 1650 700 L 1472 700 C 1472 600 1452 552 1402 528 C 1300 510 1150 516 1000 540 Z",
    sidepod:
      "M 940 595 L 1000 540 C 1150 516 1300 510 1402 528 C 1452 552 1472 600 1472 690 C 1420 720 1360 736 1300 738 C 1150 740 1050 735 950 720 Z",
    undercut:
      "M 612 700 L 950 690 L 950 720 C 1050 735 1150 740 1300 738 C 1360 736 1420 720 1472 690 L 1650 700 L 1650 800 L 620 800 Z",
    chassis:
      "M 180 730 L 195 712 C 240 690 300 664 360 640 C 430 612 520 584 600 574 L 700 570 L 720 578 L 950 576 L 985 560 L 1000 540 L 940 595 L 950 690 L 612 700 C 520 698 420 700 330 706 Z",
  },
  glints: [
    "M 1030 470 L 1290 474 L 1280 482 L 1040 480 Z",
    "M 1330 478 C 1380 484 1420 494 1450 506 L 1446 512 C 1416 502 1378 492 1328 486 Z",
  ],
  floor: "M 640 772 L 1600 764 L 1596 776 L 646 784 Z",
  frontWing: {
    near: "M 246 708 L 414 704 L 416 766 L 404 778 L 256 780 L 244 768 Z",
    // the wing seen dead level, within the endplate's length: the elements below the endplate top, the flap rising
    // to just above it at the trailing edge (as on the STR3); swept across the span for the camera (far-side.ts)
    deckSide:
      "M 244 760 L 370 752 L 374 696 L 414 696 L 416 766 L 404 778 L 256 780 L 244 768 Z",
    flapSide: "M 374 696 L 414 696 L 414 706 L 372 706 Z",
    // far endplate: the near one seen further away (ART-17)
    farFrom: { dx: -79, dy: -49, scale: 0.878 },
    deck: "M 176 695 L 314 692 L 414 706 L 414 760 L 256 780 C 200 770 158 752 155 728 C 156 712 166 700 176 695 Z",
    flap: { d: "M 272 693 L 314 692 L 414 706 L 370 707 Z", color: AT_NAVY },
  },
  rearWing: {
    // near endplate as in the photo: its front edge runs down and forward under the wing elements
    near: "M 1662 470 L 1770 470 L 1852 494 L 1820 578 L 1792 636 L 1690 640 L 1618 600 L 1615 580 L 1660 520 Z",
    // far endplate: the near one's copy, nearly all behind it; a sliver shows along the top and rear edges (ART-17)
    farFrom: { dx: 18, dy: -6, scale: 0.95 },
    // the wing elements (mainplane and flap) between the endplates, seen from above as a curved band
    top: "M 1498 489 C 1497 478 1500 470 1508 467 L 1662 470 L 1662 518 L 1542 518 C 1520 510 1505 500 1498 489 Z",
    elements: ["M 1500 488 C 1560 486 1620 488 1664 494"],
    pylon: "M 1540 500 L 1566 500 L 1572 620 L 1548 622 Z",
    beam: "M 1690 628 L 1800 628",
  },
  panelLines: [
    "M 932 592 L 946 592 L 950 690 L 936 690",
    "M 950 720 C 1050 735 1150 740 1300 738 C 1360 736 1420 720 1472 690",
  ],
  suspension: ["M 556 628 L 660 584", "M 572 700 L 660 668"],
  halo: "M 708 575 C 732 556 756 528 780 518 C 792 514 806 513 820 516 L 994 550",
  haloFar: "M 786 514 C 798 504 812 500 828 500 L 978 534",
  cockpit: {
    headrest: "M 955 572 C 957 548 966 534 980 530 L 990 534 L 988 572 Z",
    hans: { cx: 922, cy: 574, rx: 40, ry: 13 },
  },
  helmetAt: { cx: 925, cy: 555, r: 40 },
  mirror: "M 742 552 L 776 550 L 780 568 L 746 572 Z M 760 572 L 764 584",
  tcam: "M 996 462 L 994 434 L 1006 430 L 1022 432 L 1026 446 L 1024 464 Z",
  antenna: "M 675 570 L 675 512",
  rainLight: "M 1700 640 L 1714 640 L 1714 652 L 1700 652 Z",
  numberAt: { x: 1430, y: 540 },
};
