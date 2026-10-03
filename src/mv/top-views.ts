// Every shot that places cars on a plan (a top-down map, or a side-on panel staged in world metres), for the
// interpenetration check (ART-18, scripts/check-overlap.mjs). A part registers its samplers here with one line; see
// src/mv/overlap.ts for the TopViewSampler contract (footprint = true length × width, × drawn scale; contact windows).
import type { TopViewSampler } from "./overlap.ts";
import { SAMPLERS as SUZUKA_1989 } from "./parts/suzuka1989/staging.ts";

export const TOP_VIEWS: readonly TopViewSampler[] = [...SUZUKA_1989];
