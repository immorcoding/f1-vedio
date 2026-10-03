// The Bahrain 2020 shots staged in world metres, registered for the interpenetration check (ART-18,
// src/mv/overlap.ts, src/mv/top-views.ts):
// - 3.2, the top view: GRO and KVY touch (right rear on left front) on bar 60 beat 1 and must never overlap otherwise;
// - 3.6, the trackside escape: GRO, the doctor and the marshal on the ground plane (x along the rails, z from the
//   camera as map y), with the two wreck pieces. GRO climbing out over the cell is real contact.
// Pure TypeScript.
import type { Footprint, TopViewSampler } from "../../overlap.ts";
import { frameAt } from "../../timing.ts";
import {
  CAR_HALF_WIDTH,
  L_GRO,
  L_KVY,
  planCrash,
  type CarPose,
} from "./crash-geometry.ts";
import { CLIMB_END, MARSHAL_AT, stage36 } from "./escape-staging.ts";
import { EDIT } from "./shots.ts";
import { CELL_SPAN, REAR_SPAN } from "./wreck-geometry.ts";

const shot = (id: string) => {
  const s = EDIT.shots.find((x) => x.id === id);
  if (!s) throw new Error(`bahrain2020: no shot ${id}`);
  return { from: frameAt(s.from), to: frameAt(s.to) };
};
const cue = (id: string) => {
  for (const s of EDIT.shots)
    for (const c of s.cues ?? []) if (c.id === id) return frameAt(c.at);
  throw new Error(`bahrain2020: no cue ${id}`);
};

// ── 3.2 ─────────────────────────────────────────────────────────────────────────────────────────────────
const S32 = shot("3.2");
const TOUCH = cue("bahrain2020.contact");
export const PLAN_32 = planCrash(S32.to - S32.from, TOUCH - S32.from);

// MangaCar's top view is anchored at the rear end; a footprint is centred.
const carFootprint = (id: string, p: CarPose, length: number): Footprint => {
  const h = (p.heading * Math.PI) / 180;
  return {
    id,
    x: p.x + (length / 2) * Math.cos(h),
    y: p.y + (length / 2) * Math.sin(h),
    heading: p.heading,
    length,
    width: 2 * CAR_HALF_WIDTH,
  };
};

const SAMPLER_32: TopViewSampler = {
  part: "bahrain2020",
  shot: "3.2",
  from: S32.from,
  to: S32.to,
  // the wheels rub for ~0.2 s from the touch
  contact: [
    { from: TOUCH - 4, to: TOUCH + 16, ids: ["GRO", "KVY"], depth: 0.12 },
  ],
  poses: (f) => {
    const i = Math.max(0, Math.min(PLAN_32.frames, f - S32.from));
    return [
      carFootprint("GRO", PLAN_32.gro[i], L_GRO),
      carFootprint("KVY", PLAN_32.kvy[i], L_KVY),
    ];
  },
};

// ── 3.6 ─────────────────────────────────────────────────────────────────────────────────────────────────
const S36 = shot("3.6");
// a person standing or walking: 0.35 m front to back, 0.45 m across the shoulders, facing −x (left on screen)
const person = (id: string, at: { x: number; z: number }): Footprint => ({
  id,
  x: at.x,
  y: at.z,
  heading: 180,
  length: 0.35,
  width: 0.45,
});
const piece = (
  id: string,
  span: { from: number; to: number; z: number },
): Footprint => ({
  id,
  x: (span.from + span.to) / 2,
  y: span.z,
  heading: 180,
  length: span.to - span.from,
  width: 2 * CAR_HALF_WIDTH,
});

const SAMPLER_36: TopViewSampler = {
  part: "bahrain2020",
  shot: "3.6",
  from: S36.from,
  to: cue("bahrain2020.black"),
  // GRO climbs out of the cockpit and over the rails, and steps off the wreck: in contact with the cell until he walks
  contact: [
    {
      from: S36.from,
      to: S36.from + CLIMB_END,
      ids: ["GRO", "cell"],
      depth: 1.5,
    },
  ],
  poses: (f) => {
    const s = stage36(f - S36.from);
    return [
      person("GRO", s.groAt),
      person("doctor", s.docAt),
      person("marshal", MARSHAL_AT),
      piece("cell", CELL_SPAN),
      piece("rear", REAR_SPAN),
    ];
  },
};

export const SAMPLERS: readonly TopViewSampler[] = [SAMPLER_32, SAMPLER_36];
