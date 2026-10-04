// Suzuka by day, seen from the track (ART-8, ART-9): the black-and-white environment behind a broadcast-style side
// shot — paper sky with inked clouds, the Suzuka mountains in light tone, wooded hills, a crowded grandstand under a
// cantilever roof, catch fence and Armco guardrail, grass verge, and the track surface. Drawn from 1989–90 era
// trackside photos and present-day photos of the chicane and main-straight stands (docs/assets/reference-register.md).
//
// Everything is placed in world metres and projected through the panel's one pinhole camera. `camX` is how far
// the camera has tracked along the track (m, +x), so near things slide past faster than far ones. The camera and
// the cars share these coordinates: a car at world x is drawn at cam.anchor({ x: x - camX, z }).
import { random } from "remotion";
import type { Camera } from "../../kit/camera";
import { INK, PAPER } from "../../kit/colors";
import { tone } from "../../kit/tone";

export type TracksideLayout = {
  // Depth of the near and far track edges, m.
  nearEdge: number;
  farEdge: number;
  // Depths of the guardrail, the catch fence and the front row of the grandstand.
  rail: number;
  fence: number;
  stand: number;
  // Where along x the grandstand runs (world m) — one stretch of stands.
  standFrom: number;
  standTo: number;
};

export const TRACKSIDE_DEFAULT: TracksideLayout = {
  nearEdge: 6,
  farEdge: 19,
  rail: 21.5,
  fence: 23,
  stand: 48,
  standFrom: -80,
  standTo: 260,
};

type P = { cam: Camera; camX: number; layout?: TracksideLayout };

// Repeat a pattern of period `period` m along x so it covers the screen at depth z.
const visibleRange = (cam: Camera, camX: number, z: number, margin = 200) => {
  // screen x = cx + f (x - camX) / z  →  x = camX + (sx - cx) z / f
  const x0 = camX + ((-margin - cam.cx) * z) / cam.f;
  const x1 = camX + ((1920 + margin - cam.cx) * z) / cam.f;
  return [x0, x1] as const;
};

const cloud = (cx: number, cy: number, w: number, seed: string) => {
  // a scalloped cumulus: bumps along the top, flat-ish base
  const n = 5 + Math.floor(random(`${seed}-n`) * 3);
  let d = `M ${cx - w / 2} ${cy}`;
  for (let i = 0; i < n; i++) {
    const x1 = cx - w / 2 + (w * (i + 1)) / n;
    const r = (w / n) * (0.6 + 0.5 * random(`${seed}-${i}`));
    d += ` A ${r} ${r * (1.1 + 0.4 * random(`${seed}-h${i}`))} 0 0 1 ${x1} ${cy}`;
  }
  return `${d} Z`;
};

export const Sky: React.FC<P> = ({ cam, camX }) => {
  const clouds = [
    { x: -40, y: 0.2, w: 360, s: "a" },
    { x: 420, y: 0.45, w: 260, s: "b" },
    { x: 980, y: 0.15, w: 420, s: "c" },
    { x: 1500, y: 0.5, w: 300, s: "d" },
    { x: 2100, y: 0.3, w: 380, s: "e" },
  ];
  // clouds drift with a very slow parallax (as if 4 km away), wrapping round a 2400 px strip
  const shift = ((camX * cam.f) / 4000) % 2400;
  return (
    <g>
      <rect
        x={-400}
        y={-400}
        width={2720}
        height={cam.horizon + 400}
        fill={PAPER}
      />
      {clouds.map((c) => {
        const x = ((((c.x - shift) % 2400) + 2400) % 2400) - 300;
        const y = cam.horizon * c.y;
        return (
          <g key={c.s}>
            <path
              d={cloud(x, y, c.w, c.s)}
              fill={PAPER}
              stroke={INK}
              strokeWidth={3}
            />
            <path
              d={`M ${x - c.w * 0.4} ${y - 6} C ${x - c.w * 0.1} ${y - 18} ${x + c.w * 0.2} ${y - 16} ${x + c.w * 0.42} ${y - 6}`}
              fill="none"
              stroke={tone("light")}
              strokeWidth={12}
            />
          </g>
        );
      })}
    </g>
  );
};

// Distant mountains and nearer wooded hills between the horizon and the stands.
export const Hills: React.FC<P> = ({ cam, camX }) => {
  const ridge = (
    z: number,
    amp: number,
    base: number,
    seed: string,
    step: number,
  ) => {
    const [x0, x1] = visibleRange(cam, camX, z, 400);
    const k0 = Math.floor(x0 / step);
    const k1 = Math.ceil(x1 / step);
    let d = "";
    for (let k = k0; k <= k1; k++) {
      const h = base + amp * random(`${seed}-${k}`);
      const sx = cam.screenX(k * step - camX, z);
      const sy = cam.screenY(h, z);
      d += `${k === k0 ? "M" : "L"} ${sx.toFixed(1)} ${sy.toFixed(1)} `;
    }
    const xl = cam.screenX(k0 * step - camX, z);
    const xr = cam.screenX(k1 * step - camX, z);
    return `${d} L ${xr} ${cam.horizon + 400} L ${xl} ${cam.horizon + 400} Z`;
  };
  // tree crowns: bumps along the near ridge
  const crowns = (z: number, base: number, seed: string) => {
    const [x0, x1] = visibleRange(cam, camX, z, 300);
    const step = 9;
    const out: string[] = [];
    for (let k = Math.floor(x0 / step); k <= Math.ceil(x1 / step); k++) {
      const r = 5 + 4 * random(`${seed}-r${k}`);
      const h = base + 6 * random(`${seed}-h${k}`);
      const sx = cam.screenX(k * step - camX, z);
      const sy = cam.screenY(h, z);
      const rp = (r * cam.f) / z;
      out.push(
        `M ${(sx - rp).toFixed(1)} ${(sy + rp).toFixed(1)} A ${rp.toFixed(1)} ${rp.toFixed(1)} 0 0 1 ${(sx + rp).toFixed(1)} ${(sy + rp).toFixed(1)} Z`,
      );
    }
    return out.join(" ");
  };
  return (
    <g>
      <path
        d={ridge(6000, 260, 120, "mtn", 400)}
        fill={tone("light")}
        stroke={INK}
        strokeWidth={2}
      />
      <path
        d={ridge(900, 25, 10, "hill", 60)}
        fill={tone("mid")}
        stroke={INK}
        strokeWidth={2.5}
      />
      <path
        d={crowns(260, 6, "trees")}
        fill={tone("dark")}
        stroke={INK}
        strokeWidth={2}
      />
    </g>
  );
};

// Grandstand: tiers rising away from the track under a cantilever roof, a head-and-shoulders crowd on every row.
export const Grandstand: React.FC<P> = ({
  cam,
  camX,
  layout = TRACKSIDE_DEFAULT,
}) => {
  const rows = 22;
  const rowDepth = 0.85;
  const rise = 0.5;
  const front = layout.stand;
  const x0 = layout.standFrom - camX;
  const x1 = layout.standTo - camX;
  const X = (x: number, z: number) => cam.screenX(x, z);
  const Y = (y: number, z: number) => cam.screenY(y, z);
  const tiers = Array.from({ length: rows }, (_, k) => ({
    z: front + k * rowDepth,
    y: 1.2 + k * rise,
  }));
  const top = tiers[rows - 1];
  const roofY = top.y + 3.2;
  const [v0, v1] = visibleRange(cam, camX, front, 100);
  const crowdFrom = Math.max(layout.standFrom, v0);
  const crowdTo = Math.min(layout.standTo, v1);
  return (
    <g>
      {/* back wall up to the roof */}
      <path
        d={`M ${X(x0, top.z)} ${Y(top.y, top.z)} L ${X(x1, top.z)} ${Y(top.y, top.z)} L ${X(x1, top.z)} ${Y(roofY, top.z)} L ${X(x0, top.z)} ${Y(roofY, top.z)} Z`}
        fill={tone("dark")}
      />
      {tiers.slice(0, -1).map((t, k) => {
        const n = tiers[k + 1];
        return (
          <path
            key={k}
            d={`M ${X(x0, t.z)} ${Y(t.y, t.z)} L ${X(x1, t.z)} ${Y(t.y, t.z)} L ${X(x1, n.z)} ${Y(n.y, n.z)} L ${X(x0, n.z)} ${Y(n.y, n.z)} Z`}
            fill={k % 2 ? tone("mid") : tone("light")}
            stroke={INK}
            strokeWidth={1.2}
          />
        );
      })}
      {tiers.slice(0, -1).map((t, k) => {
        const people: React.ReactNode[] = [];
        const step = 0.62;
        for (let i = Math.floor(crowdFrom / step); i < crowdTo / step; i++) {
          if (random(`seat-${k}-${i}`) < 0.12) continue;
          const x = i * step + (random(`dx-${k}-${i}`) - 0.5) * 0.2 - camX;
          const head = cam.pxPerMetre(t.z) * 0.12;
          const cx = X(x, t.z);
          const cy = Y(t.y + 0.95, t.z);
          const shirt = random(`shirt-${k}-${i}`);
          people.push(
            <g key={i}>
              <ellipse
                cx={cx}
                cy={cy + head * 2.2}
                rx={head * 1.6}
                ry={head * 1.2}
                fill={shirt < 0.35 ? INK : shirt < 0.6 ? tone("mid") : PAPER}
                stroke={INK}
                strokeWidth={1}
              />
              <circle
                cx={cx}
                cy={cy}
                r={head}
                fill={PAPER}
                stroke={INK}
                strokeWidth={1.1}
              />
            </g>,
          );
        }
        return <g key={`c${k}`}>{people}</g>;
      })}
      {/* roof: a dark underside sloping out over the front rows, a white fascia, and slim columns */}
      <path
        d={`M ${X(x0, top.z)} ${Y(roofY, top.z)} L ${X(x1, top.z)} ${Y(roofY, top.z)} L ${X(x1, front + 4)} ${Y(roofY + 1.2, front + 4)} L ${X(x0, front + 4)} ${Y(roofY + 1.2, front + 4)} Z`}
        fill={INK}
      />
      <path
        d={`M ${X(x0, front + 4)} ${Y(roofY + 1.2, front + 4)} L ${X(x1, front + 4)} ${Y(roofY + 1.2, front + 4)} L ${X(x1, front + 4)} ${Y(roofY + 2.2, front + 4)} L ${X(x0, front + 4)} ${Y(roofY + 2.2, front + 4)} Z`}
        fill={PAPER}
        stroke={INK}
        strokeWidth={3}
      />
      {Array.from(
        { length: Math.ceil((layout.standTo - layout.standFrom) / 24) + 1 },
        (_, i) => {
          const x = layout.standFrom + i * 24 - camX;
          return (
            <path
              key={i}
              d={`M ${X(x, top.z)} ${Y(top.y, top.z)} L ${X(x, top.z)} ${Y(roofY, top.z)}`}
              stroke={INK}
              strokeWidth={5}
            />
          );
        },
      )}
      {/* front wall of the stand */}
      <path
        d={`M ${X(x0, front)} ${Y(0, front)} L ${X(x1, front)} ${Y(0, front)} L ${X(x1, front)} ${Y(1.2, front)} L ${X(x0, front)} ${Y(1.2, front)} Z`}
        fill={PAPER}
        stroke={INK}
        strokeWidth={2.5}
      />
    </g>
  );
};

// Run-off grass from the stands to the fence, catch fence on posts, and the Armco guardrail on the track side.
export const Barriers: React.FC<P> = ({
  cam,
  camX,
  layout = TRACKSIDE_DEFAULT,
}) => {
  const X = (x: number, z: number) => cam.screenX(x, z);
  const Y = (y: number, z: number) => cam.screenY(y, z);
  const fz = layout.fence;
  const rz = layout.rail;
  const [f0, f1] = visibleRange(cam, camX, fz, 200);
  const posts: string[] = [];
  for (let k = Math.floor(f0 / 4); k <= Math.ceil(f1 / 4); k++) {
    const x = X(k * 4 - camX, fz);
    posts.push(
      `M ${x.toFixed(1)} ${Y(0, fz).toFixed(1)} L ${x.toFixed(1)} ${Y(3.6, fz).toFixed(1)}`,
    );
  }
  const mesh: string[] = [];
  const top = Y(3.6, fz);
  const bottom = Y(0, fz);
  const h = bottom - top;
  const gap = cam.pxPerMetre(fz) * 0.5;
  const off = ((-camX * cam.f) / fz) % gap;
  for (let x = -400 + off; x < 2320; x += gap) {
    mesh.push(
      `M ${x.toFixed(1)} ${bottom.toFixed(1)} L ${(x + h).toFixed(1)} ${top.toFixed(1)}`,
    );
    mesh.push(
      `M ${x.toFixed(1)} ${top.toFixed(1)} L ${(x + h).toFixed(1)} ${bottom.toFixed(1)}`,
    );
  }
  const [r0, r1] = visibleRange(cam, camX, rz, 200);
  const railPosts: string[] = [];
  for (let k = Math.floor(r0 / 2); k <= Math.ceil(r1 / 2); k++) {
    const x = X(k * 2 - camX, rz);
    railPosts.push(
      `M ${x.toFixed(1)} ${Y(0, rz).toFixed(1)} L ${x.toFixed(1)} ${Y(0.75, rz).toFixed(1)}`,
    );
  }
  return (
    <g>
      {/* grass between the stands and the track */}
      <rect
        x={-400}
        y={Y(0, layout.stand)}
        width={2720}
        height={Y(0, rz) - Y(0, layout.stand)}
        fill={tone("light")}
      />
      {/* catch fence */}
      <g opacity={0.5}>
        <path
          d={mesh.join(" ")}
          stroke="#5a5a5a"
          strokeWidth={1.1}
          fill="none"
        />
      </g>
      <path d={posts.join(" ")} stroke={INK} strokeWidth={4} />
      {[3.6, 2.4].map((y) => (
        <path
          key={y}
          d={`M -400 ${Y(y, fz)} L 2320 ${Y(y, fz)}`}
          stroke={INK}
          strokeWidth={2.5}
        />
      ))}
      {/* Armco: two corrugated rails on short posts */}
      <path d={railPosts.join(" ")} stroke={INK} strokeWidth={5} />
      {[0.68, 0.42].map((y) => (
        <g key={y}>
          <rect
            x={-400}
            y={Y(y, rz)}
            width={2720}
            height={cam.pxPerMetre(rz) * 0.2}
            fill={PAPER}
            stroke={INK}
            strokeWidth={2.5}
          />
          <path
            d={`M -400 ${Y(y - 0.1, rz)} L 2320 ${Y(y - 0.1, rz)}`}
            stroke={INK}
            strokeWidth={1.2}
            opacity={0.7}
          />
        </g>
      ))}
    </g>
  );
};

// The track surface between the far and near edges, with the verge beyond and streaks of rubber that slide past.
export const TrackSurface: React.FC<P & { nearVerge?: boolean }> = ({
  cam,
  camX,
  layout = TRACKSIDE_DEFAULT,
}) => {
  const Y = (z: number) => cam.screenY(0, z);
  const streaks: string[] = [];
  for (let i = 0; i < 40; i++) {
    const z =
      layout.nearEdge +
      1 +
      random(`sz-${i}`) * (layout.farEdge - layout.nearEdge - 2);
    const span = 60;
    const xw =
      ((((random(`sx-${i}`) * span - camX) % span) + span) % span) - span / 4;
    const x0 = cam.screenX(xw, z);
    const x1 = cam.screenX(xw + 1.5 + 3 * random(`sl-${i}`), z);
    streaks.push(
      `M ${x0.toFixed(1)} ${Y(z).toFixed(1)} L ${x1.toFixed(1)} ${Y(z).toFixed(1)}`,
    );
  }
  return (
    <g>
      {/* verge between the far edge and the guardrail */}
      <rect
        x={-400}
        y={Y(layout.rail)}
        width={2720}
        height={Y(layout.farEdge) - Y(layout.rail)}
        fill={tone("light")}
      />
      <rect
        x={-400}
        y={Y(layout.farEdge)}
        width={2720}
        height={1400}
        fill={PAPER}
      />
      <path
        d={`M -400 ${Y(layout.farEdge)} L 2320 ${Y(layout.farEdge)}`}
        stroke={INK}
        strokeWidth={3}
      />
      <path
        d={`M -400 ${Y(layout.farEdge - 0.4)} L 2320 ${Y(layout.farEdge - 0.4)}`}
        stroke={INK}
        strokeWidth={1.5}
        opacity={0.6}
      />
      <path
        d={streaks.join(" ")}
        stroke={INK}
        strokeWidth={2.2}
        opacity={0.45}
      />
    </g>
  );
};

// All the layers behind the cars, far to near.
export const Trackside: React.FC<P> = (p) => (
  <g>
    <Sky {...p} />
    <Hills {...p} />
    <Grandstand {...p} />
    <Barriers {...p} />
    <TrackSurface {...p} />
  </g>
);
