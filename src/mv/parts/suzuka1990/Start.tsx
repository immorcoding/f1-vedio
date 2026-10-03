// Shot 1.6 (bars 23–26): the start and the run to Turn 1 from straight above (MOT-2), lap 1, at true car size
// (ART-18). The front of the grid: SEN on pole on the right, where the grid lane is dusty and gritty (the dotted
// screen — the easter egg, STO-7, facts.md), PRO second on the left, on the dark rubbered racing line; MAN and BER
// behind. Lights out on 23.3; PRO's better launch from the clean side puts him ahead, the camera runs with the
// leaders down the straight (pit wall and pit exit on the right) and opens onto Turn 1, where PRO turns in from the
// left and SEN keeps the inside — his front wheel level with PRO's rear wheel at the cut (27.1, the crash in 1.7).
import { Easing, random } from "remotion";
import {
  F641_MAN,
  F641_PRO,
  MangaCar,
  MP4_5B_BER,
  MP4_5B_SEN,
  topAnchorAt,
  type CarSpec,
} from "../../../cars";
import { INK, PAPER } from "../../../kit/colors";
import { InkFilterDef, inkFilter } from "../../../kit/ink";
import { Caption } from "../../../kit/lettering";
import { speedLines } from "../../../kit/lines";
import { ToneDefs, tone } from "../../../kit/tone";
import {
  mapView,
  poseAt,
  samplePath,
  SUZUKA_1989,
  TrackSection,
  type MapView,
} from "../../../tracks";
import { ramp, shotById, type PictureProps } from "./common";
import {
  cars16,
  LANE,
  POLE,
  pose16,
  SLOT,
  START_FRAME,
  type CarId,
} from "./staging";

const T = SUZUKA_1989;
const HALF = T.width / 2;
const CARS: Record<CarId, CarSpec> = {
  SEN: MP4_5B_SEN,
  PRO: F641_PRO,
  MAN: F641_MAN,
  BER: MP4_5B_BER,
};
// grid slots: centre of each car's wheelbase on the grid, 8 m apart, staggered (race.ts)
const SLOTS = Array.from({ length: 8 }, (_, k) => ({
  s: POLE - SLOT * k,
  lat: k % 2 ? -LANE : LANE,
}));
// the screen turned so the main straight runs left to right
const ROTATION = -poseAt(T, 100).heading;
// Turn 1's gravel trap on the outside (left) of the corner
const GRAVEL = { from: 330, to: 560, depth: 42 };

const band = (
  view: MapView,
  s0: number,
  s1: number,
  a: number | ((s: number) => number),
  b: number | ((s: number) => number),
) => view.band(samplePath(T, s0, s1, a, 1.5), samplePath(T, s0, s1, b, 1.5));

// Grit on the dirty side of the grid: ink specks and paper flecks across the right lane, in map space.
const grit = (view: MapView) => {
  const ink: string[] = [];
  const paper: string[] = [];
  const r = Math.max(1.4, 0.09 * view.pxPerMetre);
  for (let i = 0; i < 900; i++) {
    const q = (k: string) => random(`grit-${k}-${i}`);
    const s = -90 + 190 * q("s");
    // denser toward the edge, thinning out toward the centre line
    const lat = 0.4 + (HALF - 0.6) * Math.sqrt(q("l"));
    const p = view.project(poseAt(T, s, lat));
    if (p.x < -20 || p.x > 1940 || p.y < -20 || p.y > 1100) continue;
    const d = `M ${(p.x - r).toFixed(1)} ${p.y.toFixed(1)} a ${r} ${r} 0 1 0 ${2 * r} 0 a ${r} ${r} 0 1 0 ${-2 * r} 0`;
    (q("c") < 0.6 ? ink : paper).push(d);
  }
  return { ink: ink.join(" "), paper: paper.join(" ") };
};

// Gravel in the Turn 1 trap: a coarse stipple of small stones.
const gravel = (view: MapView) => {
  const out: string[] = [];
  const r = Math.max(1.2, 0.07 * view.pxPerMetre);
  for (let i = 0; i < 1400; i++) {
    const q = (k: string) => random(`gravel-${k}-${i}`);
    const s = GRAVEL.from + (GRAVEL.to - GRAVEL.from) * q("s");
    const lat = -(HALF + 3 + (GRAVEL.depth - 4) * q("l"));
    const p = view.project(poseAt(T, s, lat));
    if (p.x < -20 || p.x > 1940 || p.y < -20 || p.y > 1100) continue;
    out.push(
      `M ${(p.x - r).toFixed(1)} ${p.y.toFixed(1)} a ${r} ${r} 0 1 0 ${2 * r} 0 a ${r} ${r} 0 1 0 ${-2 * r} 0`,
    );
  }
  return out.join(" ");
};

export const Start: React.FC<PictureProps> = ({ f }) => {
  const shot = shotById("1.6");
  const t = f - shot.from;
  const tau = (f - START_FRAME) / 60;
  const cars = cars16(f);
  const sen = cars.find((c) => c.id === "SEN")!;
  const pro = cars.find((c) => c.id === "PRO")!;
  // camera: on the front row at the start, running ahead of the leaders down the straight, opening onto Turn 1
  const look =
    2 +
    7 * ramp(tau, 0.3, 3, Easing.inOut(Easing.quad)) -
    3 * ramp(tau, 4.6, 6.6);
  const sMid = (sen.s + pro.s) / 2 + look;
  const centre = poseAt(T, sMid, 0.5);
  const ppm =
    36 +
    4 * ramp(t, 0, 50) -
    9 * ramp(tau, 0.2, 2.6, Easing.inOut(Easing.quad)) +
    6 * ramp(tau, 4.4, 6.6);
  // the camera swings a few degrees as it runs with the cars, and settles square to the corner at the end
  const swing =
    -7 * ramp(tau, 0.4, 2.4, Easing.inOut(Easing.quad)) +
    11 * ramp(tau, 2.4, 5.2, Easing.inOut(Easing.quad)) -
    4 * ramp(tau, 5.2, 6.6);
  const view = mapView({
    centre,
    rotation: ROTATION + swing,
    pxPerMetre: ppm,
    screen: { x: 900, y: 540 },
  });
  const g = grit(view);
  const caption = ramp(t, 10, 26, Easing.out(Easing.back(1.5)));
  const tags = 1 - ramp(tau, 3.8, 4.6);
  // the dirty-side note: in during the grid hold, out soon after the start
  const note = ramp(t, 12, 26) * (1 - ramp(tau, 0.9, 1.4));
  // the drawn lines into Turn 1 grow ahead of the two cars over the last two seconds
  const lines = ramp(tau, 4.4, 5.8, Easing.out(Easing.quad));
  const pitWall = samplePath(T, -400, 215, 8.2, 2);
  return (
    <svg viewBox="0 0 1920 1080" width={1920} height={1080}>
      <defs>
        <ToneDefs />
        <InkFilterDef />
      </defs>
      <rect width={1920} height={1080} fill={PAPER} />
      <g filter={inkFilter()}>
        <TrackSection
          track={T}
          view={view}
          from={-420}
          to={720}
          runoff={(s, side) =>
            side === "left"
              ? s > GRAVEL.from - 30 && s < GRAVEL.to + 30
                ? GRAVEL.depth
                : 10
              : 5
          }
          barrier
          tyreMarks
          grass={{ x: 0, y: 0, w: 1920, h: 1080 }}
        />
        {/* Turn 1 gravel trap */}
        <path
          d={band(
            view,
            GRAVEL.from,
            GRAVEL.to,
            -(HALF + 2.5),
            -(HALF + GRAVEL.depth - 1),
          )}
          fill={PAPER}
          stroke={INK}
          strokeWidth={2}
        />
        <path d={gravel(view)} fill={INK} opacity={0.6} />
        {/* main grandstand beyond the left run-off: rows of seats under a roof */}
        <path
          d={band(view, -300, 160, -19, -33)}
          fill={tone("mid")}
          stroke={INK}
          strokeWidth={2.5}
        />
        {Array.from({ length: 9 }, (_, i) => (
          <path
            key={`row-${i}`}
            d={view.path(samplePath(T, -300, 160, -20.5 - 1.5 * i, 3))}
            fill="none"
            stroke={INK}
            strokeWidth={Math.max(1.5, 0.12 * ppm)}
          />
        ))}
        <path
          d={band(view, -300, 160, -29, -36)}
          fill={PAPER}
          stroke={INK}
          strokeWidth={3}
        />
        {/* pit garages beyond the pit lane: a dark block of doors under a white roof edge */}
        <path
          d={band(view, -420, 190, 18.5, 32)}
          fill={tone("dark")}
          stroke={INK}
          strokeWidth={2.5}
        />
        {Array.from({ length: 51 }, (_, i) => -420 + 12 * i).map((s0) => {
          const a = view.project(poseAt(T, s0, 18.5));
          const b = view.project(poseAt(T, s0, 24));
          return (
            <path
              key={`door-${s0}`}
              d={`M ${a.x} ${a.y} L ${b.x} ${b.y}`}
              stroke={PAPER}
              strokeWidth={Math.max(2, 0.15 * ppm)}
            />
          );
        })}
        <path
          d={band(view, -420, 190, 24, 32)}
          fill={PAPER}
          stroke={INK}
          strokeWidth={3}
        />
        {/* pit lane and pit wall on the right of the straight; the pit exit joins after the Turn 1 entry */}
        <path
          d={band(view, -420, 215, 9, 17)}
          fill={tone("mid")}
          stroke={INK}
          strokeWidth={2}
        />
        <path
          d={band(
            view,
            215,
            345,
            (s) => 9 - 2.2 * ((s - 215) / 130),
            (s) => 17 - 9.6 * ((s - 215) / 130),
          )}
          fill={tone("mid")}
          stroke={INK}
          strokeWidth={2}
        />
        <path
          d={view.path(pitWall)}
          fill="none"
          stroke={INK}
          strokeWidth={Math.max(4, 0.6 * ppm)}
          strokeLinecap="round"
        />
        {/* white panels along the pit wall, a dashed line down the pit lane and seams across the asphalt: fixed marks
            that stream past as the camera runs with the cars (MOT-5) */}
        {Array.from({ length: 105 }, (_, i) => -420 + 6 * i).map((s0) => {
          const a = view.project(poseAt(T, s0, 8.2));
          const b = view.project(poseAt(T, s0 + 3, 8.2));
          const c = view.project(poseAt(T, s0, 13));
          const d = view.project(poseAt(T, s0 + 2.5, 13));
          return (
            <g key={`wall-${s0}`}>
              <path
                d={`M ${a.x} ${a.y} L ${b.x} ${b.y}`}
                stroke={PAPER}
                strokeWidth={Math.max(2, 0.3 * ppm)}
              />
              {s0 < 210 ? (
                <path
                  d={`M ${c.x} ${c.y} L ${d.x} ${d.y}`}
                  stroke={PAPER}
                  strokeWidth={Math.max(2, 0.15 * ppm)}
                />
              ) : null}
            </g>
          );
        })}
        {Array.from({ length: 46 }, (_, i) => -420 + 25 * i).map((s0) => (
          <path
            key={`seam-${s0}`}
            d={view.path(
              samplePath(T, s0, s0 + 0.01, -HALF, 1).concat(
                samplePath(T, s0, s0 + 0.01, HALF, 1),
              ),
            )}
            stroke={INK}
            strokeWidth={Math.max(1.2, 0.06 * ppm)}
            opacity={0.35}
          />
        ))}
        {/* the pit-exit line along the right edge, which the cars were told not to cross */}
        <path
          d={view.path(samplePath(T, 200, 345, HALF - 0.25, 2))}
          fill="none"
          stroke={PAPER}
          strokeWidth={Math.max(3, 0.35 * ppm)}
        />
        {/* the clean side: the rubbered racing line down the left lane into Turn 1 */}
        <path
          d={band(view, -120, 330, -LANE - 1.5, -LANE + 1.6)}
          fill={tone("dark")}
          opacity={0.55}
        />
        <path
          d={band(
            view,
            330,
            420,
            (s) => -LANE - 1.5 + 4 * ((s - 330) / 90),
            (s) => -LANE + 1.6 + 4 * ((s - 330) / 90),
          )}
          fill={tone("dark")}
          opacity={0.45}
        />
        {/* the dirty side: dust and grit on the right lane, where the pole slot is */}
        <path
          d={band(view, -90, 100, 0.3, HALF - 0.4)}
          fill={tone("light")}
          opacity={0.75}
        />
        <path d={g.ink} fill={INK} opacity={0.75} />
        <path d={g.paper} fill={PAPER} />
        {/* start line and grid slots */}
        <path
          d={band(view, -0.6, 0.6, -HALF, HALF)}
          fill={PAPER}
          stroke={INK}
          strokeWidth={2}
        />
        {SLOTS.map((sl) => {
          // the slot line ahead of the car's front wheels, across its lane, with short side ticks
          const front = sl.s + 2.6;
          const a = view.project(poseAt(T, front, sl.lat - 1.9));
          const b = view.project(poseAt(T, front, sl.lat + 1.9));
          const ta = view.project(poseAt(T, front - 1.6, sl.lat - 1.9));
          const tb = view.project(poseAt(T, front - 1.6, sl.lat + 1.9));
          return (
            <path
              key={sl.s}
              d={`M ${ta.x} ${ta.y} L ${a.x} ${a.y} L ${b.x} ${b.y} L ${tb.x} ${tb.y}`}
              fill="none"
              stroke={PAPER}
              strokeWidth={Math.max(3, 0.22 * ppm)}
              strokeLinejoin="round"
            />
          );
        })}
        {/* countdown boards on the left verge before Turn 1: three, two and one bars */}
        {[3, 2, 1].map((n) => {
          const sB = T.corners.turn1TurnIn - 100 * n;
          const a = view.project(poseAt(T, sB, -(HALF + 4)));
          const h = view.heading(poseAt(T, sB).heading);
          const w = 1.6 * ppm;
          const len = 0.5 * ppm;
          return (
            <g
              key={`board-${n}`}
              transform={`translate(${a.x} ${a.y}) rotate(${h})`}
            >
              <rect
                x={-len / 2}
                y={-w / 2}
                width={len}
                height={w}
                fill={PAPER}
                stroke={INK}
                strokeWidth={3}
              />
              {Array.from({ length: n }, (_, k) => (
                <rect
                  key={k}
                  x={-len / 2}
                  y={-w / 2 + ((k + 0.5) * w) / (n + 0.5) - w / (4 * (n + 0.5))}
                  width={len}
                  height={w / (2 * (n + 0.5))}
                  fill={INK}
                />
              ))}
            </g>
          );
        })}
        {/* manga speed streaks over the whole ground while the cars are flat out */}
        <path
          d={speedLines({
            x: -100,
            y: 0,
            w: 2120,
            h: 1080,
            n: 46,
            seed: `bg16-${Math.floor(t / 2)}`,
            thickness: 3,
            length: [0.15, 0.45],
          })}
          fill={INK}
          opacity={0.32 * ramp(tau, 0.8, 1.8) * (1 - ramp(tau, 5.2, 6.4))}
        />
        {/* the two lines into Turn 1: PRO turning in from the left, SEN holding the inside — they cross */}
        {lines > 0
          ? (["PRO", "SEN"] as const).map((id) => {
              const c = cars.find((x) => x.id === id)!;
              const pts = samplePath(
                T,
                c.s + 3,
                c.s + 3 + (id === "PRO" ? 55 : 75) * lines,
                (sv) =>
                  id === "PRO"
                    ? Math.min(
                        c.lat +
                          Math.pow(Math.max(0, sv - c.s - 3) / 22, 1.6) * 4,
                        6,
                      )
                    : Math.min(c.lat + 0.004 * (sv - c.s), 5),
              );
              const end = view.project(pts[pts.length - 1]);
              const prev = view.project(pts[Math.max(0, pts.length - 4)]);
              const ah = Math.atan2(end.y - prev.y, end.x - prev.x);
              return (
                <g key={`line-${id}`}>
                  <path
                    d={view.path(pts)}
                    fill="none"
                    stroke={PAPER}
                    strokeWidth={20}
                    strokeLinecap="round"
                    strokeDasharray="30 14"
                  />
                  <path
                    d={view.path(pts)}
                    fill="none"
                    stroke={INK}
                    strokeWidth={10}
                    strokeLinecap="round"
                    strokeDasharray="30 14"
                  />
                  <path
                    d={`M ${end.x + Math.cos(ah) * 34} ${end.y + Math.sin(ah) * 34} L ${end.x + Math.cos(ah + 2.4) * 28} ${end.y + Math.sin(ah + 2.4) * 28} L ${end.x + Math.cos(ah - 2.4) * 28} ${end.y + Math.sin(ah - 2.4) * 28} Z`}
                    fill={INK}
                    stroke={PAPER}
                    strokeWidth={4}
                  />
                </g>
              );
            })
          : null}
        {/* wheelspin smoke left on the grid at the launch: it stays where it was made as the cars pull away */}
        {cars.flatMap((c) =>
          Array.from({ length: 12 }, (_, i) => START_FRAME + 4 * i)
            .filter((k) => k <= f)
            .flatMap((k) => {
              const at = cars16(k).find((x) => x.id === c.id)!;
              const age = (f - k) / 60;
              const life = 1 - Math.min(1, age / 1.6);
              if (life <= 0) return [];
              return [-0.85, 0.85].map((side) => {
                const q = random(`spin-${c.id}-${k}-${side}`);
                const p = view.project(
                  poseAt(T, at.s - 1.9 - 0.6 * q, at.lat + side),
                );
                const r = (0.35 + 0.9 * age) * ppm * (0.8 + 0.4 * q);
                return (
                  <circle
                    key={`spin-${c.id}-${k}-${side}`}
                    cx={p.x}
                    cy={p.y}
                    r={r}
                    fill={PAPER}
                    stroke={INK}
                    strokeWidth={2}
                    opacity={0.85 * life}
                  />
                );
              });
            }),
        )}
        {/* contact shadows under the cars */}
        {cars.map((c) => {
          const pose = pose16(f, c);
          const p = view.project(pose);
          const h = view.heading(pose.heading);
          return (
            <rect
              key={`sh-${c.id}`}
              x={-2.1 * ppm}
              y={-0.8 * ppm}
              width={4.2 * ppm}
              height={1.6 * ppm}
              rx={0.5 * ppm}
              fill={INK}
              opacity={0.28}
              transform={`translate(${p.x + 0.25 * ppm} ${p.y + 0.3 * ppm}) rotate(${h})`}
            />
          );
        })}
        {/* speed lines, then the cars, back to front */}
        {cars.map((c) => {
          const pose = pose16(f, c);
          const p = view.project(pose);
          const h = view.heading(pose.heading);
          const speed = Math.min(1, ramp(tau, 0.3, 2));
          return speed > 0 ? (
            <g
              key={`sl-${c.id}`}
              transform={`translate(${p.x} ${p.y}) rotate(${h})`}
            >
              <path
                d={speedLines({
                  x: -9 * ppm,
                  y: -1.0 * ppm,
                  w: 6.5 * ppm,
                  h: 2.0 * ppm,
                  n: 9,
                  seed: `${c.id}-${Math.floor(t / 4)}`,
                  thickness: 5,
                  length: [0.4, 1],
                })}
                fill={INK}
                opacity={0.7 * speed}
              />
            </g>
          ) : null;
        })}
        {cars.map((c) => {
          const pose = pose16(f, c);
          const p = view.project(pose);
          const heading = view.heading(pose.heading);
          const car = CARS[c.id];
          return (
            <MangaCar
              key={c.id}
              car={car}
              view="top"
              at={topAnchorAt(
                car,
                { x: p.x, y: p.y, pxPerMetre: ppm },
                heading,
              )}
              state={{
                heading,
                steer: c.id === "PRO" ? 6 * ramp(tau, 4.6, 6) : 0,
              }}
            />
          );
        })}
        {/* the easter egg in words, once, while the grid stands: the pole slot is on the dirty side */}
        {note > 0
          ? (() => {
              const p = view.project(poseAt(T, POLE + 9, HALF + 1));
              return (
                <g opacity={note}>
                  <path
                    d={`M ${p.x} ${p.y + 70} L ${p.x - 40} ${p.y + 6}`}
                    stroke={INK}
                    strokeWidth={5}
                    strokeLinecap="round"
                  />
                  <Caption
                    x={p.x - 20}
                    y={p.y + 70}
                    w={410}
                    h={84}
                    lines={["杆位在较脏的一侧"]}
                    size={44}
                  />
                </g>
              );
            })()
          : null}
        {/* SEN and PRO tags: SEN's below his car (his right), PRO's above */}
        {tags > 0
          ? (["SEN", "PRO"] as const).map((id) => {
              const c = cars.find((x) => x.id === id)!;
              const p = view.project(
                poseAt(T, c.s, c.lat + (id === "SEN" ? 3.4 : -3.4)),
              );
              const dy = id === "SEN" ? 38 : -38;
              return (
                <g key={`tag-${id}`} opacity={tags * ramp(t, 4, 16)}>
                  <rect
                    x={p.x - 52}
                    y={p.y + dy - 23}
                    width={104}
                    height={46}
                    fill={id === "SEN" ? INK : PAPER}
                    stroke={INK}
                    strokeWidth={4}
                  />
                  <text
                    x={p.x}
                    y={p.y + dy + 11}
                    textAnchor="middle"
                    fontFamily="Arial Black, Arial, sans-serif"
                    fontWeight={900}
                    fontStyle="italic"
                    fontSize={30}
                    fill={id === "SEN" ? PAPER : INK}
                  >
                    {id}
                  </text>
                </g>
              );
            })
          : null}
        <g
          opacity={caption}
          transform={`translate(${1500 + 20 * (1 - caption)} 70)`}
        >
          <Caption
            x={0}
            y={0}
            w={300}
            h={110}
            lines={[...shot.text]}
            size={56}
          />
        </g>
        <rect
          x={0}
          y={0}
          width={1920}
          height={1080}
          fill="none"
          stroke={INK}
          strokeWidth={18}
        />
      </g>
    </svg>
  );
};
