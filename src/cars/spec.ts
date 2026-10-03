// CarSpec: one traced car (ART-4, ART-10). Every path is in the pixel space of the car's side-on reference photo,
// where the car faces left; `frame` maps photo pixels to the car's own frame. A new car is a new CarSpec traced the
// same way — the renderer (MangaCar) never changes per car.

export type Wheel = { cx: number; cy: number; r: number };
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
};

// The driver in this car: race number and helmet colours (ART-5, ART-13). Two cars of one team share a CarSpec
// and differ only here: `{ ...MP4_5, driver: PRO_1989 }`.
export type Driver = {
  number: string;
  helmet: { base: string; stripe: string };
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
  // Livery colour blocks beyond the stripes, on the body and on the wings. No logos or text (ART-5).
  livery: Accent[];
  wingLivery: Accent[];
  accents: Accent[];
  haloAccent?: Accent;
  nearWheels: [Wheel, Wheel]; // front, rear
  farWheels: [Wheel, Wheel];
  rimR: number;
  rim: "spoked" | "dark";
  rimAccent?: string;
  // Default tyre sidewall band colour (Pirelli soft red, hard white, …); a scene can override it per race.
  compound: string;
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
  // nose, with an accent-coloured flap along its trailing edge.
  frontWing: { near: string; far: string; deck: string; flap: Accent };
  rearWing: {
    near: string;
    top: string;
    elements: string[];
    pylon: string;
    beam: string;
  };
  // A few ink lines only (ART-11).
  panelLines: string[];
  suspension: string[];
  // Halo (ART-13): the near bar runs down from the front pylon past the helmet; the far bar sits higher behind it.
  // The opening between them stays transparent.
  halo: string;
  haloFar: string;
  cockpit: {
    headrest: string;
    hans: { cx: number; cy: number; rx: number; ry: number };
  };
  helmetAt: { cx: number; cy: number; r: number };
  mirror: string;
  tcam: string;
  antenna: string;
  rainLight: string;
  numberAt: { x: number; y: number };
};

export const CAR_UNITS_PER_METRE = 250;

// Photo pixels per metre of this car's trace.
export const photoPxPerMetre = (car: CarSpec) =>
  CAR_UNITS_PER_METRE / car.frame.k;

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

// x coordinates of an absolute-coordinate SVG path (M/L/C/Z only, as traced).
const pathXs = (d: string) => {
  const nums = d
    .replace(/[MLCZ]/g, " ")
    .trim()
    .split(/\s+/)
    .map(Number);
  return nums.filter((_, i) => i % 2 === 0);
};
