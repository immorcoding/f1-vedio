// Shot 6.1 (outro bars 1–2): a chequered flag, drawn as a manga flag in black and white, waves across the whole frame
// and sweeps the champion photo of 5.8 away to white paper. The pole leads from the left; the cloth trails behind it,
// rolling in travelling waves (dot tone in the folds, paper highlights on the crests). Fast in, a wave held across the
// whole frame, fast out: the paper is clear by `outro.paper`.
import { random } from "remotion";
import { INK, PAPER } from "../../../kit/colors";
import { speedLines } from "../../../kit/lines";
import { TonePattern } from "../../../kit/tone";
import { FPS, SECONDS_PER_BEAT, frameAt } from "../../timing";
import { ChampionCard } from "../abuDhabi2021/ChampionCard";
import { EDIT as ABU_EDIT } from "../abuDhabi2021/shots.ts";
import {
  cueAt,
  secondsInShot,
  smooth,
  type ShotTime,
} from "../abuDhabi2021/shotClock";
import { EDIT } from "./shots.ts";

const CELL = 150; // one check, px
const COLS = 18;
const ROWS = 10;
const W = CELL * COLS; // 2700
const H = CELL * ROWS; // 1500
const TOP = (1080 - H) / 2;
const SUB = 4; // points per cell edge
const WAVE_HZ = 2.1; // waves running down the cloth per second
const WAVE_L = 820; // wavelength along the cloth, px

// 5.8 on screen before the flag reaches it: its last frame, still running (confetti keeps falling).
const shot58 = ABU_EDIT.shots.find((s) => s.id === "5.8");

// Pole position (px from the left of the frame) at t seconds into the shot: in fast, a slow drift while the cloth fills
// the frame, out fast so the trailing edge has left by `out`.
const T_IN = 0.62;
const poleX = (t: number, out: number) => {
  const tIn = T_IN;
  const tHold = out - 1.0;
  if (t < tIn) return -60 + (1980 - -60) * (1 - (1 - t / tIn) ** 2);
  if (t < tHold) return 1980 + 200 * ((t - tIn) / (tHold - tIn));
  const u = Math.min(1, (t - tHold) / (out - tHold));
  return 2180 + (W + 420) * smooth(u) * (0.6 + 0.4 * u);
};

export const FlagShot: React.FC<{ st: ShotTime }> = ({ st }) => {
  const { t } = st;
  const out = secondsInShot(st, cueAt(EDIT, "outro.paper"));
  const px = poleX(t, out);
  const vel = (poleX(t + 1 / FPS, out) - px) * FPS; // px/s, for the motion streaks

  // the cloth: u from the pole (0) back to the trailing edge (W), v down from the top
  const wave = (u: number, v: number) => {
    const amp = 18 + 125 * (u / W) ** 0.8;
    const ph =
      (2 * Math.PI * u) / WAVE_L - 2 * Math.PI * WAVE_HZ * t + (v / H) * 1.3;
    return {
      x: px - u - amp * 0.45 * Math.cos(ph),
      y: TOP + v + amp * Math.sin(ph) + 0.015 * u,
      ph,
    };
  };
  const pt = (u: number, v: number) => {
    const p = wave(u, v);
    return `${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
  };
  // a cell's outline along the waved surface
  const cellPath = (i: number, j: number) => {
    const u0 = i * CELL;
    const v0 = j * CELL;
    const pts: string[] = [];
    for (let s = 0; s < SUB; s++) pts.push(pt(u0 + (CELL * s) / SUB, v0));
    for (let s = 0; s < SUB; s++)
      pts.push(pt(u0 + CELL, v0 + (CELL * s) / SUB));
    for (let s = SUB; s > 0; s--)
      pts.push(pt(u0 + (CELL * s) / SUB, v0 + CELL));
    for (let s = SUB; s > 0; s--) pts.push(pt(u0, v0 + (CELL * s) / SUB));
    return `M ${pts.join(" L ")} Z`;
  };
  const outline = (() => {
    const pts: string[] = [];
    const n = COLS * SUB;
    const m = ROWS * SUB;
    for (let s = 0; s <= n; s++) pts.push(pt((W * s) / n, 0));
    for (let s = 1; s <= m; s++) pts.push(pt(W, (H * s) / m));
    for (let s = n - 1; s >= 0; s--) pts.push(pt((W * s) / n, H));
    for (let s = m - 1; s > 0; s--) pts.push(pt(0, (H * s) / m));
    return `M ${pts.join(" L ")} Z`;
  })();

  const whites: string[] = [];
  const blacks: string[] = [];
  const folds: { d: string; o: number }[] = [];
  const shines: { d: string; o: number }[] = [];
  for (let i = 0; i < COLS; i++)
    for (let j = 0; j < ROWS; j++) {
      const d = cellPath(i, j);
      ((i + j) % 2 === 0 ? blacks : whites).push(d);
      // the fold facing away from the light: dot tone, deepest in the trough
      const c = wave(i * CELL + CELL / 2, j * CELL + CELL / 2);
      const shade = Math.max(0, Math.cos(c.ph));
      if (shade > 0.15) folds.push({ d, o: shade });
      // the crest catching the light: paper dots over the black checks
      const shine = Math.max(0, -Math.cos(c.ph));
      if ((i + j) % 2 === 0 && shine > 0.3) shines.push({ d, o: shine });
    }
  // crests: paper highlight streaks across the cloth (they show on the black checks), and ink crease lines in the
  // troughs (they show on the white ones)
  const ridge = (offset: number) => {
    const lines: string[] = [];
    const u0 = (v: number) =>
      ((offset + 2 * Math.PI * WAVE_HZ * t - (v / H) * 1.3) * WAVE_L) /
      (2 * Math.PI);
    const k0 = -Math.ceil(u0(0) / WAVE_L) - 1;
    for (let k = k0; k < k0 + W / WAVE_L + 4; k++) {
      const pts: string[] = [];
      for (let s = 0; s <= 12; s++) {
        const v = (H * s) / 12;
        const u = u0(v) + WAVE_L * k;
        if (u < 0 || u > W) continue;
        pts.push(pt(u, v));
      }
      if (pts.length > 1) lines.push(`M ${pts.join(" L ")}`);
    }
    return lines.join(" ");
  };

  const t58 = shot58
    ? {
        shot: shot58,
        f: st.f,
        frame: frameAt(shot58.to) - frameAt(shot58.from) + st.frame,
        t: (frameAt(shot58.to) - frameAt(shot58.from)) / FPS + t,
        dur: (frameAt(shot58.to) - frameAt(shot58.from)) / FPS,
      }
    : null;

  // once the pole is off the frame the whole cloth sways and pumps on the kick (every beat of the shot); before that
  // it stays square, so the photo's clip at the pole lines up
  const hold = smooth((t - T_IN) / 0.4);
  const sinceBeat = t % SECONDS_PER_BEAT;
  const pump = 1 + 0.018 * Math.max(0, 1 - sinceBeat / 0.2) ** 2;
  const sway = `translate(960 540) rotate(${hold * 3 * Math.sin(t * 2.6)}) scale(${(1 + 0.07 * hold) * (hold > 0 ? pump : 1)}) translate(-960 -540)`;

  // paper behind the cloth; the photo ahead of the pole (clipped at the pole)
  const poleTop = wave(0, 0);
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: PAPER,
        overflow: "hidden",
      }}
    >
      {t58 && px < 2100 ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            clipPath: `inset(0 0 0 ${Math.max(0, poleTop.x - 30)}px)`,
          }}
        >
          <ChampionCard st={t58} />
        </div>
      ) : null}
      <svg width={1920} height={1080} style={{ position: "absolute" }}>
        <defs>
          <TonePattern id="o61-fold" r={3.4} gap={10} />
          <pattern
            id="o61-shine"
            width={10}
            height={10}
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)"
          >
            <circle cx={5} cy={5} r={2.6} fill={PAPER} />
          </pattern>
        </defs>
        {/* streaks on the paper the trailing edge has just uncovered */}
        {vel > 2500 ? (
          <path
            d={speedLines({
              x: px - W - 900,
              y: 60,
              w: 900,
              h: 960,
              angle: 0,
              n: 26,
              seed: "o61",
              thickness: 7,
              length: [0.3, 0.9],
            })}
            fill={INK}
            opacity={Math.min(0.8, (vel - 2500) / 3000)}
          />
        ) : null}
        <g transform={sway}>
          <g>
            <path d={whites.join(" ")} fill={PAPER} />
            <path d={blacks.join(" ")} fill={INK} />
            {shines.map((f, k) => (
              <path
                key={`s${k}`}
                d={f.d}
                fill="url(#o61-shine)"
                opacity={(0.75 * (f.o - 0.3)) / 0.7}
              />
            ))}
            {folds.map((f, k) => (
              <path
                key={k}
                d={f.d}
                fill="url(#o61-fold)"
                opacity={0.85 * f.o}
              />
            ))}
            <path
              d={ridge(Math.PI)}
              fill="none"
              stroke={PAPER}
              strokeWidth={16}
              strokeLinecap="round"
              opacity={0.32}
            />
            <path
              d={ridge(Math.PI)}
              fill="none"
              stroke={PAPER}
              strokeWidth={5}
              strokeLinecap="round"
              opacity={0.55}
            />
            <path
              d={ridge(0)}
              fill="none"
              stroke={INK}
              strokeWidth={4}
              strokeLinecap="round"
              opacity={0.7}
            />
            <path
              d={outline}
              fill="none"
              stroke={INK}
              strokeWidth={10}
              strokeLinejoin="round"
            />
          </g>
          {/* the pole, leading */}
          <g>
            {/* a paper rim so the ink pole reads against the dark photo */}
            <rect
              x={poleTop.x - 24}
              y={-100}
              width={48}
              height={1300}
              fill={PAPER}
            />
            <rect
              x={poleTop.x - 17}
              y={-100}
              width={34}
              height={1300}
              fill={INK}
            />
            <rect
              x={poleTop.x - 6}
              y={-100}
              width={5}
              height={1300}
              fill={PAPER}
              opacity={0.7}
            />
          </g>
          {/* a few flecks thrown off the trailing edge while it whips */}
          {Array.from({ length: 10 }, (_, k) => {
            const age = (t * 1.3 + random(`o61f${k}`)) % 1;
            const e = wave(W, H * random(`o61v${k}`));
            return (
              <path
                key={k}
                d={`M ${e.x - 30 - 140 * age} ${e.y} l ${-50 - 40 * random(`o61l${k}`)} ${8 - 16 * random(`o61d${k}`)}`}
                stroke={INK}
                strokeWidth={4}
                strokeLinecap="round"
                opacity={vel > 400 ? 0.8 * (1 - age) : 0}
              />
            );
          })}
        </g>
      </svg>
    </div>
  );
};
