// The cover's Chinese display face. Type system D (ART-6) has no Chinese face, so the cover adds Noto Sans SC Black
// (Google Fonts, OFL) for the Chinese title; Latin letters and numbers stay in Big Shoulders Black (TITLE_FONT).
// Google splits a CJK font into ~100 unicode-range slices; only the slices holding the cover's characters are loaded.
import { useEffect, useState } from "react";
import { continueRender, delayRender } from "remotion";
import {
  getInfo as notoInfo,
  loadFont as loadNoto,
} from "@remotion/google-fonts/NotoSansSC";

// Every Chinese character any cover draws.
export const COVER_TEXT = "从塞纳到维斯塔潘手绘";

const inRange = (cp: number, ranges: string) =>
  ranges.split(",").some((r) => {
    const [a, b] = r.trim().replace(/^U\+/i, "").split("-");
    const lo = parseInt(a, 16);
    const hi = b === undefined ? lo : parseInt(b, 16);
    return cp >= lo && cp <= hi;
  });

const subsetsFor = (text: string, ranges: Record<string, string>) =>
  Object.keys(ranges).filter((k) =>
    [...text].some((ch) => inRange(ch.codePointAt(0) ?? 0, ranges[k])),
  );

const noto = loadNoto("normal", {
  weights: ["900"],
  subsets: subsetsFor(COVER_TEXT, notoInfo().unicodeRanges) as never,
  ignoreTooManyRequestsWarning: true,
});

export const CJK_FONT = noto.fontFamily;

const READY = noto.waitUntilDone();
let ready = false;
READY.then(() => {
  ready = true;
}).catch(() => undefined);

/** Holds the render until the Chinese face is in (the title boxes measure it). */
export const useCoverFonts = (): boolean => {
  const [ok, setOk] = useState(ready);
  const [handle] = useState(() => (ready ? null : delayRender("cover CJK font")));
  useEffect(() => {
    if (handle === null) return;
    READY.then(() => {
      setOk(true);
      continueRender(handle);
    }).catch(() => continueRender(handle));
  }, [handle]);
  return ok;
};
