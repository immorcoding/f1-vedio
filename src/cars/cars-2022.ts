// 2022 Red Bull RB18 (VER #1): the outro's 2021 → 2022 turn-over (#24) and the whole car in the post-credits stinger.
// Traced from Lukas Raich's side-on photo "FIA F1 Austria 2022 Nr. 1 Verstappen (side)" (Commons, CC BY-SA 4.0), the
// same series as the 2021 traces. The photo was taken on a panning shot with the car rolled 6.9° on the frame; it is
// levelled with a rotation about the near wheel centres (`references/cars-2022/rb18-side-rectified.jpg`,
// docs/assets/reference-register.md). Shapes are checked against "(side 2)", the same car from three-quarters front.
//
// Scale (ART-35, rules win): the wheelbase is the 2022 maximum, 3600 mm (2022 Technical Regulations, Art. 3.4.2), between
// the two near hub centres (430 and 1603 px, well defined by the wheel nuts): 325.8 px per metre. The tyres are drawn
// at the 18-inch Pirelli's 0.72 m (Art. 10.8.1: at most 725 mm), r 117 px, standing on the photo's ground line. The
// photo agrees once the tyres are measured on a brightened crop: the rear tyre spans 1488–1720 px across (0.71 m); the
// earlier 108 px radius was the dark tyre's edge lost against the dark car, and taken as 0.72 m it put the wheelbase
// at 3.9 m.
//
// The 2022 shape against the RB16B (what a fan checks): 18-inch wheels behind flat covers (`rim: "covered"`) with the
// Pirelli band just outside the cover and the logo arcs on the shoulder, the sidepod falling from a high square inlet
// to the floor (deep undercut), the engine cover sloping down from a taller airbox with the T-camera on top, the rear
// wing's one-piece rounded tip (the endplate's front curls up into the wing; no square top corner) with a beam wing
// under it, and the low front wing whose endplate rises at the back, hung off a long low nose.
// Livery as colour blocks (ART-5, ART-8): matte navy, an orange airbox front running into a red block over the cover
// (the charging bull's mass, not its outline), the yellow-orange nose, a red pinstripe along the sidepod top and two
// red dashes on the chassis, the red sponsor panel on the rear endplate; the red 1 on the cover, low and forward of
// the rear wing.
import type { CarSpec, Driver } from "./spec";
import { PIRELLI_2021 } from "./cars-2021";

/** VER in 2022: the champion's number 1 and his helmet as on the reference photo (silver crown, red and yellow sides). */
export const VER_2022: Driver = {
  number: "1",
  helmet: { base: "#d3d5db", stripe: "#d72a2e", trim: "#f5a623" },
};

// photo px per metre: the near hub centres 1173 px apart at the 3.6 m maximum wheelbase
const PPM = 1173 / 3.6;

export const RB18: CarSpec = {
  name: "2022 Red Bull RB18",
  reference: "references/cars-2022/rb18-side-rectified.jpg",
  frame: { x: 1848, ground: 808, k: 250 / PPM },
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
    // yellow-orange nose top, from the tip back to the near front tyre (photo: 120 677 → 337 623 on top)
    {
      d: "M 104 694 C 150 672 230 652 330 624 L 392 606 L 396 630 C 330 645 260 660 200 676 C 160 686 130 696 108 704 Z",
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
  // the hub centres, the tyres at 0.72 m standing on the ground line
  nearWheels: [
    { cx: 430, cy: 691, r: 117 },
    { cx: 1603, cy: 691, r: 117 },
  ],
  farWheels: [
    { cx: 536, cy: 572, r: 107 },
    { cx: 1650, cy: 578, r: 108 },
  ],
  // As the RB16B (ART-26): far wheels at the near wheels' x in both looks.
  farSide: {
    // HIGH camera: the car as traced (the photo looks down ~13°); far wheels at 53 % of the traced lift, as on the
    // 2021 cars, mostly hidden behind the body; the ground shadow between the two rows of wheels.
    high: {
      wheels: [
        { cx: 430, cy: 628, r: 107 },
        { cx: 1603, cy: 631, r: 108 },
      ],
      groundShadow: true,
    },
    low: {
      wheels: [
        { cx: 430, cy: 683, r: 112 },
        { cx: 1603, cy: 683, r: 113 },
      ],
      frontEndplate: { dx: 4, dy: -8, scale: 0.95 },
      // The low 2022 nose drops behind the near endplate from a low camera, and the wing surface with it: the deck stays
      // inside the endplate (the generic side-on deck would stick out ahead of its curved top as a thin plank); only
      // the red flap shows, rising over the endplate's top at the back as the flaps turn up into it.
      frontDeck: "M 190 690 L 270 690 L 270 720 L 190 720 Z",
      frontFlap: "M 212 674 L 277 657 L 277 674 Z",
      // LOW camera: the body re-projected from the photo's 13.3° (the far wheels' traced lift over a 1.6 m track) to a
      // 4° trackside camera (seenFrom.ts).
      body: { photoElevation: 13.3, elevation: 4, floorY: 790, podY: 745, noseTo: 580 },
    },
  },
  rimR: 75, // the 18-inch rim (457 mm) under its cover
  rim: "covered",
  hubAccent: "#b5d334", // the lime ring round the wheel nut, as on the photo
  compound: PIRELLI_2021.soft,
  body:
    "M 104 694 C 150 672 230 652 330 624 C 400 604 450 572 510 556 L 600 541 L 700 534 L 760 530 L 1000 528 L 1068 526 " +
    "L 1072 500 C 1072 470 1074 452 1080 442 L 1095 436 L 1190 433 L 1250 437 L 1300 446 L 1350 456 L 1420 469 L 1480 485 " +
    "L 1545 502 L 1600 532 L 1660 565 L 1700 592 L 1842 600 L 1846 655 L 1720 670 L 1700 700 L 1520 765 L 1490 790 " +
    "L 600 796 L 585 790 L 576 702 C 470 702 360 704 260 706 C 190 708 140 710 108 708 Z",
  regions: {
    cover:
      "M 1068 440 L 1190 433 L 1300 446 L 1420 469 L 1545 502 L 1660 565 L 1720 640 C 1600 652 1460 642 1350 630 C 1250 622 1140 604 1060 594 Z",
    // the sidepod: from the high square inlet (752–774 px) down and back; its lower line is where the deep undercut
    // starts, falling to the floor towards the rear wheel (photo: 760 662 → 1100 745 → 1480 762)
    sidepod:
      "M 752 600 C 800 586 900 580 1000 586 C 1130 596 1250 620 1350 630 C 1460 642 1600 652 1720 640 L 1700 700 L 1500 762 C 1300 758 1100 745 960 718 C 880 700 800 676 758 662 Z",
    undercut:
      "M 576 652 L 756 662 C 800 676 880 700 960 718 C 1100 745 1300 758 1500 762 L 1490 792 L 600 798 L 585 790 Z",
    chassis:
      "M 400 600 L 510 556 L 600 541 L 760 530 L 1068 526 L 1060 594 C 1000 586 900 580 800 588 L 752 600 L 758 662 L 576 652 L 576 702 L 400 704 Z",
  },
  glints: [
    "M 820 590 C 900 588 980 592 1060 600 L 1058 607 C 980 600 900 596 820 597 Z",
    "M 1100 440 L 1160 438 L 1150 446 L 1104 448 Z",
  ],
  floor: "M 590 788 L 1495 778 L 1492 790 L 595 798 Z",
  frontWing: {
    // The 2022 near endplate (ART-12, ART-17): low, its leading edge sweeping back towards the ground, the top rising
    // at the back where the flaps turn up into it (photo: the "ESSO" panel, 180–277 px, top 669). The far one is its
    // copy, its top where the photo shows the far endplate's (the "A1" panel, top 540), without the photo's yaw.
    near: "M 73 703 C 100 688 140 672 182 669 L 277 671 L 279 797 L 130 795 C 110 770 88 735 73 703 Z",
    farFrom: { dx: 8, dy: -129, scale: 0.92 },
    // the wing surface between the endplates as the camera sees it from above, behind the nose; the red flap along its
    // trailing edge, rising from the near endplate's top to the far one's (the red lettering on the RB18's wing)
    deck: "M 73 703 C 74 660 78 610 81 571 L 150 545 L 269 542 L 271 658 L 279 671 L 279 797 L 130 795 C 110 770 88 735 73 703 Z",
    flap: { d: "M 236 543 L 269 542 L 279 671 L 244 671 Z", color: "#d72a2e" },
  },
  rearWing: {
    // The 2022 one-piece rear wing seen from the side (ART-17): the endplate body (photo: the red panel's top at 546,
    // the lower edge at 665) runs up its curved front into the rounded wing tip, whose top follows the wing up to the
    // flap's trailing edge at the rear; no square top corner. The heights fit the regulations' boxes (endplate body
    // 325–675 mm, wing tip up to 910 mm above the reference plane, Art. 3.10 and the reference volumes RV-RWEP-BODY,
    // RV-RW-TIP) seen from the photo's camera.
    near: "M 1700 665 C 1678 652 1662 628 1658 596 L 1655 548 C 1656 524 1668 506 1696 498 C 1740 490 1780 482 1812 470 L 1846 492 L 1848 660 L 1790 667 Z",
    // the red sponsor panel on the endplate body (1655–1820, 546–593 in the photo)
    livery: [
      { d: "M 1655 546 L 1820 546 L 1820 593 L 1658 593 Z", color: "#d72a2e" },
    ],
    // far endplate (HIGH; LOW hides it): the near one's copy at 0.84, its bounding-box centre x on the near one's,
    // lifted so its tip shows above the near one, near the far tip's top in the photo (417).
    // dx = (1 - 0.84) * 193 / 2.
    farFrom: { dx: 15, dy: -50, scale: 0.84 },
    // the far copy in the endplate's navy, without the red panel (as the RB16B)
    farLivery: false,
    elements: [],
    // Main plane and DRS flap side-on, inside the tip's top: the wing box 140–555 mm behind the rear axle (2022
    // Technical Regulations, RV-RW-PROFILES), here 1684–1812 px with the photo's yaw. Main plane thick and nearly
    // flat, the flap thin and steep with its trailing edge at the tip's top. Slot 13.7 mm closed (10–15 mm, Art.
    // 3.10.1), 85 mm with the flap turned 29.7° about its trailing edge (DRS open, Art. 3.10.10). Profiles generated from
    // a NACA-like thickness curve between the leading and trailing edges; both navy as on the car, the flap lighter.
    planes: {
      main: "M 1684.0 516.0 L 1691.8 512.1 L 1699.9 510.1 L 1708.0 508.4 L 1716.3 507.0 L 1724.5 505.8 L 1732.8 504.7 L 1741.1 503.6 L 1749.4 502.7 L 1757.7 501.8 L 1766.0 500.9 L 1766.0 501.2 L 1758.2 504.7 L 1750.3 508.0 L 1742.4 511.1 L 1734.5 514.0 L 1726.5 516.6 L 1718.4 518.9 L 1710.3 520.7 L 1702.0 521.8 L 1693.5 521.7 Z",
      flap: "M 1760.0 494.5 L 1764.7 491.1 L 1769.7 488.7 L 1774.9 486.6 L 1780.1 484.6 L 1785.4 482.7 L 1790.7 480.9 L 1796.0 479.1 L 1801.3 477.3 L 1806.6 475.6 L 1812.0 474.0 L 1812.0 474.1 L 1807.3 477.3 L 1802.5 480.4 L 1797.7 483.3 L 1792.8 486.2 L 1787.8 488.9 L 1782.8 491.4 L 1777.7 493.6 L 1772.4 495.4 L 1766.8 496.5 Z",
      pivot: { x: 1812, y: 474 },
      drsOpen: 29.7,
    },
    // no pylon: the swan neck stands on the centre line behind the near endplate (ART-17)
    // the beam wing, 325–500 mm up and 270–550 mm behind the rear axle (RV-RW-BEAM)
    beam: "M 1690 625 L 1792 625",
  },
  panelLines: [
    "M 752 600 L 770 594 L 774 656 L 758 662",
    "M 800 586 C 950 584 1100 598 1226 616 C 1360 634 1520 646 1640 650",
    "M 774 656 C 850 690 960 718 1100 738 C 1250 752 1400 760 1500 762",
  ],
  suspension: ["M 430 640 L 580 590", "M 450 760 L 585 720"],
  halo: "M 760 530 C 772 506 792 490 822 484 L 1000 524",
  haloFar: "M 822 472 C 835 467 855 466 875 468 L 1068 490",
  cockpit: {
    headrest: "M 1040 528 C 1042 512 1050 500 1062 498 L 1070 504 L 1068 528 Z",
    hans: { cx: 1005, cy: 530, rx: 46, ry: 14 },
  },
  // 0.29 m long at 325.8 px per metre (ART-13)
  helmetAt: { cx: 1012, cy: 520, r: 45 },
  mirror: "M 548 520 L 590 518 L 592 532 L 550 535 Z M 568 534 L 572 552",
  // the T-camera on top of the airbox (black on VER's car)
  tcam: "M 1100 436 L 1098 400 L 1150 398 L 1153 436 Z",
  antenna: "M 725 530 L 725 494",
  rainLight: "M 1826 614 L 1842 614 L 1842 628 L 1826 628 Z",
  // the red 1 on the engine cover, checked on both photos: x 1480–1522, caps 502–548 in the rectified photo
  numberAt: { x: 1500, y: 548, size: 64, color: "#e5333f" },
  top: { marks: { noseTip: "#fdb746", podStripe: "#e3262b" } },
};
