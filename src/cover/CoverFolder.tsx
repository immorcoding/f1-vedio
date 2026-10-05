// The video cover (thumbnail) stills: each variant at 1920×1080 (YouTube / Bilibili 16:9) 1146×717 (Bilibili
// 16:10) and 1440×1080 (4:3). Render with `npm run still -- Cover-A out/release/cover/cover-a.png --gl=angle --log=error`.
import { Folder, Still } from "remotion";
import { CoverA } from "./CoverA";
import { CoverB } from "./CoverB";
import { CoverC } from "./CoverC";
import { H_16x10, H_16x9, H_4x3, type CoverProps } from "./frame";

const VARIANTS: { id: string; component: React.FC<CoverProps> }[] = [
  { id: "A", component: CoverA },
  { id: "B", component: CoverB },
  { id: "C", component: CoverC },
];

export const CoverFolder: React.FC = () => (
  <Folder name="Cover">
    {VARIANTS.map((v) => (
      <Folder key={v.id} name={`Cover-${v.id}-sizes`}>
        <Still
          id={`Cover-${v.id}`}
          component={v.component}
          defaultProps={{ h: H_16x9 }}
          width={1920}
          height={1080}
        />
        <Still
          id={`Cover-${v.id}-16x10`}
          component={v.component}
          defaultProps={{ h: H_16x10 }}
          width={1146}
          height={717}
        />
        <Still
          id={`Cover-${v.id}-4x3`}
          component={v.component}
          defaultProps={{ h: H_4x3 }}
          width={1440}
          height={1080}
        />
      </Folder>
    ))}
  </Folder>
);
