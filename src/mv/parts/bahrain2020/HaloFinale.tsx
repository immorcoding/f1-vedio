// The last beat of shot 3.6 (bar 72, beat 1 to the cut to black on beat 4): the fire is out, and we close on the empty
// cockpit — the halo scorched black but whole (facts.md: the burnt front of the car, halo intact, is on show in
// London; easter egg). Overlaid on Escape by Scene.tsx, so Escape.tsx itself is untouched. Last embers, thin ink
// smoke rising off the charred cell, a slow push in.
import { INK } from "../../../kit/colors";
import { FIRE_PALETTES, SmokeStreaks } from "../../../kit/fire";
import { ToneDefs } from "../../../kit/tone";
import { cueFrame, ramp, type PictureProps } from "./common";
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
  const hb = heartbeat(f);
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
        fireDetail={3}
        driver={false}
        tonePrefix="b3h"
      />
      <HaloScorch cam={cam} f={f} />
      <g transform={`translate(${halo.x} ${halo.y - 0.1 * ppm})`}>
        <SmokeStreaks
          w={1.6 * ppm}
          top={0}
          frame={f}
          seed="halo-smoke"
          palette={FIRE_PALETTES[palette]}
          rise={1.4 * ppm}
          count={5}
          wind={-0.2}
          opacity={0.7}
        />
      </g>
      {/* it lands on the beat: a cut in from black */}
      <rect width={1920} height={1080} fill={INK} opacity={1 - ramp(t, 0, 4)} />
      <Vignette amount={0.45 + 0.3 * hb} />
    </svg>
  );
};
