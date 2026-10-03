// PROTOTYPE — one race moment, hand-drawn: Abu Dhabi 2021, final lap, Verstappen passes Hamilton into Turn 5.
// Track geometry is a stylised stand-in for Yas Marina's T5 hairpin, not traced from the real layout.
import { Series, useCurrentFrame } from "remotion";
import { DrawPath, F1_RED, ramp } from "./sketch-kit";
import { Note, OutcomeCard, Page, RacingLine, Road, SideCar, TitleCard, TopCar, TrackingBackdrop, kf, type Team } from "./race-kit";

const RED_BULL: Team = { body: "#1e2a5a", accent: F1_RED, helmet: "#ff8c1a" };
const MERCEDES: Team = { body: "#2a2a2a", accent: "#00a19b", helmet: "#f0f0f0" };

const ROAD = "M 1960 360 L 700 360 C 420 360 380 760 640 760 L 1960 760";
const APEX_KERB = "M 720 418 C 520 418 470 690 640 700";
const VER_LINE = "M 1960 395 L 700 395 C 470 395 440 720 650 730 L 1960 735";
const HAM_LINE = "M 1960 325 L 700 325 C 360 325 330 800 660 790 L 1960 780";

export const TOP_DOWN_FRAMES = 420;

const TopDown: React.FC = () => {
  const f = useCurrentFrame();
  const ham = kf(f, [60, 220, 300, 420], [0.04, 0.38, 0.5, 0.9]);
  const ver = kf(f, [60, 220, 300, 420], [0.0, 0.4, 0.53, 0.93]);
  return (
    <Page boilId="boil-top">
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <Road d={ROAD} progress={ramp(f, 0, 70)} kerbs={[APEX_KERB]} />
        <RacingLine d={VER_LINE} opacity={ramp(f, 150, 190) * (1 - ramp(f, 320, 360))} color="#1e2a5a" />
        <DrawPath d="M 980 470 C 880 520 760 520 690 470 L 712 462 M 690 470 L 702 492" progress={ramp(f, 190, 220)} stroke={F1_RED} width={5} />
        {f >= 60 ? <TopCar team={MERCEDES} line={HAM_LINE} t={ham} label="HAM" /> : null}
        {f >= 60 ? <TopCar team={RED_BULL} line={VER_LINE} t={ver} label="VER" labelBelow /> : null}
      </svg>
      <Note x={120} y={70} opacity={ramp(f, 10, 30)} size={84}>
        LAP 58 / 58
      </Note>
      <Note x={120} y={180} opacity={ramp(f, 30, 50)} size={48} zh>
        VER 新软胎 · HAM 旧硬胎
      </Note>
      <Note x={250} y={520} opacity={ramp(f, 70, 90)} size={64}>
        T5
      </Note>
      <Note x={1010} y={440} opacity={ramp(f, 200, 220)} size={56} color={F1_RED} zh>
        VER 内线突破！
      </Note>
      <Note x={1180} y={830} opacity={ramp(f, 330, 350)} size={48} zh>
        HAM 在后直道反扑……
      </Note>
    </Page>
  );
};

const CloseUp: React.FC = () => {
  const f = useCurrentFrame();
  const verX = kf(f, [0, 240], [1100, 1260]);
  const hamX = kf(f, [0, 150, 240], [480, 900, 820]);
  return (
    <Page boilId="boil-close">
      <TrackingBackdrop speed={42} />
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <SideCar team={RED_BULL} x={verX} ground={700} scale={0.72} spin={f * 31} />
        <SideCar team={MERCEDES} x={hamX} ground={870} scale={0.95} spin={f * 31} />
      </svg>
      <Note x={120} y={60} opacity={ramp(f, 5, 25)} size={56} zh>
        后直道 · HAM 借尾流追上来
      </Note>
      <Note x={1180} y={130} opacity={ramp(f, 150, 170)} size={64} color={F1_RED} zh>
        VER 守住了！
      </Note>
    </Page>
  );
};

export const ABU_DHABI_2021_FRAMES = 150 + TOP_DOWN_FRAMES + 240 + 180;

export const AbuDhabi2021: React.FC = () => (
  <Series>
    <Series.Sequence durationInFrames={150}>
      <TitleCard year="2021" race="Abu Dhabi Grand Prix" zh="最后一圈决定世界冠军" sub="两人同分进入收官战" />
    </Series.Sequence>
    <Series.Sequence durationInFrames={TOP_DOWN_FRAMES}>
      <TopDown />
    </Series.Sequence>
    <Series.Sequence durationInFrames={240}>
      <CloseUp />
    </Series.Sequence>
    <Series.Sequence durationInFrames={180}>
      <OutcomeCard head="Max Verstappen" body="2021 世界冠军" foot="领先 Hamilton 8 分" />
    </Series.Sequence>
  </Series>
);
