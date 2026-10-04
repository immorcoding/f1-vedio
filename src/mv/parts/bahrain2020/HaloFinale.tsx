// The last beat of shot 3.6 (bar 72, beat 1 to the cut to black on beat 4): the fire is out, and we cut to the burnt
// front of the car side-on — the survival cell charred black, the cockpit empty, and the halo scorched but whole: one
// central pillar in front of the cockpit and the hoop running back to its mounts beside the roll hoop (facts.md: the
// remains, halo intact, are on show at the F1 Exhibition in London; easter egg). Traced from the side-on photo
// "Grosjean's crash wreckage" (docs/assets/reference-register.md), in that photo's pixel space, nose left.
// Simple and clean (ART-11): the cell in three flat facets (ash-grey top deck, black side, the torn front bulkhead),
// a few torn edges, the halo's tube lighter than the cell so it reads as the subject, thin smoke rising, a slow push
// in on the halo. Overlaid on Escape by Scene.tsx.
import { INK, PAPER } from "../../../kit/colors";
import { FIRE_PALETTES, SmokeStreaks } from "../../../kit/fire";
import { ToneDefs, tone } from "../../../kit/tone";
import { cueFrame, ramp, type PictureProps } from "./common";
import { Vignette, heartbeat } from "./Wreck";

type P = [number, number];
const d = (pts: P[], close = true) =>
  `M ${pts.map(([x, y]) => `${x} ${y}`).join(" L ")}${close ? " Z" : ""}`;

// The cell's outline, photo px: the torn front bulkhead (left), the top line up to the cockpit, the rim, the stub
// behind the roll hoop (right, ragged where the car broke at the engine bulkhead), and the floor.
// prettier-ignore
const TUB: P[] = [
  [170, 585], [176, 540], [214, 520], [236, 498], [300, 462], [420, 412], [560, 382], [700, 360], [862, 347],
  [1250, 350], [1330, 332], [1470, 304], [1560, 293], [1680, 322], [1772, 372], [1800, 360], [1826, 410],
  [1848, 470], [1826, 540], [1842, 568], [1790, 648], [1724, 700], [1640, 730], [1560, 748], [1510, 726],
  [1420, 706], [1250, 690], [1050, 662], [850, 651], [600, 655], [400, 655], [250, 650], [196, 640], [176, 615],
];
// the top deck, down to the chine that runs along the cell's side (the ridge in the photo), dusted with ash and
// extinguisher powder
// prettier-ignore
const DECK: P[] = [
  [214, 520], [236, 498], [300, 462], [420, 412], [560, 382], [700, 360], [862, 347], [1250, 350], [1330, 332],
  [1470, 304], [1560, 293], [1680, 322], [1772, 372], [1760, 420], [1640, 402], [1480, 398], [1300, 420],
  [1100, 428], [900, 432], [700, 440], [520, 456], [380, 484], [262, 530],
];
// the front bulkhead, torn open where the nose came off
// prettier-ignore
const BULKHEAD: P[] = [[170, 585], [176, 540], [214, 520], [262, 530], [250, 590], [256, 645], [196, 640], [176, 615]];
// the cockpit opening under the halo (dark, empty)
// prettier-ignore
const COCKPIT: P[] = [[905, 345], [935, 318], [1010, 300], [1120, 296], [1215, 305], [1262, 330], [1250, 350]];
// the halo, near side: the central pillar rising and leaning back from the front of the cockpit, and the hoop over
// the cockpit back to its mounts beside the roll hoop
// prettier-ignore
const PILLAR: P[] = [[858, 356], [902, 312], [948, 270], [988, 234], [1016, 216], [1050, 264], [1006, 286], [966, 318], [932, 356]];
// prettier-ignore
const HOOP: P[] = [
  [1010, 222], [1058, 206], [1133, 203], [1233, 221], [1333, 240], [1420, 258], [1492, 276],
  [1494, 318], [1420, 306], [1330, 298], [1200, 282], [1100, 272], [1046, 268],
];
// the hoop's top line, for the one clean highlight left on it (it held)
// prettier-ignore
const HOOP_TOP: P[] = [[1034, 216], [1060, 210], [1133, 207], [1233, 225], [1333, 244], [1420, 262], [1480, 278]];
// the far half of the hoop, just showing above the near one
// prettier-ignore
const HOOP_FAR: P[] = [[1070, 204], [1140, 196], [1240, 210], [1340, 228], [1440, 248]];
// the roll hoop (an A-frame with its opening) behind the cockpit
// prettier-ignore
const ROLL: P[] = [[1468, 304], [1500, 190], [1528, 128], [1556, 118], [1590, 138], [1622, 250], [1642, 302]];
// prettier-ignore
const ROLL_HOLE: P[] = [[1522, 252], [1540, 172], [1566, 166], [1586, 252]];
// torn edges: the fewest strokes that say "burnt and broken" (ART-11)
// prettier-ignore
const TEARS: P[][] = [
  [[1772, 372], [1752, 430], [1780, 480], [1756, 540], [1790, 600]],
  [[1180, 450], [1240, 490], [1300, 540]],
  [[640, 470], [660, 560], [645, 650]],
];
// the side intake behind the cockpit (the round opening in the photo) and the hole torn in the cell's side
const ring = (cx: number, cy: number, rx: number, ry: number, n = 10): P[] =>
  Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    const jag = i % 3 === 0 ? 0.88 : 1;
    return [cx + Math.cos(a) * rx * jag, cy + Math.sin(a) * ry * jag];
  });
const OPENINGS: P[][] = [ring(1662, 362, 30, 40), ring(1205, 500, 44, 24, 9)];

// last embers on the cell, drawn as short glowing streaks drifting up (no dots)
const EMBERS = Array.from({ length: 9 }, (_, i) => ({
  x: 700 + ((i * 173) % 900),
  y: 330 + ((i * 61) % 60),
  speed: 0.6 + (i % 4) * 0.25,
  phase: (i * 37) % 90,
}));

// a grey dot screen (soot on black: the page's ink dots would not show)
const Dots: React.FC<{ id: string; r: number; gap: number; color: string }> = ({
  id,
  r,
  gap,
  color,
}) => (
  <pattern
    id={id}
    width={gap}
    height={gap}
    patternUnits="userSpaceOnUse"
    patternTransform="rotate(45)"
  >
    <circle cx={gap / 2} cy={gap / 2} r={r} fill={color} />
  </pattern>
);

const EDGE = "#7a7268"; // where the last light catches an edge

export const HaloFinale: React.FC<PictureProps> = ({ f, palette }) => {
  const from = cueFrame("bahrain2020.halo");
  const to = cueFrame("bahrain2020.black");
  const t = f - from;
  const u = ramp(f, from, to, (x) => x);
  const hb = heartbeat(f);
  // photo px → screen: the whole cell across the frame, pushing in slowly on the halo (the photo point at the
  // frame's centre slides from the middle of the cell toward the halo)
  const k = 0.94 + 0.16 * u;
  const cx = 1010 + (1110 - 1010) * u;
  const cy = 450 + (370 - 450) * u;
  const tx = 960 - cx * k;
  const ty = 560 - cy * k;
  const fire = FIRE_PALETTES[palette];
  return (
    <svg viewBox="0 0 1920 1080" width={1920} height={1080}>
      <defs>
        <ToneDefs prefix="b3h" />
        <Dots id="b3h-ash" r={2.2} gap={8} color="#8c8379" />
        <Dots id="b3h-char" r={1.8} gap={7} color="#2a221d" />
      </defs>
      <rect width={1920} height={1080} fill={INK} />
      <rect
        width={1920}
        height={1080}
        fill={tone("dark", "b3h")}
        opacity={0.3}
      />
      <g transform={`translate(${tx} ${ty}) scale(${k})`}>
        {/* the ground it sits on */}
        <ellipse cx={1010} cy={700} rx={880} ry={34} fill="#000" />
        {/* the cell: black side, ash-grey top deck, the torn bulkhead; one ink contour round it all */}
        <path
          d={d(TUB)}
          fill="#121110"
          stroke={INK}
          strokeWidth={14}
          strokeLinejoin="round"
        />
        <path d={d(DECK)} fill="#3b3631" />
        <path d={d(DECK)} fill="url(#b3h-ash)" opacity={0.6} />
        <path d={d(BULKHEAD)} fill="#26231f" />
        <path
          d={d(DECK.slice(13), false)}
          fill="none"
          stroke={INK}
          strokeWidth={5}
          strokeLinejoin="round"
        />
        <path
          d={d(TUB)}
          fill="none"
          stroke={EDGE}
          strokeWidth={2.5}
          strokeLinejoin="round"
        />
        {OPENINGS.map((o, i) => (
          <path
            key={i}
            d={d(o)}
            fill="#050505"
            stroke={EDGE}
            strokeWidth={2.5}
            strokeLinejoin="round"
          />
        ))}
        {TEARS.map((tr, i) => (
          <path
            key={i}
            d={d(tr, false)}
            fill="none"
            stroke={INK}
            strokeWidth={6}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
        <path
          d={d(COCKPIT)}
          fill="#050505"
          stroke={INK}
          strokeWidth={6}
          strokeLinejoin="round"
        />
        {/* roll hoop */}
        <path
          d={`${d(ROLL)} ${d(ROLL_HOLE)}`}
          fillRule="evenodd"
          fill="#2a2622"
          stroke={INK}
          strokeWidth={9}
          strokeLinejoin="round"
        />
        <path d={d(ROLL, false)} fill="none" stroke={EDGE} strokeWidth={2.5} />
        {/* the halo: far half of the hoop, then the near hoop and the central pillar — scorched, whole */}
        <path
          d={d(HOOP_FAR, false)}
          fill="none"
          stroke={INK}
          strokeWidth={14}
          strokeLinecap="round"
        />
        <path
          d={d(HOOP_FAR, false)}
          fill="none"
          stroke="#4a3f36"
          strokeWidth={6}
          strokeLinecap="round"
        />
        {[PILLAR, HOOP].map((h, i) => (
          <g key={i}>
            <path
              d={d(h)}
              fill="#5a4c41"
              stroke={INK}
              strokeWidth={9}
              strokeLinejoin="round"
            />
            <path d={d(h)} fill="url(#b3h-char)" />
          </g>
        ))}
        <path
          d={d(HOOP_TOP, false)}
          fill="none"
          stroke={PAPER}
          strokeWidth={4}
          strokeLinecap="round"
          opacity={0.9}
        />
        <path
          d="M 868 348 L 910 308 L 956 268 L 998 234"
          fill="none"
          stroke={PAPER}
          strokeWidth={3}
          strokeLinecap="round"
          opacity={0.7}
        />
        {/* last embers */}
        {EMBERS.map((e, i) => {
          const a = (t * e.speed + e.phase) % 90;
          const y = e.y - a * 1.4;
          const x = e.x + Math.sin(a * 0.1 + i) * 8;
          return (
            <path
              key={i}
              d={`M ${x} ${y + 9} L ${x} ${y}`}
              stroke="#ffb347"
              strokeWidth={3.5}
              strokeLinecap="round"
              opacity={0.9 * (1 - a / 90)}
            />
          );
        })}
        {/* thin smoke still rising off the cockpit and the hoop */}
        <g transform="translate(1150 300)">
          <SmokeStreaks
            w={700}
            top={0}
            frame={f}
            seed="halo-smoke"
            palette={fire}
            rise={520}
            count={6}
            wind={-0.25}
            opacity={0.8}
          />
        </g>
      </g>
      {/* it lands on the beat: a cut in from black */}
      <rect width={1920} height={1080} fill={INK} opacity={1 - ramp(t, 0, 4)} />
      <Vignette amount={0.4 + 0.3 * hb} />
    </svg>
  );
};
