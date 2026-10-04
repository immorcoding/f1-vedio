// GRO getting out of the cockpit (escape-staging.ts, the people module's climbOutOfCockpit), layered against the
// wreck: what is still inside goes into the wreck's own drawing (WreckWorld `cockpit`), behind the halo's near bar and
// cut to the cockpit's rim there; his gloves close over the halo tubes they hold and a leg on its way out over the side
// is in front of the hoop (the layer over the near bar); what is out over the side is behind the bottom rail; what has
// crossed it is in front. Shared by the 27 秒 panel and shot 3.6.
import { useId } from "react";
import { GRO_2020 } from "../../../cars";
import {
  Figure,
  driverOutfit,
  solve,
  type BodyPart,
  type ExitLayer,
  type Outfit,
  type Pose,
} from "../../../kit/figure";
import type { CockpitLayers } from "./Wreck";

// Race suit of 2020 (Haas: black with a grey side band), GRO's helmet.
export const GRO_KIT: Outfit = driverOutfit(GRO_2020.helmet, "#1f1f23", {
  band: "#8d9099",
  gloves: "#2c2c31",
  boots: "#141416",
});
const PARTS: BodyPart[] = ["farLeg", "body", "nearLeg", "nearArm"];

export const useGroExit = ({
  at,
  ppm,
  pose,
  layers,
  holds,
  rim,
  facing = "left",
  rimSide = "right",
}: {
  at: { x: number; y: number }; // his ground point on screen
  ppm: number;
  pose: Pose;
  layers: Record<BodyPart, ExitLayer>;
  holds: { near: boolean; far: boolean };
  rim: string;
  // the way he faces in the wreck camera's (unflipped) picture: the nose in the cockpit, the track once he turns
  facing?: "left" | "right";
  // the side the fire lights him from, in the same picture
  rimSide?: "left" | "right";
}) => {
  const id = `gx${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const k = facing === "left" ? 1 : -1;
  const on = (l: ExitLayer) => PARTS.filter((p) => layers[p] === l);
  const fig = (key: string, parts: BodyPart[]) =>
    parts.length ? (
      <Figure
        key={key}
        at={at}
        pxPerMetre={ppm}
        pose={pose}
        outfit={GRO_KIT}
        facing={facing}
        rim={rim}
        rimSide={rimSide}
        parts={parts}
        shadow={false}
      />
    ) : null;
  const inside = on("cockpit");
  const lifting = on("lifting");
  // a glove on the halo: the arm drawn again over the tube, cut to a disc round the hand
  const b = solve(pose);
  const handDisc = (side: "near" | "far") => {
    const a = b.arms[side];
    const c = {
      x: a.wrist.x + a.handDir.x * 0.05,
      y: a.wrist.y + a.handDir.y * 0.05,
    };
    return (
      <clipPath id={`${id}-h${side}`}>
        <circle
          cx={at.x - k * c.x * ppm}
          cy={at.y - c.y * ppm}
          r={0.075 * ppm}
        />
      </clipPath>
    );
  };
  const inCockpit = inside.length + lifting.length > 0;
  const cockpit: CockpitLayers | undefined = inCockpit
    ? {
        behindHalo: fig("in", inside),
        overHalo: (
          <g>
            <defs>
              {handDisc("near")}
              {handDisc("far")}
            </defs>
            {fig("lift", lifting)}
            {holds.near && layers.nearArm === "cockpit" ? (
              <g clipPath={`url(#${id}-hnear)`}>{fig("hn", ["nearArm"])}</g>
            ) : null}
            {holds.far && layers.body === "cockpit" ? (
              <g clipPath={`url(#${id}-hfar)`}>{fig("hf", ["body"])}</g>
            ) : null}
          </g>
        ),
      }
    : undefined;
  return {
    cockpit,
    behindRails: fig("out", on("out")),
    front: fig("front", on("front")),
  };
};
