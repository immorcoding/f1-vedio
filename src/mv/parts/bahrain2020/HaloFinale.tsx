// The last two bars of shot 3.6 (72.1 to 74.1): the fire is out, and we close on the empty cockpit — the cell charred
// black, the halo scorched but whole on top of it (facts.md: the burnt front of the car, halo intact, is on show in
// London; easter egg). Overlaid on Escape by Scene.tsx, so Escape.tsx itself is untouched.
// User review 2026-10-04 ("feels odd"): the foreground is what the shot is about. The cell is charcoal with ash and
// blisters, faint traces of its white and red (scorch.tsx); the halo is the lightest thing in the frame; along the
// rails only embers, a few small B-style flames (ART-21) and sparks are left; the background stays the night as it was,
// its heat shimmer turned down so the dot screen does not ripple into a moiré at this scale. Framing: the halo and the
// cockpit in the upper middle, a slow push in, and the lower third left as clean dark ground for the tagline.
// The tagline fades in from 72.3 and stands from the `bahrain2020.tagline` cue (73.1, where the music settles); from
// 73.3, as the reverse swell rises into the buildup, everything fades to black, black on the `bahrain2020.black` cue
// (74.1). It is set straight on the dark frame, no box: type system D (Titillium Web 700), letter-spaced caps in paper,
// centred in the lower third, clear of the halo (ART-14). Before it, a small "HALO · MANDATORY SINCE 2018" caption box
// in the top-left corner says why he lived (#20; facts.md).
import { INK, PAPER } from "../../../kit/colors";
import { BubbleSmoke, FIRE_PALETTES } from "../../../kit/fire";
import { CAPTION_FONT, Caption } from "../../../kit/lettering";
import { ToneDefs } from "../../../kit/tone";
import { at, frameAt } from "../../timing.ts";
import { cueFrame, ramp, shotById, type PictureProps } from "./common";
import {
  Flip,
  HALO_WORLD,
  HaloScorch,
  Vignette,
  WRECK_CAM,
  WreckWorld,
  heartbeat,
  zoomCam,
} from "./Wreck";

// where the halo sits on screen, and the tagline's baseline
const HALO_ON_SCREEN = { x: 960, y: 390 };
const TAGLINE_Y = 935;
const TAGLINE_SIZE = 60;

// The finale's camera at song frame f: the wreck camera closing slowly on the halo.
export const finaleCam = (f: number) => {
  const u = ramp(
    f,
    cueFrame("bahrain2020.halo"),
    cueFrame("bahrain2020.black"),
    (x) => x,
  );
  return zoomCam(WRECK_CAM, HALO_WORLD, 2.4 + 0.28 * u, HALO_ON_SCREEN);
};

export const HaloFinale: React.FC<PictureProps> = ({ f, palette }) => {
  const from = cueFrame("bahrain2020.halo");
  const to = cueFrame("bahrain2020.black");
  const t = f - from;
  const cam = finaleCam(f);
  const halo = cam.project(HALO_WORLD);
  const ppm = cam.pxPerMetre(HALO_WORLD.z);
  // the heart stops after its last beat on 73.1
  const hb = f < frameAt(at(73, 3)) ? heartbeat(f) : 0;
  const tagline = shotById("3.6").text[1];
  const tagIn = ramp(f, frameAt(at(72, 3)), cueFrame("bahrain2020.tagline"));
  const fade = ramp(f, frameAt(at(73, 3)), to);
  // the halo note (facts.md: mandatory in F1 since 2018) comes up in the top-left corner just after the cut, a beat
  // before the tagline starts, and stays to the black: small, in a type D caption box, clear of the halo and of the
  // tagline in the lower third (ART-14). A quiet fade, not an accent (no sound on 72.2; MOT-6).
  const haloNote = shotById("3.6").text[2];
  const noteIn = ramp(f, from + 10, frameAt(at(72, 2)));
  return (
    <svg viewBox="0 0 1920 1080" width={1920} height={1080}>
      <defs>
        <ToneDefs prefix="b3h" />
        <linearGradient id="b3h-ground" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={INK} stopOpacity={0} />
          <stop offset="45%" stopColor={INK} stopOpacity={0.82} />
          <stop offset="100%" stopColor={INK} stopOpacity={0.92} />
        </linearGradient>
      </defs>
      <Flip>
        <WreckWorld
          cam={cam}
          f={f}
          fireSeed="halo"
          palette={palette}
          intensity={0.12}
          noGlow
          driver={false}
          tonePrefix="b3h"
          shimmer={6}
          burntOut
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
      </Flip>
      {/* the lower third: dark ground under the embers, where the tagline stands */}
      <rect y={800} width={1920} height={280} fill="url(#b3h-ground)" />
      {/* it lands on the beat: a cut in from black */}
      <rect width={1920} height={1080} fill={INK} opacity={1 - ramp(t, 0, 4)} />
      <Vignette amount={0.45 + 0.3 * hb} />
      {noteIn > 0 && haloNote ? (
        <g opacity={noteIn}>
          <Caption x={72} y={72} lines={[haloNote]} size={34} />
        </g>
      ) : null}
      {tagIn > 0 ? (
        <text
          x={960}
          y={TAGLINE_Y + 10 * (1 - tagIn)}
          opacity={tagIn}
          textAnchor="middle"
          fontFamily={CAPTION_FONT}
          fontWeight={700}
          fontSize={TAGLINE_SIZE}
          letterSpacing="0.12em"
          fill={PAPER}
        >
          {tagline}
        </text>
      ) : null}
      {/* out to black as the swell rises, black on the buildup's first beat */}
      <rect width={1920} height={1080} fill={INK} opacity={fade} />
    </svg>
  );
};
