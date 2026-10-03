// The near side of the track in the side-on shots (ART-9): rubber streaks on the asphalt, a black-and-white kerb along
// the near edge and the grass verge in light tone below it, all on the panel's camera and sliding with camX. Keeps
// the lower third of the frame from reading as blank paper.
import { random } from "remotion";
import type { Camera } from "../../../kit/camera";
import { INK, PAPER } from "../../../kit/colors";
import { tone } from "../../../kit/tone";

export const Foreground: React.FC<{
  cam: Camera;
  camX: number;
  nearEdge: number;
  farEdge: number;
}> = ({ cam, camX, nearEdge, farEdge }) => {
  const Y = (z: number) => cam.screenY(0, z);
  const kerbNear = nearEdge - 0.8;
  // kerb blocks 0.9 m long, in world x, over what the camera sees at the kerb's depth
  const x0 = camX + ((-300 - cam.cx) * kerbNear) / cam.f;
  const x1 = camX + ((2220 - cam.cx) * kerbNear) / cam.f;
  const blocks: { d: string; dark: boolean }[] = [];
  for (let k = Math.floor(x0 / 0.9); k <= Math.ceil(x1 / 0.9); k++) {
    const a = k * 0.9 - camX;
    const b = a + 0.9;
    blocks.push({
      d: `M ${cam.screenX(a, nearEdge)} ${Y(nearEdge)} L ${cam.screenX(b, nearEdge)} ${Y(nearEdge)} L ${cam.screenX(b, kerbNear)} ${Y(kerbNear)} L ${cam.screenX(a, kerbNear)} ${Y(kerbNear)} Z`,
      dark: k % 2 === 0,
    });
  }
  // rubbered-in streaks along the racing line, at their depths
  const streaks: string[] = [];
  for (let i = 0; i < 46; i++) {
    const z = nearEdge + 0.4 + random(`fg-z-${i}`) * (farEdge - nearEdge - 0.8);
    const span = 40;
    const xw =
      ((((random(`fg-x-${i}`) * span - camX) % span) + span) % span) - span / 2;
    const len = 1 + 3 * random(`fg-l-${i}`);
    streaks.push(
      `M ${cam.screenX(xw, z).toFixed(1)} ${Y(z).toFixed(1)} L ${cam.screenX(xw + len, z).toFixed(1)} ${Y(z).toFixed(1)}`,
    );
  }
  return (
    <g>
      <path
        d={streaks.join(" ")}
        stroke={INK}
        strokeWidth={2.4}
        opacity={0.4}
      />
      <rect
        x={-400}
        y={Y(kerbNear)}
        width={2720}
        height={1400}
        fill={tone("light")}
      />
      {blocks.map((b) => (
        <path
          key={b.d}
          d={b.d}
          fill={b.dark ? INK : PAPER}
          stroke={INK}
          strokeWidth={2}
        />
      ))}
      <path
        d={`M -400 ${Y(kerbNear)} L 2320 ${Y(kerbNear)}`}
        stroke={INK}
        strokeWidth={4}
      />
    </g>
  );
};
