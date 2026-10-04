// People-Hands: the people module's hands and limbs up close (ART-16) — every hand shape at close-up size (500 px/m)
// and at group-shot size (104 px/m, actual pixels), in race gloves, dark gloves and bare hands; and the upper body of a
// race suit (collar, zip, shoulder seam, epaulette, glove cuffs), work overalls and street clothes.
import { AbsoluteFill } from "remotion";
import { INK, PAPER } from "../kit/colors";
import { CAPTION_FONT } from "../kit/lettering";
import {
  DOCTOR,
  Figure,
  MARSHAL,
  solve,
  spray,
  stand,
  v,
  walk,
  wave,
  type ArmPose,
  type Grip,
  type Held,
  type Outfit,
  type Pose,
  type V,
} from "../kit/figure";
import { FAN_RED, GROSJEAN, SENNA } from "./PeopleSheet";

// A crop of a figure: the figure-frame point `focus` lands in the middle of the box.
const Crop: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  s: number;
  pose: Pose;
  outfit: Outfit;
  focus: V;
  held?: Held;
  facing?: "left" | "right";
  label?: string;
}> = ({ x, y, w, h, s, pose, outfit, focus, held, facing = "right", label }) => {
  const dir = facing === "left" ? -1 : 1;
  const at = { x: w / 2 - focus.x * s * dir, y: h / 2 + focus.y * s };
  return (
    <g>
      <svg x={x} y={y} width={w} height={h} overflow="hidden">
        <rect width={w} height={h} fill={PAPER} />
        <Figure at={at} pxPerMetre={s} pose={pose} outfit={outfit} facing={facing} held={held} shadow={false} />
      </svg>
      <rect x={x} y={y} width={w} height={h} fill="none" stroke={INK} strokeWidth={2} />
      {label ? (
        <text x={x + 6} y={y + h + 20} fontFamily={CAPTION_FONT} fontSize={18} fill={INK} opacity={0.75}>
          {label}
        </text>
      ) : null}
    </g>
  );
};

// One arm held out for each hand shape (the near arm; the rest of the body is a plain stand).
const GRIPS: { grip: Grip; label: string; arm: ArmPose }[] = [
  { grip: "fist", label: "握拳", arm: { shoulder: 60, elbow: 30, wrist: 0 } },
  { grip: "hold", label: "握持", arm: { shoulder: 60, elbow: 30, wrist: 0 } },
  { grip: "flat", label: "手掌", arm: { shoulder: 70, elbow: 24, wrist: 40 } },
  { grip: "open", label: "放松", arm: { shoulder: 12, elbow: 18, wrist: 10 } },
  { grip: "spread", label: "张开", arm: { shoulder: 104, elbow: 58, wrist: 0, upper: 0.7 } },
  { grip: "point", label: "指", arm: { shoulder: 88, elbow: 4, wrist: -4 } },
];
const gripPose = (g: (typeof GRIPS)[number]): Pose => {
  const s = stand({ t: 0.4 });
  return { ...s, arms: { ...s.arms, near: { ...g.arm, grip: g.grip } } };
};
// the middle of the near hand, for the crop
const handFocus = (pose: Pose) => {
  const a = solve(pose).arms.near;
  return { x: a.wrist.x + a.handDir.x * 0.07, y: a.wrist.y + a.handDir.y * 0.07 };
};

export const PeopleHands: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: PAPER }}>
    <svg width={1920} height={1080}>
      <text x={30} y={44} fontFamily={CAPTION_FONT} fontSize={28} fill={INK}>
        手 · 500 px/m
      </text>
      {GRIPS.map((g, i) => {
        const pose = gripPose(g);
        const f = handFocus(pose);
        return (
          <g key={g.grip}>
            <Crop x={30 + i * 200} y={60} w={180} h={180} s={500} pose={pose} outfit={SENNA} focus={f} label={g.label} />
            <Crop x={30 + i * 200} y={272} w={180} h={150} s={500} pose={pose} outfit={i % 2 ? FAN_RED : GROSJEAN} focus={f} />
          </g>
        );
      })}
      <text x={1250} y={44} fontFamily={CAPTION_FONT} fontSize={28} fill={INK}>
        104 px/m（实际像素）
      </text>
      {GRIPS.map((g, i) => {
        const pose = gripPose(g);
        const x = 1250 + (i % 3) * 215;
        const y = 60 + Math.floor(i / 3) * 200;
        return (
          <g key={g.grip}>
            <Crop x={x} y={y} w={102} h={170} s={104} pose={pose} outfit={SENNA} focus={v(0.08, 1.0)} label={g.label} />
            <Crop x={x + 104} y={y} w={102} h={170} s={104} pose={pose} outfit={MARSHAL} focus={v(0.08, 1.0)} />
          </g>
        );
      })}
      <text x={30} y={480} fontFamily={CAPTION_FONT} fontSize={28} fill={INK}>
        上身特写：领口、拉链、肩线、肩带、手套
      </text>
      <Crop x={30} y={500} w={560} h={540} s={720} pose={walk(0.4)} outfit={SENNA} focus={v(0.06, 1.3)} facing="left" />
      <Crop x={610} y={500} w={460} h={540} s={720} pose={wave(0.15)} outfit={GROSJEAN} focus={v(0.12, 1.45)} />
      <Crop
        x={1090}
        y={500}
        w={420}
        h={540}
        s={520}
        pose={spray(0.2)}
        outfit={MARSHAL}
        focus={v(0.3, 1.0)}
        held={{ kind: "extinguisher" }}
      />
      <Crop x={1530} y={500} w={360} h={260} s={520} pose={stand({ t: 1 })} outfit={FAN_RED} focus={v(0.05, 1.2)} />
      <Crop x={1530} y={780} w={360} h={260} s={520} pose={walk(0.3)} outfit={DOCTOR} focus={v(0.05, 1.15)} facing="left" />
    </svg>
  </AbsoluteFill>
);
