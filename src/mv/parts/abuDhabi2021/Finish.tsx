// Shot 5.6 (bars 99–100): VER takes the flag. On the cut (99.1, `abuDhabi2021.finish`) his front tyre is on the
// finish line — the panel opens in slow motion with a white flash and focus lines behind him (VER stays fully solid), the chequered flag waves in the
// inset, then the camera speeds back up to race pace and the line streams away behind him.
import { carPoint, PIRELLI_2021, RB16B } from "../../../cars";
import { INK, PAPER } from "../../../kit/colors";
import { focusLines } from "../../../kit/lines";
import { ChequeredFlag } from "../../../scenes/abu-dhabi-2021/ChequeredFlag";
import { Closeup, trackLayout } from "../../../scenes/abu-dhabi-2021/Closeup";
import { T5_CAM } from "../../../scenes/abu-dhabi-2021/T5Panel";
import { hit, smooth, type ShotTime } from "./shotClock";

const cam = T5_CAM;
const VER_X = -3.4;
const VER_Z = 11;
// The line sits under VER's front contact patch when the camera is at 0.
const FINISH_X = VER_X + carPoint(RB16B, "frontContact").x;
const LAYOUT = trackLayout(-60, 200, { x0: 40, x1: 120, z: 520, top: 38 });
const INSET = { x: 1250, y: 70, w: 600, h: 360 };
// Where the line meets VER's front tyre on screen, for the focus lines.
const LINE_AT = cam.project({ x: FINISH_X, z: VER_Z });

// Camera travel: slow motion at the line (6 m/s), easing back to 75 m/s over 1.4 s.
const camAt = (t: number) => {
  let x = 0;
  const n = Math.ceil(t * 120);
  for (let i = 0; i < n; i++) {
    const u = ((i + 0.5) / n) * t;
    x += (6 + 69 * smooth(u / 1.4)) * (t / n);
  }
  return x;
};

export const Finish: React.FC<{ st: ShotTime }> = ({ st }) => {
  const { t } = st;
  const camX = camAt(t);
  const flash = hit(t, 0, 0.12);
  const burst = hit(t, 0, 0.6);
  const fast = smooth(t / 1.4);
  return (
    <Closeup
      cam={cam}
      layout={LAYOUT}
      camX={camX}
      seed={Math.floor(t * (6 + 14 * fast))}
      speed={0.15 + 0.85 * fast}
      tilt={-4}
      shake={{ x: Math.sin(t * 57) * 10 * burst, y: Math.cos(t * 49) * 7 * burst }}
      marks={[{ kind: "finish", x: FINISH_X }]}
      focus={{ x: LINE_AT.x, y: LINE_AT.y - 60 }}
      cars={[
        {
          car: RB16B,
          x: VER_X,
          z: VER_Z,
          state: { wheelAngle: camX * 170, compound: PIRELLI_2021.soft },
        },
      ]}
      between={
        // flash and burst behind VER only: he stays the most solid thing on screen
        <g>
          <rect x={-200} y={-200} width={2320} height={1480} fill={PAPER} opacity={0.75 * flash} />
          <path
            d={focusLines(LINE_AT.x, LINE_AT.y - 120, 430, 150, Math.floor(t * 10))}
            fill={INK}
            opacity={0.25 + 0.5 * burst}
          />
        </g>
      }
    >
      <defs>
        <clipPath id="fin-inset">
          <rect x={INSET.x} y={INSET.y} width={INSET.w} height={INSET.h} />
        </clipPath>
      </defs>
      <g clipPath="url(#fin-inset)">
        <rect x={INSET.x} y={INSET.y} width={INSET.w} height={INSET.h} fill={PAPER} />
        <path d={focusLines(INSET.x + 300, INSET.y + 180, 200, 100, Math.floor(t * 8) + 3)} fill={INK} opacity={0.5} />
        <ChequeredFlag x={INSET.x + 130} y={INSET.y + 60} w={380} h={230} t={t} swing={Math.sin(t * 5) * 12} />
      </g>
      <rect x={INSET.x} y={INSET.y} width={INSET.w} height={INSET.h} fill="none" stroke={INK} strokeWidth={9} />
    </Closeup>
  );
};
