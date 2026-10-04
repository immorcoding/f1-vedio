// Shot 6.3 (outro bars 7–8): the family photo. The helmet of every driver in the film drops into one row in race
// order, one every half beat of bar 7, each with its three-letter code in a type-D label chip; VER lands last, on the
// downbeat of bar 8, with the title F1 · 1989–2021 and its chequered strip. From beat 3 the page fades to black.
// Helmets are the drivers' own designs from the car specs (ART-13), no faces (ART-5). HAM wears his 2008 helmet (the
// yellow one he won his first title in, shot 2.7), not the 2021 purple one.
import { Easing } from "remotion";
import {
  CARS_2008,
  DriverHelmet,
  GRO_2020,
  KVY_2020,
  PRO_1989,
  RB16B,
  SEN_1989,
  type Driver,
} from "../../../cars";
import { INK, PAPER } from "../../../kit/colors";
import {
  CAPTION_FONT,
  CircuitTag,
  TitleText,
  measure,
  titleWidth,
  useLettering,
} from "../../../kit/lettering";
import { focusLines } from "../../../kit/lines";
import { ToneDefs, tone } from "../../../kit/tone";
import { SECONDS_PER_BEAT } from "../../timing";
import { cueAt, secondsInShot, type ShotTime } from "../abuDhabi2021/shotClock";
import { EDIT } from "./shots.ts";

const byNumber = (n: string): Driver => {
  const car = Object.values(CARS_2008).find((c) => c.driver.number === n);
  if (!car) throw new Error(`outro: no 2008 car #${n}`);
  return car.driver;
};

const DRIVERS: { code: string; driver: Driver }[] = [
  { code: "PRO", driver: PRO_1989 },
  { code: "SEN", driver: SEN_1989 },
  { code: "MAS", driver: byNumber("2") },
  { code: "HAM", driver: byNumber("22") },
  { code: "VET", driver: byNumber("15") },
  { code: "GLO", driver: byNumber("12") },
  { code: "GRO", driver: GRO_2020 },
  { code: "KVY", driver: KVY_2020 },
  { code: "VER", driver: RB16B.driver },
];

const R = 76; // helmet radius, px
const GAP = 196;
const ROW_Y = 400;
const LABEL_Y = 510;
const TITLE_SIZE = 150;
const TITLE_Y = 790;
const TITLE = "F1 · 1989–2021";
const FALL_S = 0.17; // a helmet falls this long and lands on its beat

const decay = (since: number, len: number) =>
  since < 0 ? 0 : Math.max(0, 1 - since / len) ** 2;

const Label: React.FC<{ x: number; code: string; o: number; s: number }> = ({
  x,
  code,
  o,
  s,
}) => {
  const size = 34;
  const w = measure(code, CAPTION_FONT, 700, size, 0.08) + 30;
  const h = 50;
  return (
    <g
      opacity={o}
      transform={`translate(${x} ${LABEL_Y}) scale(${s}) translate(${-x} ${-LABEL_Y})`}
    >
      <rect
        x={x - w / 2 + 5}
        y={LABEL_Y - h / 2 + 5}
        width={w}
        height={h}
        fill={INK}
        opacity={0.35}
      />
      <rect x={x - w / 2} y={LABEL_Y - h / 2} width={w} height={h} fill={INK} />
      <text
        x={x}
        y={LABEL_Y + size * 0.345}
        textAnchor="middle"
        fontFamily={CAPTION_FONT}
        fontWeight={700}
        fontSize={size}
        letterSpacing="0.08em"
        fill={PAPER}
      >
        {code}
      </text>
    </g>
  );
};

const Glint: React.FC<{ x: number; y: number; s: number }> = ({ x, y, s }) =>
  s < 0.5 ? null : (
    <g transform={`translate(${x} ${y})`}>
      <path
        d={`M 0 ${-s} Q ${s * 0.1} ${-s * 0.1} ${s} 0 Q ${s * 0.1} ${s * 0.1} 0 ${s} Q ${-s * 0.1} ${s * 0.1} ${-s} 0 Q ${-s * 0.1} ${-s * 0.1} 0 ${-s} Z`}
        fill={PAPER}
        stroke={INK}
        strokeWidth={2}
      />
    </g>
  );

export const Family: React.FC<{ st: ShotTime }> = ({ st }) => {
  useLettering();
  const { t } = st;
  const t0 = secondsInShot(st, cueAt(EDIT, "outro.family"));
  const tTitle = secondsInShot(st, cueAt(EDIT, "outro.title"));
  const tGlint = secondsInShot(st, cueAt(EDIT, "outro.familyGlint"));
  const tFade = secondsInShot(st, cueAt(EDIT, "outro.fade"));
  const tEnd = secondsInShot(st, cueAt(EDIT, "outro.black"));
  // eight drivers on the half beats of bar 7, VER on the downbeat of bar 8
  const lands = DRIVERS.map((_, i) =>
    i < DRIVERS.length - 1 ? t0 + (i * SECONDS_PER_BEAT) / 2 : tTitle,
  );
  const sinceTitle = t - tTitle;
  const punch = Math.max(
    decay(sinceTitle, 0.45) * 1.6,
    ...lands.map((l) => decay(t - l, 0.12) * 0.35),
  );
  const shakeX = punch * 8 * Math.sin(t * 97);
  const shakeY = punch * 6 * Math.cos(t * 83);
  const push = 1 + (0.03 * Math.max(0, t)) / st.dur;
  const fade = Math.max(0, Math.min(1, (t - tFade) / (tEnd - tFade - 4 / 60)));
  const x0 = 960 - ((DRIVERS.length - 1) * GAP) / 2;

  // title: slams in with VER, then the strip wipes in under it
  const tw = titleWidth(TITLE, TITLE_SIZE);
  const slam = Math.min(1, Math.max(0, sinceTitle) / 0.12);
  const titleS = 1.35 - 0.35 * Easing.out(Easing.back(2))(slam);
  const stripSize = 40;
  const sq = Math.round(stripSize * 0.42);
  const checks = Math.round(tw / sq);
  const strip = Math.max(0, Math.min(1, (sinceTitle - 0.1) / 0.3));

  return (
    <svg width={1920} height={1080} style={{ position: "absolute" }}>
      <defs>
        <ToneDefs prefix="o63" />
      </defs>
      <rect width={1920} height={1080} fill={PAPER} />
      <g
        transform={`translate(${shakeX} ${shakeY}) translate(960 540) scale(${push}) translate(-960 -540)`}
      >
        {/* a band of light tone behind the row, like a backdrop */}
        <rect
          x={0}
          y={ROW_Y - 150}
          width={1920}
          height={330}
          fill={tone("light", "o63")}
        />
        <path
          d={`M 0 ${ROW_Y - 150} H 1920 M 0 ${ROW_Y + 180} H 1920`}
          stroke={INK}
          strokeWidth={6}
        />
        {sinceTitle > 0 ? (
          <path
            d={focusLines(960, TITLE_Y - 50, 560, 120, 17)}
            fill={INK}
            opacity={0.12 + 0.5 * decay(sinceTitle, 0.5)}
          />
        ) : null}
        {DRIVERS.map(({ code, driver }, i) => {
          const x = x0 + i * GAP;
          const since = t - lands[i];
          if (since < -FALL_S) return null;
          const u = Math.min(1, (since + FALL_S) / FALL_S);
          const y = ROW_Y - 620 * (1 - u) ** 2;
          // squash on landing, settling back
          const sq2 =
            since > 0
              ? 0.12 * Math.exp(-since / 0.08) * Math.cos(since * 40)
              : 0;
          const glint = decay(t - tGlint - i * 0.035, 0.35);
          const last = i === DRIVERS.length - 1;
          return (
            <g key={code}>
              <ellipse
                cx={x + 6}
                cy={ROW_Y + R * 0.78}
                rx={R * (0.6 + 0.4 * u)}
                ry={R * 0.13}
                fill={INK}
                opacity={0.25 + 0.35 * u}
              />
              <g
                transform={`translate(${x} ${y + R * 0.7}) scale(${1 + sq2} ${1 - sq2}) translate(${-x} ${-(y + R * 0.7)})`}
              >
                <DriverHelmet
                  driver={driver}
                  x={x}
                  y={y}
                  r={last ? R * 1.06 : R}
                  facing="right"
                />
              </g>
              {since > 0 && since < 0.2 ? (
                <path
                  d={`M ${x - R * 1.3} ${ROW_Y + R * 0.55} l ${-30} ${-14} M ${x - R * 1.25} ${ROW_Y + R * 0.75} l ${-38} 0 M ${x + R * 1.3} ${ROW_Y + R * 0.55} l 30 -14 M ${x + R * 1.25} ${ROW_Y + R * 0.75} l 38 0`}
                  stroke={INK}
                  strokeWidth={4}
                  strokeLinecap="round"
                  opacity={1 - since / 0.2}
                />
              ) : null}
              <Glint x={x + R * 0.25} y={y - R * 0.75} s={36 * glint} />
              <Label
                x={x}
                code={code}
                o={Math.max(0, Math.min(1, (since - 0.04) * 12))}
                s={1 + 0.4 * decay(since - 0.04, 0.12)}
              />
            </g>
          );
        })}
        {sinceTitle >= 0 ? (
          <g
            transform={`translate(960 ${TITLE_Y - 50}) scale(${titleS}) translate(-960 ${-(TITLE_Y - 50)})`}
            opacity={Math.min(1, sinceTitle * 25)}
          >
            <TitleText
              x={960 - tw / 2 + 10}
              y={TITLE_Y}
              size={TITLE_SIZE}
              text={TITLE}
            />
          </g>
        ) : null}
        <CircuitTag
          x={960 - (checks * sq) / 2}
          y={TITLE_Y + 34}
          text=""
          strip={strip}
          name={0}
          size={stripSize}
          checks={checks}
        />
      </g>
      <rect
        x={20}
        y={20}
        width={1880}
        height={1040}
        fill="none"
        stroke={INK}
        strokeWidth={12}
      />
      <rect width={1920} height={1080} fill={INK} opacity={fade} />
    </svg>
  );
};
