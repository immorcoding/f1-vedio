// Shot 1.2 (bars 11–14): broadcast-style side tracking at Suzuka by day. The two McLarens run nose to tail along the
// back of the circuit, PRO on the near line just ahead, SEN on the far line closing on him; the camera pans with them
// so the stands, fence and hills slide past at their own depths (ART-9). From bar 13 two manga panels drop in over the
// sky: PRO's helmet and SEN's helmet, side by side (treatment 1.2: "SEN 与 PRO 头盔对比"). PRO's lead slams in under his
// helmet in the points box on 13.2, its gold stroke on 13.3.
import { Easing } from "remotion";
import { MangaCar, MP4_5_PRO, MP4_5_SEN, type CarSpec } from "../../../cars";
import {
  type Box,
  CARD_PRO,
  CARD_SEN,
  CardCaption,
  HelmetCard,
} from "./Helmets";
import { pinhole } from "../../../kit/camera";
import { PointsBox } from "../../../kit/points-box";
import { marginColumns } from "../../points";
import { INK, PAPER } from "../../../kit/colors";
import { InkFilterDef, inkFilter } from "../../../kit/ink";
import { speedLines } from "../../../kit/lines";
import { ToneDefs } from "../../../kit/tone";
import {
  Barriers,
  Grandstand,
  Hills,
  Sky,
  TRACKSIDE_DEFAULT,
} from "../../../scenes/suzuka-1989/trackside";
import { bounce, FarVerge, NearKerb, RoadFlow, WheelBlur } from "./Motion";
import { cueFrame, ramp, shotById, type PictureProps } from "./common";
import { cars12, camX12, SPEED, Z_PRO_12, Z_SEN_12 } from "./staging";

// One camera for the panel: 3 m up on a camera tower beside the track, level, f = 1500 px (the far car shows above the near one) (ART-9). The stands sit 110 m back, so the
// hills and sky keep the top of the frame and the cars hold the lower half.
const CAM = pinhole({ f: 1500, horizon: 300, cx: 960, height: 3.0 });
const TYRE_R = 0.33; // m

// A helmet card dropping in from above the frame (Helmets.tsx), with the stakes on its bottom edge (`children`).
const HelmetPanel: React.FC<{
  car: CarSpec;
  box: Box;
  id: string;
  wheel: number;
  drop: number;
  seed: number;
  children: React.ReactNode;
}> = ({ car, box, id, wheel, drop, seed, children }) => {
  const cx = box.x + box.w * 0.52;
  const cy = box.y + box.h * 0.5;
  const y = box.y - (1 - drop) * (box.h + 80);
  return (
    <g
      transform={`translate(0 ${y - box.y}) rotate(${(1 - drop) * -4} ${cx} ${cy})`}
    >
      <HelmetCard car={car} box={box} id={id} seed={seed} wheel={wheel} />
      {/* who and what is at stake (facts.md: before the race PRO 76, SEN 60) */}
      {children}
    </g>
  );
};

// On-screen stakes under the helmets (STO-5: a few words; facts.md "赛前积分"): PRO's lead in the shared points box
// (#17, the margin variant "+16 PTS" over "PRO", src/mv/points.ts), SEN's in a caption box.
export const STAKES = { pro: "PRO +16 PTS", sen: "SEN MUST WIN" } as const;
// The margin box straddles the bottom edge of PRO's card, under the helmet (ART-14), at half of 2.7's size.
const MARGIN_SIZE = 84;
const MARGIN_AT = {
  x: CARD_PRO.x + CARD_PRO.w / 2,
  y: CARD_PRO.y + CARD_PRO.h - 6 + (MARGIN_SIZE * 1.49) / 2,
};

export const Pair: React.FC<PictureProps> = ({ f }) => {
  const shot = shotById("1.2");
  const t = (f - shot.from) / 60; // seconds into the shot
  const { pro: proX, sen: senX } = cars12(f);
  const camX = camX12(f);
  const wheel = ((SPEED * t) / TYRE_R) * (180 / Math.PI);
  const helmets = ramp(
    f,
    cueFrame("suzuka1989.helmets"),
    cueFrame("suzuka1989.helmets") + 14,
    Easing.out(Easing.back(1.4)),
  );
  const helmets2 = ramp(
    f,
    cueFrame("suzuka1989.helmets") + 10,
    cueFrame("suzuka1989.helmets") + 24,
    Easing.out(Easing.back(1.4)),
  );
  const bPro = bounce(t, 1);
  const bSen = bounce(t, 4);
  const proA0 = CAM.anchor({ x: proX - camX, z: Z_PRO_12 });
  const senA0 = CAM.anchor({ x: senX - camX, z: Z_SEN_12 });
  const proA = { ...proA0, y: proA0.y + bPro.dy };
  const senA = { ...senA0, y: senA0.y + bSen.dy };
  // the camera operator's small corrections while panning
  const shakeX = 2.2 * Math.sin(t * 9.1) + 1.2 * Math.sin(t * 23.7);
  const shakeY = 1.6 * Math.sin(t * 7.3 + 1) + 1 * Math.sin(t * 19.1);
  const spin = f * 37; // blur arcs creep round at a readable rate (the true rate aliases)
  const layout = {
    ...TRACKSIDE_DEFAULT,
    stand: 110,
    standFrom: -400,
    standTo: 1200,
  };
  return (
    <svg viewBox="0 0 1920 1080" width={1920} height={1080}>
      <defs>
        <ToneDefs />
        <InkFilterDef />
      </defs>
      <rect width={1920} height={1080} fill={PAPER} />
      <g filter={inkFilter()}>
        <g transform={`translate(${shakeX} ${shakeY})`}>
          <Sky cam={CAM} camX={camX} layout={layout} />
          <Hills cam={CAM} camX={camX} layout={layout} />
          <Grandstand cam={CAM} camX={camX} layout={layout} />
          <Barriers cam={CAM} camX={camX} layout={layout} />
          <FarVerge
            cam={CAM}
            camX={camX}
            speed={SPEED}
            z={layout.farEdge + 1.4}
          />
          <RoadFlow
            cam={CAM}
            camX={camX}
            speed={SPEED}
            nearEdge={layout.nearEdge}
            farEdge={layout.farEdge}
          />
          <NearKerb
            cam={CAM}
            camX={camX}
            speed={SPEED}
            nearEdge={layout.nearEdge}
          />
          {/* speed streaks trailing each car */}
          <path
            d={speedLines({
              x: senA.x - 700,
              y: senA.y - 0.9 * senA.pxPerMetre,
              w: 640,
              h: 0.8 * senA.pxPerMetre,
              n: 12,
              seed: `sen-${Math.floor(f / 2)}`,
              thickness: 4,
            })}
            fill={INK}
            opacity={0.55}
          />
          <MangaCar
            car={MP4_5_SEN}
            at={senA}
            state={{ wheelAngle: wheel, tilt: bSen.tilt }}
          />
          <WheelBlur car={MP4_5_SEN} at={senA} spin={spin} />
          <path
            d={speedLines({
              x: proA.x - 820,
              y: proA.y - 0.9 * proA.pxPerMetre,
              w: 760,
              h: 0.8 * proA.pxPerMetre,
              n: 14,
              seed: `pro-${Math.floor(f / 2)}`,
              thickness: 5,
            })}
            fill={INK}
            opacity={0.55}
          />
          <MangaCar
            car={MP4_5_PRO}
            at={proA}
            state={{ wheelAngle: wheel, tilt: bPro.tilt }}
          />
          <WheelBlur car={MP4_5_PRO} at={proA} spin={spin + 60} />
        </g>
        {helmets > 0 ? (
          <HelmetPanel
            car={MP4_5_PRO}
            box={CARD_PRO}
            id="s12-pro"
            wheel={wheel}
            drop={helmets}
            seed={3}
          >
            <g
              transform={`translate(${MARGIN_AT.x} ${MARGIN_AT.y}) rotate(-2)`}
            >
              <PointsBox
                columns={marginColumns("suzuka1989")}
                size={MARGIN_SIZE}
                unit="PTS"
                since={(f - cueFrame("suzuka1989.margin")) / 60}
                goldSince={(f - cueFrame("suzuka1989.marginGold")) / 60}
              />
            </g>
          </HelmetPanel>
        ) : null}
        {helmets2 > 0 ? (
          <HelmetPanel
            car={MP4_5_SEN}
            box={CARD_SEN}
            id="s12-sen"
            wheel={wheel}
            drop={helmets2}
            seed={7}
          >
            <CardCaption box={CARD_SEN} text={STAKES.sen} />
          </HelmetPanel>
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
