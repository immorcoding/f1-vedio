// 2008 Brazilian Grand Prix cars (ticket #8): McLaren MP4-23 (HAM #22), Toyota TF108 (GLO #12), Toro Rosso STR3
// (VET #15) and Ferrari F2008 (MAS #2), traced from side-on photos on Wikimedia Commons (ART-4, ART-10; sources in
// docs/assets/reference-register.md). Each photo is scaled (and mirrored when the car faced right) onto a 1920×1080
// trace frame, `references/cars-2008/<car>-side.png`, made by the recipe in that register.
//
// No halo (pre-2018) and Bridgestone tyres without a coloured sidewall band; the tread (dry grooved / wet) is a
// MangaCar state. Scale: the MP4-23's documented 3.10 m wheelbase gives 353 px/m on its frame; the other cars are
// scaled by the same Bridgestone tyre (0.58 m measured on that frame).
import type { CarSpec } from "./spec";

// Photo px → car units (250 per metre), from a tyre radius in frame px: the tyre is 0.577 m across.
const kFromTyre = (r: number) => (250 * 0.577) / (2 * r);

export const MP4_23: CarSpec = {
  name: "2008 McLaren-Mercedes MP4-23",
  reference: "references/cars-2008/MP4-23-side.png",
  frame: { x: 1830, ground: 648, k: kFromTyre(102) },
  driver: {
    number: "22",
    helmet: { base: "#f2cd1c", stripe: "#f4f4f2", trim: "#2f9a45" },
  },
  paint: {
    cover: "#cfd2d7",
    chassis: "#bfc3c9",
    sidepod: "#b3b7bd",
    undercut: "#2a2c30",
    wing: "#3b3e43",
    frontDeck: "#a9adb3",
    rearTop: "#2c2e33",
  },
  // red Vodafone swoosh along the sidepod
  livery: [
    {
      d: "M 987 505 C 990 490 1040 484 1100 488 C 1200 498 1300 520 1370 538 L 1430 558 L 1427 566 C 1380 580 1300 595 1200 600 L 1000 598 C 985 580 982 525 987 505 Z",
      color: "#e2231a",
    },
    // sidepod inlet in shadow, ahead of the swoosh
    {
      d: "M 880 470 C 920 462 960 458 992 458 L 987 505 C 984 540 990 580 1000 598 L 880 598 Z",
      color: "#7b7f86",
    },
  ],
  // the front wing is silver; the rear wing endplates are charcoal (paint.wing)
  wingLivery: [
    {
      d: "M 245 522 L 445 520 L 447 594 L 436 603 L 228 606 L 236 590 C 238 570 240 540 245 522 Z",
      color: "#c3c7cc",
    },
  ],
  accents: [
    // red stripe up the side of the nose, and along the top edge of the engine cover fin
    {
      d: "M 250 530 L 280 522 C 360 495 440 465 494 446 L 499 455 C 440 476 360 506 284 532 Z",
      color: "#e2231a",
    },
    {
      d: "M 1290 312 C 1350 320 1420 348 1470 372 C 1520 397 1570 420 1602 432 L 1598 440 C 1566 428 1516 406 1466 381 C 1416 357 1348 329 1290 320 Z",
      color: "#e2231a",
    },
  ],
  nearWheels: [
    { cx: 552, cy: 544, r: 103 },
    { cx: 1648, cy: 547, r: 101 },
  ],
  farWheels: [
    { cx: 545, cy: 499, r: 96 },
    { cx: 1640, cy: 526, r: 95 },
  ],
  rimR: 58,
  rim: "dark",
  body:
    "M 240 503 C 290 488 360 458 393 425 L 420 418 L 700 421 L 870 428 L 1088 426 L 1092 392 L 1146 384 L 1146 307 " +
    "L 1293 313 C 1350 322 1420 350 1470 374 C 1520 400 1570 422 1600 432 L 1640 452 L 1760 480 L 1800 540 L 1800 595 " +
    "L 1760 615 L 1560 628 L 700 628 L 660 600 L 600 545 L 447 521 L 373 523 L 240 530 Z",
  regions: {
    cover:
      "M 1146 300 L 1293 306 C 1350 315 1420 345 1470 370 C 1520 396 1570 420 1610 432 L 1600 470 L 1430 485 C 1300 462 1200 450 1100 440 L 1100 300 Z",
    sidepod:
      "M 880 474 C 950 458 1050 450 1150 455 C 1250 462 1350 476 1440 492 C 1435 530 1432 570 1430 600 L 920 602 C 895 570 880 520 880 474 Z",
    undercut:
      "M 650 535 L 880 535 L 880 600 L 1430 600 L 1440 565 L 1560 470 L 1640 470 L 1810 520 L 1810 630 L 650 630 Z",
    chassis:
      "M 230 495 L 393 420 L 1100 420 L 1100 440 C 1000 445 930 455 870 470 L 880 535 L 650 535 L 600 545 L 447 521 L 230 540 Z",
  },
  glints: [
    "M 300 492 C 340 476 372 452 392 428 L 402 428 C 380 456 346 482 306 498 Z",
    "M 430 424 L 860 431 L 858 438 L 430 431 Z",
    "M 1160 316 L 1285 320 L 1280 328 L 1162 325 Z",
    "M 890 476 C 990 462 1100 458 1180 462 L 1176 470 C 1100 466 990 470 892 484 Z",
  ],
  floor: "M 667 622 L 1560 622 L 1560 632 L 667 632 Z",
  frontWing: {
    near: "M 245 522 L 445 520 L 447 594 L 436 603 L 228 606 L 236 590 C 238 570 240 540 245 522 Z",
    // far endplate: the near one seen further away (ART-17)
    farFrom: { dx: 10, dy: -28, scale: 0.95 },
    deck: "M 238 500 L 294 496 L 447 522 L 447 590 L 255 604 C 236 590 230 540 238 500 Z",
    flap: { d: "M 400 513 L 447 521 L 447 560 L 400 556 Z", color: "#e2231a" },
  },
  rearWing: {
    near: "M 1620 362 L 1773 360 L 1827 443 L 1827 523 L 1810 543 L 1753 543 L 1700 500 L 1625 455 Z",
    top: "M 1597 343 L 1735 341 L 1748 352 L 1773 360 L 1620 362 L 1620 405 L 1597 405 Z",
    elements: ["M 1600 375 L 1622 375"],
    pylon: "M 1700 420 L 1720 420 L 1725 470 L 1705 470 Z",
    beam: "M 1700 522 L 1800 522",
  },
  panelLines: [
    "M 880 470 C 980 455 1150 452 1300 470 C 1360 478 1400 485 1440 492",
    "M 880 535 L 880 600",
  ],
  suspension: ["M 560 470 L 700 452", "M 565 560 L 680 548"],
  cockpit: {
    headrest: "M 1088 428 L 1092 392 L 1146 384 L 1148 428 Z",
    hans: { cx: 1046, cy: 428, rx: 40, ry: 10 },
  },
  helmetAt: { cx: 1051, cy: 414, r: 51 },
  mirror: "M 868 410 L 920 407 L 921 424 L 870 428 Z M 892 427 L 895 436",
  tcam: "M 1150 307 L 1153 284 L 1170 277 L 1205 277 L 1215 287 L 1213 307 Z",
  tcamColor: "#e8322b",
  antenna: "M 527 420 L 527 398",
  rainLight: "M 1795 545 L 1812 545 L 1812 556 L 1795 556 Z",
  numberAt: { x: 1330, y: 372 },
};

// Traced on Massa's car at Sepang 2008; the engine-cover fin it carried at Interlagos is added from the Brazil photo
// (diogo dubiella, CC BY-SA 2.0): a tall fin from the airbox back to the rear wing, the white panel on its front half.
export const F2008: CarSpec = {
  name: "2008 Ferrari F2008",
  reference: "references/cars-2008/F2008-side.png",
  frame: { x: 1780, ground: 792, k: kFromTyre(101) },
  driver: {
    number: "2",
    helmet: { base: "#f2f2ef", stripe: "#c5df1a", trim: "#1d5fc4" },
  },
  paint: {
    cover: "#e3231b",
    chassis: "#d3171c",
    sidepod: "#c41419",
    undercut: "#2a1517",
    wing: "#c8141a",
    frontDeck: "#b81218",
    rearTop: "#1c1c1e",
  },
  // white panel on the engine cover and the front of the fin
  livery: [
    { d: "M 1150 455 L 1343 458 L 1400 557 L 1173 553 Z", color: "#f4f4f2" },
  ],
  wingLivery: [],
  accents: [],
  nearWheels: [
    { cx: 531, cy: 690, r: 102 },
    { cx: 1596, cy: 689, r: 99 },
  ],
  farWheels: [
    { cx: 518, cy: 633, r: 96 },
    { cx: 1585, cy: 634, r: 94 },
  ],
  rimR: 59,
  rim: "spoked",
  body:
    "M 203 668 C 230 645 300 615 410 586 L 450 574 L 640 570 L 883 572 L 990 562 L 1080 562 L 1084 522 L 1120 516 " +
    "L 1120 452 L 1190 450 L 1440 456 L 1556 478 L 1565 520 L 1620 600 L 1700 640 L 1760 680 L 1760 720 L 1700 745 " +
    "L 1560 760 L 650 762 L 610 740 L 580 690 L 423 667 L 350 670 L 203 673 Z",
  regions: {
    cover:
      "M 1110 440 L 1190 440 L 1440 448 L 1570 472 L 1575 600 L 1300 565 C 1200 550 1150 545 1100 545 Z",
    sidepod:
      "M 905 612 C 960 596 1100 578 1300 575 C 1380 580 1430 600 1470 620 C 1440 650 1400 690 1380 718 L 960 722 C 930 690 905 650 905 612 Z",
    undercut:
      "M 600 738 L 1300 736 C 1285 700 1285 660 1300 624 L 1480 625 L 1620 700 L 1770 700 L 1770 770 L 600 770 Z",
    chassis:
      "M 195 640 L 450 566 L 1110 552 L 1110 588 C 1000 590 940 598 900 606 C 880 640 870 670 862 700 L 640 700 L 580 690 L 423 667 L 195 680 Z",
  },
  glints: [
    "M 240 650 C 300 625 360 603 420 590 L 424 598 C 364 611 304 633 246 658 Z",
    "M 470 578 L 870 576 L 868 584 L 470 586 Z",
    "M 1196 458 L 1430 462 L 1428 470 L 1198 466 Z",
    "M 920 606 C 1020 592 1150 580 1280 582 L 1276 590 C 1150 588 1020 600 922 614 Z",
  ],
  floor: "M 650 752 L 1500 752 L 1500 762 L 650 762 Z",
  frontWing: {
    near: "M 237 679 L 423 679 L 425 740 L 412 747 L 217 747 L 226 728 C 228 710 232 692 237 679 Z",
    // far endplate: the near one seen further away (ART-17)
    farFrom: { dx: 11, dy: -39, scale: 0.95 },
    deck: "M 228 648 L 262 645 L 423 679 L 423 740 L 217 747 C 205 720 210 670 228 648 Z",
    flap: { d: "M 380 670 L 423 679 L 423 715 L 380 712 Z", color: "#1c1c1e" },
  },
  rearWing: {
    near: "M 1580 510 L 1747 503 L 1777 520 L 1777 673 L 1697 673 L 1650 640 L 1590 600 Z",
    top: "M 1563 480 L 1690 478 L 1700 503 L 1580 510 L 1580 525 L 1563 525 Z",
    elements: ["M 1565 500 L 1582 500"],
    pylon: "M 1640 560 L 1660 560 L 1665 610 L 1645 610 Z",
    beam: "M 1650 652 L 1760 652",
  },
  panelLines: [
    "M 900 600 C 1000 585 1150 570 1300 575 C 1380 580 1430 600 1470 620",
  ],
  suspension: ["M 540 615 L 700 595", "M 545 700 L 660 690"],
  cockpit: {
    headrest: "M 1080 564 L 1084 524 L 1120 516 L 1122 564 Z",
    hans: { cx: 1040, cy: 566, rx: 40, ry: 10 },
  },
  helmetAt: { cx: 1044, cy: 561, r: 51 },
  mirror: "M 887 517 L 933 515 L 935 540 L 889 543 Z M 925 541 L 943 560",
  tcam: "M 1123 450 L 1126 425 L 1140 417 L 1180 417 L 1190 428 L 1187 450 Z",
  tcamColor: "#c8e021",
  antenna: "M 470 573 L 470 550",
  rainLight: "M 1700 676 L 1716 676 L 1716 688 L 1700 688 Z",
  numberAt: { x: 1300, y: 500 },
};

// Traced on Bourdais's car in Friday practice at Fuji 2008 (Morio, CC BY-SA 3.0), mirrored to face left and levelled
// by 3.7° (the camera was rolled). Same car as Vettel's but for the helmet and the T-camera colour.
export const STR3: CarSpec = {
  name: "2008 Toro Rosso STR3",
  reference: "references/cars-2008/STR3-side.png",
  frame: { x: 1695, ground: 738, k: kFromTyre(103) },
  driver: {
    number: "15",
    helmet: { base: "#1d2b4f", stripe: "#a7b0ba", trim: "#f2c418" },
  },
  paint: {
    cover: "#1c2850",
    chassis: "#1a2347",
    sidepod: "#16203f",
    undercut: "#0b1022",
    wing: "#18224a",
    frontDeck: "#18224a",
    rearTop: "#141a33",
  },
  // the red bull painted over the engine cover and sidepod, and the gold nose tip
  livery: [
    {
      d: "M 1047 516 L 1047 470 L 1083 466 L 1083 397 L 1110 395 L 1130 420 L 1170 433 L 1283 443 L 1417 460 L 1405 480 C 1385 520 1365 560 1350 585 C 1300 610 1240 640 1180 672 L 1080 674 C 1030 645 1000 610 990 570 L 1000 520 Z",
      color: "#d7262b",
    },
    {
      d: "M 333 572 C 360 560 380 555 400 550 L 418 600 L 333 600 Z",
      color: "#c8a13a",
    },
  ],
  wingLivery: [],
  // the bull's light-blue horn on the side of the chassis
  accents: [
    {
      d: "M 787 545 C 820 538 860 536 892 540 L 890 566 C 860 570 820 566 790 560 Z",
      color: "#5fb4e6",
    },
  ],
  nearWheels: [
    { cx: 618, cy: 636, r: 104 },
    { cx: 1564, cy: 635, r: 104 },
  ],
  farWheels: [
    { cx: 467, cy: 583, r: 98 },
    { cx: 1555, cy: 600, r: 98 },
  ],
  rimR: 55,
  rim: "dark",
  rimAccent: "#b8893a",
  body:
    "M 333 597 L 333 572 C 360 560 380 555 400 550 L 480 530 L 547 513 L 667 505 L 760 502 L 860 505 L 957 512 L 1047 515 " +
    "L 1047 470 L 1083 466 L 1083 397 L 1170 400 L 1490 397 L 1490 415 L 1417 437 L 1550 470 L 1650 520 L 1695 560 " +
    "L 1695 620 L 1660 650 L 1560 690 L 640 703 L 600 690 L 560 640 L 493 613 L 333 600 Z",
  regions: {
    cover:
      "M 1080 390 L 1495 390 L 1495 420 L 1420 450 C 1300 440 1170 430 1080 470 Z",
    sidepod:
      "M 885 545 C 1000 530 1200 520 1400 500 L 1420 560 L 1400 680 L 920 690 C 895 650 885 600 885 545 Z",
    undercut:
      "M 560 645 L 900 645 C 905 665 912 680 920 690 L 1270 680 C 1265 620 1268 560 1280 520 L 1460 520 L 1560 600 L 1720 600 L 1720 710 L 560 710 Z",
    chassis:
      "M 325 560 L 547 505 L 1050 505 L 1050 530 C 950 532 900 535 885 545 C 885 590 890 620 900 645 L 560 645 L 493 615 L 325 605 Z",
  },
  glints: [
    "M 420 545 C 470 530 520 518 560 512 L 562 520 C 520 526 470 538 424 553 Z",
    "M 600 510 L 850 508 L 850 515 L 600 517 Z",
    "M 1180 404 L 1480 402 L 1478 410 L 1182 412 Z",
  ],
  floor: "M 640 694 L 1460 690 L 1460 700 L 640 704 Z",
  frontWing: {
    near: "M 232 588 L 245 578 L 330 578 L 440 610 L 490 622 L 492 680 L 470 688 L 262 686 L 238 650 Z",
    // far endplate: the near one seen further away (ART-17)
    farFrom: { dx: 4, dy: -8, scale: 0.95 },
    deck: "M 236 576 L 300 572 L 490 622 L 492 680 L 262 686 C 240 660 230 600 236 576 Z",
    flap: { d: "M 440 608 L 490 622 L 490 650 L 440 640 Z", color: "#d7262b" },
  },
  rearWing: {
    near: "M 1550 460 L 1630 460 L 1695 472 L 1695 610 L 1650 610 L 1630 580 L 1560 520 Z",
    top: "M 1430 420 L 1600 418 L 1630 460 L 1550 460 L 1550 470 L 1430 470 Z",
    elements: ["M 1435 440 L 1550 438"],
    pylon: "M 1600 520 L 1620 520 L 1625 560 L 1605 560 Z",
    beam: "M 1620 600 L 1690 600",
  },
  panelLines: ["M 880 540 C 1000 530 1200 520 1400 500"],
  suspension: ["M 620 570 L 780 548", "M 625 660 L 760 650"],
  cockpit: {
    headrest: "M 1045 517 L 1047 470 L 1083 466 L 1085 517 Z",
    hans: { cx: 1004, cy: 518, rx: 40, ry: 10 },
  },
  helmetAt: { cx: 1008, cy: 508, r: 51 },
  mirror: "M 783 450 L 820 449 L 822 473 L 785 475 Z M 815 474 L 850 497",
  tcam: "M 1113 393 L 1116 372 L 1128 367 L 1170 367 L 1180 376 L 1178 393 Z",
  tcamColor: "#c8e021",
  antenna: "M 743 503 L 743 480",
  rainLight: "M 1678 615 L 1692 615 L 1692 627 L 1678 627 Z",
  numberAt: { x: 1300, y: 420 },
};

// Traced on the TF108 at the 2008 Goodwood Festival of Speed (Supermac1961, CC BY 2.0), mirrored to face left and
// levelled by 0.9°. The photo cuts off the back of the rear wing endplate; its last ~40 px are completed from Glock's
// car at Monza 2008 (Jane Belinda Smith, CC BY 2.0), which also gives the Brazil-race details (lime T-camera, #12).
export const TF108: CarSpec = {
  name: "2008 Toyota TF108",
  reference: "references/cars-2008/TF108-side.png",
  frame: { x: 1675, ground: 805, k: kFromTyre(100) },
  driver: {
    number: "12",
    helmet: { base: "#e8452a", stripe: "#2f5fb5", trim: "#f4f4f2" },
  },
  paint: {
    cover: "#f6f6f4",
    chassis: "#efeeeb",
    sidepod: "#e4e3e0",
    undercut: "#232427",
    wing: "#f0efec",
    frontDeck: "#e9e8e5",
    rearTop: "#1f2023",
  },
  // Toyota red with its brushed, flame-like trailing edges: nose, sidepod, fin
  livery: [
    {
      d: "M 278 669 L 496 593 L 529 593 L 599 598 L 559 606 L 616 615 L 564 622 L 599 630 L 538 633 L 557 706 L 277 701 Z",
      color: "#d9161c",
    },
    {
      d: "M 770 637 C 771 609 789 595 814 594 L 1099 590 L 1202 598 L 1249 605 L 1214 612 L 1269 618 L 1224 625 L 1296 633 L 1230 640 L 1266 650 L 1198 656 L 998 651 C 948 655 898 679 858 693 C 817 701 788 697 778 687 C 772 672 770 657 770 637 Z",
      color: "#d9161c",
    },
    {
      d: "M 1284 475 L 1471 478 C 1446 503 1430 519 1424 535 L 1398 521 L 1408 537 L 1366 516 L 1378 531 L 1329 506 L 1301 493 Z",
      color: "#d9161c",
    },
  ],
  // red flames at the foot of the rear wing endplate
  wingLivery: [
    {
      d: "M 1570 650 L 1608 662 L 1593 670 L 1638 679 L 1613 686 L 1675 695 L 1675 704 L 1598 703 Z",
      color: "#d9161c",
    },
  ],
  accents: [],
  nearWheels: [
    { cx: 473, cy: 705, r: 101 },
    { cx: 1497, cy: 706, r: 99 },
  ],
  farWheels: [
    { cx: 466, cy: 688, r: 96 },
    { cx: 1488, cy: 690, r: 94 },
  ],
  rimR: 58,
  rim: "spoked",
  body:
    "M 288 677 C 308 660 338 642 379 629 L 496 599 L 616 593 L 709 588 L 782 587 L 849 598 L 999 605 L 1003 576 L 1040 571" +
    "L 1040 483 L 1150 481 L 1283 479 L 1460 477 C 1430 500 1415 530 1417 553 C 1418 575 1430 590 1457 597 L 1600 640 " +
    "L 1677 680 L 1677 720 L 1640 745 L 1593 768 L 600 778 L 560 765 L 540 720 L 480 712 L 377 700 L 293 707 Z",
  regions: {
    cover:
      "M 1031 466 L 1476 473 C 1431 507 1415 537 1417 560 C 1417 582 1429 597 1459 608 L 1299 605 C 1199 594 1099 587 1029 586 Z",
    sidepod:
      "M 789 607 C 849 593 949 588 1099 592 C 1199 599 1299 605 1359 616 C 1378 657 1368 696 1356 771 L 796 762 C 778 697 778 637 789 607 Z",
    undercut:
      "M 538 693 C 598 684 698 682 773 687 L 792 759 L 1336 768 C 1347 736 1377 712 1418 697 L 1618 700 L 1616 800 L 536 783 Z",
    chassis:
      "M 278 669 L 496 598 L 1039 591 L 1039 603 C 949 605 849 608 789 612 L 773 687 L 538 693 L 277 701 Z",
  },
  glints: [
    "M 318 658 C 358 643 419 624 489 605 L 493 613 C 422 632 362 651 324 666 Z",
    "M 639 598 L 839 594 L 841 601 L 641 605 Z",
    "M 1061 490 L 1271 491 L 1269 499 L 1063 498 Z",
    "M 827 700 C 947 700 1147 705 1337 712 L 1335 720 C 1147 713 947 708 829 708 Z",
  ],
  floor: "M 596 762 L 1396 773 L 1396 783 L 596 772 Z",
  frontWing: {
    near: "M 197 700 L 208 672 L 226 669 L 234 692 L 371 694 L 372 751 L 362 758 L 204 755 L 197 738 Z",
    // far endplate: the near one seen further away (ART-17)
    farFrom: { dx: 11, dy: 8, scale: 0.95 },
    deck: "M 208 678 L 288 677 L 371 694 L 370 751 L 204 755 C 195 728 198 693 208 678 Z",
    flap: { d: "M 328 685 L 371 694 L 370 726 L 327 722 Z", color: "#d9161c" },
  },
  rearWing: {
    near: "M 1477 556 L 1650 556 L 1677 571 L 1675 704 L 1598 703 L 1568 650 L 1489 608 Z",
    top: "M 1450 525 L 1600 525 L 1655 541 L 1650 556 L 1477 556 L 1470 568 L 1450 568 Z",
    elements: ["M 1455 543 L 1475 543"],
    pylon: "M 1559 609 L 1579 610 L 1583 650 L 1563 649 Z",
    beam: "M 1587 710 L 1667 711",
  },
  panelLines: [
    "M 789 607 C 849 593 949 588 1099 592 C 1199 599 1299 605 1359 616",
  ],
  suspension: ["M 478 642 L 639 620", "M 482 733 L 577 724"],
  cockpit: {
    headrest: "M 997 605 L 1001 576 L 1040 571 L 1041 605 Z",
    hans: { cx: 944, cy: 606, rx: 40, ry: 10 },
  },
  helmetAt: { cx: 950, cy: 598, r: 51 },
  mirror: "M 809 573 L 849 571 L 850 596 L 811 598 Z M 829 598 L 832 605",
  tcam: "M 1051 484 L 1054 463 L 1066 459 L 1096 459 L 1106 468 L 1104 485 Z",
  tcamColor: "#c8e021",
  antenna: "M 489 603 L 490 565",
  rainLight: "M 1657 711 L 1672 711 L 1672 723 L 1657 723 Z",
  numberAt: { x: 1250, y: 525 },
};

export const CARS_2008: Record<"MP4-23" | "TF108" | "STR3" | "F2008", CarSpec> =
  {
    "MP4-23": MP4_23,
    TF108,
    STR3,
    F2008,
  };
