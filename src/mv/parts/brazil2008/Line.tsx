// Shot 2.6 (bars 49–52): HAM crosses the line, fifth — enough by one point. The camera picks him up on the pit
// straight in the rain and holds him as the chequered line slides under his wheels (~1.4 s in, a white flash); then
// the shot slows and the camera pushes in on HAM in the cockpit — the spray hangs, focus lines close in as the title
// sinks in.
import { MP4_23, carPoint } from "../../../cars";
import { INK } from "../../../kit/colors";
import { focusLines } from "../../../kit/lines";
import {
  BRAZIL_CAM,
  FinishStripe,
} from "../../../scenes/brazil-2008/trackside";
import { hit, ramp, type ShotTime } from "../abuDhabi2021/shotClock";
import { Page, Panel, RainCloseup } from "./common";
import { PosTag } from "./PosTag";

const V = 55; // m/s past the line
const LINE_X = 0; // the finish line, world m

export const Line: React.FC<{ st: ShotTime }> = ({ st }) => {
  const { t, dur } = st;
  const front = carPoint(MP4_23, "frontContact").x;
  // HAM's rear end along the track, and where the camera keeps him in the frame
  const crossAt = 1.4;
  // after the line the picture goes to slow motion: race time τ runs at 0.35× (MOT-5: slow motion, not a slow car)
  const slowFrom = crossAt + 0.5;
  const tau = t <= slowFrom ? t : slowFrom + 0.35 * (t - slowFrom);
  const xw = LINE_X + V * (tau - crossAt) - front;
  const rel = -5.5 + 3.5 * ramp(t, 0, 1.8) + 0.8 * ramp(t, crossAt, dur);
  const camX = xw - rel;
  const flash = hit(t, crossAt, 0.15);
  const settle = ramp(t, crossAt + 0.8, dur);
  // the push-in: from the full frame to a crop around the cockpit
  const a = BRAZIL_CAM.anchor({ x: rel, z: 10.2 });
  const k = (a.pxPerMetre * MP4_23.frame.k) / 250;
  const hx = a.x + (MP4_23.frame.x - MP4_23.helmetAt.cx) * k;
  const hy = a.y + (MP4_23.helmetAt.cy - MP4_23.frame.ground) * k;
  const push = ramp(t, crossAt + 0.5, dur);
  const w = 1920 - 1020 * push;
  const h = (w * 1080) / 1920;
  const view = {
    x: (1 - push) * 0 + push * (hx - w * 0.45),
    y: (1 - push) * 0 + push * (hy - h * 0.5),
    w,
    h,
  };
  return (
    <Page>
      <Panel box={{ x: 0, y: 0, w: 1920, h: 1080 }} view={view} border={false}>
        <RainCloseup
          t={tau}
          camX={camX}
          speed={0.8 * (1 - settle)}
          tilt={-2 - 2 * flash}
          shake={{
            x: Math.sin(t * 51) * 9 * flash,
            y: Math.cos(t * 47) * 7 * flash,
          }}
          ground={<FinishStripe cam={BRAZIL_CAM} camX={camX} x={LINE_X} />}
          cars={[
            {
              car: MP4_23,
              x: rel,
              z: 10.2,
              state: {
                wheelAngle: ((tau * V) / 0.29) * (180 / Math.PI),
                tread: "wet",
              },
            },
          ]}
        >
          <path
            d={focusLines(
              960,
              640,
              760 - 260 * settle,
              140,
              Math.floor(t * 10),
            )}
            fill={INK}
            opacity={0.1 + 0.45 * settle + 0.4 * flash}
          />
          <rect
            width={1920}
            height={1080}
            fill="#fbfaf6"
            opacity={0.8 * flash}
          />
        </RainCloseup>
      </Panel>
      {/* the position he needed: 5th, once he is over the line */}
      <g opacity={ramp(t, crossAt, crossAt + 0.2)}>
        <PosTag x={260} y={150} code="HAM" pos={5} big />
      </g>
    </Page>
  );
};
