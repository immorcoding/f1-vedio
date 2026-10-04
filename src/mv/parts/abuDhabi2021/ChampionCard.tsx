// Shot 5.8 (bars 103–104): the one real photo in the film (ART-19) — VER on the 2021 Abu Dhabi podium, full-bleed in
// muted colour, the right side inked down so the Red Bull team-radio line (STO-8) reads over the LED wall. The lines
// stamp in on the beats of bar 103 and hold through 104.
// The photo is local only (public/photos/, gitignored, see the reference register): it must be licensed or swapped for
// a free photo of the same moment before the film is published.
import { Easing, Img, interpolate, staticFile } from "remotion";
import { INK, PAPER } from "../../../kit/colors";
import { at, FPS } from "../../timing";
import { secondsInShot, type ShotTime } from "./shotClock";

const PHOTO = staticFile("photos/ver-2021-abu-dhabi-podium.png");

const LINES = [
  { t: "MAX VERSTAPPEN,", y: 560, fs: 60, beat: 1 },
  { t: "YOU ARE THE", y: 640, fs: 60, beat: 2 },
  { t: "WORLD", y: 810, fs: 150, beat: 3 },
  { t: "CHAMPION!", y: 950, fs: 120, beat: 4 },
];

export const ChampionCard: React.FC<{ st: ShotTime }> = ({ st }) => {
  // slow push-in on the photo over the whole shot
  const zoom = interpolate(st.t, [0, st.dur], [1.06, 1], {
    easing: Easing.out(Easing.cubic),
  });
  const ink = interpolate(st.t, [0, 0.35], [0, 1], {
    extrapolateRight: "clamp",
  });
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: INK,
        overflow: "hidden",
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
        }}
      />
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
        <g transform="rotate(-3 1540 760)">
          {LINES.map(({ t, y, fs, beat }, i) => {
            // each line slams in on its beat: oversize and transparent → settled in ~0.12 s
            const since = st.t - secondsInShot(st, at(103, beat));
            if (since < 0) return null;
            const u = Math.min(1, since / 0.12);
            const s = 1.35 - 0.35 * Easing.out(Easing.back(2))(u);
            return (
              <text
                key={t}
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
                transform={`translate(1540 ${y - fs / 3}) scale(${s}) translate(-1540 ${-(y - fs / 3)})`}
              >
                {t}
              </text>
            );
          })}
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
      </svg>
    </div>
  );
};
