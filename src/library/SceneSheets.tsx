// Review stills for the shared scene backgrounds that have no panel in the library yet: Suzuka by day from the track
// (scenes/suzuka-1989/trackside), with both 1989 McLarens side-on on its camera, and an impact star (kit/impact).
import { AbsoluteFill } from "remotion";
import {
  carCamera,
  MangaCar,
  MP4_5_PRO,
  MP4_5_SEN,
} from "../cars";
import { pinhole } from "../kit/camera";
import { ImpactStar } from "../kit/impact";
import { ToneDefs } from "../kit/tone";
import { Trackside, TRACKSIDE_DEFAULT } from "../scenes/suzuka-1989/trackside";

// A camera beside the track, 1.2 m up, f = 1100 px (a review framing, not a shot of the treatment).
const CAM = pinhole({ f: 1100, horizon: 430, cx: 960, height: 1.2 });

export const SuzukaTracksideSheet: React.FC = () => (
  <AbsoluteFill>
    <svg width={1920} height={1080}>
      <defs>
        <ToneDefs />
      </defs>
      <Trackside cam={CAM} camX={0} layout={TRACKSIDE_DEFAULT} />
      <MangaCar
        car={MP4_5_PRO}
        at={CAM.anchor({ x: -1, z: 15 })}
        state={{
          ...carCamera(MP4_5_PRO, CAM, 15, { x: -1 }),
          wheelAngle: 20,
        }}
      />
      <MangaCar
        car={MP4_5_SEN}
        at={CAM.anchor({ x: -4.5, z: 10 })}
        state={{
          ...carCamera(MP4_5_SEN, CAM, 10, { x: -4.5 }),
          wheelAngle: 50,
        }}
      />
      <ImpactStar x={1560} y={760} r={150} seed="sheet" />
    </svg>
  </AbsoluteFill>
);
