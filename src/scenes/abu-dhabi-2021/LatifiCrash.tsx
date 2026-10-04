// Easter egg (STO-7, treatment 4.3): what brought out the last safety car — on lap 53 Latifi (Williams) crashed into
// the wall at the exit of turn 14 (facts.md). A tight side inset of the car against the wall, cropped from the rear
// wing to the cockpit, the impact bursting at the front edge with carbon shards flying out (#21; v1 had only the star).
// The Williams FW43B is drawn in its own photo's pixel space after Lukas Raich's 2021 side photo of Latifi's car
// (references/yas-marina/latifi-fw43b-2021-side.jpg, CC BY-SA 4.0; the photo faces left, the inset mirrors it so the
// car drives right like every car in the part): the 2021 livery in flat blocks — deep blue body, the light-blue wave
// stripes over the sidepod and engine cover, the white nose, orange pinstripes on the dark-blue tail, the navy rear-wing
// endplate, the yellow roll-hoop camera — and Latifi's white helmet with its red crown. The crop stops above the tyres'
// coloured bands (the compound he was on is not verified). No lettering or logos (ART-5).
import { random } from "remotion";
import { INK, PAPER } from "../../kit/colors";
import { ImpactStar } from "../../kit/impact";

const BLUE = "#1d2c8f";
const BLUE_DEEP = "#141d63";
const STRIPE = "#4cb8f0";
const ORANGE = "#f08a1c";
const WHITE = "#f4f4f2";
const CARBON = "#25272d";
const CAM_YELLOW = "#e3e01a";
const HELMET_RED = "#d5282e";

// The photo window the inset shows (photo px).
const WIN = { x0: 770, x1: 1870, y0: 190, y1: 618 };
export const LATIFI_ASPECT = (WIN.y1 - WIN.y0) / (WIN.x1 - WIN.x0);

const BODY =
  "M 770 566 L 905 548 L 960 556 C 992 548 1010 540 1018 520 L 1022 452 L 1095 440 L 1340 436 " +
  "C 1420 440 1500 470 1565 505 L 1580 540 L 1560 600 C 1530 650 1480 690 1420 705 L 960 740 L 770 740 Z";
const TAIL =
  "M 1385 437 C 1440 445 1500 470 1565 505 L 1580 540 L 1560 600 C 1530 650 1480 690 1420 705 L 1405 705 C 1400 600 1392 520 1385 437 Z";
const NOSE = "M 770 566 L 905 548 L 912 640 L 770 652 Z";

// The light-blue waves: bands leaning back from the sidepod's foot up over the engine cover.
const stripes = () =>
  Array.from({ length: 9 }, (_, i) => {
    const xt = 1095 + i * 33;
    const xb = 975 + i * 42;
    const w = 13 - (i % 3) * 2;
    return `M ${xt} 430 C ${xt - 40} 520 ${xb + 50} 600 ${xb} 760 L ${xb + w} 760 C ${xb + 50 + w} 600 ${xt - 40 + w} 520 ${xt + w} 430 Z`;
  }).join(" ");

/** Drawn into the box (x, y, w, w × LATIFI_ASPECT); `t` seconds since the inset appeared. */
export const LatifiCrash: React.FC<{
  x: number;
  y: number;
  w: number;
  t: number;
}> = ({ x, y, w, t }) => {
  const s = w / (WIN.x1 - WIN.x0);
  const h = w * LATIFI_ASPECT;
  const shards = Array.from({ length: 14 }, (_, i) => {
    const r = (k: string) => random(`latifi-${k}-${i}`);
    // flying out of the impact, mostly back over the car (photo +x) and up, falling back under gravity
    const vx = -120 + 420 * r("vx");
    const vy = -(80 + 200 * r("vy"));
    const tt = t + 0.15;
    return {
      x: 810 + vx * tt,
      y: 520 + vy * tt + 300 * tt * tt,
      s: 8 + 12 * r("s"),
      a: r("a") * 360 + tt * 500 * (r("w") - 0.5),
      dark: r("d") < 0.7,
    };
  });
  return (
    <g>
      <defs>
        <clipPath id="latifi-box">
          <rect x={x} y={y} width={w} height={h} />
        </clipPath>
        <pattern id="latifi-tone" width={7} height={7} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <circle cx={3.5} cy={3.5} r={1.8} fill={INK} />
        </pattern>
        <pattern id="latifi-fence" width={34} height={34} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <path d="M 0 0 L 34 0 M 0 0 L 0 34" stroke={PAPER} strokeWidth={2} opacity={0.45} />
        </pattern>
      </defs>
      <g clipPath="url(#latifi-box)">
        <rect x={x} y={y} width={w} height={h} fill={INK} />
        <g transform={`translate(${x + WIN.x1 * s} ${y - WIN.y0 * s}) scale(${-s} ${s})`}>
          {/* debris fence above the wall, then the concrete wall with its joints, shaded under the cap */}
          <rect x={WIN.x0 - 20} y={WIN.y0} width={1140} height={150} fill="url(#latifi-fence)" />
          <path d={`M ${WIN.x0 - 20} 210 L ${WIN.x1 + 20} 210`} stroke={PAPER} strokeWidth={5} opacity={0.6} />
          <rect x={WIN.x0 - 20} y={340} width={1140} height={150} fill={PAPER} />
          <rect x={WIN.x0 - 20} y={352} width={1140} height={138} fill="url(#latifi-tone)" opacity={0.45} />
          <path d={`M ${WIN.x0 - 20} 340 L ${WIN.x1 + 20} 340`} stroke={INK} strokeWidth={8} />
          {[880, 1060, 1240, 1420, 1600, 1780].map((jx) => (
            <path key={jx} d={`M ${jx} 340 L ${jx} 490`} stroke={INK} strokeWidth={4} />
          ))}
          <rect x={WIN.x0 - 20} y={490} width={1140} height={200} fill={INK} />
          {/* the wall cracked where the car hit it */}
          <path d="M 790 340 L 830 400 L 812 430 L 850 470 M 830 400 L 870 392" stroke={INK} strokeWidth={5} fill="none" />

          {/* rear wing: navy endplate, the dark upper flap and main plane */}
          <path d="M 1590 405 L 1782 412 L 1845 495 L 1840 590 L 1650 594 L 1600 520 Z" fill={BLUE_DEEP} stroke={INK} strokeWidth={7} strokeLinejoin="round" />
          <path d="M 1588 398 L 1792 406 L 1792 444 L 1596 440 Z" fill={CARBON} stroke={INK} strokeWidth={6} />
          <path d="M 1620 470 L 1830 478" stroke={PAPER} strokeWidth={4} opacity={0.5} />
          {/* rear tyre's crown peeking under the crop (tread only, the band is below the crop) */}
          <circle cx={1625} cy={715} r={105} fill={INK} />

          {/* body: deep blue, the wave stripes, the dark tail with orange pinstripes, the white nose */}
          <path d={BODY} fill={BLUE} stroke={INK} strokeWidth={7} strokeLinejoin="round" />
          <clipPath id="latifi-body">
            <path d={BODY} />
          </clipPath>
          <g clipPath="url(#latifi-body)">
            <path d={stripes()} fill={STRIPE} />
            <path d={TAIL} fill={BLUE_DEEP} />
            <path d="M 1405 450 L 1380 560 M 1440 458 L 1415 570 M 1475 470 L 1452 580" stroke={ORANGE} strokeWidth={5} />
            <path d="M 760 600 L 1600 560 L 1600 760 L 760 760 Z" fill="url(#latifi-tone)" opacity={0.35} />
            <path d={NOSE} fill={WHITE} />
            <path d="M 770 610 L 912 598" stroke={STRIPE} strokeWidth={10} />
            <path d="M 770 622 L 912 610" stroke={ORANGE} strokeWidth={4} />
          </g>
          <path d={BODY} fill="none" stroke={INK} strokeWidth={7} strokeLinejoin="round" />
          {/* highlight along the engine cover */}
          <path d="M 1100 450 L 1335 446 C 1410 450 1480 474 1540 502" fill="none" stroke={PAPER} strokeWidth={5} opacity={0.75} />
          {/* airbox mouth and the yellow roll-hoop camera */}
          <path d="M 1022 452 L 1095 440 L 1092 474 L 1030 484 Z" fill={INK} />
          <path d="M 1062 440 L 1062 424" stroke={INK} strokeWidth={10} />
          <rect x={1035} y={408} width={56} height={18} rx={5} fill={CAM_YELLOW} stroke={INK} strokeWidth={5} />
          {/* Latifi's helmet: white, red crown, dark visor facing forward */}
          <circle cx={945} cy={514} r={44} fill={WHITE} stroke={INK} strokeWidth={6} />
          <path d="M 905 498 C 915 470 960 462 985 482 L 975 494 C 955 482 925 486 912 504 Z" fill={HELMET_RED} />
          <path d="M 903 512 L 940 506 L 942 526 L 908 532 Z" fill={INK} />
          {/* halo: top hoop and front pillar */}
          <path d="M 772 548 L 780 500 C 830 482 910 478 1012 488" fill="none" stroke={INK} strokeWidth={18} strokeLinecap="round" />
          <path d="M 784 500 C 832 486 910 482 1008 491" fill="none" stroke="#3a3d45" strokeWidth={7} strokeLinecap="round" />

          {/* the impact at the front edge and the shards flying out of it */}
          {shards.map((d, i) => (
            <path
              key={i}
              d={`M ${-d.s} ${-d.s * 0.4} L ${d.s} ${-d.s * 0.7} L ${d.s * 0.4} ${d.s * 0.8} Z`}
              transform={`translate(${d.x} ${d.y}) rotate(${d.a})`}
              fill={d.dark ? CARBON : i % 3 === 0 ? STRIPE : WHITE}
              stroke={INK}
              strokeWidth={3}
            />
          ))}
        </g>
        <ImpactStar x={x + w - 12} y={y + (520 - WIN.y0) * s} r={66} seed="latifi" t={Math.min(1, 0.35 + t * 1.5)} />
      </g>
      <rect x={x} y={y} width={w} height={h} fill="none" stroke={INK} strokeWidth={8} />
    </g>
  );
};
