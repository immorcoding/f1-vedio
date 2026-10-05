// Cover A: the four eras in four panels cut by slanted gutters — Senna's MP4/5 (Suzuka 1989), Hamilton's MP4-23 in
// the rain (Brazil 2008), Grosjean's VF-20 split and burning (Bahrain 2020), Verstappen's RB16B (Abu Dhabi 2021) —
// each on speed lines, with the title slammed across the cross of the gutters. Cars side-on, facing right (ART-40),
// in their real liveries (ART-8); captions sit clear of the cars (ART-14), nothing important in the bottom right
// (the duration badge).
import { CARS_2008, MP4_5_SEN, MangaCar, RB16B, VF20 } from "../cars";
import { INK, PAPER } from "../kit/colors";
import { FIRE_COLOR, Fire } from "../kit/fire";
import { Caption } from "../kit/lettering";
import { speedLines } from "../kit/lines";
import { Rain } from "../kit/rain";
import { CoverTitle, titleLayout } from "./CoverTitle";
import {
  CoverPage,
  PanelBorder,
  W,
  ct,
  meet,
  poly,
  type CoverProps,
  type Pt,
} from "./frame";

const M = 22; // page margin
const G = 13; // half gutter

export const CoverA: React.FC<CoverProps> = ({ h }) => {
  const mid = h / 2;
  const line = (a: Pt, b: Pt) => [a, b] as const;
  const Vl = line({ x: 1030 - G, y: 0 }, { x: 890 - G, y: h });
  const Vr = line({ x: 1030 + G, y: 0 }, { x: 890 + G, y: h });
  const Hu = line({ x: 0, y: mid + 45 - G }, { x: W, y: mid - 45 - G });
  const Hd = line({ x: 0, y: mid + 45 + G }, { x: W, y: mid - 45 + G });
  const top = line({ x: 0, y: M }, { x: 1, y: M });
  const bottom = line({ x: 0, y: h - M }, { x: 1, y: h - M });
  const left = line({ x: M, y: 0 }, { x: M, y: 1 });
  const right = line({ x: W - M, y: 0 }, { x: W - M, y: 1 });
  const m = (a: readonly [Pt, Pt], b: readonly [Pt, Pt]) =>
    meet(a[0], a[1], b[0], b[1]);
  const panels = {
    tl: poly([m(left, top), m(Vl, top), m(Vl, Hu), m(left, Hu)]),
    tr: poly([m(Vr, top), m(right, top), m(right, Hu), m(Vr, Hu)]),
    bl: poly([m(left, Hd), m(Vl, Hd), m(Vl, bottom), m(left, bottom)]),
    br: poly([m(Vr, Hd), m(right, Hd), m(right, bottom), m(Vr, bottom)]),
  };
  const S = 160;
  const L = titleLayout(S);
  const blockH = L.subY + L.subH;
  const tx = W / 2 - L.mainW / 2 - 20;
  const ty = mid - blockH / 2 + 10;
  const upGround = mid - 175;
  const lowGround = h - 62;
  // the Bahrain panel's car stands higher, its caption under it
  const fireGround = h - 128;
  const frame = { x: 0, y: 0, w: W, h };
  return (
    <CoverPage h={h}>
      <defs>
        {Object.entries(panels).map(([k, d]) => (
          <clipPath key={k} id={`a-${k}`}>
            <path d={d} />
          </clipPath>
        ))}
        <radialGradient id="a-glow" cx="0.5" cy="0.75" r="0.6">
          <stop offset="0" stopColor="#ff7a1e" stopOpacity={0.75} />
          <stop offset="1" stopColor="#ff7a1e" stopOpacity={0} />
        </radialGradient>
      </defs>
      <rect width={W} height={h} fill={INK} />

      {/* 1989 · Suzuka: paper, a light-toned grandstand band, speed lines */}
      <g clipPath="url(#a-tl)">
        <rect width={W} height={h} fill={PAPER} />
        <rect x={0} y={0} width={W} height={upGround - 200} fill={ct("light")} />
        <rect x={0} y={upGround - 200} width={W} height={10} fill={INK} />
        <path
          d={speedLines({ x: -40, y: 40, w: 1100, h: upGround - 20, n: 70, seed: "a89", thickness: 9 })}
          fill={INK}
        />
        <MangaCar car={MP4_5_SEN} at={{ x: 150, y: upGround, pxPerMetre: 165 }} />
        <path
          d={speedLines({ x: -60, y: upGround - 150, w: 260, h: 150, n: 14, seed: "a89t", thickness: 6 })}
          fill={INK}
        />
      </g>

      {/* 2008 · Interlagos: wet, dark tone, rain in paper */}
      <g clipPath="url(#a-tr)">
        <rect width={W} height={h} fill={ct("mid")} />
        <rect x={0} y={upGround - 30} width={W} height={h} fill={ct("dark")} />
        <Rain x={1000} y={0} w={920} h={mid} t={3.2} n={150} slant={14} length={70} color={PAPER} width={3} opacity={0.9} seed="a08" />
        <MangaCar
          car={CARS_2008["MP4-23"]}
          at={{ x: 1110, y: upGround - 40, pxPerMetre: 165 }}
          state={{ tread: "wet" }}
        />
        <path
          d={speedLines({ x: 960, y: upGround - 190, w: 260, h: 170, n: 16, seed: "a08t", thickness: 7 })}
          fill={PAPER}
        />
      </g>

      {/* 2020 · Bahrain: night, the VF-20 in two pieces in the fire */}
      <g clipPath="url(#a-bl)">
        <rect width={W} height={h} fill={INK} />
        <rect x={0} y={fireGround - 40} width={W} height={h} fill={ct("dark")} />
        <rect x={0} y={mid} width={1000} height={h - mid} fill="url(#a-glow)" style={{ mixBlendMode: "screen" }} />
        <Fire
          x={470}
          y={fireGround - 10}
          w={760}
          h={360}
          frame={140}
          seed="cover-a-back"
          palette={FIRE_COLOR}
          tongues={7}
          smoke={false}
          clip={frame}
        />
        <MangaCar
          car={VF20}
          at={{ x: 120, y: fireGround, pxPerMetre: 140 }}
          state={{
            split: {
              front: { dx: 0.7, dy: 0.04, rotate: -3 },
              rear: { dx: -0.45, rotate: 4 },
            },
          }}
        />
        <Fire
          x={360}
          y={fireGround + 30}
          w={520}
          h={130}
          frame={170}
          seed="cover-a-front"
          palette={{ ...FIRE_COLOR, glow: null }}
          tongues={6}
          embers={8}
          smoke={false}
          clip={frame}
        />
      </g>

      {/* 2021 · Abu Dhabi: paper and speed lines, the RB16B flat out */}
      <g clipPath="url(#a-br)">
        <rect width={W} height={h} fill={PAPER} />
        <rect x={0} y={mid} width={W} height={lowGround - mid - 190} fill={ct("light")} />
        <path
          d={speedLines({ x: 880, y: mid + 30, w: 1100, h: h - mid - 40, n: 80, seed: "a21", thickness: 10 })}
          fill={INK}
        />
        <MangaCar car={RB16B} at={{ x: 1000, y: lowGround, pxPerMetre: 150 }} />
      </g>

      {Object.values(panels).map((d) => (
        <PanelBorder key={d} d={d} />
      ))}

      {/* era captions, in the corners the cars leave free (none in the bottom right) */}
      <Caption x={M + 26} y={M + 24} lines={["SUZUKA 1989"]} size={34} />
      <Caption x={W - M - 26} y={M + 24} lines={["BRAZIL 2008"]} size={34} boxAnchor="end" />
      <Caption x={M + 26} y={h - M - 90} lines={["BAHRAIN 2020"]} size={34} />
      <Caption x={W - M - 26} y={mid + 120} lines={["ABU DHABI 2021"]} size={34} boxAnchor="end" />

      <g transform={`rotate(-3 ${W / 2} ${mid})`}>
        <CoverTitle x={tx} y={ty} S={S} />
      </g>
    </CoverPage>
  );
};
