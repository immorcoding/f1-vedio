// Shot 1.5 (bars 21–22): title card, a page turn. The finished 1989 page — drawn by the 1989 part itself
// (suzuka1989/Title.tsx: the figure-eight, the chicane ringed and blown up in its callout, "1989 · 铃鹿 / 队友 · 宿敌")
// — turns over on 21.1 like a manga page, and under it is the same circuit on a fresh page in the same hand:
// "1990 · 铃鹿" is brushed in and the ring lands on Turn 1, where this year's crash happens. PRO's helmet card drops
// into his slot of 1.2 (top left) in the 1989 McLaren and flips over on 22.1: the same helmet — a driver keeps his
// helmet when he changes team — now sits in the red Ferrari, "PRO 转投法拉利". Then the stakes, and on the last beats
// the page pushes in toward the main straight and Turn 1, into the top view of shot 1.6.
import { Easing } from "remotion";
import { F641_PRO, MP4_5_PRO } from "../../../cars";
import { INK, PAPER } from "../../../kit/colors";
import { InkFilterDef, inkFilter } from "../../../kit/ink";
import { BRUSH_FONT, Caption } from "../../../kit/lettering";
import { ToneDefs, tone } from "../../../kit/tone";
import { fitMap, poseAt, SUZUKA_1989, TrackMap } from "../../../tracks";
import { CARD_PRO, CardCaption, HelmetCard } from "../suzuka1989/Helmets";
import { Title89Page } from "../suzuka1989/Title";
import { cueFrame, ramp, shotById, type PictureProps } from "./common";

const T = SUZUKA_1989;
// The same map frame, ribbon width and ring as the 1989 page, so the two pages read as one book.
const VIEW = fitMap(T, { x: 760, y: 120, w: 1100, h: 860 }, 0);
const W = 1920;
const H = 1080;

type Pt = { x: number; y: number };

// The 1990 page: the inked lap, the Turn 1 ring, the brushed title, PRO's card and the stakes.
const Page: React.FC<{
  title: string;
  ring: number;
  title01: number;
  card: number;
  flip: number;
  move: number;
  stakes: number;
  // PRO's move (facts.md: Prost drove Ferrari #1 in 1990) and the stakes before the race (facts.md: SEN leads PRO by 9
  // points with two races left; the crash that put both out here settled the title for SEN)
  moveText: string;
  stakesText: string;
}> = ({
  title,
  ring,
  title01,
  card,
  flip,
  move,
  stakes,
  moveText,
  stakesText,
}) => {
  const c = VIEW.project(poseAt(T, T.corners.turn1Apex));
  // the card flips about its vertical middle: the McLaren face turns away, the Ferrari face turns in
  const sx = Math.abs(Math.cos(Math.PI * flip));
  const ferrari = flip >= 0.5;
  const cx = CARD_PRO.x + CARD_PRO.w / 2;
  const cy = CARD_PRO.y + CARD_PRO.h / 2;
  const dropY = -(1 - card) * (CARD_PRO.y + CARD_PRO.h + 140);
  return (
    <g>
      <rect width={W} height={H} fill={PAPER} />
      <TrackMap track={T} view={VIEW} shadow finish road={15} />
      {ring > 0 ? (
        <circle
          cx={c.x}
          cy={c.y}
          r={40 * ring}
          fill="none"
          stroke={INK}
          strokeWidth={6}
        />
      ) : null}
      <g
        opacity={title01}
        transform={`translate(110 610) scale(${0.85 + 0.15 * title01})`}
      >
        <text x={0} y={0} fontFamily={BRUSH_FONT} fontSize={150} fill={INK}>
          {title}
        </text>
        <path
          d="M 6 40 L 560 28"
          stroke={INK}
          strokeWidth={8}
          strokeLinecap="round"
        />
      </g>
      {card > 0 ? (
        <g
          transform={`translate(0 ${dropY}) rotate(${(1 - card) * -4} ${cx} ${cy})`}
        >
          <g
            transform={`translate(${cx} 0) scale(${Math.max(0.02, sx)} 1) translate(${-cx} 0)`}
          >
            <HelmetCard
              car={ferrari ? F641_PRO : MP4_5_PRO}
              box={CARD_PRO}
              id={ferrari ? "s15-pro-ferrari" : "s15-pro-mclaren"}
              seed={3}
              shadow
            />
          </g>
          {move > 0 ? (
            <g opacity={move}>
              <CardCaption box={CARD_PRO} text={moveText} />
            </g>
          ) : null}
        </g>
      ) : null}
      {stakes > 0 ? (
        <g
          opacity={stakes}
          transform={`translate(${120 - 30 * (1 - stakes)} 740)`}
        >
          <Caption x={0} y={0} w={640} h={96} lines={[stakesText]} size={50} />
        </g>
      ) : null}
    </g>
  );
};

// The fold of the turning page: the line x = c + K (y − H/2). The old page keeps the part left of it; the part right of
// it is lifted and lies folded over, mirrored across the line.
const K = 0.42;
const side = (p: Pt, c: number) => p.x - (c + K * (p.y - H / 2));
const clipRight = (poly: Pt[], c: number): Pt[] => {
  const out: Pt[] = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    const sa = side(a, c);
    const sb = side(b, c);
    if (sa >= 0) out.push(a);
    if (sa * sb < 0) {
      const u = sa / (sa - sb);
      out.push({ x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u });
    }
  }
  return out;
};
const reflect = (p: Pt, c: number): Pt => {
  const n = Math.hypot(K, 1);
  const d = { x: K / n, y: 1 / n };
  const A = { x: c, y: H / 2 };
  const t = (p.x - A.x) * d.x + (p.y - A.y) * d.y;
  const foot = { x: A.x + t * d.x, y: A.y + t * d.y };
  return { x: 2 * foot.x - p.x, y: 2 * foot.y - p.y };
};
const poly = (pts: Pt[]) =>
  pts.length
    ? `M ${pts.map((p) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" L ")} Z`
    : "";

export const Title: React.FC<PictureProps> = ({ f }) => {
  const shot = shotById("1.5");
  const flip = cueFrame("suzuka1990.flip");
  const t = f - shot.from;
  const len = shot.to - shot.from;
  // the fold sweeps from the right edge to past the left edge
  const turn = ramp(f, flip + 4, flip + 58, Easing.inOut(Easing.quad));
  const c = W + 700 - (W + 2200) * turn;
  const page = [
    { x: 0, y: 0 },
    { x: W, y: 0 },
    { x: W, y: H },
    { x: 0, y: H },
  ];
  const lifted = clipRight(page, c);
  const flap = lifted.map((p) => reflect(p, c));
  const left = `M -2000 -2000 L ${c + K * (-2000 - H / 2)} -2000 L ${c + K * (3000 - H / 2)} 3000 L -2000 3000 Z`;
  const title = ramp(t, 40, 66, Easing.out(Easing.back(2)));
  const card = ramp(t, 58, 74, Easing.out(Easing.back(1.4)));
  const ring = ramp(t, 74, 92, Easing.out(Easing.back(1.6)));
  // the card turns over across 22.1: edge-on exactly on the beat
  const moveAt = cueFrame("suzuka1990.move");
  const cardFlip = ramp(
    f,
    moveAt - 12,
    moveAt + 12,
    Easing.inOut(Easing.cubic),
  );
  const move = ramp(f, moveAt + 6, moveAt + 20, Easing.out(Easing.back(1.6)));
  const stakes = ramp(t, 132, 148, Easing.out(Easing.back(1.6)));
  // the push-in toward Turn 1 and the main straight on the last beats
  const push = ramp(t, len - 46, len, Easing.in(Easing.cubic));
  const t1 = VIEW.project(poseAt(T, 200));
  // a slow drift in while the title holds, then the push-in
  const zoom = 1 + 0.05 * ramp(t, 40, len - 46, Easing.linear) + 5 * push;
  return (
    <svg viewBox="0 0 1920 1080" width={1920} height={1080}>
      <defs>
        <ToneDefs />
        <InkFilterDef />
        <clipPath id="s15-left">
          <path d={left} />
        </clipPath>
      </defs>
      <rect width={W} height={H} fill={PAPER} />
      <g filter={inkFilter()}>
        <g
          transform={`translate(${t1.x} ${t1.y}) scale(${zoom}) translate(${-t1.x} ${-t1.y})`}
        >
          <Page
            title={shot.text[0]}
            ring={ring}
            title01={title}
            card={card}
            flip={cardFlip}
            move={move}
            stakes={stakes}
            moveText={shot.text[1]}
            stakesText={shot.text[2]}
          />
        </g>
      </g>
      {turn < 1 ? (
        <g>
          {/* the 1989 page, still lying on the left of the fold (inked by its own picture) */}
          <g clipPath="url(#s15-left)">
            <Title89Page />
          </g>
          <g filter={inkFilter()}>
            {/* shadow the turning page throws on the new one */}
            <path
              d={poly(flap)}
              fill={tone("mid")}
              opacity={0.35}
              transform="translate(18 14)"
            />
            {/* the back of the turning page */}
            <path d={poly(flap)} fill={PAPER} />
            <path d={poly(flap)} fill={tone("light")} opacity={0.5} />
            <path
              d={poly(flap)}
              fill="none"
              stroke={INK}
              strokeWidth={5}
              strokeLinejoin="round"
            />
          </g>
        </g>
      ) : null}
      <g filter={inkFilter()}>
        <rect
          x={0}
          y={0}
          width={W}
          height={H}
          fill="none"
          stroke={INK}
          strokeWidth={18}
        />
      </g>
    </svg>
  );
};
