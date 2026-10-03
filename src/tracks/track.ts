// Track data and geometry for the top-down maps (MOT-2). A circuit is its centre line in metres, traced from a real
// map (ART-4), plus the few named places scenes need; everything else — where a car is, the edges, kerbs, run-off —
// is derived from the line, so a scene places a car with a lap distance and a lateral offset, not screen coordinates.
//
// Map frame: metres, x to the right (east), y down (south), like the screen; a MapView turns, scales and places it.
// Distance along the lap `s` runs from the start/finish line in race direction and wraps at the lap. Positions
// between the stored points are Catmull-Rom interpolated over the true arc length, so cars and kerbs follow smooth
// curves however far a view zooms in, and the points need not be evenly spaced; headings (and so the edges and any
// lateral offset) follow the chord over HEADING_SPAN.

export type MapPoint = { x: number; y: number };

// Left or right of the direction of travel, as the driver sees it.
export type Side = "left" | "right";

// A turn label printed on the map ("T5") at the lap distance of its apex, on the outside of the turn.
export type Turn = { label: string; s: number; side: Side };

// A kerb: a stretch of the lap edge painted with kerb stripes.
export type Kerb = { from: number; to: number; side: Side };

// An escape road / run-off lane: an open polyline (flat x, y) leaving the track, with its width.
export type EscapeRoad = {
  name: string;
  path: readonly number[];
  width: number;
};

export type Track = {
  name: string;
  // Official lap length, m (the stored centre line is within a few metres of it: centrelineLength).
  lapLength: number;
  // Closed centre line, flat [x0, y0, x1, y1, …] in metres, starting on the start/finish line, in race direction.
  centreline: readonly number[];
  // Width of the racing surface, m.
  width: number;
  // Named lap distances the scenes use, m.
  corners: Readonly<Record<string, number>>;
  // Turn labels for the whole-lap map.
  turns?: readonly Turn[];
  // Traced kerbs (autoKerbs derives them from the curvature where none are traced).
  kerbs?: readonly Kerb[];
  escapeRoads?: readonly EscapeRoad[];
  // Where the lap crosses itself on a bridge (figure-eight tracks): lap distances of the lower and the upper pass.
  crossover?: { under: number; over: number };
};

// A centre line stored as text, "x,y x,y …" (generated files), as flat numbers.
export const parseLine = (text: string): number[] =>
  text
    .trim()
    .split(/\s+/)
    .flatMap((p) => p.split(",").map(Number));

// Points of an open polyline stored flat.
export const polylinePoints = (flat: readonly number[]): MapPoint[] => {
  const out: MapPoint[] = [];
  for (let i = 0; i < flat.length; i += 2)
    out.push({ x: flat[i], y: flat[i + 1] });
  return out;
};

type Geometry = { pts: MapPoint[]; cum: number[]; total: number };

const cache = new WeakMap<Track, Geometry>();

const geometry = (t: Track): Geometry => {
  const hit = cache.get(t);
  if (hit) return hit;
  const pts = polylinePoints(t.centreline);
  const cum = [0];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    cum.push(cum[i] + Math.hypot(b.x - a.x, b.y - a.y));
  }
  const g = { pts, cum, total: cum[pts.length] };
  cache.set(t, g);
  return g;
};

// Length of the stored centre line, m: the distance at which `s` wraps.
export const centrelineLength = (t: Track) => geometry(t).total;

const wrap = (s: number, total: number) => ((s % total) + total) % total;

// Catmull-Rom position on segment i (from point i to i+1) at u in [0, 1].
const spline = (pts: MapPoint[], i: number, u: number): MapPoint => {
  const n = pts.length;
  const p0 = pts[(i - 1 + n) % n];
  const p1 = pts[i % n];
  const p2 = pts[(i + 1) % n];
  const p3 = pts[(i + 2) % n];
  const u2 = u * u;
  const u3 = u2 * u;
  const pos = (a: number, b: number, c: number, d: number) =>
    0.5 *
    (2 * b +
      (-a + c) * u +
      (2 * a - 5 * b + 4 * c - d) * u2 +
      (-a + 3 * b - 3 * c + d) * u3);
  return { x: pos(p0.x, p1.x, p2.x, p3.x), y: pos(p0.y, p1.y, p2.y, p3.y) };
};

// The centre line at distance s.
const centreAt = (g: Geometry, s: number) => {
  const q = wrap(s, g.total);
  let lo = 0;
  let hi = g.pts.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (g.cum[mid] <= q) lo = mid;
    else hi = mid - 1;
  }
  const len = g.cum[lo + 1] - g.cum[lo];
  return spline(g.pts, lo, len > 0 ? (q - g.cum[lo]) / len : 0);
};

// The direction of travel is the chord over this many metres centred on s: exact on a circular arc, and it smooths
// the kinks a traced map line has at its vertices (a car turns no faster than ~6°/m).
const HEADING_SPAN = 16;

// Where the lap is at distance s: the point `offset` metres to the right of the centre line (negative = left, as
// seen by the driver), and the race-direction heading in degrees on the map (0 = +x, clockwise positive).
export const poseAt = (t: Track, s: number, offset = 0) => {
  const g = geometry(t);
  const c = centreAt(g, s);
  const a = centreAt(g, s - HEADING_SPAN / 2);
  const b = centreAt(g, s + HEADING_SPAN / 2);
  const d = Math.hypot(b.x - a.x, b.y - a.y) || 1;
  const tx = (b.x - a.x) / d;
  const ty = (b.y - a.y) / d;
  // y is down, so the driver's right is the heading turned clockwise: (-ty, tx).
  return {
    x: c.x - ty * offset,
    y: c.y + tx * offset,
    heading: (Math.atan2(ty, tx) * 180) / Math.PI,
  };
};

// Signed curvature at s, 1/m, over ±span/2 metres: negative turns left, positive right.
export const curvatureAt = (t: Track, s: number, span = 24) => {
  let d = poseAt(t, s + span / 2).heading - poseAt(t, s - span / 2).heading;
  while (d > 180) d -= 360;
  while (d < -180) d += 360;
  return (d * Math.PI) / 180 / span;
};

// Points along the lap from s0 to s1 (s1 may pass the line), every `every` metres, at a lateral offset that may vary
// along the way.
export const samplePath = (
  t: Track,
  s0: number,
  s1: number,
  offset: number | ((s: number) => number) = 0,
  every = 2,
): MapPoint[] => {
  const n = Math.max(1, Math.ceil(Math.abs(s1 - s0) / every));
  return Array.from({ length: n + 1 }, (_, i) => {
    const s = s0 + ((s1 - s0) * i) / n;
    const p = poseAt(t, s, typeof offset === "number" ? offset : offset(s));
    return { x: p.x, y: p.y };
  });
};

// Left and right edges of an open polyline `w` metres wide, as one closed outline (escape roads).
export const widen = (pts: MapPoint[], w: number) => {
  const left: MapPoint[] = [];
  const right: MapPoint[] = [];
  pts.forEach((p, i) => {
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(pts.length - 1, i + 1)];
    const d = Math.hypot(b.x - a.x, b.y - a.y) || 1;
    const nx = -(b.y - a.y) / d;
    const ny = (b.x - a.x) / d;
    left.push({ x: p.x - nx * (w / 2), y: p.y - ny * (w / 2) });
    right.push({ x: p.x + nx * (w / 2), y: p.y + ny * (w / 2) });
  });
  return [...left, ...right.reverse()];
};

// Kerbs where the line curves harder than `minCurvature` (1/m): the inside of every corner, plus the outside at the
// exit. For tracks whose kerbs are not traced.
export const autoKerbs = (
  t: Track,
  s0: number,
  s1: number,
  minCurvature = 1 / 220,
  step = 4,
): Kerb[] => {
  const out: Kerb[] = [];
  let run: { from: number; side: Side } | null = null;
  for (let s = s0; s <= s1; s += step) {
    const k = curvatureAt(t, s);
    const side: Side | null =
      Math.abs(k) < minCurvature ? null : k < 0 ? "left" : "right";
    if (run && side !== run.side) {
      out.push({ from: run.from, to: s, side: run.side });
      // exit kerb on the outside, a little past the corner
      out.push({
        from: s - 10,
        to: s + 45,
        side: run.side === "left" ? "right" : "left",
      });
      run = null;
    }
    if (!run && side) run = { from: s, side };
  }
  if (run) out.push({ from: run.from, to: s1, side: run.side });
  return out;
};

// ── Views ─────────────────────────────────────────────────────────────────────────────────────────────────────

// A view of the map on screen: map point `centre` lands on screen point `screen` (default the frame's centre), the
// map turned by `rotation` degrees (clockwise) and scaled to `pxPerMetre`.
export type MapViewSpec = {
  centre: MapPoint;
  rotation?: number;
  pxPerMetre: number;
  screen?: MapPoint;
};

export const mapView = (spec: MapViewSpec) => {
  const rotation = spec.rotation ?? 0;
  const screen = spec.screen ?? { x: 960, y: 540 };
  const a = (rotation * Math.PI) / 180;
  const cos = Math.cos(a);
  const sin = Math.sin(a);
  const project = (p: MapPoint) => {
    const dx = (p.x - spec.centre.x) * spec.pxPerMetre;
    const dy = (p.y - spec.centre.y) * spec.pxPerMetre;
    return {
      x: screen.x + dx * cos - dy * sin,
      y: screen.y + dx * sin + dy * cos,
    };
  };
  const path = (pts: readonly MapPoint[], close = false) =>
    pts
      .map((p, i) => {
        const q = project(p);
        return `${i ? "L" : "M"} ${q.x.toFixed(1)} ${q.y.toFixed(1)}`;
      })
      .join(" ") + (close ? " Z" : "");
  return {
    centre: spec.centre,
    rotation,
    pxPerMetre: spec.pxPerMetre,
    screen,
    project,
    // Screen anchor of a map point, for things drawn at real size (a car's top view).
    anchor: (p: MapPoint) => ({ ...project(p), pxPerMetre: spec.pxPerMetre }),
    // A map heading as a screen heading.
    heading: (h: number) => h + rotation,
    // Screen path through map points.
    path,
    // Closed screen path between two lines that run the same way (a kerb strip, a run-off band).
    band: (a: readonly MapPoint[], b: readonly MapPoint[]) =>
      `${path(a)} ${path([...b].reverse()).replace("M", "L")} Z`,
  };
};

export type MapView = ReturnType<typeof mapView>;

// The view that fits the whole lap into a screen box, turned by `rotation` degrees.
export const fitMap = (
  t: Track,
  box: { x: number; y: number; w: number; h: number },
  rotation = 0,
  margin = 0.06,
) => {
  const pts = samplePath(t, 0, centrelineLength(t), 0, 20);
  const a = (rotation * Math.PI) / 180;
  const rot = pts.map((p) => ({
    x: p.x * Math.cos(a) - p.y * Math.sin(a),
    y: p.x * Math.sin(a) + p.y * Math.cos(a),
  }));
  const xs = rot.map((p) => p.x);
  const ys = rot.map((p) => p.y);
  const [x0, x1, y0, y1] = [
    Math.min(...xs),
    Math.max(...xs),
    Math.min(...ys),
    Math.max(...ys),
  ];
  const k = Math.min(
    (box.w * (1 - 2 * margin)) / (x1 - x0),
    (box.h * (1 - 2 * margin)) / (y1 - y0),
  );
  // centre of the rotated bounds, back in map coordinates
  const cx = (x0 + x1) / 2;
  const cy = (y0 + y1) / 2;
  return mapView({
    centre: {
      x: cx * Math.cos(-a) - cy * Math.sin(-a),
      y: cx * Math.sin(-a) + cy * Math.cos(-a),
    },
    rotation,
    pxPerMetre: k,
    screen: { x: box.x + box.w / 2, y: box.y + box.h / 2 },
  });
};
