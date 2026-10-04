// THROWAWAY prototype: does a real photo, faded into an ink wash (水墨), work behind shot 5.6 (VER crosses the line)?
// The real 5.6 scene is imported as is and drawn on top with mix-blend-mode: multiply, so the paper-white of the scene
// lets the wash show through while the car livery and manga linework stay on top. Photo: public/proto-finish/ (not in git).
import { AbsoluteFill, Img, staticFile } from "remotion";
import { Finish } from "../mv/parts/abuDhabi2021/Finish";
import { shotAt } from "../mv/parts/abuDhabi2021/shotClock";
import { EDIT } from "../mv/parts/abuDhabi2021/shots";
import { at, frameAt } from "../mv/timing";

export type Wash = "before" | "ink" | "soft";

// Tone curve per variant: discrete steps give the posterised ink blacks.
const VARIANTS = {
  ink: { table: "0 0.12 0.45 0.85 1", contrast: 1.5, bright: 1.05, blur: 1.2, opacity: 0.62, disp: 7 },
  soft: { table: "0.1 0.4 0.75 0.95 1", contrast: 1.2, bright: 1.15, blur: 2.2, opacity: 0.4, disp: 4 },
} as const;

const PHOTO = { w: 1920, h: 1280 };

export const FinishPhotoBg: React.FC<{ wash?: Wash; t?: number }> = ({ wash = "ink", t = 0.35 }) => {
  const f = frameAt(at(99)) + Math.round(t * 60);
  const st = shotAt(EDIT, f);
  const v = wash === "before" ? null : VARIANTS[wash];
  return (
    <AbsoluteFill style={{ backgroundColor: "#f4efe4" }}>
      {v ? (
        <>
          <svg width={0} height={0} style={{ position: "absolute" }}>
            <defs>
              <filter id="ink-wash" x="-5%" y="-5%" width="110%" height="110%" colorInterpolationFilters="sRGB">
                <feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves={3} seed={4} result="n" />
                <feDisplacementMap in="SourceGraphic" in2="n" scale={v.disp * 6} result="d" />
                <feColorMatrix in="d" type="saturate" values="0" result="g" />
                <feComponentTransfer in="g" result="p">
                  <feFuncR type="discrete" tableValues={v.table} />
                  <feFuncG type="discrete" tableValues={v.table} />
                  <feFuncB type="discrete" tableValues={v.table} />
                </feComponentTransfer>
                <feGaussianBlur in="p" stdDeviation={v.blur} />
              </filter>
            </defs>
          </svg>
          {/* the wash: crowd and the bull arch in the upper two thirds, car at the bottom of the photo cropped away */}
          <div
            style={{
              position: "absolute",
              left: -120,
              top: -60,
              width: PHOTO.w * 1.15,
              height: PHOTO.h * 1.15 * 0.62,
              overflow: "hidden",
              opacity: v.opacity,
              WebkitMaskImage:
                "radial-gradient(ellipse 62% 60% at 55% 42%, #000 35%, transparent 100%), linear-gradient(#000 70%, transparent)",
              WebkitMaskComposite: "source-in",
              maskComposite: "intersect",
            }}
          >
            <Img
              src={staticFile("proto-finish/austria.jpg")}
              style={{
                width: PHOTO.w * 1.15,
                height: PHOTO.h * 1.15,
                filter: `url(#ink-wash) contrast(${v.contrast}) brightness(${v.bright})`,
              }}
            />
          </div>
        </>
      ) : null}
      <AbsoluteFill style={{ mixBlendMode: v ? "multiply" : "normal" }}>
        <Finish st={st} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
