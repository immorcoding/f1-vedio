// Picture for 片尾彩蛋, the post-credits stinger (shots.ts has the beat plan). One continuous take after a beat of black:
//   1.2–1.3  the lights come up on a static trackside close-up at Yas Marina by night (the 2021 part's set, ART-8 B/W).
//        On the left stand two posts: the banner, a cloth printed with the words and the end title's chequered strip
//        (ART-32), is rolled tight round the first (its plain back outward), its free end tied to the second;
//   1.4  Clawd hops in from the left carrying the chequered flag, one hop per beat, landing on the kick, with squash and
//        stretch; it picks up the second post and carries it right, so the cloth unrolls between the posts (sagging a
//        little, bouncing with each hop) and "MADE BY / Immor × Claude" appears only where it has already been (it
//        never covers the words, ART-14); on bar 3 beat 4 it plants the post with a thunk, and the banner hangs between
//        two fixed posts as cloth;
//   bar 4  VER's RB18 #1 shoots past behind at race speed: the only fast thing on screen (the camera stays still, no
//        speed lines on the scene; the car alone smears and trails a few lines; its gust runs a ripple along the cloth), hard-freezing for 3 frames centred in
//        the frame on the whoosh peak (paper flash, focus lines) so it reads as VER's #1. Its wind ruffles Clawd.
//        Clawd keeps hopping on the spot, humming (a note over its head);
//   bar 5  the last landing on beat 1; the late double-take on beat 2 with a shout POLE AGAIN?! bursting out next to its
//        head (Bangers, no box; VER took pole at Yas Marina in 2021 and 2022, facts.md); the startled jump on beat 3 (!!, BOING!) and the flag flies out of its
//        hands; on beat 4 the flag falls back over the camera, covers the frame and wipes it to black (STO-10).
// Every beat is a frame from the beat map (frameAt via the edit list's cues); the car and the camera are real-size
// through the pinhole camera (ART-9).
import { AbsoluteFill, Easing } from "remotion";
import { carLength, MangaCar, RB18, wheelAngleAt } from "../../../cars";
import { pinhole } from "../../../kit/camera";
import { INK, PAPER } from "../../../kit/colors";
import {
  CAPTION_FONT,
  CircuitTag,
  lean,
  measure,
  SFX_FONT,
  Sfx,
  TITLE_FONT,
  titleWidth,
  useLettering,
} from "../../../kit/lettering";
import { focusLines, speedLines } from "../../../kit/lines";
import { ChequeredFlag } from "../../../scenes/abu-dhabi-2021/ChequeredFlag";
import { Closeup, PANEL, trackLayout } from "../../../scenes/abu-dhabi-2021/Closeup";
import { useSongFrame } from "../../clock";
import type { SceneProps } from "../../scenes";
import { FPS, FRAMES_PER_BEAT, frameAt, type Pos } from "../../timing";
import { cueAt, hit, smooth } from "../abuDhabi2021/shotClock";
import { Clawd, clawdHands, clawdSize, type ClawdPose } from "./Clawd";
import { cb, EDIT } from "./shots.ts";

const F = (p: Pos) => frameAt(p);
const cue = (id: string) => F(cueAt(EDIT, id));

// ── beats, as frames ─────────────────────────────────────────────────────────────────────────────────────────────────
const LIGHTS_AT = cue("credits.lights");
const LIGHTS_UP = F(cb(1, 3));
const HOP_IN = cue("credits.hopIn");
const PASS_AT = cue("credits.pass");
const DOUBLE_TAKE = cue("credits.doubleTake");
const JUMP = cue("credits.jump");
const FLAG_FALL = cue("credits.flagFall");
const BLACK = F(cb(6));
/** Landing frames: 13 landings, one per beat from bar 2 beat 1 to bar 5 beat 1. */
const LANDINGS = Array.from({ length: 13 }, (_, k) => F(cb(2 + Math.floor(k / 4), 1 + (k % 4))));
/** The walk ends on the 8th landing, bar 3 beat 4, where Clawd plants the second post; after it it hops on the spot. */
const WALK_LANDINGS = 7;

// ── the camera and the set: a static low trackside camera, the car's lane behind Clawd ─────────────────────────────
const cam = pinhole({ f: 1500, horizon: 160, cx: 960, height: 1.25 });
const LAYOUT = trackLayout(-60, 60, { x0: 20, x1: 90, z: 520, top: 38 });
const TILT = -3; // the outro banner's tilt
const CAR_Z = 10.5;
const CAR_V = 78; // m/s, ~280 km/h down the straight
const GROUND = 965; // Clawd's feet (in the tilted panel's frame)
const PW = 18; // Clawd's block width, px

// ── the banner: the end title's banner and strip (outro/Flag.tsx FlagTitle: title size 150, baseline 540 + 0.26·150,
// strip 26 below it, 34 px CircuitTag), standing rolled up by the track ──────────────────────────────────────────────────────────────────────────────
const OUTRO_TITLE = "F1 · 1989–2021";
const STRIP = 34;
const SQ = Math.round(STRIP * 0.42);
const OUTRO_BASE = 540 + 150 * 0.26;
const STRIP_Y = OUTRO_BASE + 26;
const BANNER = { top: 405, bottom: 675 };
const NAMES = "Immor × Claude";
const MADE_BY = "MADE BY";
const BS_K = 1.12; // TitleText's Big Shoulders scale (kit/lettering.tsx)

const layout = () => {
  const checks = Math.round(titleWidth(OUTRO_TITLE, 150) / SQ);
  const stripW = checks * SQ;
  // set left of centre, with room past the words for the second post and Clawd
  const x0 = 960 - stripW / 2 - 122;
  // the names span the strip, a little under the prototype's 172 px title
  const per = measure(NAMES, TITLE_FONT, 900, 100 * BS_K, 0.01) / 100;
  const size = Math.min(140, stripW / per);
  const namesW = per * size;
  const left = x0 - 90;
  // where the banner is fully open: well past the words and the strip
  const end = x0 + Math.max(stripW, namesW) + 200;
  // the right end of the words (the 8° lean pushes the tops of the letters right)
  const textRight = x0 + 8 + namesW + Math.tan((8 * Math.PI) / 180) * 0.72 * size;
  return { checks, stripW, x0, size, namesW, left, end, textRight };
};

/** The scroll's radius, px: tight when rolled up, thinning to nothing as the paper unwinds (u: 0 rolled … 1 open). */
const ROLL_R0 = 46;
/** The paper's back (the outside of the roll and of the curl): plain, a light grey, no print. */
const PAPER_BACK = "#d4d2cb";

// ── Clawd's hops ─────────────────────────────────────────────────────────────────────────────────────────────────────
const CONTACT = 0.2; // share of a beat on the ground after each landing (the squash and the push-off)
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

type Body = { x: number; lift: number; stretch: number; planted: number; step: number };

const hopAt = (f: number, xs: number[]): Body => {
  // the entrance: one big leap in from off-screen, taking off on bar 1 beat 4, landing on bar 2 beat 1
  if (f < LANDINGS[0]) {
    const v = clamp01((f - HOP_IN) / (LANDINGS[0] - HOP_IN));
    return {
      x: lerp(-260, xs[0], v),
      lift: 170 * 4 * v * (1 - v),
      stretch: 1 + 0.2 * (1 - 2 * v) ** 2,
      planted: 0,
      step: v,
    };
  }
  const k = LANDINGS.filter((L) => f >= L).length - 1;
  const x0 = xs[k];
  if (k === LANDINGS.length - 1) {
    // the last landing: squash, then stand
    const u = (f - LANDINGS[k]) / (LANDINGS[k] - LANDINGS[k - 1]);
    const sq = u < CONTACT ? 0.28 * Math.sin((Math.PI * u) / CONTACT) : 0;
    return { x: x0, lift: 0, stretch: 1 - sq, planted: 1, step: 0 };
  }
  const u = (f - LANDINGS[k]) / (LANDINGS[k + 1] - LANDINGS[k]);
  if (u < CONTACT)
    return { x: x0, lift: 0, stretch: 1 - 0.28 * Math.sin((Math.PI * u) / CONTACT), planted: 1, step: 0 };
  const v = (u - CONTACT) / (1 - CONTACT);
  const walking = k < WALK_LANDINGS;
  const H = walking ? 78 : 52;
  return {
    x: lerp(x0, xs[k + 1], v),
    lift: H * 4 * v * (1 - v),
    stretch: 1 + 0.16 * (1 - 2 * v) ** 2,
    planted: 0,
    step: v,
  };
};

// ── the car: its centre passes the middle of the frame on bar 4 beat 1 (the whoosh's closest point) ─────────────────
const LEN = carLength(RB18);
// The pass is too quick to read at true speed (~0.3 s across the frame), so on the whoosh's peak the car hard-freezes
// for FREEZE frames, centred in the frame, over a paper flash and focus lines (a manga freeze-frame), then drives on at
// the same speed. The car's clock stops during the freeze.
const FREEZE = 3;
const carClock = (f: number) => (f < PASS_AT ? f : f < PASS_AT + FREEZE ? PASS_AT : f - FREEZE);
const frozenAt = (f: number) => f >= PASS_AT && f < PASS_AT + FREEZE;
const carRear = (f: number) => (CAR_V * (carClock(f) - PASS_AT)) / FPS - LEN / 2; // m from the camera axis
const ppmCar = cam.pxPerMetre(CAR_Z);
const carScreen = (f: number) => {
  const rear = cam.screenX(carRear(f), CAR_Z);
  return { rear, nose: rear + LEN * ppmCar };
};

// ── the gag ───────────────────────────────────────────────────────────────────────────────────────────────────────────
const Gag: React.FC<{ f: number }> = ({ f }) => {
  useLettering();
  const L = layout();
  const t = f / FPS;
  const handBack = clawdHands(PW, { step: 0, planted: 1, stretch: 1, startle: 0, look: 0, reach: 1 }).back.x;
  // Clawd's x at each landing: its back hand on the second post, from beside the full roll to the banner's end
  const post0 = POST_LX(L) + ROLL_R0 + 18;
  const xEnd = L.end - handBack;
  const xStart = post0 - handBack;
  const xs = LANDINGS.map((_, k) => lerp(xStart, xEnd, Math.min(1, k / WALK_LANDINGS)));

  // ── the car ──
  const car = carScreen(f);
  const carOn = car.nose > PANEL.x - 50 && car.rear < PANEL.x + PANEL.w + 50;
  const carY = cam.screenY(0, CAR_Z);
  // the gust reaches Clawd as the car's tail passes it, then dies away
  const gustAt = PASS_AT + Math.round(((xEnd - 960) / ppmCar / CAR_V) * FPS);
  const gust = hit(f / FPS, gustAt / FPS, 0.35) * (f < JUMP ? 1 : 0);

  // ── Clawd ──
  const body = hopAt(f, xs);
  const dt = f - DOUBLE_TAKE;
  const jt = f - JUMP;
  // the double-take: a glance back, a glance ahead ("nah"), then snapping back with its eyes going wide
  const look = dt < 0 ? 0 : dt < 7 ? 1 : dt < 13 ? 0 : 1;
  const startle = jt >= 0 ? 1 : dt >= 13 ? 0.35 : 0;
  // the jump: a short anticipation squash before the beat, then up and down over 40 frames
  const antic = f >= JUMP - 5 && f < JUMP ? 0.8 : 1;
  const jumpLift = jt >= 0 ? 320 * Math.sin(Math.min(Math.PI, (jt / 40) * Math.PI)) : 0;
  const lift = body.lift + jumpLift;
  const stretch = jt >= 0 ? (jt < 20 ? 1.22 : 1.1) : body.stretch * antic;
  const holding = f < JUMP; // the flag, until the jump
  const PLANT = LANDINGS[WALK_LANDINGS];
  const carrying = f >= LANDINGS[0] && f < PLANT; // the second post, from the first landing to the plant
  const pose: ClawdPose = {
    step: body.step,
    planted: jt >= 0 ? 0 : body.planted,
    stretch,
    startle,
    look,
    reach: carrying ? 1 : 0,
  };
  const hands = clawdHands(PW, pose);
  const sy = stretch;
  const sx = 1 / Math.sqrt(sy);
  const toWorld = (p: { x: number; y: number }) => ({ x: body.x + p.x * sx, y: GROUND - lift + p.y * sy });
  const frontHand = toWorld(hands.front);
  // the cloth: unrolled as far as Clawd has carried the post; the post's x is the reveal edge
  const walked = f < LANDINGS[0] ? 0 : 1;
  const unrolled = f >= PLANT ? 1 : walked ? clamp01((body.x - xStart) / (xEnd - xStart)) : 0;
  const edge = lerp(post0, L.end, unrolled);
  const lastLanding = LANDINGS.filter((x) => x <= f).pop() ?? 0;
  const sinceLanding = (f - lastLanding) / FRAMES_PER_BEAT;
  const rippleFrom = PASS_AT + FREEZE;
  const cloth: Cloth = {
    p: unrolled,
    postX: edge,
    postLift: carrying ? 12 + body.lift : 0,
    planted: f >= PLANT,
    bounce: carrying ? 9 * Math.exp(-3 * sinceLanding) * Math.cos(7 * sinceLanding) : 0,
    ripple: f >= rippleFrom ? 20 * hit(f / FPS, rippleFrom / FPS, 0.55) : 0,
    rt: (f - rippleFrom) / FPS,
    sincePlant: f - PLANT,
  };

  // ── the flag Clawd carries: pole forward from its front hand, cloth trailing back over its head; the gust snaps it ──
  const flagAngle = 12 + 6 * Math.sin(t * 6) - 22 * gust;
  const flagT = t + 2.5 * gust; // the cloth ripples faster in the wind
  // after the jump it flies up out of the frame
  const flyX = frontHand.x - 16 * Math.max(0, jt);
  const flyY = frontHand.y - 46 * Math.max(0, jt) + 0.6 * Math.max(0, jt) ** 2;

  const clipId = "cg-reveal";
  const namesBase = OUTRO_BASE + 11;
  const capH = 0.72 * L.size;

  // ── the shout (the double-take, through the jump): Bangers, no box, bursting out beside Clawd's head, in the gap
  // under the banner and left of the cord, so it covers neither the words nor Clawd ──
  const shoutOn = dt >= 0;
  const SHOUT = "POLE AGAIN?!";
  const shoutSize = 84;
  const shoutPop = shoutOn ? 1 + 0.35 * Math.exp(-dt / 2.5) * Math.cos(dt * 0.8) : 0;
  const shoutJit = jt >= 0 && jt < 14 ? { x: ((jt * 37) % 7) - 3, y: ((jt * 53) % 7) - 3 } : { x: 0, y: 0 };
  const shoutAt = { x: L.end - 80 + shoutJit.x * 3, y: GROUND - 120 + shoutJit.y * 3 };

  const notesOn = f >= LANDINGS[WALK_LANDINGS] - 20 && f < DOUBLE_TAKE;

  return (
    <Closeup
      cam={cam}
      layout={LAYOUT}
      camX={0}
      tilt={TILT}
      speed={0}
      seed={0}
      cars={
        carOn
          ? [
              {
                car: RB18,
                x: carRear(f),
                z: CAR_Z,
                state: { wheelAngle: wheelAngleAt(RB18, CAR_V * (carClock(f) / FPS)), farSide: "low" },
              },
            ]
          : []
      }
      under={
        <g>
          {/* the near verge Clawd hops along: run-off in a light tone, a painted line */}
          <path d={cam.groundQuad(1.2, 6, -40, 40)} fill="#d9d8d3" />
          <path d={cam.groundQuad(3.4, 3.55, -40, 40)} fill={PAPER} stroke={INK} strokeWidth={2} />
        </g>
      }
      between={
        frozenAt(f) ? (
          // the freeze-frame: a paper flash over the background and focus lines on the car; no smear
          <g>
            <rect x={-200} y={-200} width={2320} height={1480} fill={PAPER} opacity={0.88} />
            <path
              d={focusLines(960, carY - 0.6 * ppmCar, 0.62 * LEN * ppmCar, 150, 7 + (f - PASS_AT))}
              fill={INK}
              opacity={0.75}
            />
          </g>
        ) : carOn ? (
          // the car alone carries the speed: a smear of ghosts behind it and a few lines trailing it
          <g>
            <path
              d={speedLines({
                x: car.rear - 1300,
                y: carY - 1.05 * ppmCar,
                w: 1300 + LEN * ppmCar * 0.3,
                h: 1.0 * ppmCar,
                n: 16,
                seed: `rb18-${Math.floor(f / 2)}`,
                angle: 0,
                thickness: 14,
                length: [0.35, 0.8],
              })}
              fill={INK}
              opacity={0.8}
            />
            {[0.9, 1.8, 2.7].map((d, i) => (
              <g key={d} opacity={0.3 - i * 0.09}>
                <MangaCar
                  car={RB18}
                  at={cam.anchor({ x: carRear(f) - d, z: CAR_Z })}
                  state={{ wheelAngle: wheelAngleAt(RB18, CAR_V * (carClock(f) / FPS)), farSide: "low" }}
                />
              </g>
            ))}
          </g>
        ) : null
      }
      over={
        <g>
          {/* the banner's post at its left end, standing on the verge */}
          <g>
            <rect x={L.left - 22} y={BANNER.top - 46} width={18} height={GROUND - 30 - (BANNER.top - 46)} fill={PAPER} stroke={INK} strokeWidth={6} />
            <circle cx={L.left - 13} cy={BANNER.top - 52} r={14} fill={INK} />
            <ellipse cx={L.left - 13} cy={GROUND - 28} rx={30} ry={8} fill={INK} opacity={0.4} />
          </g>
          <Banner L={L} c={cloth} clipId={clipId} namesBase={namesBase} capH={capH} />

          {/* wind off the car, curling round Clawd */}
          {gust > 0.08
            ? [0, 1, 2].map((k) => {
                const y = GROUND - 60 - k * 70;
                const x = body.x - 260 + 90 * (1 - gust) * 3 + k * 30;
                return (
                  <path
                    key={k}
                    d={`M ${x} ${y} q 120 -18 240 0 t 200 -10`}
                    stroke={INK}
                    strokeWidth={5}
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray="70 26"
                    opacity={Math.min(1, gust * 1.6)}
                  />
                );
              })
            : null}

          {f >= HOP_IN ? (
            <Clawd x={body.x} y={GROUND} lift={lift} PW={PW} pose={pose}>
              {holding ? (
                <g transform={`skewX(${-10 * gust})`}>
                  <CarriedFlag x={hands.front.x} y={hands.front.y} angle={flagAngle} t={flagT} size={0.85} />
                </g>
              ) : null}
            </Clawd>
          ) : null}

          {/* bounce arcs behind the entrance and the first hops */}
          {f >= LANDINGS[0] && f < LANDINGS[3] ? (
            <path
              d={`M ${body.x - 330} ${GROUND - 14} Q ${body.x - 250} ${GROUND - 110} ${body.x - 170} ${GROUND - 20}`}
              stroke={INK}
              strokeWidth={6}
              fill="none"
              strokeDasharray="18 16"
              strokeLinecap="round"
              opacity={0.7}
            />
          ) : null}

          {/* humming, oblivious, while the car goes by */}
          {notesOn
            ? [0, 1].map((k) => {
                // over its head, on the side away from the flag
                const nx = body.x - 110 + k * 60;
                const ny = GROUND - lift - clawdSize(PW).h - 40 - k * 36 + Math.sin(t * 5 + k) * 8;
                return (
                  <g key={k} transform={`rotate(${-12 + k * 20} ${nx} ${ny})`}>
                    <ellipse cx={nx} cy={ny} rx={15} ry={11} fill={INK} stroke={PAPER} strokeWidth={4} paintOrder="stroke" />
                    <path d={`M ${nx + 12} ${ny} V ${ny - 54} q 20 9 23 30`} stroke={INK} strokeWidth={6} fill="none" strokeLinecap="round" />
                  </g>
                );
              })
            : null}

          {/* the startle: shock lines on the side away from the banner, sweat, !!, BOING on the ground */}
          {jt >= 0 ? (
            <g>
              {Array.from({ length: 9 }, (_, i) => {
                const a = ((-70 + i * 22) * Math.PI) / 180;
                const cx = body.x;
                const cy = GROUND - lift - (clawdSize(PW).h * stretch) / 2;
                const r0 = 190;
                const r1 = 250 + (i % 3) * 26;
                return (
                  <path
                    key={i}
                    d={`M ${cx + Math.cos(a) * r0} ${cy + Math.sin(a) * r0} L ${cx + Math.cos(a) * r1} ${cy + Math.sin(a) * r1}`}
                    stroke={INK}
                    strokeWidth={8}
                    strokeLinecap="round"
                  />
                );
              })}
              <Sfx x={body.x - 20} y={GROUND - lift - clawdSize(PW).h * stretch - 40} size={110} rotate={8} anchor="middle">
                !!
              </Sfx>
              <Sfx x={body.x - 400} y={GROUND + 52} size={84} rotate={-4}>
                BOING!
              </Sfx>
              <path
                d={`M ${body.x - 80} ${GROUND} q 18 -36 36 0 q 18 36 36 0 q 18 -36 36 0 q 18 36 36 0`}
                stroke={INK}
                strokeWidth={6}
                fill="none"
              />
              <CarriedFlag x={flyX} y={flyY} angle={-15 - 6 * jt} t={t} size={0.85} />
            </g>
          ) : null}

          {/* POLE AGAIN?!: a hand-lettered shout bursting out beside Clawd's head, with a few emphasis strokes; it pops
              with an overshoot on the double-take and jitters on the jump */}
          {shoutOn
            ? (() => {
                const W = measure(SHOUT, SFX_FONT, 400, shoutSize, 0.03);
                const x1 = shoutAt.x;
                const x0 = x1 - W;
                const yb = shoutAt.y;
                const yt = yb - shoutSize * 0.8;
                const strokes = [
                  [x0 + W * 0.15, yt - 18, x0 + W * 0.1, yt - 58],
                  [x0 + W * 0.45, yt - 22, x0 + W * 0.45, yt - 66],
                  [x0 + W * 0.75, yt - 18, x0 + W * 0.8, yt - 58],
                  [x0 - 18, yt + 10, x0 - 58, yt - 14],
                  [x0 - 22, yb - 20, x0 - 66, yb - 16],
                  [x1 + 16, yt - 6, x1 + 44, yt - 34],
                ];
                return (
                  <g transform={`translate(${x1} ${yb}) rotate(-7) scale(${shoutPop}) translate(${-x1} ${-yb})`}>
                    {strokes.map(([a, b, c, d], i) => (
                      <path
                        key={i}
                        d={`M ${a} ${b} L ${c} ${d}`}
                        stroke={INK}
                        strokeWidth={8}
                        strokeLinecap="round"
                      />
                    ))}
                    <Sfx x={x1} y={yb} size={shoutSize} anchor="end">
                      {SHOUT}
                    </Sfx>
                  </g>
                );
              })()
            : null}
        </g>
      }
    />
  );
};

// The banner: one length of cloth, printed on its front (the words and the chequered strip), plain on its back, wound
// on a roll round the left post; its right end is tied to a second post. Clawd carries that post off to the right, so
// the cloth unrolls between the two (sagging a little, bouncing with each hop), plants it on bar 3 beat 4, and from then
// the cloth hangs between two fixed posts: a slight catenary sag top and bottom, soft folds, and on the RB18's gust a
// ripple running along it that dies away. The print rides the cloth (drawn in thin vertical slices, each moved with it).
type Layout = ReturnType<typeof layout>;
type Cloth = {
  /** Unrolled share: 0 all on the roll, 1 fully out. */
  p: number;
  /** The right post's centre x, how far it is lifted off the ground (carried), and whether it is planted. */
  postX: number;
  postLift: number;
  planted: boolean;
  /** Extra sag while carried: a bounce after each landing, px. */
  bounce: number;
  /** The ripple from the car's gust: amplitude px, and seconds since it started. */
  ripple: number;
  rt: number;
  /** Frames since the post was planted (negative before), for the thunk. */
  sincePlant: number;
};
const POST_LX = (L: Layout) => L.left - 13;
const POST_H = GROUND - 30 - (BANNER.top - 46);

const Banner: React.FC<{ L: Layout; c: Cloth; clipId: string; namesBase: number; capH: number }> = ({
  L,
  c,
  clipId,
  namesBase,
  capH,
}) => {
  const T = BANNER.top;
  const B = BANNER.bottom;
  const r = ROLL_R0 * (1 - c.p);
  const cl = POST_LX(L) + r;
  const cr = c.postX;
  const span = Math.max(1, cr - cl);
  const dR = -c.postLift;
  const sagTop = (c.planted ? 9 : 5) + c.bounce;
  const sagBot = (c.planted ? 12 : 7) + c.bounce;
  const u = (x: number) => clamp01((x - cl) / span);
  const wave = (x: number) =>
    c.ripple * Math.sin(Math.PI * u(x)) * Math.sin((2 * Math.PI * (x - cl)) / 460 - 2 * Math.PI * 2.4 * c.rt);
  const lift = (x: number, sag: number) => dR * u(x) + sag * 4 * u(x) * (1 - u(x)) + wave(x);
  const edgePts = (y: number, sag: number, from = cl, to = cr) => {
    const pts: string[] = [];
    const n = 36;
    for (let i = 0; i <= n; i++) {
      const x = lerp(from, to, i / n);
      pts.push(`${x.toFixed(1)} ${(y + lift(x, sag)).toFixed(1)}`);
    }
    return pts;
  };
  const sheet = (dy = 0) =>
    `M ${edgePts(T + dy, sagTop).join(" L ")} L ${edgePts(B + dy, sagBot).reverse().join(" L ")} Z`;
  const shown = cr - cl > 4;
  // the print, in slices that follow the cloth
  const SLICE = 18;
  const slices: number[] = [];
  for (let x = Math.floor(L.x0 - 20); x < Math.min(cr, L.end); x += SLICE) slices.push(x);
  const print = (
    <g>
      <text
        x={L.x0 + 4}
        y={namesBase - capH - 30}
        fontFamily={CAPTION_FONT}
        fontWeight={600}
        fontSize={30}
        letterSpacing="0.25em"
        fill={INK}
      >
        {MADE_BY}
      </text>
      <g transform={lean(L.x0 + 8, namesBase)}>
        <text
          x={L.x0 + 8}
          y={namesBase}
          fontFamily={TITLE_FONT}
          fontWeight={900}
          fontSize={L.size * BS_K}
          letterSpacing="0.01em"
          fill={INK}
        >
          {NAMES}
        </text>
      </g>
      <CircuitTag x={L.x0} y={STRIP_Y} text="" strip={1} name={0} size={STRIP} checks={L.checks} colour={INK} />
    </g>
  );
  const midSag = (sagTop + sagBot) / 2;
  // soft folds: a few long shallow creases hanging from the top edge, and tension wrinkles off the four corners
  const folds = c.planted
    ? [0.22, 0.47, 0.71].map((k) => {
        const x = lerp(cl, cr, k);
        const y0 = T + lift(x, sagTop) + 16;
        return `M ${x} ${y0} q ${10 + wave(x) * 0.5} ${70} ${-4} ${150}`;
      })
    : [];
  const corner = (x0: number, dir: 1 | -1) => {
    const yT = T + lift(x0, sagTop);
    const yB = B + lift(x0, sagBot);
    return `M ${x0 + dir * 22} ${yT + 18} q ${dir * 60} ${20} ${dir * 140} ${46} M ${x0 + dir * 22} ${yB - 18} q ${dir * 60} ${-18} ${dir * 140} ${-40}`;
  };
  // the right post: carried (lifted, swaying with Clawd), or planted with a thunk
  const k = c.sincePlant;
  const shake = c.planted && k < 14 ? 5 * Math.exp(-k / 4) * Math.sin(k * 2.2) : 0;
  const postTop = T - 46 - c.postLift + (c.planted ? 10 : 0);
  return (
    <g>
      {shown ? (
        <g>
          <path d={sheet(18)} fill={INK} />
          <path d={sheet()} fill={PAPER} />
          <path
            d={`M ${edgePts(T + 14, sagTop).join(" L ")} M ${edgePts(B - 14, sagBot).join(" L ")}`}
            fill="none"
            stroke={INK}
            strokeWidth={4}
          />
          <defs>
            {slices.map((x, i) => (
              <clipPath key={i} id={`${clipId}-${i}`}>
                <rect x={x} y={0} width={Math.min(SLICE + 0.6, cr - x)} height={1080} />
              </clipPath>
            ))}
          </defs>
          {slices.map((x, i) => (
            <g key={i} clipPath={`url(#${clipId}-${i})`}>
              <g transform={`translate(0 ${lift(x + SLICE / 2, midSag).toFixed(2)})`}>{print}</g>
            </g>
          ))}
          {folds.map((d, i) => (
            <path key={i} d={d} fill="none" stroke={INK} strokeWidth={9} strokeLinecap="round" opacity={0.1} />
          ))}
          {c.planted ? (
            <path
              d={`${corner(cl, 1)} ${corner(cr, -1)}`}
              fill="none"
              stroke={INK}
              strokeWidth={3}
              strokeLinecap="round"
              opacity={0.28}
            />
          ) : null}
          <path d={sheet()} fill="none" stroke={INK} strokeWidth={10} strokeLinejoin="round" />
        </g>
      ) : null}
      {/* the roll round the left post: the cloth's plain back outward */}
      {r >= 2 ? <PaperRoll x={POST_LX(L) - r} r={r} top={T - 12} bottom={B + 12} /> : null}
      <circle cx={POST_LX(L)} cy={T - 52} r={14} fill={INK} />
      {/* the right post */}
      <g transform={`translate(${shake} 0)`}>
        <ellipse
          cx={c.postX}
          cy={GROUND - 28}
          rx={30 * (c.postLift > 0 ? 0.7 : 1)}
          ry={8}
          fill={INK}
          opacity={c.postLift > 0 ? 0.2 : 0.4}
        />
        <rect x={c.postX - 9} y={postTop} width={18} height={POST_H} fill={PAPER} stroke={INK} strokeWidth={6} />
        <circle cx={c.postX} cy={postTop - 6} r={14} fill={INK} />
      </g>
      {c.planted && k < 14 ? (
        <g opacity={1 - k / 14}>
          {[-60, -30, 30, 60].map((dx) => (
            <path
              key={dx}
              d={`M ${c.postX + dx * 0.5} ${GROUND - 26} l ${dx * 0.9} ${dx > 0 ? -18 : -18}`}
              stroke={INK}
              strokeWidth={6}
              strokeLinecap="round"
            />
          ))}
          <Sfx x={c.postX - 40} y={GROUND + 40} size={60} rotate={-6} anchor="end">
            THUNK!
          </Sfx>
        </g>
      ) : null}
    </g>
  );
};

// A roll of the banner's paper seen from the side, standing upright: the outside is the paper's plain back (grey, ink
// outline, no print), the top end shows the wound spiral. (x is its left side; it is 2r wide.)
const PaperRoll: React.FC<{ x: number; r: number; top: number; bottom: number }> = ({ x, r, top, bottom }) => {
  const ry = Math.max(2, r * 0.32);
  const spiral = (() => {
    const pts: string[] = [];
    const turns = Math.max(1.5, r / 12);
    for (let i = 0; i <= 48; i++) {
      const a = (i / 48) * turns * 2 * Math.PI;
      const k = 1 - i / 52;
      pts.push(`${(x + r + Math.cos(a) * r * k).toFixed(1)} ${(top + Math.sin(a) * ry * k).toFixed(1)}`);
    }
    return `M ${pts.join(" L ")}`;
  })();
  return (
    <g>
      <rect x={x} y={top} width={2 * r} height={bottom - top} fill={PAPER_BACK} stroke={INK} strokeWidth={5} />
      {/* shading: the far side of the cylinder in a darker band, a paper-light glint near the left */}
      <rect x={x + r * 1.35} y={top + 2} width={r * 0.55} height={bottom - top - 4} fill={INK} opacity={0.14} />
      <rect x={x + r * 0.3} y={top + 6} width={Math.max(1.5, r * 0.14)} height={bottom - top - 12} fill={PAPER} opacity={0.7} />
      <ellipse cx={x + r} cy={bottom} rx={r} ry={ry} fill={PAPER_BACK} stroke={INK} strokeWidth={5} />
      <rect x={x + 2.5} y={bottom - ry - 2} width={2 * r - 5} height={ry + 2} fill={PAPER_BACK} />
      <ellipse cx={x + r} cy={top} rx={r} ry={ry} fill={PAPER} stroke={INK} strokeWidth={5} />
      <path d={spiral} fill="none" stroke={INK} strokeWidth={2.2} opacity={0.75} />
    </g>
  );
};

// The flag Clawd carries: the film's chequered flag, cloth trailing back from the pole (mirrored), the pole's foot in
// the hand at (x, y).
const CarriedFlag: React.FC<{ x: number; y: number; angle: number; t: number; size?: number }> = ({
  x,
  y,
  angle,
  t,
  size = 1,
}) => {
  const w = 190 * size;
  const h = 120 * size;
  const fy = y - 2.2 * h;
  return (
    <g transform={`rotate(${angle} ${x} ${y})`}>
      <g transform={`translate(${x} 0) scale(-1 1) translate(${-x} 0)`}>
        <ChequeredFlag x={x + 6} y={fy} w={w} h={h} t={t} />
      </g>
    </g>
  );
};

// Bar 5 beat 4: the flag falls back into the frame towards the camera, covers it, and a black wipe closes the film.
const FlagFall: React.FC<{ f: number }> = ({ f }) => {
  const k = f - FLAG_FALL;
  if (k < 0) return null;
  const len = BLACK - FLAG_FALL; // a beat
  const fall = Easing.in(Easing.quad)(clamp01(k / (len * 0.62)));
  const s = lerp(0.9, 15, fall);
  const cx = lerp(1250, 960, fall);
  const cy = lerp(-220, 560, fall);
  const rot = lerp(-70, -8, fall);
  const wipe = smooth((k - len * 0.6) / (len * 0.4 - 1));
  const t = f / FPS;
  const w = 190 * s;
  const h = 120 * s;
  return (
    <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
      <g transform={`translate(${cx} ${cy}) rotate(${rot}) translate(${-w / 2} ${-h / 2})`}>
        <ChequeredFlag x={0} y={0} w={w} h={h} t={t} />
      </g>
      {wipe > 0 ? (
        <g>
          <rect x={-10} y={0} width={1940 * wipe} height={1080} fill={INK} />
          {/* the wipe's leading edge: a column of checks */}
          {Array.from({ length: 14 }, (_, i) => (
            <rect key={i} x={1940 * wipe - 10 + (i % 2) * 40} y={i * 80} width={40} height={80} fill={INK} />
          ))}
        </g>
      ) : null}
    </svg>
  );
};

export const Scene: React.FC<SceneProps> = ({ part }) => {
  const f = useSongFrame(part);
  if (f < LIGHTS_AT || f >= BLACK) return <AbsoluteFill style={{ backgroundColor: INK }} />;
  const dark = 1 - Easing.inOut(Easing.cubic)(clamp01((f - LIGHTS_AT) / (LIGHTS_UP - LIGHTS_AT)));
  return (
    <AbsoluteFill style={{ backgroundColor: INK }}>
      <Gag f={f} />
      {/* the lights come up on 1.2–1.3 */}
      {dark > 0 ? (
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
          <rect width={1920} height={1080} fill={INK} opacity={dark} />
        </svg>
      ) : null}
      <FlagFall f={f} />
    </AbsoluteFill>
  );
};
