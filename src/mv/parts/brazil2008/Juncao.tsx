// Shot 2.4 (bars 43–46): the last corners from above (MOT-2), in the rain. Down to Junção: GLO, still on dry grooved
// tyres, slithers on the outside line; VET, on intermediates, dives down the inside and past him; then HAM closes in
// and arrives on GLO's inside at Junção as the shot cuts (the pass itself completes on 47.1 in shot 2.5). Easter egg: two insets
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
  INTERLAGOS_2008,
  mapView,
  poseAt,
  TrackSection,
} from "../../../tracks";
import { ramp, type ShotTime } from "../abuDhabi2021/shotClock";
import { Page } from "./common";
import { juncaoPlan } from "./juncao-plan";

const T = INTERLAGOS_2008;
const S = T.corners;
const PANEL = { x: 40, y: 40, w: 1840, h: 700 };
const DRY_BOX = { x: 40, y: 770, w: 905, h: 270 };
const WET_BOX = { x: 975, y: 770, w: 905, h: 270 };

// The cars' positions come from the choreography in juncao-plan.ts (checked frame by frame for overlap, ART-18);
// each is drawn at its true size on a map scaled so it reads (about 24 px per metre).
const CARS = { GLO: TF108, VET: STR3, HAM: MP4_23 } as const;
const TREAD = { GLO: "dry", VET: "wet", HAM: "wet" } as const;

// Lettered driver tag beside a car (three-letter code, STO-5).
const Tag: React.FC<{ x: number; y: number; code: string }> = ({
  x,
  y,
  code,
}) => (
  <g transform={`translate(${x} ${y})`}>
    <rect
      x={-46}
      y={-24}
      width={92}
      height={42}
      fill={PAPER}
      stroke={INK}
      strokeWidth={4}
    />
    <text
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
  const { t, dur } = st;
  const plan = juncaoPlan(t);
  // the camera follows the group, then (as VET gets clear) settles on HAM and GLO; it turns with the road
  const by = (code: string) => plan.find((c) => c.code === code)!;
  const all = plan.reduce((sum, c) => sum + c.s, 0) / plan.length;
  const pair = (by("HAM").s + by("GLO").s) / 2;
  const focus = ramp(t, 2.8, 5.2);
  const sMid = all + (pair - all) * focus + 4;
  const ppm = 31 + 9 * ramp(t, 0, dur);
  const view = mapView({
    centre: poseAt(T, sMid),
    rotation: -poseAt(T, sMid).heading,
    pxPerMetre: ppm,
    screen: { x: 960, y: 400 },
  });
  const cars = plan.map((c) => {
    const pose = poseAt(T, c.s, c.lat);
    const heading = view.heading(pose.heading) + c.yaw;
    // the tag on the outer side: GLO's on the outside (right of the car), the others' on the inside
    const tag = view.project(
      poseAt(T, c.s, c.lat + (c.code === "GLO" ? 2.6 : -2.6)),
    );
    return {
      ...c,
      car: CARS[c.code],
      tread: TREAD[c.code],
      heading,
      p: view.project(pose),
      tag,
    };
  });
  const gloShow = ramp(t, 0.1, 0.5);
  const hamShow = ramp(t, 0.6, 1.0);
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
            from={S.mergulho - 200}
            to={S.cafe + 300}
            runoff={9}
            barrier
            grass={PANEL}
          />
          {/* standing water: dark patches on the racing surface */}
          {Array.from({ length: 24 }, (_, i) => {
            const s0 = 3150 + i * 15;
            const q = view.project(poseAt(T, s0, ((i * 37) % 9) - 4.5));
            return (
              <ellipse
                key={i}
                cx={q.x}
                cy={q.y}
                rx={4 * ppm}
                ry={0.9 * ppm}
                fill={tone("dark")}
                opacity={0.5}
                transform={`rotate(${view.heading(poseAt(T, s0).heading)} ${q.x} ${q.y})`}
              />
            );
          })}
          {/* the wakes first, all of them under all the cars: spray streams from each car's rear tyres */}
          {cars.map(({ heading, p, tread, code }) => {
            const back = ((heading + 180) * Math.PI) / 180;
            const k = tread === "dry" ? 0.45 : 1;
            const puffs = Array.from({ length: 9 }, (_, i) => {
              const ph = (i / 9 + t * 1.4) % 1;
              const d = (2.4 + ph * 6) * ppm;
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
          {cars.map(({ car, heading, p, tread, code }) => (
            <MangaCar
              key={code}
              car={car}
              view="top"
              at={topAnchorAt(
                car,
                { x: p.x, y: p.y, pxPerMetre: ppm },
                heading,
              )}
              state={{
                heading,
                tread,
                steer: code === "GLO" ? -10 * Math.sin(t * 3.1) : 0,
              }}
            />
          ))}
          {cars.map(({ tag, code }) => (
            <Tag key={`t-${code}`} x={tag.x} y={tag.y + 6} code={code} />
          ))}
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
          <Rain t={t} n={260} slant={8} length={60} opacity={0.45} seed="b24" />
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
