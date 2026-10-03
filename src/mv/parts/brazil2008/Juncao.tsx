// Shot 2.4 (bars 43–46): the last corners from above (MOT-2), in the rain. Down Mergulho towards Junção: GLO, still on
// dry grooved tyres, slithers and slides wide; VET, on intermediates, dives past him; HAM closes in and is level
// with the Toyota as they reach Junção at the cut (the pass itself lands on 47.1 in shot 2.5). Easter egg: two insets
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

const T = INTERLAGOS_2008;
const S = T.corners;
const PANEL = { x: 40, y: 40, w: 1840, h: 1000 };

// Lap distance of each car through the shot (t seconds, dur the shot's length).
const ham = (t: number) => 3118 + 34.5 * t;
const glo = (t: number) => 3175 + 27 * t;
const vet = (t: number) => 3158 + 34.5 * t;
// lateral offset from the centre line, m (+ = driver's right; Junção is a left-hander, so the inside is −)
const gloLat = (t: number, dur: number) =>
  0.8 + 2.2 * ramp(t, dur * 0.4, dur) + 0.6 * Math.sin(t * 3.1);
const hamLat = (t: number, dur: number) => 1.5 - 4.5 * ramp(t, dur * 0.45, dur);
const vetLat = (t: number) =>
  0.5 - 3.6 * ramp(t, 1.0, 2.2) + 3 * ramp(t, 3.2, 4.4);

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

// A round inset magnifying a car's rear tyre from above, centred on screen point (cx, cy).
const TyreInset: React.FC<{
  car: CarSpec;
  tread: "dry" | "wet";
  cx: number;
  cy: number;
  r: number;
  t: number;
  id: string;
  label?: string;
  show: number;
}> = ({ car, tread, cx, cy, r, t, id, label, show }) => {
  const ppm = 300;
  // the car heads screen-right with its rear axle's left-hand tyre under the inset centre
  const rearAxle = carPoint(car, "rearAxle").x;
  const at = { x: cx - rearAxle * ppm, y: cy + 0.72 * ppm, pxPerMetre: ppm };
  return (
    <g
      opacity={show}
      transform={`translate(${cx} ${cy}) scale(${0.6 + 0.4 * show}) translate(${-cx} ${-cy})`}
    >
      <defs>
        <clipPath id={id}>
          <circle cx={cx} cy={cy} r={r} />
        </clipPath>
      </defs>
      <circle cx={cx} cy={cy} r={r} fill={tone("dark")} />
      <g clipPath={`url(#${id})`}>
        {/* the wet track sliding past under the tyre */}
        {Array.from({ length: 8 }, (_, i) => {
          const x = cx - r + ((((i * 70 - t * 900) % 560) + 560) % 560);
          return (
            <path
              key={i}
              d={`M ${x} ${cy - r} L ${x - 30} ${cy + r}`}
              stroke={PAPER}
              strokeWidth={3}
              opacity={0.4}
            />
          );
        })}
        <MangaCar car={car} view="top" at={at} state={{ heading: 0, tread }} />
      </g>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={INK} strokeWidth={9} />
      <circle
        cx={cx}
        cy={cy}
        r={r + 7}
        fill="none"
        stroke={PAPER}
        strokeWidth={5}
      />
      {label ? (
        <text
          x={cx}
          y={cy + r + 92}
          textAnchor="middle"
          fontFamily={BRUSH_FONT}
          fontSize={84}
          fill={INK}
          stroke={PAPER}
          strokeWidth={8}
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
  const sMid = (ham(t) + vet(t)) / 2;
  const rotation = -poseAt(T, S.juncaoEntry - 40).heading;
  const zoom = ramp(t, 0, dur);
  const view = mapView({
    centre: poseAt(T, sMid + 25),
    rotation,
    pxPerMetre: 8 + 2 * zoom,
    screen: { x: 880, y: 560 },
  });
  // cars drawn larger than life so their lines read on the corner map
  const carScale = 2.6 - 0.3 * zoom;
  const ppm = view.pxPerMetre * carScale;
  const slide = Math.sin(t * 3.1);
  const cars = [
    {
      car: TF108,
      s: glo(t),
      lat: gloLat(t, dur),
      tread: "dry" as const,
      yaw: 7 * slide,
      steer: -12 * slide,
      code: "GLO",
    },
    {
      car: STR3,
      s: vet(t),
      lat: vetLat(t),
      tread: "wet" as const,
      yaw: 0,
      steer: 0,
      code: "VET",
    },
    {
      car: MP4_23,
      s: ham(t),
      lat: hamLat(t, dur),
      tread: "wet" as const,
      yaw: 0,
      steer: -4 * ramp(t, dur * 0.6, dur),
      code: "HAM",
    },
  ].map((c) => {
    const pose = poseAt(T, c.s, c.lat);
    // the tag sits on the outer side of each car: GLO's below (outside), the others' above (inside)
    const tag = view.project(
      poseAt(T, c.s, c.lat + (c.code === "GLO" ? 6 : -6)),
    );
    return {
      ...c,
      heading: view.heading(pose.heading) + c.yaw,
      p: view.project(pose),
      tag,
    };
  });
  const gloShow = ramp(t, 1.2, 1.7);
  const hamShow = ramp(t, 2.0, 2.5);
  const GLO_IN = { cx: 1500, cy: 300, r: 160 };
  const HAM_IN = { cx: 1500, cy: 800, r: 130 };
  const glo0 = cars[0].p;
  const ham0 = cars[2].p;
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
          {Array.from({ length: 16 }, (_, i) => {
            const s = 3120 + i * 22;
            const q = view.project(poseAt(T, s, ((i * 37) % 9) - 4.5));
            return (
              <ellipse
                key={i}
                cx={q.x}
                cy={q.y}
                rx={5 * view.pxPerMetre}
                ry={1.2 * view.pxPerMetre}
                fill={tone("dark")}
                opacity={0.55}
                transform={`rotate(${view.heading(poseAt(T, s).heading)} ${q.x} ${q.y})`}
              />
            );
          })}
          {/* the wakes first, so no car's spray covers another car: one inked outline round each plume */}
          {cars.map(({ heading, p, tread, code }) => {
            const back = ((heading + 180) * Math.PI) / 180;
            const k = tread === "dry" ? 0.45 : 1;
            const puffs = Array.from({ length: 9 }, (_, i) => {
              const ph = (i / 9 + t * 1.4) % 1;
              const d = (2.6 + ph * 7) * ppm;
              const side = Math.sin(i * 2.3) * 0.25 * ppm;
              return {
                x: p.x + Math.cos(back) * d - Math.sin(back) * side,
                y: p.y + Math.sin(back) * d + Math.cos(back) * side,
                r: (0.45 + ph * 0.9) * ppm * k,
                o: 1 - ph * 0.8,
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
          {cars.map(({ car, heading, p, tag, tread, steer, code }) => (
            <g key={code}>
              <MangaCar
                car={car}
                view="top"
                at={topAnchorAt(
                  car,
                  { x: p.x, y: p.y, pxPerMetre: ppm },
                  heading,
                )}
                state={{ heading, steer, tread }}
              />
              <Tag x={tag.x} y={tag.y + 8} code={code} />
            </g>
          ))}
          {/* turn name at Junção, once the corner comes into view */}
          {(() => {
            const q = view.project(poseAt(T, S.juncaoApex - 20, -34));
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
          <Rain t={t} n={260} slant={8} length={60} opacity={0.5} seed="b24" />
          {/* tyre insets with leader lines to their cars: GLO's dry grooves, HAM's wet tread */}
          <path
            d={`M ${glo0.x} ${glo0.y} L ${GLO_IN.cx - GLO_IN.r * 0.8} ${GLO_IN.cy + GLO_IN.r * 0.6}`}
            stroke={INK}
            strokeWidth={4}
            strokeDasharray="12 8"
            opacity={gloShow}
          />
          <path
            d={`M ${ham0.x} ${ham0.y} L ${HAM_IN.cx - HAM_IN.r * 0.8} ${HAM_IN.cy - HAM_IN.r * 0.6}`}
            stroke={INK}
            strokeWidth={4}
            strokeDasharray="12 8"
            opacity={hamShow}
          />
          <TyreInset
            car={TF108}
            tread="dry"
            {...GLO_IN}
            t={t}
            id="b24-glo"
            label="干地胎"
            show={gloShow}
          />
          <TyreInset
            car={MP4_23}
            tread="wet"
            {...HAM_IN}
            t={t}
            id="b24-ham"
            show={hamShow}
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
      </g>
    </Page>
  );
};
