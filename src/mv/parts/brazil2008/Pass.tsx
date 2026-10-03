// Shot 2.5 (bars 47–48): out of Junção and up the hill. On 47.1 (`brazil2008.pass`) HAM, on intermediates, comes
// through on the Toyota's inside — the near side — and is past by the cut; GLO, on dry tyres in the wet, twitches and
// throws little spray (his tread holds no water). The pass lands with a white flash, focus lines and "嗖！" in brush
// script over the empty track ahead, clear of both cars (ART-14). The cars' treads differ in the side view too:
// HAM's tyres show the cut sipes, GLO's are smooth.
import { MP4_23, TF108 } from "../../../cars";
import { INK, PAPER } from "../../../kit/colors";
import { Sfx } from "../../../kit/lettering";
import { focusLines } from "../../../kit/lines";
import { hit, ramp, type ShotTime } from "../abuDhabi2021/shotClock";
import { Page, RainCloseup } from "./common";
import { pass25 } from "./staging.ts";

const V = 34; // m/s, the Toyota climbing out of Junção

export const Pass: React.FC<{ st: ShotTime }> = ({ st }) => {
  const { t } = st;
  const flash = hit(t, 0, 0.12);
  // HAM on the near side, GLO 6 m further across the road (true widths, ART-18): staging.ts
  const pos = pass25(t);
  const twitch = Math.sin(t * 9) * 1.2;
  const sfx = ramp(t, 0, 0.12);
  return (
    <Page>
      <RainCloseup
        t={t}
        camX={V * t}
        speed={0.9}
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
            state: { wheelAngle: t * 600, tread: "dry", tilt: twitch * 0.5 },
          },
          {
            car: MP4_23,
            x: pos.ham.x,
            z: pos.ham.z,
            state: { wheelAngle: t * 700, tread: "wet" },
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
        <rect width={1920} height={1080} fill={PAPER} opacity={0.85 * flash} />
      </RainCloseup>
    </Page>
  );
};
