// PROTOTYPE — renders a traced CarSpec as a manga panel car: real livery colours as flat fills,
// screentone dots for shading, inked outlines and white highlights. Layers go far side → body → near side.
// Expects the parent SVG to define the screentone patterns `b-tone-dark` and `b-tone-light` (used for rims and far tyres).
import type { CarSpec, Wheel } from "./cars-2021";

const WHITE = "#fbfaf6";
const BLACK = "#0d0d0d";

const Ink: React.FC<{ d: string; w: number; c?: string; o?: number }> = ({ d, w, c = BLACK, o = 1 }) => (
  <path d={d} fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" opacity={o} />
);

// Transparent dot screen laid over a flat colour to shade it.
const Dots: React.FC<{ id: string; r: number; gap?: number }> = ({ id, r, gap = 9 }) => (
  <pattern id={id} width={gap} height={gap} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
    <circle cx={gap / 2} cy={gap / 2} r={r} fill={BLACK} />
  </pattern>
);

const spokePath = (w: Wheel, r: number, n: number) =>
  Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    return `M ${w.cx + Math.cos(a) * r * 0.22} ${w.cy + Math.sin(a) * r * 0.22} L ${w.cx + Math.cos(a) * r * 0.94} ${w.cy + Math.sin(a) * r * 0.94}`;
  }).join(" ");

const NearWheel: React.FC<{ car: CarSpec; w: Wheel; spin: number }> = ({ car, w, spin }) => (
  <g>
    <circle cx={w.cx} cy={w.cy} r={w.r} fill={BLACK} />
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
    <path d={`M ${w.cx + w.r * 0.15} ${w.cy - w.r * 0.9} A ${w.r * 0.92} ${w.r * 0.92} 0 0 1 ${w.cx + w.r * 0.85} ${w.cy - w.r * 0.32}`} fill="none" stroke={WHITE} strokeWidth={6} strokeLinecap="round" />
  </g>
);

const FarWheel: React.FC<{ w: Wheel }> = ({ w }) => (
  <g>
    <circle cx={w.cx} cy={w.cy} r={w.r} fill={BLACK} />
    <circle cx={w.cx} cy={w.cy} r={w.r * 0.62} fill="url(#b-tone-dark)" stroke="#2c2c2c" strokeWidth={3} />
    {[-0.5, -0.25, 0, 0.25, 0.5].map((t) => (
      <path key={t} d={`M ${w.cx + Math.sin(t) * w.r * 0.66} ${w.cy - Math.cos(t) * w.r * 0.66} L ${w.cx + Math.sin(t) * w.r * 0.97} ${w.cy - Math.cos(t) * w.r * 0.97}`} stroke="#3a3a3a" strokeWidth={3} />
    ))}
    <path d={`M ${w.cx - w.r * 0.2} ${w.cy - w.r * 0.94} A ${w.r * 0.95} ${w.r * 0.95} 0 0 1 ${w.cx + w.r * 0.7} ${w.cy - w.r * 0.6}`} fill="none" stroke={WHITE} strokeWidth={4} opacity={0.8} />
  </g>
);

// Side-view race helmet in photo space (facing left): shell with chin bar, tinted visor, livery stripes,
// top air intake and rear spoiler, shaded with dots. Sized like a real helmet (about 0.29 m long).
const Helmet: React.FC<{ cx: number; cy: number; r: number; base: string; stripe: string; id: string }> = ({ cx, cy, r, base, stripe, id }) => {
  const P = (x: number, y: number) => `${cx + x * r} ${cy + y * r}`;
  const shell = `M ${P(-0.98, 0.45)} C ${P(-1.08, -0.1)} ${P(-0.75, -0.98)} ${P(0.05, -1)} C ${P(0.7, -1)} ${P(1.05, -0.55)} ${P(1.02, 0.05)} L ${P(0.95, 0.6)} L ${P(-0.6, 0.7)} Z`;
  return (
    <g>
      <defs>
        <clipPath id={`${id}-helmet`}>
          <path d={shell} />
        </clipPath>
      </defs>
      <path d={`M ${P(0.75, -0.75)} L ${P(1.02, -0.82)} L ${P(1.06, -0.58)} Z`} fill={base} stroke={BLACK} strokeWidth={3} strokeLinejoin="round" />
      <path d={`M ${P(-0.16, -0.99)} L ${P(-0.12, -1.12)} L ${P(0.2, -1.12)} L ${P(0.24, -0.99)} Z`} fill={BLACK} />
      <path d={shell} fill={base} />
      <g clipPath={`url(#${id}-helmet)`}>
        <path d={`M ${P(-0.75, -0.7)} C ${P(-0.2, -0.95)} ${P(0.5, -0.86)} ${P(1, -0.32)}`} fill="none" stroke={stripe} strokeWidth={r * 0.2} />
        <path d={`M ${P(0.1, -0.02)} C ${P(0.45, -0.04)} ${P(0.8, 0.02)} ${P(1.05, 0.18)}`} fill="none" stroke={stripe} strokeWidth={r * 0.13} />
        <path d={`M ${P(-0.2, 0.15)} L ${P(1.1, 0.15)} L ${P(1.1, 0.9)} L ${P(-1.1, 0.9)} Z`} fill={`url(#${id}-dm)`} opacity={0.45} />
      </g>
      <path
        d={`M ${P(-1, -0.12)} C ${P(-0.95, -0.42)} ${P(-0.6, -0.5)} ${P(-0.1, -0.46)} L ${P(0.12, -0.1)} C ${P(-0.3, 0.02)} ${P(-0.75, 0.05)} ${P(-1, 0.08)} Z`}
        fill="#15132a"
        stroke={BLACK}
        strokeWidth={3}
        strokeLinejoin="round"
      />
      <path d={`M ${P(-0.85, -0.34)} C ${P(-0.6, -0.42)} ${P(-0.3, -0.42)} ${P(-0.08, -0.38)}`} fill="none" stroke={WHITE} strokeWidth={3} strokeLinecap="round" opacity={0.85} />
      <path d={`M ${P(-0.88, 0.3)} L ${P(-0.62, 0.3)} M ${P(-0.86, 0.44)} L ${P(-0.6, 0.44)}`} stroke={BLACK} strokeWidth={3} strokeLinecap="round" />
      <path d={`M ${P(-0.55, -0.82)} C ${P(-0.3, -0.95)} ${P(0, -0.98)} ${P(0.25, -0.95)}`} fill="none" stroke={WHITE} strokeWidth={4} strokeLinecap="round" opacity={0.9} />
      <path d={shell} fill="none" stroke={BLACK} strokeWidth={4.5} strokeLinejoin="round" />
    </g>
  );
};

const WingHalf: React.FC<{ deck: string; fill: string; flaps: CarSpec["frontWing"]["farFlaps"]; lines: string[] }> = ({ deck, fill, flaps, lines }) => (
  <g>
    <path d={deck} fill={fill} />
    {flaps.map((a) => (
      <path key={a.d} d={a.d} fill={a.color} />
    ))}
    {lines.map((d) => (
      <Ink key={d} d={d} w={3.5} />
    ))}
    <path d={deck} fill="none" stroke={BLACK} strokeWidth={4} strokeLinejoin="round" />
  </g>
);

// Draws in the reference photo's own pixel space (car facing left); MangaCar flips and places it.
export const MangaCarArt: React.FC<{ car: CarSpec; id: string; spin?: number }> = ({ car, id, spin = 0 }) => {
  const p = car.paint;
  const fw = car.frontWing;
  return (
    <g>
      <defs>
        <clipPath id={`${id}-body`}>
          <path d={car.body} />
        </clipPath>
        <Dots id={`${id}-dl`} r={1.4} />
        <Dots id={`${id}-dm`} r={2.3} />
        <Dots id={`${id}-dd`} r={3.2} />
      </defs>

      {/* far side */}
      {car.farWheels.map((w) => (
        <FarWheel key={`f${w.cx}`} w={w} />
      ))}
      <path d={fw.far} fill={p.wing} stroke={BLACK} strokeWidth={4} />
      <WingHalf deck={fw.farDeck} fill={p.frontDeck} flaps={fw.farFlaps} lines={fw.farLines} />
      <path d={car.rearWing.top} fill={p.rearTop} stroke={BLACK} strokeWidth={5} strokeLinejoin="round" />
      <path d={car.rearWing.top} fill={`url(#${id}-dl)`} opacity={0.6} />
      <path d={car.rearWing.pylon} fill={BLACK} />
      {car.rearWing.elements.map((d) => (
        <Ink key={d} d={d} w={5} />
      ))}
      <Ink d={car.antenna} w={3} />
      <path d={car.tcam} fill={BLACK} />

      {/* cockpit, seen through the open halo: far halo bar, headrest, driver */}
      <path d={car.haloFar} fill="none" stroke={BLACK} strokeWidth={14} strokeLinecap="round" />
      <path d={car.haloFar} fill="none" stroke={p.chassis} strokeWidth={7} strokeLinecap="round" />
      <ellipse cx={car.cockpit.hans.cx} cy={car.cockpit.hans.cy} rx={car.cockpit.hans.rx} ry={car.cockpit.hans.ry} fill="#1b1b1e" stroke={BLACK} strokeWidth={3} />
      <Helmet cx={car.helmet.cx} cy={car.helmet.cy} r={car.helmet.r} base={p.helmet} stripe={p.helmetStripe} id={id} />
      <path d={car.cockpit.headrest} fill={p.chassis} stroke={BLACK} strokeWidth={4} strokeLinejoin="round" />

      {/* body: livery colour per form region, then dot shading */}
      <path d={car.body} fill={p.sidepod} />
      <g clipPath={`url(#${id}-body)`}>
        <path d={car.regions.cover} fill={p.cover} />
        <path d={car.regions.chassis} fill={p.chassis} />
        <path d={car.regions.sidepod} fill={p.sidepod} />
        <path d={car.regions.undercut} fill={p.undercut} />
        {car.livery.map((a) => (
          <path key={a.d} d={a.d} fill={a.color} />
        ))}
        <path d={car.regions.chassis} fill={`url(#${id}-dl)`} opacity={0.5} />
        <path d={car.regions.sidepod} fill={`url(#${id}-dm)`} opacity={0.55} />
        <path d={car.regions.undercut} fill={`url(#${id}-dd)`} opacity={0.6} />
        {car.accents.map((a) => (
          <path key={a.d} d={a.d} fill={a.color} />
        ))}
        {car.glints.map((d) => (
          <path key={d} d={d} fill={WHITE} opacity={0.85} />
        ))}
        {/* floodlight catching the upper edge */}
        <path d={car.body} fill="none" stroke={WHITE} strokeWidth={10} opacity={0.85} transform="translate(0 4)" />
      </g>
      <path d={car.floor} fill={BLACK} />
      {car.panelLines.map((d) => (
        <g key={d}>
          <Ink d={d} w={6} />
          <Ink d={d} w={2.6} c={WHITE} o={0.8} />
        </g>
      ))}
      {car.suspension.map((d) => (
        <Ink key={d} d={d} w={6} />
      ))}
      <Ink d={car.body} w={6} />

      {/* near side: halo bar, mirror, front wing half and endplates, rear wing */}
      <path d={car.halo} fill="none" stroke={BLACK} strokeWidth={16} strokeLinecap="round" strokeLinejoin="round" />
      <path d={car.halo} fill="none" stroke={p.chassis} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />
      <path d={car.halo} fill="none" stroke={WHITE} strokeWidth={3} strokeLinecap="round" transform="translate(0 -3)" />
      {car.haloAccent ? <path d={car.haloAccent.d} fill="none" stroke={car.haloAccent.color} strokeWidth={8} strokeLinecap="round" /> : null}
      <path d={car.mirror} fill={p.chassis} stroke={BLACK} strokeWidth={3} />
      {fw.nearDeck ? <WingHalf deck={fw.nearDeck} fill={p.frontDeck} flaps={fw.nearFlaps} lines={fw.nearLines} /> : null}
      <path d={fw.near} fill={p.wing} stroke={BLACK} strokeWidth={5} strokeLinejoin="round" />
      <path d={car.rearWing.near} fill={p.wing} stroke={BLACK} strokeWidth={5} strokeLinejoin="round" />
      {car.wingLivery.map((a) => (
        <path key={a.d} d={a.d} fill={a.color} stroke={BLACK} strokeWidth={4} strokeLinejoin="round" />
      ))}
      {car.rearWing.beam.slice(0, 1).map((d) => (
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
export const MangaCar: React.FC<{ car: CarSpec; id: string; x: number; ground: number; scale: number; spin?: number }> = ({ car, id, x, ground, scale, spin }) => {
  const k = car.frame.k * scale;
  // Car-unit coordinates of the race number, so it reads unmirrored.
  const nx = (car.frame.x - car.number.x) * k;
  const ny = (car.number.y - car.frame.ground) * k;
  return (
    <g transform={`translate(${x} ${ground})`}>
      <ellipse cx={(car.frame.x - (car.nearWheels[0].cx + car.nearWheels[1].cx) / 2) * k} cy={2} rx={760 * scale} ry={14 * scale} fill={BLACK} />
      <g transform={`scale(${-k} ${k}) translate(${-car.frame.x} ${-car.frame.ground})`}>
        <MangaCarArt car={car} id={id} spin={spin} />
      </g>
      <text x={nx} y={ny} textAnchor="middle" fontFamily="Arial Black, Arial, sans-serif" fontWeight={900} fontSize={46 * k} fill={WHITE} stroke={BLACK} strokeWidth={3 * k} paintOrder="stroke" fontStyle="italic">
        {car.number.text}
      </text>
    </g>
  );
};
