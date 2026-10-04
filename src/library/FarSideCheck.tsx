// Far-side check (ART-17, ART-26): cars side by side at one scale, each in a far-side look (CarState.farSide, "low"
// for a trackside camera, "high" for one looking down), with its front corner (front wing and front wheel) blown up
// 3× beside it. Registered as Check-Far-Side; pass rows with --props.
import { AbsoluteFill } from "remotion";
import { CARS, MangaCar, type CarId } from "../cars";
import { carLength, type FarSideCamera } from "../cars/spec";
import { CAPTION_FONT } from "../kit/lettering";
import { INK, PAPER } from "../kit/colors";

export type FarSideRow = { car: CarId; farSide?: FarSideCamera; label?: string };
export type FarSideCheckProps = { rows: FarSideRow[]; title?: string };

const PPM = 130;
const ZOOM = 3;
const CAR_AT = 360; // the rear end of each car, clear of its label
const CORNER = { w: 1.2, h: 0.7 }; // m of the front corner shown, from the nose back and from the ground up

export const FarSideCheck: React.FC<FarSideCheckProps> = ({ rows, title }) => {
  const top = title ? 50 : 0;
  const rowH = (1080 - top) / rows.length;
  const ppm = Math.min(PPM, (rowH - 40) / 1.3);
  return (
    <AbsoluteFill style={{ backgroundColor: PAPER }}>
      <svg width={1920} height={1080}>
        {title ? (
          <text x={20} y={36} fontFamily={CAPTION_FONT} fontWeight={700} fontSize={28} fill={INK}>
            {title}
          </text>
        ) : null}
        {rows.map((r, i) => {
          const car = CARS[r.car];
          const state = { farSide: r.farSide ?? "low" };
          const y0 = top + i * rowH;
          const ground = y0 + rowH - 24;
          const len = carLength(car);
          const zoom = Math.min(ZOOM, (rowH - 8) / (CORNER.h * ppm));
          const cw = CORNER.w * ppm * zoom;
          const ch = CORNER.h * ppm * zoom;
          const cx = 1900 - cw;
          const label = `${r.label ?? r.car} · ${state.farSide}`;
          return (
            <g key={i}>
              <line x1={0} x2={1920} y1={y0} y2={y0} stroke={INK} strokeWidth={2} />
              <MangaCar car={car} at={{ x: CAR_AT, y: ground, pxPerMetre: ppm }} state={state} />
              <text x={20} y={y0 + 40} fontFamily={CAPTION_FONT} fontWeight={700} fontSize={26} fill={INK}>
                {label}
              </text>
              <svg
                x={cx}
                y={ground - ch + 12}
                width={cw}
                height={ch}
                viewBox={`${CAR_AT + (len - CORNER.w + 0.2) * ppm} ${ground + 4 - ch / zoom} ${cw / zoom} ${ch / zoom}`}
                overflow="hidden"
              >
                <MangaCar car={car} at={{ x: CAR_AT, y: ground, pxPerMetre: ppm }} state={state} />
              </svg>
              <rect x={cx} y={ground - ch + 12} width={cw} height={ch} fill="none" stroke={INK} strokeWidth={3} />
            </g>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};
