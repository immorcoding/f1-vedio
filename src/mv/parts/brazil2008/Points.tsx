// Shot 2.7 (bars 53–56): the points. Two split-flap boards under the drivers' helmets (drawn from the traced cars,
// ART-13): on 53.1 (`brazil2008.points`) the flaps fall to HAM 98 · MAS 97 (facts.md), then "1 分" is brushed in
// between them. The rain thins out; focus lines settle on HAM's side.
import { CarInPhotoSpace, F2008, MP4_23, type CarSpec } from "../../../cars";
import { INK, PAPER } from "../../../kit/colors";
import { inkFilter } from "../../../kit/ink";
import { BRUSH_FONT } from "../../../kit/lettering";
import { focusLines } from "../../../kit/lines";
import { Rain } from "../../../kit/rain";
import { tone } from "../../../kit/tone";
import { clamp01, hit, ramp, type ShotTime } from "../abuDhabi2021/shotClock";
import { Page } from "./common";

// A round medallion around a car's helmet, cut from the side view at `zoom` × photo scale.
const Medallion: React.FC<{
  car: CarSpec;
  cx: number;
  cy: number;
  r: number;
  id: string;
  flip?: boolean;
}> = ({ car, cx, cy, r, id, flip = false }) => {
  const h = car.helmetAt;
  const k = (r * 0.62) / h.r;
  return (
    <g>
      <defs>
        <clipPath id={id}>
          <circle cx={cx} cy={cy} r={r} />
        </clipPath>
      </defs>
      <circle cx={cx} cy={cy} r={r} fill={tone("light")} />
      <g clipPath={`url(#${id})`}>
        <g
          transform={`translate(${cx} ${cy + r * 0.12}) scale(${flip ? -k : k} ${k}) translate(${-h.cx} ${-h.cy})`}
        >
          <CarInPhotoSpace car={car} />
        </g>
      </g>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={INK} strokeWidth={10} />
    </g>
  );
};

// One split-flap digit board: `value` shown once `u` (0–1, the fall of the flap) completes.
const FlapBoard: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  value: string;
  u: number;
  id: string;
}> = ({ x, y, w, h, value, u, id }) => {
  const mid = y + h / 2;
  // the falling flap: top half turning down about the hinge; first the blank back, then the new digit's lower half
  const s = Math.cos(u * Math.PI); // 1 → -1
  const digit = (
    <text
      x={x + w / 2}
      y={y + h * 0.8}
      textAnchor="middle"
      fontFamily="Arial Black, Arial, sans-serif"
      fontWeight={900}
      fontSize={h * 0.82}
      fill={PAPER}
    >
      {value}
    </text>
  );
  return (
    <g>
      <defs>
        <clipPath id={`${id}-top`}>
          <rect x={x} y={y} width={w} height={h / 2} />
        </clipPath>
        <clipPath id={`${id}-bot`}>
          <rect x={x} y={mid} width={w} height={h / 2} />
        </clipPath>
      </defs>
      <rect x={x} y={y} width={w} height={h} rx={18} fill={INK} />
      {/* new digit: its top half shows as soon as the flap starts to fall; its bottom half once the flap lands */}
      <g clipPath={`url(#${id}-top)`}>{u > 0 ? digit : null}</g>
      <g clipPath={`url(#${id}-bot)`}>{u >= 1 ? digit : null}</g>
      {u > 0 && u < 1 ? (
        <g transform={`translate(0 ${mid}) scale(1 ${s}) translate(0 ${-mid})`}>
          <rect
            x={x}
            y={y}
            width={w}
            height={h / 2}
            fill={s > 0 ? "#1d1d1f" : INK}
            stroke={PAPER}
            strokeWidth={2}
          />
          {s < 0 ? (
            <g
              clipPath={`url(#${id}-top)`}
              transform={`translate(0 ${2 * mid}) scale(1 -1)`}
            >
              {digit}
            </g>
          ) : null}
        </g>
      ) : null}
      <path
        d={`M ${x} ${mid} L ${x + w} ${mid}`}
        stroke={tone("mid")}
        strokeWidth={5}
      />
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={18}
        fill="none"
        stroke={INK}
        strokeWidth={8}
      />
    </g>
  );
};

export const Points: React.FC<{ st: ShotTime }> = ({ st }) => {
  const { t, dur } = st;
  const u = clamp01(t / 0.28);
  const land = hit(t, 0.28, 0.2);
  const one = ramp(t, 0.9, 1.6);
  const win = ramp(t, 1.6, dur);
  const rain = 1 - ramp(t, 0.5, dur);
  return (
    <Page>
      <rect width={1920} height={1080} fill={tone("light")} opacity={0.35} />
      <path
        d={focusLines(560, 520, 420, 130, Math.floor(t * 8))}
        fill={INK}
        opacity={0.12 + 0.3 * win}
      />
      <g
        filter={inkFilter()}
        transform={`translate(${Math.sin(t * 60) * 10 * land} 0)`}
      >
        <Medallion car={MP4_23} cx={560} cy={250} r={170} id="b27-ham" />
        <Medallion car={F2008} cx={1360} cy={250} r={170} id="b27-mas" />
        {[
          { x: 560, code: "HAM" },
          { x: 1360, code: "MAS" },
        ].map((d) => (
          <text
            key={d.code}
            x={d.x}
            y={480}
            textAnchor="middle"
            fontFamily="Arial Black, Arial, sans-serif"
            fontWeight={900}
            fontStyle="italic"
            fontSize={54}
            fill={INK}
          >
            {d.code}
          </text>
        ))}
        <FlapBoard
          x={400}
          y={520}
          w={320}
          h={300}
          value="98"
          u={u}
          id="b27-98"
        />
        <FlapBoard
          x={1200}
          y={520}
          w={320}
          h={300}
          value="97"
          u={clamp01((t - 0.06) / 0.28)}
          id="b27-97"
        />
        <text
          x={960}
          y={720}
          textAnchor="middle"
          fontFamily="Arial Black, Arial, sans-serif"
          fontWeight={900}
          fontSize={120}
          fill={INK}
        >
          ·
        </text>
        <g
          opacity={one}
          transform={`translate(960 990) scale(${1.3 - 0.3 * one}) translate(-960 -990)`}
        >
          <text
            x={960}
            y={1010}
            textAnchor="middle"
            fontFamily={BRUSH_FONT}
            fontSize={190}
            fill={INK}
            stroke={PAPER}
            strokeWidth={12}
            paintOrder="stroke"
          >
            1 分
          </text>
        </g>
      </g>
      <Rain t={t} n={Math.round(200 * rain)} opacity={0.5} seed="b27" />
      <rect width={1920} height={1080} fill={PAPER} opacity={0.6 * land} />
    </Page>
  );
};
