// PROTOTYPE — draws a CarSpec in the reference photo's own pixel space on a transparent background,
// so it can be laid over the photo to check the trace. `mode: "lines"` draws the traced paths as thin lines;
// `mode: "art"` draws the finished manga car, for a side-by-side or blended comparison.
import { RB16B, W12, type CarSpec } from "./cars-2021";
import { MangaCarArt } from "./MangaCar";

const CARS: Record<string, CarSpec> = { W12, RB16B };

const tone = (id: string, r: number, gap = 7) => (
  <pattern id={id} width={gap} height={gap} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
    <rect width={gap} height={gap} fill="#fbfaf6" />
    <circle cx={gap / 2} cy={gap / 2} r={r} fill="#0d0d0d" />
  </pattern>
);

export const TraceCheck: React.FC<{ car: string; mode?: "lines" | "art" }> = ({ car, mode = "lines" }) => {
  const c = CARS[car];
  if (mode === "art") {
    return (
      <svg width={1920} height={1080}>
        <defs>
          {tone("b-tone-dark", 2.7)}
          {tone("b-tone-light", 1.05)}
        </defs>
        <MangaCarArt car={c} id="trace" />
      </svg>
    );
  }
  const fw = c.frontWing;
  const lines = [
    c.body,
    c.floor,
    fw.near,
    fw.far,
    fw.farDeck,
    fw.nearDeck,
    ...fw.farFlaps.map((a) => a.d),
    ...fw.nearFlaps.map((a) => a.d),
    c.haloFar,
    c.rearWing.near,
    c.rearWing.top,
    c.rearWing.pylon,
    ...c.rearWing.elements,
    ...c.rearWing.beam,
    ...c.panelLines,
    ...c.suspension,
    c.halo,
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
