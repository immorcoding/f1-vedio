// CarSpec: one traced car (ART-4, ART-10). Every path is in the pixel space of the car's side-on reference photo,
// where the car faces left; `frame` maps photo pixels to the car's own frame. A new car is a new CarSpec traced the
// same way — the renderer (MangaCar) never changes per car.
//
// Era features are optional fields, so one shape covers every car from 1989 to 2021 (ART-4, ART-13):
// - halo (2018+): `halo` + `haloFar` (+ `haloAccent`); leave them out before 2018.
// - cockpit: modern cars have `cockpit.headrest` + `cockpit.hans`; an open period cockpit has `cockpit.opening`
//   (the dark tub between rim and helmet) and a tinted `windscreen`.
// - details that came with later eras: `tcam` (+ `tcamColor`, which tells team-mates apart from 2008), `antenna`,
//   `rainLight`, `rearWing.beam`; leave out what the car did not have.
// - tyres: `compound` is the sidewall band colour (Pirelli 2011+); leave it out for plain sidewalls (Bridgestone,
//   Goodyear). Dry or wet tread is a race state (CarState.tread), not car data.
// - helmet: Driver.helmet `shell` ("modern" with air intake and spoiler, or "classic") and either the default two
//   stripes (`stripe`, `trim`) or the real `design` as colour blocks.
// - top view (`top`): built from the side trace for the modern planform, or traced in plan for another shape.

export type Wheel = { cx: number; cy: number; r: number };

// The far endplate of a wing as the copy of the near one seen further away (ART-17): scaled by `scale` about the near
// endplate's bounding-box corner (min x, min y), then moved by (dx, dy) photo px.
export type EndplateCopy = { dx: number; dy: number; scale: number };
export type Accent = { d: string; color: string };

// Real livery colours, one flat manga fill per form region (ART-8); screentone dots add the shading on top.
export type Paint = {
  cover: string; // top of the engine cover, lit
  chassis: string; // chassis flank, halo, headrest, mirror
  sidepod: string;
  undercut: string; // undercut and floor, in shadow
  wing: string; // wing endplates
  frontDeck: string; // front wing surface
  rearTop: string; // rear wing seen from above
  mirror?: string; // mirror housing, when it is not the chassis colour
};

// The driver in this car: race number and helmet colours (ART-5, ART-13). Two cars of one team share a CarSpec
// and differ only here: `{ ...MP4_5, driver: PRO_1989 }`.
export type Driver = {
  number: string;
  helmet: {
    base: string;
    // The default design: a broad `stripe` over the crown and a thin `trim` stripe along the side (defaults to
    // `stripe`).
    stripe: string;
    trim?: string;
    // Shell of the era (ART-13): "modern" (default) has the top air intake and the rear spoiler; "classic" is the
    // smooth full-face shell of the 1980s–90s without them.
    shell?: "modern" | "classic";
    // The real helmet design as colour blocks, drawn instead of the default stripes. Paths are in helmet units:
    // origin at the helmet centre, 1 = helmet radius, helmet facing left (visor at -x), y down.
    design?: Accent[];
  };
};

// ── Top view (MangaCar view "top", MOT-2) ───────────────────────────────────────────────────────────────────────
// Planform in metres: x forward from the rear end, y across (to the car's right, screen down when the car heads
// screen right). Closed paths unless noted. TopCar draws it in the car's paint, layer by layer in this order.
export type CarPlan = {
  // Tyres: centre (x along, y across), diameter and width, m; the front ones `steer`.
  wheels: {
    x: number;
    y: number;
    length: number;
    width: number;
    steer?: boolean;
  }[];
  suspension?: string; // wishbones, ink lines (open path)
  floor?: string; // paint.undercut
  sidepods: string; // paint.sidepod; the dot screen shades its far (right-hand) half
  stripes?: { d: string; color: string; width: number }[]; // painted stripes (open paths, width in m)
  cover?: string; // engine cover / spine: paint.cover
  livery: Accent[]; // colour blocks on the sidepods and cover, under the chassis
  chassis?: string; // tub and nose: paint.chassis, dot-shaded like the sidepods
  accents?: Accent[]; // small blocks with a thin ink edge, on top (nose tip, chevrons)
  outline?: string; // one-piece body silhouette, inked again over the livery
  inlets?: string[]; // sidepod inlets, ink
  airbox?: string; // engine-cover air intake behind the driver's head, ink
  cockpit: string; // the opening, ink
  helmet: { x: number; r: number }; // helmet centre along the car and radius, m
  windscreen?: string; // period cars: tinted screen in front of the cockpit
  halo?: string; // open path
  mirrors?: string[]; // paint.mirror (or chassis), one path each
  frontWing: { deck: string; flap?: string; endplates?: string };
  rearWing: {
    top: string;
    color?: string;
    element?: string;
    endplates?: string; // open path; both endplates alike (ART-17)
    endplateColor?: string; // default paint.wing
  };
  glints?: string; // floodlight on the upper edges, white lines (open path)
};

// Colours seen only from above, for a car drawn with the modern planform (modernPlan). Real livery, no logos (ART-5).
export type TopMarks = {
  noseTip?: string; // the very front of the nose
  coverStripe?: string; // a block on the engine cover / airbox
  podStripe?: string; // a stripe along each sidepod top
};

export type CarSpec = {
  name: string;
  // Local reference photo the paths are traced in (git-ignored; registered in docs/assets/reference-register.md).
  reference: string;
  // Photo pixels → car units: carX = (frame.x - px) * k, carY = (py - frame.ground) * k, with 250 car units = 1 m,
  // so frame.x is the car's rear end and frame.ground its ground line.
  frame: { x: number; ground: number; k: number };
  driver: Driver;
  paint: Paint;
  // Livery colour blocks beyond the stripes, on the body. No logos or text (ART-5). Colour blocks on a wing endplate
  // go in that wing's `livery`, so the far endplate carries them too (ART-17).
  livery: Accent[];
  accents: Accent[];
  haloAccent?: Accent;
  nearWheels: [Wheel, Wheel]; // front, rear
  // Far-side wheels as traced on the photo (front, rear). The trace photos are shot from above, so the far wheels sit
  // high there; the renderer draws them lower (drawnFarWheels).
  farWheels: [Wheel, Wheel];
  rimR: number;
  rim: "spoked" | "dark";
  rimAccent?: string;
  // Default tyre sidewall band colour (Pirelli soft red, hard white, …); a scene can override it per race (CarState).
  // Leave it out for tyres without a coloured band (before 2011: Bridgestone, Goodyear).
  compound?: string;
  // Longitudinal grooves in a dry tyre's tread, seen in the top view (4 on the 2008 grooved Bridgestones); leave it
  // out for slicks.
  tyreGrooves?: number;
  body: string;
  // Form regions, each a closed path, clipped to the body.
  regions: {
    cover: string;
    sidepod: string;
    undercut: string;
    chassis: string;
  };
  // Glossy reflections, drawn white over the paint.
  glints: string[];
  floor: string;
  // Simplified front wing (ART-12): far and near endplates, and one wing surface between them drawn behind the
  // nose, with an accent-coloured flap running the whole trailing edge between the endplates (no diagonal stripes).
  // The two endplates of a wing are one shape with the same colours (ART-17): the renderer draws the far endplate as
  // the perspective copy (`farFrom`) of the near one, colour blocks (`livery`) included. The same holds for the rear
  // wing.
  frontWing: {
    near: string;
    farFrom?: EndplateCopy;
    deck: string;
    flap: Accent;
    livery?: Accent[];
  };
  rearWing: {
    near: string;
    // the far rear endplate (the near one's perspective copy), drawn behind the wing surface (`top`)
    farFrom?: EndplateCopy;
    livery?: Accent[];
    // the wing elements between the endplates as the camera sees them from above; leave it out where the reference
    // photo sees the wing edge-on
    top?: string;
    elements: string[];
    pylon: string;
    beam?: string; // lower (beam) wing, where the car has one
  };
  // A few ink lines only (ART-11).
  panelLines: string[];
  suspension: string[];
  // Halo (ART-13): the near bar runs down from the front pylon past the helmet; the far bar sits higher behind it.
  // The opening between them stays transparent. Cars before 2018 have none: leave both out.
  halo?: string;
  haloFar?: string;
  cockpit: {
    headrest?: string;
    hans?: { cx: number; cy: number; rx: number; ry: number };
    // Dark cockpit interior seen between the rim and the helmet (open period cockpits without a headrest wall).
    opening?: string;
  };
  helmetAt: { cx: number; cy: number; r: number };
  // Windscreen in front of the cockpit (period cars), drawn tinted on the near side.
  windscreen?: string;
  mirror: string;
  tcam?: string;
  // Colour of the T-camera pod (ink when left out). From 2008 on it tells a team's two cars apart.
  tcamColor?: string;
  antenna?: string;
  rainLight?: string;
  // Race number position (text baseline centre) and its font size in photo px (default 46; Arial Black caps are
  // 0.72 of it). As painted on the real car: `color` (paper with an ink edge when left out), `angle` in degrees in
  // the photo (positive turns clockwise as the photo faces), and `squash` (vertical scale) for a number painted on a
  // top surface and seen nearly edge-on from the side.
  numberAt: {
    x: number;
    y: number;
    size?: number;
    color?: string;
    angle?: number;
    squash?: number;
    stretch?: number; // horizontal scale, for a number painted long along the bodywork
  };
  // Where the car tears in two when it breaks up (CarState.split): a jagged polyline from above the car to below it,
  // running down the engine bulkhead between the survival cell (with the fuel cell) and the power unit. Only needed
  // for a car that is shown broken.
  breakLine?: string;
  // Strength of the dot shading on the chassis and sidepods, 1 (default) = as on the dark 2021 cars. A white livery
  // takes less, or the dots turn it grey.
  shade?: number;
  // Top view. Leave it out for a car of the modern (2017–2021) shape: its planform is built from this side trace
  // (modernPlan), coloured with `paint` and the top-only `marks`. A car of another shape carries its own `plan`.
  top?: { marks?: TopMarks; plan?: CarPlan };
};

export const CAR_UNITS_PER_METRE = 250;

// Photo pixels per metre of this car's trace.
export const photoPxPerMetre = (car: CarSpec) =>
  CAR_UNITS_PER_METRE / car.frame.k;

// Where the far-side wheels are drawn. The reference photos look down on the car, which lifts the far wheels well above
// the near ones; on the MV's low side-on camera they only peek out just above and behind the near wheels (user review
// 2026-10-04). So each far wheel keeps its traced x and size, and its height above its near wheel is FAR_WHEEL_LIFT of
// the traced height, the same proportion on every car. Where a car's nose or body is taller than that, it hides the
// far wheel, as on a real side-on view.
export const FAR_WHEEL_LIFT = 0.5;
export const drawnFarWheels = (car: CarSpec): [Wheel, Wheel] =>
  car.farWheels.map((w, i) => {
    const near = car.nearWheels[i];
    return { ...w, cy: near.cy - (near.cy - w.cy) * FAR_WHEEL_LIFT };
  }) as [Wheel, Wheel];

// Named points on the car, in metres from the car's origin (rear end, on the ground): x forward, y up.
export type CarLandmark =
  | "frontContact"
  | "rearContact"
  | "frontAxle"
  | "rearAxle"
  | "nose";

export const carPoint = (car: CarSpec, landmark: CarLandmark) => {
  const m = (px: number, py: number) => ({
    x: (car.frame.x - px) / photoPxPerMetre(car),
    y: (car.frame.ground - py) / photoPxPerMetre(car),
  });
  const [front, rear] = car.nearWheels;
  switch (landmark) {
    case "frontContact":
      return { x: m(front.cx, 0).x, y: 0 };
    case "rearContact":
      return { x: m(rear.cx, 0).x, y: 0 };
    case "frontAxle":
      return m(front.cx, front.cy);
    case "rearAxle":
      return m(rear.cx, rear.cy);
    case "nose":
      return {
        x: m(
          Math.min(
            ...[car.body, car.frontWing.near, car.frontWing.deck].flatMap(
              pathXs,
            ),
          ),
          0,
        ).x,
        y: 0,
      };
  }
};

// Overall length of the car in metres (rear end to the front wing tip).
export const carLength = (car: CarSpec) => carPoint(car, "nose").x;

// Bounding-box corner (min x, min y) of an absolute-coordinate SVG path (M/L/C/Z only, as traced).
export const pathMin = (d: string) => {
  const nums = d
    .replace(/[MLCZ]/g, " ")
    .trim()
    .split(/\s+/)
    .map(Number);
  return {
    x: Math.min(...nums.filter((_, i) => i % 2 === 0)),
    y: Math.min(...nums.filter((_, i) => i % 2 === 1)),
  };
};

// The far endplate's transform (EndplateCopy) as an SVG transform, for paths in the near endplate's coordinates.
export const endplateCopyTransform = (near: string, c: EndplateCopy) => {
  const o = pathMin(near);
  return `translate(${o.x + c.dx} ${o.y + c.dy}) scale(${c.scale}) translate(${-o.x} ${-o.y})`;
};

// x coordinates of an absolute-coordinate SVG path (M/L/C/Z only, as traced).
const pathXs = (d: string) => {
  const nums = d
    .replace(/[MLCZ]/g, " ")
    .trim()
    .split(/\s+/)
    .map(Number);
  return nums.filter((_, i) => i % 2 === 0);
};
