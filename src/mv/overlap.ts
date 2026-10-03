// Interpenetration check for cars seen from above (ART-18): every part that moves cars on a top-down map — or places
// them in a side-on panel by world metres, which is the same plan — registers a sampler here, and
// `scripts/check-overlap.mjs` walks every frame of every registered shot and flags any two cars whose footprints
// intersect outside a declared contact window.
//
// A footprint is the car's rectangle on the ground: its true overall length × width, times `scale` when the shot
// draws the car larger than life (wide maps), so the check tests what is on screen. Positions are the footprint's
// centre in map metres; heading in degrees, 0 = +x, clockwise (y down), like Track.poseAt.
//
// Pure TypeScript with type-only imports, so node can load it (`node scripts/check-overlap.mjs`).

export type Footprint = {
  id: string; // e.g. "SEN"
  x: number;
  y: number;
  heading: number;
  length: number; // m, true overall length (rear wing to front wing)
  width: number; // m, true overall width (outside of the tyres)
  scale?: number; // drawn size ÷ real size (default 1)
};

export type TopViewSampler = {
  part: string; // edit-list part id
  shot: string; // treatment shot id
  from: number; // first song frame
  to: number; // first song frame after the shot
  // Song frames where two cars are allowed to touch (a real collision): [from, to). Even then they may not pass
  // through each other: the footprints may overlap by at most `depth` m (default 0.3).
  contact?: readonly {
    from: number;
    to: number;
    ids?: readonly [string, string];
    depth?: number;
  }[];
  // Clearance every pair must keep outside contact, m (default 0.05: a hair).
  margin?: number;
  poses: (songFrame: number) => readonly Footprint[];
};

type V = { x: number; y: number };

export const corners = (c: Footprint, grow = 0): V[] => {
  const s = c.scale ?? 1;
  const hl = (c.length * s) / 2 + grow;
  const hw = (c.width * s) / 2 + grow;
  const a = (c.heading * Math.PI) / 180;
  const ux = { x: Math.cos(a), y: Math.sin(a) };
  const uy = { x: -Math.sin(a), y: Math.cos(a) };
  return [
    [hl, hw],
    [hl, -hw],
    [-hl, -hw],
    [-hl, hw],
  ].map(([l, w]) => ({
    x: c.x + ux.x * l + uy.x * w,
    y: c.y + ux.y * l + uy.y * w,
  }));
};

// Separating-axis test for two convex quads: the largest gap along any of their edge normals (negative = overlap,
// by that depth), in metres.
export const separation = (a: V[], b: V[]) => {
  let best = -Infinity;
  for (const poly of [a, b]) {
    for (let i = 0; i < poly.length; i++) {
      const p = poly[i];
      const q = poly[(i + 1) % poly.length];
      const len = Math.hypot(q.x - p.x, q.y - p.y) || 1;
      const n = { x: -(q.y - p.y) / len, y: (q.x - p.x) / len };
      const proj = (pts: V[]) => pts.map((v) => v.x * n.x + v.y * n.y);
      const pa = proj(a);
      const pb = proj(b);
      const gap = Math.max(
        Math.min(...pb) - Math.max(...pa),
        Math.min(...pa) - Math.max(...pb),
      );
      best = Math.max(best, gap);
    }
  }
  return best;
};

export type OverlapReport = {
  part: string;
  shot: string;
  frames: number;
  minGap: number; // smallest separation outside contact windows, m
  minGapAt: number; // song frame
  hits: { frame: number; a: string; b: string; gap: number }[];
};

// Walk every frame (or every `step` frames) of each sampler.
export const checkTopViews = (
  samplers: readonly TopViewSampler[],
  step = 1,
): OverlapReport[] =>
  samplers.map((s) => {
    const report: OverlapReport = {
      part: s.part,
      shot: s.shot,
      frames: 0,
      minGap: Infinity,
      minGapAt: s.from,
      hits: [],
    };
    for (let f = s.from; f < s.to; f += step) {
      report.frames++;
      const cars = s.poses(f);
      for (let i = 0; i < cars.length; i++)
        for (let j = i + 1; j < cars.length; j++) {
          const a = cars[i];
          const b = cars[j];
          const window = (s.contact ?? []).find(
            (w) =>
              f >= w.from &&
              f < w.to &&
              (!w.ids || (w.ids.includes(a.id) && w.ids.includes(b.id))),
          );
          const gap = separation(corners(a), corners(b));
          if (window) {
            if (gap < -(window.depth ?? 0.3))
              report.hits.push({ frame: f, a: a.id, b: b.id, gap });
            continue;
          }
          if (gap < report.minGap) {
            report.minGap = gap;
            report.minGapAt = f;
          }
          if (gap < (s.margin ?? 0.05))
            report.hits.push({ frame: f, a: a.id, b: b.id, gap });
        }
    }
    return report;
  });
