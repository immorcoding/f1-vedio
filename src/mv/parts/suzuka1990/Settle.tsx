// Shot 1.8 (bars 30–32): the dust settles, and the story closes on the layout it opened with. The crash panel holds on
// the two cars stopped in the Turn 1 gravel while the dust sinks and thins; on 30.2 it dims (as 1.4's result does) and
// the two helmet cards of 1.2 and 1.4 come back, larger, side by side and facing each other — PRO on the left (his own
// helmet, in the Ferrari he drives now), SEN on the right (the MP4/5B). PRO's card is stamped "1989 冠军" on 30.4 in
// the same red stamp as 1.4, SEN's "1990 冠军" on 31.2; on 31.4 one small line, "SEN 后来承认是故意的" (facts.md:
// Senna admitted it in 1991; no quote, STO-7). From the cards' entry the page pushes in, gathering pace to the cut on
// 33.1, so the ending never stands still.
import { Easing } from "remotion";
import { F641_PRO, MP4_5B_SEN } from "../../../cars";
import { INK, PAPER } from "../../../kit/colors";
import { InkFilterDef, inkFilter } from "../../../kit/ink";
import { Caption } from "../../../kit/lettering";
import { ToneDefs, tone } from "../../../kit/tone";
import { RESULT_DIM, StampedCard, type Box } from "../suzuka1989/Helmets";
import { cueFrame, ramp, shotById, type PictureProps } from "./common";
import { CrashStage } from "./Crash";

// The 1.2/1.4 card slots, scaled up about the frame's middle column: PRO left, SEN right, mirror images.
const L: Box = { x: 90, y: 70, w: 820, h: 440 };
const R: Box = { x: 1920 - 90 - 820, y: 70, w: 820, h: 440 };
const STAMP_SIZE = 96;

export const Settle: React.FC<PictureProps> = ({ f }) => {
  const shot = shotById("1.8");
  const [stampPro, stampSen, admitted] = shot.text;
  const helm = cueFrame("suzuka1990.helmets");
  const t = f - shot.from;
  // the dust sinks and thins from the cut until the first stamp
  const dustFade = ramp(
    f,
    shot.from,
    cueFrame("suzuka1990.stamp89"),
    Easing.inOut(Easing.quad),
  );
  const left = ramp(f, helm, helm + 22, Easing.out(Easing.back(1.2)));
  const right = ramp(f, helm + 8, helm + 30, Easing.out(Easing.back(1.2)));
  const dim = ramp(f, helm, helm + 20);
  const proStampAt = cueFrame("suzuka1990.stamp89");
  const senStampAt = cueFrame("suzuka1990.stamp90");
  const pro = ramp(f, proStampAt, proStampAt + 10, Easing.linear);
  const sen = ramp(f, senStampAt, senStampAt + 10, Easing.linear);
  const lineAt = cueFrame("suzuka1990.admitted");
  const line = ramp(f, lineAt, lineAt + 16, Easing.out(Easing.back(1.6)));
  // each card jolts when its stamp lands
  const jolt = (from: number) => {
    const k = f - from - 10;
    return k < 0 ? 0 : 9 * Math.exp(-k / 5) * Math.sin(k * 1.9);
  };
  // a push-in from the cards' entry to the cut that gathers pace instead of settling, the lines boiling like a held
  // manga beat
  const push = 1 + 0.08 * ramp(f, helm, shot.to, Easing.in(Easing.sin));
  const flicker = Math.floor(t / 5);
  const bob = (k: number) => 6 * Math.sin((t + k) / 22);
  return (
    <svg viewBox="0 0 1920 1080" width={1920} height={1080}>
      <defs>
        <ToneDefs />
        <InkFilterDef />
      </defs>
      <rect width={1920} height={1080} fill={PAPER} />
      <g filter={inkFilter()}>
        {/* the crash panel, held on its last frame, the cars at rest */}
        <CrashStage f={shot.from - 1} dustFade={dustFade} dustAge={t / 60} />
        {/* the scene dims behind the helmet cards, as in 1.4 */}
        <rect
          width={1920}
          height={1080}
          fill={tone("light")}
          opacity={RESULT_DIM * dim}
        />
        <g transform={`translate(960 150) scale(${push}) translate(-960 -150)`}>
          {left > 0 ? (
            <StampedCard
              car={F641_PRO}
              box={L}
              facing="right"
              id="s18-pro"
              seed={4 + (flicker % 5)}
              dx={-(1 - left) * 1100}
              dy={bob(0)}
              jolt={jolt(proStampAt)}
              stamp={stampPro}
              stampT={pro}
              stampSize={STAMP_SIZE}
            />
          ) : null}
          {right > 0 ? (
            <StampedCard
              car={MP4_5B_SEN}
              box={R}
              facing="left"
              id="s18-sen"
              seed={9 + (flicker % 5)}
              dx={(1 - right) * 1100}
              dy={bob(30)}
              jolt={jolt(senStampAt)}
              stamp={stampSen}
              stampT={sen}
              stampSize={STAMP_SIZE}
            />
          ) : null}
        </g>
        {line > 0 ? (
          <g
            opacity={Math.min(1, line)}
            transform={`translate(960 ${960 + 24 * (1 - line)})`}
          >
            <Caption
              x={-300}
              y={-50}
              w={600}
              h={96}
              lines={[admitted]}
              size={50}
            />
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
      </g>
    </svg>
  );
};
