// Shot 2.5 (bars 47–50): out of Junção and up the hill. On 47.1 (`brazil2008.pass`) HAM, on intermediates, draws
// level on the Toyota's inside — the near side — with a white flash, focus lines and "WHOOSH!" (solid ink, Bangers)
// over the empty track ahead, clear of both cars (ART-14); GLO, on dry tyres in the wet, twitches and throws little
// spray (his tread holds no water). The cars' treads differ in the side view too: HAM's tyres show the cut sipes,
// GLO's are smooth. Real speeds (MOT-5): the pass is an explicit slow-motion beat (the road, rain and wheels all slow
// together) held through bars 47–48; on 47.3 (`brazil2008.p5`) HAM's nose is ~2 m clear and the tags flip, HAM 6 → 5
// and GLO 5 → 6; on 49.1 (`brazil2008.realTime`) real time snaps back, HAM pulls away up the hill and GLO drops out
// of the frame behind. No grey haze over the panel: the slow motion reads from the motion alone.
import { MP4_23, TF108 } from "../../../cars";
import { INK, PAPER } from "../../../kit/colors";
import { Sfx } from "../../../kit/lettering";
import { focusLines } from "../../../kit/lines";
import { hit, ramp, type ShotTime } from "../abuDhabi2021/shotClock";
import { Page, RainCloseup } from "./common";
import {
  PASS_GLO_SPEED,
  PASS_P5_AT,
  PASS_SLOW_UNTIL,
  pass25,
  passSlow,
} from "./staging.ts";
import { PosTag } from "./PosTag";
import { BRAZIL_CAM } from "../../../scenes/brazil-2008/trackside";

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
  // the tags flip on the beat HAM is past (47.3), with a small pop
  const passed = t >= PASS_P5_AT;
  const pop = 1 + 0.12 * hit(t, PASS_P5_AT, 0.08);
  // WHOOSH! slams in on the hit, holds through the slow motion and clears over the first beat of real time
  const sfxIn = ramp(t, 0, 0.12);
  const sfx =
    sfxIn * (1 - ramp(t, PASS_SLOW_UNTIL, PASS_SLOW_UNTIL + 0.45));
  return (
    <Page>
      <RainCloseup
        t={tau}
        camX={pos.camX}
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
          transform={`translate(${hamA.x + 2.4 * hamA.pxPerMetre} ${hamA.y + 70}) scale(${pop})`}
        >
          <PosTag x={0} y={0} code="HAM" pos={passed ? 5 : 6} big />
        </g>
        <g
          transform={`translate(${gloA.x + 2.4 * gloA.pxPerMetre} ${gloA.y - 170}) scale(${pop})`}
        >
          <PosTag x={0} y={0} code="GLO" pos={passed ? 6 : 5} />
        </g>
        {sfx > 0 ? (
          <g
            opacity={sfx}
            transform={`translate(1500 330) scale(${1.4 - 0.4 * sfxIn}) translate(-1500 -330)`}
          >
            <Sfx x={1580} y={330} size={180} rotate={-10} anchor="middle">
              WHOOSH!
            </Sfx>
          </g>
        ) : null}
        <rect width={1920} height={1080} fill={PAPER} opacity={0.85 * flash} />
      </RainCloseup>
    </Page>
  );
};
