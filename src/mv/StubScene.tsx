import { AbsoluteFill } from "remotion";
import type { SceneProps } from "./scenes";

// Stand-in picture for a part whose ticket has not landed: black, with a small label.
export const StubScene: React.FC<SceneProps> = ({ part }) => (
  <AbsoluteFill style={{ backgroundColor: "#0d0d0d" }}>
    <div
      style={{
        position: "absolute",
        left: 48,
        bottom: 40,
        color: "#3a3a3a",
        fontSize: 28,
        fontFamily: "sans-serif",
      }}
    >
      {part.id} · TODO ({part.ticket})
    </div>
  </AbsoluteFill>
);
