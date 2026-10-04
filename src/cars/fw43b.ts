// 2021 Williams FW43B (Latifi #6), top view only. Shot 4.3 shows it only on a top-down inset (the turn-14 crash), so
// it has no side trace: a TopOnlyCar with the modern planform (modernPlanFrom), its lengths measured on Lukas Raich's
// side photo "FIA F1 Austria 2021 Nr. 6 Latifi (side)" (Wikimedia Commons, CC BY-SA 4.0) at the W12/RB16B scale of
// 312.5 photo px per metre (the tyre's 0.66 m = 206 px across): rear-wing trailing edge at photo x 1845, rear axle
// 1626, front axle 522, helmet centre 950, nose tip 160 — wheelbase 3.53 m, overall 5.39 m.
// Colours sampled from that photo and its "(back)" companion: the 2021 livery in flat blocks — royal-blue body with the
// light-blue waves across the sidepods and engine cover, the near-black tail with its orange pinstripes, the white
// nose, navy wings with a black rear-wing top, the fluorescent-yellow T-camera, and Latifi's white helmet with its red
// crown. No lettering or logos (ART-5); the race number is not drawn from above (ART-27). The tyre compound he was on
// is not verified (facts.md), so the tyres carry no band.
import { modernPlanFrom, roundedBox, symmetric } from "./plan";
import type { CarPlan, PlanLengths, TopOnlyCar } from "./spec";

const LEN: PlanLengths = {
  rearAxle: (1845 - 1626) / 312.5,
  frontAxle: (1845 - 522) / 312.5,
  length: (1845 - 160) / 312.5,
  helmet: (1845 - 950) / 312.5,
  halo: true,
};

const C = {
  blue: "#2d41ab",
  deep: "#1c2b7e",
  wave: "#6bcff4",
  tail: "#1c1a2a",
  orange: "#f39a2a",
  white: "#f2f1f6",
  navy: "#1b2058",
  carbon: "#17171c",
  tcam: "#e6ee3a",
};

// Half width of the modern sidepod outline at x (as in modernPlanFrom), m.
const POD: [number, number][] = [
  [0.62, 0.16],
  [1.25, 0.3],
  [2.0, 0.5],
  [2.75, 0.68],
  [3.05, 0.72],
];
const podHalf = (x: number) => {
  for (let i = 1; i < POD.length; i++) {
    const [x0, y0] = POD[i - 1];
    const [x1, y1] = POD[i];
    if (x <= x1) return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
  }
  return POD[POD.length - 1][1];
};

const poly = (pts: [number, number][]) =>
  `M ${pts.map(([x, y]) => `${x.toFixed(3)} ${y.toFixed(3)}`).join(" L ")} Z`;

const plan = (): CarPlan => {
  const base = modernPlanFrom(LEN);
  const hx = LEN.helmet;
  const L = LEN.length;
  // The light-blue waves: on the side photo each band leans back as it climbs (its top on the engine cover further
  // rear than its foot on the sidepod), so from above each one is a chevron with its point on the spine, its arms
  // running forward and out over the cover, carried on down each sidepod to near the pod's outer edge.
  const WAVES = [1.55, 1.77, 1.99, 2.21, 2.43];
  const coverWaves = WAVES.map((x) =>
    poly([
      [x, 0],
      [x + 0.13, 0.2],
      [x + 0.185, 0.2],
      [x + 0.055, 0],
      [x + 0.185, -0.2],
      [x + 0.13, -0.2],
    ]),
  );
  const podWaves = [...WAVES, 2.65].flatMap((x) =>
    [1, -1].map((s) => {
      const x0 = x + 0.16;
      const x1 = Math.min(3.0, x0 + 0.36);
      return `M ${x0} ${s * 0.22} C ${x0 + 0.1} ${s * 0.36} ${x1 - 0.1} ${s * podHalf(x1) * 0.7} ${x1} ${s * podHalf(x1) * 0.9}`;
    }),
  );
  // the near-black tail, three orange pinstripes on each shoulder
  const tail = symmetric([
    [0.5, 0.1],
    [1.3, 0.14],
    [1.48, 0.15],
  ]);
  const pins = [0.95, 1.1, 1.25].flatMap((x) =>
    [1, -1].map((s) =>
      poly([
        [x, s * 0.05],
        [x + 0.025, s * 0.05],
        [x + 0.1, s * 0.13],
        [x + 0.075, s * 0.13],
      ]),
    ),
  );
  return {
    ...base,
    stripes: [{ d: podWaves.join(" "), color: C.wave, width: 0.055 }],
    livery: [
      { d: tail, color: C.tail },
      ...pins.map((d) => ({ d, color: C.orange })),
      ...coverWaves.map((d) => ({ d, color: C.wave })),
    ],
    // the white nose, from just ahead of the cockpit to the tip (on the tub's outline)
    accents: [
      {
        d: symmetric([
          [hx + 0.86, 0.31],
          [hx + 0.95, 0.305],
          [LEN.frontAxle - 0.3, 0.17],
          [L - 0.55, 0.11],
          [L - 0.2, 0.08],
          [L - 0.07, 0.05],
        ]),
        color: C.white,
      },
    ],
    tcam: { d: roundedBox(hx - 0.28, 0, 0.08, 0.26), color: C.tcam },
    rearWing: { ...base.rearWing, color: C.carbon, endplateColor: C.navy },
  };
};

export const FW43B: TopOnlyCar = {
  name: "2021 Williams FW43B",
  reference: "references/yas-marina/latifi-fw43b-2021-side.jpg",
  driver: { number: "6", helmet: { base: "#f4f4f2", stripe: "#d5282e" } },
  paint: {
    cover: C.blue,
    chassis: C.deep,
    sidepod: C.blue,
    undercut: "#0d0f1c",
    wing: C.navy,
    frontDeck: C.navy,
    rearTop: C.carbon,
    mirror: C.blue,
  },
  lengths: LEN,
  plan: plan(),
  flap: C.blue,
};
