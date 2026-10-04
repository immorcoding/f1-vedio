// Shot 6.1 (outro bars 1–4): four flashback panels, one a bar, each switched on beat 1. The first slams straight onto
// 5.8's champion photo while the music is still full; from there the score winds down (the kick stops after bar 4),
// so the picture calms with it: a plain hard cut into 2008, a 5-frame paper dissolve into 2020 and 2021. Every panel
// pushes in slowly (5 % a bar), and each one's key event lands on beat 3. Each panel reuses its part's art:
//   1989/90  PRO's and SEN's helmets (their real designs, the same as on the cars) clashing in an impact star
//   2008     the 98 · 97 score box of 2.7, its gold under-stroke landing on beat 3
//   2020     the burnt but whole halo of 3.6 (HaloFinale), a glint on beat 3
//   2021     VER's RB16B: on beat 3 its number turns over from 33 to 1 and the year from 2021 to 2022 (he raced as the
//            champion's number 1 the next season: facts.md)
// Over them, on beats 2 and 4, the margin between the two rivals flashes in the shared points box: 16 → 9 → 1 → 0 → 8.
import { Easing, random } from "remotion";
import {
  DriverHelmet,
  MangaCar,
  PRO_1989,
  RB16B,
  SEN_1989,
} from "../../../cars";
import { INK, PAPER } from "../../../kit/colors";
import { ImpactStar } from "../../../kit/impact";
import { Caption, captionSize, useLettering } from "../../../kit/lettering";
import { focusLines } from "../../../kit/lines";
import { GOLD, PointsBox } from "../../../kit/points-box";
import { ToneDefs, tone } from "../../../kit/tone";
import { HaloFinale } from "../bahrain2020/HaloFinale";
import { FIRE_PALETTE, cueFrame as bahrainCue } from "../bahrain2020/common";
import { ChampionCard } from "../abuDhabi2021/ChampionCard";
import { EDIT as ABU_EDIT } from "../abuDhabi2021/shots.ts";
import { cueAt, secondsInShot, type ShotTime } from "../abuDhabi2021/shotClock";
import { FPS, SECONDS_PER_BEAT, frameAt } from "../../timing";
import { EDIT } from "./shots.ts";
import { marginColumns, scoreColumns, type StandingId } from "../../points";

// the panel on the page
const PW = 1640;
const PH = 840;
const PX = (1920 - PW) / 2;
const PY = 86;

const decay = (since: number, len: number) =>
  since < 0 ? 0 : Math.max(0, 1 - since / len) ** 2;

/** `t`: seconds since the panel came on; `keyT`: seconds from then to its key event (beat 3). */
type PanelProps = { t: number; keyT: number };

// 1989/90: the two helmets meet on the downbeat and spring apart, the star bursting between them
const Clash: React.FC<PanelProps> = ({ t }) => {
  const r = 205;
  const recoil = 70 * (1 - Math.exp(-t / 0.12)) + 14 * t;
  const tilt = 9 * (1 - Math.exp(-t / 0.15));
  const cx = PW / 2;
  const cy = PH / 2 + 30;
  return (
    <g>
      <rect width={PW} height={PH} fill={PAPER} />
      <path
        d={focusLines(cx, cy - 20, 300, 110, 89)}
        fill={INK}
        opacity={0.9}
      />
      <ImpactStar
        x={cx}
        y={cy - 40}
        r={330}
        seed="o62-clash"
        t={Math.min(1, t / 0.35)}
      />
      <g transform={`rotate(${-tilt} ${cx - r - recoil} ${cy})`}>
        <DriverHelmet
          driver={PRO_1989}
          x={cx - r * 1.02 - recoil}
          y={cy}
          r={r}
          facing="right"
        />
      </g>
      <g transform={`rotate(${tilt} ${cx + r + recoil} ${cy})`}>
        <DriverHelmet
          driver={SEN_1989}
          x={cx + r * 1.02 + recoil}
          y={cy}
          r={r}
          facing="left"
        />
      </g>
    </g>
  );
};

// 2008: the final points, rain falling over the page; the gold 98 lands on beat 3
const Score: React.FC<PanelProps> = ({ t, keyT }) => {
  const k = 2.15 * (1 + 0.025 * t);
  const rain = Array.from({ length: 70 }, (_, i) => {
    const x = ((random(`o62r${i}`) * (PW + 400) + t * 260) % (PW + 400)) - 200;
    const y = ((random(`o62y${i}`) * (PH + 300) + t * 1400) % (PH + 300)) - 150;
    return `M ${x} ${y} l ${-22} ${80}`;
  }).join(" ");
  const stars = Array.from({ length: 14 }, (_, i) => {
    const x = 120 + random(`o62sx${i}`) * (PW - 240);
    const y = 90 + random(`o62sy${i}`) * (PH - 180);
    const tw = Math.abs(
      Math.sin(t * (3 + 3 * random(`o62sw${i}`)) + 6 * random(`o62so${i}`)),
    );
    const s = (10 + 14 * random(`o62ss${i}`)) * tw;
    return (
      <path
        key={i}
        transform={`translate(${x} ${y})`}
        d={`M 0 ${-s} L ${s * 0.22} ${-s * 0.22} L ${s} 0 L ${s * 0.22} ${s * 0.22} L 0 ${s} L ${-s * 0.22} ${s * 0.22} L ${-s} 0 L ${-s * 0.22} ${-s * 0.22} Z`}
        fill={i % 2 ? GOLD : PAPER}
        stroke={INK}
        strokeWidth={1.5}
      />
    );
  });
  return (
    <g>
      <rect width={PW} height={PH} fill={PAPER} />
      <path
        d={focusLines(PW / 2, PH / 2, 360, 100, 53)}
        fill={INK}
        opacity={0.75}
      />
      <path d={rain} stroke={INK} strokeWidth={2.5} opacity={0.45} />
      {stars}
      <g
        transform={`translate(${PW / 2} ${PH / 2 - 10}) scale(${k})`}
      >
        <PointsBox columns={scoreColumns("brazil2008")} goldSince={t - keyT} />
      </g>
    </g>
  );
};

// 2020: the scorched halo, slowly pushing in (3.6's last shot, held on its first second)
const HALO_GLINT = { x: 0.46, y: 0.3 }; // the halo's top in the panel, as a share of its size
const Halo: React.FC<PanelProps> = ({ t, keyT }) => {
  const f = bahrainCue("bahrain2020.halo") + 6 + Math.round(t * 60 * 0.5);
  const g = t < keyT ? 0 : decay(t - keyT, 0.55);
  const s = 34 + 60 * g;
  return (
    <g>
      <rect width={PW} height={PH} fill={INK} />
      <svg
        width={PW}
        height={PH}
        viewBox="0 0 1920 1080"
        preserveAspectRatio="xMidYMid slice"
      >
        <HaloFinale f={f} palette={FIRE_PALETTE} />
      </svg>
      {g > 0.01 ? (
        <g
          transform={`translate(${PW * HALO_GLINT.x} ${PH * HALO_GLINT.y}) rotate(${20 * g})`}
          opacity={Math.min(1, g * 1.6)}
        >
          <path
            d={`M 0 ${-s} Q ${s * 0.1} ${-s * 0.1} ${s} 0 Q ${s * 0.1} ${s * 0.1} 0 ${s} Q ${-s * 0.1} ${s * 0.1} ${-s} 0 Q ${-s * 0.1} ${-s * 0.1} 0 ${-s} Z`}
            fill="#fffbe8"
          />
          <circle r={s * 0.16} fill="#ffffff" />
        </g>
      ) : null}
    </g>
  );
};

// 2021: VER's car at speed, close on the cockpit and the number; the number turns over on beat 3
const CAR_K = 2.0; // screen px per photo px
const CAR_AT = { x: -250, y: 1034 };
const NUM = {
  x: CAR_AT.x + (RB16B.frame.x - RB16B.numberAt.x) * CAR_K,
  y: CAR_AT.y + (RB16B.numberAt.y - RB16B.frame.ground) * CAR_K,
  size: (RB16B.numberAt.size ?? 46) * CAR_K, // the painted number, where and as big as on the real car
};
const NO_NUMBER = { ...RB16B, driver: { ...RB16B.driver, number: "" } };
/** 0 → 1 across the turn-over that starts `since` seconds ago; the face shows the old side until halfway. */
const flip = (since: number, len = 0.16) =>
  Math.max(0, Math.min(1, since / len));
const flipScale = (u: number) =>
  u <= 0 ? 1 : u < 0.5 ? 1 - 2 * u : Easing.out(Easing.back(2.5))(2 * u - 1);

const Number1: React.FC<PanelProps> = ({ t, keyT }) => {
  const u = flip(t - keyT);
  const label = u < 0.5 ? "33" : "1";
  const sy = flipScale(u);
  const burst = decay(t - keyT, 0.5);
  const ppm = (CAR_K * 250) / RB16B.frame.k;
  // the background streams past to the left: streaks, each wrapping round at its own speed
  const streaks = Array.from({ length: 34 }, (_, i) => {
    const len = 160 + 360 * random(`o62l${i}`);
    const v = 2200 + 1600 * random(`o62v${i}`);
    const span = PW + len + 200;
    const x = PW + 100 - ((random(`o62x${i}`) * span + t * v) % span);
    const y = 30 + random(`o62h${i}`) * (PH - 60);
    const w = 2 + 5 * random(`o62w${i}`);
    return `M ${x} ${y - w / 2} L ${x + len} ${y} L ${x} ${y + w / 2} Z`;
  }).join(" ");
  return (
    <g>
      <rect width={PW} height={PH} fill={PAPER} />
      <path d={streaks} fill={INK} opacity={0.55} />
      <MangaCar
        car={NO_NUMBER}
        facing="right"
        at={{ x: CAR_AT.x, y: CAR_AT.y, pxPerMetre: ppm }}
        state={{ wheelAngle: t * 40 }}
      />
      <g
        transform={`translate(0 ${NUM.y - NUM.size * 0.35}) scale(1 ${sy}) translate(0 ${-(NUM.y - NUM.size * 0.35)})`}
      >
        <text
          x={NUM.x}
          y={NUM.y}
          textAnchor="middle"
          fontFamily="Arial Black, Arial, sans-serif"
          fontWeight={900}
          fontSize={NUM.size}
          fill={RB16B.numberAt.color ?? PAPER}
          stroke={INK}
          strokeWidth={1.5 * CAR_K}
          paintOrder="stroke"
          fontStyle="italic"
        >
          {label}
        </text>
      </g>
      {/* the turn-over lands with a white ring and a ring of ink spikes */}
      {burst > 0.01 ? (
        <g>
          <circle
            cx={NUM.x}
            cy={NUM.y - NUM.size * 0.35}
            r={NUM.size * (0.6 + 1.6 * (1 - burst))}
            fill="none"
            stroke={PAPER}
            strokeWidth={22 * burst}
          />
          <path
            d={Array.from({ length: 14 }, (_, i) => {
              const a = (i / 14) * Math.PI * 2 + 0.2;
              const r0 = NUM.size * (0.75 + 0.9 * (1 - burst));
              const r1 = r0 + NUM.size * 0.35;
              const cy = NUM.y - NUM.size * 0.35;
              return `M ${NUM.x + Math.cos(a) * r0} ${cy + Math.sin(a) * r0} L ${NUM.x + Math.cos(a) * r1} ${cy + Math.sin(a) * r1}`;
            }).join(" ")}
            stroke={INK}
            strokeWidth={7}
            strokeLinecap="round"
            opacity={burst}
          />
        </g>
      ) : null}
    </g>
  );
};

const PANELS: {
  cue: string;
  /** The panel's key event on beat 3 (none for the clash, which is its own downbeat). */
  key?: string;
  year: string;
  tilt: number;
  Art: React.FC<PanelProps>;
}[] = [
  { cue: "outro.flash1989", year: "1989 · 1990", tilt: -1.2, Art: Clash },
  {
    cue: "outro.flash2008",
    key: "outro.gold98",
    year: "2008",
    tilt: 1.0,
    Art: Score,
  },
  {
    cue: "outro.flash2020",
    key: "outro.haloGlint",
    year: "2020",
    tilt: -0.8,
    Art: Halo,
  },
  {
    cue: "outro.flash2021",
    key: "outro.number1",
    year: "2021",
    tilt: 1.2,
    Art: Number1,
  },
];

// The margin sequence (#17, the points motif): the gap between the two title rivals flashes in the shared points box,
// 16 → 9 → 1 → 0 → 8 (src/mv/points.ts, facts.md), on beats 2 and 4, between the panels' own accents (beat 1 and beat
// 3). Each margin belongs to its panel and leaves with it; the halo panel (2020) has none.
const MARGINS: { cue: string; panel: number; id: StandingId }[] = [
  { cue: "outro.margin16", panel: 0, id: "suzuka1989" },
  { cue: "outro.margin9", panel: 0, id: "suzuka1990" },
  { cue: "outro.margin1", panel: 1, id: "brazil2008" },
  { cue: "outro.margin0", panel: 3, id: "abuDhabiBefore" },
  { cue: "outro.margin8", panel: 3, id: "abuDhabiFinal" },
];
// The box sits inside the panel's top-right corner, over the empty top of every panel (clear of the helmets, the
// 98 · 97 box and the car: ART-14), and pushes in with the panel.
const MARGIN_SIZE = 96;
const MARGIN_AT = { x: PX + PW - 200, y: PY + 30 + (MARGIN_SIZE * 1.49) / 2 };

const shot58 = ABU_EDIT.shots.find((s) => s.id === "5.8");

/** The paper dissolve into panels 3 and 4, s (5 frames). */
const DISSOLVE = 5 / FPS;
/** Slow push-in on every panel: this much bigger per bar. */
const PUSH = 0.05;
const BAR_S = 4 * SECONDS_PER_BEAT;

// One page: the light-toned page, the panel with its ink shadow and frame, the year in a caption box on its edge.
const Page: React.FC<{
  i: number;
  t: number;
  keyAt: number;
  yearFlip?: number;
  /** The margin on show in this panel and the seconds since it slammed in. */
  margin?: { id: StandingId; since: number } | null;
}> = ({ i, t, keyAt, yearFlip = 0, margin = null }) => {
  const p = PANELS[i];
  const Art = p.Art;
  const cx = PX + PW / 2;
  const cy = PY + PH / 2;
  const id = `o62-clip-${i}`;
  const year = yearFlip >= 0.5 ? "2022" : p.year;
  const cap = captionSize([year], 54);
  const capX = PX + 70;
  const capY = PY + PH - cap.h / 2;
  const push = 1 + PUSH * Math.min(1.6, Math.max(0, t) / BAR_S);
  return (
    <g>
      <rect width={1920} height={1080} fill={tone("light", "o62")} />
      <g
        transform={`translate(${cx} ${cy}) scale(${push}) rotate(${p.tilt}) translate(${-cx} ${-cy})`}
      >
        <rect x={PX + 16} y={PY + 16} width={PW} height={PH} fill={INK} />
        <clipPath id={id}>
          <rect x={PX} y={PY} width={PW} height={PH} />
        </clipPath>
        <g clipPath={`url(#${id})`}>
          <g transform={`translate(${PX} ${PY})`}>
            <Art t={t} keyT={keyAt} />
          </g>
        </g>
        <rect
          x={PX}
          y={PY}
          width={PW}
          height={PH}
          fill="none"
          stroke={INK}
          strokeWidth={12}
        />
        <g
          transform={`translate(0 ${capY + cap.h / 2}) scale(1 ${flipScale(yearFlip)}) translate(0 ${-(capY + cap.h / 2)})`}
        >
          <Caption x={capX} y={capY} lines={[year]} size={54} />
        </g>
        {margin ? (
          <g
            key={margin.id}
            transform={`translate(${MARGIN_AT.x} ${MARGIN_AT.y}) rotate(${-1.5 * p.tilt})`}
          >
            <PointsBox
              columns={marginColumns(margin.id)}
              size={MARGIN_SIZE}
              unit="PTS"
              since={margin.since}
              goldSince={margin.since}
            />
          </g>
        ) : null}
      </g>
    </g>
  );
};

export const Flashbacks: React.FC<{ st: ShotTime }> = ({ st }) => {
  useLettering();
  const starts = PANELS.map((p) => secondsInShot(st, cueAt(EDIT, p.cue)));
  const keys = PANELS.map((p, i) =>
    p.key ? secondsInShot(st, cueAt(EDIT, p.key)) - starts[i] : 0,
  );
  const turn = secondsInShot(st, cueAt(EDIT, "outro.number1"));
  let cur = 0;
  for (let i = 0; i < PANELS.length; i++) if (st.t >= starts[i]) cur = i;
  const since = st.t - starts[cur];
  // panel 1 slams in from oversize over 5.8's photo and shakes the frame
  const slam = cur === 0 ? Math.min(1, since / 0.12) : 1;
  const slamS =
    cur === 0 ? 1.22 - 0.22 * Easing.out(Easing.back(1.8))(slam) : 1;
  const punch = cur === 0 ? decay(since, 0.3) : 0;
  const shakeX = punch * 12 * Math.sin(st.t * 97);
  const shakeY = punch * 9 * Math.cos(st.t * 83);
  // panels 3 and 4: the new page dissolves in over the old through a light paper wash (panel 2 is a hard cut)
  const dissolving = cur >= 2 && since < DISSOLVE;
  const e = Math.min(1, (Math.round(since * FPS) + 1) / 6);
  const yearFlip =
    cur === 3 ? Math.max(0, Math.min(1, (st.t - turn) / 0.16)) : 0;
  const marginAt = MARGINS.map((m) => secondsInShot(st, cueAt(EDIT, m.cue)));
  // the latest margin of panel i that has slammed in
  const marginOf = (i: number) => {
    let out: { id: StandingId; since: number } | null = null;
    MARGINS.forEach((m, k) => {
      if (m.panel === i && st.t >= marginAt[k])
        out = { id: m.id, since: st.t - marginAt[k] };
    });
    return out;
  };
  const page = (i: number) => (
    <Page
      i={i}
      t={st.t - starts[i]}
      keyAt={keys[i]}
      yearFlip={i === 3 ? yearFlip : 0}
      margin={marginOf(i)}
    />
  );
  // the first panel slams onto 5.8's last frame (still running: the confetti keeps falling)
  const t58 =
    cur === 0 && slam < 1 && shot58
      ? {
          shot: shot58,
          f: st.f,
          frame: frameAt(shot58.to) - frameAt(shot58.from) + st.frame,
          t: (frameAt(shot58.to) - frameAt(shot58.from)) / FPS + st.t,
          dur: (frameAt(shot58.to) - frameAt(shot58.from)) / FPS,
        }
      : null;
  return (
    <>
      {t58 ? <ChampionCard st={t58} /> : null}
      <svg width={1920} height={1080} style={{ position: "absolute" }}>
        <defs>
          <ToneDefs prefix="o62" />
        </defs>
        <g transform={`translate(${shakeX} ${shakeY})`}>
          {dissolving ? (
            <g>
              {page(cur - 1)}
              <rect
                width={1920}
                height={1080}
                fill={PAPER}
                opacity={0.35 * Math.sin(Math.PI * e)}
              />
              <g opacity={e}>{page(cur)}</g>
            </g>
          ) : (
            <g
              transform={`translate(960 540) scale(${slamS}) translate(-960 -540)`}
              opacity={cur === 0 ? Math.min(1, since * 30) : 1}
            >
              {page(cur)}
            </g>
          )}
        </g>
      </svg>
    </>
  );
};
