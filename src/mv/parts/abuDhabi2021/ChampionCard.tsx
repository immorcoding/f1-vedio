// Shot 5.8 (bars 103–104): the one real photo in the film (ART-19) — VER on the 2021 Abu Dhabi podium, full-bleed in
// muted colour, the right side inked down so the Red Bull team-radio line (STO-8) reads over the LED wall. The lines
// stamp in on the beats of bar 103 and hold through 104.
// Effects: a white flash on the cut; every slam punches the frame (shake, a quick brightness pop on the photo, a burst
// of focus lines behind the lettering); the last slam ("CHAMPION!") hits hardest; glints on the trophy; confetti
// (gold, red, navy, white) falling through the whole shot, a few big pieces in front.
// The photo is local only (public/photos/, gitignored, see the reference register): it must be licensed or swapped for
// a free photo of the same moment before the film is published.
import { Easing, Img, interpolate, random, staticFile } from "remotion";
import { INK, PAPER } from "../../../kit/colors";
import { focusLines } from "../../../kit/lines";
import { at, FPS } from "../../timing";
import { secondsInShot, type ShotTime } from "./shotClock";

const PHOTO = staticFile("photos/ver-2021-abu-dhabi-podium.png");

const LINES = [
  { t: "MAX VERSTAPPEN,", y: 560, fs: 60, beat: 1 },
  { t: "YOU ARE THE", y: 640, fs: 60, beat: 2 },
  { t: "WORLD", y: 810, fs: 150, beat: 3 },
  { t: "CHAMPION!", y: 950, fs: 120, beat: 4 },
];
const TEXT_C = { x: 1540, y: 760 };

// trophy glints, in frame pixels (the photo is placed at left −40, 2057 × 1080)
const GLINTS = [
  { x: 1030, y: 150, r: 46, phase: 0 },
  { x: 1112, y: 330, r: 30, phase: 0.45 },
  { x: 985, y: 95, r: 22, phase: 0.8 },
];

const CONFETTI_COLOURS = [
  "#f2c230",
  "#e8b21c",
  "#e63b2e",
  "#1f2d7a",
  "#fbfaf6",
];
const N_BACK = 110;
const N_FRONT = 14;

// decays from 1 to 0 over `len` seconds after a hit `since` seconds ago
const decay = (since: number, len: number) =>
  since < 0 ? 0 : Math.max(0, 1 - since / len) ** 2;

const Glint: React.FC<{ x: number; y: number; r: number; s: number }> = ({
  x,
  y,
  r,
  s,
}) =>
  s <= 0.01 ? null : (
    <g transform={`translate(${x} ${y}) scale(${s}) rotate(${12 * s})`}>
      <path
        d={`M 0 ${-r} Q ${r * 0.1} ${-r * 0.1} ${r} 0 Q ${r * 0.1} ${r * 0.1} 0 ${r} Q ${-r * 0.1} ${r * 0.1} ${-r} 0 Q ${-r * 0.1} ${-r * 0.1} 0 ${-r} Z`}
        fill="#fffbe8"
      />
      <circle r={r * 0.18} fill="#ffffff" />
    </g>
  );

const Confetti: React.FC<{ t: number; front?: boolean }> = ({ t, front }) => {
  const n = front ? N_FRONT : N_BACK;
  const pieces = [];
  for (let i = 0; i < n; i++) {
    const k = `${front ? "f" : "b"}${i}`;
    const delay = random(`${k}d`) * (front ? 2.4 : 1.6) - (front ? 0 : 0.9);
    const age = t - delay;
    if (age < 0) continue;
    const size = front ? 34 + 22 * random(`${k}s`) : 10 + 12 * random(`${k}s`);
    const fall = front
      ? 420 + 160 * random(`${k}v`)
      : 190 + 150 * random(`${k}v`);
    // big front pieces stay at the left edge, clear of the face, trophy and lettering
    const x0 = front
      ? -30 + 420 * random(`${k}x`)
      : -40 + 2000 * random(`${k}x`);
    const sway = 30 + 50 * random(`${k}w`);
    const freq = 1.2 + 1.6 * random(`${k}f`);
    const y = -60 + fall * age;
    if (y > 1140) continue;
    const x =
      x0 + sway * Math.sin(freq * age * Math.PI * 2 + 7 * random(`${k}p`));
    const spin = 180 + 360 * random(`${k}r`);
    const flip = Math.abs(
      Math.cos(age * freq * Math.PI * 1.7 + 3 * random(`${k}q`)),
    );
    const colour =
      CONFETTI_COLOURS[Math.floor(random(`${k}c`) * CONFETTI_COLOURS.length)];
    pieces.push(
      <rect
        key={k}
        x={-size / 2}
        y={-size * 0.2}
        width={size}
        height={size * 0.4 * (0.25 + 0.75 * flip)}
        fill={colour}
        stroke={INK}
        strokeWidth={front ? 2.5 : 1}
        transform={`translate(${x} ${y}) rotate(${spin * age + 360 * random(`${k}a`)})`}
        opacity={front ? 0.95 : 0.9}
      />,
    );
  }
  return <g>{pieces}</g>;
};

export const ChampionCard: React.FC<{ st: ShotTime }> = ({ st }) => {
  const sinceBeat = LINES.map(
    ({ beat }) => st.t - secondsInShot(st, at(103, beat)),
  );
  // the punch of each slam; the fourth hits harder
  const punch = sinceBeat.reduce(
    (m, s, i) =>
      Math.max(m, decay(s, i === 3 ? 0.45 : 0.25) * (i === 3 ? 1.8 : 1)),
    0,
  );
  const shakeX = punch * 9 * Math.sin(st.t * 97);
  const shakeY = punch * 7 * Math.cos(st.t * 83);
  // slow push-in on the photo over the whole shot, plus a small kick on every slam
  const zoom =
    interpolate(st.t, [0, st.dur], [1.06, 1], {
      easing: Easing.out(Easing.cubic),
    }) +
    0.012 * punch;
  const pop = 1 + 0.18 * punch; // brightness pop on the photo
  const ink = interpolate(st.t, [0, 0.35], [0, 1], {
    extrapolateRight: "clamp",
  });
  const cutFlash = decay(st.t, 0.22);
  const finalBurst = decay(sinceBeat[3], 0.6);
  const glintPulse = (phase: number) => {
    // glints flare on each slam and twinkle slowly in between
    const flare = sinceBeat.reduce(
      (m, s) => Math.max(m, decay(s - phase * 0.1, 0.4)),
      0,
    );
    const twinkle = 0.35 + 0.35 * Math.sin((st.t * 2.2 + phase) * Math.PI * 2);
    return st.t < 0.15 ? 0 : Math.max(flare * 1.2, twinkle);
  };
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: INK,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `translate(${shakeX}px, ${shakeY}px)`,
        }}
      >
        <Img
          src={PHOTO}
          style={{
            position: "absolute",
            left: -40,
            top: 0,
            width: 2057,
            height: 1080,
            transform: `scale(${zoom})`,
            transformOrigin: "35% 40%",
            filter: `brightness(${pop}) contrast(${1 + 0.08 * punch})`,
          }}
        />
        <svg width={1920} height={1080} style={{ position: "absolute" }}>
          <Confetti t={st.t} />
        </svg>
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: ink,
            background:
              "linear-gradient(90deg, rgba(14,14,20,0) 52%, rgba(14,14,20,0.82) 66%, rgba(14,14,20,0.9) 100%)",
          }}
        />
        <svg width={1920} height={1080} style={{ position: "absolute" }}>
          {/* focus lines behind the lettering: they flare on every slam, and stay faintly after the last */}
          <clipPath id="champion-right">
            <rect x={1180} y={0} width={740} height={1080} />
          </clipPath>
          <path
            clipPath="url(#champion-right)"
            d={focusLines(TEXT_C.x, TEXT_C.y, 330, 90, 31)}
            fill={PAPER}
            opacity={Math.min(
              0.55,
              0.08 + 0.4 * punch + (sinceBeat[3] > 0 ? 0.1 : 0),
            )}
          />
          {GLINTS.map((g) => (
            <Glint key={g.x} x={g.x} y={g.y} r={g.r} s={glintPulse(g.phase)} />
          ))}
          <g transform="rotate(-3 1540 760)">
            {LINES.map(({ t, y, fs }, i) => {
              // each line slams in on its beat: oversize and transparent → settled in ~0.12 s
              const since = sinceBeat[i];
              if (since < 0) return null;
              const u = Math.min(1, since / 0.12);
              const s =
                (i === 3 ? 1.6 : 1.35) -
                (i === 3 ? 0.6 : 0.35) * Easing.out(Easing.back(2))(u);
              const cy = y - fs / 3;
              return (
                <g
                  key={t}
                  transform={`translate(1540 ${cy}) scale(${s}) translate(-1540 ${-cy})`}
                >
                  {/* a gold under-stroke on the big words */}
                  {i >= 2 && (
                    <text
                      x={1540 + 8}
                      y={y + 8}
                      textAnchor="middle"
                      textLength={660}
                      lengthAdjust="spacingAndGlyphs"
                      fontFamily="Arial Black, Arial, sans-serif"
                      fontWeight={900}
                      fontStyle="italic"
                      fontSize={fs}
                      fill="#f2c230"
                      stroke={INK}
                      strokeWidth={14}
                      paintOrder="stroke"
                      opacity={Math.min(1, (since * FPS) / 3)}
                    >
                      {t}
                    </text>
                  )}
                  <text
                    x={1540}
                    y={y}
                    textAnchor="middle"
                    textLength={660}
                    lengthAdjust="spacingAndGlyphs"
                    fontFamily="Arial Black, Arial, sans-serif"
                    fontWeight={900}
                    fontStyle="italic"
                    fontSize={fs}
                    fill={PAPER}
                    stroke={INK}
                    strokeWidth={i >= 2 ? 14 : 10}
                    paintOrder="stroke"
                    opacity={Math.min(1, (since * FPS) / 3)}
                  >
                    {t}
                  </text>
                </g>
              );
            })}
          </g>
          {/* the last slam: a white ring bursting out from the lettering */}
          {finalBurst > 0 && (
            <circle
              cx={TEXT_C.x}
              cy={TEXT_C.y + 120}
              r={120 + 900 * (1 - finalBurst)}
              fill="none"
              stroke={PAPER}
              strokeWidth={40 * finalBurst}
              opacity={finalBurst}
            />
          )}
          <Confetti t={st.t} front />
        </svg>
      </div>
      {/* the cut lands on a white flash */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: PAPER,
          opacity: cutFlash,
        }}
      />
      <svg width={1920} height={1080} style={{ position: "absolute" }}>
        <rect
          x={20}
          y={20}
          width={1880}
          height={1040}
          fill="none"
          stroke={INK}
          strokeWidth={12}
        />
      </svg>
    </div>
  );
};
