// Shot 2.4 (bars 43–46): the last corners from above (MOT-2), in the rain, at true speed (MOT-5): down Mergulho to
// Junção the track streams under a camera riding with the group. GLO, still on dry grooved tyres, fishtails on the
// outside line, far off the pace; VET, on intermediates, dives down the inside and past him (the tags swap 4 and 5);
// then HAM closes in and, in slow motion, draws alongside GLO on the inside as the shot cuts (the pass completes on
// 47.1 in shot 2.5). Each tag carries the race position, so the stakes read: HAM is 6th and needs 5th. Easter egg: two insets
// zoom in on the tyres from above — GLO's dry tread with its four grooves ("干地胎"), HAM's intermediate with cut
// sipes. Facts: docs/production/facts.md (2008 巴西).
import {
  carPoint,
  MangaCar,
  MP4_23,
  STR3,
  TF108,
  topAnchorAt,
  type CarSpec,
} from "../../../cars";
import { INK, PAPER } from "../../../kit/colors";
import { inkFilter } from "../../../kit/ink";
import { BRUSH_FONT } from "../../../kit/lettering";
import { Rain } from "../../../kit/rain";
import { tone } from "../../../kit/tone";
import {
  curvatureAt,
  INTERLAGOS_2008,
  mapView,
  poseAt,
  TrackSection,
} from "../../../tracks";
import { ramp, type ShotTime } from "../abuDhabi2021/shotClock";
import { focusLines, speedLines } from "../../../kit/lines";
import { Page } from "./common";
import { juncaoPlan, raceTime, slowMo } from "./juncao-plan";

const T = INTERLAGOS_2008;
const S = T.corners;
const PANEL = { x: 40, y: 40, w: 1840, h: 700 };
const DRY_BOX = { x: 40, y: 770, w: 905, h: 270 };
const WET_BOX = { x: 975, y: 770, w: 905, h: 270 };

// The cars' positions come from the choreography in juncao-plan.ts (checked frame by frame for overlap, ART-18);
// each is drawn at its true size on a map scaled so it reads (about 24 px per metre).
const CARS = { GLO: TF108, VET: STR3, HAM: MP4_23 } as const;
const TREAD = { GLO: "dry", VET: "wet", HAM: "wet" } as const;

// Lettered driver tag beside a car: race position and three-letter code (STO-5). HAM's is the one that matters.
const Tag: React.FC<{ x: number; y: number; code: string; pos: number }> = ({
  x,
  y,
  code,
  pos,
}) => (
  <g transform={`translate(${x} ${y})`}>
    <rect
      x={-74}
      y={-26}
      width={148}
      height={46}
      fill={PAPER}
      stroke={INK}
      strokeWidth={code === "HAM" ? 7 : 4}
    />
    <rect x={-74} y={-26} width={46} height={46} fill={INK} />
    <text
      x={-51}
      y={10}
      textAnchor="middle"
      fontFamily="Arial Black, Arial, sans-serif"
      fontWeight={900}
      fontSize={30}
      fill={PAPER}
    >
      {pos}
    </text>
    <text
      x={24}
      y={10}
      textAnchor="middle"
      fontFamily="Arial Black, Arial, sans-serif"
      fontWeight={900}
      fontStyle="italic"
      fontSize={28}
      fill={INK}
    >
      {code}
    </text>
  </g>
);

// A strip panel under the map magnifying one car's rear tyre from above (easter egg): the tyre rolls over the wet
// track, its tread — four dry grooves or cut wet sipes — sliding past. `box` in screen px.
const TyrePanel: React.FC<{
  car: CarSpec;
  tread: "dry" | "wet";
  code: string;
  box: { x: number; y: number; w: number; h: number };
  t: number;
  id: string;
  label?: string;
  show: number;
}> = ({ car, tread, code, box, t, id, label, show }) => {
  const ppm = 330;
  const cx = box.x + box.w * 0.36;
  const cy = box.y + box.h / 2;
  // the car heads screen-right with its left rear tyre centred in the panel
  const rearAxle = carPoint(car, "rearAxle").x;
  const at = { x: cx - rearAxle * ppm, y: cy + 0.72 * ppm, pxPerMetre: ppm };
  return (
    <g opacity={show} transform={`translate(0 ${30 * (1 - show)})`}>
      <defs>
        <clipPath id={id}>
          <rect x={box.x} y={box.y} width={box.w} height={box.h} />
        </clipPath>
      </defs>
      <rect
        x={box.x}
        y={box.y}
        width={box.w}
        height={box.h}
        fill={tone("dark")}
      />
      <g clipPath={`url(#${id})`}>
        {/* the wet track streaming past under the tyre */}
        {Array.from({ length: 14 }, (_, i) => {
          const x =
            box.x + ((((i * 90 - t * 1400) % 1260) + 1260) % 1260) - 100;
          return (
            <path
              key={i}
              d={`M ${x} ${box.y + 20 + ((i * 53) % (box.h - 40))} l 70 0`}
              stroke={PAPER}
              strokeWidth={4}
              strokeLinecap="round"
              opacity={0.5}
            />
          );
        })}
        <MangaCar car={car} view="top" at={at} state={{ heading: 0, tread }} />
      </g>
      <rect
        x={box.x}
        y={box.y}
        width={box.w}
        height={box.h}
        fill="none"
        stroke={INK}
        strokeWidth={10}
      />
      <g transform={`translate(${box.x + box.w - 120} ${box.y + 52})`}>
        <rect
          x={-56}
          y={-28}
          width={112}
          height={50}
          fill={PAPER}
          stroke={INK}
          strokeWidth={4}
        />
        <text
          y={12}
          textAnchor="middle"
          fontFamily="Arial Black, Arial, sans-serif"
          fontWeight={900}
          fontStyle="italic"
          fontSize={34}
          fill={INK}
        >
          {code}
        </text>
      </g>
      {label ? (
        <text
          x={box.x + box.w - 30}
          y={box.y + box.h - 34}
          textAnchor="end"
          fontFamily={BRUSH_FONT}
          fontSize={96}
          fill={INK}
          stroke={PAPER}
          strokeWidth={10}
          paintOrder="stroke"
        >
          {label}
        </text>
      ) : null}
    </g>
  );
};

export const Juncao: React.FC<{ st: ShotTime }> = ({ st }) => {
  const { t } = st;
  const plan = juncaoPlan(t);
  const tau = raceTime(t);
  const slow = slowMo(t);
  // the camera rides with the group (centred on the cars' mean place), turning with the road
  const sMid = plan.reduce((sum, c) => sum + c.s, 0) / plan.length;
  const ppm = 30 + 6 * slow;
  const view = mapView({
    centre: poseAt(T, sMid + 4),
    rotation: -poseAt(T, sMid + 4).heading,
    pxPerMetre: ppm,
    screen: { x: 960, y: 400 },
  });
  const cars = plan.map((c) => {
    const pose = poseAt(T, c.s, c.lat);
    const heading = view.heading(pose.heading) + c.yaw;
    // the tag on the outer side: GLO's on the outside (right of the car), the others' on the inside
    const tag = view.project(
      poseAt(T, c.s, c.lat + (c.code === "GLO" ? 2.7 : -2.7)),
    );
    // front wheels steered into the curve (exaggerated ×3 so it reads), GLO counter-steering his slide
    const steer =
      ((Math.atan(3.1 * curvatureAt(T, c.s)) * 180) / Math.PI) * 3 +
      (c.code === "GLO" ? -9 * Math.sin(tau * 3.1 + 0.6) : 0);
    return {
      ...c,
      car: CARS[c.code],
      tread: TREAD[c.code],
      heading,
      steer,
      p: view.project(pose),
      tag,
    };
  });
  const gloShow = ramp(t, 0, 0.2);
  const hamShow = ramp(t, 0, 0.2);
  return (
    <Page>
      <defs>
        <clipPath id="b24-panel">
          <rect x={PANEL.x} y={PANEL.y} width={PANEL.w} height={PANEL.h} />
        </clipPath>
      </defs>
      <g filter={inkFilter()}>
        <g clipPath="url(#b24-panel)">
          <rect x={0} y={0} width={1920} height={1080} fill={tone("light")} />
          <TrackSection
            track={T}
            view={view}
            from={2900}
            to={S.cafe + 300}
            runoff={9}
            barrier
            tyreMarks
            grass={PANEL}
          />
          {/* standing water: dark patches fixed on the racing surface, streaming past with the track */}
          {Array.from({ length: 40 }, (_, i) => {
            const s0 = 3040 + i * 11 + ((i * 7) % 5);
            const q = view.project(poseAt(T, s0, ((i * 37) % 9) - 4.5));
            return (
              <ellipse
                key={i}
                cx={q.x}
                cy={q.y}
                rx={(2.5 + (i % 3)) * ppm}
                ry={0.7 * ppm}
                fill={tone("dark")}
                opacity={0.5}
                transform={`rotate(${view.heading(poseAt(T, s0).heading)} ${q.x} ${q.y})`}
              />
            );
          })}
          {/* real-time speed: streaks trailing each car (they vanish in the slow motion) */}
          {cars.map(({ heading, p, code }) => (
            <g
              key={`v-${code}`}
              transform={`translate(${p.x} ${p.y}) rotate(${heading})`}
              opacity={0.75 * (1 - slow)}
            >
              <path
                d={speedLines({
                  x: -9 * ppm,
                  y: -1.1 * ppm,
                  w: 6 * ppm,
                  h: 2.2 * ppm,
                  n: 9,
                  seed: `${code}-${Math.floor(t * 15)}`,
                  angle: 0,
                  thickness: 5,
                  length: [0.4, 1],
                })}
                fill={INK}
              />
            </g>
          ))}
          {/* the wakes, all under all the cars: spray streams from each car's rear tyres, longer the faster it goes */}
          {cars.map(({ heading, p, tread, code, speed }) => {
            const back = ((heading + 180) * Math.PI) / 180;
            const k = (tread === "dry" ? 0.45 : 1) * (0.6 + speed / 120);
            const puffs = Array.from({ length: 9 }, (_, i) => {
              const ph = (i / 9 + tau * 1.4) % 1;
              const d = (2.4 + ph * speed * 0.13) * ppm;
              const side = Math.sin(i * 2.3) * 0.2 * ppm;
              return {
                x: p.x + Math.cos(back) * d - Math.sin(back) * side,
                y: p.y + Math.sin(back) * d + Math.cos(back) * side,
                r: (0.35 + ph * 0.6) * ppm * k,
                o: 1 - ph * 0.85,
              };
            });
            return (
              <g key={`w-${code}`}>
                {puffs.map((q, i) => (
                  <circle
                    key={`o${i}`}
                    cx={q.x}
                    cy={q.y}
                    r={q.r + 2}
                    fill={INK}
                    opacity={q.o}
                  />
                ))}
                {puffs.map((q, i) => (
                  <circle
                    key={`f${i}`}
                    cx={q.x}
                    cy={q.y}
                    r={q.r}
                    fill={PAPER}
                    opacity={q.o}
                  />
                ))}
              </g>
            );
          })}
          {/* contact shadows */}
          {cars.map(({ heading, p, code }) => (
            <ellipse
              key={`sh-${code}`}
              cx={p.x + 0.25 * ppm}
              cy={p.y + 0.3 * ppm}
              rx={2.5 * ppm}
              ry={1.05 * ppm}
              fill={INK}
              opacity={0.3}
              transform={`rotate(${heading} ${p.x} ${p.y})`}
            />
          ))}
          {cars.map(({ car, heading, p, tread, steer, code }) => (
            <MangaCar
              key={code}
              car={car}
              view="top"
              at={topAnchorAt(
                car,
                { x: p.x, y: p.y, pxPerMetre: ppm },
                heading,
              )}
              state={{ heading, tread, steer }}
            />
          ))}
          {cars.map(({ tag, code, pos }) => (
            <Tag
              key={`t-${code}`}
              x={tag.x}
              y={tag.y + 6}
              code={code}
              pos={pos}
            />
          ))}
          {/* slow motion: the page closes in on HAM and GLO */}
          {slow > 0 ? (
            <path
              d={focusLines(
                (cars[0].p.x + cars[2].p.x) / 2,
                (cars[0].p.y + cars[2].p.y) / 2,
                300,
                120,
                Math.floor(t * 6),
              )}
              fill={INK}
              opacity={0.35 * slow}
            />
          ) : null}
          {/* turn name at Junção, on the inside of the corner */}
          {(() => {
            const q = view.project(poseAt(T, S.juncaoApex, -26));
            return (
              <text
                x={q.x}
                y={q.y}
                textAnchor="middle"
                fontFamily="Arial Black, Arial, sans-serif"
                fontStyle="italic"
                fontWeight={900}
                fontSize={46}
                fill={INK}
                stroke={PAPER}
                strokeWidth={8}
                paintOrder="stroke"
              >
                Junção
              </text>
            );
          })()}
          <Rain
            t={tau}
            n={260}
            slant={8}
            length={60 * (1 - 0.5 * slow)}
            opacity={0.45}
            seed="b24"
          />
        </g>
        <rect
          x={PANEL.x}
          y={PANEL.y}
          width={PANEL.w}
          height={PANEL.h}
          fill="none"
          stroke={INK}
          strokeWidth={10}
        />
        {/* the tyre strip under the map: GLO's dry grooves, HAM's wet tread */}
        <TyrePanel
          car={TF108}
          tread="dry"
          code="GLO"
          box={DRY_BOX}
          t={t}
          id="b24-glo"
          label="干地胎"
          show={gloShow}
        />
        <TyrePanel
          car={MP4_23}
          tread="wet"
          code="HAM"
          box={WET_BOX}
          t={t}
          id="b24-ham"
          show={hamShow}
        />
      </g>
    </Page>
  );
};
