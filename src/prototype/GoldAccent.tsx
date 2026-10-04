// PROTOTYPE (prototype/gold-accent, throwaway): should the gold under-stroke on the leader's number appear on every
// points box (A, the current film) or only on the champion cards 2.7 and 5.8 (B, every other box marks the leader in
// ink only)? Renders real MV frames in both variants through the points box's accent context.
import { Folder, Sequence, Still } from "remotion";
import { MV } from "../mv/MV";
import {
  PointsAccentContext,
  type PointsAccent,
} from "../kit/points-box";

export type GoldVariant = "A" | "B" | "B-ink" | "B-tone";

// B's ink mark: chosen after rendering both on 1.2 (see the report); "B-ink"/"B-tone" stay for side-by-side.
const B_ACCENT: PointsAccent = "tone";

/** The shots under test: song frame of a settled points box, and whether it is a champion card (gold in A and B). */
export const GOLD_SHOTS = [
  { id: "1.2", frame: 1420, champion: false },
  { id: "1.5", frame: 2545, champion: false },
  { id: "2.7", frame: 5890, champion: true },
  { id: "5.7", frame: 11400, champion: false },
  { id: "outro", frame: 12240, champion: false },
] as const;

const accentOf = (v: GoldVariant, champion: boolean): PointsAccent =>
  v === "A" || champion
    ? "gold"
    : v === "B-ink"
      ? "ink"
      : v === "B-tone"
        ? "tone"
        : B_ACCENT;

const GoldAccentFrame: React.FC<{
  variant: GoldVariant;
  frame: number;
  champion: boolean;
}> = ({ variant, frame, champion }) => (
  <PointsAccentContext.Provider value={accentOf(variant, champion)}>
    <Sequence from={-frame}>
      <MV />
    </Sequence>
  </PointsAccentContext.Provider>
);

export const GoldAccentFolder: React.FC = () => (
  <Folder name="Gold-accent">
    {(["A", "B", "B-ink", "B-tone"] as const).flatMap((v) =>
      GOLD_SHOTS.map((s) => (
        <Still
          key={`${v}-${s.id}`}
          id={`Proto-Gold-${v}-${s.id.replace(".", "-")}`}
          component={GoldAccentFrame}
          defaultProps={{ variant: v, frame: s.frame, champion: s.champion }}
          width={1920}
          height={1080}
        />
      )),
    )}
  </Folder>
);
