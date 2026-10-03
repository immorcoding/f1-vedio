// Shot 2.2 (bars 35–38): the last lap in the rain. The camera tracks HAM's McLaren on intermediates (cut tread) down
// the wet back straight; spray boils up behind his wheels, the track mirrors the car, rain streaks the lens. The
// caption box "最后一圈" sits top left, clear of the car (ART-14).
import { MP4_23 } from "../../../cars";
import { Caption } from "../../../kit/lettering";
import { ramp, type ShotTime } from "../abuDhabi2021/shotClock";
import { Page, RainCloseup } from "./common";

const V = 62; // m/s down the straight in the wet

export const Chase: React.FC<{ st: ShotTime }> = ({ st }) => {
  const { t, dur } = st;
  // the car creeps forward in the frame as the camera can't quite keep up, then holds
  const x = -3.2 + 1.4 * ramp(t, 0, dur);
  const cap = ramp(t, 0.3, 0.7);
  return (
    <Page>
      <RainCloseup
        t={t}
        camX={V * t}
        speed={0.7}
        stands={false}
        tilt={-2 + 0.6 * Math.sin(t * 0.8)}
        shake={{ x: Math.sin(t * 37) * 2, y: Math.cos(t * 41) * 2 }}
        cars={[
          {
            car: MP4_23,
            x,
            z: 10.5,
            state: {
              wheelAngle: t * 900,
              tread: "wet",
              tilt: 0.3 * Math.sin(t * 5),
            },
          },
        ]}
      >
        <g opacity={cap} transform={`translate(${-40 * (1 - cap)} 0)`}>
          <Caption
            x={70}
            y={70}
            w={430}
            h={110}
            lines={["最后一圈"]}
            size={64}
          />
        </g>
      </RainCloseup>
    </Page>
  );
};
