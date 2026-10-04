// The Ferrari garage at Interlagos as Massa crosses the line (shot 2.3, easter egg; facts.md): mechanics in team
// overalls and Massa's family watch the screens — arms folded, a hand on the head — then erupt on the beat: fists up,
// a fist pump on every beat, a jump every two beats, a head thrown back, and two of them turning round to high-five
// and then cheer face to face with both fists up. Black-and-white garage (ART-8): roller door, ceiling lights, tyre racks, a TV on the tyre-rack side and
// monitors on the pit-wall side; the people are the shared people module (src/kit/figure.tsx, ART-16), Ferrari red
// overalls and the family in street clothes.
import { INK, PAPER } from "../../kit/colors";
import {
  FERRARI_MECHANIC,
  Figure,
  HIGH_FIVE_AT,
  armsFolded,
  armsUp,
  crowdOutfit,
  fistPump,
  handOnHead,
  headBack,
  highFive,
  jump,
  mixPose,
  type Outfit,
  type Pose,
} from "../../kit/figure";
import { tone } from "../../kit/tone";

// Massa's family and guests in street clothes (a Ferrari-red shirt, a light shirt).
const FAMILY_RED: Outfit = crowdOutfit("#d4201d", {
  trousers: "#2f3640",
  hair: "#2a2420",
});
const FAMILY_LIGHT: Outfit = crowdOutfit("#eceae4", {
  trousers: "#4d5360",
  hair: "#5a3e28",
  sleeves: "long",
});

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const smooth = (x: number) => {
  const u = clamp01(x);
  return u * u * (3 - 2 * u);
};

// One person: where they stand (px in the 1920 frame), how near (scale), what they watch, and how they celebrate.
// `react(b, t)` gives the pose `b` beats after the eruption (t = seconds in the shot, for idling).
type Person = {
  x: number;
  scale: number;
  outfit: Outfit;
  watch: "left" | "right"; // the TV on the left or the monitors on the right
  idle: (t: number) => Pose;
  react: (b: number, t: number) => Pose;
};

// Six people about 0.9 m apart along the front of the garage, so raised arms and jumps never reach anyone (ART-18:
// the jumper is at the end of the line, where the arms swinging forward on landing meet nobody);
// the pair in the middle stand back to back watching opposite screens, then turn to each other.
const PAIR_A = 840;
const PAIR_B = 1100;
const PEOPLE: Person[] = [
  {
    x: 600,
    scale: 0.93,
    outfit: FERRARI_MECHANIC,
    watch: "left",
    idle: (t) => armsFolded({ t, head: -10 }),
    react: (b) => fistPump(b),
  },
  {
    x: 335,
    scale: 0.96,
    outfit: FAMILY_RED,
    watch: "left",
    idle: (t) => handOnHead({ t: t + 2, head: -10 }),
    react: (b) => jump((b / 2) % 1),
  },
  {
    x: 1380,
    scale: 0.97,
    outfit: FAMILY_LIGHT,
    watch: "right",
    idle: (t) => handOnHead({ t: t + 1, head: -10 }),
    react: (_b, t) => headBack(t),
  },
  {
    x: 1640,
    scale: 0.94,
    outfit: FERRARI_MECHANIC,
    watch: "right",
    idle: (t) => armsFolded({ t: t + 3, head: -10 }),
    react: (b) => armsUp(b),
  },
];

// The pair: turn round on the eruption, slap hands on the next beat, then both fists up face to face. (No hug: two
// side-view figures hugging cannot be layered convincingly; the user allowed dropping it.)
const TURN = 0.25; // beats after the eruption
const FIVE_LEN = 1.5; // the high five runs over 1.5 beats with the slap (HIGH_FIVE_AT) on beat 1 after the eruption
const FIVE_FROM = 1 - HIGH_FIVE_AT * FIVE_LEN;
const CHEER_FROM = 2.0;
const CHEER_IN = 0.5; // beats to blend from the high five into the cheer
const pairGap = (PAIR_B - PAIR_A) / 300; // m between their ground points at 300 px/m
const pairPose = (b: number, t: number, phase: number): Pose => {
  if (b < FIVE_FROM) return armsFolded({ t: t + phase, head: -10 });
  const five = highFive(clamp01((b - FIVE_FROM) / FIVE_LEN), pairGap);
  if (b < CHEER_FROM) return five;
  return mixPose(five, armsUp(b + phase), smooth((b - CHEER_FROM) / CHEER_IN));
};

// The garage panel, laid out for a 1920×1080 frame. `t` seconds into the shot, `beat` beats into it (timing.ts),
// `erupt` the beat the celebration starts on.
export const Garage: React.FC<{ t: number; beat: number; erupt: number }> = ({
  t,
  beat,
  erupt,
}) => {
  const floor = 960;
  const ppm = 300;
  const b = beat - erupt; // beats since the eruption (negative while they watch)
  // a quarter beat to go from watching into the celebration
  const into = smooth((b + 0.05) / 0.3);
  const ground = (scale: number) => floor - 30 + (60 * (scale - 0.92)) / 0.08;
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
      {/* the TV on the tyre-rack side, hung from the ceiling */}
      <path d="M 270 150 L 270 196" stroke={INK} strokeWidth={6} />
      <rect x={150} y={196} width={240} height={140} fill={INK} />
      <rect x={164} y={210} width={212} height={112} fill={tone("mid")} />
      {/* people, farther (smaller) first; nearer people stand lower */}
      {[...PEOPLE]
        .sort((p, q) => p.scale - q.scale)
        .map((p, i) => {
          const s = ppm * p.scale;
          const pose =
            b < -0.05
              ? p.idle(t)
              : mixPose(p.idle(t), p.react(Math.max(0, b), t), into);
          return (
            <Figure
              key={i}
              at={{ x: p.x, y: ground(p.scale) }}
              pxPerMetre={s}
              pose={pose}
              outfit={p.outfit}
              facing={p.watch}
            />
          );
        })}
      {(() => {
        // the pair, back to back until they turn, then facing each other
        const turned = b >= TURN;
        const y = ground(1);
        return (
          <g>
            <Figure
              key="a"
              at={{ x: PAIR_A, y }}
              pxPerMetre={ppm}
              pose={pairPose(b, t, 0)}
              outfit={FERRARI_MECHANIC}
              facing={turned ? "right" : "left"}
            />
            <Figure
              key="b"
              at={{ x: PAIR_B, y }}
              pxPerMetre={ppm}
              pose={pairPose(b, t, 0.4)}
              outfit={FERRARI_MECHANIC}
              facing={turned ? "left" : "right"}
            />
          </g>
        );
      })()}
    </g>
  );
};
