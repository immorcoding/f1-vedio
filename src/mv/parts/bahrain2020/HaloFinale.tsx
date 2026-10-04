// The last two bars of shot 3.6 (72.1 to 74.1): the fire is out, and we close on the empty cockpit — the halo scorched
// black but whole (facts.md: the burnt front of the car, halo intact, is on show in London; easter egg). Overlaid on
// Escape by Scene.tsx, so Escape.tsx itself is untouched. Last embers, small bubble smoke (ART-20) rising off the
// charred cell, a slow push in. The tagline fades in from 72.3 and stands from the `bahrain2020.tagline` cue (73.1,
// where the music resolves) through bar 73; from 73.3 (the turn to A major) everything fades to black, black on the
// `bahrain2020.black` cue (74.1), where the buildup's riser starts. The tagline sits low and centred on the dark frame,
// clear of the halo (ART-14), in type system D's caption box.
import { INK } from "../../../kit/colors";
import { BubbleSmoke, FIRE_PALETTES } from "../../../kit/fire";
import { Caption } from "../../../kit/lettering";
import { ToneDefs } from "../../../kit/tone";
import { at, frameAt } from "../../timing.ts";
import { cueFrame, ramp, shotById, type PictureProps } from "./common";
import {
  HALO_WORLD,
  HaloScorch,
  Vignette,
  WRECK_CAM,
  WreckWorld,
  heartbeat,
  zoomCam,
} from "./Wreck";

export const HaloFinale: React.FC<PictureProps> = ({ f, palette }) => {
  const from = cueFrame("bahrain2020.halo");
  const to = cueFrame("bahrain2020.black");
  const t = f - from;
  const u = ramp(f, from, to, (x) => x);
  const cam = zoomCam(WRECK_CAM, HALO_WORLD, 3.3 + 0.35 * u, {
    x: 960,
    y: 560,
  });
  const halo = cam.project(HALO_WORLD);
  const ppm = cam.pxPerMetre(HALO_WORLD.z);
  // the heart stops after its last beat on 73.1
  const hb = f < frameAt(at(73, 3)) ? heartbeat(f) : 0;
  const tagline = shotById("3.6").text[1];
  const tagIn = ramp(f, frameAt(at(72, 3)), cueFrame("bahrain2020.tagline"));
  const fade = ramp(f, frameAt(at(73, 3)), to);
  return (
    <svg viewBox="0 0 1920 1080" width={1920} height={1080}>
      <defs>
        <ToneDefs prefix="b3h" />
      </defs>
      <WreckWorld
        cam={cam}
        f={f}
        fireSeed="halo"
        palette={palette}
        intensity={0.12}
        noGlow
        driver={false}
        tonePrefix="b3h"
      />
      <HaloScorch cam={cam} f={f} />
      <g transform={`translate(${halo.x} ${halo.y - 0.1 * ppm})`}>
        <BubbleSmoke
          w={1.6 * ppm}
          top={0}
          frame={f}
          seed="halo-smoke"
          palette={FIRE_PALETTES[palette]}
          rise={1.4 * ppm}
          count={5}
          size={0.5}
          warm={false}
          opacity={0.7}
        />
      </g>
      {/* it lands on the beat: a cut in from black */}
      <rect width={1920} height={1080} fill={INK} opacity={1 - ramp(t, 0, 4)} />
      <Vignette amount={0.45 + 0.3 * hb} />
      {tagIn > 0 ? (
        <g opacity={tagIn} transform={`translate(0 ${12 * (1 - tagIn)})`}>
          <Caption
            x={960}
            y={872}
            boxAnchor="middle"
            lines={[tagline]}
            size={46}
          />
        </g>
      ) : null}
      {/* out to black on the turn to A major, black on the buildup's first beat */}
      <rect width={1920} height={1080} fill={INK} opacity={fade} />
    </svg>
  );
};
