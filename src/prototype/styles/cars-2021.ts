// PROTOTYPE — 2021 Mercedes W12 and Red Bull RB16B, traced from side-on reference photos
// (Lukas Raich, "FIA F1 Austria 2021 Nr. 44 Hamilton (side)" and "Nr. 33 Verstappen (side)", Wikimedia Commons, CC BY-SA 4.0).
// Paths are in the photo's pixel space, where the car faces left. `frame` maps photo pixels to car units
// (250 units = 1 m, nose pointing +x, ground at y = 0): carX = (frame.x - px) * k, carY = (py - frame.ground) * k.

export type Wheel = { cx: number; cy: number; r: number };
export type Accent = { d: string; color: string };

export type CarSpec = {
  frame: { x: number; ground: number; k: number };
  nearWheels: Wheel[]; // front, rear
  farWheels: Wheel[];
  rimR: number;
  rim: "spoked" | "dark";
  rimAccent?: string;
  body: string;
  // Form regions, each a closed path: top of the engine cover (lit), sidepod flank, undercut and floor (in shadow), chassis flank.
  regions: { cover: string; sidepod: string; undercut: string; chassis: string };
  // Glossy reflections, drawn white over the paint.
  glints: string[];
  floor: string;
  frontWing: { near: string; far: string; deck: string; elements: string[] };
  rearWing: { near: string; top: string; elements: string[]; pylon: string; beam: string[] };
  panelLines: string[];
  bargeboards: string[];
  suspension: string[];
  halo: string;
  helmet: { cx: number; cy: number; r: number; visor: string };
  mirror: string;
  tcam: string;
  antenna: string;
  rainLight: string;
  accents: Accent[];
  haloAccent?: Accent;
  number: { x: number; y: number; text: string };
  compound: string; // Pirelli sidewall: soft red, medium yellow, hard white
};

export const W12: CarSpec = {
  frame: { x: 1900, ground: 848, k: 0.8 },
  nearWheels: [
    { cx: 475, cy: 740, r: 105 },
    { cx: 1642, cy: 743, r: 106 },
  ],
  farWheels: [
    { cx: 452, cy: 592, r: 95 },
    { cx: 1585, cy: 590, r: 98 },
  ],
  rimR: 56,
  rim: "dark",
  rimAccent: "#00a19b",
  body:
    "M 128 700 C 200 680 300 652 420 614 C 500 590 560 566 610 556 L 705 552 L 730 566 L 930 566 L 1000 548 L 1030 530 L 1034 468 " +
    "C 1060 458 1100 458 1140 460 L 1340 461 C 1420 470 1520 492 1600 520 L 1640 560 L 1690 610 L 1712 640 L 1700 690 L 1560 760 L 1540 800 " +
    "L 620 800 L 600 790 L 598 700 C 520 690 440 676 360 682 C 260 690 180 712 132 716 Z",
  regions: {
    cover: "M 1034 468 C 1060 458 1100 458 1140 460 L 1340 461 C 1420 470 1520 492 1600 520 L 1640 560 L 1600 650 C 1560 630 1500 615 1420 600 C 1300 575 1150 545 1030 530 Z",
    sidepod: "M 872 602 C 980 606 1150 628 1300 660 C 1400 680 1480 700 1540 730 L 1520 765 C 1480 768 1440 770 1400 770 C 1200 760 1000 730 892 700 Z",
    undercut: "M 598 610 L 870 604 L 892 700 C 1000 730 1200 760 1400 770 L 1545 778 L 1540 800 L 620 800 L 600 790 Z",
    chassis: "M 560 560 L 705 552 L 730 566 L 930 566 L 1000 548 L 1030 530 C 1000 560 940 590 872 602 L 598 610 Z",
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
    near: "M 147 755 L 330 760 L 330 825 L 150 825 Z",
    far: "M 135 600 L 292 600 L 290 640 L 140 640 Z",
    deck: "M 140 640 L 290 640 L 330 760 L 147 755 L 92 730 Z",
    elements: [
      "M 150 640 C 130 690 110 730 100 760",
      "M 200 640 C 180 700 165 740 160 760",
      "M 250 640 C 235 700 225 740 222 760",
      "M 290 640 C 285 690 280 730 280 758",
      "M 92 730 C 100 770 120 800 150 822",
      "M 250 700 L 262 758",
      "M 300 692 L 312 758",
    ],
  },
  rearWing: {
    near: "M 1685 525 L 1858 528 L 1875 550 L 1862 560 L 1876 580 L 1845 600 L 1845 675 L 1690 678 L 1685 640 Z",
    top: "M 1655 445 L 1772 440 L 1790 450 L 1840 470 L 1850 525 L 1685 525 L 1662 500 Z",
    elements: ["M 1662 470 L 1845 480", "M 1668 495 L 1848 505", "M 1790 450 L 1800 470", "M 1815 457 L 1825 477", "M 1838 468 L 1846 490"],
    pylon: "M 1640 500 L 1682 500 L 1690 612 L 1650 616 Z",
    beam: ["M 1690 600 L 1840 600", "M 1692 625 L 1842 628"],
  },
  panelLines: [
    "M 872 604 L 886 604 L 890 700 L 876 700",
    "M 872 602 C 980 606 1150 628 1300 660 C 1400 680 1480 700 1540 730",
    "M 892 700 C 1000 730 1200 760 1400 770",
    "M 1030 530 C 1150 545 1300 575 1420 600 C 1500 615 1560 630 1600 650",
    "M 610 600 L 870 602",
    "M 990 548 C 1000 530 1010 525 1030 528",
  ],
  bargeboards: [
    "M 640 655 L 650 790",
    "M 690 650 L 700 790",
    "M 740 655 L 755 790",
    "M 800 660 L 815 795",
    "M 850 665 L 862 795",
    "M 760 640 C 800 630 850 640 880 660",
    "M 600 770 C 700 778 800 785 900 790",
  ],
  suspension: ["M 470 655 L 610 580", "M 480 760 L 600 680", "M 440 612 L 590 590", "M 445 640 L 590 640", "M 1642 690 L 1560 640", "M 1642 760 L 1550 740"],
  halo: "M 712 570 C 730 540 760 505 800 495 L 990 502 C 1010 505 1018 520 1015 540",
  helmet: { cx: 962, cy: 530, r: 34, visor: "M 930 524 C 938 506 958 499 978 503 L 976 520 L 934 530 Z" },
  mirror: "M 790 572 L 840 570 L 842 590 L 792 594 Z M 815 592 L 820 606",
  tcam: "M 1052 462 L 1050 432 L 1066 432 L 1068 442 L 1094 442 L 1096 432 L 1112 432 L 1110 462 Z",
  antenna: "M 612 554 L 612 495",
  rainLight: "M 1700 640 L 1716 640 L 1716 654 L 1700 654 Z",
  accents: [
    { d: "M 530 645 C 650 642 760 636 810 640 C 850 650 880 672 892 700 L 880 702 C 866 678 840 660 806 652 C 750 648 650 652 530 655 Z", color: "#00a19b" },
    { d: "M 960 722 C 1080 735 1250 738 1375 712 L 1378 721 C 1250 748 1080 746 958 732 Z", color: "#00a19b" },
  ],
  haloAccent: { d: "M 792 500 C 820 492 850 490 885 492", color: "#00a19b" },
  number: { x: 1500, y: 555, text: "44" },
  compound: "#f4f4f4",
};

export const RB16B: CarSpec = {
  frame: { x: 1840, ground: 832, k: 0.8 },
  nearWheels: [
    { cx: 458, cy: 728, r: 105 },
    { cx: 1594, cy: 725, r: 106 },
  ],
  farWheels: [
    { cx: 450, cy: 590, r: 96 },
    { cx: 1565, cy: 590, r: 98 },
  ],
  rimR: 56,
  rim: "spoked",
  body:
    "M 152 712 C 220 690 300 650 420 600 C 470 580 520 560 560 554 L 700 552 L 718 566 L 930 568 L 1000 552 L 1022 540 L 1022 444 " +
    "C 1060 440 1120 440 1200 441 L 1335 437 L 1420 460 L 1555 510 L 1600 560 L 1650 600 L 1690 640 L 1700 690 L 1520 745 L 1490 770 " +
    "L 600 785 L 585 780 L 582 690 C 480 700 380 718 300 722 C 240 724 190 726 158 726 Z",
  regions: {
    cover: "M 1022 444 C 1060 440 1120 440 1200 441 L 1335 437 L 1420 460 L 1555 510 L 1600 560 L 1600 650 C 1560 625 1500 600 1420 585 C 1300 560 1150 548 1022 540 Z",
    sidepod: "M 870 580 C 980 585 1150 600 1300 625 C 1400 645 1470 670 1520 700 L 1490 750 L 1420 750 C 1200 740 1000 700 886 650 Z",
    undercut: "M 582 615 L 870 616 L 886 650 C 1000 700 1200 740 1420 750 L 1495 760 L 1490 770 L 600 785 L 585 780 Z",
    chassis: "M 560 556 L 700 552 L 718 566 L 930 568 L 1000 552 L 1022 540 C 990 560 930 575 870 580 L 582 615 Z",
  },
  glints: [
    "M 1100 446 L 1320 441 L 1306 452 L 1110 456 Z",
    "M 900 588 C 1000 594 1150 608 1290 632 L 1286 640 C 1150 618 1000 604 900 598 Z",
  ],
  floor: "M 585 774 L 1495 764 L 1492 776 L 590 788 Z",
  frontWing: {
    near: "M 130 752 L 318 752 L 318 822 L 135 822 Z",
    far: "M 132 602 L 310 600 L 310 640 L 135 642 Z",
    deck: "M 135 642 L 310 640 L 318 752 L 130 752 L 78 700 Z",
    elements: [
      "M 140 642 C 110 690 90 730 80 760",
      "M 190 642 C 165 695 150 735 145 758",
      "M 240 642 C 220 700 210 735 208 755",
      "M 290 642 C 280 690 272 730 270 752",
      "M 78 700 C 75 740 95 790 135 818",
      "M 260 720 L 268 752",
      "M 320 714 L 326 752",
    ],
  },
  rearWing: {
    near: "M 1602 522 L 1826 522 L 1812 560 L 1800 600 L 1785 602 L 1785 660 L 1612 660 L 1602 600 Z",
    top: "M 1625 412 L 1725 412 L 1745 430 L 1805 440 L 1826 522 L 1602 522 L 1610 470 Z",
    elements: ["M 1612 460 L 1800 462", "M 1608 495 L 1815 495", "M 1700 414 L 1718 520"],
    pylon: "M 1595 455 L 1640 455 L 1645 610 L 1600 612 Z",
    beam: ["M 1612 615 L 1790 615", "M 1614 638 L 1786 638"],
  },
  panelLines: [
    "M 862 582 L 882 580 L 886 650 L 868 652",
    "M 870 580 C 980 585 1150 600 1300 625 C 1400 645 1470 670 1520 700",
    "M 886 650 C 1000 700 1200 740 1420 750",
    "M 1022 540 C 1150 548 1300 560 1420 585 C 1500 600 1560 625 1600 650",
    "M 590 615 L 880 618",
    "M 990 552 C 1000 540 1010 538 1022 540",
  ],
  bargeboards: [
    "M 600 640 L 612 780",
    "M 660 640 L 672 782",
    "M 720 645 L 735 785",
    "M 790 650 L 800 788",
    "M 850 655 L 860 790",
    "M 760 615 C 800 610 860 620 880 640",
    "M 630 665 C 700 670 780 680 820 712",
  ],
  suspension: ["M 455 640 L 590 585", "M 470 760 L 585 690", "M 430 610 L 570 590", "M 1594 680 L 1510 640", "M 1594 750 L 1500 730"],
  halo: "M 702 556 C 720 530 750 500 790 490 L 980 505 C 1000 508 1008 520 1005 538",
  helmet: { cx: 950, cy: 515, r: 33, visor: "M 920 510 C 928 493 948 486 966 490 L 962 506 L 924 516 Z" },
  mirror: "M 780 558 L 822 556 L 824 574 L 782 577 Z M 800 576 L 805 590",
  tcam: "M 1040 446 L 1038 412 L 1054 412 L 1056 422 L 1080 422 L 1082 412 L 1098 412 L 1095 446 Z",
  antenna: "M 545 554 L 545 518 M 535 518 L 556 518",
  rainLight: "M 1650 640 L 1666 640 L 1666 654 L 1650 654 Z",
  accents: [
    { d: "M 152 712 C 200 696 250 676 300 660 L 314 702 C 270 714 210 724 158 726 Z", color: "#ffcc00" },
    { d: "M 1022 444 L 1062 443 L 1082 522 L 1022 540 Z", color: "#ffcc00" },
    { d: "M 500 597 L 640 600 L 640 611 L 500 608 Z", color: "#e3262b" },
    { d: "M 960 608 C 1050 616 1150 622 1262 620 L 1264 630 C 1150 634 1050 628 958 619 Z", color: "#e3262b" },
  ],
  number: { x: 1470, y: 530, text: "33" },
  compound: "#e3262b",
};

// Car-space position of a near wheel (for placing effects such as lock-up smoke).
export const wheelInCarUnits = (car: CarSpec, i: number) => {
  const w = car.nearWheels[i];
  return { x: (car.frame.x - w.cx) * car.frame.k, y: (w.cy + w.r - car.frame.ground) * car.frame.k };
};
