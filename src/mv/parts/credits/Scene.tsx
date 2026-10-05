// Picture for 片尾彩蛋, the post-credits stinger (shots.ts has the beat plan). One continuous take after a beat of black:
//   1.2  the outro title's chequered strip wipes back in on black, in the same place and at the same tilt (CircuitTag's
//        motion, ART-32): the film's title card coming back;
//   1.3  the black lifts off a static trackside close-up at Yas Marina by night (the 2021 part's set, ART-8 B/W);
//   1.4  Clawd hops in from the left carrying the chequered flag, one hop per beat, landing on the kick, with squash and
//        stretch; its back hand holds the cord of a paper banner's roll, so the banner unrolls behind it and the words
//        "MADE BY / Immor × Claude" appear only where it has already been (it never covers them, ART-14);
//   bar 4  VER's RB18 #1 shoots past behind at race speed: the only fast thing on screen (the camera stays still, no
//        speed lines on the scene; the car alone smears and trails a few lines). Its wind ruffles Clawd and the flag.
//        Clawd keeps hopping on the spot, humming (a note over its head);
//   bar 5  the last landing on beat 1; the late double-take on beat 2 with a speech bubble POLE AGAIN?! (VER took pole at
//        Yas Marina in 2021 and 2022, facts.md); the startled jump on beat 3 (!!, BOING!) and the flag flies out of its
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
  Sfx,
  TITLE_FONT,
  titleWidth,
  useLettering,
} from "../../../kit/lettering";
import { speedLines } from "../../../kit/lines";
import { ChequeredFlag } from "../../../scenes/abu-dhabi-2021/ChequeredFlag";
import { Closeup, PANEL, trackLayout } from "../../../scenes/abu-dhabi-2021/Closeup";
import { useSongFrame } from "../../clock";
import type { SceneProps } from "../../scenes";
import { FPS, frameAt, type Pos } from "../../timing";
import { cueAt, hit, smooth } from "../abuDhabi2021/shotClock";
import { Clawd, clawdHands, clawdSize, type ClawdPose } from "./Clawd";
import { cb, EDIT } from "./shots.ts";

const F = (p: Pos) => frameAt(p);
const cue = (id: string) => F(cueAt(EDIT, id));

// ── beats, as frames ─────────────────────────────────────────────────────────────────────────────────────────────────
const STRIP_AT = cue("credits.strip");
const LIGHTS_AT = cue("credits.lights");
const HOP_IN = cue("credits.hopIn");
const PASS_AT = cue("credits.pass");
const DOUBLE_TAKE = cue("credits.doubleTake");
const JUMP = cue("credits.jump");
const FLAG_FALL = cue("credits.flagFall");
const BLACK = F(cb(6));
/** Landing frames: 13 landings, one per beat from bar 2 beat 1 to bar 5 beat 1. */
const LANDINGS = Array.from({ length: 13 }, (_, k) => F(cb(2 + Math.floor(k / 4), 1 + (k % 4))));
/** The walk ends (the banner fully open) on the 9th landing, bar 4 beat 1; after it Clawd hops on the spot. */
const WALK_LANDINGS = 8;

// ── the camera and the set: a static low trackside camera, the car's lane behind Clawd ─────────────────────────────
const cam = pinhole({ f: 1500, horizon: 160, cx: 960, height: 1.25 });
const LAYOUT = trackLayout(-60, 60, { x0: 20, x1: 90, z: 520, top: 38 });
const TILT = -3; // the outro banner's tilt, so the strip comes back exactly where it was
const CAR_Z = 10.5;
const CAR_V = 78; // m/s, ~280 km/h down the straight
const GROUND = 965; // Clawd's feet (in the tilted panel's frame)
const PW = 18; // Clawd's block width, px

// ── the title card coming back: the outro's strip (outro/Flag.tsx FlagTitle: title size 150, baseline 540 + 0.26·150,
// strip 26 below it, 34 px CircuitTag) ──────────────────────────────────────────────────────────────────────────────
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
  const x0 = 960 - stripW / 2;
  // the names span the strip, a little under the prototype's 172 px title
  const per = measure(NAMES, TITLE_FONT, 900, 100 * BS_K, 0.01) / 100;
  const size = Math.min(140, stripW / per);
  const namesW = per * size;
  const left = x0 - 90;
  // where the banner's roll stops: past the words and the strip
  const end = x0 + Math.max(stripW, namesW + 30) + 60;
  return { checks, stripW, x0, size, namesW, left, end };
};

/** The strip's wipe: CircuitTag's 14 frames from bar 1 beat 2. */
const stripAt = (f: number) => clamp01((f - STRIP_AT) / 14);

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
const carRear = (f: number) => (CAR_V * (f - PASS_AT)) / FPS - LEN / 2; // m from the camera axis
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
  // Clawd's x at each landing: the walk lays the banner open from its left end to its end, then it stays
  const xEnd = L.end - handBack;
  const xStart = L.left + 40 - handBack;
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
  const holding = f < JUMP; // the cord and the flag, until the jump
  const pose: ClawdPose = {
    step: body.step,
    planted: jt >= 0 ? 0 : body.planted,
    stretch,
    startle,
    look,
    reach: holding ? 1 : 0,
  };
  const hands = clawdHands(PW, pose);
  const sy = stretch;
  const sx = 1 / Math.sqrt(sy);
  const toWorld = (p: { x: number; y: number }) => ({ x: body.x + p.x * sx, y: GROUND - lift + p.y * sy });
  const backHand = toWorld(hands.back);
  const frontHand = toWorld(hands.front);
  // the banner's roll follows the back hand, never going back
  const walked = f < LANDINGS[0] ? 0 : 1;
  const edge = walked ? Math.min(L.end, Math.max(L.left, backHand.x)) : L.left;

  // ── the flag Clawd carries: pole forward from its front hand, cloth trailing back over its head; the gust snaps it ──
  const flagAngle = 12 + 6 * Math.sin(t * 6) - 22 * gust;
  const flagT = t + 2.5 * gust; // the cloth ripples faster in the wind
  // after the jump it flies up out of the frame
  const flyX = frontHand.x - 16 * Math.max(0, jt);
  const flyY = frontHand.y - 46 * Math.max(0, jt) + 0.6 * Math.max(0, jt) ** 2;

  const strip = stripAt(f);

  const clipId = "cg-reveal";
  const namesBase = OUTRO_BASE + 11;
  const capH = 0.72 * L.size;

  // ── speech bubble (the double-take, through the jump) ──
  const bubbleOn = dt >= 0;
  const bubblePop = bubbleOn ? 1 + 0.18 * Math.exp(-dt / 3) * Math.cos(dt * 0.9) : 0;
  const BUBBLE_TEXT = "POLE AGAIN?!";
  const bubbleSize = 66;
  const bw = measure(BUBBLE_TEXT, CAPTION_FONT, 700, bubbleSize, 0.02) + 90;
  const bh = bubbleSize * 1.75;
  const bubbleC = { x: Math.min(PANEL.x + PANEL.w - bw / 2 - 40, xEnd - 40), y: 200 };

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
                state: { wheelAngle: wheelAngleAt(RB18, CAR_V * (f / FPS)), farSide: "low" },
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
        carOn ? (
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
                  state={{ wheelAngle: wheelAngleAt(RB18, CAR_V * (f / FPS)), farSide: "low" }}
                />
              </g>
            ))}
          </g>
        ) : null
      }
      over={
        <g>
          {/* the paper banner, unrolling behind Clawd (the outro's banner: ink shadow, ink rules) */}
          <defs>
            <clipPath id={clipId}>
              <rect x={-400} y={0} width={Math.max(0, edge + 400)} height={1080} />
            </clipPath>
          </defs>
          {edge > L.left + 2 ? (
            <g>
              <rect x={L.left} y={BANNER.top + 18} width={edge - L.left} height={BANNER.bottom - BANNER.top} fill={INK} />
              <rect x={L.left} y={BANNER.top} width={edge - L.left} height={BANNER.bottom - BANNER.top} fill={PAPER} />
              <path
                d={`M ${L.left} ${BANNER.top + 14} H ${edge} M ${L.left} ${BANNER.bottom - 14} H ${edge}`}
                stroke={INK}
                strokeWidth={4}
              />
              <rect
                x={L.left}
                y={BANNER.top}
                width={edge - L.left}
                height={BANNER.bottom - BANNER.top}
                fill="none"
                stroke={INK}
                strokeWidth={10}
              />
              <g clipPath={`url(#${clipId})`}>
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
              </g>
            </g>
          ) : null}
          {/* the roll at the banner's open end */}
          {f >= LIGHTS_AT ? (
            <g>
              <rect x={edge - 16} y={BANNER.top - 14} width={32} height={BANNER.bottom - BANNER.top + 28} fill={PAPER} stroke={INK} strokeWidth={6} />
              <path
                d={`M ${edge + 4} ${BANNER.top - 6} V ${BANNER.bottom + 6}`}
                stroke={INK}
                strokeWidth={3}
                opacity={0.6}
              />
              <ellipse cx={edge} cy={BANNER.top - 14} rx={16} ry={6} fill={PAPER} stroke={INK} strokeWidth={5} />
            </g>
          ) : null}
          {/* the outro's chequered strip, wiping back in (drawn again over the black curtain, Scene below) */}
          <CircuitTag x={L.x0} y={STRIP_Y} text="" strip={strip} name={0} size={STRIP} checks={L.checks} colour={INK} />

          {/* the cord from the roll to Clawd's back hand */}
          {holding && walked ? (
            <path
              d={`M ${edge} ${BANNER.bottom + 14} Q ${(edge + backHand.x) / 2 - 10} ${(BANNER.bottom + backHand.y) / 2 + 30} ${backHand.x} ${backHand.y}`}
              stroke={INK}
              strokeWidth={5}
              fill="none"
              strokeLinecap="round"
            />
          ) : null}

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
              <Sfx x={body.x - 300} y={GROUND + 52} size={84} rotate={-4}>
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

          {/* POLE AGAIN?! */}
          {bubbleOn ? (
            <g transform={`translate(${bubbleC.x} ${bubbleC.y}) scale(${bubblePop})`}>
              <path
                d={`M ${-bw * 0.08} ${bh * 0.42} L ${bw * 0.12} ${bh * 0.42 + 95} L ${bw * 0.16} ${bh * 0.38} Z`}
                fill={PAPER}
                stroke={INK}
                strokeWidth={6}
                strokeLinejoin="round"
              />
              <ellipse cx={0} cy={0} rx={bw / 2 + 24} ry={bh / 2 + 8} fill={PAPER} stroke={INK} strokeWidth={6} />
              <path d={`M ${-bw * 0.06} ${bh * 0.4} L ${bw * 0.15} ${bh * 0.36}`} stroke={PAPER} strokeWidth={10} />
              <text
                x={0}
                y={bubbleSize * 0.35}
                textAnchor="middle"
                fontFamily={CAPTION_FONT}
                fontWeight={700}
                fontSize={bubbleSize}
                letterSpacing="0.02em"
                fill={INK}
              >
                {BUBBLE_TEXT}
              </text>
            </g>
          ) : null}
        </g>
      }
    />
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
  if (f < STRIP_AT || f >= BLACK) return <AbsoluteFill style={{ backgroundColor: INK }} />;
  const curtain = f < HOP_IN ? 1 - Easing.inOut(Easing.cubic)(clamp01((f - LIGHTS_AT) / (HOP_IN - LIGHTS_AT))) : 0;
  return (
    <AbsoluteFill style={{ backgroundColor: INK }}>
      <Gag f={f} />
      {/* the black: the whole frame on 1.2, lifting off on 1.3; the strip stays put on top of it, exactly over the
          panel's own strip, so it is one strip throughout */}
      {curtain > 0 ? (
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
          <rect y={-1300 * (1 - curtain)} width={1920} height={1080} fill={INK} />
          <g transform={`rotate(${TILT} 960 540)`}>
            <CircuitTag
              x={layout().x0}
              y={STRIP_Y}
              text=""
              strip={stripAt(f)}
              name={0}
              size={STRIP}
              checks={layout().checks}
              colour={INK}
            />
          </g>
        </svg>
      ) : null}
      <FlagFall f={f} />
    </AbsoluteFill>
  );
};
