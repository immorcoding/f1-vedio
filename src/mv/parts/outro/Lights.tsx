// Shot 6.3 (outro bars 7–8): the bookend to the intro. The intro's start-light gantry is inked in fast and its five
// red lights come on one a beat (the fifth on the second half of beat 4, the intro's rhythm squeezed into one bar). On
// bar 8 beat 1 all five go out; the camera pulls back from the red rows to the whole dark gantry and on beat 2 the
// title F1 · 1989–2021 slams in under it with its chequered strip, in paper on the black page. From beat 4 the frame
// fades to black, fully black at the end of the song.
import { Easing } from "remotion";
import { INK, PAPER } from "../../../kit/colors";
import {
  CircuitTag,
  TitleText,
  titleWidth,
  useLettering,
} from "../../../kit/lettering";
import { FPS, SECONDS_PER_BEAT } from "../../timing";
import { GantryArt, gantryCamera } from "../intro/Scene";
import {
  cueAt,
  secondsInShot,
  smooth,
  type ShotTime,
} from "../abuDhabi2021/shotClock";
import { EDIT } from "./shots.ts";

const TITLE = "F1 · 1989–2021";
const TITLE_SIZE = 130;
const TITLE_Y = 905;
const STRIP = 34;

export const LightsOut: React.FC<{ st: ShotTime }> = ({ st }) => {
  useLettering();
  const { t } = st;
  const sec = (id: string) => secondsInShot(st, cueAt(EDIT, id));
  const on = [1, 2, 3, 4].map((k) => sec(`outro.light${k}`));
  on.push(on[3] + SECONDS_PER_BEAT / 2); // the fifth, half a beat after the fourth
  const out = sec("outro.lightsOut");
  const tTitle = sec("outro.title");
  const tFade = sec("outro.fade");
  const tEnd = sec("outro.black");
  const dark = t >= out;
  // frames since each light came on (negative before)
  const since = on.map((s) => Math.round((t - s) * FPS));
  const lit = since.map((a) =>
    dark || a < 0 ? 0 : 1 + 0.7 * Math.exp(-a / 4),
  );
  // the intro's 0.2 framing on the red rows while the lights come on; after lights out a pull back to the whole
  // gantry, high in the frame, leaving the lower third for the title
  const pull = dark ? smooth((t - out) / 0.4) : 0;
  const scale = 1.3 + 0.06 * Math.min(1, t / out) + (0.75 - 1.36) * pull;
  const cy = 690 + (700 - 690) * pull;
  const cam = gantryCamera(
    scale,
    cy,
    since.map((a) => (dark ? -1 : a)),
  );
  const last = since[4];
  const focus = !dark && last >= 0 ? 0.28 + 0.45 * Math.exp(-last / 8) : 0;
  // the gantry inks in within the first ~0.2 s (the intro takes four bars); the first light is already on
  const draw = Math.min(460, 120 + t * FPS * 32);
  // lights out: a short white blink as they go, like the intro's cut
  const blink = dark ? Math.max(0, 1 - (t - out) / 0.1) : 0;

  const sinceTitle = t - tTitle;
  const tw = titleWidth(TITLE, TITLE_SIZE);
  const slam = Math.min(1, Math.max(0, sinceTitle) / 0.12);
  const titleS = 1.3 - 0.3 * Easing.out(Easing.back(2))(slam);
  const sq = Math.round(STRIP * 0.42);
  const checks = Math.round(tw / sq);
  const strip = Math.max(0, Math.min(1, (sinceTitle - 0.08) / 0.25));
  const fade = Math.max(0, Math.min(1, (t - tFade) / (tEnd - tFade - 3 / FPS)));

  return (
    <div style={{ position: "absolute", inset: 0, backgroundColor: INK }}>
      <GantryArt
        draw={draw}
        tone={Math.min(1, t * 4)}
        lit={lit}
        age={since}
        cam={cam}
        focus={focus}
        focusFrame={Math.round(t * FPS)}
      />
      <svg
        width={1920}
        height={1080}
        style={{ position: "absolute", left: 0, top: 0 }}
      >
        <rect width={1920} height={1080} fill={PAPER} opacity={0.35 * blink} />
        {sinceTitle >= 0 ? (
          <g
            transform={`translate(960 ${TITLE_Y - 45}) scale(${titleS}) translate(-960 ${-(TITLE_Y - 45)})`}
            opacity={Math.min(1, sinceTitle * 25)}
          >
            <TitleText
              x={960 - tw / 2 + 8}
              y={TITLE_Y}
              size={TITLE_SIZE}
              text={TITLE}
              colour={PAPER}
            />
          </g>
        ) : null}
        <CircuitTag
          x={960 - (checks * sq) / 2}
          y={TITLE_Y + 30}
          text=""
          strip={strip}
          name={0}
          size={STRIP}
          checks={checks}
          colour={PAPER}
        />
        <rect width={1920} height={1080} fill={INK} opacity={fade} />
      </svg>
    </div>
  );
};
