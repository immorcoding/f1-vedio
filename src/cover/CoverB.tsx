// Cover B: one hero image. Verstappen's RB16B (Abu Dhabi 2021) side-on and flat out across the bottom of the frame
// on speed lines, the title top left, and the four helmets of the film's four stories (Senna 1989, Hamilton 2008,
// Grosjean 2020, Verstappen 2021) in small inset panels top right (ART-6's inset panels, ART-13 helmets; no faces,
// ART-5). Nothing important in the bottom right: only the end of the car's nose reaches there.
import {
  CARS_2008,
  DriverHelmet,
  GRO_2020,
  MangaCar,
  RB16B,
  SEN_1989,
  type Driver,
} from "../cars";
import { INK, PAPER } from "../kit/colors";
import { CAPTION_FONT } from "../kit/lettering";
import { focusLines, speedLines } from "../kit/lines";
import { CoverTitle } from "./CoverTitle";
import { CoverPage, W, ct, type CoverProps } from "./frame";

const HELMETS: { driver: Driver; label: string }[] = [
  { driver: SEN_1989, label: "SEN · 1989" },
  { driver: CARS_2008["MP4-23"].driver, label: "HAM · 2008" },
  { driver: GRO_2020, label: "GRO · 2020" },
  { driver: RB16B.driver, label: "VER · 2021" },
];

const HelmetPanel: React.FC<{
  x: number;
  y: number;
  s: number;
  driver: Driver;
  label: string;
  seed: number;
}> = ({ x, y, s, driver, label, seed }) => {
  const id = `hp${seed}`;
  const labelH = s * 0.2;
  return (
    <g>
      <defs>
        <clipPath id={id}>
          <rect x={x} y={y} width={s} height={s} />
        </clipPath>
      </defs>
      <rect x={x + 9} y={y + 9} width={s} height={s} fill={INK} />
      <g clipPath={`url(#${id})`}>
        <rect x={x} y={y} width={s} height={s} fill={ct("light")} />
        <path
          d={focusLines(x + s / 2, y + s * 0.42, s * 0.34, 90, seed)}
          fill={INK}
        />
        <DriverHelmet
          driver={driver}
          x={x + s / 2}
          y={y + s * 0.42}
          r={s * 0.3}
          facing="right"
        />
        <rect x={x} y={y + s - labelH} width={s} height={labelH} fill={INK} />
        <text
          x={x + s / 2}
          y={y + s - labelH * 0.3}
          textAnchor="middle"
          fontFamily={CAPTION_FONT}
          fontWeight={700}
          fontSize={labelH * 0.56}
          letterSpacing="0.06em"
          fill={PAPER}
        >
          {label}
        </text>
      </g>
      <rect
        x={x}
        y={y}
        width={s}
        height={s}
        fill="none"
        stroke={INK}
        strokeWidth={7}
      />
    </g>
  );
};

export const CoverB: React.FC<CoverProps> = ({ h }) => {
  const ground = h - 92;
  const ppm = 292;
  const s = 222; // helmet panel
  const gap = 22;
  const px = W - 40 - 2 * s - gap;
  const py = 44 + (h - 1080) * 0.25;
  return (
    <CoverPage h={h}>
      {/* the wall and the track behind the car: a light-toned band and a dark-toned road, all streaming past */}
      <rect x={0} y={ground - 420} width={W} height={300} fill={ct("light")} />
      <rect x={0} y={ground - 120} width={W} height={h} fill={ct("mid")} />
      <rect x={0} y={ground - 126} width={W} height={10} fill={INK} />
      <path
        d={speedLines({ x: -100, y: 20, w: 2100, h: ground - 40, n: 120, seed: "b-sky", thickness: 9 })}
        fill={INK}
      />
      <path
        d={speedLines({ x: -100, y: ground - 110, w: 2100, h: h - ground + 110, n: 60, seed: "b-road", thickness: 10 })}
        fill={PAPER}
      />
      <MangaCar car={RB16B} at={{ x: 34, y: ground, pxPerMetre: ppm }} />
      {/* streaks off the car's tail */}
      <path
        d={speedLines({ x: -80, y: ground - 290, w: 200, h: 280, n: 22, seed: "b-tail", thickness: 8 })}
        fill={INK}
      />

      {HELMETS.map((hm, i) => (
        <HelmetPanel
          key={hm.label}
          x={px + (i % 2) * (s + gap)}
          y={py + Math.floor(i / 2) * (s + gap) + (i % 2) * 18}
          s={s}
          driver={hm.driver}
          label={hm.label}
          seed={i + 3}
        />
      ))}

      <CoverTitle x={64} y={62 + (h - 1080) * 0.3} S={152} />
    </CoverPage>
  );
};
