// Shot 2.5 (bars 47–48): out of Junção and up the hill. On 47.1 (`brazil2008.pass`) HAM, on intermediates, comes
// through on the Toyota's inside — the near side — and is past by the cut; GLO, on dry tyres in the wet, twitches and
// throws little spray (his tread holds no water). The pass lands with a white flash, focus lines and "嗖！" in brush
// script over the empty track ahead, clear of both cars (ART-14). The cars' treads differ in the side view too:
// HAM's tyres show the cut sipes, GLO's are smooth. Real speeds (MOT-5): the pass is an explicit slow-motion beat
// (the road, rain and wheels all slow together, a screen of dots closes in), then real time snaps back as HAM pulls
// away — and his tag flips from 6 to 5.
import { MP4_23, TF108 } from "../../../cars";
import { INK, PAPER } from "../../../kit/colors";
import { Sfx } from "../../../kit/lettering";
import { focusLines } from "../../../kit/lines";
import { hit, ramp, type ShotTime } from "../abuDhabi2021/shotClock";
import { Page, RainCloseup } from "./common";
import { PASS_GLO_SPEED, pass25, passSlow } from "./staging.ts";
import { PosTag } from "./PosTag";
import { BRAZIL_CAM } from "../../../scenes/brazil-2008/trackside";
import { tone } from "../../../kit/tone";

export const Pass: React.FC<{ st: ShotTime }> = ({ st }) => {
  const { t } = st;
  const flash = hit(t, 0, 0.12);
  // HAM on the near side, GLO 6 m further across the road (true widths, ART-18): staging.ts
  const pos = pass25(t);
  const tau = pos.tau;
  const slow = passSlow(t);
  const twitch = Math.sin(tau * 9) * 1.2;
  // wheel angles from the true rolling speed, 0.58 m tyres (deg per s = v / r · 180/π)
  const roll = (v: number) => ((tau * v) / 0.29) * (180 / Math.PI);
  const hamA = BRAZIL_CAM.anchor({ x: pos.ham.x, z: pos.ham.z });
  const gloA = BRAZIL_CAM.anchor({ x: pos.glo.x, z: pos.glo.z });
  const passed = pos.ham.x - pos.glo.x > 2.5;
  const sfx = ramp(t, 0, 0.12);
  return (
    <Page>
      <RainCloseup
        t={tau}
        camX={(PASS_GLO_SPEED + 4) * tau}
        speed={0.9 * (1 - 0.7 * slow)}
        stands
        sprayUnder
        tilt={-3 - 2 * flash}
        shake={{
          x: Math.sin(t * 57) * (2 + 12 * flash),
          y: Math.cos(t * 49) * (2 + 8 * flash),
        }}
        cars={[
          {
            car: TF108,
            x: pos.glo.x,
            z: pos.glo.z,
            spray: 0.45,
            state: {
              wheelAngle: roll(PASS_GLO_SPEED),
              tread: "dry",
              tilt: twitch * 0.5,
            },
          },
          {
            car: MP4_23,
            x: pos.ham.x,
            z: pos.ham.z,
            state: { wheelAngle: roll(PASS_GLO_SPEED + 5), tread: "wet" },
          },
        ]}
      >
        <path
          d={focusLines(1300, 620, 560 - 160 * flash, 120, Math.floor(t * 12))}
          fill={INK}
          opacity={0.18 + 0.5 * flash}
        />
        <g
          opacity={sfx}
          transform={`translate(1500 330) scale(${1.4 - 0.4 * sfx}) translate(-1500 -330)`}
        >
          <Sfx x={1380} y={330} size={230} rotate={-10}>
            嗖！
          </Sfx>
        </g>
        {/* slow motion: a screen of dots over the edges of the page */}
        <rect
          width={1920}
          height={1080}
          fill={tone("light")}
          opacity={0.35 * slow}
        />
        <PosTag
          x={hamA.x + 2.4 * hamA.pxPerMetre}
          y={hamA.y + 70}
          code="HAM"
          pos={passed ? 5 : 6}
          big
        />
        <PosTag
          x={gloA.x + 2.4 * gloA.pxPerMetre}
          y={gloA.y - 170}
          code="GLO"
          pos={passed ? 6 : 5}
        />
        <rect width={1920} height={1080} fill={PAPER} opacity={0.85 * flash} />
      </RainCloseup>
    </Page>
  );
};
