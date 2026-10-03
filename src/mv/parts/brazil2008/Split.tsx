// Shot 2.3 (bars 39–42): the split page. Top left: MAS's Ferrari crosses the line in front of the grandstand. Top
// right (easter egg, facts.md): the Ferrari garage starts to celebrate — at that moment, with HAM sixth, Massa is
// champion. Bottom, full width: the same moment out on the circuit — HAM on VET's gearbox in the spray, sixth
// (facts.md: from lap 69 to the last corners). The whole page is there from the first beat (the three panels slide
// in within a quarter second); on bar 40 the garage, which has been watching the monitors, erupts.
import { F2008, MP4_23, STR3 } from "../../../cars";
import { INK } from "../../../kit/colors";
import { Rain } from "../../../kit/rain";
import { tone } from "../../../kit/tone";
import { focusLines } from "../../../kit/lines";
import { Garage } from "../../../scenes/brazil-2008/Garage";
import {
  BRAZIL_CAM,
  FinishStripe,
} from "../../../scenes/brazil-2008/trackside";
import { at } from "../../timing.ts";
import { ramp, secondsInShot, type ShotTime } from "../abuDhabi2021/shotClock";
import { Page, Panel, RainCloseup } from "./common";
import { PosTag } from "./PosTag";
import { split23 } from "./staging.ts";

const MAS_BOX = { x: 40, y: 40, w: 1090, h: 480 };
const GARAGE_BOX = { x: 1160, y: 40, w: 720, h: 480 };
const HAM_BOX = { x: 40, y: 550, w: 1840, h: 490 };

// A panel waiting for its picture: dark screen, rain falling, ink border.
const Waiting: React.FC<{ box: typeof MAS_BOX; t: number; seed: string }> = ({
  box,
  t,
  seed,
}) => (
  <g>
    <rect
      x={box.x}
      y={box.y}
      width={box.w}
      height={box.h}
      fill={tone("dark")}
    />
    <svg x={box.x} y={box.y} width={box.w} height={box.h}>
      <Rain
        t={t}
        w={box.w}
        h={box.h}
        n={70}
        color="#fbfaf6"
        opacity={0.5}
        seed={seed}
      />
    </svg>
    <rect
      x={box.x}
      y={box.y}
      width={box.w}
      height={box.h}
      fill="none"
      stroke={INK}
      strokeWidth={10}
    />
  </g>
);

export const Split: React.FC<{ st: ShotTime }> = ({ st }) => {
  const { t } = st;
  const garageIn = secondsInShot(st, at(40));
  const slide = (t0: number) => ramp(t, t0, t0 + 0.25);
  const sMas = slide(0);
  const sGar = slide(0.12);
  const sHam = slide(0.24);
  // MAS: the camera pans with him; the line slides under his front wheels at ~0.6 s
  const camMas = 58 * t;
  const joy = ramp(t, garageIn, garageIn + 0.6);
  // HAM behind VET, both on intermediates, the gap breathing
  const pos = split23(t);
  // a frame point of the bottom panel's picture (view 0,420 1920×512 sliced into HAM_BOX) on the page
  const HAM_VIEW = { x: 0, y: 420, w: 1920, h: 512 };
  const sc = Math.max(HAM_BOX.w / HAM_VIEW.w, HAM_BOX.h / HAM_VIEW.h);
  const onPage = (x: number, y: number) => ({
    x: HAM_BOX.x + HAM_BOX.w / 2 + (x - (HAM_VIEW.x + HAM_VIEW.w / 2)) * sc,
    y: HAM_BOX.y + HAM_BOX.h / 2 + (y - (HAM_VIEW.y + HAM_VIEW.h / 2)) * sc,
  });
  const hamA = BRAZIL_CAM.anchor({ x: pos.ham.x, z: pos.ham.z });
  const vetA = BRAZIL_CAM.anchor({ x: pos.vet.x, z: pos.vet.z });
  const hamTag = onPage(hamA.x + 2.6 * hamA.pxPerMetre, hamA.y + 40);
  const vetTag = onPage(vetA.x + 2.4 * vetA.pxPerMetre, vetA.y - 150);
  return (
    <Page>
      <Waiting box={MAS_BOX} t={t} seed="w-mas" />
      <Waiting box={GARAGE_BOX} t={t} seed="w-gar" />
      <Waiting box={HAM_BOX} t={t} seed="w-ham" />
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
        <PosTag x={MAS_BOX.x + 120} y={MAS_BOX.y + 60} code="MAS" pos={1} />
      </g>
      {t >= 0.12 ? (
        <g opacity={sGar} transform={`translate(${60 * (1 - sGar)} 0)`}>
          <Panel box={GARAGE_BOX} view={{ x: 180, y: 120, w: 1560, h: 1040 }}>
            <Garage t={t} joy={joy} />
            <path
              d={focusLines(960, 520, 560, 90, Math.floor(t * 8))}
              fill={INK}
              opacity={0.2 * joy}
            />
          </Panel>
        </g>
      ) : null}
      {t >= 0.24 ? (
        <g opacity={sHam} transform={`translate(0 ${60 * (1 - sHam)})`}>
          <Panel box={HAM_BOX} view={{ x: 0, y: 420, w: 1920, h: 512 }}>
            <RainCloseup
              t={t}
              camX={60 * t}
              speed={0.8}
              stands={false}
              sprayUnder
              cars={[
                {
                  car: STR3,
                  x: pos.vet.x,
                  z: pos.vet.z,
                  state: { wheelAngle: t * 900, tread: "wet" },
                },
                {
                  car: MP4_23,
                  x: pos.ham.x,
                  z: pos.ham.z,
                  state: { wheelAngle: t * 900 + 30, tread: "wet" },
                },
              ]}
            />
          </Panel>
          <PosTag x={vetTag.x} y={vetTag.y} code="VET" pos={5} />
          <PosTag x={hamTag.x} y={hamTag.y} code="HAM" pos={6} big />
        </g>
      ) : null}
    </Page>
  );
};
