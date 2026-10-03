// Shot 2.3 (bars 39–42): the split page. Top left: MAS's Ferrari crosses the line in front of the grandstand. Top
// right (easter egg, facts.md): the Ferrari garage starts to celebrate — at that moment, with HAM sixth, Massa is
// champion. Bottom, full width: the same moment out on the circuit — HAM on VET's gearbox in the spray, sixth
// (facts.md: from lap 69 to the last corners). The panels drop in one per bar, on the downbeat.
import { F2008, MP4_23, STR3 } from "../../../cars";
import { INK } from "../../../kit/colors";
import { focusLines } from "../../../kit/lines";
import { Garage } from "../../../scenes/brazil-2008/Garage";
import {
  BRAZIL_CAM,
  FinishStripe,
} from "../../../scenes/brazil-2008/trackside";
import { at } from "../../timing.ts";
import { ramp, secondsInShot, type ShotTime } from "../abuDhabi2021/shotClock";
import { Page, Panel, RainCloseup } from "./common";

const MAS_BOX = { x: 40, y: 40, w: 1090, h: 480 };
const GARAGE_BOX = { x: 1160, y: 40, w: 720, h: 480 };
const HAM_BOX = { x: 40, y: 550, w: 1840, h: 490 };

export const Split: React.FC<{ st: ShotTime }> = ({ st }) => {
  const { t } = st;
  const garageIn = secondsInShot(st, at(40));
  const hamIn = secondsInShot(st, at(41));
  const slide = (t0: number) => ramp(t, t0, t0 + 0.25);
  const sMas = slide(0);
  const sGar = slide(garageIn);
  const sHam = slide(hamIn);
  // MAS: the camera pans with him; the line slides under his front wheels at ~0.6 s
  const camMas = 58 * t;
  const joy = ramp(t, garageIn, garageIn + 0.6);
  // HAM behind VET, both on intermediates, the gap breathing
  const gap = 0.8 + 0.6 * Math.sin(t * 1.3);
  return (
    <Page>
      <g opacity={sMas} transform={`translate(${-60 * (1 - sMas)} 0)`}>
        <Panel box={MAS_BOX} view={{ x: 120, y: 170, w: 1680, h: 740 }}>
          <RainCloseup
            t={t}
            camX={camMas}
            speed={0.5}
            cars={[
              {
                car: F2008,
                x: -2.6,
                z: 11,
                state: { wheelAngle: t * 900, tread: "wet" },
              },
            ]}
            ground={<FinishStripe cam={BRAZIL_CAM} camX={camMas} x={36} />}
          />
        </Panel>
      </g>
      {t >= garageIn ? (
        <g opacity={sGar} transform={`translate(${60 * (1 - sGar)} 0)`}>
          <Panel box={GARAGE_BOX} view={{ x: 180, y: 120, w: 1560, h: 1040 }}>
            <Garage t={t - garageIn} joy={joy} />
            <path
              d={focusLines(960, 520, 560, 90, Math.floor(t * 8))}
              fill={INK}
              opacity={0.2 * joy}
            />
          </Panel>
        </g>
      ) : null}
      {t >= hamIn ? (
        <g opacity={sHam} transform={`translate(0 ${60 * (1 - sHam)})`}>
          <Panel box={HAM_BOX} view={{ x: 0, y: 420, w: 1920, h: 512 }}>
            <RainCloseup
              t={t}
              camX={60 * t}
              speed={0.8}
              stands={false}
              cars={[
                {
                  car: STR3,
                  x: 0.6 + gap,
                  z: 15,
                  state: { wheelAngle: t * 900, tread: "wet" },
                },
                {
                  car: MP4_23,
                  x: -4.6,
                  z: 11,
                  state: { wheelAngle: t * 900 + 30, tread: "wet" },
                },
              ]}
            />
          </Panel>
        </g>
      ) : null}
    </Page>
  );
};
