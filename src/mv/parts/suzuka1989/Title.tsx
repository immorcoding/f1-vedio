// Shot 1.1 (bars 9–10): title card. The figure-eight of Suzuka is inked onto the page along the race direction (the
// back straight bridging the lap after Degner), "1989 · 铃鹿" is brushed in, and on the last beats the chicane after
// 130R — where the next shots happen — is ringed and blown up in a round callout under the title: the right-left
// flick of the Casio Triangle with the escape road running straight on between its bollards, turned the way 1.3 sees
// it (racing left to right). Clean lines only: a thin ribbon on the map so the chicane does not clot into a blob.
import { Easing } from "remotion";
import { INK, PAPER } from "../../../kit/colors";
import { InkFilterDef, inkFilter } from "../../../kit/ink";
import { BRUSH_FONT } from "../../../kit/lettering";
import { ToneDefs, tone } from "../../../kit/tone";
import {
  fitMap,
  mapView,
  polylinePoints,
  poseAt,
  samplePath,
  SUZUKA_1989,
  TrackMap,
  widen,
} from "../../../tracks";
import { ramp, shotById, type PictureProps } from "./common";

const T = SUZUKA_1989;
const C = T.corners.chicane;
const VIEW = fitMap(T, { x: 760, y: 120, w: 1100, h: 860 }, 0);
const ESCAPE = polylinePoints(T.escapeRoads?.[0]?.path ?? []);

// The callout: a circle under the title, the chicane at 2.4 px/m, turned so the approach runs left to right.
const BUBBLE = { x: 500, y: 866, r: 176 };
const ZOOM = mapView({
  centre: poseAt(T, C + 30, 0),
  rotation: -poseAt(T, C - 30).heading,
  pxPerMetre: 2.8,
  screen: { x: BUBBLE.x - 10, y: BUBBLE.y + 28 },
});

// Bollards across the escape road: a post either side of the lane, twice down the road.
const bollardsOf = () => {
  const out: { x: number; y: number }[] = [];
  for (const k of [0.08, 0.3]) {
    const i = Math.floor(k * (ESCAPE.length - 1));
    const a = ESCAPE[i];
    const b = ESCAPE[i + 1];
    const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
    for (const side of [-3, 3])
      out.push({
        x: a.x - ((b.y - a.y) / len) * side,
        y: a.y + ((b.x - a.x) / len) * side,
      });
  }
  return out;
};
const BOLLARDS = bollardsOf();

export const Title: React.FC<PictureProps> = ({ f }) => {
  const shot = shotById("1.1");
  const t = f - shot.from;
  const len = shot.to - shot.from;
  const draw = ramp(t, 2, len * 0.55, Easing.inOut(Easing.quad));
  const title = ramp(t, 14, 40, Easing.out(Easing.back(2)));
  const ring = ramp(t, len * 0.56, len * 0.64, Easing.out(Easing.back(1.6)));
  const bubble = ramp(t, len * 0.62, len * 0.74, Easing.out(Easing.back(1.4)));
  const route = ramp(t, len * 0.72, len * 0.92, Easing.inOut(Easing.quad));
  const chicane = VIEW.project(poseAt(T, C + 14));
  const RING_R = 40;
  // leader lines: the ring's tangents toward the callout
  const dx = BUBBLE.x - chicane.x;
  const dy = BUBBLE.y - chicane.y;
  const dist = Math.hypot(dx, dy);
  const ang = Math.atan2(dy, dx);
  const spread = Math.asin((BUBBLE.r - RING_R) / dist);
  const tangent = (sign: number) => {
    const a = ang + sign * (Math.PI / 2 + spread);
    return {
      a: {
        x: chicane.x + Math.cos(a) * RING_R,
        y: chicane.y + Math.sin(a) * RING_R,
      },
      b: {
        x: BUBBLE.x + Math.cos(a) * BUBBLE.r,
        y: BUBBLE.y + Math.sin(a) * BUBBLE.r,
      },
    };
  };
  const zoomRoad = T.width * ZOOM.pxPerMetre;
  const escapeW = 7 * ZOOM.pxPerMetre;
  // race direction in the callout: an arrow drawn on beside the approach, clear of the ribbon
  const arrowPts = samplePath(T, C - 62, C - 62 + 46 * route, -15, 2).map(
    ZOOM.project,
  );
  const arrowEnd = arrowPts[arrowPts.length - 1];
  const arrowPrev = arrowPts[Math.max(0, arrowPts.length - 4)];
  const ah = Math.atan2(arrowEnd.y - arrowPrev.y, arrowEnd.x - arrowPrev.x);
  return (
    <svg viewBox="0 0 1920 1080" width={1920} height={1080}>
      <defs>
        <ToneDefs />
        <InkFilterDef />
        <clipPath id="s11-bubble">
          <circle cx={BUBBLE.x} cy={BUBBLE.y} r={BUBBLE.r} />
        </clipPath>
      </defs>
      <rect width={1920} height={1080} fill={PAPER} />
      <g filter={inkFilter()}>
        <TrackMap
          track={T}
          view={VIEW}
          progress={draw}
          shadow
          finish
          road={15}
        />
        {ring > 0 ? (
          <circle
            cx={chicane.x}
            cy={chicane.y}
            r={RING_R * ring}
            fill="none"
            stroke={INK}
            strokeWidth={6}
          />
        ) : null}
        <g
          opacity={title}
          transform={`translate(110 610) scale(${0.85 + 0.15 * title})`}
        >
          {shot.text.map((line) => (
            <text
              key={line}
              x={0}
              y={0}
              fontFamily={BRUSH_FONT}
              fontSize={150}
              fill={INK}
            >
              {line}
            </text>
          ))}
          <path
            d="M 6 40 L 560 28"
            stroke={INK}
            strokeWidth={8}
            strokeLinecap="round"
          />
        </g>
        {bubble > 0 ? (
          <g>
            {[-1, 1].map((s) => {
              const l = tangent(s);
              return (
                <path
                  key={s}
                  d={`M ${l.a.x} ${l.a.y} L ${l.a.x + (l.b.x - l.a.x) * bubble} ${l.a.y + (l.b.y - l.a.y) * bubble}`}
                  stroke={INK}
                  strokeWidth={3}
                  strokeDasharray="10 8"
                />
              );
            })}
            <g
              transform={`translate(${BUBBLE.x} ${BUBBLE.y}) scale(${bubble}) translate(${-BUBBLE.x} ${-BUBBLE.y})`}
            >
              <circle
                cx={BUBBLE.x + 10}
                cy={BUBBLE.y + 12}
                r={BUBBLE.r}
                fill={tone("mid")}
              />
              <circle cx={BUBBLE.x} cy={BUBBLE.y} r={BUBBLE.r} fill={PAPER} />
              <g clipPath="url(#s11-bubble)">
                {/* the escape road: narrower, dashed, straight on from the entry — a service road, not the track */}
                <path
                  d={ZOOM.path(widen(ESCAPE, 7), true)}
                  fill={tone("light")}
                  stroke={INK}
                  strokeWidth={2.5}
                  strokeDasharray="12 8"
                />
                {BOLLARDS.map((b, i) => {
                  const q = ZOOM.project(b);
                  return (
                    <circle
                      key={i}
                      cx={q.x}
                      cy={q.y}
                      r={Math.max(5, escapeW * 0.16)}
                      fill={INK}
                    />
                  );
                })}
                <TrackMap track={T} view={ZOOM} road={zoomRoad} />
                {route > 0 && arrowPts.length > 1 ? (
                  <g>
                    <path
                      d={arrowPts
                        .map((p, i) => `${i ? "L" : "M"} ${p.x} ${p.y}`)
                        .join(" ")}
                      fill="none"
                      stroke={INK}
                      strokeWidth={6}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d={`M ${arrowEnd.x + Math.cos(ah) * 16} ${arrowEnd.y + Math.sin(ah) * 16} L ${arrowEnd.x + Math.cos(ah + 2.4) * 16} ${arrowEnd.y + Math.sin(ah + 2.4) * 16} L ${arrowEnd.x + Math.cos(ah - 2.4) * 16} ${arrowEnd.y + Math.sin(ah - 2.4) * 16} Z`}
                      fill={INK}
                    />
                  </g>
                ) : null}
              </g>
              <circle
                cx={BUBBLE.x}
                cy={BUBBLE.y}
                r={BUBBLE.r}
                fill="none"
                stroke={INK}
                strokeWidth={7}
              />
            </g>
          </g>
        ) : null}
      </g>
    </svg>
  );
};
