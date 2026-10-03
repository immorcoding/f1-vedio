// Ink: the black line work of the manga page.
import { INK } from "./colors";

// A single inked stroke with round ends. Fill paths with plain <path> instead.
export const Ink: React.FC<{
  d: string;
  w?: number;
  c?: string;
  o?: number;
  transform?: string;
}> = ({ d, w = 2.2, c = INK, o = 1, transform }) => (
  <path
    d={d}
    fill="none"
    stroke={c}
    strokeWidth={w}
    strokeLinecap="round"
    strokeLinejoin="round"
    opacity={o}
    transform={transform}
  />
);

// Hand-inked wobble: displaces everything drawn inside `filter={inkFilter()}` by a little fixed noise, so ruler-straight
// SVG lines read as pen lines. Put <InkFilterDef /> in the <defs> once per SVG.
export const InkFilterDef: React.FC<{
  id?: string;
  seed?: number;
  scale?: number;
}> = ({ id = "ink", seed = 8, scale = 1.8 }) => (
  <filter id={id} x="-3%" y="-3%" width="106%" height="106%">
    <feTurbulence
      type="fractalNoise"
      baseFrequency={0.05}
      numOctaves={2}
      seed={seed}
      result="n"
    />
    <feDisplacementMap
      in="SourceGraphic"
      in2="n"
      scale={scale}
      xChannelSelector="R"
      yChannelSelector="G"
    />
  </filter>
);

export const inkFilter = (id = "ink") => `url(#${id})`;
