// Yas Marina at night, seen from the outside of the track by the panel's pinhole camera (ART-9): sky, the Yas hotel
// gridshell far away, distant buildings, grandstands with the crowd, floodlight beams, catch fence, concrete wall,
// run-off, kerbs and the racing surface. This is the settled background of the T5 panel (style-b-manga-v2.png),
// generalised so it can scroll: `camX` is how far the camera has tracked along the track (m, + = with the cars, who
// drive to the right), and every element shifts by f·camX/z — near things fast, the hotel barely (true parallax).
// With the T5 layout and camX = 0 it draws exactly the settled frame.
import { INK, PAPER } from "../../kit/colors";
import type { Camera } from "../../kit/camera";
import { focusLines } from "../../kit/lines";
import { tone } from "../../kit/tone";

export const WALL_Z = 25;
export const STAND_Z = 45;

export type Stand = {
  x0: number;
  x1: number;
  /** First spectator's x and how many per row (defaults: from x0 + 8, filling to x1 − 1.5). */
  crowdFrom?: number;
  crowdN?: number;
};

export type TracksideLayout = {
  stands: readonly Stand[];
  /** Distant buildings: index range of the generator below (wider ranges add more to the right/left). */
  buildings: readonly [number, number];
  hotel?: { x0: number; x1: number; z: number; top: number };
  /** Floodlight towers above the frame, world x at z = 30, each with a beam strength. */
  beams: readonly (readonly [number, number])[];
};

// The settled T5 frame.
export const T5_LAYOUT: TracksideLayout = {
  stands: [{ x0: -70, x1: -3, crowdFrom: -62, crowdN: 110 }],
  buildings: [0, 8],
  hotel: { x0: 2, x1: 64, z: 420, top: 30 },
  beams: [
    [(-120 - 960) * (30 / 2500), 0.9],
    [(520 - 960) * (30 / 2500), 0.7],
  ],
};

const BEAM_Z = 30;

// Index range covering a window of world x for an element repeating every `period` m from `origin`.
const span = (
  camX: number,
  base: readonly [number, number],
  origin: number,
  period: number,
  z: number,
  cam: Camera,
): [number, number] => {
  if (camX === 0) return [base[0], base[1]];
  const halfW = ((cam.cx + 400) * z) / cam.f; // half the visible width at depth z, m, with margin
  const lo = Math.floor((camX - halfW - origin) / period);
  const hi = Math.ceil((camX + halfW - origin) / period);
  return [lo, hi];
};
const range = ([lo, hi]: [number, number]) =>
  Array.from({ length: hi - lo + 1 }, (_, i) => lo + i);

// Diagonal lattice (catch fence mesh, hotel gridshell) filling a box.
export const lattice = (
  x0: number,
  x1: number,
  y0: number,
  y1: number,
  step: number,
) => {
  const out: string[] = [];
  const h = y1 - y0;
  for (let x = x0 - h; x < x1 + h; x += step) {
    out.push(`M ${x} ${y1} L ${x + h} ${y0}`);
    out.push(`M ${x} ${y0} L ${x + h} ${y1}`);
  }
  return out.join(" ");
};

export const hotelShellD = (
  cam: Camera,
  h: NonNullable<TracksideLayout["hotel"]>,
  camX: number,
) => {
  const z = h.z;
  const [x0, x1, top] = [h.x0, h.x1, h.top];
  const X = (x: number) => cam.screenX(x - camX, z);
  const Y = (y: number) => cam.screenY(y, z);
  return `M ${X(x0)} ${Y(0)} C ${X(x0 + 6)} ${Y(top * 0.9)} ${X(x0 + 20)} ${Y(top)} ${X((x0 + x1) / 2)} ${Y(top)} C ${X(x1 - 20)} ${Y(top)} ${X(x1 - 6)} ${Y(top * 0.9)} ${X(x1)} ${Y(0)} Z`;
};

/** Clip paths the background needs; put inside the page's <defs>. */
export const TracksideDefs: React.FC<{
  cam: Camera;
  layout: TracksideLayout;
  camX: number;
  prefix: string;
}> = ({ cam, layout, camX, prefix }) => (
  <>
    <clipPath id={`${prefix}-ground`}>
      <rect x={-200} y={cam.screenY(0, 13.9)} width={2320} height={800} />
    </clipPath>
    <clipPath id={`${prefix}-fence`}>
      <rect x={-200} y={-200} width={2320} height={580} />
    </clipPath>
    {layout.hotel ? (
      <clipPath id={`${prefix}-shell`}>
        <path d={hotelShellD(cam, layout.hotel, camX)} />
      </clipPath>
    ) : null}
  </>
);

const STAND_ROWS = Array.from({ length: 26 }, (_, k) => ({
  z: STAND_Z + k * 0.8,
  y: k * 0.45,
}));

// Grandstand tiers rising away from the camera, with a head-and-shoulders crowd on each row.
const Grandstand: React.FC<{ cam: Camera; stand: Stand; camX: number }> = ({
  cam,
  stand,
  camX,
}) => {
  const X = (x: number, z: number) => cam.screenX(x - camX, z);
  const from = stand.crowdFrom ?? stand.x0 + 8;
  const n = stand.crowdN ?? Math.floor((stand.x1 - 1.5 - from) / 0.55) + 1;
  return (
    <g>
      {STAND_ROWS.slice(0, -1).map((row, k) => {
        const next = STAND_ROWS[k + 1];
        const d = `M ${X(stand.x0, row.z)} ${cam.screenY(row.y, row.z)} L ${X(stand.x1, row.z)} ${cam.screenY(row.y, row.z)} L ${X(stand.x1, next.z)} ${cam.screenY(next.y, next.z)} L ${X(stand.x0, next.z)} ${cam.screenY(next.y, next.z)} Z`;
        return (
          <path
            key={k}
            d={d}
            fill={k % 2 ? tone("mid") : tone("dark")}
            stroke={INK}
            strokeWidth={1.5}
          />
        );
      })}
      {STAND_ROWS.slice(0, -1).map((row, k) =>
        Array.from({ length: n }, (_, i) => {
          const x = from + i * 0.55 + ((k * 7 + i * 3) % 5) * 0.06;
          if ((i * 13 + k * 7) % 11 === 0) return null;
          const head = cam.pxPerMetre(row.z) * 0.11;
          const cx = X(x, row.z);
          if (camX !== 0 && (cx < -300 || cx > 2220)) return null;
          const cy = cam.screenY(row.y + 0.95, row.z);
          return (
            <g key={`${k}-${i}`}>
              <ellipse
                cx={cx}
                cy={cy + head * 2.2}
                rx={head * 1.6}
                ry={head * 1.2}
                fill={(i + k) % 3 ? PAPER : INK}
                stroke={INK}
                strokeWidth={1}
              />
              <circle
                cx={cx}
                cy={cy}
                r={head}
                fill={PAPER}
                stroke={INK}
                strokeWidth={1.2}
              />
            </g>
          );
        }),
      )}
    </g>
  );
};

export const Background: React.FC<{
  cam: Camera;
  layout: TracksideLayout;
  camX: number;
  prefix: string;
  /** 0..1: how lit the hotel's gridshell is (1 = the settled frame). */
  hotelGlow?: number;
}> = ({ cam, layout, camX, prefix, hotelGlow = 1 }) => {
  const X = (x: number, z: number) => cam.screenX(x - camX, z);
  const visibleStands = layout.stands.filter((s) => {
    if (camX === 0) return true;
    return X(s.x1, STAND_Z) > -400 && X(s.x0, STAND_Z + 20) < 2320;
  });
  return (
    <g>
      <rect
        x={-200}
        y={-200}
        width={2320}
        height={cam.horizon + 200}
        fill={INK}
      />
      {/* distant circuit buildings between the horizon and the wall */}
      <rect
        x={-200}
        y={cam.horizon}
        width={2320}
        height={cam.screenY(1, WALL_Z) - cam.horizon}
        fill={tone("dark")}
      />
      {range(span(camX, layout.buildings, -10, 9, 160, cam)).map((i) => {
        const m = ((i % 12) + 12) % 12;
        const z = 160 + (m % 3) * 40;
        const x0 = -10 + i * 9;
        const h = 8 + (m % 4) * 5;
        return (
          <path
            key={i}
            d={`M ${X(x0, z)} ${cam.screenY(0, z)} L ${X(x0, z)} ${cam.screenY(h, z)} L ${X(x0 + 7, z)} ${cam.screenY(h, z)} L ${X(x0 + 7, z)} ${cam.screenY(0, z)} Z`}
            fill={INK}
          />
        );
      })}
      {/* Yas hotel: glowing gridshell far beyond the circuit */}
      {layout.hotel ? (
        <>
          <path d={hotelShellD(cam, layout.hotel, camX)} fill={INK} />
          <g
            clipPath={`url(#${prefix}-shell)`}
            opacity={hotelGlow === 1 ? undefined : hotelGlow}
          >
            <path
              d={lattice(
                X(layout.hotel.x0, layout.hotel.z),
                X(layout.hotel.x1, layout.hotel.z),
                cam.screenY(layout.hotel.top, layout.hotel.z),
                cam.screenY(0, layout.hotel.z),
                16,
              )}
              stroke={PAPER}
              strokeWidth={1.6}
              fill="none"
            />
          </g>
          <path
            d={hotelShellD(cam, layout.hotel, camX)}
            fill="none"
            stroke={PAPER}
            strokeWidth={2.5}
          />
        </>
      ) : null}
      {visibleStands.map((s) => (
        <Grandstand key={s.x0} cam={cam} stand={s} camX={camX} />
      ))}
      {/* floodlight beams falling from towers above the frame */}
      {layout.beams.map(([bx, o]) => {
        const x = X(bx, BEAM_Z);
        if (camX !== 0 && (x < -1500 || x > 2200)) return null;
        return (
          <path
            key={bx}
            d={`M ${x} -60 L ${x + 900} ${cam.screenY(1, WALL_Z)} L ${x + 1200} ${cam.screenY(1, WALL_Z)} L ${x + 160} -60 Z`}
            fill={PAPER}
            opacity={0.16 * o}
          />
        );
      })}
      {/* catch fence on the wall: mesh, posts and cables run up out of the frame */}
      <g clipPath={`url(#${prefix}-fence)`} opacity={0.55}>
        <path
          d={lattice(
            -200 - mod(cam.pxPerMetre(WALL_Z) * camX, 22),
            2120,
            -200,
            cam.screenY(1, WALL_Z),
            22,
          )}
          stroke="#6b6b6b"
          strokeWidth={1.2}
          fill="none"
        />
      </g>
      {range(span(camX, [0, 8], -16, 4, WALL_Z, cam)).map((i) => {
        const x = X(-16 + i * 4, WALL_Z);
        return (
          <path
            key={i}
            d={`M ${x} ${cam.screenY(1, WALL_Z)} L ${x} -200`}
            stroke={INK}
            strokeWidth={8}
          />
        );
      })}
      {[2.2, 3.6].map((y) => (
        <path
          key={y}
          d={`M -200 ${cam.screenY(y, WALL_Z)} L 2120 ${cam.screenY(y, WALL_Z)}`}
          stroke={INK}
          strokeWidth={3}
        />
      ))}
      {/* concrete wall with panel joints */}
      <rect
        x={-200}
        y={cam.screenY(1, WALL_Z)}
        width={2320}
        height={cam.screenY(0, WALL_Z) - cam.screenY(1, WALL_Z)}
        fill={PAPER}
        stroke={INK}
        strokeWidth={4}
      />
      <rect
        x={-200}
        y={cam.screenY(1, WALL_Z)}
        width={2320}
        height={14}
        fill={tone("mid")}
      />
      {range(span(camX, [0, 11], -18, 3, WALL_Z, cam)).map((i) => {
        const x = X(-18 + i * 3, WALL_Z);
        return (
          <path
            key={i}
            d={`M ${x} ${cam.screenY(1, WALL_Z)} L ${x} ${cam.screenY(0, WALL_Z)}`}
            stroke={INK}
            strokeWidth={2}
          />
        );
      })}
    </g>
  );
};

const mod = (a: number, n: number) => ((a % n) + n) % n;

/** Extra ground marks for a shot: a finish line across the track at world x (m). */
export type GroundMark = { kind: "finish"; x: number };

export const TrackSurface: React.FC<{
  cam: Camera;
  camX: number;
  prefix: string;
  /** Focus lines on the track surface, converging on this screen point (the settled frame: VER's locked tyre). */
  focus?: { x: number; y: number; seed: number };
  marks?: readonly GroundMark[];
  /** On a straight there are no kerbs: painted edge lines instead (the settled frame is at a corner). */
  straight?: boolean;
}> = ({ cam, camX, prefix, focus, marks = [], straight = false }) => {
  const X = (x: number, z: number) => cam.screenX(x - camX, z);
  const quad = (z0: number, z1: number, x0: number, x1: number) =>
    cam.groundQuad(z0, z1, x0 - camX, x1 - camX);
  // rubber streaks repeat every 12 m along the track
  const tiles = camX === 0 ? [0] : range(span(camX, [0, 0], -6, 12, 9, cam));
  return (
    <g>
      {/* run-off between the wall and the inside kerb */}
      <path d={cam.groundQuad(15, WALL_Z, -30, 30)} fill={tone("light")} />
      {Array.from({ length: 7 }, (_, i) => {
        const z = 16 + i * 1.3;
        return (
          <path
            key={i}
            d={`M -200 ${cam.screenY(0, z)} L 2120 ${cam.screenY(0, z)}`}
            stroke={INK}
            strokeWidth={1}
            opacity={0.25}
          />
        );
      })}
      {/* inside (apex) kerb, beyond the inside car */}
      {straight ? (
        <path d={cam.groundQuad(13.9, 15.2, -30, 30)} fill={tone("light")} />
      ) : null}
      {(straight ? [] : range(span(camX, [0, 33], -8.5, 0.5, 13.9, cam))).map(
        (i) => (
          <path
            key={i}
            d={quad(13.9, 15.2, -8.5 + i * 0.5, -8 + i * 0.5)}
            fill={mod(i, 2) ? INK : PAPER}
            stroke={INK}
            strokeWidth={3.5}
          />
        ),
      )}
      <path
        d={cam.groundQuad(13.65, 13.9, -30, 30)}
        fill={PAPER}
        stroke={INK}
        strokeWidth={2.5}
      />
      {/* racing surface, with rubbered-in streaks */}
      <path d={cam.groundQuad(8.6, 13.65, -30, 30)} fill={PAPER} />
      {tiles.map((tile) =>
        Array.from({ length: 18 }, (_, i) => {
          const z = 9 + ((i * 0.37) % 4.6);
          const x = -6 + ((i * 1.7) % 12) + tile * 12;
          return (
            <path
              key={`${tile}-${i}`}
              d={`M ${X(x, z)} ${cam.screenY(0, z)} L ${X(x + 1.5 + (i % 3), z)} ${cam.screenY(0, z)}`}
              stroke={INK}
              strokeWidth={2.2}
              opacity={0.5}
            />
          );
        }),
      )}
      {focus ? (
        <g clipPath={`url(#${prefix}-ground)`}>
          <path d={focusLinesD(focus.x, focus.y, focus.seed)} fill={INK} />
        </g>
      ) : null}
      {/* painted marks lie over the focus lines so they stay readable */}
      {marks.map((m) =>
        m.kind === "finish" ? (
          <g key={`f${m.x}`}>
            {Array.from({ length: 2 * 10 }, (_, i) => {
              const row = i % 2;
              const col = Math.floor(i / 2);
              const z0 = 8.6 + col * ((13.65 - 8.6) / 10);
              const z1 = z0 + (13.65 - 8.6) / 10;
              const x0 = m.x + row * 0.45;
              return (
                <path
                  key={i}
                  d={quad(z0, z1, x0, x0 + 0.45)}
                  fill={(row + col) % 2 ? PAPER : INK}
                />
              );
            })}
            <path
              d={quad(8.6, 13.65, m.x, m.x + 0.9)}
              fill="none"
              stroke={INK}
              strokeWidth={2}
            />
          </g>
        ) : null,
      )}
      {/* outside kerb, nearest the camera */}
      {straight ? (
        <>
          <path d={cam.groundQuad(6, 8.6, -30, 30)} fill={tone("light")} />
          <path
            d={cam.groundQuad(8.35, 8.6, -30, 30)}
            fill={PAPER}
            stroke={INK}
            strokeWidth={2.5}
          />
        </>
      ) : null}
      {(straight ? [] : range(span(camX, [0, 23], -6, 0.5, 8, cam))).map(
        (i) => (
          <path
            key={`n${i}`}
            d={quad(8, 8.6, -6 + i * 0.5, -5.5 + i * 0.5)}
            fill={mod(i, 2) ? INK : PAPER}
            stroke={INK}
            strokeWidth={3}
          />
        ),
      )}
    </g>
  );
};

const focusLinesD = (x: number, y: number, seed: number) =>
  focusLines(x, y, 560, 110, seed);
