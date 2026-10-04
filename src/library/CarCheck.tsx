// Trace and Art check stills for one car (ART-10), drawn in the car's reference photo pixel space on a transparent
// background, the same 1920×1080 frame as the photo:
// - "trace": the traced paths as thin lines (magenta body and livery, cyan wheels and rims, yellow helmet), to lay
//   over the photo and check the alignment;
// - "art": the finished manga car at the photo's scale, to set next to (or blend with) the photo.
// Render with `npm run still -- Check-Trace-<car> out.png` and composite over the file in `CarSpec.reference`.
import { CARS, CarInPhotoSpace, type CarId } from "../cars";

export type CarCheckProps = { car: CarId; mode: "trace" | "art" };

export const CarCheck: React.FC<CarCheckProps> = ({ car: carId, mode }) => {
  const c = CARS[carId];
  if (mode === "art") {
    return (
      <svg width={1920} height={1080}>
        <CarInPhotoSpace car={c} />
      </svg>
    );
  }
  const fw = c.frontWing;
  // era features a car may not have are left out of its spec (spec.ts)
  const lines = [
    c.body,
    c.floor,
    fw.near,
    fw.deck,
    fw.flap.d,
    c.haloFar,
    c.rearWing.near,
    c.rearWing.top,
    c.rearWing.pylon,
    ...c.rearWing.elements,
    c.rearWing.beam,
    ...c.panelLines,
    ...c.suspension,
    c.halo,
    c.windscreen,
    c.cockpit.opening,
    c.mirror,
    c.tcam,
    c.antenna,
    ...c.accents.map((a) => a.d),
    ...c.livery.map((a) => a.d),
  ].filter((d): d is string => d !== undefined);
  return (
    <svg width={1920} height={1080}>
      {lines.map((d, i) => (
        <path key={i} d={d} fill="none" stroke="#ff00ff" strokeWidth={2.5} />
      ))}
      {[...c.nearWheels, ...c.farWheels].map((w) => (
        <g key={`${w.cx}-${w.cy}`}>
          <circle
            cx={w.cx}
            cy={w.cy}
            r={w.r}
            fill="none"
            stroke="#00ffff"
            strokeWidth={2.5}
          />
          <circle
            cx={w.cx}
            cy={w.cy}
            r={c.rimR}
            fill="none"
            stroke="#00ffff"
            strokeWidth={1.5}
          />
        </g>
      ))}
      <circle
        cx={c.helmetAt.cx}
        cy={c.helmetAt.cy}
        r={c.helmetAt.r}
        fill="none"
        stroke="#ffff00"
        strokeWidth={2.5}
      />
    </svg>
  );
};
