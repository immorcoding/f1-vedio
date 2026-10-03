// PROTOTYPE — renders a traced CarSpec in the black-and-white manga style.
// Expects the parent SVG to define the screentone patterns `b-tone-dark`, `b-tone-mid` and `b-tone-light`.
import type { CarSpec, Wheel } from "./cars-2021";

const WHITE = "#fbfaf6";
const BLACK = "#0d0d0d";

const Ink: React.FC<{ d: string; w: number; c?: string; o?: number }> = ({ d, w, c = BLACK, o = 1 }) => (
  <path d={d} fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" opacity={o} />
);

const spokePath = (w: Wheel, r: number, n: number) =>
  Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    return `M ${w.cx + Math.cos(a) * r * 0.22} ${w.cy + Math.sin(a) * r * 0.22} L ${w.cx + Math.cos(a) * r * 0.94} ${w.cy + Math.sin(a) * r * 0.94}`;
  }).join(" ");

const NearWheel: React.FC<{ car: CarSpec; w: Wheel; spin: number }> = ({ car, w, spin }) => (
  <g>
    <circle cx={w.cx} cy={w.cy} r={w.r} fill={BLACK} />
    {/* tread shoulder and sidewall bulge */}
    <circle cx={w.cx} cy={w.cy} r={w.r - 6} fill="none" stroke="#2c2c2c" strokeWidth={3} />
    <circle cx={w.cx} cy={w.cy} r={w.r - 24} fill="none" stroke={car.compound} strokeWidth={6} />
    <g transform={`rotate(${-spin} ${w.cx} ${w.cy})`}>
      {car.rim === "spoked" ? (
        <>
          <circle cx={w.cx} cy={w.cy} r={car.rimR} fill="url(#b-tone-light)" stroke={BLACK} strokeWidth={4} />
          <path d={spokePath(w, car.rimR, 10)} stroke={BLACK} strokeWidth={6} strokeLinecap="round" />
          <path d={spokePath(w, car.rimR, 10)} stroke={WHITE} strokeWidth={2} strokeLinecap="round" />
        </>
      ) : (
        <>
          <circle cx={w.cx} cy={w.cy} r={car.rimR} fill="url(#b-tone-dark)" stroke={BLACK} strokeWidth={4} />
          <path d={spokePath(w, car.rimR * 0.8, 12)} stroke={WHITE} strokeWidth={1.6} opacity={0.6} />
        </>
      )}
    </g>
    {car.rimAccent ? <circle cx={w.cx} cy={w.cy} r={car.rimR} fill="none" stroke={car.rimAccent} strokeWidth={5} /> : null}
    <circle cx={w.cx} cy={w.cy} r={12} fill={BLACK} stroke={WHITE} strokeWidth={2} />
    {/* rim-light arc on the tyre shoulder */}
    <path d={`M ${w.cx + w.r * 0.15} ${w.cy - w.r * 0.9} A ${w.r * 0.92} ${w.r * 0.92} 0 0 1 ${w.cx + w.r * 0.85} ${w.cy - w.r * 0.32}`} fill="none" stroke={WHITE} strokeWidth={6} strokeLinecap="round" />
  </g>
);

// Draws in the photo's own pixel space; the caller decides placement. `mirror` flips it to face right.
export type Scheme = "black" | "navy";

// Value bands per paint scheme: lit cover, flanks, shadowed undercut.
const BANDS: Record<Scheme, { body: string; cover: string; sidepod: string; chassis: string; undercut: string; glint: number }> = {
  black: { body: BLACK, cover: BLACK, sidepod: BLACK, chassis: BLACK, undercut: BLACK, glint: 0.95 },
  navy: { body: "url(#b-tone-dark)", cover: "url(#b-tone-mid)", sidepod: "url(#b-tone-dark)", chassis: "url(#b-tone-mid)", undercut: BLACK, glint: 0.85 },
};

export const MangaCarArt: React.FC<{ car: CarSpec; id: string; scheme: Scheme; spin?: number }> = ({ car, id, scheme, spin = 0 }) => {
  const band = BANDS[scheme];
  const bodyFill = band.body;
  return (
    <g>
      <defs>
        <clipPath id={`${id}-body`}>
          <path d={car.body} />
        </clipPath>
      </defs>
      {/* far side: wheels and wing endplates sit behind the body */}
      {car.farWheels.map((w) => (
        <g key={`f${w.cx}`}>
          <circle cx={w.cx} cy={w.cy} r={w.r} fill={BLACK} />
          <circle cx={w.cx} cy={w.cy} r={w.r * 0.62} fill="url(#b-tone-dark)" stroke="#2c2c2c" strokeWidth={3} />
          {[-0.5, -0.25, 0, 0.25, 0.5].map((t) => (
            <path key={t} d={`M ${w.cx + Math.sin(t) * w.r * 0.66} ${w.cy - Math.cos(t) * w.r * 0.66} L ${w.cx + Math.sin(t) * w.r * 0.97} ${w.cy - Math.cos(t) * w.r * 0.97}`} stroke="#3a3a3a" strokeWidth={3} />
          ))}
          <path d={`M ${w.cx - w.r * 0.2} ${w.cy - w.r * 0.94} A ${w.r * 0.95} ${w.r * 0.95} 0 0 1 ${w.cx + w.r * 0.7} ${w.cy - w.r * 0.6}`} fill="none" stroke={WHITE} strokeWidth={4} opacity={0.8} />
        </g>
      ))}
      <path d={car.frontWing.far} fill={BLACK} />
      <path d={car.frontWing.far} fill="none" stroke={WHITE} strokeWidth={2.5} transform="translate(3 3)" opacity={0.8} />
      <path d={car.frontWing.deck} fill="url(#b-tone-dark)" stroke={BLACK} strokeWidth={4} strokeLinejoin="round" />
      <path d={car.rearWing.top} fill="url(#b-tone-mid)" stroke={BLACK} strokeWidth={5} strokeLinejoin="round" />
      <path d={car.rearWing.pylon} fill={BLACK} />
      {car.rearWing.elements.map((d) => (
        <g key={d}>
          <Ink d={d} w={7} />
          <Ink d={d} w={2.5} c={WHITE} />
        </g>
      ))}
      {car.frontWing.elements.map((d) => (
        <g key={d}>
          <Ink d={d} w={7} />
          <Ink d={d} w={2.5} c={WHITE} />
        </g>
      ))}
      <Ink d={car.antenna} w={3} />
      <path d={car.tcam} fill={BLACK} />
      {/* body */}
      <path d={car.body} fill={bodyFill} />
      <g clipPath={`url(#${id}-body)`}>
        <path d={car.regions.cover} fill={band.cover} />
        <path d={car.regions.chassis} fill={band.chassis} />
        <path d={car.regions.sidepod} fill={band.sidepod} />
        <path d={car.regions.undercut} fill={band.undercut} />
        {car.glints.map((d) => (
          <path key={d} d={d} fill={WHITE} opacity={band.glint} />
        ))}
        {/* floodlight catching the upper edge */}
        <path d={car.body} fill="none" stroke={WHITE} strokeWidth={10} opacity={0.9} transform="translate(0 4)" />
      </g>
      {car.accents.map((a) => (
        <path key={a.d} d={a.d} fill={a.color} />
      ))}
      <path d={car.floor} fill={BLACK} />
      {car.panelLines.map((d) => (
        <g key={d}>
          <Ink d={d} w={6} />
          <Ink d={d} w={3} c={WHITE} />
        </g>
      ))}
      {car.bargeboards.map((d) => (
        <g key={d}>
          <Ink d={d} w={5} />
          <Ink d={d} w={1.8} c={WHITE} o={0.85} />
        </g>
      ))}
      {car.suspension.map((d) => (
        <g key={d}>
          <Ink d={d} w={7} />
          <Ink d={d} w={2} c={WHITE} o={0.7} />
        </g>
      ))}
      <Ink d={car.body} w={6} />
      {/* cockpit: helmet under the halo */}
      <circle cx={car.helmet.cx} cy={car.helmet.cy} r={car.helmet.r} fill={WHITE} stroke={BLACK} strokeWidth={5} />
      <path d={car.helmet.visor} fill={BLACK} />
      <path d={`M ${car.helmet.cx + 6} ${car.helmet.cy - car.helmet.r + 6} C ${car.helmet.cx + 20} ${car.helmet.cy - 20} ${car.helmet.cx + 26} ${car.helmet.cy - 6} ${car.helmet.cx + 24} ${car.helmet.cy + 8}`} fill="none" stroke={BLACK} strokeWidth={5} />
      <path d={car.halo} fill="none" stroke={BLACK} strokeWidth={22} strokeLinecap="round" strokeLinejoin="round" />
      <path d={car.halo} fill="none" stroke={WHITE} strokeWidth={4} strokeLinecap="round" transform="translate(0 -5)" />
      {car.haloAccent ? <path d={car.haloAccent.d} fill="none" stroke={car.haloAccent.color} strokeWidth={10} strokeLinecap="round" /> : null}
      <path d={car.mirror} fill={BLACK} stroke={WHITE} strokeWidth={2} />
      {/* wings, near side */}
      <path d={car.frontWing.near} fill={BLACK} />
      <path d={car.frontWing.near} fill="none" stroke={WHITE} strokeWidth={3} transform="translate(5 5)" />
      <path d={car.rearWing.near} fill={BLACK} />
      <path d={car.rearWing.near} fill="none" stroke={WHITE} strokeWidth={3} transform="translate(-5 5)" />
      {car.rearWing.beam.map((d) => (
        <Ink key={d} d={d} w={7} />
      ))}
      <path d={car.rainLight} fill="#ff2a2a" stroke={BLACK} strokeWidth={2} />
      {car.nearWheels.map((w) => (
        <NearWheel key={`n${w.cx}`} car={car} w={w} spin={spin} />
      ))}
    </g>
  );
};

// Places the car in a scene facing right, in car units (250 = 1 m) scaled by `scale`, with its ground line at `ground`.
export const MangaCar: React.FC<{ car: CarSpec; id: string; scheme: Scheme; x: number; ground: number; scale: number; spin?: number }> = ({
  car,
  id,
  scheme,
  x,
  ground,
  scale,
  spin,
}) => {
  const k = car.frame.k * scale;
  // Car-unit coordinates of the race number, so it reads unmirrored.
  const nx = (car.frame.x - car.number.x) * k;
  const ny = (car.number.y - car.frame.ground) * k;
  return (
    <g transform={`translate(${x} ${ground})`}>
      <ellipse cx={(car.frame.x - (car.nearWheels[0].cx + car.nearWheels[1].cx) / 2) * k} cy={2} rx={760 * scale} ry={14 * scale} fill={BLACK} />
      <g transform={`scale(${-k} ${k}) translate(${-car.frame.x} ${-car.frame.ground})`}>
        <MangaCarArt car={car} id={id} scheme={scheme} spin={spin} />
      </g>
      <text x={nx} y={ny} textAnchor="middle" fontFamily="Arial Black, Arial, sans-serif" fontWeight={900} fontSize={46 * k} fill={WHITE} stroke={BLACK} strokeWidth={3 * k} paintOrder="stroke" fontStyle="italic">
        {car.number.text}
      </text>
    </g>
  );
};
