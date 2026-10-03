import { Composition, Folder, Still } from "remotion";
import { F1Video } from "./F1Video";
import { ABU_DHABI_2021_FRAMES, AbuDhabi2021 } from "./prototype/AbuDhabi2021";
import { StyleA } from "./prototype/styles/StyleA";
import { StyleB } from "./prototype/styles/StyleB";
import { StyleC } from "./prototype/styles/StyleC";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition id="F1Video" component={F1Video} durationInFrames={300} fps={60} width={1920} height={1080} />
      {/* PROTOTYPE — race-moment look and style studies for review; remove once the look is settled. */}
      <Folder name="Prototype">
        <Composition id="Proto-AbuDhabi2021" component={AbuDhabi2021} durationInFrames={ABU_DHABI_2021_FRAMES} fps={60} width={1920} height={1080} />
        <Still id="Style-A-InkWatercolor" component={StyleA} width={1920} height={1080} />
        <Still id="Style-B-Manga" component={StyleB} width={1920} height={1080} />
        <Still id="Style-C-Illustration" component={StyleC} width={1920} height={1080} />
      </Folder>
    </>
  );
};
