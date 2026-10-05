// Warping a screentoned picture without warping its dots (heat haze, ART-22). A dot screen pushed through a smooth
// displacement turns into a moiré: the regular 45° dots bunch up and spread out in waves (review 2, #27). So the warp
// works on the tone layer under the dots instead, and the dots are put back on afterwards, upright and in place:
//
// 1. The picture is drawn twice: as it is, and as a flat copy (`FlatCopy`) whose dot screens are the flat grey or
//    shaded colour they average to (tone.tsx, `FLAT_TONE_CLASS`). The two differ only where there is a dot screen.
// 2. The filter (`toneWarp`) displaces and softens the flat copy (lines, fire and the tone layer bend and blur).
// 3. Where the picture had a dot screen, it screens the warped tone again: the colour under the dots comes from the
//    picture's gaps (a small dilate), the ink coverage from how much darker the flat copy is, and a threshold map of
//    the standard 7 px 45° screen, in the picture's own user space, so the new dots sit exactly where the
//    environment's dots are and the haze's soft edge blends one screen into the same screen. Everywhere else (fire,
//    flat colour, lines on paper) the warped flat copy is used as it is.
//
// The filter reads the picture and the threshold map from its own source: `WarpSource` draws the flat copy in place,
// the picture one shift to the right and the map two shifts to the right, and the filter offsets them back. (An
// feImage of an element would be simpler, but Chrome draws nothing for it under a mirrored transform, and the wreck
// shots are mirrored.) All sizes are px in the picture's user space, as everywhere in the haze.
import { createContext, useContext } from "react";
import { INK } from "./colors";
import { FLAT_TONE_CLASS, STANDARD_GAP } from "./tone";

export type Region = { x: number; y: number; width: number; height: number };

// Inside a flat copy, nested warps (the night's shimmer inside the haze) stay flat too: the outer warp screens once.
const FlatTone = createContext(false);
export const useFlatTone = () => useContext(FlatTone);

// The picture with its dot screens flat, to be <use>d by id (put it in <defs>).
export const FlatCopy: React.FC<{ id: string; children: React.ReactNode }> = ({
  id,
  children,
}) => (
  <FlatTone.Provider value>
    <g id={id} className={FLAT_TONE_CLASS}>
      {children}
    </g>
  </FlatTone.Provider>
);

// How far right of the warped region the picture and the threshold map are drawn: past the region and past anything
// the displacement, dilate and blurs can reach.
const PAD = 80;
const shiftOf = (r: Region) => Math.ceil(r.width + PAD);
// The filter region that holds the warp's source: the region, and with `rescreen` the two copies to its right.
export const warpFilterRegion = (r: Region, rescreen: boolean): Region =>
  rescreen ? { ...r, width: r.width + 2 * shiftOf(r) } : r;

// The standard screen (tone.tsx: 7 px, 45°, dot in the middle of the cell) as a threshold map: each pixel's grey is
// the ink coverage at which a dot first reaches it (0 at a dot's centre, rising to TMAX at the corners between dots).
const GAP = STANDARD_GAP;
const TMAX = 0.95;
const coverAt = (d: number) => {
  const h = GAP / 2;
  const a =
    d <= h
      ? Math.PI * d * d
      : d * d * (Math.PI - 4 * Math.acos(h / d)) +
        4 * h * Math.sqrt(d * d - h * h);
  return Math.min(1, a / (GAP * GAP));
};
const D_MAX = (GAP / 2) * Math.SQRT2;
const T_STOPS = Array.from({ length: 25 }, (_, i) => {
  const s = i / 24;
  const v = Math.round(255 * TMAX * coverAt(s * D_MAX));
  const h = v.toString(16).padStart(2, "0");
  return { offset: s, color: `#${h}${h}${h}` };
});

// What the filtered group draws: the flat copy `flat` in place; with `rescreen`, the picture `normal` and the threshold
// map to its right (both element ids; `id` names the map's paint). `region` is in the same user space as the copies.
export const WarpSource: React.FC<{
  id: string;
  flat: string;
  normal: string;
  region: Region;
  rescreen: boolean;
}> = ({ id, flat, normal, region, rescreen }) => {
  const s = shiftOf(region);
  // each copy cut to the region, so nothing drawn outside it spills into the next
  const cut = `url(#${id}-c)`;
  return (
    <>
      <defs>
        <clipPath id={`${id}-c`}>
          <rect {...region} />
        </clipPath>
      </defs>
      <g clipPath={cut}>
        <use href={`#${flat}`} />
      </g>
      {rescreen ? (
        <>
          <defs>
            <radialGradient
              id={`${id}-g`}
              cx={GAP / 2}
              cy={GAP / 2}
              r={D_MAX}
              gradientUnits="userSpaceOnUse"
            >
              {T_STOPS.map((t) => (
                <stop key={t.offset} offset={t.offset} stopColor={t.color} />
              ))}
            </radialGradient>
            {/* the screen's lattice where the picture's is, though the map is drawn two shifts to the right */}
            <pattern
              id={`${id}-p`}
              width={GAP}
              height={GAP}
              patternUnits="userSpaceOnUse"
              patternTransform={`translate(${2 * s} 0) rotate(45)`}
            >
              <rect width={GAP} height={GAP} fill={`url(#${id}-g)`} />
            </pattern>
          </defs>
          <g transform={`translate(${s} 0)`}>
            <g clipPath={cut}>
              <use href={`#${normal}`} />
            </g>
          </g>
          <rect
            x={region.x + 2 * s}
            y={region.y}
            width={region.width}
            height={region.height}
            fill={`url(#${id}-p)`}
          />
        </>
      ) : null}
    </>
  );
};

// how sharp the new dots' edges are (alpha per unit of luminance over the threshold)
const EDGE = 10;
// ink, inverted (the fallback where no dot is in reach)
const INK_INVERTED = `#${INK.slice(1)
  .match(/../g)!
  .map((h) => (255 - parseInt(h, 16)).toString(16).padStart(2, "0"))
  .join("")}`;
const lumRow = "0.299 0.587 0.114 0 0";
const invRow = "-0.299 -0.587 -0.114 0 1";
const OPAQUE = "0 0 0 0 1";

// The filter primitives: displace (and soften) the flat copy by the map in `map`; with `rescreen`, screen it again
// where the picture has dots. `area` is the warped region in the filter's user space (the region WarpSource was given,
// moved as the filtered group is). The result is named `name`. `cif` is the colour space the displacement reads its
// map in (kept as each warp had it, so the ripples do not change).
export const toneWarp = (o: {
  name: string;
  map: string;
  disp: number;
  blur: number;
  area: Region;
  rescreen: boolean;
  cif?: "sRGB" | "linearRGB";
}) => {
  const n = (s: string) => `${o.name}-${s}`;
  const sub = o.area;
  const displace = (input: string, result: string) => (
    <feDisplacementMap
      key={result}
      {...sub}
      in={input}
      in2={o.map}
      scale={o.disp}
      xChannelSelector="R"
      yChannelSelector="G"
      colorInterpolationFilters={o.cif}
      result={result}
    />
  );
  const soften = (input: string, result: string) =>
    o.blur > 0 ? (
      <feGaussianBlur
        key={result}
        {...sub}
        in={input}
        stdDeviation={o.blur}
        result={result}
      />
    ) : (
      <feOffset key={result} {...sub} in={input} result={result} />
    );
  const cm = (input: string, values: string, result: string) => (
    <feColorMatrix
      key={result}
      {...sub}
      in={input}
      type="matrix"
      values={values}
      colorInterpolationFilters="sRGB"
      result={result}
    />
  );
  const ar = (
    i1: string,
    i2: string,
    k: [number, number, number, number],
    result: string,
  ) => (
    <feComposite
      key={result}
      {...sub}
      in={i1}
      in2={i2}
      operator="arithmetic"
      k1={k[0]}
      k2={k[1]}
      k3={k[2]}
      k4={k[3]}
      colorInterpolationFilters="sRGB"
      result={result}
    />
  );
  const comp = (i1: string, i2: string, op: "in" | "over", result: string) => (
    <feComposite
      key={result}
      {...sub}
      in={i1}
      in2={i2}
      operator={op}
      colorInterpolationFilters="sRGB"
      result={result}
    />
  );
  const back = (k: number, result: string) => (
    <feOffset
      key={result}
      {...sub}
      in="SourceGraphic"
      dx={-k * shiftOf(o.area)}
      result={result}
    />
  );
  if (!o.rescreen) {
    return [displace("SourceGraphic", n("d0")), soften(n("d0"), o.name)];
  }
  return [
    // the flat copy, cut to the region (the picture and the map sit to its right)
    <feOffset key={n("f")} {...sub} in="SourceGraphic" result={n("f")} />,
    displace(n("f"), n("d0")),
    soften(n("d0"), n("fd")),
    // the picture as it is, in place
    back(1, n("n")),
    // where it has dots: its gaps are lighter than the flat copy (N − F, clamped), spread over a dot's cell
    cm(n("f"), `-1 0 0 0 1  0 -1 0 0 1  0 0 -1 0 1  ${OPAQUE}`, n("fi")),
    ar(n("n"), n("fi"), [0, 1, 1, -1], n("nd")),
    <feGaussianBlur
      key={n("ndb")}
      {...sub}
      in={n("nd")}
      stdDeviation={2.5}
      result={n("ndb")}
    />,
    cm(n("ndb"), "0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  15 15 15 0 -0.3", n("tm0")),
    displace(n("tm0"), n("tm1")),
    soften(n("tm1"), n("tm")),
    // the screen's own pixels: its gaps (lighter than the flat copy) and its dots (darker), each pixel on its own
    cm(n("n"), `-1 0 0 0 1  0 -1 0 0 1  0 0 -1 0 1  ${OPAQUE}`, n("ni")),
    ar(n("f"), n("ni"), [0, 1, 1, -1], n("dn")),
    cm(n("nd"), "0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  30 30 30 0 -0.1", n("gapA")),
    cm(n("dn"), "0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  30 30 30 0 -0.1", n("dotA")),
    // the colour under the dots: the lightest gap in reach (the flat copy where there is none)
    comp(n("n"), n("gapA"), "in", n("ng")),
    <feMorphology
      key={n("b0")}
      {...sub}
      in={n("ng")}
      operator="dilate"
      radius={3}
      result={n("b0")}
    />,
    comp(n("b0"), n("f"), "over", n("b1")),
    displace(n("b1"), n("b2")),
    soften(n("b2"), n("base")),
    // and the colour of the dots themselves: the darkest dot in reach (ink, or ink lifted by firelight; ink where there
    // is none), found as the lightest of the inverted dots
    comp(n("ni"), n("dotA"), "in", n("nk")),
    <feMorphology
      key={n("k0")}
      {...sub}
      in={n("nk")}
      operator="dilate"
      radius={4}
      result={n("k0")}
    />,
    <feFlood
      key={n("kf")}
      {...sub}
      floodColor={INK_INVERTED}
      result={n("kf")}
    />,
    comp(n("k0"), n("kf"), "over", n("k1")),
    cm(n("k1"), `-1 0 0 0 1  0 -1 0 0 1  0 0 -1 0 1  ${OPAQUE}`, n("k2")),
    displace(n("k2"), n("k3")),
    soften(n("k3"), n("ink")),
    // where the flat copy is darker on average than the dots it stands for (screens of one lattice laid over each other
    // darken once, their flat greys twice), lift it by the difference, averaged over a dot's cell; lines are the same
    // in both and cancel. Kept as D = 0.5 − (Lpicture − Lflat)/2, warped with the rest.
    cm(n("n"), `${invRow}  ${invRow}  ${invRow}  ${OPAQUE}`, n("lni")),
    cm(n("f"), `${lumRow}  ${lumRow}  ${lumRow}  ${OPAQUE}`, n("lf0")),
    ar(n("lni"), n("lf0"), [0, 0.5, 0.5, 0], n("dl0")),
    <feGaussianBlur
      key={n("dl1")}
      {...sub}
      in={n("dl0")}
      stdDeviation={3}
      result={n("dl1")}
    />,
    displace(n("dl1"), n("dl")),
    // ink where the coverage beats the threshold T:
    // E = Lbase·(1 − T) − Lflat + Link·T  (> 0 ⇔ coverage > T: the flat grey is base and ink mixed), alpha = EDGE·E + 0.5
    cm(n("base"), `${lumRow}  ${lumRow}  ${lumRow}  ${OPAQUE}`, n("lb")),
    cm(n("fd"), `${invRow}  ${invRow}  ${invRow}  ${OPAQUE}`, n("lfi")),
    back(2, n("t")),
    cm(n("t"), `-1 0 0 0 1  -1 0 0 0 1  -1 0 0 0 1  ${OPAQUE}`, n("ti")),
    ar(n("lb"), n("ti"), [1, 0, 0, 0], n("p")),
    ar(n("p"), n("lfi"), [0, 0.5, 0.5, 0], n("y0")),
    ar(n("y0"), n("dl"), [0, 1, 1, -0.5], n("y1")),
    cm(n("ink"), `${lumRow}  ${lumRow}  ${lumRow}  ${OPAQUE}`, n("lk")),
    ar(n("lk"), n("t"), [1, 0, 0, 0], n("q")),
    ar(n("y1"), n("q"), [0, 1, 0.5, 0], n("y2")),
    cm(
      n("y2"),
      `0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  ${2 * EDGE} 0 0 0 ${0.5 - EDGE}`,
      n("ia"),
    ),
    comp(n("ink"), n("ia"), "in", n("inka0")),
    // the new dots a little soft, as everything seen through the hot air (they do not move, so this is no moiré)
    <feGaussianBlur
      key={n("inka")}
      {...sub}
      in={n("inka0")}
      stdDeviation={0.4 * o.blur}
      result={n("inka")}
    />,
    comp(n("inka"), n("base"), "over", n("rs")),
    // the new screen where there were dots, the warped flat copy elsewhere, cut to the warped picture
    comp(n("rs"), n("tm"), "in", n("rst")),
    comp(n("rst"), n("fd"), "over", n("o1")),
    comp(n("o1"), n("fd"), "in", o.name),
  ];
};
