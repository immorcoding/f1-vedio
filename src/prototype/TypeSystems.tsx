// PROTOTYPE (throwaway) — which English type system should the MV use?
// Four candidate systems (A–D), each a font per role: title card, labels/captions, manga SFX, stamps, plus the big
// numerals (67G, 27s, points). `TypeSheet` is a contact sheet per system; `TypeContext` overlays a system on a real
// MV frame (old Chinese text covered, new text in the same place); `TypeCompare` puts one frame side by side for all
// four. Google Fonts only; every family checked against google/fonts (ofl/ = SIL OFL 1.1, apache/ = Apache 2.0).
import React from "react";
import { AbsoluteFill } from "remotion";
import { loadFont as loadTitillium } from "@remotion/google-fonts/TitilliumWeb";
import { loadFont as loadExo2 } from "@remotion/google-fonts/Exo2";
import { loadFont as loadOrbitron } from "@remotion/google-fonts/Orbitron";
import { loadFont as loadChakra } from "@remotion/google-fonts/ChakraPetch";
import { loadFont as loadAnton } from "@remotion/google-fonts/Anton";
import { loadFont as loadOswald } from "@remotion/google-fonts/Oswald";
import { loadFont as loadRacingSans } from "@remotion/google-fonts/RacingSansOne";
import { loadFont as loadBSStencil } from "@remotion/google-fonts/BigShouldersStencil";
import { loadFont as loadBangers } from "@remotion/google-fonts/Bangers";
import { loadFont as loadBowlby } from "@remotion/google-fonts/BowlbyOne";
import { loadFont as loadBarlowC } from "@remotion/google-fonts/BarlowCondensed";
import { loadFont as loadRubikMono } from "@remotion/google-fonts/RubikMonoOne";
import { loadFont as loadBigShoulders } from "@remotion/google-fonts/BigShoulders";
import { loadFont as loadSairaStencil } from "@remotion/google-fonts/SairaStencil";
import { MV } from "../mv/MV";
import { INK, PAPER } from "../kit/colors";

const opt = { subsets: ["latin" as const], ignoreTooManyRequestsWarning: true };
const TITILLIUM = loadTitillium("normal", { weights: ["300", "600", "700", "900"], ...opt }).fontFamily;
const EXO2 = loadExo2("italic", { weights: ["900"], ...opt }).fontFamily;
const ORBITRON = loadOrbitron("normal", { weights: ["700", "900"], ...opt }).fontFamily;
const CHAKRA = loadChakra("normal", { weights: ["700"], ...opt }).fontFamily;
const ANTON = loadAnton("normal", { weights: ["400"], ...opt }).fontFamily;
const OSWALD = loadOswald("normal", { weights: ["500", "600"], ...opt }).fontFamily;
const RACING = loadRacingSans("normal", { weights: ["400"], ...opt }).fontFamily;
const BS_STENCIL = loadBSStencil("normal", { weights: ["900"], ...opt }).fontFamily;
const BANGERS = loadBangers("normal", { weights: ["400"], ...opt }).fontFamily;
const BOWLBY = loadBowlby("normal", { weights: ["400"], ...opt }).fontFamily;
const BARLOW_C = loadBarlowC("italic", { weights: ["600", "800"], ...opt }).fontFamily;
const RUBIK_MONO = loadRubikMono("normal", { weights: ["400"], ...opt }).fontFamily;
const BIG_SHOULDERS = loadBigShoulders("normal", { weights: ["900"], ...opt }).fontFamily;
const SAIRA_STENCIL = loadSairaStencil("normal", { weights: ["700"], ...opt }).fontFamily;

const RED = "#d3221c"; // the stamps' red (suzuka1989/Helmets STAMP_RED)
const F1_RED = "#e10600";

type Id = "A" | "B" | "C" | "D";
type TitleP = { place: string; year: string; sub?: string; dark?: boolean; size: number };
type TextP = { children: string; size: number; dark?: boolean };
type SfxP = { children: string; size: number; rotate?: number };
type StampP = { children: string; size: number; minW?: number; minH?: number };
type StakesP = { code: string; text: string; size: number };

type Sys = {
  id: Id;
  name: string;
  blurb: string;
  fonts: [role: string, family: string, licence: string][];
  Title: React.FC<TitleP>;
  Label: React.FC<TextP>;
  Stakes: React.FC<StakesP>;
  Sfx: React.FC<SfxP>;
  Stamp: React.FC<StampP>;
  Big: React.FC<TextP>;
  // stamp size factor: wide faces (Rubik Mono) need smaller stamps to fit the cards
  stampK: number;
};

const outline = (w: number, colour: string): React.CSSProperties => ({
  WebkitTextStroke: `${w}px ${colour}`,
  paintOrder: "stroke fill",
});

// per-letter jitter for comic SFX (deterministic)
const Jitter: React.FC<{ text: string; amp: number }> = ({ text, amp }) => (
  <>
    {text.split("").map((ch, i) => (
      <span
        key={i}
        style={{
          display: "inline-block",
          transform: `translateY(${((i * 37) % 5 - 2) * amp * 0.06}em) rotate(${((i * 53) % 7 - 3) * amp * 2.2}deg) scale(${1 + ((i * 29) % 3) * 0.06 * amp})`,
        }}
      >
        {ch === " " ? " " : ch}
      </span>
    ))}
  </>
);

// a stamp: paper fill (it covers whatever is under it), red frame(s), red letters
const StampBox: React.FC<
  StampP & { family: string; weight?: number; tracking?: string; double?: boolean; radius?: number }
> = ({ children, size, minW = 0, minH = 0, family, weight = 400, tracking = "0.04em", double = true, radius = 10 }) => (
  <div
    style={{
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      minWidth: minW,
      minHeight: minH,
      boxSizing: "border-box",
      padding: `${size * 0.22}px ${size * 0.42}px`,
      background: PAPER,
      border: `${Math.max(5, size * 0.1)}px solid ${RED}`,
      borderRadius: radius,
      outline: double ? `${Math.max(2, size * 0.035)}px solid ${RED}` : undefined,
      outlineOffset: double ? -size * 0.2 : undefined,
      color: RED,
      fontFamily: family,
      fontWeight: weight,
      fontSize: size,
      letterSpacing: tracking,
      lineHeight: 1,
      whiteSpace: "nowrap",
      opacity: 1,
    }}
  >
    {children}
  </div>
);

// ── A · F1 broadcast ──────────────────────────────────────────────────────────────────────────────────────────
const A: Sys = {
  id: "A",
  stampK: 1,
  name: "F1 BROADCAST",
  blurb: "Wide techno sans, like the TV graphics: timing-tower tabs, red tick, digital numerals.",
  fonts: [
    ["Titles + labels", "Titillium Web 300/600/700/900", "OFL"],
    ["SFX", "Exo 2 Black Italic", "OFL"],
    ["Stamps", "Chakra Petch Bold", "OFL"],
    ["Numerals", "Orbitron Black", "OFL"],
  ],
  Title: ({ place, year, sub, dark, size }) => {
    const c = dark ? PAPER : INK;
    return (
      <div style={{ color: c, lineHeight: 1 }}>
        <div style={{ display: "flex", alignItems: "flex-end", gap: size * 0.18 }}>
          <div style={{ width: size * 0.12, height: size * 0.74, background: F1_RED, transform: "skewX(-14deg)", marginBottom: size * 0.1 }} />
          <span style={{ fontFamily: TITILLIUM, fontWeight: 900, fontSize: size, letterSpacing: "-0.01em", transform: "skewX(-10deg)", display: "inline-block" }}>
            {place}
          </span>
          <span style={{ fontFamily: TITILLIUM, fontWeight: 300, fontSize: size, letterSpacing: "-0.01em" }}>{year}</span>
        </div>
        {sub ? (
          <div style={{ fontFamily: TITILLIUM, fontWeight: 600, fontSize: size * 0.32, letterSpacing: "0.28em", marginTop: size * 0.12, marginLeft: size * 0.32 }}>
            {sub}
          </div>
        ) : null}
      </div>
    );
  },
  Label: ({ children, size }) => (
    <div style={{ display: "inline-flex", alignItems: "stretch", background: INK, color: PAPER, fontFamily: TITILLIUM, fontWeight: 700, fontSize: size, lineHeight: 1, whiteSpace: "nowrap" }}>
      <div style={{ width: size * 0.22, background: F1_RED }} />
      <div style={{ padding: `${size * 0.2}px ${size * 0.4}px ${size * 0.24}px` }}>{children}</div>
    </div>
  ),
  Stakes: ({ code, text, size }) => (
    <div style={{ display: "inline-flex", fontFamily: TITILLIUM, fontSize: size, lineHeight: 1, whiteSpace: "nowrap", border: `4px solid ${INK}` }}>
      <div style={{ background: INK, color: PAPER, fontWeight: 900, padding: `${size * 0.2}px ${size * 0.34}px` }}>{code}</div>
      <div style={{ background: PAPER, color: INK, fontWeight: 700, padding: `${size * 0.2}px ${size * 0.4}px` }}>{text}</div>
    </div>
  ),
  Sfx: ({ children, size, rotate = -8 }) => (
    <div style={{ fontFamily: EXO2, fontStyle: "italic", fontWeight: 900, fontSize: size, color: PAPER, ...outline(size * 0.12, INK), transform: `rotate(${rotate}deg)`, lineHeight: 1, whiteSpace: "nowrap", letterSpacing: "-0.02em" }}>
      {children}
    </div>
  ),
  Stamp: (p) => <StampBox {...p} family={CHAKRA} weight={700} tracking="0.08em" double={false} radius={2} />,
  Big: ({ children, size, dark }) => (
    <div style={{ fontFamily: ORBITRON, fontWeight: 900, fontSize: size, color: dark ? PAPER : INK, ...outline(size * 0.09, dark ? INK : PAPER), lineHeight: 1, whiteSpace: "nowrap" }}>
      {children}
    </div>
  ),
};

// ── B · vintage Grand Prix poster ─────────────────────────────────────────────────────────────────────────────
const SpeedStripes: React.FC<{ w: number; h: number; colour: string }> = ({ w, h, colour }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: h * 0.6 }}>
    {[1, 0.82, 0.64].map((k) => (
      <div key={k} style={{ width: w * k, height: h, background: colour, clipPath: "polygon(0 0, 100% 0, 96% 100%, 0 100%)" }} />
    ))}
  </div>
);

const B: Sys = {
  id: "B",
  stampK: 1,
  name: "VINTAGE GP POSTER",
  blurb: "Condensed leaning grotesque of 1960s–80s Grand Prix posters and livery numbers; retro racing script for SFX.",
  fonts: [
    ["Titles + numerals", "Anton (leaned 12°)", "OFL"],
    ["Labels", "Oswald 500/600", "OFL"],
    ["SFX", "Racing Sans One", "OFL"],
    ["Stamps", "Big Shoulders Stencil Black", "OFL"],
  ],
  Title: ({ place, year, sub, dark, size }) => {
    const c = dark ? PAPER : INK;
    return (
      <div style={{ color: c, lineHeight: 0.95 }}>
        <div style={{ transform: "skewX(-12deg)", display: "flex", alignItems: "baseline", gap: size * 0.2, fontFamily: ANTON, fontSize: size, whiteSpace: "nowrap" }}>
          <span>{place}</span>
          <span style={{ color: "transparent", WebkitTextStroke: `${Math.max(3, size * 0.03)}px ${c}` }}>{year}</span>
        </div>
        <div style={{ marginTop: size * 0.12, transform: "skewX(-12deg)" }}>
          <SpeedStripes w={size * 3.6} h={size * 0.05} colour={c} />
        </div>
        {sub ? (
          <div style={{ fontFamily: OSWALD, fontWeight: 500, fontSize: size * 0.3, letterSpacing: "0.2em", marginTop: size * 0.1 }}>{sub}</div>
        ) : null}
      </div>
    );
  },
  Label: ({ children, size }) => (
    <div style={{ display: "inline-block", transform: "skewX(-12deg)", background: PAPER, border: `${Math.max(4, size * 0.08)}px solid ${INK}`, padding: `${size * 0.12}px ${size * 0.45}px`, fontFamily: OSWALD, fontWeight: 600, fontSize: size, color: INK, lineHeight: 1.1, whiteSpace: "nowrap", letterSpacing: "0.03em" }}>
      {children}
    </div>
  ),
  Stakes: ({ code, text, size }) => (
    <div style={{ display: "inline-flex", alignItems: "center", gap: size * 0.3, transform: "skewX(-12deg)", whiteSpace: "nowrap" }}>
      <div style={{ background: INK, color: PAPER, fontFamily: ANTON, fontSize: size * 1.1, padding: `0 ${size * 0.3}px`, lineHeight: 1.15 }}>{code}</div>
      <div style={{ fontFamily: OSWALD, fontWeight: 600, fontSize: size, color: INK, letterSpacing: "0.04em" }}>{text}</div>
    </div>
  ),
  Sfx: ({ children, size, rotate = -8 }) => (
    <div style={{ fontFamily: RACING, fontSize: size, color: INK, ...outline(size * 0.1, PAPER), textShadow: `${size * 0.06}px ${size * 0.06}px 0 ${INK}`, transform: `rotate(${rotate}deg)`, lineHeight: 1, whiteSpace: "nowrap" }}>
      {children}
    </div>
  ),
  Stamp: (p) => <StampBox {...p} family={BS_STENCIL} weight={900} tracking="0.06em" />,
  Big: ({ children, size, dark }) => (
    <div style={{ fontFamily: ANTON, fontSize: size, color: dark ? PAPER : INK, ...outline(size * 0.08, dark ? INK : PAPER), transform: "skewX(-12deg)", lineHeight: 1, whiteSpace: "nowrap" }}>
      {children}
    </div>
  ),
};

// ── C · manga-comic English ───────────────────────────────────────────────────────────────────────────────────
const C: Sys = {
  id: "C",
  stampK: 0.74,
  name: "MANGA COMIC",
  blurb: "Comic-book lettering throughout: fat rounded titles, Bangers SFX with jittered letters, narration boxes.",
  fonts: [
    ["Titles", "Bowlby One", "OFL"],
    ["Labels", "Barlow Condensed SemiBold/ExtraBold Italic", "OFL"],
    ["SFX + numerals", "Bangers", "OFL"],
    ["Stamps", "Rubik Mono One", "OFL"],
  ],
  Title: ({ place, year, sub, dark, size }) => {
    const c = dark ? PAPER : INK;
    const s = dark ? "#555" : "#bbb";
    return (
      <div style={{ color: c, lineHeight: 1, transform: "rotate(-3deg)", transformOrigin: "left bottom" }}>
        <div style={{ fontFamily: BOWLBY, fontSize: size * 0.88, whiteSpace: "nowrap", textShadow: `${size * 0.05}px ${size * 0.05}px 0 ${s}` }}>
          {place} {year}
        </div>
        {sub ? (
          <div style={{ fontFamily: BARLOW_C, fontStyle: "italic", fontWeight: 800, fontSize: size * 0.34, letterSpacing: "0.08em", marginTop: size * 0.08 }}>{sub}</div>
        ) : null}
      </div>
    );
  },
  Label: ({ children, size }) => (
    <div style={{ display: "inline-block", background: PAPER, border: `5px solid ${INK}`, padding: `${size * 0.14}px ${size * 0.5}px`, fontFamily: BARLOW_C, fontStyle: "italic", fontWeight: 800, fontSize: size, color: INK, lineHeight: 1.1, whiteSpace: "nowrap" }}>
      {children}
    </div>
  ),
  Stakes: ({ code, text, size }) => (
    <div style={{ display: "inline-block", background: PAPER, border: `5px solid ${INK}`, padding: `${size * 0.14}px ${size * 0.5}px`, fontFamily: BARLOW_C, fontStyle: "italic", fontWeight: 600, fontSize: size, color: INK, lineHeight: 1.1, whiteSpace: "nowrap" }}>
      <span style={{ fontFamily: BANGERS, fontStyle: "normal", fontSize: size * 1.15, letterSpacing: "0.04em" }}>{code}</span> {text}
    </div>
  ),
  Sfx: ({ children, size, rotate = -10 }) => (
    <div style={{ fontFamily: BANGERS, fontSize: size, color: PAPER, ...outline(size * 0.13, INK), textShadow: `${size * 0.07}px ${size * 0.07}px 0 ${INK}`, transform: `rotate(${rotate}deg)`, lineHeight: 1, whiteSpace: "nowrap", letterSpacing: "0.02em" }}>
      <Jitter text={children} amp={1} />
    </div>
  ),
  Stamp: (p) => <StampBox {...p} family={RUBIK_MONO} tracking="0.02em" radius={18} />,
  Big: ({ children, size, dark }) => (
    <div style={{ fontFamily: BANGERS, fontSize: size, color: dark ? PAPER : INK, ...outline(size * 0.1, dark ? INK : PAPER), lineHeight: 1, whiteSpace: "nowrap", letterSpacing: "0.03em" }}>
      {children}
    </div>
  ),
};

// ── D · hybrid ────────────────────────────────────────────────────────────────────────────────────────────────
const D: Sys = {
  id: "D",
  stampK: 1,
  name: "HYBRID",
  blurb: "Tall poster-condensed titles, F1-broadcast Titillium in manga narration boxes, Bangers ink SFX, stencil stamps.",
  fonts: [
    ["Titles + numerals", "Big Shoulders Black", "OFL"],
    ["Labels + subtitles", "Titillium Web 600/700", "OFL"],
    ["SFX", "Bangers", "OFL"],
    ["Stamps", "Saira Stencil Bold", "OFL"],
  ],
  Title: ({ place, year, sub, dark, size }) => {
    const c = dark ? PAPER : INK;
    return (
      <div style={{ color: c, lineHeight: 0.9 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: size * 0.16, fontFamily: BIG_SHOULDERS, fontWeight: 900, fontSize: size * 1.12, transform: "skewX(-8deg)", whiteSpace: "nowrap", letterSpacing: "0.01em" }}>
          <span>{place}</span>
          <span style={{ color: "transparent", WebkitTextStroke: `${Math.max(3, size * 0.028)}px ${c}` }}>{year}</span>
        </div>
        {sub ? (
          <div style={{ fontFamily: TITILLIUM, fontWeight: 600, fontSize: size * 0.3, letterSpacing: "0.3em", marginTop: size * 0.2 }}>{sub}</div>
        ) : null}
      </div>
    );
  },
  Label: ({ children, size }) => (
    <div style={{ display: "inline-block", background: PAPER, border: `5px solid ${INK}`, boxShadow: `7px 7px 0 ${INK}`, padding: `${size * 0.14}px ${size * 0.45}px ${size * 0.18}px`, fontFamily: TITILLIUM, fontWeight: 700, fontSize: size, color: INK, lineHeight: 1.05, whiteSpace: "nowrap", letterSpacing: "0.02em" }}>
      {children}
    </div>
  ),
  Stakes: ({ code, text, size }) => (
    <div style={{ display: "inline-flex", alignItems: "center", background: PAPER, border: `5px solid ${INK}`, boxShadow: `7px 7px 0 ${INK}`, fontFamily: TITILLIUM, fontSize: size, color: INK, lineHeight: 1.05, whiteSpace: "nowrap" }}>
      <span style={{ background: INK, color: PAPER, fontWeight: 900, padding: `${size * 0.14}px ${size * 0.3}px ${size * 0.18}px` }}>{code}</span>
      <span style={{ fontWeight: 700, padding: `0 ${size * 0.45}px 0 ${size * 0.35}px` }}>{text}</span>
    </div>
  ),
  Sfx: ({ children, size, rotate = -10 }) => (
    <div style={{ fontFamily: BANGERS, fontSize: size, color: INK, ...outline(size * 0.12, PAPER), transform: `rotate(${rotate}deg)`, lineHeight: 1, whiteSpace: "nowrap", letterSpacing: "0.03em" }}>
      <Jitter text={children} amp={0.8} />
    </div>
  ),
  Stamp: (p) => <StampBox {...p} family={SAIRA_STENCIL} weight={700} tracking="0.05em" />,
  Big: ({ children, size, dark }) => (
    <div style={{ fontFamily: BIG_SHOULDERS, fontWeight: 900, fontSize: size * 1.12, color: dark ? PAPER : INK, ...outline(size * 0.09, dark ? INK : PAPER), transform: "skewX(-8deg)", lineHeight: 1, whiteSpace: "nowrap" }}>
      {children}
    </div>
  ),
};

const SYSTEMS: Record<Id, Sys> = { A, B, C, D };

// ── helpers ───────────────────────────────────────────────────────────────────────────────────────────────────
// Place a child with its anchor point at (x, y): ax/ay are 0 (left/top) … 1 (right/bottom) of the child's box.
const At: React.FC<{ x: number; y: number; ax?: number; ay?: number; rotate?: number; children: React.ReactNode }> = ({ x, y, ax = 0, ay = 0, rotate = 0, children }) => (
  <div style={{ position: "absolute", left: x, top: y, transform: `rotate(${rotate}deg) translate(${-ax * 100}%, ${-ay * 100}%)`, transformOrigin: "0 0" }}>
    {children}
  </div>
);

const Small: React.FC<{ children: React.ReactNode; size?: number; colour?: string }> = ({ children, size = 22, colour = "#666" }) => (
  <div style={{ fontFamily: "Arial, sans-serif", fontSize: size, color: colour, letterSpacing: "0.12em", whiteSpace: "nowrap" }}>{children}</div>
);

// ── contact sheet ─────────────────────────────────────────────────────────────────────────────────────────────
export const TypeSheet: React.FC<{ sys: Id }> = ({ sys }) => {
  const S = SYSTEMS[sys];
  return (
    <AbsoluteFill style={{ background: PAPER }}>
      {/* header */}
      <At x={40} y={26}>
        <div style={{ fontFamily: "Arial Black, Arial, sans-serif", fontSize: 34, color: INK, whiteSpace: "nowrap" }}>
          {S.id} · {S.name} <span style={{ fontFamily: "Arial, sans-serif", fontWeight: 400, fontSize: 22, color: "#555", marginLeft: 16 }}>{S.blurb}</span>
        </div>
        <div style={{ display: "flex", gap: 34, marginTop: 8 }}>
          {S.fonts.map(([role, fam, lic]) => (
            <Small key={role} size={20} colour="#333">
              <b>{role}:</b> {fam} <span style={{ color: RED }}>({lic})</span>
            </Small>
          ))}
        </div>
      </At>
      <div style={{ position: "absolute", left: 40, right: 40, top: 112, height: 4, background: INK }} />

      {/* titles: paper, then night */}
      <At x={40} y={128}><Small>TITLE CARD</Small></At>
      <At x={60} y={175}>
        <S.Title place="SUZUKA" year="1989" sub="TEAM-MATES · RIVALS" size={118} />
      </At>
      <div style={{ position: "absolute", left: 40, top: 395, width: 960, height: 210, background: INK }} />
      <At x={70} y={S.id === "C" ? 445 : 420}>
        <S.Title place="ABU DHABI" year="2021" dark size={78} />
      </At>
      <At x={70} y={525}>
        <div style={{ display: "flex", gap: 50 }}>
          <S.Title place="BAHRAIN" year="2020" dark size={44} />
          <S.Title place="BRAZIL" year="2008" dark size={44} />
        </div>
      </At>

      {/* labels, captions, stakes, lines */}
      <At x={1050} y={128}><Small>LABELS · CAPTIONS · STAKES · LINES</Small></At>
      <At x={1050} y={172}>
        <div style={{ display: "flex", gap: 26, alignItems: "center" }}>
          <S.Label size={46}>LAP 47</S.Label>
          <S.Label size={46}>CHICANE</S.Label>
          <S.Label size={46}>LAP 1</S.Label>
        </div>
      </At>
      <At x={1050} y={262}>
        <S.Label size={42}>POLE ON THE DIRTY SIDE</S.Label>
      </At>
      <At x={1050} y={346}>
        <div style={{ display: "flex", gap: 26, alignItems: "center" }}>
          <S.Stakes code="PRO" text="+16 PTS" size={42} />
          <S.Stakes code="SEN" text="MUST WIN" size={42} />
        </div>
      </At>
      <At x={1050} y={436}>
        <div style={{ display: "flex", gap: 26, alignItems: "center" }}>
          <S.Label size={40}>PRO MOVES TO FERRARI</S.Label>
          <S.Label size={40}>DRY TYRES</S.Label>
        </div>
      </At>
      <At x={1050} y={518}>
        <S.Label size={36}>SEN LATER ADMITTED IT WAS DELIBERATE</S.Label>
      </At>

      <div style={{ position: "absolute", left: 40, right: 40, top: 628, height: 2, background: INK }} />

      {/* SFX on a halftone-ish ground */}
      <At x={40} y={642}><Small>MANGA SFX</Small></At>
      <div style={{ position: "absolute", left: 40, top: 680, width: 1000, height: 370, overflow: "hidden", background: `radial-gradient(${INK} 22%, transparent 24%) 0 0 / 14px 14px, #d9d7d0`, display: "flex", flexDirection: "column", justifyContent: "space-evenly" }}>
        <div style={{ display: "flex", justifyContent: "space-evenly", alignItems: "center" }}>
          <S.Sfx size={124} rotate={-9}>CRASH!</S.Sfx>
          <S.Sfx size={108} rotate={6}>BANG!</S.Sfx>
        </div>
        <div style={{ display: "flex", justifyContent: "space-evenly", alignItems: "center" }}>
          <S.Sfx size={70} rotate={-4}>SCREECH</S.Sfx>
          <S.Sfx size={70} rotate={-7}>WHOOSH</S.Sfx>
          <S.Sfx size={64} rotate={7}>SKRRT</S.Sfx>
        </div>
      </div>

      {/* stamps + numerals */}
      <At x={1080} y={642}><Small>STAMPS · NUMERALS · CHAMPION CARD</Small></At>
      <At x={1080} y={690}>
        <div style={{ display: "flex", gap: 34, alignItems: "center", width: 800, justifyContent: "space-between" }}>
          <div style={{ transform: "rotate(-6deg)" }}><S.Stamp size={38 * S.stampK}>DISQUALIFIED</S.Stamp></div>
          <div style={{ transform: "rotate(-6deg)" }}><S.Stamp size={38 * S.stampK}>1989 CHAMPION</S.Stamp></div>
        </div>
      </At>
      <At x={1080} y={820}>
        <div style={{ display: "flex", gap: 30, alignItems: "center", width: 800, justifyContent: "space-between" }}>
          <S.Big size={90}>67G</S.Big>
          <div style={{ display: "flex", flexDirection: "column", gap: 18, alignItems: "flex-start" }}>
            <div style={{ display: "flex", gap: 24 }}>
              {["0s", "11s", "27s"].map((t) => (
                <S.Big key={t} size={40}>{t}</S.Big>
              ))}
            </div>
            <S.Big size={34}>369.5 · 369.5</S.Big>
          </div>
          <div style={{ background: INK, padding: "14px 18px", textAlign: "center", lineHeight: 1.1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <S.Big size={17} dark>LEWIS HAMILTON</S.Big>
            <S.Big size={34} dark>2008</S.Big>
            <S.Big size={27} dark>WORLD</S.Big>
            <S.Big size={27} dark>CHAMPION</S.Big>
          </div>
        </div>
      </At>
    </AbsoluteFill>
  );
};

// ── in-context mockups ────────────────────────────────────────────────────────────────────────────────────────
export type Shot = "suzukaTitle" | "suzukaCrash" | "suzukaStamps" | "bahrain67g" | "abuDhabiTitle";
export const SHOT_FRAMES: Record<Shot, number> = {
  suzukaTitle: 1000,
  suzukaCrash: 2060,
  suzukaStamps: 2290,
  bahrain67g: 6840,
  abuDhabiTitle: 8269,
};

// a jagged paper burst behind an SFX (covers the old characters on a busy ground)
const burst = (cx: number, cy: number, rx: number, ry: number, n = 18) => {
  let d = "";
  for (let i = 0; i < n * 2; i++) {
    const a = (i / (n * 2)) * Math.PI * 2;
    const k = i % 2 === 0 ? 1 : 0.78 + ((i * 7) % 3) * 0.04;
    d += `${i === 0 ? "M" : "L"} ${cx + Math.cos(a) * rx * k} ${cy + Math.sin(a) * ry * k} `;
  }
  return d + "Z";
};

const Overlay: React.FC<{ S: Sys; shot: Shot }> = ({ S, shot }) => {
  switch (shot) {
    case "suzukaTitle":
      return (
        <>
          {/* cover: the brush title, its rule and the subtitle (all on plain paper) */}
          <div style={{ position: "absolute", left: 95, top: 465, width: 650, height: 275, background: PAPER }} />
          <At x={110} y={612} ay={1}>
            <S.Title place="SUZUKA" year="1989" size={124} />
          </At>
          <At x={118} y={648}>
            <div style={{ fontFamily: S.id === "B" ? OSWALD : S.id === "C" ? BARLOW_C : TITILLIUM, fontStyle: S.id === "C" ? "italic" : "normal", fontWeight: S.id === "C" ? 800 : 600, fontSize: 40, letterSpacing: S.id === "C" ? "0.08em" : "0.26em", color: INK, whiteSpace: "nowrap" }}>
              TEAM-MATES · RIVALS
            </div>
          </At>
        </>
      );
    case "suzukaCrash":
      return (
        <>
          <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0 }}>
            <path d={burst(500, 175, 330, 175)} fill={PAPER} stroke={INK} strokeWidth={6} />
          </svg>
          <At x={500} y={175} ax={0.5} ay={0.5}>
            <S.Sfx size={190} rotate={-10}>CRASH!</S.Sfx>
          </At>
        </>
      );
    case "suzukaStamps":
      return (
        <>
          <At x={381} y={376} ax={0.5} ay={0.5} rotate={-8}>
            <S.Stamp size={58 * S.stampK} minW={500} minH={140}>1989 CHAMPION</S.Stamp>
          </At>
          <At x={1540} y={376} ax={0.5} ay={0.5} rotate={-8}>
            <S.Stamp size={58 * S.stampK} minW={340} minH={140}>DISQUALIFIED</S.Stamp>
          </At>
        </>
      );
    case "bahrain67g":
      return (
        <>
          <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0 }}>
            <ellipse cx={1452} cy={140} rx={180} ry={118} fill={PAPER} transform="rotate(-8 1452 140)" />
          </svg>
          <At x={1452} y={142} ax={0.5} ay={0.5} rotate={-8}>
            <S.Big size={210}>67G</S.Big>
          </At>
        </>
      );
    case "abuDhabiTitle":
      return (
        <>
          <div style={{ position: "absolute", left: 70, top: 105, width: 990, height: 190, background: INK }} />
          <At x={92} y={252} ay={1}>
            <S.Title place="ABU DHABI" year="2021" dark size={132} />
          </At>
        </>
      );
  }
};

export const TypeContext: React.FC<{ sys: Id; shot: Shot }> = ({ sys, shot }) => (
  <AbsoluteFill style={{ background: INK }}>
    {/* registered as a full-length composition: render it with --frame=SHOT_FRAMES[shot] (Freeze inside a 1-frame
        Still left the MV's sequences empty) */}
    <MV />
    <AbsoluteFill>
      <Overlay S={SYSTEMS[sys]} shot={shot} />
    </AbsoluteFill>
  </AbsoluteFill>
);

// one frame, all four systems, 2×2 at half size, each cell labelled
export const TypeCompare: React.FC<{ shot: Shot }> = ({ shot }) => (
  <AbsoluteFill style={{ background: INK }}>
    {(["A", "B", "C", "D"] as Id[]).map((id, i) => (
      <div key={id} style={{ position: "absolute", left: (i % 2) * 960, top: Math.floor(i / 2) * 540, width: 1920, height: 1080, transform: "scale(0.5)", transformOrigin: "0 0", overflow: "hidden" }}>
        <TypeContext sys={id} shot={shot} />
        <div style={{ position: "absolute", left: 0, bottom: 0, background: F1_RED, color: PAPER, fontFamily: "Arial Black, Arial, sans-serif", fontSize: 54, padding: "8px 28px" }}>
          {id} · {SYSTEMS[id].name}
        </div>
      </div>
    ))}
    <div style={{ position: "absolute", left: 958, top: 0, width: 4, height: 1080, background: PAPER }} />
    <div style={{ position: "absolute", left: 0, top: 538, width: 1920, height: 4, background: PAPER }} />
  </AbsoluteFill>
);
