// Studio "Library" folder: review stills for the asset library — kit sheet, car sheets, car state check, and the
// Trace/Art check stills of every traced car (ART-10). Registered from Root with one line.
import { Composition, Folder, Still } from "remotion";
import { CARS, type CarId } from "../cars";
import { T5Panel } from "../scenes/abu-dhabi-2021/T5Panel";
import { Cars2020States, FireSheet, SHEET_2020 } from "./Bahrain2020Sheets";
import { CarCheck } from "./CarCheck";
import { CarSheet, SHEET_2021 } from "./CarSheet";
import { CAR_STATES_FRAMES, CarStates } from "./CarStates";
import { KitSheet } from "./KitSheet";

const SIZE = { width: 1920, height: 1080 };

export const LibraryFolder: React.FC = () => (
  <Folder name="Library">
    <Still id="Kit-Sheet" component={KitSheet} {...SIZE} />
    <Still
      id="Cars-2021-Sheet"
      component={CarSheet}
      defaultProps={SHEET_2021}
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
    <Still
      id="Cars-2020-Sheet"
      component={CarSheet}
      defaultProps={SHEET_2020}
      {...SIZE}
    />
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
