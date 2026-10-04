// The Yas hotel (W Abu Dhabi – Yas Island, formerly Yas Viceroy) at night, built in world metres and projected through
// the panel's pinhole camera (ART-9): the big west block on one side of the track, the smaller east block on the other,
// the white link bridge spanning the track between them, and each block under its own gridshell of diamond glass
// panels, the west shell sweeping on over the bridge. Black and white only (ART-8): a lit panel is paper.
//
// Real dimensions (docs/assets/reference-register.md, docs/production/facts.md):
// - gridshell 217 m long, 44 m wide, 35 m high at most (sbp, the shell's structural engineers); panels 2.5–3.5 m
//   (Front Inc., the facade engineers);
// - two 12-storey blocks (Wikipedia) — under a 35 m shell that is ≈ 2.7 m a storey, so the blocks top out at ≈ 32 m and
//   step down where the shell sinks toward the bridge, as in the 2011 photograph;
// - plan from the OpenStreetMap footprint (references/yas-marina/osm-yas-hotel.json): the west block ≈ 180 m long,
//   lying across the track; the east block ≈ 25 m wide, lying along it; the track passes between them under the bridge;
// - the bridge's height is not published: its underside at 5.5 m and its body 6 m deep are estimated from the 2011
//   photograph (references/yas-marina/yas-hotel-2011.jpg) against the floor slabs.
// Composite liberty for the title card (like the compressed lap): the west block is turned 25° from square-on to the
// track, so it recedes from the camera instead of facing it flat.
//
// Hotel frame: metres, origin on the ground under the bridge on the track's centre line; x across the track (right +),
// y up, z along the track away from the camera. The caller places that origin in its camera's world.
import { INK, PAPER } from "../../kit/colors";
import type { Camera } from "../../kit/camera";

type V2 = readonly [number, number]; // plan point (x, z)
type V3 = readonly [number, number, number]; // (x, y, z)
type Pt = { x: number; y: number };

const STOREY = 2.7;
const THETA = 0.64 * Math.PI; // a shell section runs from rim to rim through ±THETA, so its rims tuck back under it

// West block: its axis runs from the end face at the bridge (centre C_W) out to the far west tip, along D_W.
const ANG = (65 * Math.PI) / 180;
const D_W: V2 = [-Math.sin(ANG), Math.cos(ANG)];
const C_W: V2 = [-19.4, 3];
const WEST = { len: 158, hw: 12, podHw: 18 };
const WEST_TIP = 185; // the shell's tip, m from the block's end face along D_W
// East block: along the track, its track-side face at x = 17.
const AX_E = 29;
// It starts at the bridge (in reality it runs ≈ 30 m nearer the camera than the bridge; cut back so the hotel can
// stand right behind the main grandstand's far end), its pod's nose EAST_LEAD m ahead of it.
const EAST = { z0: -5, z1: 81, hw: 12, podHw: 14 };
const EAST_LEAD = 8;
// The bridge: front face at z = -4.5, deck 9 m deep, underside 5.5 m, body to 11.5 m.
export const BRIDGE = { x0: -20.5, x1: 17, z0: -4.5, z1: 4.5, y0: 5.5, y1: 11.5 };
// Where each podium's corner nearest the camera stands (hotel frame), so the scene can end its pit building there.
export const HOTEL_NEAR = {
  west: [C_W[0] + WEST.podHw * -Math.cos(ANG), C_W[1] + WEST.podHw * -Math.sin(ANG)] as V2,
  eastZ: EAST.z0 - 2,
  // the nearest point of the east block, its podium and its pod (the scene keeps its grandstand in front of it)
  east: EAST.z0 - EAST_LEAD,
};

// Piecewise values along a shell (u 0..1), eased between keys.
type Keys = readonly (readonly [number, number])[];
const ease = (k: Keys, u: number) => {
  if (u <= k[0][0]) return k[0][1];
  for (let i = 1; i < k.length; i++)
    if (u <= k[i][0]) {
      const s = (u - k[i - 1][0]) / (k[i][0] - k[i - 1][0]);
      const e = s * s * (3 - 2 * s);
      return k[i - 1][1] + (k[i][1] - k[i - 1][1]) * e;
    }
  return k[k.length - 1][1];
};

// A spine in plan, sampled by arc length.
type Spine = { len: number; at: (u: number) => { p: V2; t: V2 } };
const spineOf = (pts: V2[]): Spine => {
  const cum = [0];
  for (let i = 1; i < pts.length; i++)
    cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const len = cum[cum.length - 1];
  return {
    len,
    at: (u) => {
      const s = Math.min(len, Math.max(0, u * len));
      let i = 1;
      while (i < pts.length - 1 && cum[i] < s) i++;
      const f = (s - cum[i - 1]) / (cum[i] - cum[i - 1] || 1);
      const a = pts[i - 1];
      const b = pts[i];
      const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
      return { p: [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f], t: [(b[0] - a[0]) / l, (b[1] - a[1]) / l] };
    },
  };
};

// West shell spine: from the tip, straight along the block to its end face, then a quadratic sweep over the bridge,
// turning square to the track, to the east block's flank.
const WEST_SPINE = (() => {
  const tip: V2 = [C_W[0] + WEST_TIP * D_W[0], C_W[1] + WEST_TIP * D_W[1]];
  const pts: V2[] = [];
  for (let i = 0; i <= 60; i++) {
    const f = i / 60;
    pts.push([tip[0] + (C_W[0] - tip[0]) * f, tip[1] + (C_W[1] - tip[1]) * f]);
  }
  const k: V2 = [-10.8, -1];
  const e: V2 = [15, -1];
  for (let i = 1; i <= 16; i++) {
    const s = i / 16;
    const a = (1 - s) * (1 - s);
    const b = 2 * s * (1 - s);
    const c = s * s;
    pts.push([a * C_W[0] + b * k[0] + c * e[0], a * C_W[1] + b * k[1] + c * e[1]]);
  }
  return spineOf(pts);
})();
const EAST_SPINE = spineOf([
  [AX_E, EAST.z0 - EAST_LEAD],
  [AX_E, EAST.z1 + 12],
]);

type Shell = {
  spine: Spine;
  w: Keys; // half-width, m
  top: Keys; // height of the crown, m
  rim: Keys; // height of the rims, m
  du: number; // lattice step along the spine, m
  nb: number; // lattice steps around the section
  k0: number; // lighting wave: where this shell starts and ends (0..1 over the whole hotel)
  k1: number;
};
// The west shell (u = 0 at its tip, ≈ 0.82 at the block's end face, 1 over the east block's flank): pointed at the
// tip, highest over the west part of the block, sinking toward the bridge, narrowing to a neck over the track.
const WEST_SHELL: Shell = {
  spine: WEST_SPINE,
  w: [
    [0, 2],
    [0.07, 15],
    [0.2, 22],
    [0.62, 21],
    [0.82, 17],
    [0.92, 11],
    [1, 9],
  ],
  top: [
    [0, 25],
    [0.1, 32],
    [0.25, 35],
    [0.55, 31],
    [0.8, 24],
    [1, 16.5],
  ],
  rim: [
    [0, 24],
    [0.1, 17],
    [0.35, 10],
    [0.62, 9],
    [0.82, 11],
    [1, 12.5],
  ],
  du: 2.4,
  nb: 30,
  k0: 0,
  k1: 0.7,
};
// The east shell: a rounded pod over the east block.
const EAST_SHELL: Shell = {
  spine: EAST_SPINE,
  w: [
    [0, 1.5],
    [0.08, 13.5],
    [0.3, 16],
    [0.75, 15.5],
    [0.9, 13.5],
    [1, 1.5],
  ],
  top: [
    [0, 10],
    [0.15, 26],
    [0.45, 28],
    [0.85, 25],
    [1, 10],
  ],
  rim: [
    [0, 8],
    [0.12, 7.5],
    [0.5, 8.5],
    [0.88, 7.5],
    [1, 8],
  ],
  du: 2.4,
  nb: 24,
  k0: 0.66,
  k1: 1,
};

const hash = (a: number, b: number) => {
  const h = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
  return h - Math.floor(h);
};

type Cell = {
  d: string; // lattice diamond on screen
  panel: string; // the glass panel inside it
  z: number; // world depth, for stroke widths and sorting
  front: boolean; // outer face toward the camera (false: the underside, seen from below or through an open end)
  facing: number; // 0 at grazing view, 1 square on
  k: number; // 0..1 along the whole hotel, for the lighting wave
  r: number; // noise
};
type Built = {
  cells: Cell[];
  rim: string; // the rim nearer the camera
  crown: string; // the top silhouette
};

/** Everything the hotel draws, projected once per camera and placement. */
const build = (cam: Camera, ox: number, oz: number) => {
  const P = (p: V3): Pt => cam.project({ x: ox + p[0], y: p[1], z: oz + p[2] });
  const eye: V3 = [-ox, cam.height, -oz];
  const poly = (q: Pt[]) => `M ${q.map((p) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" L ")} Z`;
  const polyline = (q: Pt[]) => `M ${q.map((p) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" L ")}`;

  const shell = (sh: Shell): Built => {
    const na = Math.max(2, Math.round(sh.spine.len / sh.du));
    const G: V3[][] = [];
    const axis: V3[] = [];
    for (let a = 0; a <= na; a++) {
      const u = a / na;
      const { p, t } = sh.spine.at(u);
      const side: V2 = [-t[1], t[0]];
      const w = ease(sh.w, u);
      const T = ease(sh.top, u);
      const R = ease(sh.rim, u);
      const A = (T - R) / (1 - Math.cos(THETA));
      const Cy = T - A;
      axis.push([p[0], Cy, p[1]]);
      const row: V3[] = [];
      for (let b = 0; b <= sh.nb; b++) {
        const th = -THETA + (2 * THETA * b) / sh.nb;
        const v = w * Math.sin(th);
        row.push([p[0] + side[0] * v, Cy + A * Math.cos(th), p[1] + side[1] * v]);
      }
      G.push(row);
    }
    const S = G.map((row) => row.map(P));
    const g = (a: number, b: number) => G[Math.max(0, Math.min(na, a))][Math.max(0, Math.min(sh.nb, b))];
    const s = (a: number, b: number) => S[Math.max(0, Math.min(na, a))][Math.max(0, Math.min(sh.nb, b))];
    const cells: Cell[] = [];
    for (let a = -1; a <= na + 1; a++)
      for (let b = 0; b <= sh.nb; b++) {
        if ((a + b) % 2 !== 0) continue;
        const q = [s(a - 1, b), s(a, b - 1), s(a + 1, b), s(a, b + 1)];
        const area = Math.abs((q[2].x - q[0].x) * (q[3].y - q[1].y) - (q[3].x - q[1].x) * (q[2].y - q[0].y));
        if (area < 3) continue;
        const c3 = g(a, b);
        const e1 = g(a + 1, b).map((v, i) => v - g(a - 1, b)[i]);
        const e2 = g(a, b + 1).map((v, i) => v - g(a, b - 1)[i]);
        let n = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]];
        const ax = axis[Math.max(0, Math.min(na, a))];
        const out = [c3[0] - ax[0], c3[1] - ax[1], c3[2] - ax[2]];
        if (n[0] * out[0] + n[1] * out[1] + n[2] * out[2] < 0) n = n.map((v) => -v);
        const nl = Math.hypot(n[0], n[1], n[2]) || 1;
        const view = [eye[0] - c3[0], eye[1] - c3[1], eye[2] - c3[2]];
        const vl = Math.hypot(view[0], view[1], view[2]);
        const dot = (n[0] * view[0] + n[1] * view[1] + n[2] * view[2]) / (nl * vl);
        const c = s(a, b);
        const ins = (p: Pt): Pt => ({ x: c.x + (p.x - c.x) * 0.72, y: c.y + (p.y - c.y) * 0.72 });
        const u = Math.min(1, Math.max(0, a / na));
        cells.push({
          d: poly(q),
          panel: poly(q.map(ins)),
          z: oz + c3[2],
          front: dot > 0,
          facing: Math.min(1, Math.abs(dot) * 1.6),
          k: sh.k0 + (sh.k1 - sh.k0) * u,
          r: hash(a + sh.k0 * 50, b),
        });
      }
    cells.sort((p, q) => q.z - p.z);
    // the rim nearer the camera, and the crown silhouette (topmost on screen at each station)
    const near0 = G.reduce((m, row) => m + Math.hypot(row[0][0] - eye[0], row[0][2] - eye[2]), 0);
    const near1 = G.reduce((m, row) => m + Math.hypot(row[sh.nb][0] - eye[0], row[sh.nb][2] - eye[2]), 0);
    const nb = near0 < near1 ? 0 : sh.nb;
    const rim = polyline(S.map((row) => row[nb]));
    const crown = polyline(S.map((row) => row.reduce((m, p) => (p.y < m.y ? p : m), row[0])));
    return { cells, rim, crown };
  };

  // A block: a box along a straight axis from plan point `a` in direction `d`, `len` long, `hw` half-wide, its height
  // stepping with the shell above it. Returns its visible faces as fills, slabs and windows.
  type Face = { fill: string; slabs: string; windows: { d: string; o: number }[]; key: string; dist: number };
  const block = (
    a: V2,
    d: V2,
    len: number,
    hw: number,
    floors: (s: number) => number,
    seed: number,
  ): Face[] => {
    const side: V2 = [-d[1], d[0]];
    const at = (s: number, v: number): V2 => [a[0] + d[0] * s + side[0] * v, a[1] + d[1] * s + side[1] * v];
    const faces: Face[] = [];
    // a vertical face from plan point p0 to p1 (outward normal n), split into `segs` stations with their own heights
    const face = (p0: V2, p1: V2, n: V2, hOf: (f: number) => number, w: number, key: string) => {
      const mid: V2 = [(p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2];
      if (n[0] * (eye[0] - mid[0]) + n[1] * (eye[2] - mid[1]) <= 0) return;
      const segs = Math.max(1, Math.round(w / 6));
      const L = (f: number): V2 => [p0[0] + (p1[0] - p0[0]) * f, p0[1] + (p1[1] - p0[1]) * f];
      const fill: string[] = [];
      const slabs: string[] = [];
      const windows: { d: string; o: number }[] = [];
      for (let i = 0; i < segs; i++) {
        const f0 = i / segs;
        const f1 = (i + 1) / segs;
        const nF = hOf((f0 + f1) / 2);
        const h = nF * STOREY;
        const q0 = L(f0);
        const q1 = L(f1);
        fill.push(poly([P([q0[0], 0, q0[1]]), P([q1[0], 0, q1[1]]), P([q1[0], h, q1[1]]), P([q0[0], h, q0[1]])]));
        for (let k = 1; k <= nF; k++) {
          const y = k * STOREY;
          slabs.push(
            poly([P([q0[0], y - 0.22, q0[1]]), P([q1[0], y - 0.22, q1[1]]), P([q1[0], y, q1[1]]), P([q0[0], y, q0[1]])]),
          );
        }
        // windows: bays of 2 m, most rooms lit
        const bays = Math.max(1, Math.round(w / segs / 2));
        for (let k = 0; k < nF; k++)
          for (let j = 0; j < bays; j++) {
            const r = hash(seed + i * 7.3 + j * 1.7 + key.length, k);
            if (r < 0.22) continue;
            const g0 = f0 + ((f1 - f0) * (j + 0.15)) / bays;
            const g1 = f0 + ((f1 - f0) * (j + 0.85)) / bays;
            const w0 = L(g0);
            const w1 = L(g1);
            const y0 = k * STOREY + 0.55;
            const y1 = (k + 1) * STOREY - 0.5;
            windows.push({
              d: poly([P([w0[0], y0, w0[1]]), P([w1[0], y0, w1[1]]), P([w1[0], y1, w1[1]]), P([w0[0], y1, w0[1]])]),
              o: r > 0.7 ? 0.8 : 0.4,
            });
          }
      }
      faces.push({
        fill: fill.join(" "),
        slabs: slabs.join(" "),
        windows,
        key,
        dist: Math.hypot(mid[0] - eye[0], mid[1] - eye[2]),
      });
    };
    const flo = (s: number) => floors(Math.min(len, Math.max(0, s)));
    face(at(0, hw), at(len, hw), side, (f) => flo(f * len), len, "l");
    face(at(len, -hw), at(0, -hw), [-side[0], -side[1]], (f) => flo((1 - f) * len), len, "r");
    face(at(0, -hw), at(0, hw), [-d[0], -d[1]], () => flo(0), 2 * hw, "s");
    face(at(len, hw), at(len, -hw), d, () => flo(len), 2 * hw, "e");
    return faces.sort((p, q) => q.dist - p.dist);
  };

  // A podium box: 6 m, lobby glazing glowing along its visible faces.
  const podium = (a: V2, d: V2, len: number, hw: number) => {
    const side: V2 = [-d[1], d[0]];
    const at = (s: number, v: number): V2 => [a[0] + d[0] * s + side[0] * v, a[1] + d[1] * s + side[1] * v];
    const out: { fill: string; lobby: string; mullions: string; top: string }[] = [];
    const face = (p0: V2, p1: V2, n: V2) => {
      const mid: V2 = [(p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2];
      if (n[0] * (eye[0] - mid[0]) + n[1] * (eye[2] - mid[1]) <= 0) return;
      const q = (p: V2, y: number) => P([p[0], y, p[1]]);
      const w = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]);
      const mull: string[] = [];
      for (let m = 3; m < w; m += 6) {
        const f = m / w;
        const pm: V2 = [p0[0] + (p1[0] - p0[0]) * f, p0[1] + (p1[1] - p0[1]) * f];
        mull.push(polyline([q(pm, 1), q(pm, 4.6)]));
      }
      out.push({
        fill: poly([q(p0, 0), q(p1, 0), q(p1, 6), q(p0, 6)]),
        lobby: poly([q(p0, 1), q(p1, 1), q(p1, 4.6), q(p0, 4.6)]),
        mullions: mull.join(" "),
        top: polyline([q(p0, 6), q(p1, 6)]),
      });
    };
    face(at(0, hw), at(len, hw), side);
    face(at(len, -hw), at(0, -hw), [-side[0], -side[1]]);
    face(at(0, -hw), at(0, hw), [-d[0], -d[1]]);
    face(at(len, hw), at(len, -hw), d);
    return out;
  };

  const west = shell(WEST_SHELL);
  const east = shell(EAST_SHELL);
  // floors under each shell: as many 2.7 m storeys as fit 1.5 m under the shell above the block's edge, at most 12
  const floorsUnder = (sh: Shell, uOf: (s: number) => number, hw: number) => (s: number) => {
    const u = uOf(s);
    const w = ease(sh.w, u);
    const T = ease(sh.top, u);
    const R = ease(sh.rim, u);
    const A = (T - R) / (1 - Math.cos(THETA));
    const f = Math.min(1, hw / w);
    const y = T - A + A * Math.cos(Math.asin(f));
    return Math.max(2, Math.min(12, Math.floor((y - 1.5) / STOREY)));
  };
  const wl = WEST_SPINE.len;
  const westBlock = block(C_W, D_W, WEST.len, WEST.hw, floorsUnder(WEST_SHELL, (s) => (WEST_TIP - s) / wl, WEST.hw), 1);
  const westPod = podium([C_W[0] - D_W[0] * 0.5, C_W[1] - D_W[1] * 0.5], D_W, WEST.len + 8, WEST.podHw);
  const el = EAST_SPINE.len;
  const eastBlock = block(
    [AX_E, EAST.z0],
    [0, 1],
    EAST.z1 - EAST.z0,
    EAST.hw,
    floorsUnder(EAST_SHELL, (s) => (s + EAST_LEAD) / el, EAST.hw),
    5,
  );
  const eastPod = podium([AX_E, EAST.z0 - 2], [0, 1], EAST.z1 - EAST.z0 + 4, EAST.podHw);

  // the bridge's front face: a frontal plane, the monocoque's top swelling and its belly sagging a little mid-span
  const B = BRIDGE;
  const bx = (f: number) => B.x0 + (B.x1 - B.x0) * f;
  const bump = (f: number) => Math.sin(Math.PI * f);
  const N = 24;
  const fr = Array.from({ length: N + 1 }, (_, i) => i / N);
  const topE = fr.map((f) => P([bx(f), B.y1 + 1.2 * bump(f), B.z0]));
  const botE = fr.map((f) => P([bx(f), B.y0 - 0.5 * bump(f), B.z0]));
  const band = (y0: number, y1: number) =>
    poly([...fr.map((f) => P([bx(f), y0 + 0.2 * bump(f), B.z0])), ...[...fr].reverse().map((f) => P([bx(f), y1 + 0.3 * bump(f), B.z0]))]);
  const bridge = {
    body: poly([...topE, ...[...botE].reverse()]),
    belly: band(B.y0 - 0.5, B.y0 + 1.1),
    glass: band(7.5, 9.6),
    // the glazed ribbon's mullions, every 1.5 m
    mullions: Array.from({ length: Math.floor((B.x1 - B.x0) / 1.5) }, (_, i) => {
      const x = B.x0 + 0.75 + i * 1.5;
      const f = (x - B.x0) / (B.x1 - B.x0);
      return polyline([P([x, 7.5 + 0.2 * bump(f), B.z0]), P([x, 9.6 + 0.3 * bump(f), B.z0])]);
    }).join(" "),
    top: polyline(topE),
  };
  return { west, east, westBlock, westPod, eastBlock, eastPod, bridge };
};

const cache = new Map<string, ReturnType<typeof build>>();
const built = (cam: Camera, x: number, z: number) => {
  const key = `${cam.f}/${cam.horizon}/${cam.cx}/${cam.height}/${x}/${z}`;
  let b = cache.get(key);
  if (!b) {
    b = build(cam, x, z);
    cache.set(key, b);
  }
  return b;
};

/**
 * The hotel through camera `cam`, its frame's origin (on the ground under the bridge, on the track's centre line) at
 * world (`at.x`, 0, `at.z`). `lit` 0..1 switches the gridshell panels on one by one in a wave from the west tip to the
 * east pod (all on at 1); `t` (seconds) drives the twinkle of lit panels. `id` keeps its filter unique.
 */
export const YasHotel: React.FC<{
  cam: Camera;
  at: { x: number; z: number };
  lit: number;
  t?: number;
  id?: string;
}> = ({ cam, at, lit, t = 0, id = "yas" }) => {
  const H = built(cam, at.x, at.z);
  const px = (m: number, z: number) => Math.max(0.6, m * cam.pxPerMetre(z));

  // A panel switches on when the wave passes it, flashes, then glows with a slow twinkle; square-on panels read
  // brightest, panels seen edge-on fade into the lattice.
  const light = (c: Cell) => {
    const th = 0.06 + c.k * 0.78 + c.r * 0.14;
    const on = (lit - th) / 0.025;
    if (on <= 0) return 0;
    const flash = 0.5 * Math.exp(-on / 2.5);
    const twinkle = 0.86 + 0.14 * Math.sin(t * 5.3 + c.r * 37);
    return Math.min(1, (0.4 + 0.6 * c.facing) * twinkle + flash);
  };
  const latticeOn = lit > 0.86;

  const cellsOf = (b: Built, front: boolean) => {
    const cs = b.cells.filter((c) => c.front === front);
    return (
      <g>
        {/* the outer face's glass and frames hide the underside behind it; the block shows faintly through */}
        {front ? <path d={cs.map((c) => c.d).join(" ")} fill="#0b0b0b" opacity={0.7} /> : null}
        {cs.map((c, i) => {
          const a = light(c) * (front ? 1 : 0.55);
          return (
            <path
              key={i}
              d={c.panel}
              fill={a > 0 ? PAPER : front ? "#0b0b0b" : "#1c1c1c"}
              opacity={a > 0 ? a : front ? 0.55 : 0.9}
            />
          );
        })}
        <path
          d={cs.map((c) => c.d).join(" ")}
          fill="none"
          stroke={latticeOn ? PAPER : front ? "#7a7a7a" : "#5a5a5a"}
          strokeWidth={px(0.16, 200)}
          opacity={latticeOn ? (front ? 0.75 : 0.5) : 0.6}
        />
      </g>
    );
  };

  const blockOf = (faces: ReturnType<typeof build>["westBlock"]) =>
    faces.map((f) => (
      <g key={f.key}>
        <path d={f.fill} fill="#141414" stroke={INK} strokeWidth={1} />
        {f.windows.map((w, i) => (
          <path key={i} d={w.d} fill={PAPER} opacity={w.o} />
        ))}
        <path d={f.slabs} fill={PAPER} opacity={0.75} />
      </g>
    ));
  const podiumOf = (faces: ReturnType<typeof build>["westPod"]) =>
    faces.map((f, i) => (
      <g key={i}>
        <path d={f.fill} fill="#1b1b1b" stroke={INK} strokeWidth={1} />
        <path d={f.lobby} fill={PAPER} opacity={0.42} />
        <path d={f.mullions} stroke={INK} strokeWidth={1} />
        <path d={f.top} stroke={PAPER} strokeWidth={1.5} />
      </g>
    ));
  const outline = (b: Built) => (
    <path d={`${b.rim} ${b.crown}`} fill="none" stroke={PAPER} strokeWidth={1.6} strokeLinejoin="round" />
  );
  const glowCells = [...H.west.cells, ...H.east.cells].filter((c) => c.front);

  return (
    <g>
      <defs>
        <filter id={`${id}-glow`} x="-30%" y="-80%" width="160%" height="260%">
          <feGaussianBlur stdDeviation={14} />
        </filter>
      </defs>
      {/* the canopy's glow on the night air, growing as the panels come on */}
      {lit > 0 ? (
        <path d={glowCells.map((c) => c.d).join(" ")} fill={PAPER} opacity={0.3 * lit} filter={`url(#${id}-glow)`} />
      ) : null}

      {/* west block: the shell's underside (where the open end and the tucked rims show it), the block, its podium,
          then the shell's outer face */}
      {cellsOf(H.west, false)}
      {blockOf(H.westBlock)}
      {podiumOf(H.westPod)}
      {cellsOf(H.west, true)}
      {outline(H.west)}

      {/* the link bridge over the track */}
      <path d={H.bridge.body} fill={PAPER} stroke={INK} strokeWidth={1.2} />
      <path d={H.bridge.belly} fill="#8a8a8a" />
      <path d={H.bridge.glass} fill="#3a3a3a" />
      <path d={H.bridge.glass} fill={PAPER} opacity={0.5} />
      <path d={H.bridge.mullions} stroke="#2a2a2a" strokeWidth={1} />

      {/* east block under its pod */}
      {cellsOf(H.east, false)}
      {blockOf(H.eastBlock)}
      {podiumOf(H.eastPod)}
      {cellsOf(H.east, true)}
      {outline(H.east)}
    </g>
  );
};
