// Abu Dhabi 2021, lap 58, T5 hairpin: VER dives down the inside and locks his front-right, HAM holds the outside.
// The settled scene standard (ART-7, docs/shape/references/style-b-manga-v2.png), built from the production kit and car
// library; shot 5.3 of the treatment (bar 89).
//
// `t` animates the panel: seconds after the lock-up. At t = 0 it draws exactly the settled frame (the library still
// and the first frame of shot 5.3); after that the camera tracks the braking cars along the wall, VER slides past on
// the inside trailing smoke, HAM's wheels turn, and the focus lines and lettering shiver.
import { AbsoluteFill, random } from "remotion";
import { MangaCar, PIRELLI_2021, RB16B, W12, carPoint } from "../../cars";
import { offsetFrom, pinhole } from "../../kit/camera";
import { INK, PAPER } from "../../kit/colors";
import { Ink, InkFilterDef, inkFilter } from "../../kit/ink";
import { Caption, Sfx } from "../../kit/lettering";
import { focusLines, speedLines } from "../../kit/lines";
import { ToneDefs, tone } from "../../kit/tone";
import {
  Background,
  T5_LAYOUT,
  TrackSurface,
  TracksideDefs,
} from "./trackside";

const PANEL = { x: 40, y: 40, w: 1840, h: 1000 };
const INSET = { x: 1290, y: 70, w: 560, h: 330 };

// One camera for the whole panel: 2.9 m up, level, f = 2500 px. HAM is 10 m away on the outside line, VER 12.5 m on the inside.
export const T5_CAM = pinhole({ f: 2500, horizon: 190, cx: 960, height: 2.9 });
const cam = T5_CAM;

// Motion after the lock-up (all zero at t = 0).
const BRAKE = { v0: 50, decel: 7.5 }; // camera tracking speed, m/s, and how fast it bleeds off
export const t5Motion = (t: number) => ({
  camX: BRAKE.v0 * t - 0.5 * BRAKE.decel * t * t,
  verX: -1.8 + 0.85 * t, // VER slides past on the inside
  hamX: -3.24 - 0.3 * t,
  wheel: 540 * t, // stylised wheel turn, degrees (true rate would strobe)
});

// Tyre smoke: a trail of inked puffs growing as they drift back from (x, y). `t` boils them.
export const Puffs: React.FC<{
  x: number;
  y: number;
  n: number;
  step: number;
  grow: number;
  t?: number;
}> = ({ x, y, n, step, grow, t = 0 }) => (
  <g>
    {Array.from({ length: n }, (_, i) => {
      const boil = t === 0 ? 0 : Math.sin(i * 1.7 + t * 9);
      const cx = x - i * step + boil * 3;
      const cy = y - i * 2.4 - (i % 3) * 5 + boil * 2;
      const r = 10 + i * grow + (t === 0 ? 0 : Math.abs(boil) * 2);
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

// Lock-up smoke off VER's locked front tyre (ART-20 bubble smoke, made fine): many small puffs of varied size, born
// at the contact patch at a steady rate, thrown back and slowing, lifting a little, swelling, then breaking into
// smaller bubbles that drift apart and shrink away; and a scatter of rubber-dust specks flung back off the tread,
// falling and fading. Screen px at VER's distance. Every particle is born on a fixed clock that started before t = 0,
// so the settled frame (t = 0) already shows the full trail.
const SMOKE = {
  rate: 84, // puffs per second
  life: [1.0, 1.7], // s
  back: [950, 1500], // initial speed back along the trail, px/s
  drag: 0.42, // s
  rise: [10, 42], // px/s
  r0: [3, 10], // px at birth
  grow: [10, 26], // px per s of age
};
const DUST = {
  rate: 150, // specks per second
  life: [0.35, 1.0],
  back: [550, 1700],
  drag: 0.32,
};
const PRE = 1.8; // s of trail already laid down at t = 0

const rnd = (i: number, k: string) => random(`t5-smoke-${k}-${i}`);
const lerp = ([a, b]: number[], u: number) => a + (b - a) * u;

type Bubble = { cx: number; cy: number; r: number; age: number };

export const LockupSmoke: React.FC<{ x: number; y: number; t: number }> = ({
  x,
  y,
  t,
}) => {
  const bubbles: Bubble[] = [];
  for (
    let i = Math.floor(-PRE * SMOKE.rate);
    i <= Math.floor(t * SMOKE.rate);
    i++
  ) {
    const age = t - i / SMOKE.rate;
    const life = lerp(SMOKE.life, rnd(i, "life"));
    if (age < 0 || age > life) continue;
    const u = age / life;
    const back =
      lerp(SMOKE.back, rnd(i, "back")) *
      SMOKE.drag *
      (1 - Math.exp(-age / SMOKE.drag));
    // each puff leaves on its own slight angle, so the trail thickens as it ages
    const fan = (rnd(i, "fan") - 0.62) * 0.16;
    const cx = x - 12 - back + Math.sin(i * 2.3 + t * 7) * 2 * u;
    const cy =
      y -
      7 -
      lerp(SMOKE.rise, rnd(i, "rise")) * age +
      back * fan +
      (rnd(i, "y0") - 0.5) * 8;
    const r =
      (lerp(SMOKE.r0, rnd(i, "r0") ** 1.5) +
        lerp(SMOKE.grow, rnd(i, "grow")) * age) *
      Math.min(1, 0.4 + age / 0.05);
    if (u < 0.62) {
      bubbles.push({ cx, cy, r, age });
      continue;
    }
    // breaking up: three smaller bubbles drifting apart, shrinking to nothing
    const k = (u - 0.62) / 0.38;
    const spin = rnd(i, "spin") * Math.PI * 2;
    for (let j = 0; j < 3; j++) {
      const a = spin + (j / 3) * Math.PI * 2;
      const d = r * (0.45 + 0.9 * k);
      bubbles.push({
        cx: cx + Math.cos(a) * d,
        cy: cy + Math.sin(a) * d * 0.7,
        r: r * (0.62 - 0.12 * j) * (1 - k),
        age,
      });
    }
  }
  // oldest first, so the fresh puffs at the tyre sit in front
  bubbles.sort((a, b) => b.age - a.age);

  const specks: {
    x: number;
    y: number;
    r: number;
    o: number;
    c: string;
    len: number;
  }[] = [];
  for (let i = Math.floor(-DUST.rate); i <= Math.floor(t * DUST.rate); i++) {
    const age = t - i / DUST.rate;
    const life = lerp(DUST.life, rnd(i, "dlife"));
    if (age < 0 || age > life) continue;
    const v = lerp(DUST.back, rnd(i, "dback"));
    const back = v * DUST.drag * (1 - Math.exp(-age / DUST.drag));
    const up = (rnd(i, "dup") - 0.35) * 320; // px/s, mostly upward
    specks.push({
      x: x - 8 - back,
      y: y - 6 - up * age + 380 * age * age + (rnd(i, "dy0") - 0.5) * 22,
      r: 1.1 + 2.6 * rnd(i, "dr") ** 2,
      o: Math.min(1, 1.6 * (1 - age / life)),
      c: rnd(i, "dark") < 0.75 ? INK : "#5e5e5e",
      // fresh specks still flying fast read as short dashes
      len: v * Math.exp(-age / DUST.drag) * 0.014,
    });
  }

  return (
    <g>
      {bubbles.map((p, i) => (
        <g key={`p${i}`}>
          <circle
            cx={p.cx}
            cy={p.cy}
            r={p.r}
            fill={PAPER}
            stroke={INK}
            strokeWidth={Math.min(2.2, 0.8 + p.r * 0.07)}
          />
          {p.r > 7 ? (
            <path
              d={`M ${p.cx - p.r * 0.2} ${p.cy + p.r * 0.88} A ${p.r} ${p.r} 0 0 0 ${p.cx + p.r * 0.93} ${p.cy + p.r * 0.2}`}
              fill="none"
              stroke={tone("mid")}
              strokeWidth={p.r * 0.32}
            />
          ) : null}
        </g>
      ))}
      {specks.map((s, i) =>
        s.len > 2.5 ? (
          <path
            key={`d${i}`}
            d={`M ${s.x} ${s.y} l ${-s.len} ${s.len * 0.05}`}
            stroke={s.c}
            strokeWidth={s.r * 1.2}
            strokeLinecap="round"
            opacity={s.o}
          />
        ) : (
          <circle
            key={`d${i}`}
            cx={s.x}
            cy={s.y}
            r={s.r}
            fill={s.c}
            opacity={s.o}
          />
        ),
      )}
    </g>
  );
};

const insetSpokes = (cx: number, cy: number, r: number, n = 10) =>
  Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    return `M ${cx + Math.cos(a) * r * 0.25} ${cy + Math.sin(a) * r * 0.25} L ${cx + Math.cos(a) * r * 0.92} ${cy + Math.sin(a) * r * 0.92}`;
  }).join(" ");

const flick = (t: number, base: number) =>
  t === 0 ? base : base + Math.floor(t * 12);

// Close-up inset: VER's locked front-right tyre smoking.
const Inset: React.FC<{ t: number }> = ({ t }) => {
  const w = { cx: INSET.x + 300, cy: INSET.y + 250, r: 190 };
  const jx = t === 0 ? 0 : Math.sin(t * 47) * 2.5;
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
        <path
          d={focusLines(w.cx, w.cy - 40, 230, 120, flick(t, 9))}
          fill={INK}
        />
        <rect
          x={INSET.x}
          y={w.cy + 140}
          width={INSET.w}
          height={60}
          fill={tone("mid")}
        />
        <g transform={t === 0 ? undefined : `translate(${jx} 0)`}>
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
        </g>
        <Puffs
          x={w.cx - 140}
          y={w.cy + 150}
          n={8 + Math.floor(t * 2)}
          step={40}
          grow={9}
          t={t}
        />
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
      <Sfx x={INSET.x + 24 + jx} y={INSET.y + 104} size={92} rotate={-8}>
        SCREECH
      </Sfx>
    </g>
  );
};

// HAM is drawn after VER: nearer the camera, so in front (ART-9).
export const T5Panel: React.FC<{ t?: number }> = ({ t = 0 }) => {
  const m = t5Motion(t);
  const VER = cam.anchor({ x: m.verX - m.camX + m.camX, z: 12.5 });
  const HAM = cam.anchor({ x: m.hamX, z: 10 });
  const VER_LOCKUP = offsetFrom(VER, carPoint(RB16B, "frontContact").x);
  const shake =
    t === 0
      ? undefined
      : `translate(${Math.sin(t * 31) * 3 * Math.exp(-t)} ${Math.cos(t * 27) * 3 * Math.exp(-t)})`;
  const streaks = Math.min(1, t * 5);
  return (
    <AbsoluteFill style={{ backgroundColor: PAPER }}>
      <svg width={1920} height={1080}>
        <defs>
          <ToneDefs />
          <InkFilterDef />
          <clipPath id="t5-panel">
            <rect x={PANEL.x} y={PANEL.y} width={PANEL.w} height={PANEL.h} />
          </clipPath>
          <clipPath id="t5-inset">
            <rect x={INSET.x} y={INSET.y} width={INSET.w} height={INSET.h} />
          </clipPath>
          <TracksideDefs
            cam={cam}
            layout={T5_LAYOUT}
            camX={m.camX}
            prefix="t5"
          />
        </defs>
        <g filter={inkFilter()}>
          <g clipPath="url(#t5-panel)">
            <g transform="rotate(-3 960 540)">
              <Background
                cam={cam}
                layout={T5_LAYOUT}
                camX={m.camX}
                prefix="t5"
              />
              {streaks > 0 ? (
                <path
                  d={speedLines({
                    x: -200,
                    y: -100,
                    w: 2320,
                    h: cam.screenY(0, 25) + 100,
                    n: 70,
                    seed: `t5-${Math.floor(t * 20)}`,
                    angle: 180,
                    thickness: 7,
                    length: [0.2, 0.6],
                  })}
                  fill={PAPER}
                  opacity={0.55 * streaks}
                />
              ) : null}
              <TrackSurface
                cam={cam}
                camX={m.camX}
                prefix="t5"
                focus={{
                  x: VER_LOCKUP.x - 120,
                  y: VER_LOCKUP.y - 60,
                  seed: flick(t, 5),
                }}
              />
              <MangaCar
                car={RB16B}
                at={VER}
                state={{ wheelAngle: 18 + m.wheel, lockFront: 18 }}
              />
              <LockupSmoke x={VER_LOCKUP.x} y={VER_LOCKUP.y} t={t} />
              <MangaCar
                car={W12}
                at={HAM}
                state={{ wheelAngle: 40 + m.wheel }}
              />
            </g>
            <g transform={shake}>
              <Sfx x={640} y={360} size={150} rotate={-10}>
                VROOOM!
              </Sfx>
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
          <Inset t={t} />
          <Caption x={420} y={80} lines={["LAP 58 · TURN 5"]} />
        </g>
      </svg>
    </AbsoluteFill>
  );
};
