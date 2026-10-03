// Shot 3.6 (bars 70–72): GRO comes out of the fire on his own — over the rails and away from the wreck, a figure in ink
// against the flames, his helmet in its colours — and 28 秒 comes up on bar 71. The last beat of bar 72 is black.
import { GRO_2020 } from "../../../cars";
import { pinhole, type Camera } from "../../../kit/camera";
import { INK, PAPER } from "../../../kit/colors";
import { Sfx } from "../../../kit/lettering";
import { ToneDefs } from "../../../kit/tone";
import { cueFrame, ramp, shotById, type PictureProps } from "./common";
import { FACTS } from "./shots.ts";
import { WRECK_CAM, WreckWorld, heartbeat, zoomCam, HALO_WORLD } from "./Wreck";

// A little wider and lower than 3.4, the wreck kept to the right of the frame so he walks into the clear.
const CAM: Camera = zoomCam(
  pinhole({ ...WRECK_CAM, height: 1.3 }),
  HALO_WORLD,
  0.85,
  { x: 1180, y: 470 },
);

// His path (world metres): up and over the rails beside the cell, then away from the fire toward the camera.
const PATH = [
  { x: HALO_WORLD.x - 1.2, y: 0.9, z: 13.2 }, // on the rails
  { x: HALO_WORLD.x - 1.9, y: 0, z: 12.2 }, // down on the track side
  { x: HALO_WORLD.x - 4.6, y: 0, z: 9.6 },
];

// A standing figure 1.85 m tall, facing left, in metres (x right, y up, feet at 0), posed by walk phase `w` (0–1) and
// crouch `c` (0–1, climbing). Built from simple limbs so it stays a silhouette: no face, no detail (care for the subject).
const figure = (w: number, c: number) => {
  const swing = Math.sin(w * Math.PI * 2);
  const hipY = 0.95 - 0.25 * c;
  const lean = 0.08 + 0.25 * c;
  const neck = { x: -lean, y: hipY + 0.6 - 0.1 * c };
  const leg = (s: number) => {
    const a = s * swing * 0.45 - 0.1 * c;
    const knee = {
      x: Math.sin(a) * 0.48 - 0.05,
      y: hipY - Math.cos(a) * 0.46 + 0.2 * c,
    };
    const foot = {
      x: knee.x + Math.sin(a - 0.35 * Math.max(0, -s * swing)) * 0.48,
      y: Math.max(0, knee.y - 0.47),
    };
    return { knee, foot };
  };
  const arm = (s: number) => {
    const a = -s * swing * 0.5 + 0.4 * c;
    const elbow = {
      x: neck.x + Math.sin(a) * 0.3,
      y: neck.y - 0.05 - Math.cos(a) * 0.3,
    };
    const hand = {
      x: elbow.x + Math.sin(a + 0.4) * 0.28,
      y: elbow.y - Math.cos(a + 0.4) * 0.28,
    };
    return { elbow, hand };
  };
  return { hipY, neck, legs: [leg(1), leg(-1)], arms: [arm(1), arm(-1)] };
};

const Figure: React.FC<{
  cam: Camera;
  at: { x: number; y: number; z: number };
  w: number;
  c: number;
}> = ({ cam, at, w, c }) => {
  const s = cam.pxPerMetre(at.z);
  const base = cam.project(at);
  const P = (p: { x: number; y: number }) =>
    `${base.x + p.x * s} ${base.y - p.y * s}`;
  const fig = figure(w, c);
  const hip = { x: 0, y: fig.hipY };
  const limbs = [
    ...fig.legs.map(
      (l) =>
        `M ${P(hip)} L ${P(l.knee)} L ${P(l.foot)} L ${P({ x: l.foot.x - 0.16, y: l.foot.y })}`,
    ),
    `M ${P(hip)} L ${P(fig.neck)}`,
    ...fig.arms.map(
      (a) =>
        `M ${P({ x: fig.neck.x, y: fig.neck.y - 0.06 })} L ${P(a.elbow)} L ${P(a.hand)}`,
    ),
  ];
  const head = { x: fig.neck.x - 0.04, y: fig.neck.y + 0.16 };
  const r = 0.15 * s;
  const { base: shell, stripe } = GRO_2020.helmet;
  const silhouette = (stroke: string, width: number, dx: number) => (
    <g transform={`translate(${dx} 0)`}>
      {limbs.map((d) => (
        <path
          key={d}
          d={d}
          fill="none"
          stroke={stroke}
          strokeWidth={width}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
      <path
        d={`M ${P({ x: 0.13, y: hip.y - 0.08 })} L ${P({ x: -0.13, y: hip.y - 0.08 })} L ${P({ x: fig.neck.x - 0.16, y: fig.neck.y - 0.08 })} L ${P({ x: fig.neck.x - 0.06, y: fig.neck.y + 0.02 })} L ${P({ x: fig.neck.x + 0.12, y: fig.neck.y + 0.02 })} L ${P({ x: fig.neck.x + 0.18, y: fig.neck.y - 0.1 })} Z`}
        fill={stroke}
        stroke={stroke}
        strokeWidth={width * 0.6}
        strokeLinejoin="round"
      />
    </g>
  );
  return (
    <g>
      {/* rim light from the fire behind him, then the figure in ink */}
      {silhouette(PAPER, 0.2 * s + 6, 5)}
      {silhouette(INK, 0.2 * s, 0)}
      <circle
        cx={base.x + head.x * s}
        cy={base.y - head.y * s}
        r={r}
        fill={shell}
        stroke={INK}
        strokeWidth={Math.max(2, r * 0.18)}
      />
      <path
        d={`M ${base.x + (head.x - 0.12) * s} ${base.y - (head.y + 0.08) * s} C ${base.x + (head.x - 0.02) * s} ${base.y - (head.y + 0.17) * s} ${base.x + (head.x + 0.1) * s} ${base.y - (head.y + 0.12) * s} ${base.x + (head.x + 0.15) * s} ${base.y - (head.y + 0.02) * s}`}
        fill="none"
        stroke={stripe}
        strokeWidth={r * 0.35}
      />
      {/* visor, facing the way he walks */}
      <path
        d={`M ${base.x + (head.x - 0.15) * s} ${base.y - (head.y + 0.02) * s} L ${base.x + (head.x - 0.02) * s} ${base.y - (head.y + 0.03) * s} L ${base.x + (head.x - 0.04) * s} ${base.y - (head.y - 0.05) * s} L ${base.x + (head.x - 0.14) * s} ${base.y - (head.y - 0.06) * s} Z`}
        fill="#15132a"
        stroke={INK}
        strokeWidth={2}
      />
    </g>
  );
};

export const Escape: React.FC<PictureProps> = ({ f, palette }) => {
  const shot = shotById("3.6");
  const t = f - shot.from;
  const black = cueFrame("bahrain2020.black");
  const timeCue = cueFrame("bahrain2020.time");
  if (f >= black) {
    return (
      <svg viewBox="0 0 1920 1080" width={1920} height={1080}>
        <rect width={1920} height={1080} fill={INK} />
      </svg>
    );
  }
  // over the rails in the first half bar, then walking away
  const climb = ramp(t, 0, 60);
  const walk = ramp(t, 50, black - shot.from - 20, (u) => u);
  const at =
    t < 60
      ? {
          x: PATH[0].x + (PATH[1].x - PATH[0].x) * climb,
          y: PATH[0].y * (1 - climb) + Math.sin(climb * Math.PI) * 0.25,
          z: PATH[0].z + (PATH[1].z - PATH[0].z) * climb,
        }
      : {
          x: PATH[1].x + (PATH[2].x - PATH[1].x) * walk,
          y: 0,
          z: PATH[1].z + (PATH[2].z - PATH[1].z) * walk,
        };
  // the walk is drawn on twos of a six-frame step: four poses a stride
  const phase = Math.floor(t / 6) / 4;
  const crouch = t < 60 ? 1 - ramp(t, 30, 60) : 0;
  const hb = heartbeat(f);
  const text = ramp(f, timeCue, timeCue + 8);
  return (
    <svg viewBox="0 0 1920 1080" width={1920} height={1080}>
      <defs>
        <ToneDefs prefix="b36" />
      </defs>
      <WreckWorld
        cam={CAM}
        f={f}
        palette={palette}
        intensity={1}
        tonePrefix="b36"
      />
      <Figure cam={CAM} at={at} w={phase} c={crouch} />
      <rect width={1920} height={1080} fill={INK} opacity={0.15 * hb} />
      {text > 0 ? (
        <g
          opacity={text}
          transform={`translate(150 300) scale(${0.8 + 0.2 * text})`}
        >
          <Sfx x={0} y={0} size={210} rotate={-4}>
            {`${FACTS.escapeSeconds} 秒`}
          </Sfx>
        </g>
      ) : null}
    </svg>
  );
};
