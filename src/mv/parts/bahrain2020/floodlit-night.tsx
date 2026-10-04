// The night over the run into the barrier (shot 3.3, before the freeze). The camera is low at the trackside, so the
// upper frame is all sky. It shows a dark sky hazed toward the horizon, the grandstands' silhouettes far behind the
// barrier, and the floodlight towers with their lamp banks and light cones falling toward the track. The top of the
// frame is the floodlit circuit, not an empty band (user review 2026-10-04). Black and white only (ART-8); the lamp
// banks are drawn like NightBackdrop's (night.tsx), every piece through the shot's pinhole camera (ART-9).
import type { Camera } from "../../../kit/camera";
import { INK, PAPER } from "../../../kit/colors";
import { tone } from "../../../kit/tone";

// towers far behind the barrier (world metres), each with the point on the ground its lamps aim at
const TOWERS = [
  { x: -72, z: 150, aim: { x: -55, z: 85 } },
  { x: -26, z: 124, aim: { x: -18, z: 70 } },
  { x: 21, z: 136, aim: { x: 14, z: 80 } },
  { x: 66, z: 160, aim: { x: 48, z: 100 } },
  { x: 112, z: 192, aim: { x: 90, z: 125 } },
];
const TOWER_H = 28; // m
// grandstands: x from, x to, depth, height (m)
const STANDS: [number, number, number, number][] = [
  [-170, -38, 118, 14],
  [-30, 14, 128, 17],
  [24, 96, 140, 12],
];

export const FloodlitNight: React.FC<{
  cam: Camera;
  tonePrefix: string;
  // names this drawing's gradients
  id: string;
}> = ({ cam, tonePrefix, id }) => {
  const sky = cam.horizon;
  const hazeTop = cam.screenY(30, 140);
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={INK} />
          <stop offset="0.55" stopColor="#141414" />
          <stop offset="1" stopColor="#2e2e2e" />
        </linearGradient>
        <linearGradient id={`${id}-cone`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={PAPER} stopOpacity={0.13} />
          <stop offset="1" stopColor={PAPER} stopOpacity={0} />
        </linearGradient>
        <radialGradient id={`${id}-glow`}>
          <stop offset="0" stopColor={PAPER} stopOpacity={0.4} />
          <stop offset="0.4" stopColor={PAPER} stopOpacity={0.12} />
          <stop offset="1" stopColor={PAPER} stopOpacity={0} />
        </radialGradient>
        <linearGradient id={`${id}-haze`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={PAPER} stopOpacity={0} />
          <stop offset="1" stopColor={PAPER} stopOpacity={0.1} />
        </linearGradient>
      </defs>
      {/* the sky, lifting into the floodlights' haze toward the horizon */}
      <rect
        x={-400}
        y={-400}
        width={2720}
        height={sky + 400}
        fill={`url(#${id}-sky)`}
      />
      {/* the light cones, behind the stands' silhouettes */}
      {TOWERS.map((t) => {
        const lamp = cam.project({ x: t.x, y: TOWER_H + 1, z: t.z });
        const w = cam.pxPerMetre(t.z) * 2.6;
        const g0 = cam.project({ x: t.aim.x - 7, y: 0, z: t.aim.z });
        const g1 = cam.project({ x: t.aim.x + 7, y: 0, z: t.aim.z });
        return (
          <path
            key={`c${t.x}`}
            d={`M ${lamp.x - w} ${lamp.y} L ${lamp.x + w} ${lamp.y} L ${g1.x} ${g1.y} L ${g0.x} ${g0.y} Z`}
            fill={`url(#${id}-cone)`}
          />
        );
      })}
      {/* grandstands: dark silhouettes, their tiers, the roof on its columns with a pale edge */}
      {STANDS.map(([x0, x1, z, h]) => {
        const a = cam.project({ x: x0, y: 0, z });
        const b = cam.project({ x: x1, y: 0, z });
        const top = cam.screenY(h, z);
        const eave = cam.screenY(h - 2.5, z);
        const back = cam.screenY(h * 0.55, z);
        const k = cam.pxPerMetre(z);
        const tiers = Array.from({ length: 5 }, (_, i) =>
          cam.screenY(h * 0.55 * (1 - (i + 1) / 6), z),
        );
        return (
          <g key={x0}>
            <path
              d={`M ${a.x} ${a.y} L ${a.x} ${back} L ${b.x} ${back} L ${b.x} ${b.y} Z`}
              fill="#161616"
            />
            {tiers.map((y) => (
              <path
                key={y}
                d={`M ${a.x} ${y} L ${b.x} ${y}`}
                stroke="#2c2c2c"
                strokeWidth={1.5}
              />
            ))}
            {[0.08, 0.36, 0.64, 0.92].map((u) => {
              const x = a.x + (b.x - a.x) * u;
              return (
                <path
                  key={u}
                  d={`M ${x} ${back} L ${x} ${eave}`}
                  stroke="#161616"
                  strokeWidth={Math.max(2, k * 0.5)}
                />
              );
            })}
            <path
              d={`M ${a.x - k * 2} ${eave} L ${a.x - k} ${top} L ${b.x + k} ${top} L ${b.x + k * 2} ${eave} Z`}
              fill="#1c1c1c"
              stroke="#3e3e3e"
              strokeWidth={1.5}
            />
          </g>
        );
      })}
      {/* the floodlight towers: a mast, the lamp bank in its own glow */}
      {TOWERS.map((t) => {
        const top = cam.project({ x: t.x, y: TOWER_H, z: t.z });
        const base = cam.project({ x: t.x, y: 0, z: t.z });
        const w = cam.pxPerMetre(t.z) * 0.6;
        return (
          <g key={t.x}>
            <path
              d={`M ${base.x - w} ${base.y} L ${top.x - w * 0.4} ${top.y} L ${top.x + w * 0.4} ${top.y} L ${base.x + w} ${base.y} Z`}
              fill="#242424"
            />
            <ellipse
              cx={top.x}
              cy={top.y - w}
              rx={w * 16}
              ry={w * 10}
              fill={`url(#${id}-glow)`}
            />
            <rect
              x={top.x - w * 3}
              y={top.y - w * 2.2}
              width={w * 6}
              height={w * 2.2}
              fill={PAPER}
              stroke={INK}
              strokeWidth={2}
            />
            {[-2, -1, 0, 1, 2].map((i) => (
              <path
                key={i}
                d={`M ${top.x + i * w * 1.1} ${top.y - w * 2.2} L ${top.x + i * w * 1.1} ${top.y}`}
                stroke={INK}
                strokeWidth={1.5}
              />
            ))}
          </g>
        );
      })}
      {/* the haze over the far side of the circuit, lit from above */}
      <rect
        x={-400}
        y={hazeTop}
        width={2720}
        height={sky - hazeTop}
        fill={`url(#${id}-haze)`}
      />
      {/* the asphalt and run-off */}
      <rect
        x={-400}
        y={sky}
        width={2720}
        height={1480 - sky}
        fill={tone("dark", tonePrefix)}
      />
    </g>
  );
};
