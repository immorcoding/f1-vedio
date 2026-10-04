// Shot 1.2 (bars 11–14): broadcast-style side tracking at Suzuka by day. The two McLarens run nose to tail along the
// back of the circuit, PRO on the near line just ahead, SEN on the far line reeling him in; the camera pans with them
// so the stands, fence and hills slide past at their own depths (ART-9). The two helmet panels slam in over the sky
// one beat apart, PRO's on 11.1 and SEN's on 11.3 (treatment 1.2: "SEN 与 PRO 头盔对比"). On 13.1 the shot cuts to a
// low-angle camera on the near kerb: the horizon drops, the cars loom over the lens with SEN sitting on PRO's gearbox,
// and the road and the kerb rush past just under the lens (MOT-5). PRO's lead slams in under his helmet in the points
// box on 13.2, its gold stroke on 13.3.
import { Easing } from "remotion";
import {
  carCamera,
  MangaCar,
  MP4_5_PRO,
  MP4_5_SEN,
  type CarSpec,
} from "../../../cars";
import {
  type Box,
  CARD_PRO,
  CARD_SEN,
  CardCaption,
  HelmetCard,
} from "./Helmets";
import { pinhole, type Camera } from "../../../kit/camera";
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
  type TracksideLayout,
} from "../../../scenes/suzuka-1989/trackside";
import { bounce, FarVerge, NearKerb, RoadFlow, WheelBlur } from "./Motion";
import { cueFrame, ramp, shotById, type PictureProps } from "./common";
import {
  camXLow12,
  cars12,
  camX12,
  isLow12,
  LOW_12,
  SPEED,
  Z_PRO_12,
  Z_PRO_LOW,
  Z_SEN_12,
  Z_SEN_LOW,
} from "./staging";

// Bars 11–12: 3 m up on a camera tower beside the track, level, f = 1500 px (the far car shows above the near one)
// (ART-9). The stands sit 110 m back, so the hills and sky keep the top of the frame and the cars hold the lower half.
const CAM_HIGH = pinhole({ f: 1500, horizon: 300, cx: 960, height: 3.0 });
const LAYOUT_HIGH: TracksideLayout = {
  ...TRACKSIDE_DEFAULT,
  stand: 110,
  standFrom: -400,
  standTo: 1200,
};
// Bars 13–14: the same two lines from a camera 0.45 m above the grass on the near kerb, 2.5 m closer to the cars; the
// horizon drops to just above the cars' roofs, the sky behind the helmet panels opens up. The lens creeps from
// 1150 to 1230 px over the two bars, so the framing keeps tightening.
const lowCam = (push: number) =>
  pinhole({ f: 1150 + 80 * push, horizon: 640, cx: 960, height: 0.45 });
const LAYOUT_LOW: TracksideLayout = {
  ...LAYOUT_HIGH,
  nearEdge: TRACKSIDE_DEFAULT.nearEdge - 2.5,
  farEdge: TRACKSIDE_DEFAULT.farEdge - 2.5,
  rail: TRACKSIDE_DEFAULT.rail - 2.5,
  fence: TRACKSIDE_DEFAULT.fence - 2.5,
  stand: LAYOUT_HIGH.stand - 2.5,
};
const TYRE_R = 0.33; // m

// A helmet card slammed onto the page on its cue: it appears big and tilted on the beat, crashes down to its slot in
// SLAM frames and jolts as it lands (as 1.4's stamps do), with the stakes on its bottom edge (`children`).
const SLAM = 5;
const HelmetPanel: React.FC<{
  car: CarSpec;
  box: Box;
  id: string;
  wheel: number;
  since: number; // frames since its cue
  seed: number;
  children: React.ReactNode;
}> = ({ car, box, id, wheel, since, seed, children }) => {
  const cx = box.x + box.w * 0.5;
  const cy = box.y + box.h * 0.5;
  const p = ramp(since, 0, SLAM, Easing.in(Easing.quad));
  const s = 1 + 0.35 * (1 - p);
  const k = since - SLAM;
  const jolt = k < 0 ? 0 : 8 * Math.exp(-k / 5) * Math.sin(k * 1.9);
  return (
    <g
      transform={`translate(${jolt * 0.4} ${jolt}) translate(${cx} ${cy}) rotate(${(1 - p) * -5}) scale(${s}) translate(${-cx} ${-cy})`}
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

// The road, the trackside and the two cars seen by one camera.
const Track: React.FC<{
  cam: Camera;
  camX: number;
  layout: TracksideLayout;
  zPro: number;
  zSen: number;
  f: number;
  t: number;
  wheel: number;
  low: boolean;
}> = ({ cam, camX, layout, zPro, zSen, f, t, wheel, low }) => {
  const { pro: proX, sen: senX } = cars12(f);
  const bPro = bounce(t, 1);
  const bSen = bounce(t, 4);
  const proA0 = cam.anchor({ x: proX - camX, z: zPro });
  const senA0 = cam.anchor({ x: senX - camX, z: zSen });
  const proA = { ...proA0, y: proA0.y + bPro.dy };
  const senA = { ...senA0, y: senA0.y + bSen.dy };
  // the low kerb camera sees the far wheels and endplates from its own height (ART-26); the tower camera keeps the
  // default low view: its true 14–18° would lift the far wheels 0.4–0.5 m (docs/shape/inbox/feat-v2-far-side.md)
  const camPro = low ? carCamera(MP4_5_PRO, cam, zPro) : {};
  const camSen = low ? carCamera(MP4_5_SEN, cam, zSen) : {};
  const spin = f * 37; // blur arcs creep round at a readable rate (the true rate aliases)
  // streaks from `back` metres behind the rear end, `w` metres long; line weight grows with the car's size
  const streaks = (
    a: typeof proA,
    seed: string,
    n: number,
    back: number,
    w: number,
    thickness: number,
  ) => (
    <path
      d={speedLines({
        x: a.x - back * a.pxPerMetre,
        y: a.y - 0.9 * a.pxPerMetre,
        w: w * a.pxPerMetre,
        h: 0.8 * a.pxPerMetre,
        n,
        seed: `${seed}-${Math.floor(f / 2)}`,
        thickness: thickness * (low ? 1.5 : 1),
      })}
      fill={INK}
      opacity={0.55}
    />
  );
  return (
    <g>
      <Sky cam={cam} camX={camX} layout={layout} />
      <Hills cam={cam} camX={camX} layout={layout} />
      <Grandstand cam={cam} camX={camX} layout={layout} />
      <Barriers cam={cam} camX={camX} layout={layout} />
      <FarVerge cam={cam} camX={camX} speed={SPEED} z={layout.farEdge + 1.4} />
      <RoadFlow
        cam={cam}
        camX={camX}
        speed={SPEED}
        nearEdge={layout.nearEdge}
        farEdge={layout.farEdge}
      />
      <NearKerb
        cam={cam}
        camX={camX}
        speed={SPEED}
        nearEdge={layout.nearEdge}
      />
      {/* speed streaks trailing each car */}
      {streaks(senA, "sen", 12, 5.15, 4.7, 4)}
      <MangaCar
        car={MP4_5_SEN}
        at={senA}
        state={{ ...camSen, wheelAngle: wheel, tilt: bSen.tilt }}
      />
      <WheelBlur car={MP4_5_SEN} at={senA} spin={spin} />
      {streaks(proA, "pro", 14, 4.38, 4.06, 5)}
      <MangaCar
        car={MP4_5_PRO}
        at={proA}
        state={{ ...camPro, wheelAngle: wheel, tilt: bPro.tilt }}
      />
      <WheelBlur car={MP4_5_PRO} at={proA} spin={spin + 60} />
    </g>
  );
};

export const Pair: React.FC<PictureProps> = ({ f }) => {
  const shot = shotById("1.2");
  const t = (f - shot.from) / 60; // seconds into the shot
  const wheel = ((SPEED * t) / TYRE_R) * (180 / Math.PI);
  const low = isLow12(f);
  const sincePro = f - cueFrame("suzuka1989.helmetPro");
  const sinceSen = f - cueFrame("suzuka1989.helmetSen");
  // the camera operator's small corrections while panning; on the kerb the low camera shakes harder and sits a few
  // degrees off level
  const shakeK = low ? 1.8 : 1;
  const shakeX = shakeK * (2.2 * Math.sin(t * 9.1) + 1.2 * Math.sin(t * 23.7));
  const shakeY =
    shakeK * (1.6 * Math.sin(t * 7.3 + 1) + 1 * Math.sin(t * 19.1));
  const push = ramp(f, LOW_12, shot.to, Easing.inOut(Easing.sin));
  const cam = low ? lowCam(push) : CAM_HIGH;
  return (
    <svg viewBox="0 0 1920 1080" width={1920} height={1080}>
      <defs>
        <ToneDefs />
        <InkFilterDef />
      </defs>
      <rect width={1920} height={1080} fill={PAPER} />
      <g filter={inkFilter()}>
        <g
          transform={`translate(${shakeX} ${shakeY})${
            // a few degrees off level, enlarged so the tilted frame still fills the panel
            low
              ? " rotate(-2.5 960 540) translate(960 540) scale(1.08) translate(-960 -540)"
              : ""
          }`}
        >
          <Track
            cam={cam}
            camX={low ? camXLow12(f) : camX12(f)}
            layout={low ? LAYOUT_LOW : LAYOUT_HIGH}
            zPro={low ? Z_PRO_LOW : Z_PRO_12}
            zSen={low ? Z_SEN_LOW : Z_SEN_12}
            f={f}
            t={t}
            wheel={wheel}
            low={low}
          />
        </g>
        {sincePro >= 0 ? (
          <HelmetPanel
            car={MP4_5_PRO}
            box={CARD_PRO}
            id="s12-pro"
            wheel={wheel}
            since={sincePro}
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
        {sinceSen >= 0 ? (
          <HelmetPanel
            car={MP4_5_SEN}
            box={CARD_SEN}
            id="s12-sen"
            wheel={wheel}
            since={sinceSen}
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
