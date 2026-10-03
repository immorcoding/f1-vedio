// The track library: traced circuit data (Track, metres), its geometry (lap distance → map point and heading) and the
// renderers that draw it top-down: the whole lap (TrackMap) and a stretch of it in detail (TrackSection).
// Usage: const view = mapView({ centre: poseAt(T, s), rotation, pxPerMetre, screen });
//        <TrackSection track={T} view={view} from={s0} to={s1} /> and a car at view.anchor(poseAt(T, s, lateral)).
import { SUZUKA_1989 } from "./suzuka-1989";
import type { Track } from "./track";
import { YAS_MARINA_2021 } from "./yas-marina-2021";

export * from "./track";
export {
  FinishLine,
  TrackMap,
  type MapTheme,
  type TrackMapProps,
} from "./TrackMap";
export {
  TrackSection,
  type Stand,
  type TrackSectionProps,
} from "./TrackSection";
export { SUZUKA_1989, YAS_MARINA_2021 };

// Every traced track by id.
export const TRACKS = {
  Suzuka1989: SUZUKA_1989,
  YasMarina2021: YAS_MARINA_2021,
} satisfies Record<string, Track>;
export type TrackId = keyof typeof TRACKS;
