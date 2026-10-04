// The pinhole camera every panel is drawn through (ART-9): one camera height, horizon and focal length per panel,
// and everything in it — cars, kerbs, walls, stands — placed at its real size and distance.
//
// World coordinates are metres: x runs along the screen to the right, y is height above the ground, z is the
// distance from the camera (depth, > 0). The camera looks level along +z, so ground lines that run in depth
// converge on a vanishing point on the horizon, and things shrink as f / z.

export type CameraSpec = {
  f: number; // focal length, px
  horizon: number; // screen y of the horizon, px
  cx: number; // screen x of the optical axis, px
  height: number; // camera height above the ground, m
};

export type WorldPoint = { x: number; y?: number; z: number };

// Where a world object sits on screen: its anchor point and how many screen px one metre is at its distance.
// Components that draw real-size objects (the car) take one of these.
export type ScreenAnchor = { x: number; y: number; pxPerMetre: number };

export type Camera = CameraSpec & {
  screenX: (x: number, z: number) => number;
  screenY: (y: number, z: number) => number;
  project: (p: WorldPoint) => { x: number; y: number };
  pxPerMetre: (z: number) => number;
  // Screen anchor of a world point (default on the ground).
  anchor: (p: WorldPoint) => ScreenAnchor;
  // A ground patch between depths z0..z1 and track positions x0..x1, as a closed path; its sides run to the vanishing point.
  groundQuad: (z0: number, z1: number, x0: number, x1: number) => string;
};

export const pinhole = (spec: CameraSpec): Camera => {
  const screenX = (x: number, z: number) => spec.cx + (spec.f * x) / z;
  const screenY = (y: number, z: number) =>
    spec.horizon + (spec.f * (spec.height - y)) / z;
  const pxPerMetre = (z: number) => spec.f / z;
  return {
    ...spec,
    screenX,
    screenY,
    pxPerMetre,
    project: ({ x, y = 0, z }) => ({ x: screenX(x, z), y: screenY(y, z) }),
    anchor: ({ x, y = 0, z }) => ({
      x: screenX(x, z),
      y: screenY(y, z),
      pxPerMetre: pxPerMetre(z),
    }),
    groundQuad: (z0, z1, x0, x1) =>
      `M ${screenX(x0, z0)} ${screenY(0, z0)} L ${screenX(x1, z0)} ${screenY(0, z0)} L ${screenX(x1, z1)} ${screenY(0, z1)} L ${screenX(x0, z1)} ${screenY(0, z1)} Z`,
  };
};

// A point `dx` metres along and `dy` metres up from an anchor, on screen (for things attached to an object, e.g. smoke
// at a car's front tyre). Ignores the object's own depth extent, like the side-view car does.
export const offsetFrom = (a: ScreenAnchor, dx: number, dy = 0) => ({
  x: a.x + dx * a.pxPerMetre,
  y: a.y - dy * a.pxPerMetre,
});
