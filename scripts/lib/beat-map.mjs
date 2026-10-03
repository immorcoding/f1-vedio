// The beat map as data (public/music/beat-map.json), built from src/mv/timing.ts.
// make-music writes it; check-audio rebuilds it and compares.
import * as T from "../../src/mv/timing.ts";

const point = (p) => ({
  bar: p.bar,
  beat: p.beat,
  seconds: T.secondsAt(p),
  sample: T.sampleAt(p),
  frame: T.frameAt(p),
});

export const buildBeatMap = () => {
  const beats = [];
  for (let bar = 1; bar <= T.BARS; bar++)
    for (let beat = 1; beat <= T.BEATS_PER_BAR; beat++)
      beats.push(point(T.at(bar, beat)));
  beats.push(point(T.SONG_END));
  return {
    bpm: T.BPM,
    beatsPerBar: T.BEATS_PER_BAR,
    fps: T.FPS,
    sampleRate: T.SAMPLE_RATE,
    bars: T.BARS,
    framesPerBar: T.FRAMES_PER_BAR,
    durationSeconds: T.DURATION_SECONDS,
    totalFrames: T.TOTAL_FRAMES,
    frameRounding:
      "frame = floor(seconds × fps + 0.5): nearest frame, exact halves round up (src/mv/timing.ts toFrame)",
    sections: T.SECTIONS.map((s) => ({
      id: s.id,
      name: s.name,
      from: point(s.from),
      to: point(s.to),
    })),
    hits: Object.entries(T.HITS).map(([id, p]) => ({ id, ...point(p) })),
    beats,
  };
};

/** JSON with one section, hit or beat per line, so diffs stay readable. */
export const formatBeatMap = (map) => {
  const { sections, hits, beats, ...head } = map;
  const list = (items) =>
    `[\n${items.map((x) => `    ${JSON.stringify(x)}`).join(",\n")}\n  ]`;
  const headLines = Object.entries(head).map(
    ([k, v]) => `  ${JSON.stringify(k)}: ${JSON.stringify(v)}`,
  );
  return `{\n${[...headLines, `  "sections": ${list(sections)}`, `  "hits": ${list(hits)}`, `  "beats": ${list(beats)}`].join(",\n")}\n}\n`;
};
