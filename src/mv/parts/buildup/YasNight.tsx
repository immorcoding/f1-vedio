// Shot 4.1's picture: Yas Marina at night through one pinhole camera (ART-9), standing on the start/finish straight
// and looking down it. The grid boxes run away to the Yas hotel, whose link bridge spans the far end; the pit wall and
// pit building on the left, the main grandstand (tensile sail roof, packed crowd) on the right, floodlight towers
// throwing light cones onto the asphalt. Black and white only (ART-8).
//
// References (docs/assets/reference-register.md): the straight between the pit building and the main grandstand at
// night, its sail roofs lit from below (references/yas-marina/main-straight-night-2009.jpg); floodlight towers and
// the lit hotel from the circuit (yas-hotel-fireworks-2015.jpg, circuit-by-night-2010.jpg). The hotel is drawn by
// YasHotel. Composite for the title card: the camera compresses the lap so the hotel closes the straight.
import { pinhole } from "../../../kit/camera";
import { INK, PAPER } from "../../../kit/colors";
import { tone } from "../../../kit/tone";
import { YasHotel } from "../../../scenes/abu-dhabi-2021/YasHotel";

export const CAM = pinhole({ f: 1100, horizon: 690, cx: 935, height: 4.5 });

// Track coordinates relative to the camera, m: x across (right +), z down the straight.
const TRACK = { left: -4, right: 12 };
const PIT_WALL = -5.5;
const PIT_FRONT = -22;
const RUNOFF = 17;
const STAND = { front: 20, back: 40, z0: 14, z1: 58, rows: 23 };
const HOTEL_Z = 149;

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

const S = (x: number, y: number, z: number) => CAM.project({ x, y, z });
const quad = (pts: { x: number; y: number }[]) =>
  `M ${pts.map((p) => `${p.x} ${p.y}`).join(" L ")} Z`;
// A wall face along the straight at track x, from height y0 to y1, depths z0..z1.
const face = (x: number, y0: number, y1: number, z0: number, z1: number) =>
  quad([S(x, y0, z0), S(x, y0, z1), S(x, y1, z1), S(x, y1, z0)]);
// A ground strip between track x0..x1, depths z0..z1.
const strip = (x0: number, x1: number, z0: number, z1: number) =>
  quad([S(x0, 0, z0), S(x1, 0, z0), S(x1, 0, z1), S(x0, 0, z1)]);
const line = (a: { x: number; y: number }, b: { x: number; y: number }) =>
  `M ${a.x} ${a.y} L ${b.x} ${b.y}`;

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

// Floodlight towers: track x, depth, height.
const TOWERS = [
  { x: -8, z: 80, h: 30, aim: 0 },
  { x: -8, z: 128, h: 30, aim: 1 },
  { x: 16, z: 80, h: 30, aim: 9 },
  { x: 16, z: 126, h: 30, aim: 8 },
];

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
  const hotelScale = 3.3;
  // photo x 288 (the bridge's middle) sits over the track's centre at the hotel's distance
  const bridge = CAM.screenX((TRACK.left + TRACK.right) / 2, HOTEL_Z);
  const hotelX = bridge - 288 * hotelScale;
  const hotelGround = CAM.screenY(0, HOTEL_Z);

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

  // pit wall fence posts and pit garage bays
  const posts: string[] = [];
  for (let z = 13; z < 240; z += 4) posts.push(line(S(PIT_WALL, 1.2, z), S(PIT_WALL, 4, z)));
  const rPosts: string[] = [];
  for (let z = 13; z < 240; z += 4) rPosts.push(line(S(RUNOFF, 1.2, z), S(RUNOFF, 4, z)));
  const bays: React.ReactNode[] = [];
  for (let z = 22; z < 220; z += 7) {
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

  // the roof: a fabric canopy over the stand, its underside lit from below and facing the camera; ribs every 5.5 m run
  // back from the lip, which sags a little between them, with a lamp at each rib
  const ribs: number[] = [];
  for (let z = STAND.z1; z > STAND.z0 - 0.1; z -= 5.5) ribs.push(z);
  ribs.reverse();
  const LIP = { x: 21, h: 18, sag: 0.12 };
  const BACK = { x: 40, h: 22.5 };
  const lipD = ribs
    .map((z, i) => {
      const p = S(LIP.x, LIP.h, z);
      if (i === 0) return `M ${p.x} ${p.y}`;
      const c = S(LIP.x, LIP.h + LIP.sag * 2, (z + ribs[i - 1]) / 2);
      return `Q ${c.x} ${c.y} ${p.x} ${p.y}`;
    })
    .join(" ");
  const backFar = S(BACK.x, BACK.h, STAND.z1);
  const backNear = S(BACK.x, BACK.h, STAND.z0);
  const roof = (
    <g>
      <path d={`${lipD} L ${backFar.x} ${backFar.y} L ${backNear.x} ${backNear.y} Z`} fill={tone("light")} stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
      {/* the lit strip just behind the lip */}
      <path
        d={quad([S(LIP.x, LIP.h, STAND.z0), S(LIP.x, LIP.h, STAND.z1), S(24, 18.7, STAND.z1), S(24, 18.7, STAND.z0)])}
        fill={PAPER}
        opacity={0.85}
      />
      <path d={ribs.map((z) => line(S(LIP.x, LIP.h, z), S(BACK.x, BACK.h, z))).join(" ")} stroke={INK} strokeWidth={2} />
      <path d={lipD} fill="none" stroke={PAPER} strokeWidth={3} />
      {ribs.map((z) => {
        const p = S(LIP.x + 0.2, LIP.h - 0.3, z);
        return <circle key={z} cx={p.x} cy={p.y} r={0.9 * CAM.pxPerMetre(z)} fill="url(#nt-glow)" />;
      })}
    </g>
  );

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
      <path d={strip(TRACK.left, TRACK.right, 12, 2000)} fill={nt("dark")} />

      <YasHotel x={hotelX} ground={hotelGround} scale={hotelScale} lit={lit} t={t} id="yas41" />

      {/* left: pit building (garage bays lit), pit lane, pit wall with debris fence */}
      <path d={face(PIT_FRONT, 0, 7, 12, 260)} fill={nt("mid")} />
      <path d={face(PIT_FRONT, 4.4, 6.4, 12, 260)} fill={INK} />
      {bays}
      {/* upper level: hospitality glazing, some rooms lit, mullions every 2 m */}
      <path d={face(PIT_FRONT, 4.7, 6, 12, 260)} fill={nt("mid")} />
      {Array.from({ length: 30 }, (_, i) => {
        const z = 22 + i * 7;
        return hash(i, 4) > 0.45 ? <path key={i} d={face(PIT_FRONT, 4.8, 5.9, z + 0.3, z + 4.3)} fill={PAPER} opacity={0.35} /> : null;
      })}
      <path
        d={Array.from({ length: 124 }, (_, i) => line(S(PIT_FRONT, 4.7, 12 + i * 2), S(PIT_FRONT, 6, 12 + i * 2))).join(" ")}
        stroke={INK}
        strokeWidth={1.5}
      />
      <path d={line(S(PIT_FRONT, 7, 12), S(PIT_FRONT, 7, 260))} stroke={PAPER} strokeWidth={3} />
      <path d={strip(PIT_FRONT, PIT_WALL, 12, 260)} fill="#161616" />
      <path d={line(S(-11, 0, 12), S(-11, 0, 260))} stroke={PAPER} strokeWidth={2} opacity={0.5} strokeDasharray="30 26" />
      <path d={face(PIT_WALL, 0, 1.2, 12, 260)} fill={nt("light")} stroke={INK} strokeWidth={2} />
      <path d={line(S(PIT_WALL, 1.2, 12), S(PIT_WALL, 1.2, 260))} stroke={PAPER} strokeWidth={3} />
      <path d={posts.join(" ")} stroke="#9a9a9a" strokeWidth={2} />
      <path
        d={[2.2, 3.1, 4].map((y) => line(S(PIT_WALL, y, 12), S(PIT_WALL, y, 260))).join(" ")}
        stroke="#8a8a8a"
        strokeWidth={1.3}
      />

      {/* the straight: asphalt, white edge lines, start line and the grid boxes */}
      <path d={strip(TRACK.left, TRACK.right, 12, HOTEL_Z)} fill={nt("dark")} />
      {/* rubbered-in lines where the grid's two files run */}
      <path d={`${strip(-0.5, 1.3, 12, 1500)} ${strip(6.7, 8.5, 12, 1500)}`} fill={INK} opacity={0.45} />
      <path d={strip(TRACK.left, TRACK.left + 0.25, 12, 1500)} fill={PAPER} />
      <path d={strip(TRACK.right - 0.25, TRACK.right, 12, 1500)} fill={PAPER} />
      <path d={strip(TRACK.left, TRACK.right, 14, 14.5)} fill={PAPER} />
      {slots}
      {/* right: painted run-off, wall and debris fence */}
      <path d={strip(TRACK.right, RUNOFF, 12, 400)} fill={nt("mid")} />
      <path d={strip(TRACK.right + 1.2, TRACK.right + 1.5, 12, 400)} fill={PAPER} opacity={0.8} />
      <path d={face(RUNOFF, 0, 1.2, 12, 400)} fill={nt("light")} stroke={INK} strokeWidth={2} />
      <path d={line(S(RUNOFF, 1.2, 12), S(RUNOFF, 1.2, 400))} stroke={PAPER} strokeWidth={3} />
      <path d={rPosts.join(" ")} stroke="#9a9a9a" strokeWidth={2} />
      <path
        d={[2.2, 3.1, 4].map((y) => line(S(RUNOFF, y, 12), S(RUNOFF, y, 400))).join(" ")}
        stroke="#8a8a8a"
        strokeWidth={1.3}
      />

      {/* floodlight towers: lattice mast, lamp bank, light cone onto the straight */}
      {TOWERS.map((w) => {
        const top = S(w.x, w.h, w.z);
        const base = S(w.x, 0, w.z);
        const px = CAM.pxPerMetre(w.z);
        const half = 2.2 * px;
        const g0 = S(w.aim - 5, 0, w.z - 16);
        const g1 = S(w.aim + 5, 0, w.z + 4);
        return (
          <g key={`${w.x}-${w.z}`}>
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
            <path
              d={`M ${base.x - px * 0.5} ${base.y} L ${top.x - px * 0.25} ${top.y} L ${top.x + px * 0.25} ${top.y} L ${base.x + px * 0.5} ${base.y} Z`}
              fill="#3a3a3a"
              stroke={PAPER}
              strokeWidth={1}
              strokeOpacity={0.5}
            />
            <rect x={top.x - half} y={top.y - px * 0.2} width={half * 2} height={px * 1.8} fill={PAPER} stroke={INK} strokeWidth={1.5} />
            {[-0.5, 0, 0.5].map((u) => (
              <path key={u} d={`M ${top.x + u * half * 1.4} ${top.y - px * 0.2} L ${top.x + u * half * 1.4} ${top.y + px * 1.6}`} stroke={INK} strokeWidth={1} />
            ))}
            <path d={`M ${top.x - half} ${top.y + px * 0.7} L ${top.x + half} ${top.y + px * 0.7}`} stroke={INK} strokeWidth={1} />
            <circle cx={top.x} cy={top.y + px * 0.8} r={half * 2.6} fill="url(#nt-glow)" opacity={0.85 + 0.15 * Math.sin(t * 13 + w.z)} />
          </g>
        );
      })}

      {/* right: the main grandstand — front wall, seat rows packed with fans, sail roof */}
      <path d={face(STAND.front, 0, 2.5, STAND.z0, STAND.z1)} fill={nt("light")} stroke={INK} strokeWidth={2} />
      <path
        d={Array.from({ length: 8 }, (_, i) => line(S(STAND.front, 0, 16 + i * 6), S(STAND.front, 2.5, 16 + i * 6))).join(" ")}
        stroke={INK}
        strokeWidth={2}
      />
      <path
        d={quad([S(STAND.front, 2.5, STAND.z1), S(STAND.back, 2.5 + STAND.rows * 0.6, STAND.z1), S(STAND.back, 2.5 + STAND.rows * 0.6, STAND.z0), S(STAND.front, 2.5, STAND.z0)])}
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
        d={`M ${S(STAND.front, 0, STAND.z1).x} ${S(STAND.front, 0, STAND.z1).y} L ${S(STAND.front, 2.5, STAND.z1).x} ${S(STAND.front, 2.5, STAND.z1).y} L ${S(STAND.back, 16.3, STAND.z1).x} ${S(STAND.back, 16.3, STAND.z1).y}`}
        stroke={PAPER}
        strokeWidth={2.5}
        fill="none"
      />
      {roof}
      {pops}

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
