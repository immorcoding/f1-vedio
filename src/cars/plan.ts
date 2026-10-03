// Planforms for the top view (CarPlan, MOT-2). Most cars need no plan of their own: `modernPlan` builds the 2017–2021
// shape from the side trace, so the two views agree — lengths (axles, cockpit, helmet, wings, overall length) come
// from the side trace (ART-10), widths from the 2021 technical regulations and the rear-view reference photos
// (overall and front-wing span 2.0 m, rear wing 1.05 m, 13-inch tyres 0.66 m across, 305 mm wide front, 405 mm rear;
// docs/assets/reference-register.md). A car of another shape (the 1989 MP4/5) carries a traced plan in its spec.
import {
  carPoint,
  photoPxPerMetre,
  type Accent,
  type CarPlan,
  type CarSpec,
  type TopMarks,
} from "./spec";

// Mirror a half outline (y ≥ 0, from rear to front) into a closed outline symmetric about the centre line.
export const symmetric = (half: [number, number][]) => {
  const right = half.map(([x, y]) => `${x} ${y}`);
  const left = [...half].reverse().map(([x, y]) => `${x} ${-y}`);
  return `M ${right.join(" L ")} L ${left.join(" L ")} Z`;
};

// A closed outline on one side of the car (side 1 = right, -1 = left) from points given for the right side.
export const symmetricSide = (side: number, pts: [number, number][]) =>
  `M ${pts.map(([x, y]) => `${x} ${side * y}`).join(" L ")} Z`;

// Rounded rectangle centred on (x, y): `len` along the car, `w` across, in metres (tyres, mirrors).
export const roundedBox = (x: number, y: number, len: number, w: number) => {
  const r = Math.min(w, len) * 0.28;
  const x0 = x - len / 2;
  const x1 = x + len / 2;
  const y0 = y - w / 2;
  const y1 = y + w / 2;
  return `M ${x0 + r} ${y0} L ${x1 - r} ${y0} Q ${x1} ${y0} ${x1} ${y0 + r} L ${x1} ${y1 - r} Q ${x1} ${y1} ${x1 - r} ${y1} L ${x0 + r} ${y1} Q ${x0} ${y1} ${x0} ${y1 - r} L ${x0} ${y0 + r} Q ${x0} ${y0} ${x0 + r} ${y0} Z`;
};

// The 2017–2021 planform of a traced car, in its paint plus the top-only `marks`. A car without a halo (before 2018)
// gets none here either.
export const modernPlan = (car: CarSpec, marks: TopMarks = {}): CarPlan => {
  const ra = carPoint(car, "rearAxle").x;
  const fa = carPoint(car, "frontAxle").x;
  const L = carPoint(car, "nose").x;
  // the helmet's place along the car, from the side trace
  const hx = (car.frame.x - car.helmetAt.cx) / photoPxPerMetre(car);
  const fwX0 = L - 0.7;
  const podStripe = (s: number) =>
    `M 1.5 ${s * 0.36} C 2.1 ${s * 0.5} 2.6 ${s * 0.6} 3.0 ${s * 0.64}`;
  const livery: Accent[] = marks.coverStripe
    ? [
        {
          d: symmetric([
            [hx - 0.75, 0.13],
            [hx - 0.22, 0.23],
          ]),
          color: marks.coverStripe,
        },
      ]
    : [];
  const accents: Accent[] = marks.noseTip
    ? [
        {
          d: symmetric([
            [L - 0.32, 0.09],
            [L - 0.06, 0.06],
          ]),
          color: marks.noseTip,
        },
      ]
    : [];
  return {
    wheels: [
      { x: ra, y: 0.8, length: 0.66, width: 0.405 },
      { x: ra, y: -0.8, length: 0.66, width: 0.405 },
      { x: fa, y: 0.85, length: 0.66, width: 0.305, steer: true },
      { x: fa, y: -0.85, length: 0.66, width: 0.305, steer: true },
    ],
    suspension: `M ${fa - 0.12} 0.12 L ${fa} 0.78 M ${fa + 0.12} 0.1 L ${fa} 0.78 M ${fa - 0.12} -0.12 L ${fa} -0.78 M ${fa + 0.12} -0.1 L ${fa} -0.78 M ${ra + 0.2} 0.2 L ${ra} 0.7 M ${ra - 0.1} 0.15 L ${ra} 0.7 M ${ra + 0.2} -0.2 L ${ra} -0.7 M ${ra - 0.1} -0.15 L ${ra} -0.7`,
    floor: symmetric([
      [0.85, 0.42],
      [1.1, 0.78],
      [3.25, 0.8],
      [3.45, 0.74],
    ]),
    sidepods: symmetric([
      [0.62, 0.16],
      [1.25, 0.3],
      [2.0, 0.5],
      [2.75, 0.68],
      [3.05, 0.72],
      [3.18, 0.66],
      [3.2, 0.3],
    ]),
    stripes: marks.podStripe
      ? [
          {
            d: `${podStripe(1)} ${podStripe(-1)}`,
            color: marks.podStripe,
            width: 0.07,
          },
        ]
      : [],
    cover: symmetric([
      [0.5, 0.1],
      [1.3, 0.14],
      [2.3, 0.2],
      [hx - 0.2, 0.24],
    ]),
    livery,
    // tub and nose; the nose runs forward over the front wing to its tip, at the wing's leading edge
    chassis: symmetric([
      [hx - 0.22, 0.3],
      [hx + 0.95, 0.31],
      [fa - 0.3, 0.17],
      [L - 0.55, 0.11],
      [L - 0.2, 0.08],
      [L - 0.07, 0.05],
    ]),
    accents,
    // sidepod inlets just behind the front of each pod
    inlets: [1, -1].map((s) =>
      symmetricSide(s, [
        [3.04, 0.36],
        [3.17, 0.34],
        [3.16, 0.64],
        [3.02, 0.66],
      ]),
    ),
    // the airbox above the roll hoop, behind the helmet
    airbox: roundedBox(hx - 0.3, 0, 0.16, 0.2),
    cockpit: symmetric([
      [hx - 0.2, 0.2],
      [hx + 0.55, 0.23],
      [hx + 0.72, 0.12],
    ]),
    helmet: { x: hx, r: 0.135 },
    halo: car.halo
      ? `M ${hx - 0.18} 0.25 C ${hx + 0.3} 0.32 ${hx + 0.75} 0.24 ${hx + 0.86} 0 C ${hx + 0.75} -0.24 ${hx + 0.3} -0.32 ${hx - 0.18} -0.25 M ${hx + 0.86} 0 L ${hx + 1.02} 0`
      : undefined,
    mirrors: [
      roundedBox(hx + 0.5, 0.42, 0.1, 0.16),
      roundedBox(hx + 0.5, -0.42, 0.1, 0.16),
    ],
    frontWing: {
      // leading edge swept back from the nose to the endplates; trailing edge nearly straight
      deck: `M ${fwX0} -1 L ${fwX0 + 0.34} -1 C ${L - 0.3} -0.6 ${L - 0.08} -0.25 ${L - 0.06} 0 C ${L - 0.08} 0.25 ${L - 0.3} 0.6 ${fwX0 + 0.34} 1 L ${fwX0} 1 C ${fwX0 + 0.06} 0.5 ${fwX0 + 0.06} -0.5 ${fwX0} -1 Z`,
      flap: `M ${fwX0} -0.98 C ${fwX0 + 0.06} -0.5 ${fwX0 + 0.06} 0.5 ${fwX0} 0.98 L ${fwX0 + 0.12} 0.98 C ${fwX0 + 0.18} 0.5 ${fwX0 + 0.18} -0.5 ${fwX0 + 0.12} -0.98 Z`,
      endplates: `M ${fwX0 - 0.02} -1.0 L ${fwX0 + 0.44} -1.0 M ${fwX0 - 0.02} 1.0 L ${fwX0 + 0.44} 1.0`,
    },
    rearWing: {
      top: `M 0.02 -0.525 L 0.6 -0.525 L 0.6 0.525 L 0.02 0.525 Z`,
      element: "M 0.36 -0.5 L 0.36 0.5",
      endplates: `M 0.02 -0.54 L 0.62 -0.54 M 0.02 0.54 L 0.62 0.54`,
    },
    glints: `M 1.3 -0.31 C 2.0 -0.5 2.6 -0.66 3.0 -0.7 M ${hx + 0.95} -0.29 L ${L - 0.55} -0.1`,
  };
};

// The plan a car is drawn with from above.
export const planOf = (car: CarSpec): CarPlan =>
  car.top?.plan ?? modernPlan(car, car.top?.marks);
