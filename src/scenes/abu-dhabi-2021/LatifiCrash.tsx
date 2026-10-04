// Easter egg (STO-7, treatment 4.3): what brought out the last safety car — on lap 53 Latifi (Williams) lost the rear
// on the exit of turn 14, spun into the outside wall and stopped across the track (facts.md). A small top-down panel
// in the film's top-view style (MOT-2): the stretch of the 2021 lap from the turn-14 apex to the exit under
// floodlights (paper surface, kerbs, the outside wall), Latifi's FW43B (a top-only car, src/cars/fw43b.ts) running
// the rigid-body crash of latifi-t14.ts at real size and real speed (MOT-5). As the rear lets go the spinning tyres
// lay rubber on the track and a fine trail of bubble smoke (ART-20); the rear-right corner hits the wall with an
// impact star, a scuff on the wall and a short burst of small dark flecks (ART-23); the car slides to a stop at an
// angle across the track and stays there.
import { random } from "remotion";
import { FW43B, MangaCar, topAnchorAt, wheelbaseMiddle } from "../../cars";
import { INK, PAPER } from "../../kit/colors";
import { ImpactStar } from "../../kit/impact";
import { speedLines } from "../../kit/lines";
import { tone } from "../../kit/tone";
import {
  autoKerbs,
  mapView,
  samplePath,
  TrackSection,
  YAS_MARINA_2021,
  type MapPoint,
} from "../../tracks";
import { CRASH, crashAt, SLIP, T14_APEX, T14_RUNOFF, WALL_FACE } from "./latifi-t14";

const T = YAS_MARINA_2021;
// The inset's box keeps the #21 proportions (640 × 249 in shot 4.3).
export const LATIFI_ASPECT = 428 / 1100;
const PPM_AT_640 = 13.5; // px per metre at a 640-px-wide box: the car at real size, ~73 px long
const WALL_W = 0.6; // concrete wall, m thick
const LEFT_RUNOFF = 3;

const KERBS = autoKerbs(T, T14_APEX - 90, T14_APEX + 140, 1 / 120);

// The car's frame: the rear wheels, m from the car's centre (the middle of the wheelbase).
const MID = wheelbaseMiddle(FW43B);
const REAR_AXLE = FW43B.lengths.rearAxle - MID;
const FRONT_AXLE = FW43B.lengths.frontAxle - MID;
const local = (x: number, y: number, heading: number, lx: number, ly: number): MapPoint => {
  const a = (heading * Math.PI) / 180;
  return {
    x: x + lx * Math.cos(a) - ly * Math.sin(a),
    y: y + lx * Math.sin(a) + ly * Math.cos(a),
  };
};
const WHEELS: [number, number][] = [
  [REAR_AXLE, 0.8],
  [REAR_AXLE, -0.8],
  [FRONT_AXLE, 0.85],
  [FRONT_AXLE, -0.85],
];

// Rubber laid by each tyre while the car slides: one polyline per tyre (map metres), with the time of each point.
const MARKS = WHEELS.map(([lx, ly]) =>
  CRASH.states
    .filter((s, i) => s.sliding && i % 6 === 0)
    .map((s) => ({ t: s.t, ...local(s.x, s.y, s.heading, lx, ly) })),
);

// Fine bubble smoke from the rear tyres while they scrub sideways: puffs born in map space, carried a little way
// along by the car's speed, growing, breaking up into smaller bubbles and gone within a second.
type Puff = { t0: number; x: number; y: number; vx: number; vy: number; life: number; r0: number; grow: number };
const PUFFS: Puff[] = (() => {
  const out: Puff[] = [];
  const RATE = 30; // per tyre per second
  for (let k = 0; k * (1 / RATE) < 2.2; k++) {
    const t0 = SLIP + 0.06 + (k + 0.8 * random(`latifi-puff-${k}`)) / RATE;
    const s = crashAt(t0);
    if (!s.sliding) continue;
    const a = (s.heading * Math.PI) / 180;
    const prev = crashAt(t0 - 1 / 60);
    const vx = (s.x - prev.x) * 60;
    const vy = (s.y - prev.y) * 60;
    for (const side of [1, -1]) {
      const r = (q: string) => random(`latifi-puff-${k}-${side}-${q}`);
      const p = local(s.x, s.y, s.heading, REAR_AXLE + (r("x") - 0.5) * 0.4, side * 0.95);
      out.push({
        t0,
        x: p.x,
        y: p.y,
        vx: vx * 0.12 + (r("vx") - 0.5) * 1.2 - Math.sin(a) * side * 0.6,
        vy: vy * 0.12 + (r("vy") - 0.5) * 1.2 + Math.cos(a) * side * 0.6,
        life: 0.5 + 0.45 * r("life"),
        r0: 0.18 + 0.2 * r("r0"),
        grow: 0.5 + 0.7 * r("grow"),
      });
    }
  }
  return out;
})();

// A short burst of small dark flecks off the struck corner (carbon and tyre crumbs), sliding away and fading.
const FLECKS = Array.from({ length: 11 }, (_, i) => {
  const r = (q: string) => random(`latifi-fleck-${i}-${q}`);
  const c = CRASH.contact;
  const back = { x: -c.n.x, y: -c.n.y }; // off the wall, onto the track
  const s = crashAt(c.t - 1 / 60);
  const s1 = crashAt(c.t);
  const vx = (s1.x - s.x) * 60;
  const vy = (s1.y - s.y) * 60;
  const out = 2 + 7 * r("out");
  const k = 0.25 + 0.5 * r("k");
  return {
    x: c.x,
    y: c.y,
    vx: vx * k + back.x * out + (r("sx") - 0.5) * 4,
    vy: vy * k + back.y * out + (r("sy") - 0.5) * 4,
    life: 0.5 + 0.6 * r("life"),
    size: 0.12 + 0.2 * r("size"),
    dark: r("dark") < 0.7,
  };
});

/** Drawn into the box (x, y, w, w × LATIFI_ASPECT); `t` seconds since the inset appeared (bar 80). */
export const LatifiCrash: React.FC<{
  x: number;
  y: number;
  w: number;
  t: number;
}> = ({ x, y, w, t }) => {
  const h = w * LATIFI_ASPECT;
  const ppm = (PPM_AT_640 * w) / 640;
  const tc = CRASH.contact.t;
  // a fixed camera: the whole run from the apex to the stop lies along the box, the wall across its lower right
  const start = crashAt(0);
  const end = crashAt(CRASH.stop);
  const dir = (Math.atan2(end.y - start.y, end.x - start.x) * 180) / Math.PI;
  const shake = t >= tc ? Math.exp(-(t - tc) / 0.08) * 5 : 0;
  const view = mapView({
    centre: { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 },
    rotation: -dir + 22,
    pxPerMetre: ppm,
    screen: {
      x: x + w * 0.37 + shake * Math.sin(t * 90),
      y: y + h * 0.25 + shake * Math.cos(t * 77),
    },
  });
  const from = T14_APEX - 90;
  const to = T14_APEX + 140;
  const s = crashAt(t);
  const heading = view.heading(s.heading);
  const p = view.project(s);
  const runoff = (_s: number, side: "left" | "right") =>
    side === "right" ? T14_RUNOFF : LEFT_RUNOFF;
  const wallBand = (g: number, face: number) =>
    view.band(
      samplePath(T, from, to, g * face, 1.5),
      samplePath(T, from, to, g * (face + WALL_W), 1.5),
    );
  const leftFace = T.width / 2 + LEFT_RUNOFF;

  const marks = MARKS.map((m) => m.filter((q) => q.t <= t)).filter((m) => m.length > 1);
  const bubbles = PUFFS.flatMap((f, i) => {
    const age = t - f.t0;
    if (age < 0 || age > f.life) return [];
    const u = age / f.life;
    const drag = 0.35 * (1 - Math.exp(-age / 0.35));
    const c = view.project({ x: f.x + f.vx * drag, y: f.y + f.vy * drag });
    const r = (f.r0 + f.grow * age) * ppm * Math.min(1, 0.4 + age / 0.05);
    if (u < 0.6) return [{ key: `${i}`, x: c.x, y: c.y, r, age }];
    const k = (u - 0.6) / 0.4;
    return [0, 1, 2].map((j) => {
      const a = i * 2.1 + (j / 3) * Math.PI * 2;
      const d = r * (0.45 + 0.9 * k);
      return {
        key: `${i}-${j}`,
        x: c.x + Math.cos(a) * d,
        y: c.y + Math.sin(a) * d,
        r: r * (0.6 - 0.12 * j) * (1 - k),
        age,
      };
    });
  }).sort((a, b) => b.age - a.age);
  const flecks =
    t >= tc
      ? FLECKS.flatMap((f, i) => {
          const age = t - tc;
          if (age > f.life) return [];
          const d = 0.45 * (1 - Math.exp(-age / 0.45));
          const c = view.project({ x: f.x + f.vx * d, y: f.y + f.vy * d });
          return [{ i, ...c, r: Math.max(1.2, f.size * ppm), o: 1 - age / f.life, dark: f.dark }];
        })
      : [];
  const hitAt = view.project(CRASH.contact);
  // a black scuff along the wall face where the corner struck it (n points into the wall, along it is (-n.y, n.x))
  const c = CRASH.contact;
  const scuff = view.path([
    { x: c.x - c.n.y * 1.6, y: c.y + c.n.x * 1.6 },
    { x: c.x + c.n.y * 1.6, y: c.y - c.n.x * 1.6 },
  ]);
  const fast = s.speed > 20 && t < tc;
  const starT = t >= tc ? (t - tc) / 0.3 : 0;
  return (
    <g>
      <defs>
        <clipPath id="latifi-box">
          <rect x={x} y={y} width={w} height={h} />
        </clipPath>
      </defs>
      <g clipPath="url(#latifi-box)">
        {/* night beyond the walls */}
        <rect x={x} y={y} width={w} height={h} fill={INK} />
        <rect x={x} y={y} width={w} height={h} fill={tone("dark")} opacity={0.5} />
        <TrackSection
          track={T}
          view={view}
          from={from}
          to={to}
          surface="paper"
          runoff={runoff}
          kerbs={KERBS}
          escapeRoads={false}

        />
        {/* the concrete walls along both run-offs, the outside one struck */}
        {[1, -1].map((g) => (
          <path
            key={g}
            d={wallBand(g, g > 0 ? WALL_FACE : leftFace)}
            fill={PAPER}
            stroke={INK}
            strokeWidth={2.5}
            strokeLinejoin="round"
          />
        ))}
        {t >= tc ? (
          <path d={scuff} stroke={INK} strokeWidth={Math.max(2, 0.3 * ppm)} strokeLinecap="round" opacity={0.75} />
        ) : null}
        {/* rubber from the sliding tyres */}
        {marks.map((m, i) => (
          <path
            key={i}
            d={view.path(m)}
            fill="none"
            stroke={INK}
            strokeWidth={Math.max(1.5, 0.28 * ppm)}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.4}
          />
        ))}
        {fast ? (
          <g transform={`translate(${p.x} ${p.y}) rotate(${heading})`}>
            <path
              d={speedLines({
                x: -7.5 * ppm,
                y: -1.1 * ppm,
                w: 4.5 * ppm,
                h: 2.2 * ppm,
                n: 6,
                seed: `latifi-${Math.floor(t * 15)}`,
                thickness: 3,
                length: [0.4, 1],
              })}
              fill={INK}
              opacity={0.7}
            />
          </g>
        ) : null}
        <MangaCar
          car={FW43B}
          view="top"
          at={topAnchorAt(FW43B, { x: p.x, y: p.y, pxPerMetre: ppm }, heading)}
          state={{ heading, steer: s.steer }}
        />
        {/* fine bubble smoke over the car's tail and the trail it leaves */}
        {bubbles.map((b) => (
          <g key={b.key}>
            <circle cx={b.x} cy={b.y} r={b.r} fill={PAPER} stroke={INK} strokeWidth={Math.min(1.8, 0.7 + b.r * 0.08)} />
            {b.r > 5 ? (
              <path
                d={`M ${b.x - b.r * 0.2} ${b.y + b.r * 0.88} A ${b.r} ${b.r} 0 0 0 ${b.x + b.r * 0.93} ${b.y + b.r * 0.2}`}
                fill="none"
                stroke={tone("mid")}
                strokeWidth={b.r * 0.32}
              />
            ) : null}
          </g>
        ))}
        {flecks.map((f) => (
          <rect
            key={f.i}
            x={f.x - f.r}
            y={f.y - f.r}
            width={f.r * 2}
            height={f.r * 1.4}
            fill={f.dark ? "#2b2b2b" : "#555"}
            opacity={f.o}
            transform={`rotate(${f.i * 37} ${f.x} ${f.y})`}
          />
        ))}
        {t >= tc && starT < 1.6 ? (
          <g opacity={Math.min(1, 1.6 - starT)}>
            <ImpactStar x={hitAt.x} y={hitAt.y} r={(38 * w) / 640} seed="latifi" t={Math.min(1, starT)} />
          </g>
        ) : null}
      </g>
      <rect x={x} y={y} width={w} height={h} fill="none" stroke={INK} strokeWidth={8} />
    </g>
  );
};
