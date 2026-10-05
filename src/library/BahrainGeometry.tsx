// Check still: the Bahrain 2020 crash on the top view (wreck-geometry.ts W), the model every Bahrain shot derives from —
// the barrier on the right of the run, the 29° path and the 51° body (yaw 22° to the right), the first touch, the
// survival cell at rest through the rails, the rear half, the torn gap, the medical car, and each shot's camera with
// what it frames. Everything is read from the model and from the shots' own camera functions; nothing is copied.
import { AbsoluteFill } from "remotion";
import { MangaCar, VF20 } from "../cars";
import type { Camera } from "../kit/camera";
import { INK, PAPER } from "../kit/colors";
import { CAPTION_FONT } from "../kit/lettering";
import {
  BODY_ANGLE,
  IMPACT_ANGLE,
  L_GRO,
  WING_CORNER,
  poseAtFrame,
  rightFrontCorner,
} from "../mv/parts/bahrain2020/crash-geometry.ts";
import { escapeCam } from "../mv/parts/bahrain2020/Escape";
import { finaleCam } from "../mv/parts/bahrain2020/HaloFinale";
import { IMPACT_CAM } from "../mv/parts/bahrain2020/Impact";
import { CLOCK_32, PLAN_32 } from "../mv/parts/bahrain2020/staging.ts";
import { MARSHAL_AT, stage36 } from "../mv/parts/bahrain2020/escape-staging.ts";
import {
  MEDICAL_CAMERA_W,
  PANEL_CAMS,
  PANEL_RECTS,
} from "../mv/parts/bahrain2020/Timeline27";
import { wreckShotCam } from "../mv/parts/bahrain2020/Wreck";
import { cueFrame, shotById } from "../mv/parts/bahrain2020/common";
import {
  RUNOFF_WIDTH,
  TRACK_EDGE_Y,
  scrapeAt,
  tyresAtTouch,
} from "../mv/parts/bahrain2020/ground.ts";
import {
  CAR_STATIONS,
  CELL_REST,
  IMPACT_POINT,
  LEFT_DIR,
  MEDICAL_STOP_W,
  NOSE_DIR,
  PATH_DIR,
  PIERCE,
  REAR_REST,
  RIGHT_DIR,
  TEARS,
  WRECK_CAMERA_W,
  fromView,
  type P2,
  unit,
} from "../mv/parts/bahrain2020/wreck-geometry.ts";

const K = 56; // px per metre
const MAP = { x0: -10, x1: 8.6, y0: -10.6, y1: 5.6 };
const O = { x: 30 - MAP.x0 * K, y: 40 - MAP.y0 * K }; // screen point of the W origin
const S = (p: P2) => ({ x: O.x + p.x * K, y: O.y + p.y * K });
const pts = (ps: P2[]) =>
  ps.map((p) => `${S(p).x.toFixed(1)},${S(p).y.toFixed(1)}`).join(" ");
const add = (a: P2, b: P2, k = 1): P2 => ({
  x: a.x + b.x * k,
  y: a.y + b.y * k,
});
const RED = "#c8102e";
const BLUE = "#1f5fbf";
const GREEN = "#2e7d32";
const ORANGE = "#d66a00";
const PURPLE = "#6a1b9a";
const GREY = "#6f6a63";

const Label: React.FC<{
  at: P2;
  dx?: number;
  dy?: number;
  size?: number;
  color?: string;
  weight?: number;
  anchor?: "start" | "middle" | "end";
  children: React.ReactNode;
}> = ({
  at,
  dx = 0,
  dy = 0,
  size = 22,
  color = INK,
  weight = 600,
  anchor = "start",
  children,
}) => {
  const s = S(at);
  return (
    <text
      x={s.x + dx}
      y={s.y + dy}
      fontFamily={CAPTION_FONT}
      fontSize={size}
      fontWeight={weight}
      fill={color}
      textAnchor={anchor}
      stroke={PAPER}
      strokeWidth={6}
      paintOrder="stroke"
    >
      {children}
    </text>
  );
};

const Arrow: React.FC<{
  from: P2;
  to: P2;
  color: string;
  width?: number;
  dash?: string;
}> = ({ from, to, color, width = 4, dash }) => {
  const a = S(from);
  const b = S(to);
  const ang = Math.atan2(b.y - a.y, b.x - a.x);
  const h = 16;
  return (
    <g>
      <line
        x1={a.x}
        y1={a.y}
        x2={b.x - 8 * Math.cos(ang)}
        y2={b.y - 8 * Math.sin(ang)}
        stroke={color}
        strokeWidth={width}
        strokeDasharray={dash}
      />
      <path
        d={`M ${b.x} ${b.y} L ${b.x - h * Math.cos(ang - 0.38)} ${b.y - h * Math.sin(ang - 0.38)} L ${b.x - h * Math.cos(ang + 0.38)} ${b.y - h * Math.sin(ang + 0.38)} Z`}
        fill={color}
      />
    </g>
  );
};

// a car piece as a plan outline: from station a to station b along its axis (metres forward of the intact car's rear
// end), 1.7 m wide over the body, narrowing to the nose
const plan = (
  at: (m: number) => P2,
  side: P2,
  a: number,
  b: number,
  nose: boolean,
) => {
  const w = (m: number) =>
    nose && m > CAR_STATIONS.nose - 1.6
      ? 0.2 + (0.65 * (CAR_STATIONS.nose - m)) / 1.6
      : 0.85;
  const ms = Array.from({ length: 12 }, (_, i) => a + ((b - a) * i) / 11);
  return [
    ...ms.map((m) => add(at(m), side, w(m))),
    ...ms.reverse().map((m) => add(at(m), side, -w(m))),
  ];
};

// a ray of a camera's picture on the top view: from where it stands through screen column sx
const ray = (
  cam: Camera,
  pos: P2,
  look: P2,
  right: P2,
  sx: number,
  reach: number,
) => {
  const d = add(look, right, (sx - cam.cx) / cam.f);
  const n = Math.hypot(d.x, d.y);
  return add(pos, { x: d.x / n, y: d.y / n }, reach);
};

type Shot = {
  label: string;
  cam: Camera;
  x0?: number;
  x1?: number;
  reach: number;
  color: string;
  edges?: boolean;
};

export const BahrainGeometry: React.FC = () => {
  // the car at the first touch, whole (top view: MangaCar's anchor is the middle of its rear end)
  const touchRear = add(
    add(IMPACT_POINT, RIGHT_DIR, -WING_CORNER.out),
    NOSE_DIR,
    -(L_GRO - WING_CORNER.back),
  );
  // 3.2's last second, carried onto W: the right front-wing corner reaches the rails at the cut
  const s32 = shotById("3.2");
  const cut = CLOCK_32.sim(s32.to - s32.from);
  const c = rightFrontCorner(poseAtFrame(PLAN_32.gro, cut), L_GRO);
  const toW = (p: P2) => ({
    x: p.x - c.x + IMPACT_POINT.x,
    y: p.y - PLAN_32.barrierY,
  });
  const path32 = PLAN_32.gro
    .filter((_, i) => i <= cut)
    .map((p) => toW(rightFrontCorner(p, L_GRO)))
    .filter((p) => p.x > MAP.x0 - 1);
  const tyres = tyresAtTouch();
  // the rest poses
  const cellAt = (m: number) =>
    add(CELL_REST.rollHoop, NOSE_DIR, m - CAR_STATIONS.rollHoop);
  const cell = plan(
    cellAt,
    LEFT_DIR,
    CAR_STATIONS.breakLine,
    CAR_STATIONS.nose,
    true,
  );
  const rearDir = unit(REAR_REST.heading);
  const rear = plan(
    (m) => add(REAR_REST.rearEnd, rearDir, m),
    { x: -LEFT_DIR.x, y: -LEFT_DIR.y },
    0,
    CAR_STATIONS.breakLine,
    false,
  );
  // the medical car at its stop (4.75 m long, 1.9 m wide), heading along the run
  const med = MEDICAL_STOP_W.front;
  const medPoly = [
    { x: med.x, y: med.y - 0.95 },
    { x: med.x, y: med.y + 0.95 },
    { x: med.x - 4.75, y: med.y + 0.95 },
    { x: med.x - 4.75, y: med.y - 0.95 },
  ];
  // GRO's way out in 3.6 (V → W) and where the doctor and the marshal stand
  const s36 = shotById("3.6");
  const end36 = cueFrame("bahrain2020.black") - s36.from;
  const groWalk = Array.from({ length: 16 }, (_, i) =>
    fromView(stage36((end36 * i) / 15).groAt),
  );
  const doc0 = fromView(stage36(0).docAt);
  const marshal = fromView(MARSHAL_AT);
  // the shots' cameras (the wreck camera's spot; zoomed copies, so the same lens axis, different framing)
  const W = WRECK_CAMERA_W;
  const s34 = shotById("3.4");
  const R = PANEL_RECTS;
  const shots: Shot[] = [
    { label: "3.3", cam: IMPACT_CAM, reach: 15.5, color: BLUE, edges: true },
    { label: "3.4 start", cam: wreckShotCam(s34.from), reach: 12.4, color: PURPLE },
    { label: "3.4 end", cam: wreckShotCam(s34.to - 1), reach: 8.6, color: PURPLE },
    { label: "3.5 p1 (0s)", cam: PANEL_CAMS.pry(R[0]), x0: R[0].x, x1: R[0].x + R[0].w, reach: 12.2, color: ORANGE },
    { label: "3.5 p3", cam: PANEL_CAMS.extinguisher(R[2]), x0: R[2].x, x1: R[2].x + R[2].w, reach: 6.9, color: ORANGE },
    { label: "3.5 p4 (27s)", cam: PANEL_CAMS.climb(R[3]), x0: R[3].x, x1: R[3].x + R[3].w, reach: 9.6, color: ORANGE },
    { label: "3.6", cam: escapeCam(s36.from), reach: 7.6, color: GREEN },
    { label: "finale", cam: finaleCam(cueFrame("bahrain2020.halo")), reach: 11.4, color: INK, edges: true },
  ];
  // the 11 s panel's camera stands 8.4 m behind the medical car, off the top of the map
  const M = MEDICAL_CAMERA_W;
  const medCam = PANEL_CAMS.medical(R[1]);
  const medEdges = [R[1].x, R[1].x + R[1].w].map((sx) =>
    ray(medCam, M.at, M.look, M.right, sx, 18),
  );
  const yawArc = (r: number, a0: number, a1: number) => {
    const p0 = S(add(IMPACT_POINT, unit(a0), r));
    const p1 = S(add(IMPACT_POINT, unit(a1), r));
    return `M ${p0.x} ${p0.y} A ${r * K} ${r * K} 0 0 1 ${p1.x} ${p1.y}`;
  };
  const mapRect = {
    x: S({ x: MAP.x0, y: 0 }).x,
    y: S({ x: 0, y: MAP.y0 }).y,
    w: (MAP.x1 - MAP.x0) * K,
    h: (MAP.y1 - MAP.y0) * K,
  };
  const legend: [string, number, number, string?][] = [
    ["BAHRAIN 2020 · LAP 1 · THE HIT, FROM ABOVE", 30, 700],
    ["Top view, metres. Everything from wreck-geometry.ts.", 18, 400, GREY],
    ["", 8, 400],
    ["What the sources say", 22, 700],
    ["FIA summary (2021-03-05): the contact with KVY “forc[ed] it", 18, 400],
    ["to yaw to the right”; it hit the barrier “at an angle of 29", 18, 400],
    ["degrees, with an estimated yaw of 22 degrees to the", 18, 400],
    ["direction of travel”, at 192 km/h, 67 g.", 18, 400],
    ["→ path 29° to the barrier (blue); nose yawed 22° further", 18, 700, RED],
    ["   right, INTO the barrier: body at 51° (red).", 18, 700, RED],
    ["Check: at 29° − 22° = 7° it would have gone in almost", 18, 400],
    ["side-on; it went in nose first, the nose prising the rails", 18, 400],
    ["apart and through the slots (G. Anderson, The Race).", 18, 400],
    ["Cell “pierced the barrier … came to rest behind the barrier,", 18, 400],
    ["constrained by the primary roll structure against the upper", 18, 400],
    ["rail”; middle rail failed, top and bottom deformed (FIA).", 18, 400],
    ["Rear half “pointing in the wrong direction”; looking “to", 18, 400],
    ["the right … a big gap in the armco”; “get him over the", 18, 400],
    ["barrier” (Ian Roberts, FIA medical car, Autosport).", 18, 400],
    ["", 8, 400],
    ["The model", 22, 700],
    [`First touch: right front-wing corner. Slide to rest ${PIERCE.toFixed(1)} m.`, 18, 400],
    [`Cell at rest: roll hoop on the rail line, nose ${CELL_REST.nose.y.toFixed(1)} m beyond.`, 18, 400],
    ["Torn: middle rail from the first touch (red bar); top", 18, 400],
    ["and bottom only where the cell went through (grey bars).", 18, 400],
    ["GRO climbs out over the cockpit's left side, which", 18, 400],
    ["sticks out on the track side, and walks back to the track.", 18, 400],
    ["Not in any source (schematic): where the rear half lies", 18, 700, ORANGE],
    ["and its exact angle, the medical car's stop, the cell's", 18, 700, ORANGE],
    ["angle at rest (kept at 51°).", 18, 700, ORANGE],
    ["", 8, 400],
    ["Cameras", 22, 700],
    ["3.2 is the overhead top view (this map's orientation).", 18, 400],
    ["3.3–3.6 and the finale: one trackside camera, square to the", 18, 400],
    ["cell's left flank, 3.2 m up (black dot); each shot frames", 18, 400],
    ["its own part (rays: centre of picture; 3.3 and finale with", 18, 400],
    ["edges). The 11 s panel's camera is square to the medical car.", 18, 400],
    ["Every picture is flipped left↔right (manga flip), so the car", 18, 400],
    ["runs left → right on screen, as in 3.2.", 18, 400],
  ];
  return (
    <AbsoluteFill style={{ backgroundColor: PAPER }}>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080">
        <defs>
          <clipPath id="geo-map">
            <rect x={mapRect.x} y={mapRect.y} width={mapRect.w} height={mapRect.h} />
          </clipPath>
        </defs>
        <g clipPath="url(#geo-map)">
          <rect x={0} y={S({ x: 0, y: 0 }).y} width={1920} height={1080} fill="#ddd8cf" />
          {/* 3.3's ground (ground.ts): the track beyond its white edge line, the run-off to the barrier */}
          <rect x={0} y={0} width={1920} height={S({ x: 0, y: TRACK_EDGE_Y }).y} fill="#ebe6dc" />
          <line x1={0} y1={S({ x: 0, y: TRACK_EDGE_Y }).y} x2={1920} y2={S({ x: 0, y: TRACK_EDGE_Y }).y} stroke={INK} strokeWidth={9} />
          <line x1={0} y1={S({ x: 0, y: TRACK_EDGE_Y }).y} x2={1920} y2={S({ x: 0, y: TRACK_EDGE_Y }).y} stroke={PAPER} strokeWidth={5} />
          {Array.from({ length: 30 }, (_, i) => Math.ceil(MAP.x0) + i).map((x) => (
            <line key={`gx${x}`} x1={S({ x, y: 0 }).x} y1={0} x2={S({ x, y: 0 }).x} y2={1080} stroke="#000" strokeOpacity={0.06} />
          ))}
          {Array.from({ length: 30 }, (_, i) => Math.ceil(MAP.y0) + i).map((y) => (
            <line key={`gy${y}`} x1={0} y1={S({ x: 0, y }).y} x2={1920} y2={S({ x: 0, y }).y} stroke="#000" strokeOpacity={0.06} />
          ))}
          {/* cameras first, under everything */}
          <polyline points={pts([medEdges[0], M.at, medEdges[1]])} fill="none" stroke={GREEN} strokeWidth={2} strokeDasharray="10 7" />
          {shots.map((s) => {
            const mid = ((s.x0 ?? 0) + (s.x1 ?? 1920)) / 2;
            const centre = ray(s.cam, W.at, W.look, W.right, mid, s.reach);
            const edges = [s.x0 ?? 0, s.x1 ?? 1920].map((sx) =>
              ray(s.cam, W.at, W.look, W.right, sx, s.reach),
            );
            return (
              <g key={s.label}>
                {s.edges ? (
                  <polyline points={pts([edges[0], W.at, edges[1]])} fill="none" stroke={s.color} strokeWidth={2} strokeDasharray="10 7" />
                ) : null}
                <polyline points={pts([W.at, centre])} stroke={s.color} strokeWidth={2.5} strokeOpacity={0.8} />
                <circle cx={S(centre).x} cy={S(centre).y} r={5} fill={s.color} />
              </g>
            );
          })}
          {/* the barrier, with the torn stretches of each rail */}
          <polyline points={pts([{ x: MAP.x0, y: 0 }, { x: MAP.x1, y: 0 }])} stroke={INK} strokeWidth={8} />
          {[0, 2, 1].map((r) => (
            <polyline
              key={r}
              points={pts([
                { x: TEARS[r][0], y: 0.22 + r * 0.2 },
                { x: TEARS[r][1], y: 0.22 + r * 0.2 },
              ])}
              stroke={r === 1 ? RED : GREY}
              strokeWidth={7}
            />
          ))}
          {/* 3.2's last second (right front-wing corner), then the slide through the barrier */}
          <polyline points={pts(path32)} fill="none" stroke={BLUE} strokeWidth={3} strokeDasharray="10 7" />
          {/* 3.3's tyre marks: each tyre's line along the 29° path, up to where it was on the first touch */}
          {tyres.map((p, i) => (
            <polyline key={`tm${i}`} points={pts([add(p, PATH_DIR, (MAP.x0 - 1 - p.x) / PATH_DIR.x), p])} stroke={GREY} strokeWidth={4} strokeOpacity={0.75} />
          ))}
          {/* where the far side scrapes the rails as it slides in: 3.3's sparks come off this stretch */}
          <polyline points={pts([{ x: IMPACT_POINT.x, y: -0.12 }, { x: scrapeAt(PIERCE).x, y: -0.12 }])} stroke={ORANGE} strokeWidth={9} />
          {/* the car at the first touch */}
          <g opacity={0.85}>
            <MangaCar car={VF20} view="top" at={{ ...S(touchRear), pxPerMetre: K }} state={{ heading: BODY_ANGLE }} />
          </g>
          {/* the angles at the touch */}
          <polyline points={pts([IMPACT_POINT, add(IMPACT_POINT, { x: 1, y: 0 }, 6.4)])} stroke={INK} strokeWidth={2} strokeDasharray="5 5" />
          <path d={yawArc(4.2, 0, IMPACT_ANGLE)} fill="none" stroke={BLUE} strokeWidth={3} />
          <path d={yawArc(3.0, IMPACT_ANGLE, BODY_ANGLE)} fill="none" stroke={RED} strokeWidth={4} />
          <Arrow from={IMPACT_POINT} to={add(IMPACT_POINT, PATH_DIR, PIERCE + 0.4)} color={BLUE} width={4} />
          <Arrow from={IMPACT_POINT} to={add(IMPACT_POINT, unit(BODY_ANGLE), 5.2)} color={RED} width={4} />
          <circle cx={S(IMPACT_POINT).x} cy={S(IMPACT_POINT).y} r={10} fill={ORANGE} stroke={INK} strokeWidth={2} />
          {/* rest poses */}
          <polygon points={pts(cell)} fill={RED} fillOpacity={0.3} stroke={RED} strokeWidth={3} />
          <polygon points={pts(rear)} fill={GREY} fillOpacity={0.35} stroke={INK} strokeWidth={2.5} />
          <circle cx={S(CELL_REST.rollHoop).x} cy={S(CELL_REST.rollHoop).y} r={7} fill={INK} />
          <polygon points={pts(medPoly)} fill="#fff" stroke={GREEN} strokeWidth={3} />
          {/* people in 3.6 */}
          <polyline points={pts(groWalk)} fill="none" stroke={INK} strokeWidth={3} />
          <circle cx={S(groWalk[groWalk.length - 1]).x} cy={S(groWalk[groWalk.length - 1]).y} r={6} fill={INK} />
          <circle cx={S(doc0).x} cy={S(doc0).y} r={6} fill={GREEN} />
          <circle cx={S(marshal).x} cy={S(marshal).y} r={6} fill={ORANGE} />
          <circle cx={S(W.at).x} cy={S(W.at).y} r={11} fill={INK} />
          {/* labels */}
          {shots.map((s) => {
            const mid = ((s.x0 ?? 0) + (s.x1 ?? 1920)) / 2;
            const p = ray(s.cam, W.at, W.look, W.right, mid, s.reach);
            return (
              <Label key={s.label} at={p} dx={-10} dy={6} size={19} color={s.color} anchor="end">
                {s.label}
              </Label>
            );
          })}
          <Label at={{ x: MAP.x1 - 0.3, y: TRACK_EDGE_Y - 0.35 }} size={20} anchor="end">
            {`track edge, white line (run-off ${RUNOFF_WIDTH.toFixed(1)} m, as 3.2)`}
          </Label>
          <Label at={add(tyres[3], PATH_DIR, (MAP.x0 + 0.3 - tyres[3].x) / PATH_DIR.x)} dy={34} size={18} color={GREY}>
            3.3: tyre marks along the 29° path
          </Label>
          {/* the sparks' stretch: a leader to its note, clear of the labels round the touch */}
          <polyline
            points={pts([
              { x: (IMPACT_POINT.x + scrapeAt(PIERCE).x) / 2, y: -0.12 },
              { x: MAP.x0 + 4.6, y: 2.45 },
            ])}
            stroke={ORANGE}
            strokeWidth={2}
          />
          <Label at={{ x: MAP.x0 + 0.3, y: 2.75 }} size={18} color={ORANGE}>
            3.3: sparks where the far side scrapes the rails
          </Label>
          <Label at={W.at} dx={16} dy={-14} size={20}>
            wreck camera
          </Label>
          <Label at={{ x: MAP.x0 + 0.3, y: -0.45 }} size={24} weight={700}>
            TRACK SIDE (run-off)
          </Label>
          <Label at={{ x: 2.6, y: 5.0 }} size={24} weight={700}>
            BEYOND THE BARRIER
          </Label>
          <Label at={{ x: 3.4, y: 0.95 }} size={20}>
            triple guardrail (right of the run)
          </Label>
          <Arrow from={{ x: MAP.x0 + 0.4, y: MAP.y0 + 1.6 }} to={{ x: MAP.x0 + 4.6, y: MAP.y0 + 1.6 }} color={INK} width={4} />
          <Label at={{ x: MAP.x0 + 0.4, y: MAP.y0 + 1.2 }} size={20}>
            race direction (3.2 runs this way)
          </Label>
          <Label at={{ x: MAP.x0 + 0.2, y: path32[0].y - 0.5 }} size={18} color={BLUE}>
            3.2: GRO's last second (wing corner)
          </Label>
          <Label at={IMPACT_POINT} dx={-14} dy={42} size={20} color={ORANGE} anchor="end">
            first touch
          </Label>
          <Label at={add(IMPACT_POINT, unit(IMPACT_ANGLE * 0.45), 4.4)} dx={10} dy={10} size={24} color={BLUE} weight={700}>
            path 29°
          </Label>
          <Label at={add(IMPACT_POINT, unit(BODY_ANGLE), 5.2)} dx={14} dy={6} size={24} color={RED} weight={700}>
            body 51°
          </Label>
          {/* the yaw: a leader from the arc to its note */}
          <polyline
            points={pts([
              add(IMPACT_POINT, unit((IMPACT_ANGLE + BODY_ANGLE) / 2), 3.0),
              { x: MAP.x0 + 3.2, y: 3.55 },
            ])}
            stroke={RED}
            strokeWidth={2}
          />
          <Label at={{ x: MAP.x0 + 0.3, y: 3.95 }} size={22} color={RED} weight={700}>
            yaw 22° to the right: nose further INTO the barrier
          </Label>
          <Label at={CELL_REST.nose} dx={12} dy={10} size={20} color={RED}>
            cell at rest
          </Label>
          <Label at={REAR_REST.breakLine} dx={-6} dy={-14} size={18} anchor="end">
            rear half, reversed
          </Label>
          <Label at={{ x: med.x - 2.4, y: med.y + 0.2 }} size={18} color={GREEN} anchor="middle">
            medical car (11 s)
          </Label>
          <Label at={add(M.at, { x: 0, y: 1 }, -M.at.y + MAP.y0 + 0.6)} dx={14} size={18} color={GREEN}>
            ↑ 11 s panel camera, 8.4 m back
          </Label>
          <Label at={groWalk[groWalk.length - 1]} dx={-8} dy={-10} size={18} anchor="end">
            GRO walks out (3.6)
          </Label>
          <Label at={marshal} dx={10} dy={-6} size={18} color={ORANGE}>
            marshal
          </Label>
          <Label at={doc0} dx={10} dy={-6} size={18} color={GREEN}>
            doctor
          </Label>
          {/* scale bar */}
          <line x1={S({ x: MAP.x0 + 0.4, y: 0 }).x} y1={S({ x: 0, y: MAP.y1 - 0.4 }).y} x2={S({ x: MAP.x0 + 5.4, y: 0 }).x} y2={S({ x: 0, y: MAP.y1 - 0.4 }).y} stroke={INK} strokeWidth={5} />
          <Label at={{ x: MAP.x0 + 0.4, y: MAP.y1 - 0.7 }} size={18}>
            5 m · 1 m grid
          </Label>
        </g>
        <rect x={mapRect.x} y={mapRect.y} width={mapRect.w} height={mapRect.h} fill="none" stroke={INK} strokeWidth={3} />
        <g fontFamily={CAPTION_FONT}>
          {legend.map(([t, size, w, color], i) => {
            const y = 66 + legend.slice(0, i).reduce((a, [, s]) => a + s * 1.42, 0);
            return (
              <text key={i} x={1140} y={y} fontSize={size} fontWeight={w} fill={color ?? INK}>
                {t}
              </text>
            );
          })}
        </g>
      </svg>
    </AbsoluteFill>
  );
};
