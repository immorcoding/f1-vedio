// PROTOTYPE — throwaway helpers for the hand-drawn look prototypes. Not production code.
import { Easing, interpolate, useCurrentFrame } from "remotion";

export const PAPER = "#f4efe4";
export const INK = "#1d1b19";
export const F1_RED = "#e10600";

export const ramp = (frame: number, start: number, end: number, easing = Easing.inOut(Easing.cubic)) =>
  interpolate(frame, [start, end], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing });

// Line boil: the displacement noise gets a new seed every `every` frames, so lines jitter like redrawn cels.
export const BoilFilter: React.FC<{ id: string; every: number; scale: number; freq?: number }> = ({ id, every, scale, freq = 0.025 }) => {
  const frame = useCurrentFrame();
  const seed = Math.floor(frame / every);
  return (
    <svg width={0} height={0} style={{ position: "absolute" }}>
      <defs>
        <filter id={id} x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency={freq} numOctaves={2} seed={seed} result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale={scale} xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
    </svg>
  );
};

// Static paper grain laid over the whole frame.
export const PaperGrain: React.FC<{ opacity?: number }> = ({ opacity = 0.14 }) => (
  <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, mixBlendMode: "multiply", opacity }}>
    <filter id="paper-grain">
      <feTurbulence type="fractalNoise" baseFrequency={0.9} numOctaves={3} seed={7} />
      <feColorMatrix type="saturate" values="0" />
    </filter>
    <rect width="100%" height="100%" filter="url(#paper-grain)" />
  </svg>
);

// A path that draws itself on as `progress` goes 0 → 1.
export const DrawPath: React.FC<{
  d: string;
  progress: number;
  stroke?: string;
  width?: number;
  opacity?: number;
  transform?: string;
}> = ({ d, progress, stroke = INK, width = 3, opacity = 1, transform }) =>
  progress <= 0 ? null : (
    <path
      d={d}
      pathLength={1}
      fill="none"
      stroke={stroke}
      strokeWidth={width}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeDasharray="1.001 1"
      strokeDashoffset={1 - progress}
      opacity={opacity}
      transform={transform}
    />
  );

export const circlePath = (cx: number, cy: number, r: number) =>
  `M ${cx - r} ${cy} a ${r} ${r} 0 1 0 ${2 * r} 0 a ${r} ${r} 0 1 0 ${-2 * r} 0`;

// Progress of part i of n when n parts are drawn one after another (with overlap) across [start, end].
export const staggered = (frame: number, i: number, n: number, start: number, end: number) => {
  const slot = (end - start) / n;
  return ramp(frame, start + i * slot, start + (i + 1.6) * slot);
};

// Side profile of an F1 car in a 1000×300 box, nose pointing right.
export const CAR_PARTS = [
  "M 105 205 L 118 168 L 250 150 C 300 140 340 112 380 100 L 430 98 L 445 128 L 520 130 L 600 148 L 780 172 L 905 196 L 915 208 L 760 214 L 260 214 Z",
  "M 120 222 L 880 222",
  "M 250 150 C 300 128 350 104 395 96",
  "M 330 190 C 360 165 420 160 470 162 L 600 170",
  "M 440 126 C 470 92 520 96 540 128",
  circlePath(470, 116, 16),
  "M 60 62 L 175 62 M 60 82 L 175 82 M 70 62 L 92 200 M 165 62 L 150 160",
  "M 855 230 L 975 230 L 975 205 M 870 238 L 980 238",
  circlePath(205, 205, 52),
  circlePath(205, 205, 20),
  circlePath(790, 208, 46),
  circlePath(790, 208, 17),
];
