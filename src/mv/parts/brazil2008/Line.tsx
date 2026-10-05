// Shot 2.6 (bars 51–52): HAM crosses the line, fifth — enough by one point. The camera picks him up on the pit
// straight in the rain and holds him as the chequered line slides under his wheels: his front tyre meets the line on
// 52.1 (`brazil2008.line`) with a white flash, and a chequered-flag inset drops in top right on the same beat, the
// flag swinging down; then the shot slows and the camera pushes in on HAM in the cockpit — the spray hangs, focus
// lines close in as the title sinks in.
import { useId } from "react";
import { MP4_23, carPoint } from "../../../cars";
import { INK, PAPER } from "../../../kit/colors";
import { focusLines } from "../../../kit/lines";
import {
  BRAZIL_CAM,
  FinishStripe,
} from "../../../scenes/brazil-2008/trackside";
import { ChequeredFlag } from "../../../scenes/abu-dhabi-2021/ChequeredFlag";
import {
  cueAt,
  hit,
  ramp,
  secondsInShot,
  type ShotTime,
} from "../abuDhabi2021/shotClock";
import { Page, Panel, RainCloseup } from "./common";
import { PosTag } from "./PosTag";
import { EDIT } from "./shots.ts";

const V = 55; // m/s past the line
const LINE_X = 0; // the finish line, world m
// the chequered-flag inset, top right, clear of the car and of HAM's tag (ART-14)
const INSET = { x: 1250, y: 70, w: 600, h: 360 };

export const Line: React.FC<{ st: ShotTime }> = ({ st }) => {
  const { t, dur } = st;
  const clip = `ln${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const front = carPoint(MP4_23, "frontContact").x;
  // HAM's rear end along the track, and where the camera keeps him in the frame
  const crossAt = secondsInShot(st, cueAt(EDIT, "brazil2008.line"));
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
      {/* the chequered flag, dropped in on the line beat and swung down (it is black and white: ART-8) */}
      {t >= crossAt ? (
        <g
          transform={`translate(0 ${-50 * (1 - ramp(t, crossAt, crossAt + 0.12))})`}
        >
          <defs>
            <clipPath id={clip}>
              <rect x={INSET.x} y={INSET.y} width={INSET.w} height={INSET.h} />
            </clipPath>
          </defs>
          <rect
            x={INSET.x + 9}
            y={INSET.y + 9}
            width={INSET.w}
            height={INSET.h}
            fill={INK}
          />
          <g clipPath={`url(#${clip})`}>
            <rect
              x={INSET.x}
              y={INSET.y}
              width={INSET.w}
              height={INSET.h}
              fill={PAPER}
            />
            <path
              d={focusLines(
                INSET.x + 300,
                INSET.y + 180,
                200,
                100,
                Math.floor(t * 8) + 3,
              )}
              fill={INK}
              opacity={0.5}
            />
            <ChequeredFlag
              x={INSET.x + 130}
              y={INSET.y + 60}
              w={380}
              h={230}
              t={t}
              swing={
                -35 * (1 - ramp(t, crossAt, crossAt + 0.18)) +
                10 * Math.sin((t - crossAt) * 5)
              }
            />
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
        </g>
      ) : null}
      {/* the position he needed: 5th, once he is over the line */}
      <g opacity={ramp(t, crossAt, crossAt + 0.2)}>
        <PosTag x={260} y={150} code="HAM" pos={5} big />
      </g>
    </Page>
  );
};
