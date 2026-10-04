// Where the far side of a side-view car shows (ART-17, ART-26): its wheels and wing endplates, worked out with the
// pinhole camera the panel is drawn through (src/kit/camera.ts).
//
// A far part is its near twin moved one width W across the car, away from the camera (W = the track for a wheel,
// the wing span for an endplate). A level pinhole camera at distance z draws everything at z + W at s = z / (z + W)
// of the size, pulled toward the vanishing point (the horizon at the camera's height, on the optical axis):
//   far = VP + (near − VP) · s.
// So a far part shows (1 − s)·(camera height − part height) above its near twin, at s of its size. A far wheel
// rises above its near wheel's top by (1 − s)·(camera height − tyre top): from a camera at or below tyre-top height
// it is wholly behind the near wheel; it peeks out only as the camera rises above that.
//
// The far wheel stays at its near wheel's x (the convergence toward the optical axis is left out, so a car drawn
// side-on shows its far wheels straight behind the near ones, as the user approved on the STR3) unless the scene
// gives the axis' place along the car (`CarCamera.axisAt`).
import type { Camera } from "../kit/camera";
import { planOf } from "./plan";
import { photoPxPerMetre, type CarSpec, type Wheel } from "./spec";

// The camera a side-view car is seen from (CarState.camElevation / camDistance / camAxisAt).
export type CarCamera = {
  // Degrees above the car's axle height, seen from the car's near side; 0 = a dead-level camera at axle height.
  elevation: number;
  // Metres from the camera to the car's near side.
  distance: number;
  // Where the camera's optical axis crosses the car, metres forward from its rear end; leave it out for a camera
  // square to each part (far parts straight behind the near ones).
  axisAt?: number;
};

// A car drawn without a scene camera (asset sheets, panels drawn without a pinhole): a low trackside camera 10 m away,
// 0.17 m above the axles (about 0.5 m up, below the tyre tops). The far wheels sit wholly behind the near ones (the
// STR3 look the user approved, 2026-10-04) and the far front endplate shows as a sliver of 2–3 cm along its top edge
// (ART-17).
export const DEFAULT_CAR_CAMERA: CarCamera = { elevation: 1, distance: 10 };

// The camera of a car drawn with `camera.anchor({ x, z })` at depth z: its elevation over the car's axles and its
// distance, and, given `place` (the same world x of the car's rear end, and which way the car faces on screen),
// where the camera's optical axis crosses the car, so the far parts also converge toward the axis horizontally.
// Pass the result's fields into CarState (`{ ...carCamera(car, cam, z, { x, facing }), wheelAngle }`).
export const carCamera = (
  car: CarSpec,
  cam: Camera,
  z: number,
  place?: { x: number; facing?: "left" | "right" },
): { camElevation: number; camDistance: number; camAxisAt?: number } => {
  // the lens' true distance to the car (a dollied camera keeps the world's depths but sees them from further back)
  const d = cam.f / cam.pxPerMetre(z);
  return {
    camElevation: (Math.atan2(cam.height - axleHeight(car), d) * 180) / Math.PI,
    camDistance: d,
    ...(place
      ? { camAxisAt: place.facing === "left" ? place.x : -place.x }
      : {}),
  };
};

// The camera of a panel drawn without a pinhole but shot by a camera the story implies (a long-lens tracking camera on
// a cockpit close-up): `height` m above the ground, `distance` m from the car's near side.
export const cameraAt = (car: CarSpec, height: number, distance: number) => ({
  camElevation: (Math.atan2(height - axleHeight(car), distance) * 180) / Math.PI,
  camDistance: distance,
});
// The long-lens tracking camera of the cockpit close-ups (1.2/1.4 helmet cards, 4.2, 5.1e, 5.7): level with the
// helmet, 20 m off the car, so the car's far side stays behind its near side.
export const HELMET_LENS = { height: 0.95, distance: 20 };

// The car's own axle height, m (the near wheels' mean centre).
export const axleHeight = (car: CarSpec) =>
  (car.frame.ground - (car.nearWheels[0].cy + car.nearWheels[1].cy) / 2) /
  photoPxPerMetre(car);

// How far the far side lies behind the near side, m: wheel track (front, rear) and the endplates' spacing (the wing
// spans), from the car's top-view planform.
export const farSideWidths = (car: CarSpec) => {
  const plan = planOf(car);
  const track = (steer: boolean) =>
    2 *
    Math.max(
      ...plan.wheels
        .filter((w) => !!w.steer === steer)
        .map((w) => Math.abs(w.y)),
    );
  return {
    frontTrack: track(true),
    rearTrack: track(false),
    frontWing: 2 * maxAbsY(plan.frontWing.deck),
    rearWing: 2 * maxAbsY(plan.rearWing.top),
  };
};

// The far twin of a near part `width` metres behind it, as a map of photo-space points: p → o + p · s.
export type FarCopy = { s: number; ox: number; oy: number };

// `x` is the part's own x in photo px (where it stays, unless the camera gives its axis).
export const farCopy = (
  car: CarSpec,
  cam: CarCamera,
  width: number,
  x: number,
): FarCopy => {
  const ppm = photoPxPerMetre(car);
  const z = Math.max(cam.distance, 0.5);
  const s = z / (z + width);
  const height =
    axleHeight(car) + z * Math.tan((cam.elevation * Math.PI) / 180);
  const vpY = car.frame.ground - height * ppm;
  const vpX = cam.axisAt === undefined ? x : car.frame.x - cam.axisAt * ppm;
  return { s, ox: vpX * (1 - s), oy: vpY * (1 - s) };
};

export const farCopyTransform = (c: FarCopy) =>
  `translate(${c.ox} ${c.oy}) scale(${c.s})`;

// The far wheels (front, rear) as drawn from this camera.
export const farWheelsFor = (car: CarSpec, cam: CarCamera): [Wheel, Wheel] => {
  const w = farSideWidths(car);
  return car.nearWheels.map((near, i) => {
    const c = farCopy(car, cam, i === 0 ? w.frontTrack : w.rearTrack, near.cx);
    return {
      cx: c.ox + near.cx * c.s,
      cy: c.oy + near.cy * c.s,
      r: near.r * c.s,
    };
  }) as [Wheel, Wheel];
};

// The far endplate of a wing (near outline `near`, wing span `span` m) as drawn from this camera: an SVG transform
// for paths in the near endplate's coordinates.
export const farEndplateTransform = (
  car: CarSpec,
  cam: CarCamera,
  near: string,
  span: number,
) => {
  const xs = pathNumbers(near).filter((_, i) => i % 2 === 0);
  const mid = (Math.min(...xs) + Math.max(...xs)) / 2;
  return farCopyTransform(farCopy(car, cam, span, mid));
};

// The camera a car state asks for (the default when it gives none).
export const cameraOf = (state: {
  camElevation?: number;
  camDistance?: number;
  camAxisAt?: number;
}): CarCamera => ({
  elevation: state.camElevation ?? DEFAULT_CAR_CAMERA.elevation,
  distance: state.camDistance ?? DEFAULT_CAR_CAMERA.distance,
  axisAt: state.camAxisAt,
});

// The camera of the car's reference photo, backed out of its traced far wheels (perspective.md): per wheel
// s = r_far / r_near gives the distance z = W·s/(1 − s), and the far wheel's lift L (m) gives the camera's height over
// the hub, L/(1 − s); the elevation is atan(height over the axle / z). Front and rear are averaged (they agree within
// 1–2° on most cars). Asset sheets and the Art check draw the car from this camera, so they still match the photo.
export const photoCamera = (car: CarSpec): CarCamera => {
  const ppm = photoPxPerMetre(car);
  const w = farSideWidths(car);
  const axle = axleHeight(car);
  const seen = car.nearWheels.flatMap((near, i) => {
    const far = car.farWheels[i];
    const s = far.r / near.r;
    if (!(s > 0.5 && s < 0.995)) return [];
    const width = i === 0 ? w.frontTrack : w.rearTrack;
    const z = (width * s) / (1 - s);
    const hub = (car.frame.ground - near.cy) / ppm;
    const height = hub + (near.cy - far.cy) / ppm / (1 - s);
    return [{ z, elevation: (Math.atan2(height - axle, z) * 180) / Math.PI }];
  });
  if (!seen.length) return DEFAULT_CAR_CAMERA;
  const mean = (f: (v: (typeof seen)[number]) => number) =>
    seen.reduce((a, v) => a + f(v), 0) / seen.length;
  return { elevation: mean((v) => v.elevation), distance: mean((v) => v.z) };
};

// The same, as CarState fields for a sheet: `state={{ ...photoCameraState(car) }}`.
export const photoCameraState = (car: CarSpec) => {
  const c = photoCamera(car);
  return { camElevation: c.elevation, camDistance: c.distance };
};

// A wing between its two endplates, as the camera sees it (ART-12, ART-17): the side-on outline `side` (the wing as
// seen dead level, at its near endplate) swept across the span to its far copy. The silhouette of that sweep is the
// convex hull of the outline and its far copy: from a camera at wing height the wing is just its side outline (the
// STR3 look), and as the camera rises the far half shows above it, up to the deck traced on a photo shot from above.
// The flap accent is the same sweep of its own side-on strip. Paths: absolute M/L/C/Z, as traced.
export const sweptWing = (
  car: CarSpec,
  cam: CarCamera,
  side: string,
  span: number,
) => {
  const pts = flatten(side);
  const xs = pts.map((p) => p.x);
  const mid = (Math.min(...xs) + Math.max(...xs)) / 2;
  const c = farCopy(car, cam, span, mid);
  const all = [
    ...pts,
    ...pts.map((p) => ({ x: c.ox + p.x * c.s, y: c.oy + p.y * c.s })),
  ];
  const hull = convexHull(all);
  return `${hull.map((p, i) => `${i ? "L" : "M"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ")} Z`;
};

// Points along an absolute M/L/C/Z path (cubic curves sampled at 8 steps).
const flatten = (d: string) => {
  const tokens = d.match(/[MLCZ]|-?\d*\.?\d+(?:e-?\d+)?/g) ?? [];
  const out: { x: number; y: number }[] = [];
  let cmd = "M";
  let i = 0;
  const num = () => Number(tokens[i++]);
  while (i < tokens.length) {
    if (/[MLCZ]/.test(tokens[i])) cmd = tokens[i++];
    if (cmd === "Z") continue;
    if (cmd === "C") {
      const p0 = out[out.length - 1];
      const [x1, y1, x2, y2, x, y] = [num(), num(), num(), num(), num(), num()];
      for (let k = 1; k <= 8; k++) {
        const t = k / 8;
        const u = 1 - t;
        out.push({
          x: u * u * u * p0.x + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t * x,
          y: u * u * u * p0.y + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t * t * t * y,
        });
      }
    } else out.push({ x: num(), y: num() });
  }
  return out;
};

// Andrew's monotone chain.
const convexHull = (points: { x: number; y: number }[]) => {
  const p = [...points].sort((a, b) => a.x - b.x || a.y - b.y);
  const cross = (
    o: { x: number; y: number },
    a: { x: number; y: number },
    b: { x: number; y: number },
  ) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  const half = (list: typeof p) => {
    const h: typeof p = [];
    for (const q of list) {
      while (h.length >= 2 && cross(h[h.length - 2], h[h.length - 1], q) <= 0)
        h.pop();
      h.push(q);
    }
    h.pop();
    return h;
  };
  return [...half(p), ...half([...p].reverse())];
};

const pathNumbers = (d: string) =>
  d
    .replace(/[A-Za-z]/g, " ")
    .trim()
    .split(/[\s,]+/)
    .map(Number);

const maxAbsY = (d: string) =>
  Math.max(
    ...pathNumbers(d)
      .filter((_, i) => i % 2 === 1)
      .map(Math.abs),
  );
