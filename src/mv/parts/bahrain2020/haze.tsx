// Heat haze over the wreck (shots 3.4, 3.5's fire panels, 3.6): everything in the hot zone above and around the fire
// is seen through rising hot air — a smooth refraction ripple (feTurbulence + feDisplacementMap, the noise scrolling
// upward), a slight softening and a warm tint — so no piece of the wreck (the torn-off rear, the cell, the people at
// it) sits crisp against a soft background (user review 2026-10-04). People in the zone get a lighter ripple (`calm`
// ellipses) so their silhouettes and GRO's helmet still read. Like the fire (ART-21) every size is fixed in screen
// pixels, and the air moves smoothly, never re-seeded per frame. Text goes outside, on top.
//
// How: the scene is drawn once, then laid over itself through soft masks — as it is, fully hazed inside the zone,
// lightly hazed inside the calm ellipses — so the strengths blend without seams. The hazed layers warp the scene's tone
// layer, not its dots, and screen it again afterwards (kit/screen-warp.tsx), so the dot screens never ripple into a
// moiré (review 2, #27).
import { useId } from "react";
import type { ScreenRect } from "../../../kit/fire";
import {
  FlatCopy,
  WarpSource,
  toneWarp,
  useFlatTone,
  warpFilterRegion,
} from "../../../kit/screen-warp";

const FPS = 60;
const RISE_PX_S = 80; // how fast the ripples climb, px/s
const FEATHER = 70; // px: the zone's soft edge
const FULL = { disp: 16, blur: 1.3 };
const CALM = { disp: 5, blur: 0.4 };
const NOISE = "0.007 0.026"; // wide, flat ripples, like air shimmering over a fire
// the warm cast of the fire's light on everything seen through the hot air
const WARM = "1.04 0 0 0 0.03  0 0.98 0 0 0.008  0 0 0.86 0 0  0 0 0 1 0";

export type Ellipse = { cx: number; cy: number; rx: number; ry: number };
type Strength = { disp: number; blur: number };
// How the haze fades out from the fire with `falloff` (fraction of the ellipse's radius → strength): full over the
// fire, then a long smooth slope with no edge anywhere (user review 2026-10-04: one focus round the fire).
const FALLOFF_STOPS: readonly [number, number][] = [
  [0, 1],
  [0.3, 1],
  [0.45, 0.93],
  [0.6, 0.75],
  [0.75, 0.5],
  [0.88, 0.24],
  [1, 0],
];
const FRAME: ScreenRect = { x: 0, y: 0, w: 1920, h: 1080 };

export const Haze: React.FC<{
  frame: number;
  // the hot zone, screen px (its edges are feathered)
  zone: ScreenRect;
  // instead of the zone: an ellipse centred on the fire, the haze fading smoothly toward its rim (no edge)
  falloff?: Ellipse;
  // the ripple for the people in `calm` (default: the light CALM ripple)
  calmHaze?: Strength;
  // people inside the zone: a lighter ripple here
  calm?: readonly Ellipse[];
  // the frame or panel the picture is in: filters and masks are cut to it
  clip?: ScreenRect;
  children: React.ReactNode;
}> = ({
  frame,
  zone,
  falloff,
  calmHaze = CALM,
  calm = [],
  clip = FRAME,
  children,
}) => {
  const id = `hz${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  // inside another warp's flat copy: warp flat, that warp screens once
  const rescreen = !useFlatTone();
  const scroll = -(frame / FPS) * RISE_PX_S;
  const M = 40;
  const region = {
    x: clip.x - M,
    y: clip.y - M,
    width: clip.w + 2 * M,
    height: clip.h + 2 * M,
  };
  // the region in the filtered group's space (it is shifted by the scroll), and the filter's room for the warp source
  const area = { ...region, y: region.y - scroll };
  const room = warpFilterRegion(area, rescreen);
  const filter = (name: string, k: Strength) => (
    <filter
      id={`${id}-${name}`}
      {...room}
      filterUnits="userSpaceOnUse"
      colorInterpolationFilters="sRGB"
    >
      <feTurbulence
        {...area}
        type="fractalNoise"
        baseFrequency={NOISE}
        numOctaves={2}
        seed={11}
        result="n"
      />
      {/* an opaque map, so the displacement reads the noise's colour straight */}
      <feColorMatrix
        {...area}
        in="n"
        type="matrix"
        values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0 1"
        result="map"
      />
      {toneWarp({
        name: "b",
        map: "map",
        disp: k.disp,
        blur: k.blur,
        area,
        rescreen,
      })}
      <feColorMatrix {...area} in="b" type="matrix" values={WARM} />
    </filter>
  );
  const zoneRect = (
    <rect x={zone.x} y={zone.y} width={zone.w} height={zone.h} />
  );
  const calms = calm.map((e, i) => <ellipse key={i} {...e} />);
  const hazed = (name: string) => (
    <g mask={`url(#${id}-m${name})`}>
      <g transform={`translate(0 ${scroll})`} filter={`url(#${id}-${name})`}>
        <g transform={`translate(0 ${-scroll})`}>
          <WarpSource
            id={`${id}-${name}-src`}
            flat={`${id}-flat`}
            normal={`${id}-scene`}
            region={region}
            rescreen={rescreen}
          />
        </g>
      </g>
    </g>
  );
  const mask = (name: string, body: React.ReactNode) => (
    <mask id={`${id}-m${name}`} maskUnits="userSpaceOnUse" {...region}>
      {body}
    </mask>
  );
  return (
    <g>
      <defs>
        {/* the scene with its dot screens flat: what the hazed layers warp */}
        <FlatCopy id={`${id}-flat`}>{children}</FlatCopy>
        {filter("full", FULL)}
        {filter("calm", calmHaze)}
        {falloff ? (
          <radialGradient id={`${id}-fall`}>
            {FALLOFF_STOPS.map(([o, a]) => (
              <stop key={o} offset={o} stopColor="#fff" stopOpacity={a} />
            ))}
          </radialGradient>
        ) : null}
        <filter
          id={`${id}-feather`}
          x={region.x - FEATHER * 3}
          y={region.y - FEATHER * 3}
          width={region.width + FEATHER * 6}
          height={region.height + FEATHER * 6}
          filterUnits="userSpaceOnUse"
        >
          <feGaussianBlur stdDeviation={FEATHER / 2} />
        </filter>
        {/* the zone (feathered), or the falloff round the fire */}
        {mask(
          "full",
          falloff ? (
            <ellipse {...falloff} fill={`url(#${id}-fall)`} />
          ) : (
            <g fill="#fff" filter={`url(#${id}-feather)`}>
              {zoneRect}
            </g>
          ),
        )}
        {/* the calm ellipses (feathered), used inside the zone only: the two masks are nested, so their product */}
        {calms.length
          ? mask(
              "calm",
              <g fill="#fff" filter={`url(#${id}-feather)`}>
                {calms}
              </g>,
            )
          : null}
      </defs>
      {/* layered, each over the last: the scene as it is, fully hazed in the zone, lightly hazed in the calm
          ellipses; the scene is opaque, so where a layer's mask is 1 it hides the ones under it (no dark seam where
          the masks blend, as complementary masks over the dark page would leave) */}
      <g id={`${id}-scene`}>{children}</g>
      {hazed("full")}
      {calms.length ? <g mask={`url(#${id}-mfull)`}>{hazed("calm")}</g> : null}
    </g>
  );
};
