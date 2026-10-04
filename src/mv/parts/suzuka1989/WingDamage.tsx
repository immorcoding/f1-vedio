// SEN's front-wing damage and debris in shot 1.4, drawn from wreck14.ts (the physics and geometry live there).
// - FarWingHalf: the far half of the wing, folded up and back about its root, its outer flap and the endplate's
//   front corner gone; drawn behind SEN's car (it is on his far side), so the nose and the near wheel hide its foot.
// - CrumpledNose: the nose tip buckled against PRO's tyre, drawn over SEN's car, with the near endplate redrawn over
//   it (the near endplate sits in front of the nose).
// - Debris: the pieces that broke off, projected by the panel's camera.
// The car parts are drawn in the car's photo space (MangaCar's own frame), so they pitch with the body (state.tilt)
// and their lines weigh what the car's do.
import { MP4_5 } from "../../../cars";
import type { ScreenAnchor, Camera } from "../../../kit/camera";
import { INK } from "../../../kit/colors";
import { tone } from "../../../kit/tone";
import {
  crumpleAt,
  deckTop,
  ENDPLATE_CUT,
  FLAP,
  fold,
  PIECES,
  pieceAt,
  WING,
  type Piece,
} from "./wreck14";

const CAR = MP4_5;
const PX_PER_M = 250 / CAR.frame.k; // photo px per metre (360)
const [FRONT, REAR] = CAR.nearWheels;
const PIVOT = { x: (FRONT.cx + REAR.cx) / 2, y: (FRONT.cy + REAR.cy) / 2 };
// car metres (x forward from the rear end, z up) → photo px
const px = (x: number, z: number) =>
  `${(CAR.frame.x - x * PX_PER_M).toFixed(1)} ${(CAR.frame.ground - z * PX_PER_M).toFixed(1)}`;
const poly = (pts: { x: number; z: number }[]) =>
  `M ${pts.map((p) => px(p.x, p.z)).join(" L ")} Z`;

// The car's photo space at a side-view anchor (facing right), pitched like MangaCar's body.
const PhotoSpace: React.FC<{
  at: ScreenAnchor;
  tilt?: number;
  children: React.ReactNode;
}> = ({ at, tilt = 0, children }) => {
  const k = at.pxPerMetre / PX_PER_M;
  return (
    <g
      transform={`translate(${at.x} ${at.y}) scale(${-k} ${k}) translate(${-CAR.frame.x} ${-CAR.frame.ground})`}
    >
      <g transform={tilt ? `rotate(${tilt} ${PIVOT.x} ${PIVOT.y})` : undefined}>
        {children}
      </g>
    </g>
  );
};

// The far half of the wing, folded by `bend` (0–1).
export const FarWingHalf: React.FC<{
  at: ScreenAnchor;
  tilt?: number;
  bend: number;
}> = ({ at, tilt, bend }) => {
  const F = (x: number, l: number, z: number) => fold(x, l, z, bend);
  const { xTe, xLe, lRoot, lTip } = WING;
  // the deck's top surface, root to tip (the camera sees its top as it tilts up toward the far side)
  const deck = poly([
    F(xLe, lRoot, deckTop(xLe)),
    F(xTe, lRoot, deckTop(xTe)),
    F(xTe, lTip, deckTop(xTe)),
    F(xLe, lTip, deckTop(xLe)),
  ]);
  // the flap along the trailing edge, snapped off on a diagonal at its outer end
  const flap = poly([
    F(FLAP.x0, FLAP.lIn, deckTop(FLAP.x0)),
    F(FLAP.x0, FLAP.lOutTe, deckTop(FLAP.x0)),
    F(FLAP.x1, FLAP.lOutLe, deckTop(FLAP.x1)),
    F(FLAP.x1, FLAP.lIn, deckTop(FLAP.x1)),
  ]);
  const flapBreak = [
    F(FLAP.x0, FLAP.lOutTe, deckTop(FLAP.x0)),
    F(FLAP.x1, FLAP.lOutLe, deckTop(FLAP.x1)),
  ];
  // the endplate at the tip, its front lower corner broken off along a straight line
  const plate = ENDPLATE_CUT.map(([x, z]) => F(x, lTip, z));
  const plateBreak = [plate[3], plate[4]];
  // one straight crack across the deck, from the trailing edge near the root out to the leading edge
  const crack = [
    F(xTe + 0.06, lRoot + 0.1, deckTop(xTe + 0.06)),
    F(xTe + 0.3, lRoot + 0.28, deckTop(xTe + 0.3)),
    F(xLe, lRoot + 0.33, deckTop(xLe)),
  ];
  // the root: where the half tore from the nose, a clean fracture with one kink, the carbon's black section showing
  const root = [
    F(xTe, lRoot, deckTop(xTe)),
    F(xTe + 0.27, lRoot + 0.03, deckTop(xTe + 0.27)),
    F(xLe, lRoot, deckTop(xLe)),
  ];
  // the black rubber scuff the tyre left on the endplate's outer face
  const scuff = [F(4.1, lTip, 0.2), F(3.9, lTip, 0.27), F(3.75, lTip, 0.3)];
  const line = (pts: { x: number; z: number }[]) =>
    `M ${pts.map((p) => px(p.x, p.z)).join(" L ")}`;
  return (
    <PhotoSpace at={at} tilt={tilt}>
      <path
        d={deck}
        fill={CAR.paint.frontDeck}
        stroke={INK}
        strokeWidth={4}
        strokeLinejoin="round"
      />
      <path d={deck} fill={tone("light")} opacity={0.35} />
      <path
        d={flap}
        fill={CAR.frontWing.flap.color}
        stroke={INK}
        strokeWidth={4}
        strokeLinejoin="round"
      />
      <path d={line(crack)} fill="none" stroke={INK} strokeWidth={3} />
      <path
        d={line(root)}
        fill="none"
        stroke={INK}
        strokeWidth={9}
        strokeLinejoin="miter"
      />
      <path d={line(flapBreak)} stroke={INK} strokeWidth={8} />
      <path
        d={poly(plate)}
        fill={CAR.paint.wing}
        stroke={INK}
        strokeWidth={4}
        strokeLinejoin="round"
      />
      <path d={line(plateBreak)} stroke={INK} strokeWidth={8} />
      <path
        d={line(scuff)}
        fill="none"
        stroke={INK}
        strokeWidth={10}
        strokeLinecap="round"
        opacity={0.7}
      />
    </PhotoSpace>
  );
};

// The nose tip crumpled against the tyre: buckled into two folds, the front face pushed in, crease lines from the
// folds. `c` 0–1 blends from the intact tip to the crushed one.
const TIP_INTACT: [number, number][] = [
  [3.96, 0.33],
  [4.0, 0.318],
  [4.035, 0.305],
  [4.075, 0.297],
  [4.133, 0.283],
  [4.133, 0.262],
  [4.133, 0.239],
  [4.06, 0.241],
  [3.96, 0.245],
];
const TIP_CRUSHED: [number, number][] = [
  [3.96, 0.33],
  [4.0, 0.362],
  [4.035, 0.318],
  [4.075, 0.338],
  [4.13, 0.29],
  [4.095, 0.266],
  [4.13, 0.243],
  [4.06, 0.236],
  [3.96, 0.24],
];
export const CrumpledNose: React.FC<{
  at: ScreenAnchor;
  tilt?: number;
  f: number;
}> = ({ at, tilt, f }) => {
  const c = crumpleAt(f);
  const pts = TIP_INTACT.map(([x, z], i) => ({
    x: x + (TIP_CRUSHED[i][0] - x) * c,
    z: z + (TIP_CRUSHED[i][1] - z) * c,
  }));
  const crease = (a: number, b: [number, number]) =>
    `M ${px(pts[a].x, pts[a].z)} L ${px(b[0], b[1])}`;
  return (
    <PhotoSpace at={at} tilt={tilt}>
      {/* drawn over the intact tip MangaCar drew, covering it */}
      <path
        d={poly(pts)}
        fill={CAR.paint.chassis}
        stroke={INK}
        strokeWidth={4}
        strokeLinejoin="miter"
      />
      <path
        d={`${crease(2, [3.99, 0.25])} ${crease(5, [4.03, 0.247])} ${crease(1, [3.975, 0.3])}`}
        fill="none"
        stroke={INK}
        strokeWidth={3}
        opacity={c}
      />
      {/* the shaded facet between the folds */}
      <path
        d={poly([pts[1], pts[2], { x: 3.99, z: 0.25 }, { x: 3.975, z: 0.3 }])}
        fill={tone("mid")}
        opacity={0.6 * c}
      />
      {/* the near endplate sits in front of the nose: drawn again over the crumple, intact */}
      <path
        d={CAR.frontWing.near}
        fill={CAR.paint.wing}
        stroke={INK}
        strokeWidth={4}
        strokeLinejoin="round"
      />
    </PhotoSpace>
  );
};

// ── debris ───────────────────────────────────────────────────────────────────────────────────────────────────
// A piece's state for the picture: world position relative to the camera and its look.
export const debrisState = (
  p: Piece,
  t: number,
  v0: number,
  senRearX: number,
  zSen: number,
  camX: number,
) => {
  const s = pieceAt(p, t, v0);
  return {
    x: senRearX + p.from.x + s.fwd - camX,
    y: s.y,
    z: zSen + p.from.l + s.across,
    angle: s.angle,
    flat: s.flat,
  };
};

export const DebrisPiece: React.FC<{
  p: Piece;
  cam: Camera;
  at: { x: number; y: number; z: number; angle: number; flat: number };
}> = ({ p, cam, at }) => {
  const q = cam.project({ x: at.x, y: at.y, z: at.z });
  const k = cam.pxPerMetre(at.z);
  const pts = p.shape.map(
    ([x, y]) => `${(x * k).toFixed(1)} ${(y * k).toFixed(1)}`,
  );
  const [a, b] = [
    p.shape[p.fracture],
    p.shape[(p.fracture + 1) % p.shape.length],
  ];
  const fill = p.colour === "white" ? CAR.paint.wing : "#1d1d21";
  return (
    <g
      transform={`translate(${q.x.toFixed(1)} ${q.y.toFixed(1)}) rotate(${at.angle.toFixed(1)}) scale(1 ${at.flat.toFixed(3)})`}
    >
      <path
        d={`M ${pts.join(" L ")} Z`}
        fill={fill}
        stroke={INK}
        strokeWidth={2}
        strokeLinejoin="miter"
      />
      {p.colour === "white" ? (
        <path
          d={`M ${(a[0] * k).toFixed(1)} ${(a[1] * k).toFixed(1)} L ${(b[0] * k).toFixed(1)} ${(b[1] * k).toFixed(1)}`}
          stroke={INK}
          strokeWidth={4}
        />
      ) : null}
    </g>
  );
};

export { PIECES };
