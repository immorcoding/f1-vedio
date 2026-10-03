// Abu Dhabi 2021, lap 58, T5 hairpin: VER dives down the inside and locks his front-right, HAM holds the outside.
// The settled scene standard (ART-7, docs/shape/references/style-b-manga-v2.png), built from the production kit and car
// library; shot 5.3 of the treatment (bar 89).
import { AbsoluteFill } from "remotion";
import { MangaCar, PIRELLI_2021, RB16B, W12, carPoint } from "../../cars";
import { offsetFrom, pinhole } from "../../kit/camera";
import { INK, PAPER } from "../../kit/colors";
import { Ink, InkFilterDef, inkFilter } from "../../kit/ink";
import { Caption, Sfx } from "../../kit/lettering";
import { focusLines } from "../../kit/lines";
import { ToneDefs, tone } from "../../kit/tone";

const PANEL = { x: 40, y: 40, w: 1840, h: 1000 };
const INSET = { x: 1290, y: 70, w: 560, h: 330 };

// One camera for the whole panel: 2.9 m up, level, f = 2500 px. HAM is 10 m away on the outside line, VER 12.5 m on the inside.
const cam = pinhole({ f: 2500, horizon: 190, cx: 960, height: 2.9 });
const HAM = cam.anchor({ x: -3.24, z: 10 });
const VER = cam.anchor({ x: -1.8, z: 12.5 });
const VER_LOCKUP = offsetFrom(VER, carPoint(RB16B, "frontContact").x);

const WALL_Z = 25;
const STAND_Z = 45;
const HOTEL_Z = 420;

const hotelShell = () => {
  const z = HOTEL_Z;
  const [x0, x1, top] = [2, 64, 30];
  const X = (x: number) => cam.screenX(x, z);
  const Y = (y: number) => cam.screenY(y, z);
  return `M ${X(x0)} ${Y(0)} C ${X(x0 + 6)} ${Y(top * 0.9)} ${X(x0 + 20)} ${Y(top)} ${X((x0 + x1) / 2)} ${Y(top)} C ${X(x1 - 20)} ${Y(top)} ${X(x1 - 6)} ${Y(top * 0.9)} ${X(x1)} ${Y(0)} Z`;
};

// Diagonal lattice (catch fence mesh, hotel gridshell) filling a box.
const lattice = (
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

const Defs: React.FC = () => (
  <defs>
    <ToneDefs />
    <InkFilterDef />
    <clipPath id="t5-panel">
      <rect x={PANEL.x} y={PANEL.y} width={PANEL.w} height={PANEL.h} />
    </clipPath>
    <clipPath id="t5-inset">
      <rect x={INSET.x} y={INSET.y} width={INSET.w} height={INSET.h} />
    </clipPath>
    <clipPath id="t5-ground">
      <rect x={-200} y={cam.screenY(0, 13.9)} width={2320} height={800} />
    </clipPath>
    <clipPath id="t5-fence">
      <rect x={-200} y={-200} width={2320} height={580} />
    </clipPath>
    <clipPath id="t5-shell">
      <path d={hotelShell()} />
    </clipPath>
  </defs>
);

// Grandstand tiers rising away from the camera, with a head-and-shoulders crowd on each row.
const STAND_ROWS = Array.from({ length: 26 }, (_, k) => ({
  z: STAND_Z + k * 0.8,
  y: k * 0.45,
}));

const Grandstand: React.FC = () => (
  <g>
    {STAND_ROWS.slice(0, -1).map((row, k) => {
      const next = STAND_ROWS[k + 1];
      const d = `M ${cam.screenX(-70, row.z)} ${cam.screenY(row.y, row.z)} L ${cam.screenX(-3, row.z)} ${cam.screenY(row.y, row.z)} L ${cam.screenX(-3, next.z)} ${cam.screenY(next.y, next.z)} L ${cam.screenX(-70, next.z)} ${cam.screenY(next.y, next.z)} Z`;
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
      Array.from({ length: 110 }, (_, i) => {
        const x = -62 + i * 0.55 + ((k * 7 + i * 3) % 5) * 0.06;
        if ((i * 13 + k * 7) % 11 === 0) return null;
        const head = cam.pxPerMetre(row.z) * 0.11;
        const cx = cam.screenX(x, row.z);
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

const Background: React.FC = () => (
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
    {Array.from({ length: 9 }, (_, i) => {
      const z = 160 + (i % 3) * 40;
      const x0 = -10 + i * 9;
      const h = 8 + (i % 4) * 5;
      return (
        <path
          key={i}
          d={`M ${cam.screenX(x0, z)} ${cam.screenY(0, z)} L ${cam.screenX(x0, z)} ${cam.screenY(h, z)} L ${cam.screenX(x0 + 7, z)} ${cam.screenY(h, z)} L ${cam.screenX(x0 + 7, z)} ${cam.screenY(0, z)} Z`}
          fill={INK}
        />
      );
    })}
    {/* Yas hotel: glowing gridshell far beyond the circuit */}
    <path d={hotelShell()} fill={INK} />
    <g clipPath="url(#t5-shell)">
      <path
        d={lattice(
          cam.screenX(2, HOTEL_Z),
          cam.screenX(64, HOTEL_Z),
          cam.screenY(30, HOTEL_Z),
          cam.screenY(0, HOTEL_Z),
          16,
        )}
        stroke={PAPER}
        strokeWidth={1.6}
        fill="none"
      />
    </g>
    <path d={hotelShell()} fill="none" stroke={PAPER} strokeWidth={2.5} />
    <Grandstand />
    {/* floodlight beams falling from towers above the frame */}
    {[
      [-120, 0.9],
      [520, 0.7],
    ].map(([x, o]) => (
      <path
        key={x}
        d={`M ${x} -60 L ${x + 900} ${cam.screenY(1, WALL_Z)} L ${x + 1200} ${cam.screenY(1, WALL_Z)} L ${x + 160} -60 Z`}
        fill={PAPER}
        opacity={0.16 * o}
      />
    ))}
    {/* catch fence on the wall: mesh, posts and cables run up out of the frame */}
    <g clipPath="url(#t5-fence)" opacity={0.55}>
      <path
        d={lattice(-200, 2120, -200, cam.screenY(1, WALL_Z), 22)}
        stroke="#6b6b6b"
        strokeWidth={1.2}
        fill="none"
      />
    </g>
    {Array.from({ length: 9 }, (_, i) => {
      const x = cam.screenX(-16 + i * 4, WALL_Z);
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
    {Array.from({ length: 12 }, (_, i) => {
      const x = cam.screenX(-18 + i * 3, WALL_Z);
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

const Track: React.FC = () => (
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
    {/* inside (apex) kerb, beyond VER */}
    {Array.from({ length: 34 }, (_, i) => (
      <path
        key={i}
        d={cam.groundQuad(13.9, 15.2, -8.5 + i * 0.5, -8 + i * 0.5)}
        fill={i % 2 ? INK : PAPER}
        stroke={INK}
        strokeWidth={3.5}
      />
    ))}
    <path
      d={cam.groundQuad(13.65, 13.9, -30, 30)}
      fill={PAPER}
      stroke={INK}
      strokeWidth={2.5}
    />
    {/* racing surface, with rubbered-in streaks */}
    <path d={cam.groundQuad(8.6, 13.65, -30, 30)} fill={PAPER} />
    {Array.from({ length: 18 }, (_, i) => {
      const z = 9 + ((i * 0.37) % 4.6);
      const x = -6 + ((i * 1.7) % 12);
      return (
        <path
          key={i}
          d={`M ${cam.screenX(x, z)} ${cam.screenY(0, z)} L ${cam.screenX(x + 1.5 + (i % 3), z)} ${cam.screenY(0, z)}`}
          stroke={INK}
          strokeWidth={2.2}
          opacity={0.5}
        />
      );
    })}
    <g clipPath="url(#t5-ground)">
      <path
        d={focusLines(VER_LOCKUP.x - 120, VER_LOCKUP.y - 60, 560, 110, 5)}
        fill={INK}
      />
    </g>
    {/* outside kerb, nearest the camera */}
    {Array.from({ length: 24 }, (_, i) => (
      <path
        key={`n${i}`}
        d={cam.groundQuad(8, 8.6, -6 + i * 0.5, -5.5 + i * 0.5)}
        fill={i % 2 ? INK : PAPER}
        stroke={INK}
        strokeWidth={3}
      />
    ))}
  </g>
);

// Tyre smoke: a trail of inked puffs growing as they drift back from (x, y).
const Puffs: React.FC<{
  x: number;
  y: number;
  n: number;
  step: number;
  grow: number;
}> = ({ x, y, n, step, grow }) => (
  <g>
    {Array.from({ length: n }, (_, i) => {
      const cx = x - i * step;
      const cy = y - i * 2.4 - (i % 3) * 5;
      const r = 10 + i * grow;
      return (
        <g key={i}>
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill={PAPER}
            stroke={INK}
            strokeWidth={2.6}
          />
          <path
            d={`M ${cx - r * 0.2} ${cy + r * 0.9} A ${r} ${r} 0 0 0 ${cx + r * 0.95} ${cy + r * 0.2}`}
            fill="none"
            stroke={tone("mid")}
            strokeWidth={r * 0.3}
          />
        </g>
      );
    })}
  </g>
);

const insetSpokes = (cx: number, cy: number, r: number, n = 10) =>
  Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    return `M ${cx + Math.cos(a) * r * 0.25} ${cy + Math.sin(a) * r * 0.25} L ${cx + Math.cos(a) * r * 0.92} ${cy + Math.sin(a) * r * 0.92}`;
  }).join(" ");

// Close-up inset: VER's locked front-right tyre smoking.
const Inset: React.FC = () => {
  const w = { cx: INSET.x + 300, cy: INSET.y + 250, r: 190 };
  return (
    <g>
      <g clipPath="url(#t5-inset)">
        <rect
          x={INSET.x}
          y={INSET.y}
          width={INSET.w}
          height={INSET.h}
          fill={PAPER}
        />
        <path d={focusLines(w.cx, w.cy - 40, 230, 120, 9)} fill={INK} />
        <rect
          x={INSET.x}
          y={w.cy + 140}
          width={INSET.w}
          height={60}
          fill={tone("mid")}
        />
        <circle cx={w.cx} cy={w.cy} r={w.r} fill={INK} />
        <circle
          cx={w.cx}
          cy={w.cy}
          r={w.r - 34}
          fill="none"
          stroke={PIRELLI_2021.soft}
          strokeWidth={9}
        />
        <circle
          cx={w.cx}
          cy={w.cy}
          r={104}
          fill={tone("light")}
          stroke={INK}
          strokeWidth={5}
        />
        <path d={insetSpokes(w.cx, w.cy, 104)} stroke={INK} strokeWidth={6} />
        <path
          d={`M ${w.cx - w.r * 0.85} ${w.cy - w.r * 0.35} A ${w.r * 0.92} ${w.r * 0.92} 0 0 1 ${w.cx - w.r * 0.1} ${w.cy - w.r * 0.92}`}
          fill="none"
          stroke={PAPER}
          strokeWidth={9}
          strokeLinecap="round"
        />
        <Puffs x={w.cx - 140} y={w.cy + 150} n={8} step={40} grow={9} />
        {Array.from({ length: 9 }, (_, i) => (
          <Ink
            key={i}
            d={`M ${w.cx + 40 + i * 18} ${w.cy + 180} l ${70 + (i % 3) * 30} ${-20 - (i % 4) * 14}`}
            w={3}
          />
        ))}
      </g>
      <rect
        x={INSET.x}
        y={INSET.y}
        width={INSET.w}
        height={INSET.h}
        fill="none"
        stroke={INK}
        strokeWidth={9}
      />
      <Sfx x={INSET.x + 24} y={INSET.y + 104} size={92} rotate={-8}>
        吱——
      </Sfx>
    </g>
  );
};

// HAM is drawn after VER: nearer the camera, so in front (ART-9).
export const T5Panel: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: PAPER }}>
    <svg width={1920} height={1080}>
      <Defs />
      <g filter={inkFilter()}>
        <g clipPath="url(#t5-panel)">
          <g transform="rotate(-3 960 540)">
            <Background />
            <Track />
            <MangaCar
              car={RB16B}
              at={VER}
              state={{ wheelAngle: 18, lockFront: 18 }}
            />
            <Puffs
              x={VER_LOCKUP.x - 40}
              y={VER_LOCKUP.y - 12}
              n={13}
              step={26}
              grow={3.4}
            />
            <MangaCar car={W12} at={HAM} state={{ wheelAngle: 40 }} />
          </g>
          <Sfx x={960} y={360} size={150} rotate={-10}>
            轰——！
          </Sfx>
        </g>
        <rect
          x={PANEL.x}
          y={PANEL.y}
          width={PANEL.w}
          height={PANEL.h}
          fill="none"
          stroke={INK}
          strokeWidth={10}
        />
        <Inset />
        <Caption
          x={420}
          y={80}
          w={330}
          h={150}
          lines={["第 58 圈，", "T5 发卡弯。"]}
        />
      </g>
    </svg>
  </AbsoluteFill>
);
