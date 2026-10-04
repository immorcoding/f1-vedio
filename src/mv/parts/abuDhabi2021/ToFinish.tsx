// Shot 5.5 (bars 96–99): the rest of the last lap on the whole map, back straight to the flag, compressed into four
// bars. The map holds still, the way the 1.1 and 3.1 title maps do (review-1: the old turning, sliding map made
// viewers dizzy). Two glowing dots run the lap, VER ahead and HAM behind, with their tags. The lap VER has covered
// is inked in behind him. HAM falls back toward the 2.2 s (~150 m) he finished behind (facts.md). Each dot's glow
// pulses on the beat, with the hihats. On the last bar the page pushes straight in on the finish line, with no turn,
// and VER's dot reaches the line exactly on the cut (100.1, `abuDhabi2021.finish`).
import { INK, PAPER } from "../../../kit/colors";
import { InkFilterDef, inkFilter } from "../../../kit/ink";
import { CAPTION_FONT, useLettering } from "../../../kit/lettering";
import { focusLines } from "../../../kit/lines";
import { ToneDefs, tone } from "../../../kit/tone";
import { PANEL } from "../../../scenes/abu-dhabi-2021/Closeup";
import {
  FinishLine,
  fitMap,
  mapView,
  poseAt,
  samplePath,
  TrackMap,
  YAS_MARINA_2021,
} from "../../../tracks";
import { SECONDS_PER_BEAT, at } from "../../timing.ts";
import { ramp, secondsInShot, smooth, type ShotTime } from "./shotClock";

const T = YAS_MARINA_2021;
const LAP = T.lapLength;
const FROM = T.corners.t5Exit + 120;
// The whole lap, fixed, filling the panel: turned so the back straight runs left to right, the way the close-ups see
// the cars drive.
const FIT = fitMap(T, { x: PANEL.x, y: PANEL.y + 20, w: PANEL.w, h: PANEL.h - 40 }, -106, 0.05);
// Where the run ends: the finish line, and the push-in on it in the last bar.
const LINE = poseAt(T, 0);
const PUSH = 3.2;
const verS = (u: number) => FROM + (LAP - FROM) * (0.9 * u + 0.1 * smooth(u));
// HAM's gap, m: ~100 m when the map opens (so the two dots never merge), 150 m at the line (2.2 s at ~250 km/h)
const hamGap = (u: number) => 100 + 50 * smooth(u);

// The two dots: the livery's main colour (RB16B cover navy, W12 chassis black) with an accent ring (RB red, Petronas
// teal) — the cars, ART-8; the glow is paper light clearing the screentone.
const DOTS = {
  VER: { fill: "#2c3870", ring: "#d8202b" },
  HAM: { fill: "#18181b", ring: "#00a19b" },
} as const;

export const ToFinish: React.FC<{ st: ShotTime }> = ({ st }) => {
  useLettering();
  const { t, dur } = st;
  const u = Math.min(1, t / dur);
  const sV = verS(u);
  const sH = sV - hamGap(u);
  const push = smooth(ramp(t, secondsInShot(st, at(99)), dur));
  const view = mapView({
    centre: {
      x: FIT.centre.x + (LINE.x - FIT.centre.x) * push,
      y: FIT.centre.y + (LINE.y - FIT.centre.y) * push,
    },
    rotation: FIT.rotation,
    pxPerMetre: FIT.pxPerMetre * (1 + (PUSH - 1) * push * push),
    screen: {
      x: FIT.screen.x + (960 - FIT.screen.x) * push,
      y: FIT.screen.y + (540 - FIT.screen.y) * push,
    },
  });
  const k = view.pxPerMetre / FIT.pxPerMetre;
  const road = 22 * k;
  const trail = view.path(samplePath(T, FROM - 40, Math.min(sV, LAP - 0.5), 0, 8));
  const fin = {
    a: view.project(poseAt(T, 0, -T.width * 1.3)),
    b: view.project(poseAt(T, 0, T.width * 1.3)),
  };
  // the beat pulse: a flare on every beat that decays within it
  const beat = (t % SECONDS_PER_BEAT) / SECONDS_PER_BEAT;
  const pulse = Math.exp(-beat * 4);
  const vPos = view.project(poseAt(T, sV));
  const dots = [
    { tag: "HAM" as const, s: sH },
    { tag: "VER" as const, s: sV },
  ];
  return (
    <svg width={1920} height={1080}>
      <defs>
        <ToneDefs />
        <InkFilterDef />
        <clipPath id="tofin-panel">
          <rect x={PANEL.x} y={PANEL.y} width={PANEL.w} height={PANEL.h} />
        </clipPath>
      </defs>
      <rect width={1920} height={1080} fill={PAPER} />
      <g filter={inkFilter()}>
        <g clipPath="url(#tofin-panel)">
          <rect width={1920} height={1080} fill={tone("light")} />
          <path
            d={focusLines(vPos.x, vPos.y, 160 + 40 * pulse, 110, Math.floor(t * 8))}
            fill={INK}
            opacity={0.12 + 0.18 * push}
          />
          <TrackMap track={T} view={view} theme="paper" road={road} shadow />
          {/* the lap VER has run, inked solid */}
          <path
            d={trail}
            fill="none"
            stroke={INK}
            strokeWidth={road * 0.55}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <FinishLine a={fin.a} b={fin.b} width={20 * k} theme="paper" />
          {dots.map(({ tag, s }) => {
            const pose = poseAt(T, s);
            const p = view.project(pose);
            // a short comet tail behind the dot, along the track
            const tail = view.path(samplePath(T, Math.max(FROM - 40, s - 60), s, 0, 6));
            const r = 15 * Math.sqrt(k);
            const glow = r * (2.6 + 1.2 * pulse);
            const c = DOTS[tag];
            // tags beside the track, never on it: VER to the left of his direction of travel, HAM to the right (ART-14)
            // (the direction is taken over the next 120 m so the tags do not whip round in the hairpins, and they are
            // kept inside the panel)
            const ahead = view.project(poseAt(T, s + 120));
            const a = Math.atan2(ahead.y - p.y, ahead.x - p.x);
            const side = tag === "VER" ? 1 : -1;
            const lx = Math.min(PANEL.x + PANEL.w - 70, Math.max(PANEL.x + 70, p.x + Math.sin(a) * 78 * side));
            const ly = Math.min(PANEL.y + PANEL.h - 42, Math.max(PANEL.y + 42, p.y - Math.cos(a) * 78 * side));
            return (
              <g key={tag}>
                <path d={tail} fill="none" stroke={c.ring} strokeWidth={r * 0.9} strokeLinecap="round" opacity={0.75} />
                <circle cx={p.x} cy={p.y} r={glow} fill={PAPER} opacity={0.55 + 0.35 * pulse} />
                <circle cx={p.x} cy={p.y} r={glow * 0.62} fill={PAPER} />
                <circle cx={p.x} cy={p.y} r={r + 5} fill={c.ring} stroke={INK} strokeWidth={4} />
                <circle cx={p.x} cy={p.y} r={r * 0.62} fill={c.fill} />
                <g transform={`translate(${lx} ${ly})`}>
                  <rect x={-52} y={-26} width={104} height={52} fill={tag === "VER" ? INK : PAPER} stroke={INK} strokeWidth={5} />
                  <text y={14} textAnchor="middle" fontFamily={CAPTION_FONT} fontWeight={700} fontSize={38} fill={tag === "VER" ? PAPER : INK}>
                    {tag}
                  </text>
                </g>
              </g>
            );
          })}
        </g>
        <rect x={PANEL.x} y={PANEL.y} width={PANEL.w} height={PANEL.h} fill="none" stroke={INK} strokeWidth={10} />
      </g>
    </svg>
  );
};
