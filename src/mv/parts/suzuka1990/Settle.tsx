// Shot 1.8 (bars 29–32): the dust settles. The crash panel holds on the two cars stopped in the Turn 1 gravel while the
// dust sinks and thins; on 30.1 two tall manga panels slide in from either side and face each other — PRO's helmet
// on the left (the 1989 champion, in the 1989 McLaren), SEN's on the right (the 1990 champion, in the MP4/5B) — over
// "89 PRO · 90 SEN". The last bar pushes slowly in; the cut is 33.1.
import { Easing } from "remotion";
import { MangaCar, MP4_5_PRO, MP4_5B_SEN, type CarSpec } from "../../../cars";
import { INK, PAPER } from "../../../kit/colors";
import { InkFilterDef, inkFilter } from "../../../kit/ink";
import { focusLines } from "../../../kit/lines";
import { ToneDefs, tone } from "../../../kit/tone";
import { cueFrame, ramp, shotById, type PictureProps } from "./common";
import { CrashStage } from "./Crash";

// Helmet centre of a car in metres from its origin (rear end on the ground): x forward, y up.
const helmetM = (car: CarSpec) => {
  const ppm = 250 / car.frame.k;
  return {
    x: (car.frame.x - car.helmetAt.cx) / ppm,
    y: (car.frame.ground - car.helmetAt.cy) / ppm,
  };
};

type Box = { x: number; y: number; w: number; h: number };

// A tall panel of one driver's helmet in the cockpit: the car drawn huge so the helmet fills the panel, facing the
// other panel.
const HelmetPanel: React.FC<{
  car: CarSpec;
  box: Box;
  facing: "left" | "right";
  id: string;
  seed: number;
  zoom: number;
}> = ({ car, box, facing, id, seed, zoom }) => {
  const ppm = 1150 * zoom;
  const h = helmetM(car);
  const cx = box.x + box.w * 0.5;
  const cy = box.y + box.h * 0.46;
  const dir = facing === "right" ? 1 : -1;
  return (
    <g>
      <rect
        x={box.x + 16}
        y={box.y + 16}
        width={box.w}
        height={box.h}
        fill={INK}
      />
      <clipPath id={id}>
        <rect x={box.x} y={box.y} width={box.w} height={box.h} />
      </clipPath>
      <g clipPath={`url(#${id})`}>
        <rect x={box.x} y={box.y} width={box.w} height={box.h} fill={PAPER} />
        <path
          d={focusLines(cx, cy, 260, 110, seed)}
          fill={INK}
          opacity={0.85}
        />
        <MangaCar
          car={car}
          facing={facing}
          at={{ x: cx - dir * h.x * ppm, y: cy + h.y * ppm, pxPerMetre: ppm }}
        />
      </g>
      <rect
        x={box.x}
        y={box.y}
        width={box.w}
        height={box.h}
        fill="none"
        stroke={INK}
        strokeWidth={10}
      />
    </g>
  );
};

export const Settle: React.FC<PictureProps> = ({ f }) => {
  const shot = shotById("1.8");
  const helm = cueFrame("suzuka1990.helmets");
  const t = f - shot.from;
  const len = shot.to - shot.from;
  // the dust sinks and thins over the first bar and a half
  const dustFade = ramp(t, 10, 150, Easing.inOut(Easing.quad));
  const left = ramp(f, helm, helm + 22, Easing.out(Easing.back(1.2)));
  const right = ramp(f, helm + 8, helm + 30, Easing.out(Easing.back(1.2)));
  const dim = ramp(f, helm, helm + 20);
  const text = ramp(f, helm + 34, helm + 52, Easing.out(Easing.back(1.8)));
  const push = 1 + 0.06 * ramp(t, len - 112, len, Easing.inOut(Easing.quad));
  const L: Box = { x: 90, y: 70, w: 840, h: 700 };
  const R: Box = { x: 990, y: 70, w: 840, h: 700 };
  return (
    <svg viewBox="0 0 1920 1080" width={1920} height={1080}>
      <defs>
        <ToneDefs />
        <InkFilterDef />
      </defs>
      <rect width={1920} height={1080} fill={PAPER} />
      <g filter={inkFilter()}>
        {/* the crash panel, held on its last frame, the cars at rest */}
        <CrashStage f={shot.from - 1} dustFade={dustFade} />
        {/* falling grains of gravel as the dust sinks */}
        <rect
          width={1920}
          height={1080}
          fill={tone("light")}
          opacity={0.6 * dim}
        />
        <g transform={`translate(960 470) scale(${push}) translate(-960 -470)`}>
          {left > 0 ? (
            <g transform={`translate(${-(1 - left) * 1100} 0)`}>
              <HelmetPanel
                car={MP4_5_PRO}
                box={L}
                facing="right"
                id="s18-pro"
                seed={4}
                zoom={1}
              />
            </g>
          ) : null}
          {right > 0 ? (
            <g transform={`translate(${(1 - right) * 1100} 0)`}>
              <HelmetPanel
                car={MP4_5B_SEN}
                box={R}
                facing="left"
                id="s18-sen"
                seed={9}
                zoom={1}
              />
            </g>
          ) : null}
        </g>
        {text > 0 ? (
          <g
            opacity={text}
            transform={`translate(960 950) scale(${0.8 + 0.2 * text})`}
          >
            <rect x={-560} y={-82} width={1120} height={124} fill={INK} />
            <text
              x={0}
              y={18}
              textAnchor="middle"
              fontFamily="Arial Black, Arial, sans-serif"
              fontWeight={900}
              fontStyle="italic"
              fontSize={92}
              fill={PAPER}
            >
              {shot.text[0]}
            </text>
          </g>
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
