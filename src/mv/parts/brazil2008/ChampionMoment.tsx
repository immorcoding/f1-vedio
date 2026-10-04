// The illustration in the left panel of the champion card (2.7): HAM's McLaren MP4-23 flat out on the wet Interlagos
// pit straight, side-on and large, the chequered line coming up under its nose. Behind it the main grandstand and its
// crowd in black-and-white tone, a wet track mirroring the car, a rooster tail of spray off the rear wheel and rain
// over everything (ART-8: environment in tone, the car in its real livery; on intermediates, facts.md).
//
// It is a slow-motion picture (MOT-5): the world slides past at 1/40 of the car's 55 m/s, so the line creeps up and
// crosses under the front wheel on `crossAt` (the last slam), then slides back under the car through the hold, while
// the wheels, spray and rain keep their full-speed look. Drawn in page coordinates
// through its own low pinhole camera, centred on the panel; the caller clips it to the panel.
import { MP4_23, carLength, carPoint } from "../../../cars";
import { pinhole } from "../../../kit/camera";
import { INK, PAPER } from "../../../kit/colors";
import { focusLines } from "../../../kit/lines";
import { Splashes, Spray } from "../../../kit/rain";
import { FinishStripe } from "../../../scenes/brazil-2008/trackside";
import { RainCloseup } from "./common";

// A low camera (1.4 m) so the car stands tall against the grandstand; its optical axis is the panel's centre line.
export const MOMENT_CAM = pinhole({
  f: 2300,
  horizon: 483,
  cx: 552,
  height: 1.4,
});
const Z = 14.2; // the car's distance from the camera, m
const V = 55; // m/s on the straight
const SLOW = 0.025; // slow-motion factor of the picture

const m = MOMENT_CAM.pxPerMetre(Z);
const LENGTH = carLength(MP4_23);
// the car's rear end relative to the camera (m), so its middle sits a little right of the panel's centre, leaving room for the spray
const REL = (590 - MOMENT_CAM.cx) / m - LENGTH / 2;
const anchor = MOMENT_CAM.anchor({ x: REL, z: Z });
const k = (m * MP4_23.frame.k) / 250;

// HAM's helmet in the cockpit, on screen
export const MOMENT_HELMET = {
  x: anchor.x + (MP4_23.frame.x - MP4_23.helmetAt.cx) * k,
  y: anchor.y + (MP4_23.helmetAt.cy - MP4_23.frame.ground) * k,
  r: MP4_23.helmetAt.r * k,
};
// the middle of the car's body, where the panel's push-in is centred
export const MOMENT_CAR = {
  x: anchor.x + (LENGTH / 2) * m,
  y: anchor.y - 0.45 * m,
};

export const ChampionMoment: React.FC<{
  t: number;
  // seconds into the shot when the front wheel crosses the line
  crossAt: number;
  // 0–1: the slams' punch (focus lines tighten and darken)
  punch: number;
}> = ({ t, crossAt, punch }) => {
  const front = carPoint(MP4_23, "frontContact").x;
  const rear = carPoint(MP4_23, "rearContact").x;
  // race time of the slow-motion picture: the car's rear end is at world x = V·tau, the line at world x = front
  const tau = SLOW * (t - crossAt);
  const camX = V * tau - REL;
  const lineX = front;
  const rearX = anchor.x + (rear - 0.35) * m;
  return (
    <RainCloseup
      t={t}
      camX={camX}
      cam={MOMENT_CAM}
      speed={0.9}
      tilt={-2}
      ground={
        <g>
          <FinishStripe cam={MOMENT_CAM} camX={camX} x={lineX} />
          {/* drops landing on the wet track in front of the car */}
          <Splashes
            x0={44}
            x1={1060}
            y0={anchor.y + 10}
            y1={1036}
            t={t}
            n={46}
            color={PAPER}
            seed="b27-splash"
          />
          {/* the rooster tail: a tall plume thrown up behind the rear wheel, under the car */}
          <Spray
            x={rearX}
            y={anchor.y}
            m={m}
            t={t * 0.8 + 0.4}
            length={10}
            height={3.2}
            seed="b27-rooster"
          />
        </g>
      }
      cars={[
        {
          car: MP4_23,
          x: REL,
          z: Z,
          state: {
            wheelAngle: ((t * V * 0.25) / 0.29) * (180 / Math.PI),
            tread: "wet",
          },
        },
      ]}
    >
      <path
        d={focusLines(
          MOMENT_CAR.x,
          MOMENT_CAR.y,
          520 - 60 * Math.min(1, punch),
          120,
          Math.floor(t * 10),
        )}
        fill={INK}
        opacity={0.35 + 0.35 * Math.min(1, punch)}
      />
    </RainCloseup>
  );
};
