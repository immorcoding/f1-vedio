// Shot 4.1's picture: Yas Marina at night through one pinhole camera (ART-9), standing on the start/finish straight
// and looking down it. The grid boxes run away under the Yas hotel's link bridge, its two blocks standing either side
// of the track under their lit gridshells; the pit wall and
// pit building on the left, the main grandstand (cantilevered tensile canopy, packed crowd) on the right, floodlight
// towers behind the pit building and beyond the stand throwing light cones onto the asphalt. Black and white only
// (ART-8).
//
// Everything is built in world metres and projected through CAM, so every line that runs along the straight (walls,
// fence rails, the canopy's lip and back beam, the pit building, the painted lines) meets the same vanishing point,
// and every object is drawn at its real size for its distance. Walls and fences start in front of the frame's near
// edge; the pit building ends against the hotel's west podium, the walls, fences and the track run on under the bridge.
//
// References (docs/assets/reference-register.md): the straight between the pit building and the main grandstand at
// night, the stand's canopy cantilevered over the seats on arms, its underside lit by lamps along the lip
// (references/yas-marina/main-straight-night-2009.jpg); floodlight towers behind the debris fence and the lit hotel
// (yas-hotel-fireworks-2015.jpg, circuit-by-night-2010.jpg). The hotel is drawn by YasHotel. Composite for the title
// card: the camera compresses the lap so the hotel stands at the end of the straight.
import { pinhole } from "../../../kit/camera";
import { INK, PAPER } from "../../../kit/colors";
import { tone } from "../../../kit/tone";
import { HOTEL_NEAR, YasHotel } from "../../../scenes/abu-dhabi-2021/YasHotel";

export const CAM = pinhole({ f: 1100, horizon: 690, cx: 935, height: 4.5 });

// Track coordinates relative to the camera, m: x across (right +), y up, z down the straight.
const Z_NEAR = 3; // everything along the straight starts here, in front of the frame's near edge
const TRACK = { left: -4, right: 12 };
const PIT_WALL = -5.5;
const PIT_FRONT = -22;
const RUNOFF = 17; // the right-hand wall and debris fence
// The Yas hotel: the origin of its frame (on the ground under the link bridge, on the track's centre line). The
// straight, its walls and fences and the run-off run on under the bridge to Z_FAR; the pit building and pit lane end
// against the west block's podium, the strip behind the right-hand fence against the east block's.
// Composite distance: the hotel stands just beyond the main grandstand's far end (its nearest point 1 m past it).
const HOTEL_AT = { x: 4, z: 103 - HOTEL_NEAR.east };
const PIT_END = HOTEL_AT.z + HOTEL_NEAR.west[1];
const EAST_END = HOTEL_AT.z + HOTEL_NEAR.eastZ;
const Z_FAR = 420;
// The main grandstand: front wall at x = front, seat rows climbing to x = back, from z0 to z1.
const STAND = { front: 20, back: 40, z0: 16, z1: 102, rows: 23 };
// Its canopy: a fabric roof on cantilever arms every `bay` m, the lip out over the front rows, rising to the back beam
// over the hospitality level. The lip scallops back and up between arm tips.
const ROOF = { lipX: 24, lipY: 19, backX: 42, backY: 23.5, bay: 12, inX: 1.4, upY: 1.2 };
const HOSP = { x: 40.5, y0: 16.3, y1: 22.7 };

// Night screentone: paper dots on ink (the page's ToneDefs are ink on paper). Put once in <defs>.
export const NightToneDefs: React.FC = () => (
  <>
    {(
      [
        ["nt-dark", 0.9],
        ["nt-mid", 1.6],
        ["nt-light", 2.4],
      ] as const
    ).map(([id, r]) => (
      <pattern
        key={id}
        id={id}
        width={7}
        height={7}
        patternUnits="userSpaceOnUse"
        patternTransform="rotate(45)"
      >
        <rect width={7} height={7} fill={INK} />
        <circle cx={3.5} cy={3.5} r={r} fill={PAPER} />
      </pattern>
    ))}
    <linearGradient id="nt-cone" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor={PAPER} stopOpacity={0.3} />
      <stop offset="0.35" stopColor={PAPER} stopOpacity={0.1} />
      <stop offset="1" stopColor={PAPER} stopOpacity={0.03} />
    </linearGradient>
    <radialGradient id="nt-glow">
      <stop offset="0" stopColor={PAPER} stopOpacity={0.9} />
      <stop offset="0.25" stopColor={PAPER} stopOpacity={0.35} />
      <stop offset="1" stopColor={PAPER} stopOpacity={0} />
    </radialGradient>
    <radialGradient id="nt-pool">
      <stop offset="0" stopColor={PAPER} stopOpacity={0.4} />
      <stop offset="1" stopColor={PAPER} stopOpacity={0} />
    </radialGradient>
    <linearGradient id="nt-sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor={PAPER} stopOpacity={0} />
      <stop offset="0.75" stopColor={PAPER} stopOpacity={0.05} />
      <stop offset="1" stopColor={PAPER} stopOpacity={0.16} />
    </linearGradient>
    <filter id="nt-blur" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation={40} />
    </filter>
  </>
);
const nt = (l: "dark" | "mid" | "light") => `url(#nt-${l})`;

const hash = (a: number, b: number) => {
  const h = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
  return h - Math.floor(h);
};

type Pt = { x: number; y: number };
const S = (x: number, y: number, z: number) => CAM.project({ x, y, z });
const quad = (pts: Pt[]) => `M ${pts.map((p) => `${p.x} ${p.y}`).join(" L ")} Z`;
// A wall face along the straight at track x, from height y0 to y1, depths z0..z1.
const face = (x: number, y0: number, y1: number, z0: number, z1: number) =>
  quad([S(x, y0, z0), S(x, y0, z1), S(x, y1, z1), S(x, y1, z0)]);
// A ground strip between track x0..x1, depths z0..z1.
const strip = (x0: number, x1: number, z0: number, z1: number) =>
  quad([S(x0, 0, z0), S(x1, 0, z0), S(x1, 0, z1), S(x0, 0, z1)]);
const line = (a: Pt, b: Pt) => `M ${a.x} ${a.y} L ${b.x} ${b.y}`;
// A stroke width of `m` metres at depth z, kept readable far off and not absurd up close.
const wAt = (m: number, z: number, min = 1) => Math.max(min, Math.min(40, m * CAM.pxPerMetre(z)));

// A concrete wall with its debris fence along the straight at track x, unbroken from Z_NEAR on under the hotel's bridge: wall face
// and cap, chain-link mesh (a fine diamond net up close, a translucent sheet beyond), posts every 3 m, two mid rails
// and the top rail. Rails and cap are thin faces, so they taper with distance like the wall itself.
const WALL_H = 1.2;
const FENCE_H = 4;
const WallFence: React.FC<{ x: number }> = ({ x }) => {
  const z0 = Z_NEAR;
  const z1 = Z_FAR;
  const mesh: string[] = [];
  const rise = FENCE_H - WALL_H;
  for (let z = z0; z < 70; z += 0.45) {
    mesh.push(line(S(x, WALL_H, z), S(x, FENCE_H, z + rise)));
    mesh.push(line(S(x, FENCE_H, z), S(x, WALL_H, z + rise)));
  }
  const posts: React.ReactNode[] = [];
  for (let z = z0 + 1; z < z1; z += 3) {
    posts.push(
      <path
        key={z}
        d={line(S(x, WALL_H, z), S(x, FENCE_H + 0.1, z))}
        stroke="#a8a8a8"
        strokeWidth={wAt(0.09, z, 1.4)}
      />,
    );
  }
  return (
    <g>
      <path d={face(x, 0, WALL_H, z0, z1)} fill={nt("light")} stroke={INK} strokeWidth={2} />
      <path d={face(x, WALL_H - 0.08, WALL_H, z0, z1)} fill={PAPER} />
      <path d={face(x, WALL_H, FENCE_H, z0, z1)} fill="#bdbdbd" opacity={0.1} />
      <path d={mesh.join(" ")} stroke="#9a9a9a" strokeWidth={0.8} opacity={0.4} fill="none" />
      {posts}
      {[2.2, 3.1].map((y) => (
        <path key={y} d={face(x, y - 0.03, y + 0.03, z0, z1)} fill="#8a8a8a" />
      ))}
      <path d={face(x, FENCE_H - 0.05, FENCE_H + 0.05, z0, z1)} fill="#b4b4b4" />
    </g>
  );
};

// Crowd: one seated spectator per seat on each visible row. Seat rows climb from the front wall to the back.
type Fan = { x: number; y: number; r: number; shade: number; seed: number };
const row = (k: number) => ({
  x: STAND.front + 0.3 + (k * (STAND.back - STAND.front - 0.6)) / STAND.rows,
  y: 2.5 + k * 0.6,
});
const FANS: Fan[] = (() => {
  const out: Fan[] = [];
  for (let k = 0; k < STAND.rows; k++) {
    const { x, y } = row(k);
    for (let z = STAND.z1 - 0.3; z > STAND.z0; z -= 0.62) {
      const zz = z + (hash(k, z) - 0.5) * 0.18;
      const head = S(x + 0.35, y + 0.95, zz);
      if (head.x > 1990) break;
      const r = hash(z * 3, k);
      if (r < 0.06) continue; // an empty seat
      out.push({
        x: head.x,
        y: head.y,
        r: 0.12 * CAM.pxPerMetre(zz),
        shade: r,
        seed: k * 1000 + Math.round(z * 10),
      });
    }
  }
  return out;
})();

// Floodlight towers: track x, depth, height. On the left they stand in the paddock behind the pit building (which
// hides their feet), in front of the hotel's west podium and low enough in frame to stay clear of the title; on the
// right just behind the debris fence, one in the gap between the grandstand's far end and the hotel, one beyond the
// east block (so none pierces the canopy, the east block or its podium).
const TOWERS = [
  { x: -30, z: 80, h: 32, aim: 0 },
  { x: -30, z: 100, h: 32, aim: 1 },
  { x: 19, z: 104, h: 30, aim: 9 },
  { x: 19, z: 216, h: 30, aim: 8 },
];
type Tower = (typeof TOWERS)[number];

const Mast: React.FC<{ w: Tower }> = ({ w }) => {
  const top = S(w.x, w.h, w.z);
  const base = S(w.x, 0, w.z);
  const px = CAM.pxPerMetre(w.z);
  return (
    <path
      d={`M ${base.x - px * 0.5} ${base.y} L ${top.x - px * 0.25} ${top.y} L ${top.x + px * 0.25} ${top.y} L ${base.x + px * 0.5} ${base.y} Z`}
      fill="#3a3a3a"
      stroke={PAPER}
      strokeWidth={1}
      strokeOpacity={0.5}
    />
  );
};

// The lamp bank and its light: cone onto the straight, pool on the asphalt, glow.
const Lamp: React.FC<{ w: Tower; t: number }> = ({ w, t }) => {
  const top = S(w.x, w.h, w.z);
  const px = CAM.pxPerMetre(w.z);
  const half = 2.2 * px;
  const g0 = S(w.aim - 5, 0, w.z - 16);
  const g1 = S(w.aim + 5, 0, w.z + 4);
  return (
    <g>
      <path
        d={`M ${top.x - half * 0.9} ${top.y + px * 1.6} L ${top.x + half * 0.9} ${top.y + px * 1.6} L ${g1.x} ${g1.y} L ${g0.x} ${g0.y} Z`}
        fill="url(#nt-cone)"
      />
      <ellipse
        cx={(g0.x + g1.x) / 2}
        cy={(g0.y + g1.y) / 2}
        rx={Math.abs(g1.x - g0.x) * 0.75}
        ry={Math.abs(g1.y - g0.y) * 0.7}
        fill="url(#nt-pool)"
      />
      <rect x={top.x - half} y={top.y - px * 0.2} width={half * 2} height={px * 1.8} fill={PAPER} stroke={INK} strokeWidth={1.5} />
      {[-0.5, 0, 0.5].map((u) => (
        <path key={u} d={`M ${top.x + u * half * 1.4} ${top.y - px * 0.2} L ${top.x + u * half * 1.4} ${top.y + px * 1.6}`} stroke={INK} strokeWidth={1} />
      ))}
      <path d={`M ${top.x - half} ${top.y + px * 0.7} L ${top.x + half} ${top.y + px * 0.7}`} stroke={INK} strokeWidth={1} />
      <circle cx={top.x} cy={top.y + px * 0.8} r={half * 2.6} fill="url(#nt-glow)" opacity={0.85 + 0.15 * Math.sin(t * 13 + w.z)} />
    </g>
  );
};

// The grandstand canopy, seen from below: per bay, the lit fabric underside between the scalloped lip and the back
// beam, seams fanning back from the lip, the cantilever arm at each bay line (a plate in the cross-section plane), the
// back beam's fascia and the lamps under the lip. All in world metres, so the lip and back beam run to the vanishing
// point.
const ARMS: number[] = (() => {
  const out: number[] = [];
  for (let z = STAND.z0; z <= STAND.z1 + 0.01; z += ROOF.bay) out.push(z);
  return out;
})();
const Canopy: React.FC = () => {
  const { lipX, lipY, backX, backY, inX, upY } = ROOF;
  // the lip between two arms as a quadratic: its control point sits at twice the mid-span offset
  const ctrl = (zm: number) => S(lipX + 2 * inX, lipY + 2 * upY, zm);
  const lipPt = (za: number, zb: number, s: number) => {
    const zm = (za + zb) / 2;
    // the same quadratic, evaluated in world space (close enough to the projected curve for seam ends)
    const a = (1 - s) * (1 - s);
    const b = 2 * s * (1 - s);
    const c = s * s;
    return {
      x: lipX + b * 2 * inX,
      y: lipY + b * 2 * upY,
      z: a * za + b * zm + c * zb,
    };
  };
  const bays = ARMS.slice(0, -1).map((za, i) => [za, ARMS[i + 1]] as const);
  const lipD = bays
    .map(([za, zb], i) => {
      const a = S(lipX, lipY, za);
      const b = S(lipX, lipY, zb);
      const c = ctrl((za + zb) / 2);
      return `${i === 0 ? `M ${a.x} ${a.y} ` : ""}Q ${c.x} ${c.y} ${b.x} ${b.y}`;
    })
    .join(" ");
  const backFar = S(backX, backY, STAND.z1);
  const backNear = S(backX, backY, STAND.z0);
  const seams: string[] = [];
  bays.forEach(([za, zb]) => {
    const zm = (za + zb) / 2;
    const hub = S(backX, backY, zm);
    for (const s of [0.25, 0.5, 0.75]) {
      const p = lipPt(za, zb, s);
      seams.push(line(S(p.x, p.y, p.z), hub));
    }
  });
  return (
    <g>
      {/* hospitality level under the back of the canopy: dark glazing, some boxes lit */}
      <path d={face(HOSP.x, HOSP.y0, HOSP.y1, STAND.z0, STAND.z1)} fill="#1a1a1a" />
      {Array.from({ length: Math.floor((STAND.z1 - STAND.z0) / 4) }, (_, i) => {
        const z = STAND.z0 + i * 4;
        return hash(i, 9) > 0.35 ? (
          <path key={i} d={face(HOSP.x, 17.6, 21.4, z + 0.4, z + 3.6)} fill={PAPER} opacity={0.3 + 0.3 * hash(i, 10)} />
        ) : null;
      })}
      <path d={face(HOSP.x, 17.2, 17.4, STAND.z0, STAND.z1)} fill="#8a8a8a" />
      {/* the fabric underside, lit from below */}
      <path
        d={`${lipD} L ${backFar.x} ${backFar.y} L ${backNear.x} ${backNear.y} Z`}
        fill={tone("light")}
        stroke={INK}
        strokeWidth={2.5}
        strokeLinejoin="round"
      />
      <path d={seams.join(" ")} stroke="#8c8c8c" strokeWidth={1.3} fill="none" />
      {/* back beam fascia */}
      <path d={face(backX, backY - 0.9, backY, STAND.z0, STAND.z1)} fill="#4a4a4a" stroke={INK} strokeWidth={1.5} />
      {/* cantilever arms */}
      {ARMS.map((z) => (
        <path
          key={z}
          d={quad([S(lipX, lipY, z), S(backX, backY, z), S(backX, backY - 1.1, z), S(lipX, lipY - 0.45, z)])}
          fill="#5a5a5a"
          stroke={INK}
          strokeWidth={1.5}
          strokeLinejoin="round"
        />
      ))}
      <path d={lipD} fill="none" stroke={PAPER} strokeWidth={3} />
      {/* lamps under the lip: one at each arm, one mid-bay */}
      {[...ARMS, ...bays.map(([a, b]) => (a + b) / 2)].map((z) => {
        const p = S(lipX + 0.9, lipY - 0.6, z);
        const px = CAM.pxPerMetre(z);
        return (
          <g key={`l${z}`}>
            <circle cx={p.x} cy={p.y} r={1.6 * px} fill="url(#nt-glow)" />
            <rect x={p.x - 0.35 * px} y={p.y - 0.12 * px} width={0.7 * px} height={0.24 * px} fill={PAPER} />
          </g>
        );
      })}
    </g>
  );
};

/**
 * The scene. `t` seconds into the shot drives the haze drift, the crowd's camera flashes and the twinkle; `lit` 0..1
 * lights the hotel's gridshell panel by panel; `flashes` scales how many camera flashes pop per frame; `frame` seeds them.
 */
export const YasNight: React.FC<{
  t: number;
  frame: number;
  lit: number;
  flashes: number;
}> = ({ t, frame, lit, flashes }) => {
  const H = CAM.horizon;

  // grid boxes, staggered, 8 m apart, pole on the right
  const slots: React.ReactNode[] = [];
  for (let i = 0; i < 18; i++) {
    const z = 18 + i * 8;
    const cx = i % 2 === 0 ? 7.6 : 0.4;
    const w = 3.2;
    const bar = strip(cx - w / 2, cx + w / 2, z, z + 0.35);
    const tl = strip(cx - w / 2, cx - w / 2 + 0.3, z + 0.35, z + 1.8);
    const tr = strip(cx + w / 2 - 0.3, cx + w / 2, z + 0.35, z + 1.8);
    slots.push(<path key={i} d={`${bar} ${tl} ${tr}`} fill={PAPER} opacity={0.92} />);
  }

  // pit garage bays along the pit building, up to the hotel
  const bays: React.ReactNode[] = [];
  for (let z = 4; z + 6.2 < PIT_END; z += 7) {
    const on = hash(z, 3) > 0.25;
    const z0 = z + 0.6;
    const z1 = z + 6.2;
    bays.push(
      <g key={z}>
        {/* garage opening: dark interior, its ceiling lights, the half-raised shutter */}
        <path d={face(PIT_FRONT, 0.2, 3.6, z0, z1)} fill={on ? nt("mid") : nt("dark")} />
        {on ? <path d={face(PIT_FRONT, 2.6, 3.4, z0, z1)} fill={PAPER} opacity={0.75} /> : null}
        <path d={face(PIT_FRONT, 3.4, 3.6, z0, z1)} fill={tone("mid")} />
        <path
          d={`${line(S(PIT_FRONT, 0.2, z0), S(PIT_FRONT, 3.6, z0))} ${line(S(PIT_FRONT, 0.2, z1), S(PIT_FRONT, 3.6, z1))}`}
          stroke={PAPER}
          strokeWidth={1.5}
          opacity={0.6}
        />
      </g>,
    );
  }
  // pit lane: the dashed line between the fast lane and the working lane, dashes foreshortened on the ground
  const dashes: string[] = [];
  for (let z = Z_NEAR; z + 3 < PIT_END; z += 6) dashes.push(strip(-11.1, -10.9, z, z + 3));

  // camera flashes in the crowd this frame
  const pops: React.ReactNode[] = [];
  const nPop = Math.round(flashes);
  for (let i = 0; i < nPop; i++) {
    const f = FANS[Math.floor(hash(frame * 0.37 + i * 3.1, i) * FANS.length)];
    const k = 0.6 + 0.4 * hash(frame, i);
    const s = Math.max(8, f.r * 5) * k;
    pops.push(
      <g key={i} transform={`translate(${f.x} ${f.y})`}>
        <circle r={s * 1.8} fill="url(#nt-glow)" />
        <path
          d={`M ${-s} 0 L ${-s * 0.12} ${-s * 0.12} L 0 ${-s} L ${s * 0.12} ${-s * 0.12} L ${s} 0 L ${s * 0.12} ${s * 0.12} L 0 ${s} L ${-s * 0.12} ${s * 0.12} Z`}
          fill={PAPER}
        />
      </g>,
    );
  }

  return (
    <g>
      {/* sky, the circuit's glow on the horizon */}
      <rect x={-200} y={-200} width={2320} height={H + 200} fill={INK} />
      <rect x={-200} y={240} width={2320} height={H - 240} fill="url(#nt-sky)" />
      {/* distant Yas Island skyline and marina lights at the horizon */}
      <path
        d={`M -200 ${H} L -200 ${H - 14} L 300 ${H - 14} L 300 ${H - 22} L 520 ${H - 22} L 520 ${H - 12} L 1400 ${H - 12} L 1400 ${H - 26} L 1700 ${H - 26} L 1700 ${H - 10} L 2120 ${H - 10} L 2120 ${H} Z`}
        fill={nt("dark")}
      />
      {Array.from({ length: 70 }, (_, i) => (
        <circle
          key={i}
          cx={-100 + i * 31 + hash(i, 1) * 20}
          cy={H - 4 - hash(i, 2) * 16}
          r={1.2 + hash(i, 3) * 1.2}
          fill={PAPER}
          opacity={0.45 + 0.4 * Math.sin(t * 3 + i)}
        />
      ))}

      {/* ground: the far straight running on under the hotel's bridge */}
      <rect x={-200} y={H} width={2320} height={1080 - H + 200} fill="#121212" />
      <path d={strip(TRACK.left, TRACK.right, Z_NEAR, 2000)} fill={nt("dark")} />

      <YasHotel cam={CAM} at={HOTEL_AT} lit={lit} t={t} id="yas41" />

      {/* floodlight masts (furthest first); the pit building and the right-hand fence cover their feet */}
      {TOWERS.map((w) => (
        <Mast key={`${w.x}-${w.z}`} w={w} />
      ))}

      {/* left: pit building (garage bays lit), pit lane, pit wall with debris fence — all the building ending at the hotel's west podium */}
      <path d={face(PIT_FRONT, 0, 7, Z_NEAR, PIT_END)} fill={nt("mid")} />
      <path d={face(PIT_FRONT, 4.4, 6.4, Z_NEAR, PIT_END)} fill={INK} />
      {bays}
      {/* upper level: hospitality glazing, some rooms lit, mullions every 2 m */}
      <path d={face(PIT_FRONT, 4.7, 6, Z_NEAR, PIT_END)} fill={nt("mid")} />
      {Array.from({ length: Math.floor((PIT_END - 8) / 7) }, (_, i) => {
        const z = 4 + i * 7;
        return hash(i, 4) > 0.45 ? <path key={i} d={face(PIT_FRONT, 4.8, 5.9, z + 0.3, z + 4.3)} fill={PAPER} opacity={0.35} /> : null;
      })}
      <path
        d={Array.from({ length: Math.floor((PIT_END - Z_NEAR) / 2) }, (_, i) =>
          line(S(PIT_FRONT, 4.7, Z_NEAR + i * 2), S(PIT_FRONT, 6, Z_NEAR + i * 2)),
        ).join(" ")}
        stroke={INK}
        strokeWidth={1.5}
      />
      <path d={face(PIT_FRONT, 6.92, 7.08, Z_NEAR, PIT_END)} fill={PAPER} />
      <path d={strip(PIT_FRONT, PIT_WALL, Z_NEAR, PIT_END)} fill="#161616" />
      <path d={dashes.join(" ")} fill={PAPER} opacity={0.5} />
      <WallFence x={PIT_WALL} />

      {/* the straight: asphalt, white edge lines, start line and the grid boxes */}
      <path d={strip(TRACK.left, TRACK.right, Z_NEAR, Z_FAR)} fill={nt("dark")} />
      {/* rubbered-in lines where the grid's two files run */}
      <path d={`${strip(-0.5, 1.3, Z_NEAR, 1500)} ${strip(6.7, 8.5, Z_NEAR, 1500)}`} fill={INK} opacity={0.45} />
      <path d={strip(TRACK.left, TRACK.left + 0.25, Z_NEAR, 1500)} fill={PAPER} />
      <path d={strip(TRACK.right - 0.25, TRACK.right, Z_NEAR, 1500)} fill={PAPER} />
      <path d={strip(TRACK.left, TRACK.right, 14, 14.5)} fill={PAPER} />
      {slots}
      {/* right: painted run-off up to the wall, the strip of ground behind it */}
      <path d={strip(TRACK.right, RUNOFF, Z_NEAR, Z_FAR)} fill={nt("mid")} />
      <path d={strip(TRACK.right + 1.2, TRACK.right + 1.5, Z_NEAR, Z_FAR)} fill={PAPER} opacity={0.8} />
      <path d={strip(RUNOFF, STAND.front, Z_NEAR, EAST_END)} fill="#1a1a1a" />

      {/* right: the main grandstand — front wall, seat rows packed with fans, the canopy over them */}
      <path d={face(STAND.front, 0, 2.5, STAND.z0, STAND.z1)} fill={nt("light")} stroke={INK} strokeWidth={2} />
      <path
        d={Array.from({ length: Math.floor((STAND.z1 - STAND.z0) / 6) + 1 }, (_, i) =>
          line(S(STAND.front, 0, STAND.z0 + i * 6), S(STAND.front, 2.5, STAND.z0 + i * 6)),
        ).join(" ")}
        stroke={INK}
        strokeWidth={2}
      />
      <path
        d={quad([
          S(STAND.front, 2.5, STAND.z1),
          S(STAND.back, row(STAND.rows).y, STAND.z1),
          S(STAND.back, row(STAND.rows).y, STAND.z0),
          S(STAND.front, 2.5, STAND.z0),
        ])}
        fill={nt("mid")}
      />
      {Array.from({ length: STAND.rows }, (_, k) => {
        const r = row(k);
        return <path key={k} d={face(r.x, r.y - 0.05, r.y + 0.3, STAND.z0, STAND.z1)} fill={INK} opacity={0.75} />;
      })}
      {FANS.map((f) => {
        const fill =
          f.shade > 0.7 ? PAPER : f.shade > 0.4 ? "#c4c4c4" : f.shade > 0.15 ? "#8c8c8c" : "#4a4a4a";
        return (
          <g key={f.seed}>
            <ellipse cx={f.x} cy={f.y + f.r * 2.3} rx={f.r * 1.7} ry={f.r * 1.3} fill={fill} stroke={INK} strokeWidth={Math.min(1.5, f.r * 0.25)} />
            <circle cx={f.x} cy={f.y} r={f.r} fill={fill} stroke={INK} strokeWidth={Math.min(1.5, f.r * 0.25)} />
          </g>
        );
      })}
      {/* the stand's far end: its raked profile */}
      <path
        d={`M ${S(STAND.front, 0, STAND.z1).x} ${S(STAND.front, 0, STAND.z1).y} L ${S(STAND.front, 2.5, STAND.z1).x} ${S(STAND.front, 2.5, STAND.z1).y} L ${S(STAND.back, row(STAND.rows).y, STAND.z1).x} ${S(STAND.back, row(STAND.rows).y, STAND.z1).y}`}
        stroke={PAPER}
        strokeWidth={2.5}
        fill="none"
      />
      <Canopy />
      {pops}

      {/* right: track-edge wall and debris fence, in front of the stand */}
      <WallFence x={RUNOFF} />

      {/* floodlights: lamp banks, cones and pools */}
      {TOWERS.map((w) => (
        <Lamp key={`${w.x}-${w.z}`} w={w} t={t} />
      ))}

      {/* drifting light haze around the floodlights and over the straight */}
      <g filter="url(#nt-blur)">
        {[
          { x: 520, y: 360, rx: 300, ry: 90, o: 0.1, v: 14 },
          { x: 1080, y: 420, rx: 340, ry: 80, o: 0.08, v: -10 },
          { x: 760, y: 640, rx: 520, ry: 70, o: 0.12, v: 8 },
          { x: 300, y: 820, rx: 380, ry: 60, o: 0.06, v: 18 },
        ].map((h, i) => (
          <ellipse key={i} cx={h.x + h.v * t} cy={h.y + 6 * Math.sin(t * 0.8 + i)} rx={h.rx} ry={h.ry} fill={PAPER} opacity={h.o} />
        ))}
      </g>
    </g>
  );
};
