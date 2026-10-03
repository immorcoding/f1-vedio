// Shot 1.4 (bars 19–20): the crash. On 19.1 PRO turns in and the two McLarens hit — the frame freezes on an impact
// star with "咔！" and shakes; then the cars, wheels locked together, slide to a stop side by side at the mouth of the
// chicane escape road (SEN on the near side, his nose locked into PRO's right side by the front wheel). On 20.1 a small
// panel drops in, the fan's easter egg (STO-7, docs/production/facts.md): marshals push SEN down the escape road, the
// Honda fires and he weaves away between the temporary bollards.
import { Easing } from "remotion";
import { carPoint, MangaCar, MP4_5_PRO, MP4_5_SEN } from "../../../cars";
import { offsetFrom, pinhole, type Camera } from "../../../kit/camera";
import { INK, PAPER } from "../../../kit/colors";
import {
  Figure,
  walkPose,
  type BodyPose,
  type Outfit,
} from "../../../kit/figure";
import { ImpactStar } from "../../../kit/impact";
import { InkFilterDef, inkFilter } from "../../../kit/ink";
import { Sfx } from "../../../kit/lettering";
import { focusLines, speedLines } from "../../../kit/lines";
import { ToneDefs, tone } from "../../../kit/tone";
import {
  Trackside,
  TRACKSIDE_DEFAULT,
} from "../../../scenes/suzuka-1989/trackside";
import { Foreground } from "./Foreground";
import { cueFrame, ramp, shotById, type PictureProps } from "./common";

// The main panel's camera: 1.2 m up, close, f = 1700 px (ART-9).
const CAM = pinhole({ f: 1700, horizon: 470, cx: 960, height: 1.2 });
const Z_SEN = 8;
const Z_PRO = 10.6;
// Slide after the hit: from 22 m/s to rest, exponential, τ = 0.45 s.
const V0 = 22;
const TAU = 0.45;
const slide = (t: number) => V0 * TAU * (1 - Math.exp(-Math.max(0, t) / TAU));

// Marshals of 1989: white overalls, light hoods (no faces, ART-5).
const MARSHAL: Outfit = {
  suit: "#ecebe6",
  suitShade: "#bdbcb6",
  seam: "#8a8984",
  stripe: "#ee3a24",
  gloves: "#d8d7d2",
  boots: "#222222",
  head: { kind: "hood", color: "#d9d8d2" },
};

// Pushing: leaning hard into the car, arms out straight at the rear wing, legs driving.
const pushPose = (p: number): BodyPose => {
  const w = walkPose(p, 1.15, 34);
  return {
    ...w,
    head: -10,
    near: { ...w.near, arm: { shoulder: 92, elbow: 4 } },
    far: { ...w.far, arm: { shoulder: 86, elbow: 8 } },
  };
};

// Smoke from a locked tyre: inked puffs trailing back from (x, y).
const Puffs: React.FC<{
  x: number;
  y: number;
  n: number;
  size: number;
  dir?: number;
  o?: number;
}> = ({ x, y, n, size, dir = -1, o = 1 }) => (
  <g opacity={o}>
    {Array.from({ length: n }, (_, i) => {
      const r = size * (0.5 + i * 0.22);
      const cx = x + dir * i * size * 0.8;
      const cy = y - i * size * 0.18 - (i % 2) * size * 0.2;
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

// The easter-egg panel, drawn as a full 1920×1080 frame and scaled into its box.
const PushPanel: React.FC<{ t: number }> = ({ t }) => {
  const cam: Camera = pinhole({ f: 2100, horizon: 520, cx: 960, height: 1.0 });
  const FIRE = 1.0; // s: the engine catches
  // pushed at walking pace, then away
  const x =
    t < FIRE
      ? 2.2 * t
      : 2.2 * FIRE + 2.2 * (t - FIRE) + 0.5 * 9 * (t - FIRE) ** 2;
  const camX = Math.min(x, 2.2 * FIRE + 1.2 * (t - FIRE));
  const carA = cam.anchor({ x: x - 2.6 - camX, z: 7 });
  const rearM = carPoint(MP4_5_SEN, "rearContact").x;
  const fired = t >= FIRE;
  const marshals = [
    { dx: -0.55, z: 6.4, ph: 0 },
    { dx: -0.4, z: 7.7, ph: 0.45 },
  ];
  // bollards in the escape road: striped posts, one in front of the car's path, two beyond it
  const bollards = [
    { x: 6.5, z: 5.6 },
    { x: 9.5, z: 8.8 },
    { x: 13, z: 5.8 },
    { x: 3, z: 9 },
  ];
  const Bollard: React.FC<{ b: { x: number; z: number } }> = ({ b }) => {
    const p = cam.anchor({ x: b.x - camX, z: b.z });
    const w = 0.22 * p.pxPerMetre;
    const h = 0.9 * p.pxPerMetre;
    return (
      <g>
        <ellipse
          cx={p.x}
          cy={p.y}
          rx={w * 1.2}
          ry={w * 0.3}
          fill={INK}
          opacity={0.4}
        />
        {[0, 1, 2, 3].map((k) => (
          <rect
            key={k}
            x={p.x - w / 2}
            y={p.y - h + (k * h) / 4}
            width={w}
            height={h / 4}
            fill={k % 2 ? PAPER : INK}
            stroke={INK}
            strokeWidth={2}
          />
        ))}
      </g>
    );
  };
  const near = bollards.filter((b) => b.z < 7);
  const far = bollards.filter((b) => b.z >= 7);
  const exhaust = offsetFrom(carA, 0.1, 0.45);
  return (
    <g>
      <Trackside
        cam={cam}
        camX={camX}
        layout={{
          ...TRACKSIDE_DEFAULT,
          nearEdge: 4,
          farEdge: 14,
          rail: 16,
          fence: 17.5,
        }}
      />
      <Foreground cam={cam} camX={camX} nearEdge={4} farEdge={14} />
      {far.map((b) => (
        <Bollard key={`${b.x}`} b={b} />
      ))}
      {marshals
        .filter((m) => m.z > 7)
        .map((m) => {
          const p = cam.anchor({
            x: x - 2.6 + rearM + m.dx - camX - (fired ? 0.8 * (t - FIRE) : 0),
            z: m.z,
          });
          return (
            <Figure
              key={m.z}
              at={p}
              pxPerMetre={p.pxPerMetre}
              pose={fired ? walkPose(0.1, 0.5, 8) : pushPose(t * 1.4 + m.ph)}
              outfit={MARSHAL}
              facing="right"
            />
          );
        })}
      {fired ? (
        <path
          d={speedLines({
            x: carA.x - 700,
            y: carA.y - 0.9 * carA.pxPerMetre,
            w: 640,
            h: 0.9 * carA.pxPerMetre,
            n: 12,
            seed: `egg-${Math.floor(t * 20)}`,
            thickness: 5,
          })}
          fill={INK}
          opacity={Math.min(1, (t - FIRE) * 3)}
        />
      ) : null}
      <MangaCar
        car={MP4_5_SEN}
        at={carA}
        state={{ wheelAngle: (x / 0.33) * 57.3 }}
      />
      {fired ? (
        <Puffs
          x={exhaust.x - 10}
          y={exhaust.y}
          n={6}
          size={22}
          o={Math.max(0, 1 - (t - FIRE) * 1.2)}
        />
      ) : null}
      {marshals
        .filter((m) => m.z <= 7)
        .map((m) => {
          const p = cam.anchor({
            x: x - 2.6 + rearM + m.dx - camX - (fired ? 0.8 * (t - FIRE) : 0),
            z: m.z,
          });
          return (
            <Figure
              key={m.z}
              at={p}
              pxPerMetre={p.pxPerMetre}
              pose={fired ? walkPose(0.6, 0.5, 8) : pushPose(t * 1.4 + m.ph)}
              outfit={MARSHAL}
              facing="right"
            />
          );
        })}
      {near.map((b) => (
        <Bollard key={`${b.x}`} b={b} />
      ))}
      {fired ? (
        <Sfx x={1150} y={330} size={260} rotate={-8}>
          轰！
        </Sfx>
      ) : null}
    </g>
  );
};

export const Crash: React.FC<PictureProps> = ({ f }) => {
  const shot = shotById("1.4");
  const hit = cueFrame("suzuka1989.crash");
  const push = cueFrame("suzuka1989.push");
  const t = (f - hit) / 60;
  const s = slide(t);
  // the camera pans with the cars, so the trackside slides by and stops with them
  const camX = s;
  const senA = CAM.anchor({ x: -3.6, z: Z_SEN });
  const proA = CAM.anchor({ x: -2.5 - 0.25 * ramp(t, 0, 1), z: Z_PRO });
  // the frame freezes for half a beat on the star, then shakes out
  const freeze = f - hit < 14;
  const shake = freeze ? 0 : 14 * Math.exp(-(f - hit - 14) / 10);
  const sx = shake * Math.sin((f - hit) * 2.7);
  const sy = shake * Math.cos((f - hit) * 2.1);
  const contact = offsetFrom(
    senA,
    carPoint(MP4_5_SEN, "frontContact").x - 0.1,
    0.3,
  );
  const star = ramp(f, hit, hit + 10, Easing.out(Easing.cubic));
  const starFade = 1 - ramp(f, hit + 34, hit + 60);
  const sfx = ramp(f, hit, hit + 6, Easing.out(Easing.back(2.5)));
  const smoke = ramp(t, 0, 0.3) * (1 - ramp(t, 1.4, 2.4));
  const panel = ramp(f, push, push + 14, Easing.out(Easing.back(1.3)));
  const PANEL = { x: 1060, y: 560, w: 800, h: 450 };
  const senFront = offsetFrom(
    senA,
    carPoint(MP4_5_SEN, "frontContact").x,
    0.15,
  );
  const proFront = offsetFrom(
    proA,
    carPoint(MP4_5_PRO, "frontContact").x,
    0.15,
  );
  return (
    <svg viewBox="0 0 1920 1080" width={1920} height={1080}>
      <defs>
        <ToneDefs />
        <InkFilterDef />
        <clipPath id="s14-panel">
          <rect x={PANEL.x} y={PANEL.y} width={PANEL.w} height={PANEL.h} />
        </clipPath>
      </defs>
      <rect width={1920} height={1080} fill={PAPER} />
      <g filter={inkFilter()}>
        <g
          transform={`translate(${sx} ${sy}) rotate(${freeze ? -3 : -3 * (1 - ramp(t, 0.3, 1.2))} 960 540)`}
        >
          <Trackside
            cam={CAM}
            camX={camX}
            layout={{ ...TRACKSIDE_DEFAULT, nearEdge: 5, farEdge: 17 }}
          />
          <Foreground cam={CAM} camX={camX} nearEdge={5} farEdge={17} />
          {freeze ? (
            <path
              d={focusLines(contact.x, contact.y, 260, 130, 11)}
              fill={INK}
            />
          ) : null}
          {/* PRO beyond, turned in across SEN's nose: his nose a little toward the camera */}
          <MangaCar
            car={MP4_5_PRO}
            at={proA}
            state={{ lockFront: 20, wheelAngle: 20, tilt: freeze ? 2 : 0.5 }}
          />
          <Puffs
            x={proFront.x - 30}
            y={proFront.y + 8}
            n={6}
            size={14}
            o={smoke}
          />
          <Puffs
            x={senFront.x - 40}
            y={senFront.y + 14}
            n={7}
            size={18}
            o={smoke}
          />
          <MangaCar
            car={MP4_5_SEN}
            at={senA}
            state={{
              lockFront: 40,
              wheelAngle: 40,
              tilt: freeze ? -2.5 : -0.5,
            }}
          />
          {star * starFade > 0 ? (
            <g opacity={starFade}>
              <ImpactStar
                x={contact.x}
                y={contact.y}
                r={190}
                seed="suzuka89"
                t={star}
              />
            </g>
          ) : null}
        </g>
        {sfx > 0 ? (
          <g transform={`translate(330 330) scale(${0.6 + 0.4 * sfx})`}>
            <Sfx x={0} y={0} size={230} rotate={-12}>
              {shot.text[0]}
            </Sfx>
          </g>
        ) : null}
        <rect
          x={0}
          y={0}
          width={1920}
          height={1080}
          fill="none"
          stroke={INK}
          strokeWidth={18}
        />
        {panel > 0 ? (
          <g transform={`translate(0 ${(1 - panel) * 520})`}>
            <rect
              x={PANEL.x + 14}
              y={PANEL.y + 14}
              width={PANEL.w}
              height={PANEL.h}
              fill={INK}
            />
            <g clipPath="url(#s14-panel)">
              <rect
                x={PANEL.x}
                y={PANEL.y}
                width={PANEL.w}
                height={PANEL.h}
                fill={PAPER}
              />
              <g
                transform={`translate(${PANEL.x} ${PANEL.y}) scale(${PANEL.w / 1920})`}
              >
                <PushPanel t={(f - push) / 60} />
              </g>
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
          </g>
        ) : null}
      </g>
    </svg>
  );
};
