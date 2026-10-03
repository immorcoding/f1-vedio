// The Ferrari garage at Interlagos as Massa crosses the line (shot 2.3, easter egg; facts.md): mechanics in team
// overalls and Massa's family spill out to the front of the garage and start celebrating — arms up, jumping, hugging.
// Black-and-white garage (ART-8): roller door, ceiling lights, tyre racks, monitors on the pit-wall side; the people are
// the shared jointed figures (src/kit/figure.tsx, ART-16), Ferrari red overalls.
import { INK, PAPER } from "../../kit/colors";
import { Figure, type BodyPose, type Outfit } from "../../kit/figure";
import { tone } from "../../kit/tone";

// Ferrari 2008 team kit: red overalls with a dark side band, black boots; heads seen from the back or side (no faces).
const MECHANIC: Outfit = {
  suit: "#d3171c",
  suitShade: "#9c1015",
  seam: "#5a0a0d",
  stripe: "#1c1c1e",
  gloves: "#1c1c1e",
  boots: "#141414",
  head: { kind: "hood", color: "#1c1c1e" },
};
// Family and guests in plain clothes (environment tones, ART-8).
const GUEST: Outfit = {
  suit: "#efeeea",
  suitShade: "#bdbcb8",
  seam: "#7a7a76",
  gloves: "#d8c4ae",
  boots: "#2a2a2a",
  head: { kind: "hood", color: "#2a2a2a" },
};
const GUEST_DARK: Outfit = {
  ...GUEST,
  suit: "#3a3a3e",
  suitShade: "#222225",
  seam: "#111",
};

// Arms thrown up, fists pumping, knees giving: one cheer. `a` 0–1 is how far up the arms are (straight up at 1),
// `pump` 0–1 bends the elbows as the fists punch, `k` the knee bend.
const cheer = (a: number, pump: number, k: number, lean = -6): BodyPose => ({
  lean,
  head: -12 * a,
  near: {
    leg: { thigh: 10 + 16 * k, knee: 24 * k, foot: 0 },
    arm: { shoulder: 20 + 155 * a, elbow: 15 + 70 * pump * a },
  },
  far: {
    leg: { thigh: -8 + 12 * k, knee: 18 * k, foot: 0 },
    arm: { shoulder: 15 + 165 * a, elbow: 10 + 55 * (1 - pump) * a },
  },
});

type Person = {
  x: number;
  outfit: Outfit;
  facing: "left" | "right";
  phase: number;
  joy: number;
};

// Two groups spilling forward, overlapping, at different distances (scale).
const PEOPLE: (Person & { scale: number })[] = [
  {
    x: 330,
    outfit: MECHANIC,
    facing: "right",
    phase: 0.1,
    joy: 1,
    scale: 0.86,
  },
  { x: 470, outfit: GUEST, facing: "left", phase: 0.55, joy: 0.85, scale: 0.9 },
  { x: 590, outfit: MECHANIC, facing: "right", phase: 0.3, joy: 1, scale: 1.0 },
  {
    x: 1080,
    outfit: GUEST_DARK,
    facing: "right",
    phase: 0.8,
    joy: 0.75,
    scale: 0.88,
  },
  {
    x: 1220,
    outfit: MECHANIC,
    facing: "left",
    phase: 0.05,
    joy: 1,
    scale: 1.04,
  },
  {
    x: 1370,
    outfit: MECHANIC,
    facing: "right",
    phase: 0.65,
    joy: 0.95,
    scale: 0.92,
  },
  { x: 1530, outfit: GUEST, facing: "left", phase: 0.4, joy: 0.8, scale: 1.0 },
];

// The garage panel, laid out for a 1920×1080 frame. `t` seconds; `joy` 0–1 builds the celebration.
export const Garage: React.FC<{ t: number; joy: number }> = ({ t, joy }) => {
  const floor = 960;
  const ppm = 300;
  return (
    <g>
      {/* back wall, ceiling and lights */}
      <rect x={0} y={0} width={1920} height={floor} fill={tone("light")} />
      <rect x={0} y={0} width={1920} height={150} fill={tone("dark")} />
      {Array.from({ length: 6 }, (_, i) => (
        <g key={i}>
          <rect
            x={120 + i * 300}
            y={150}
            width={180}
            height={18}
            fill={PAPER}
            stroke={INK}
            strokeWidth={3}
          />
          <path
            d={`M ${120 + i * 300} 168 L ${60 + i * 300} 520 L ${360 + i * 300} 520 L ${300 + i * 300} 168 Z`}
            fill={PAPER}
            opacity={0.35}
          />
        </g>
      ))}
      {/* tyre racks on the back wall, monitors on a gantry */}
      {Array.from({ length: 4 }, (_, i) =>
        Array.from({ length: 3 }, (_, k) => (
          <g key={`${i}-${k}`}>
            <rect
              x={80 + i * 120}
              y={360 + k * 130}
              width={100}
              height={120}
              rx={30}
              fill={INK}
            />
            <rect
              x={100 + i * 120}
              y={380 + k * 130}
              width={60}
              height={80}
              rx={14}
              fill={tone("dark")}
            />
          </g>
        )),
      )}
      {Array.from({ length: 4 }, (_, i) => (
        <g key={`m${i}`}>
          <rect
            x={1100 + i * 190}
            y={260}
            width={160}
            height={110}
            fill={INK}
            stroke={INK}
            strokeWidth={4}
          />
          <rect
            x={1112 + i * 190}
            y={272}
            width={136}
            height={86}
            fill={tone("mid")}
          />
          <path
            d={`M ${1180 + i * 190} 370 L ${1180 + i * 190} 420`}
            stroke={INK}
            strokeWidth={6}
          />
        </g>
      ))}
      <path d={`M 1060 420 L 1880 420`} stroke={INK} strokeWidth={8} />
      {/* the open roller door's edge and the floor */}
      <rect x={0} y={floor} width={1920} height={120} fill={tone("mid")} />
      <path d={`M 0 ${floor} L 1920 ${floor}`} stroke={INK} strokeWidth={5} />
      {/* people: everyone jumps on their own beat; nearer people (bigger) stand lower */}
      {[...PEOPLE]
        .sort((p, q) => p.scale - q.scale)
        .map((p, i) => {
          const j = joy * p.joy;
          const beat = (t * 2.13 + p.phase) % 1; // 128 BPM: about one jump a beat
          const up = Math.sin(beat * Math.PI);
          const hop = up * 0.2 * j;
          const pose = cheer(j * (0.85 + 0.15 * up), up, (1 - up) * j);
          const ground = floor - 60 + (80 * (p.scale - 0.86)) / 0.18;
          return (
            <Figure
              key={i}
              at={{ x: p.x, y: ground - hop * ppm * p.scale }}
              pxPerMetre={ppm * p.scale}
              pose={pose}
              outfit={p.outfit}
              facing={p.facing}
            />
          );
        })}
    </g>
  );
};
