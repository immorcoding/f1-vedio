// Shot 1.5 (bars 22–23): title card, a page turn. The finished 1989 page — drawn by the 1989 part itself
// (suzuka1989/Title.tsx: the figure-eight, the chicane ringed and blown up in its callout, "SUZUKA 1989 / TEAM-MATES · RIVALS")
// — turns over on 22.1 like a manga page, and under it is the same circuit on a fresh page in the same hand:
// "SUZUKA 1990" is lettered in and the ring lands on Turn 1, where this year's crash happens. PRO's helmet card drops
// into his slot of 1.2 (top left) in the 1989 McLaren and flips over on 23.1: the same helmet — a driver keeps his
// helmet when he changes team — now sits in the red Ferrari, "PRO MOVES TO FERRARI". Then the stakes slam in on 23.2 in the
// shared points box (#17: SEN 78 · PRO 69, gold on SEN's 78 on 23.3), and on the last beats
// the page pushes in toward the main straight and Turn 1, into the top view of shot 1.6.
import { Easing } from "remotion";
import { F641_PRO, MP4_5_PRO } from "../../../cars";
import { INK, PAPER } from "../../../kit/colors";
import { InkFilterDef, inkFilter } from "../../../kit/ink";
import { CircuitTag, TitleText, circuitAnim } from "../../../kit/lettering";
import { foldAt, leftOfFold, PageFlap } from "../../../kit/page-turn";
import { ToneDefs } from "../../../kit/tone";
import { fitMap, poseAt, SUZUKA_1989, TrackMap } from "../../../tracks";
import { PointsBox } from "../../../kit/points-box";
import { scoreColumns } from "../../points";
import { CARD_PRO, CardCaption, HelmetCard } from "../suzuka1989/Helmets";
import { Title89Page } from "../suzuka1989/Title";
import { cueFrame, ramp, shotById, type PictureProps } from "./common";

const T = SUZUKA_1989;
// The same map frame, ribbon width and ring as the 1989 page, so the two pages read as one book.
const VIEW = fitMap(T, { x: 760, y: 120, w: 1100, h: 860 }, 0);
const W = 1920;
const H = 1080;

// The stakes box: numeral size and centre (its left edge where v1's caption box began, x = 120, top at y = 790).
const STAKES_SIZE = 120;
const STAKES_AT = { x: 290, y: 790 + (STAKES_SIZE * 1.49) / 2 };

// The 1990 page: the inked lap, the Turn 1 ring, the title, PRO's card and the stakes.
const Page: React.FC<{
  title: string;
  ring: number;
  title01: number;
  card: number;
  flip: number;
  move: number;
  // the stakes before the race (facts.md: SEN leads PRO by 9 points with two races left; the crash that put both out
  // here settled the title for SEN): seconds since the points box slams in, and since its gold stroke
  stakes: number;
  stakesGold: number;
  // PRO's move (facts.md: Prost drove Ferrari #1 in 1990)
  moveText: string;
  circuit: string;
  circuitT: { strip: number; name: number };
}> = ({
  title,
  circuit,
  circuitT,
  ring,
  title01,
  card,
  flip,
  move,
  stakes,
  stakesGold,
  moveText,
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
        <TitleText x={0} y={0} size={124} text={title} />
      </g>
      <CircuitTag x={114} y={644} text={circuit} {...circuitT} />
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
      {/* the stakes, in the left column under the title where v1's caption stood */}
      <g transform={`translate(${STAKES_AT.x} ${STAKES_AT.y}) rotate(-2)`}>
        <PointsBox
          columns={scoreColumns("suzuka1990")}
          size={STAKES_SIZE}
          since={stakes}
          goldSince={stakesGold}
        />
      </g>
    </g>
  );
};

export const Title: React.FC<PictureProps> = ({ f }) => {
  const shot = shotById("1.5");
  const flip = cueFrame("suzuka1990.flip");
  const t = f - shot.from;
  const len = shot.to - shot.from;
  // the fold sweeps from the right edge to past the left edge
  const turn = ramp(f, flip + 4, flip + 58, Easing.inOut(Easing.quad));
  const c = foldAt(turn);
  const title = ramp(t, 40, 66, Easing.out(Easing.back(2)));
  const card = ramp(t, 58, 74, Easing.out(Easing.back(1.4)));
  const ring = ramp(t, 74, 92, Easing.out(Easing.back(1.6)));
  // the card turns over across 23.1: edge-on exactly on the beat
  const moveAt = cueFrame("suzuka1990.move");
  const cardFlip = ramp(
    f,
    moveAt - 12,
    moveAt + 12,
    Easing.inOut(Easing.cubic),
  );
  const move = ramp(f, moveAt + 6, moveAt + 20, Easing.out(Easing.back(1.6)));
  const stakes = (f - cueFrame("suzuka1990.stakes")) / 60;
  const stakesGold = (f - cueFrame("suzuka1990.stakesGold")) / 60;
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
          <path d={leftOfFold(c)} />
        </clipPath>
      </defs>
      <rect width={W} height={H} fill={PAPER} />
      <g filter={inkFilter()}>
        <g
          transform={`translate(${t1.x} ${t1.y}) scale(${zoom}) translate(${-t1.x} ${-t1.y})`}
        >
          <Page
            title={shot.text[0]}
            circuit={shot.text[1]}
            circuitT={circuitAnim(t, 62)}
            ring={ring}
            title01={title}
            card={card}
            flip={cardFlip}
            move={move}
            stakes={stakes}
            stakesGold={stakesGold}
            moveText={shot.text[2]}
          />
        </g>
      </g>
      {turn < 1 ? (
        <g>
          {/* the 1989 page, still lying on the left of the fold (inked by its own picture) */}
          <g clipPath="url(#s15-left)">
            <Title89Page />
          </g>
          <PageFlap c={c} />
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
