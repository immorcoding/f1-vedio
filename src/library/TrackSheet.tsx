// Track sheet: one traced track for review of its data and renderers (ART-7, MOT-2) — the whole lap as a map on the
// left, a stretch of it in detail on the right with its race's cars placed by lap distance (top view). One sheet per
// track (TRACK_SHEETS), registered as Track-<id>-Sheet.
import { AbsoluteFill } from "remotion";
import { CARS, MangaCar, PIRELLI_2021, topAnchorAt, type CarId } from "../cars";
import { INK, PAPER } from "../kit/colors";
import { ToneDefs, tone } from "../kit/tone";
import { T5_SECTION } from "../scenes/abu-dhabi-2021/t5-map";
import {
  fitMap,
  mapView,
  poseAt,
  TrackMap,
  TrackSection,
  TRACKS,
  type MapViewSpec,
  type TrackId,
  type TrackMapProps,
  type TrackSectionProps,
} from "../tracks";

type Box = { x: number; y: number; w: number; h: number };

type TrackSheetSpec = {
  // the whole lap, fitted into `box` on a page of the map's theme
  map: { box: Box; rotation?: number; margin?: number } & Omit<
    TrackMapProps,
    "track" | "view"
  >;
  // the detail panel: its box (framed in ink), the view and the stretch shown, and the section's look
  detail: {
    box: Box;
    view: MapViewSpec;
    from: number;
    to: number;
    page?: "paper" | "tone";
    look?: Partial<TrackSectionProps>;
  };
  // cars centred on their lap distance, `lateral` m right of the centre line
  cars: { car: CarId; s: number; lateral: number; compound?: string }[];
};

const SUZUKA = TRACKS.Suzuka1989;
const YAS = TRACKS.YasMarina2021;
const SUZUKA_PLAN: Box = { x: 980, y: 60, w: 880, h: 960 };

export const TRACK_SHEETS: Record<TrackId, TrackSheetSpec> = {
  // The lap as on a title card, and the Casio Triangle chicane with both 1989 McLarens before it.
  Suzuka1989: {
    map: {
      box: { x: 40, y: 140, w: 900, h: 800 },
      road: 16,
      rim: 16 * 0.36,
      shadow: true,
    },
    detail: {
      box: SUZUKA_PLAN,
      view: {
        centre: poseAt(SUZUKA, SUZUKA.corners.chicane - 10),
        rotation: -poseAt(SUZUKA, SUZUKA.corners.chicane - 60).heading,
        pxPerMetre: 9,
        screen: {
          x: SUZUKA_PLAN.x + SUZUKA_PLAN.w / 2,
          y: SUZUKA_PLAN.y + SUZUKA_PLAN.h / 2,
        },
      },
      from: SUZUKA.corners.chicane - 260,
      to: SUZUKA.corners.chicane + 240,
      look: { grass: SUZUKA_PLAN },
    },
    cars: [
      { car: "MP45-PRO", s: SUZUKA.corners.chicane - 40, lateral: -2.5 },
      { car: "MP45-SEN", s: SUZUKA.corners.chicane - 47, lateral: 3 },
    ],
  },
  // The night map as on the Abu Dhabi title card, and the T5 hairpin with both cars on the last lap.
  YasMarina2021: {
    map: {
      box: { x: 0, y: 0, w: 660, h: 1080 },
      margin: 50 / 1080,
      theme: "night",
      finish: true,
      labels: 1,
      labelSize: 34,
    },
    detail: {
      box: { x: 680, y: 20, w: 1220, h: 1040 },
      view: {
        centre: {
          x: poseAt(YAS, YAS.corners.t5Apex).x,
          y: poseAt(YAS, YAS.corners.t5Apex).y + 60,
        },
        pxPerMetre: 4.2,
        screen: { x: 1290, y: 540 },
      },
      from: 900,
      to: 2000,
      page: "tone",
      look: T5_SECTION,
    },
    cars: [
      { car: "RB16B", s: 1395, lateral: -3, compound: PIRELLI_2021.soft },
      { car: "W12", s: 1392, lateral: 3.5, compound: PIRELLI_2021.hard },
    ],
  },
};

export const TrackSheet: React.FC<{ track: TrackId }> = ({ track: id }) => {
  const track = TRACKS[id];
  const { map, detail, cars } = TRACK_SHEETS[id];
  const { box: mapBox, rotation, margin, ...mapLook } = map;
  const night = mapLook.theme === "night";
  const view = mapView(detail.view);
  const D = detail.box;
  return (
    <AbsoluteFill style={{ backgroundColor: PAPER }}>
      <svg width={1920} height={1080}>
        <defs>
          <ToneDefs />
          <clipPath id="sheet-map">
            <rect
              x={mapBox.x}
              y={mapBox.y}
              width={mapBox.w}
              height={mapBox.h}
            />
          </clipPath>
          <clipPath id="sheet-detail">
            <rect x={D.x} y={D.y} width={D.w} height={D.h} />
          </clipPath>
        </defs>
        {night ? (
          <rect
            x={mapBox.x}
            y={mapBox.y}
            width={mapBox.w}
            height={mapBox.h}
            fill={INK}
          />
        ) : null}
        <g clipPath="url(#sheet-map)">
          <TrackMap
            track={track}
            view={fitMap(track, mapBox, rotation, margin)}
            {...mapLook}
          />
        </g>
        <g clipPath="url(#sheet-detail)">
          {detail.page === "tone" ? (
            <rect x={D.x} y={D.y} width={D.w} height={D.h} fill={tone("mid")} />
          ) : null}
          <TrackSection
            track={track}
            view={view}
            from={detail.from}
            to={detail.to}
            {...detail.look}
          />
          {cars.map((c) => {
            const pose = poseAt(track, c.s, c.lateral);
            const heading = view.heading(pose.heading);
            return (
              <MangaCar
                key={c.car}
                car={CARS[c.car]}
                view="top"
                at={topAnchorAt(CARS[c.car], view.anchor(pose), heading)}
                state={{ heading, compound: c.compound }}
              />
            );
          })}
        </g>
        <rect
          x={D.x}
          y={D.y}
          width={D.w}
          height={D.h}
          fill="none"
          stroke={INK}
          strokeWidth={8}
        />
      </svg>
    </AbsoluteFill>
  );
};
