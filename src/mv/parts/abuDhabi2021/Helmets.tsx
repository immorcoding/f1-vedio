// Shot 5.1e (bar 87): the front-wheel split panel. The page goes black; on 87.1 (`abuDhabi2021.helmetVer`) VER's panel
// slams in from the left across the top half, on 87.3 (`abuDhabi2021.helmetHam`) HAM's from the right across the
// bottom half, the gutter between them slashed on a diagonal. Each panel is the real side view of the car (MangaCar,
// LOW look, ART-26) cropped tight on its front wheel — nose, front wing and front suspension around it — both
// facing right, the way the race runs; VER on top because he is on the inside line. The tyres carry the cars' own
// compound bands (PIRELLI_2021: VER's red soft, HAM's white hard) and spin at speed. One small caption per panel
// says which is which, "VER · NEW" and "HAM · OLD" (#34: calls back 4.3's FRESH SOFTS vs OLD HARDS; facts.md: VER
// pitted for new softs under the last safety car, HAM stayed out on old hards), placed clear of the wheel (ART-14).
// The night streams past in white speed lines and focus lines close on each wheel; the car shivers.
// (The cue ids keep their helmet names from the panel this slot held before.)
import {
  MangaCar,
  PIRELLI_2021,
  RB16B,
  W12,
  type CarSpec,
} from "../../../cars";
import { CAR_UNITS_PER_METRE } from "../../../cars/spec";
import { INK, PAPER } from "../../../kit/colors";
import { InkFilterDef, inkFilter } from "../../../kit/ink";
import { Caption } from "../../../kit/lettering";
import { focusLines, speedLines } from "../../../kit/lines";
import { ToneDefs } from "../../../kit/tone";
import { at } from "../../timing.ts";
import { hit, ramp, secondsInShot, type ShotTime } from "./shotClock";

const PPM = 680; // px per metre: the front wheel about 0.75 of a panel's height across
const SPIN = 1500; // wheel rotation shown, degrees per second

// MangaCar's anchor that puts the car's near front axle at screen (wx, wy).
const frontWheelAnchor = (
  car: CarSpec,
  wx: number,
  wy: number,
  ppm: number,
) => {
  const k = (car.frame.k * ppm) / CAR_UNITS_PER_METRE;
  const w = car.nearWheels[0];
  return {
    x: wx - (car.frame.x - w.cx) * k,
    y: wy - (w.cy - car.frame.ground) * k,
    pxPerMetre: ppm,
  };
};

const Strip: React.FC<{
  id: string;
  poly: string;
  car: CarSpec;
  compound: string;
  wheel: { x: number; y: number };
  t: number;
  since: number;
  from: "left" | "right";
  caption: string;
  captionAt: { x: number; y: number };
}> = ({
  id,
  poly,
  car,
  compound,
  wheel,
  t,
  since,
  from,
  caption,
  captionAt,
}) => {
  if (since < 0) return null;
  const slide = (1 - ramp(since, 0, 0.09)) * (from === "left" ? -1400 : 1400);
  const jolt = hit(since, 0, 0.25);
  const sx = slide + Math.sin(t * 59) * (2 + 10 * jolt);
  const sy = Math.cos(t * 51) * (2 + 6 * jolt);
  const a = frontWheelAnchor(car, wheel.x, wheel.y, PPM * (1 + 0.04 * since));
  const seed = Math.floor(t * 30);
  return (
    <g transform={`translate(${sx} ${sy})`}>
      <defs>
        <clipPath id={id}>
          <path d={poly} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id})`}>
        <rect x={-200} y={-200} width={2400} height={1500} fill={INK} />
        <path
          d={speedLines({
            x: -300,
            y: -100,
            w: 2600,
            h: 1300,
            n: 70,
            seed: `${id}-${seed}`,
            angle: 180,
            thickness: 6,
            length: [0.2, 0.55],
          })}
          fill={PAPER}
          opacity={0.6}
        />
        <path
          d={focusLines(wheel.x, wheel.y, 260, 110, seed)}
          fill={PAPER}
          opacity={0.35}
        />
        <g transform={`translate(0 ${Math.sin(t * 41) * 3})`}>
          <MangaCar
            car={car}
            at={a}
            state={{ wheelAngle: t * SPIN, compound, farSide: "low" }}
          />
        </g>
        <Caption x={captionAt.x} y={captionAt.y} lines={[caption]} size={40} />
      </g>
      <path d={poly} fill="none" stroke={PAPER} strokeWidth={12} />
      <path d={poly} fill="none" stroke={INK} strokeWidth={5} />
    </g>
  );
};

export const Helmets: React.FC<{ st: ShotTime }> = ({ st }) => {
  const { t } = st;
  const hamIn = secondsInShot(st, at(87, 3));
  const top = "M 30 30 L 1890 30 L 1890 470 L 30 600 Z";
  const bottom = "M 30 630 L 1890 500 L 1890 1050 L 30 1050 Z";
  return (
    <svg width={1920} height={1080}>
      <defs>
        <ToneDefs />
        <InkFilterDef />
      </defs>
      <rect width={1920} height={1080} fill={INK} />
      <g filter={inkFilter()}>
        <Strip
          id="hl-ver"
          poly={top}
          car={RB16B}
          compound={PIRELLI_2021.soft}
          wheel={{ x: 1000, y: 312 }}
          t={t}
          since={t}
          from="left"
          caption="VER · NEW"
          captionAt={{ x: 80, y: 70 }}
        />
        <Strip
          id="hl-ham"
          poly={bottom}
          car={W12}
          compound={PIRELLI_2021.hard}
          wheel={{ x: 930, y: 838 }}
          t={t}
          since={t - hamIn}
          from="right"
          caption="HAM · OLD"
          captionAt={{ x: 1570, y: 560 }}
        />
      </g>
    </svg>
  );
};
