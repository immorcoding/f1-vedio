// PROTOTYPE — side profile of a 2021-era F1 car, shared by the three style studies.
// Car units: 250 units = 1 m. x runs forward (rear wing tip ≈ 30, front wing tip ≈ 1420), y is down, ground at y = 0.

export type Wheel = { cx: number; cy: number; r: number };

export const WHEELS: Wheel[] = [
  { cx: 165, cy: -84, r: 84 },
  { cx: 1060, cy: -84, r: 84 },
];
export const RIM_R = 46;

export const CAR = {
  body:
    "M 180 -40 L 180 -112 C 260 -122 380 -150 470 -185 L 590 -232 L 640 -238 L 662 -232 L 662 -200 L 650 -190 L 652 -160 L 700 -158 L 830 -150 " +
    "C 900 -146 1000 -132 1080 -118 C 1180 -102 1260 -88 1335 -76 L 1342 -62 C 1260 -58 1150 -60 1060 -66 L 960 -72 L 905 -80 L 890 -30 L 240 -30 Z",
  floor: "M 225 -20 L 905 -20 L 912 -31 L 230 -31 Z",
  sidepodLine: "M 822 -128 C 700 -128 560 -118 460 -100 C 380 -86 300 -66 250 -50",
  inlet: "M 822 -128 L 834 -128 L 834 -84 L 814 -80",
  undercut: "M 814 -80 C 700 -62 560 -46 400 -37",
  vanes: ["M 868 -40 L 860 -100", "M 892 -40 L 886 -96", "M 916 -42 L 912 -90", "M 940 -46 L 938 -84"],
  boomerang: "M 850 -112 C 890 -122 935 -116 958 -104",
  fin: "M 575 -232 C 460 -200 330 -150 230 -116",
  headrest: "M 650 -160 C 660 -178 692 -180 702 -160",
  airboxMouth: "M 662 -232 C 674 -229 675 -204 662 -200",
  halo: "M 846 -150 C 842 -176 820 -206 762 -211 L 682 -208 C 664 -206 656 -196 652 -184",
  mirror: "M 850 -170 L 888 -172 L 888 -156 L 852 -156 Z",
  mirrorStalk: "M 852 -158 L 840 -148",
  rearWingEndplate: "M 28 -246 L 152 -246 L 152 -132 L 124 -100 L 40 -100 L 28 -120 Z",
  rearWingLines: ["M 36 -236 L 152 -236", "M 40 -220 C 86 -214 128 -216 152 -224", "M 96 -204 L 108 -132"],
  beamWing: "M 58 -96 C 100 -101 142 -99 176 -92",
  frontWingEndplate: "M 1290 -8 L 1422 -8 L 1422 -40 C 1400 -52 1360 -66 1302 -72 L 1290 -60 Z",
  frontWingLines: ["M 1300 -14 L 1422 -14", "M 1310 -26 C 1350 -28 1390 -36 1422 -46", "M 1326 -38 C 1360 -42 1395 -52 1420 -60"],
  frontWingPillars: ["M 1250 -60 L 1268 -16", "M 1290 -64 L 1302 -16"],
  suspension: ["M 1060 -84 L 990 -122", "M 1060 -84 L 982 -70", "M 1060 -84 L 1008 -130", "M 165 -84 L 262 -112", "M 165 -84 L 252 -60"],
  rearLight: "M 168 -114 L 180 -114 L 180 -98 L 168 -98 Z",
  accentStripe: "M 822 -114 C 680 -112 520 -102 380 -80 L 372 -66 C 520 -88 680 -98 822 -100 Z",
  noseAccent: "M 1240 -90 C 1280 -84 1310 -80 1335 -76 L 1342 -62 C 1300 -60 1270 -60 1240 -61 Z",
  engineAccent: "M 600 -224 C 520 -198 420 -162 300 -126 L 296 -112 C 420 -146 520 -182 604 -208 Z",
  helmet: { cx: 736, cy: -176, r: 30 },
  visor: "M 744 -192 C 762 -192 770 -180 767 -168 L 746 -168 Z",
  number: { x: 1150, y: -74 },
  // Upper part of the car, where floodlights catch the paint.
  topBand: "M 0 -400 L 1500 -400 L 1500 -96 L 0 -96 Z",
  // Lower band of the car that sits in shadow under floodlights from above.
  shadowBand: "M 180 -70 L 1342 -70 L 1342 0 L 180 0 Z",
};

export type CarSkin = {
  body: string;
  accent: string;
  nose: string;
  helmet: string;
  compound: string; // Pirelli sidewall colour: soft red, medium yellow, hard white
  number: string;
};

export const RED_BULL_2021: CarSkin = { body: "#1b2350", accent: "#d71920", nose: "#ffcc00", helmet: "#f28c28", compound: "#e3262b", number: "33" };
export const MERCEDES_2021: CarSkin = { body: "#1c1c1e", accent: "#00a19b", nose: "#00a19b", helmet: "#e8e8ea", compound: "#f4f4f4", number: "44" };

// Scene placement shared by every style: camera on the outside of T5, so HAM (outside line) is nearer.
export const HAM_PLACE = { x: 150, ground: 915, scale: 1.0 };
export const VER_PLACE = { x: 600, ground: 770, scale: 0.8 };
export const placeTransform = (p: { x: number; ground: number; scale: number }) => `translate(${p.x} ${p.ground}) scale(${p.scale})`;
// Screen position of VER's front contact patch, where the lock-up smoke starts.
export const VER_LOCKUP = { x: VER_PLACE.x + 1060 * VER_PLACE.scale, y: VER_PLACE.ground };

export const spokes = (w: Wheel, r: number, n = 10) =>
  Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    return `M ${w.cx + Math.cos(a) * r * 0.25} ${w.cy + Math.sin(a) * r * 0.25} L ${w.cx + Math.cos(a) * r * 0.92} ${w.cy + Math.sin(a) * r * 0.92}`;
  }).join(" ");
