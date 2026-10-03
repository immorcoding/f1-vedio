// Where the cars are on the Suzuka 1990 start (shot 1.6), as lap distance and lateral offset on SUZUKA_1989 (m; lateral
// + = the driver's right). Pure data and maths, so a check script can load it with node and test the top view for
// overlapping cars (ART-18).
//
// Grid (facts.md): SEN pole on the right — the dirty side, off the racing line — PRO second on the left, on the
// clean line; MAN and BER in the second row. Slots 8 m apart, staggered. PRO launches better from the clean side and
// leads into Turn 1; SEN keeps to the inside (right) and his front wheel ends level with PRO's rear wheel as PRO turns
// in — the contact is the cut to shot 1.7.
import { FRAMES_PER_BEAT, frameAt, at } from "../../timing.ts";

export type CarId = "SEN" | "PRO" | "MAN" | "BER";
export type CarPos = { id: CarId; s: number; lat: number };

// lights out: 23.3
export const START_FRAME = frameAt(at(23, 3));
export const SHOT_FROM = frameAt(at(23));
export const SHOT_TO = frameAt(at(27));

// Lane centres either side of the centre line (track 13 m wide) and the slot spacing.
export const LANE = 3.25;
const SLOT = 8;

const smooth = (x: number) => {
  const u = Math.min(1, Math.max(0, x));
  return u * u * (3 - 2 * u);
};

// Distance covered τ s after lights out: hard launch, ~80 m/s top end; ≈ 358 m by the cut.
export const launch = (tau: number) =>
  tau <= 0 ? 0 : 80 * (tau - 2.2 * (1 - Math.exp(-tau / 2.2)));

export const carsAt = (f: number): CarPos[] => {
  const tau = (f - START_FRAME) / 60;
  const d = launch(tau);
  // PRO's better launch from the clean side: 11.5 m gained over the first three seconds
  const gain = 11.5 * smooth(tau / 3.2);
  // PRO turns in for Turn 1 over the last 2.3 s: from the left lane to just right of the centre line
  const tauEnd = (SHOT_TO - START_FRAME) / 60;
  const turnIn = smooth((tau - (tauEnd - 2.4)) / 2.4);
  return [
    { id: "SEN", s: -6 + d, lat: LANE + 0.35 * turnIn },
    { id: "PRO", s: -6 - SLOT + d + gain, lat: -LANE + 4.4 * turnIn },
    { id: "MAN", s: -6 - 2 * SLOT + 0.985 * d, lat: LANE },
    { id: "BER", s: -6 - 3 * SLOT + 0.99 * d, lat: -LANE },
  ];
};

// The beat length, for anything that pulses with the music.
export const BEAT = FRAMES_PER_BEAT;
