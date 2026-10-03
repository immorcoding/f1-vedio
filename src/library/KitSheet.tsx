// Kit sheet: the manga rendering primitives side by side — paper, the three screentone levels, ink weights,
// focus lines, speed lines and the lettering — for review against the settled scene (ART-2, ART-6).
import { AbsoluteFill } from "remotion";
import { INK, PAPER } from "../kit/colors";
import { Ink, InkFilterDef, inkFilter } from "../kit/ink";
import { CAPTION_FONT, Caption, Sfx } from "../kit/lettering";
import { focusLines, speedLines } from "../kit/lines";
import { ToneDefs, tone, type ToneLevel } from "../kit/tone";

const Label: React.FC<{ x: number; y: number; children: string }> = ({
  x,
  y,
  children,
}) => (
  <text x={x} y={y} fontFamily={CAPTION_FONT} fontSize={30} fill={INK}>
    {children}
  </text>
);

export const KitSheet: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: PAPER }}>
    <svg width={1920} height={1080}>
      <defs>
        <ToneDefs />
        <InkFilterDef />
        <clipPath id="kit-focus">
          <rect x={60} y={480} width={860} height={540} />
        </clipPath>
        <clipPath id="kit-speed">
          <rect x={1000} y={480} width={860} height={540} />
        </clipPath>
      </defs>
      <g filter={inkFilter()}>
        {(["dark", "mid", "light"] as ToneLevel[]).map((level, i) => (
          <g key={level}>
            <rect
              x={60 + i * 300}
              y={90}
              width={260}
              height={160}
              fill={tone(level)}
              stroke={INK}
              strokeWidth={5}
            />
            <Label x={60 + i * 300} y={290}>{`网点 ${level}`}</Label>
          </g>
        ))}
        {[2.2, 4, 7, 12].map((w, i) => (
          <Ink
            key={w}
            d={`M 1000 ${100 + i * 45} C 1150 ${70 + i * 45} 1300 ${130 + i * 45} 1450 ${100 + i * 45}`}
            w={w}
          />
        ))}
        <Label x={1000} y={290}>
          墨线
        </Label>
        <Caption
          x={1500}
          y={80}
          w={330}
          h={150}
          lines={["第 58 圈，", "T5 发卡弯。"]}
        />
        <Sfx x={1520} y={380} size={110} rotate={-8}>
          轰——！
        </Sfx>

        <g clipPath="url(#kit-focus)">
          <path d={focusLines(490, 750, 140, 110, 5)} fill={INK} />
        </g>
        <rect
          x={60}
          y={480}
          width={860}
          height={540}
          fill="none"
          stroke={INK}
          strokeWidth={8}
        />
        <Label x={80} y={460}>
          集中线
        </Label>

        <g clipPath="url(#kit-speed)">
          <path
            d={speedLines({
              x: 1000,
              y: 480,
              w: 860,
              h: 540,
              n: 70,
              seed: "kit",
              thickness: 7,
            })}
            fill={INK}
          />
          <path
            d={speedLines({
              x: 1300,
              y: 560,
              w: 500,
              h: 200,
              angle: -12,
              n: 18,
              seed: "kit-b",
              thickness: 4,
              length: [0.3, 0.9],
            })}
            fill={INK}
          />
        </g>
        <rect
          x={1000}
          y={480}
          width={860}
          height={540}
          fill="none"
          stroke={INK}
          strokeWidth={8}
        />
        <Label x={1020} y={460}>
          速度线
        </Label>
      </g>
    </svg>
  </AbsoluteFill>
);
