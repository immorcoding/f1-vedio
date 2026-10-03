// Shot 2.2 (bars 35–38): the last lap in the rain. The camera picks up HAM's McLaren on intermediates (cut tread)
// entering from the left and rides with it down the wet back straight, pushing in as it goes; spray boils up behind
// the wheels, the track mirrors the car, rain streaks the lens. On bar 37 a close-up panel drops in over the sky:
// HAM's helmet in the cockpit, rain bouncing off it. The caption box "最后一圈" sits top left, clear of the car (ART-14).
import { MP4_23 } from "../../../cars";
import { pinhole } from "../../../kit/camera";
import { INK } from "../../../kit/colors";
import { Caption } from "../../../kit/lettering";
import { focusLines } from "../../../kit/lines";
import { at } from "../../timing.ts";
import { ramp, secondsInShot, type ShotTime } from "../abuDhabi2021/shotClock";
import { Page, Panel, RainCloseup } from "./common";

const V = 62; // m/s down the straight in the wet
const Z = 10.5;

export const Chase: React.FC<{ st: ShotTime }> = ({ st }) => {
  const { t, dur } = st;
  // a slow push-in (longer lens) over the whole shot
  const cam = pinhole({
    f: 1900 + 900 * ramp(t, 0, dur),
    horizon: 250,
    cx: 960,
    height: 2.6,
  });
  // the car runs in from the left, overtaking the camera, and settles just left of centre
  const x = -8 + 5.4 * ramp(t, 0, 2.6) + 0.6 * Math.sin(t * 0.9);
  const cap = ramp(t, 0.3, 0.7);
  const cut = secondsInShot(st, at(37));
  const inset = ramp(t, cut, cut + 0.25);
  const state = {
    wheelAngle: t * 900,
    tread: "wet" as const,
    tilt: 0.3 * Math.sin(t * 5),
  };
  // the helmet on screen, for the close-up panel's crop of the same shot
  const a = cam.anchor({ x, z: Z });
  const k = a.pxPerMetre / (250 / MP4_23.frame.k);
  const hx = a.x + (MP4_23.frame.x - MP4_23.helmetAt.cx) * k;
  const hy = a.y + (MP4_23.helmetAt.cy - MP4_23.frame.ground) * k;
  const cw = 420 * (1 - 0.2 * ramp(t, cut, dur));
  const scene = (
    <RainCloseup
      t={t}
      camX={V * t}
      cam={cam}
      speed={0.7}
      stands={false}
      tilt={-2 + 0.6 * Math.sin(t * 0.8)}
      shake={{ x: Math.sin(t * 37) * 2, y: Math.cos(t * 41) * 2 }}
      cars={[{ car: MP4_23, x, z: Z, state }]}
    />
  );
  return (
    <Page>
      {scene}
      <g opacity={cap} transform={`translate(${-40 * (1 - cap)} 0)`}>
        <Caption x={70} y={70} w={430} h={110} lines={["最后一圈"]} size={64} />
      </g>
      {t >= cut ? (
        <g opacity={inset} transform={`translate(0 ${-40 * (1 - inset)})`}>
          <Panel
            box={{ x: 1180, y: 60, w: 680, h: 380 }}
            view={{
              x: hx - cw / 2,
              y: hy - (cw * 380) / 680 / 2,
              w: cw,
              h: (cw * 380) / 680,
            }}
          >
            {scene}
            <path
              d={focusLines(hx, hy, cw * 0.32, 90, Math.floor(t * 10))}
              fill={INK}
              opacity={0.35}
            />
          </Panel>
        </g>
      ) : null}
    </Page>
  );
};
