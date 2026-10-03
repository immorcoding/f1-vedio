// Review stills for the Bahrain 2020 assets (ticket #9; the 2020 car sheet is in CarSheet): the Haas broken in two and
// both cars from above (CarState.split, view "top"), and the fire in either palette (an open ART-8 decision: black
// and white or colour).
import { AbsoluteFill } from "remotion";
import { AT01, MangaCar, VF20 } from "../cars";
import { INK, PAPER } from "../kit/colors";
import { Fire, FIRE_PALETTES, type FirePaletteName } from "../kit/fire";
import { CAPTION_FONT } from "../kit/lettering";

const Label: React.FC<{ x: number; y: number; children: string }> = ({
  x,
  y,
  children,
}) => (
  <text x={x} y={y} fontFamily={CAPTION_FONT} fontSize={34} fill={INK}>
    {children}
  </text>
);

// The broken Haas (front piece forward and nose-down, rear piece back and turned) and both cars from above.
export const Cars2020States: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: PAPER }}>
    <svg width={1920} height={1080}>
      <Label x={60} y={70}>
        VF-20 断成两截（state.split）
      </Label>
      <MangaCar
        car={VF20}
        at={{ x: 260, y: 470, pxPerMetre: 230 }}
        state={{
          split: {
            front: { dx: 0.9, dy: 0.05, rotate: -4 },
            rear: { dx: -0.5, rotate: 3 },
          },
        }}
      />
      <Label x={60} y={620}>
        俯视（view top），2 m 宽通用平面
      </Label>
      <MangaCar
        car={VF20}
        view="top"
        at={{ x: 120, y: 820, pxPerMetre: 130 }}
        state={{ heading: 0 }}
      />
      <MangaCar
        car={AT01}
        view="top"
        at={{ x: 1020, y: 820, pxPerMetre: 130 }}
        state={{ heading: 0 }}
      />
      <Label x={120} y={1020}>
        GRO · VF-20
      </Label>
      <Label x={1020} y={1020}>
        KVY · AT01
      </Label>
    </svg>
  </AbsoluteFill>
);

// Fire in one palette: three consecutive steps of the same fire (it changes every 3 frames) on the night page, and a
// small fire on paper.
export const FireSheet: React.FC<{ palette: FirePaletteName }> = ({
  palette,
}) => {
  const p = FIRE_PALETTES[palette];
  return (
    <AbsoluteFill style={{ backgroundColor: PAPER }}>
      <svg width={1920} height={1080}>
        <rect x={0} y={0} width={1920} height={760} fill={INK} />
        {[0, 3, 6].map((f, i) => (
          <Fire
            key={f}
            x={330 + i * 630}
            y={700}
            w={460}
            h={560}
            frame={f}
            seed="sheet"
            palette={p}
          />
        ))}
        <Fire
          x={300}
          y={1040}
          w={240}
          h={220}
          frame={0}
          seed="small"
          palette={p}
          smoke={false}
        />
        <text
          x={620}
          y={960}
          fontFamily={CAPTION_FONT}
          fontSize={44}
          fill={INK}
        >
          {`火焰配色：${palette === "manga" ? "黑白（FIRE_MANGA）" : "彩色（FIRE_COLOR）"}`}
        </text>
        <text
          x={620}
          y={1020}
          fontFamily={CAPTION_FONT}
          fontSize={30}
          fill={INK}
        >
          上排：同一团火的第 0、3、6 帧（每 3 帧换一次形）
        </text>
      </svg>
    </AbsoluteFill>
  );
};
