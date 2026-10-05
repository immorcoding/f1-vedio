import { Composition, Folder, Still } from "remotion";
import { CoverFolder } from "./cover/CoverFolder";
import { LibraryFolder } from "./library/LibraryFolder";
import { MV, PartPreview, partPreviewFrames } from "./mv/MV";
import { PARTS } from "./mv/edit-list";
import { FPS, TOTAL_FRAMES } from "./mv/timing";
import { ABU_DHABI_2021_FRAMES, AbuDhabi2021 } from "./prototype/AbuDhabi2021";
import { StyleA } from "./prototype/styles/StyleA";
import { StyleB } from "./prototype/styles/StyleB";
import { StyleC } from "./prototype/styles/StyleC";
import { TraceCheck } from "./prototype/styles/TraceCheck";
import { CarSheet2021 } from "./prototype/styles/CarSheet2021";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <LibraryFolder />
      <CoverFolder />
      <Composition id="MV" component={MV} durationInFrames={TOTAL_FRAMES} fps={FPS} width={1920} height={1080} />
      {/* One window per part (its bars plus one bar after), for review and standalone renders. */}
      <Folder name="MV-parts">
        {PARTS.map((p) => (
          <Composition key={p.id} id={`MV-${p.id}`} component={PartPreview} defaultProps={{ part: p.id }} durationInFrames={partPreviewFrames(p.id)} fps={FPS} width={1920} height={1080} />
        ))}
      </Folder>
      {/* PROTOTYPE — race-moment look and style studies for review; remove once the look is settled. */}
      <Folder name="Prototype">
        <Composition id="Proto-AbuDhabi2021" component={AbuDhabi2021} durationInFrames={ABU_DHABI_2021_FRAMES} fps={60} width={1920} height={1080} />
        <Still id="Style-A-InkWatercolor" component={StyleA} width={1920} height={1080} />
        <Still id="Style-B-Manga" component={StyleB} width={1920} height={1080} />
        <Still id="Style-C-Illustration" component={StyleC} width={1920} height={1080} />
        <Still id="Sheet-Cars2021" component={CarSheet2021} width={1920} height={1080} />
        <Still id="Trace-W12" component={TraceCheck} defaultProps={{ car: "W12" }} width={1920} height={1080} />
        <Still id="Trace-RB16B" component={TraceCheck} defaultProps={{ car: "RB16B" }} width={1920} height={1080} />
        <Still id="Art-W12" component={TraceCheck} defaultProps={{ car: "W12", mode: "art" as const }} width={1920} height={1080} />
        <Still id="Art-RB16B" component={TraceCheck} defaultProps={{ car: "RB16B", mode: "art" as const }} width={1920} height={1080} />
      </Folder>
    </>
  );
};
