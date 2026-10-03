// PROTOTYPE — throwaway building blocks for the hand-drawn race-moment prototypes. Not production code.
import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont as loadCaveat } from "@remotion/google-fonts/Caveat";
import { loadFont as loadKuaiLe } from "@remotion/google-fonts/ZCOOLKuaiLe";
import { BoilFilter, CAR_PARTS, DrawPath, F1_RED, INK, PAPER, PaperGrain, ramp } from "./sketch-kit";

export const { fontFamily: hand } = loadCaveat("normal", { weights: ["700"], subsets: ["latin"] });
export const { fontFamily: handZh } = loadKuaiLe("normal", {
  weights: ["400"],
  subsets: ["chinese-simplified"],
  ignoreTooManyRequestsWarning: true,
});

export type Team = { body: string; accent: string; helmet: string };

export const kf = (frame: number, input: number[], output: number[], easing?: (t: number) => number) =>
  interpolate(frame, input, output, { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing });

// Point and heading at fraction t along an SVG path, measured by the browser.
const pathCache = new Map<string, SVGPathElement>();
export const pointAt = (d: string, t: number) => {
  let p = pathCache.get(d);
  if (!p) {
    p = document.createElementNS("http://www.w3.org/2000/svg", "path");
    p.setAttribute("d", d);
    pathCache.set(d, p);
  }
  const len = p.getTotalLength();
  const at = Math.min(Math.max(t, 0), 1) * len;
  const a = p.getPointAtLength(at);
  const ahead = p.getPointAtLength(Math.min(at + 2, len));
  const behind = p.getPointAtLength(Math.max(at - 2, 0));
  return { x: a.x, y: a.y, angle: (Math.atan2(ahead.y - behind.y, ahead.x - behind.x) * 180) / Math.PI };
};

// Paper page with line boil on everything drawn inside it.
export const Page: React.FC<{ children: React.ReactNode; boilId: string; tint?: string }> = ({ children, boilId, tint }) => (
  <AbsoluteFill style={{ backgroundColor: PAPER }}>
    <BoilFilter id={boilId} every={5} scale={3} />
    <div style={{ position: "absolute", inset: 0, filter: `url(#${boilId})` }}>{children}</div>
    {tint ? <AbsoluteFill style={{ backgroundColor: tint, mixBlendMode: "multiply" }} /> : null}
    <PaperGrain />
  </AbsoluteFill>
);

export const TitleCard: React.FC<{ year: string; race: string; zh: string; sub: string }> = ({ year, race, zh, sub }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const stamp = spring({ frame, fps, config: { damping: 10, stiffness: 150 } });
  return (
    <Page boilId="boil-title">
      <div style={{ position: "absolute", left: 200, top: 220, fontFamily: hand, color: INK }}>
        <div style={{ fontSize: 220, color: F1_RED, transform: `scale(${1.5 - 0.5 * stamp}) rotate(-4deg)`, transformOrigin: "left center", opacity: Math.min(1, stamp * 2) }}>
          {year}
        </div>
        <div style={{ fontSize: 90, opacity: ramp(frame, 15, 35) }}>{race}</div>
        <div style={{ fontFamily: handZh, fontSize: 96, marginTop: 30, clipPath: `inset(0 ${100 - ramp(frame, 30, 70) * 100}% 0 0)` }}>{zh}</div>
        <div style={{ fontFamily: handZh, fontSize: 48, marginTop: 16, opacity: ramp(frame, 65, 85) * 0.75 }}>{sub}</div>
      </div>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <DrawPath d="M 200 870 C 600 850 1000 880 1500 855" progress={ramp(frame, 40, 80)} stroke={F1_RED} width={8} />
      </svg>
    </Page>
  );
};

export const OutcomeCard: React.FC<{ head: string; body: string; foot?: string; color?: string }> = ({ head, body, foot, color = F1_RED }) => {
  const frame = useCurrentFrame();
  return (
    <Page boilId="boil-out">
      <div style={{ position: "absolute", width: 1920, top: 330, textAlign: "center", color: INK }}>
        <div style={{ fontFamily: hand, fontSize: 130, color, opacity: ramp(frame, 0, 20), transform: `translateY(${(1 - ramp(frame, 0, 20)) * 30}px)` }}>{head}</div>
        <div style={{ fontFamily: handZh, fontSize: 72, marginTop: 30, opacity: ramp(frame, 20, 40) }}>{body}</div>
        {foot ? <div style={{ fontFamily: handZh, fontSize: 44, marginTop: 30, opacity: ramp(frame, 40, 60) * 0.7 }}>{foot}</div> : null}
      </div>
    </Page>
  );
};

// A stretch of circuit seen from above: inked edges with the paper showing through as tarmac.
export const Road: React.FC<{ d: string; progress: number; width?: number; kerbs?: string[] }> = ({ d, progress, width = 110, kerbs = [] }) => (
  <g>
    <DrawPath d={d} progress={progress} stroke={INK} width={width + 10} />
    <DrawPath d={d} progress={progress} stroke={PAPER} width={width} />
    {kerbs.map((k) => (
      <g key={k} opacity={ramp(progress, 0.8, 1, Easing.linear)}>
        <path d={k} fill="none" stroke="#fff" strokeWidth={12} />
        <path d={k} fill="none" stroke={F1_RED} strokeWidth={12} strokeDasharray="14 14" />
      </g>
    ))}
  </g>
);

// Dashed racing line, revealed by fading in.
export const RacingLine: React.FC<{ d: string; opacity: number; color?: string }> = ({ d, opacity, color = INK }) => (
  <path d={d} fill="none" stroke={color} strokeWidth={3} strokeDasharray="10 12" strokeLinecap="round" opacity={opacity * 0.6} />
);

// Top-down car doodle, nose along +x, positioned on a racing line.
export const TopCar: React.FC<{ team: Team; line: string; t: number; label?: string; scale?: number; labelBelow?: boolean }> = ({ team, line, t, label, scale = 1, labelBelow = false }) => {
  const { x, y, angle } = pointAt(line, t);
  return (
    <g>
      <g transform={`translate(${x} ${y}) rotate(${angle}) scale(${scale})`}>
        <rect x={-38} y={-17} width={7} height={34} rx={2} fill={INK} />
        <rect x={-28} y={-21} width={15} height={9} rx={3} fill={INK} />
        <rect x={-28} y={12} width={15} height={9} rx={3} fill={INK} />
        <rect x={14} y={-19} width={13} height={8} rx={3} fill={INK} />
        <rect x={14} y={11} width={13} height={8} rx={3} fill={INK} />
        <path d="M -32 -8 L 8 -8 L 36 -3 L 36 3 L 8 8 L -32 8 Z" fill={team.body} stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
        <path d="M -28 0 L 34 0" stroke={team.accent} strokeWidth={4} />
        <rect x={34} y={-16} width={6} height={32} rx={2} fill={team.accent} stroke={INK} strokeWidth={2} />
        <circle cx={-6} cy={0} r={5.5} fill={team.helmet} stroke={INK} strokeWidth={2} />
      </g>
      {label ? (
        <text x={x} y={labelBelow ? y + 62 * scale : y - 38 * scale} textAnchor="middle" fontFamily={hand} fontSize={40} fill={INK}>
          {label}
        </text>
      ) : null}
    </g>
  );
};

// Side profile car in team colours, for broadcast-style close-ups. (x, ground) is the car's centre on the road.
export const SideCar: React.FC<{ team: Team; x: number; ground: number; scale?: number; halo?: boolean; spin?: number; tilt?: number }> = ({
  team,
  x,
  ground,
  scale = 1,
  halo = true,
  spin = 0,
  tilt = 0,
}) => {
  const wheel = (cx: number, cy: number, r: number) => (
    <g transform={`rotate(${spin} ${cx} ${cy})`}>
      <circle cx={cx} cy={cy} r={r} fill="#2a2826" stroke={INK} strokeWidth={3.5} />
      <circle cx={cx} cy={cy} r={r * 0.4} fill="none" stroke="#8d8a85" strokeWidth={3} />
      <path d={`M ${cx - r * 0.75} ${cy} L ${cx + r * 0.75} ${cy} M ${cx} ${cy - r * 0.75} L ${cx} ${cy + r * 0.75}`} stroke="#8d8a85" strokeWidth={3} />
    </g>
  );
  return (
    <g transform={`translate(${x - 500 * scale} ${ground - 257 * scale}) scale(${scale}) rotate(${tilt} 500 200)`}>
      <path d={CAR_PARTS[0]} fill={team.body} stroke={INK} strokeWidth={3.5} strokeLinejoin="round" />
      <path d={CAR_PARTS[3]} fill="none" stroke={team.accent} strokeWidth={12} strokeLinecap="round" />
      {[1, 2, 6, 7].map((i) => (
        <path key={i} d={CAR_PARTS[i]} fill="none" stroke={INK} strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" />
      ))}
      <path d="M 60 62 L 175 62 L 175 82 L 60 82 Z" fill={team.accent} stroke={INK} strokeWidth={3} />
      <circle cx={470} cy={116} r={16} fill={team.helmet} stroke={INK} strokeWidth={3.5} />
      {halo ? <path d={CAR_PARTS[4]} fill="none" stroke={INK} strokeWidth={6} strokeLinecap="round" /> : null}
      {wheel(205, 205, 52)}
      {wheel(790, 208, 46)}
    </g>
  );
};

// Tracking shot backdrop: two road edges, a kerb strip and speed lines streaming left at `speed` px/frame.
export const TrackingBackdrop: React.FC<{ speed: number }> = ({ speed }) => {
  const frame = useCurrentFrame();
  const scroll = (offset: number, period: number) => (((offset - frame * speed) % period) + period) % period;
  return (
    <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
      <path d="M 0 520 L 1920 520" stroke={INK} strokeWidth={3} />
      <path d="M 0 900 L 1920 900" stroke={INK} strokeWidth={4} />
      {Array.from({ length: 14 }, (_, i) => {
        const x = scroll(i * 160, 2240) - 160;
        return <rect key={i} x={x} y={908} width={80} height={22} fill={i % 2 ? F1_RED : "#fff"} stroke={INK} strokeWidth={2} />;
      })}
      {Array.from({ length: 22 }, (_, i) => {
        const y = 140 + ((i * 97) % 360);
        const len = 120 + ((i * 53) % 220);
        const x = scroll(i * 311, 2400) - 240;
        return <path key={`s${i}`} d={`M ${x} ${y} L ${x + len} ${y}`} stroke={INK} strokeWidth={2.5} opacity={0.45} strokeLinecap="round" />;
      })}
      {Array.from({ length: 10 }, (_, i) => {
        const x = scroll(i * 260, 2600) - 300;
        return <path key={`g${i}`} d={`M ${x} ${960 + (i % 3) * 30} L ${x + 180} ${960 + (i % 3) * 30}`} stroke={INK} strokeWidth={2} opacity={0.35} />;
      })}
    </svg>
  );
};

export const Note: React.FC<{ x: number; y: number; children: React.ReactNode; opacity: number; size?: number; color?: string; zh?: boolean }> = ({
  x,
  y,
  children,
  opacity,
  size = 52,
  color = INK,
  zh = false,
}) => (
  <div style={{ position: "absolute", left: x, top: y, fontFamily: zh ? handZh : hand, fontSize: size, color, opacity, whiteSpace: "nowrap" }}>{children}</div>
);
