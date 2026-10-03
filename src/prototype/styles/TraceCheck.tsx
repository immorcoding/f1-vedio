// PROTOTYPE — draws a CarSpec's traced paths as thin lines in the reference photo's pixel space,
// on a transparent background, so it can be laid over the photo to check the trace.
import { RB16B, W12, type CarSpec } from "./cars-2021";

const CARS: Record<string, CarSpec> = { W12, RB16B };

export const TraceCheck: React.FC<{ car: string }> = ({ car }) => {
  const c = CARS[car];
  const lines = [
    c.body,
    c.floor,
    c.frontWing.near,
    c.frontWing.far,
    ...c.frontWing.elements,
    c.rearWing.near,
    c.rearWing.top,
    c.rearWing.pylon,
    ...c.rearWing.elements,
    ...c.rearWing.beam,
    ...c.panelLines,
    ...c.bargeboards,
    ...c.suspension,
    c.halo,
    c.helmet.visor,
    c.mirror,
    c.tcam,
    c.antenna,
    ...c.accents.map((a) => a.d),
  ];
  return (
    <svg width={1920} height={1080}>
      {lines.map((d, i) => (
        <path key={i} d={d} fill="none" stroke="#ff00ff" strokeWidth={2.5} />
      ))}
      {[...c.nearWheels, ...c.farWheels].map((w) => (
        <g key={`${w.cx}-${w.cy}`}>
          <circle cx={w.cx} cy={w.cy} r={w.r} fill="none" stroke="#00ffff" strokeWidth={2.5} />
          <circle cx={w.cx} cy={w.cy} r={c.rimR} fill="none" stroke="#00ffff" strokeWidth={1.5} />
        </g>
      ))}
      <circle cx={c.helmet.cx} cy={c.helmet.cy} r={c.helmet.r} fill="none" stroke="#ffff00" strokeWidth={2.5} />
    </svg>
  );
};
