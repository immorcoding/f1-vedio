// Far-side check (ART-17, ART-26): cars side by side at one scale, each seen from a given camera, with its front
// corner (front wing and front wheel) blown up 3× beside it. Rows give the camera as elevation (degrees over the axles)
// and distance (m); "photo" draws the car from its reference photo's camera (far-side.ts photoCamera).
// Registered as Check-Far-Side; pass rows with --props.
import { AbsoluteFill } from "remotion";
import { CARS, MangaCar, type CarId } from "../cars";
import { photoCamera } from "../cars/far-side";
import { carLength } from "../cars/spec";
import { CAPTION_FONT } from "../kit/lettering";
import { INK, PAPER } from "../kit/colors";

export type FarSideRow = {
  car: CarId;
  // degrees over the axles and metres; "photo" = the reference photo's camera
  camera: { elevation: number; distance: number } | "photo";
  label?: string;
};
export type FarSideCheckProps = { rows: FarSideRow[]; title?: string };

const PPM = 130;
const ZOOM = 3;
const CORNER = { w: 1.2, h: 0.7 }; // m of the front corner shown, from the nose back and from the ground up

export const FarSideCheck: React.FC<FarSideCheckProps> = ({ rows, title }) => {
  const top = title ? 50 : 0;
  const rowH = (1080 - top) / rows.length;
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
          const cam = r.camera === "photo" ? photoCamera(car) : r.camera;
          const state = { camElevation: cam.elevation, camDistance: cam.distance };
          const y0 = top + i * rowH;
          const ground = y0 + rowH - 24;
          const len = carLength(car);
          const cw = CORNER.w * PPM * ZOOM;
          const ch = Math.min(CORNER.h * PPM * ZOOM, rowH - 8);
          const cx = 1900 - cw;
          const label = `${r.label ?? r.car} · ${cam.elevation.toFixed(1)}° ${cam.distance.toFixed(0)} m`;
          return (
            <g key={i}>
              <line x1={0} x2={1920} y1={y0} y2={y0} stroke={INK} strokeWidth={2} />
              <MangaCar car={car} at={{ x: 30, y: ground, pxPerMetre: PPM }} state={state} />
              <text x={30} y={y0 + 34} fontFamily={CAPTION_FONT} fontWeight={700} fontSize={26} fill={INK}>
                {label}
              </text>
              <svg
                x={cx}
                y={ground - ch + 12}
                width={cw}
                height={ch}
                viewBox={`${30 + (len - CORNER.w + 0.2) * PPM} ${ground + 4 - ch / ZOOM} ${cw / ZOOM} ${ch / ZOOM}`}
                overflow="hidden"
              >
                <MangaCar car={car} at={{ x: 30, y: ground, pxPerMetre: PPM }} state={state} />
              </svg>
              <rect x={cx} y={ground - ch + 12} width={cw} height={ch} fill="none" stroke={INK} strokeWidth={3} />
            </g>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};
