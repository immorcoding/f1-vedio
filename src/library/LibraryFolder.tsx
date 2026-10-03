// Studio "Library" folder: review stills for the asset library — kit sheet, car sheets (one per year, side and top
// views), car state checks, scene and track sheets, and the Trace/Art check stills of every traced car (ART-10).
// Registered from Root with one line.
import { Composition, Folder, Still } from "remotion";
import { CARS, type CarId } from "../cars";
import type { TrackId } from "../tracks";
import { T5Panel } from "../scenes/abu-dhabi-2021/T5Panel";
import { Cars2020States, FireSheet } from "./Bahrain2020Sheets";
import { CarCheck } from "./CarCheck";
import { CarSheet, SHEETS } from "./CarSheet";
import { CAR_STATES_FRAMES, CarStates } from "./CarStates";
import { KitSheet } from "./KitSheet";
import { TOP_SHEET_2021, TopCarSheet } from "./TopCarSheet";
import { TRACK_SHEETS, TrackSheet } from "./TrackSheet";

const SIZE = { width: 1920, height: 1080 };

const YEARS = Object.keys(SHEETS).map(Number) as (keyof typeof SHEETS)[];

export const LibraryFolder: React.FC = () => (
  <Folder name="Library">
    <Still id="Kit-Sheet" component={KitSheet} {...SIZE} />
    {YEARS.map((year) => (
      <Still
        key={year}
        id={`Cars-${year}-Sheet`}
        component={CarSheet}
        defaultProps={SHEETS[year]}
        {...SIZE}
      />
    ))}
    <Still
      id="Cars-2021-Top-Sheet"
      component={TopCarSheet}
      defaultProps={TOP_SHEET_2021}
      {...SIZE}
    />
    <Composition
      id="Cars-States"
      component={CarStates}
      defaultProps={{ car: "RB16B" as CarId }}
      durationInFrames={CAR_STATES_FRAMES}
      fps={60}
      {...SIZE}
    />
    <Still id="Scene-AbuDhabi2021-T5" component={T5Panel} {...SIZE} />
    {(Object.keys(TRACK_SHEETS) as TrackId[]).map((track) => (
      <Still
        key={track}
        id={`Track-${track}-Sheet`}
        component={TrackSheet}
        defaultProps={{ track }}
        {...SIZE}
      />
    ))}
    <Still id="Cars-2020-States" component={Cars2020States} {...SIZE} />
    {(["manga", "color"] as const).map((palette) => (
      <Still
        key={palette}
        id={`Fire-Sheet-${palette}`}
        component={FireSheet}
        defaultProps={{ palette }}
        {...SIZE}
      />
    ))}
    <Folder name="Checks">
      {(Object.keys(CARS) as CarId[]).map((car) => (
        <Still
          key={`trace-${car}`}
          id={`Check-Trace-${car}`}
          component={CarCheck}
          defaultProps={{ car, mode: "trace" as const }}
          {...SIZE}
        />
      ))}
      {(Object.keys(CARS) as CarId[]).map((car) => (
        <Still
          key={`art-${car}`}
          id={`Check-Art-${car}`}
          component={CarCheck}
          defaultProps={{ car, mode: "art" as const }}
          {...SIZE}
        />
      ))}
    </Folder>
  </Folder>
);
