// Speed in the side-on shots (MOT-5). The camera pans with the cars at their true speed, so everything on the ground
// moves past at speed × f / depth pixels per second — hundreds of pixels a frame near the camera. Like a broadcast
// camera with a slow shutter (or a manga artist's speed blur), near things are drawn as streaks as long as they move
// in a frame, far things stay sharp: the asphalt as streaked tone, the near kerb as a blurred stripe band, the far
// verge's tyre stacks and marker boards with smear trails. The cars themselves keep spinning, blurred wheels and a
// slight bounce.
import { random } from "remotion";
import { carPoint, type CarSpec } from "../../../cars";
import type { Camera, ScreenAnchor } from "../../../kit/camera";
import { INK, PAPER } from "../../../kit/colors";
import { tone } from "../../../kit/tone";

const FPS = 60;

// Screen pixels a ground point at depth z moves in one frame when the camera pans at `speed` m/s.
const perFrame = (cam: Camera, speed: number, z: number) =>
  (speed / FPS) * (cam.f / z);

// The asphalt between the far and near edges: light tone, with rows of streaks whose dashes run past at the speed of
// their depth (each dash at least as long as a frame's movement, so it reads as blur, not as jumping marks).
export const RoadFlow: React.FC<{
  cam: Camera;
  camX: number;
  speed: number;
  nearEdge: number;
  farEdge: number;
}> = ({ cam, camX, speed, nearEdge, farEdge }) => {
  const Y = (z: number) => cam.screenY(0, z);
  const rows: React.ReactNode[] = [];
  for (let z = farEdge - 0.3; z > nearEdge + 0.2; z -= 0.45) {
    const k = Math.round(z * 100);
    const move = perFrame(cam, speed, z);
    const dash = Math.max(40, move * (0.8 + 0.6 * random(`rd-${k}`)));
    const gap = dash * (1.5 + 3 * random(`rg-${k}`));
    const period = dash + gap;
    const offset = ((camX * cam.f) / z + random(`ro-${k}`) * period) % period;
    rows.push(
      <path
        key={k}
        d={`M -400 ${Y(z).toFixed(1)} L 2320 ${Y(z).toFixed(1)}`}
        stroke={INK}
        strokeWidth={Math.max(1, (0.05 * cam.f) / z)}
        strokeDasharray={`${dash.toFixed(1)} ${gap.toFixed(1)}`}
        strokeDashoffset={offset.toFixed(1)}
        opacity={0.18 + 0.2 * random(`rq-${k}`)}
      />,
    );
  }
  return (
    <g>
      <rect
        x={-400}
        y={Y(farEdge)}
        width={2720}
        height={Y(nearEdge) - Y(farEdge)}
        fill={tone("light")}
        opacity={0.8}
      />
      {rows}
      {/* white edge line just inside the far edge */}
      <path
        d={`M -400 ${Y(farEdge - 0.5)} L 2320 ${Y(farEdge - 0.5)}`}
        stroke={PAPER}
        strokeWidth={Math.max(2, (0.12 * cam.f) / farEdge)}
      />
    </g>
  );
};

// The near kerb at speed: red-and-white in real life, black-and-white here (ART-8 environment), blurred into a band
// of tone with streaks; the grass beyond it, nearest the camera, in light tone with blurred tufts.
export const NearKerb: React.FC<{
  cam: Camera;
  camX: number;
  speed: number;
  nearEdge: number;
}> = ({ cam, camX, speed, nearEdge }) => {
  const Y = (z: number) => cam.screenY(0, z);
  const kerbNear = nearEdge - 0.9;
  const move = perFrame(cam, speed, nearEdge);
  const tufts: React.ReactNode[] = [];
  for (let i = 0; i < 30; i++) {
    const z = kerbNear - 0.4 - random(`gt-z-${i}`) * 2.5;
    if (z <= 0.5) continue;
    const m = perFrame(cam, speed, z);
    const period = 2400;
    const x =
      ((((random(`gt-x-${i}`) * period - (camX * cam.f) / z) % period) +
        period) %
        period) -
      240;
    tufts.push(
      <path
        key={i}
        d={`M ${x.toFixed(1)} ${Y(z).toFixed(1)} l ${m.toFixed(1)} 0`}
        stroke={INK}
        strokeWidth={Math.max(2, (0.04 * cam.f) / z)}
        strokeLinecap="round"
        opacity={0.35}
      />,
    );
  }
  return (
    <g>
      <rect
        x={-400}
        y={Y(kerbNear)}
        width={2720}
        height={1400}
        fill={tone("light")}
      />
      {tufts}
      <rect
        x={-400}
        y={Y(nearEdge)}
        width={2720}
        height={Y(kerbNear) - Y(nearEdge)}
        fill={tone("mid")}
      />
      {/* the stripes smear into dashes as long as a frame's movement */}
      {[0.3, 0.55, 0.8].map((d, i) => (
        <path
          key={d}
          d={`M -400 ${Y(nearEdge - d * 0.9)} L 2320 ${Y(nearEdge - d * 0.9)}`}
          stroke={i === 1 ? PAPER : INK}
          strokeWidth={(0.12 * cam.f) / nearEdge}
          strokeDasharray={`${move.toFixed(0)} ${(move * 0.7).toFixed(0)}`}
          strokeDashoffset={(
            ((camX * cam.f) / nearEdge) %
            (move * 1.7)
          ).toFixed(1)}
          opacity={0.7}
        />
      ))}
      <path
        d={`M -400 ${Y(nearEdge)} L 2320 ${Y(nearEdge)}`}
        stroke={INK}
        strokeWidth={3}
      />
      <path
        d={`M -400 ${Y(kerbNear)} L 2320 ${Y(kerbNear)}`}
        stroke={INK}
        strokeWidth={4}
      />
    </g>
  );
};

// Trackside dressing on the far verge, as in 1989 footage: stacks of old tyres in front of the Armco, plain marker
// boards (no logos, ART-5) and a marshal post. Each is drawn with a short smear trail (the shutter's blur).
export const FarVerge: React.FC<{
  cam: Camera;
  camX: number;
  speed: number;
  z: number;
}> = ({ cam, camX, speed, z }) => {
  const ppm = cam.pxPerMetre(z);
  const move = perFrame(cam, speed, z);
  const items: React.ReactNode[] = [];
  const PERIOD = 40; // m: a tyre stack, a board and a post every 40 m
  const x0 = Math.floor((camX - (cam.cx * z) / cam.f) / PERIOD) - 1;
  const x1 = Math.ceil((camX + ((1920 - cam.cx) * z) / cam.f) / PERIOD) + 1;
  const ground = cam.screenY(0, z);
  for (let k = x0; k <= x1; k++) {
    const base = k * PERIOD - camX;
    const draw = (
      dx: number,
      node: (sx: number) => React.ReactNode,
      key: string,
    ) => {
      const sx = cam.screenX(base + dx, z);
      items.push(
        <g key={`${key}-${k}`}>
          {[0.66, 0.33].map((s) => (
            <g
              key={s}
              opacity={0.18}
              transform={`translate(${(-move * s).toFixed(1)} 0)`}
            >
              {node(sx)}
            </g>
          ))}
          {node(sx)}
        </g>,
      );
    };
    // tyre stack: 3 high, 4 wide, seen side-on
    draw(
      0,
      (sx) => (
        <g>
          {Array.from({ length: 12 }, (_, i) => {
            const col = i % 4;
            const row = Math.floor(i / 4);
            return (
              <rect
                key={i}
                x={sx + col * 0.62 * ppm}
                y={ground - (row + 1) * 0.24 * ppm}
                width={0.6 * ppm}
                height={0.23 * ppm}
                rx={0.08 * ppm}
                fill={INK}
                stroke={PAPER}
                strokeWidth={1}
              />
            );
          })}
        </g>
      ),
      "tyres",
    );
    // marker board on a post: a plain white board with black bars
    draw(
      14,
      (sx) => (
        <g>
          <rect
            x={sx}
            y={ground - 1.6 * ppm}
            width={0.08 * ppm}
            height={1.6 * ppm}
            fill={INK}
          />
          <rect
            x={sx - 0.7 * ppm}
            y={ground - 2.2 * ppm}
            width={1.5 * ppm}
            height={0.7 * ppm}
            fill={PAPER}
            stroke={INK}
            strokeWidth={2}
          />
          {[0, 1, 2].slice(0, 1 + (Math.abs(k) % 3)).map((b) => (
            <rect
              key={b}
              x={sx - 0.55 * ppm + b * 0.45 * ppm}
              y={ground - 2.2 * ppm}
              width={0.18 * ppm}
              height={0.7 * ppm}
              fill={INK}
            />
          ))}
        </g>
      ),
      "board",
    );
    // marshal post: a small hut with a flag pole
    if (Math.abs(k) % 2 === 0)
      draw(
        26,
        (sx) => (
          <g>
            <rect
              x={sx}
              y={ground - 1.9 * ppm}
              width={1.6 * ppm}
              height={1.9 * ppm}
              fill={tone("mid")}
              stroke={INK}
              strokeWidth={2}
            />
            <rect
              x={sx - 0.1 * ppm}
              y={ground - 2.1 * ppm}
              width={1.8 * ppm}
              height={0.25 * ppm}
              fill={INK}
            />
            <rect
              x={sx + 0.4 * ppm}
              y={ground - 1.4 * ppm}
              width={0.8 * ppm}
              height={0.5 * ppm}
              fill={PAPER}
              stroke={INK}
              strokeWidth={1.5}
            />
          </g>
        ),
        "post",
      );
  }
  return <g>{items}</g>;
};

// A car's near-side wheels at speed: the spokes blur into concentric rings over the rim, and a few arcs streak round
// the tyre — drawn over the car at its near wheel centres.
export const WheelBlur: React.FC<{
  car: CarSpec;
  at: ScreenAnchor;
  spin: number;
}> = ({ car, at, spin }) => {
  const k = car.frame.k / 250; // photo px → metres
  const rim = car.rimR * k * at.pxPerMetre;
  return (
    <g>
      {(["frontAxle", "rearAxle"] as const).map((axle, i) => {
        const p = carPoint(car, axle);
        const cx = at.x + p.x * at.pxPerMetre;
        const cy = at.y - p.y * at.pxPerMetre;
        const tyre = car.nearWheels[i].r * k * at.pxPerMetre;
        const a0 = spin + i * 40;
        const arc = (r: number, from: number, len: number) => {
          const a = (from * Math.PI) / 180;
          const b = ((from + len) * Math.PI) / 180;
          return `M ${cx + Math.cos(a) * r} ${cy + Math.sin(a) * r} A ${r} ${r} 0 0 1 ${cx + Math.cos(b) * r} ${cy + Math.sin(b) * r}`;
        };
        return (
          <g key={axle}>
            <circle
              cx={cx}
              cy={cy}
              r={rim}
              fill={tone("mid")}
              stroke={INK}
              strokeWidth={3}
            />
            {[0.35, 0.6, 0.85].map((f) => (
              <circle
                key={f}
                cx={cx}
                cy={cy}
                r={rim * f}
                fill="none"
                stroke={PAPER}
                strokeWidth={1.5}
                opacity={0.7}
              />
            ))}
            <circle cx={cx} cy={cy} r={rim * 0.18} fill={INK} />
            {[0, 120, 240].map((d) => (
              <path
                key={d}
                d={arc(tyre * 0.86, a0 + d, 70)}
                fill="none"
                stroke="#5a5a5a"
                strokeWidth={2.5}
                strokeLinecap="round"
              />
            ))}
          </g>
        );
      })}
    </g>
  );
};

// A small, quick vertical bounce of a car body (kerbs, bumps): screen px and pitch degrees at time t.
export const bounce = (t: number, seed: number) => ({
  dy: 1.6 * Math.sin(t * 47 + seed) + 0.9 * Math.sin(t * 83 + seed * 2.1),
  tilt: 0.25 * Math.sin(t * 31 + seed * 0.7),
});
