// Every shot that places cars on a plan (a top-down map, or a side-on panel staged in world metres), for the
// interpenetration check (ART-18, scripts/check-overlap.mjs). A part registers its samplers here with one line; see
// src/mv/overlap.ts for the TopViewSampler contract (footprint = true length × width, × drawn scale; contact windows).
import type { TopViewSampler } from "./overlap.ts";
import { SAMPLERS as BRAZIL_2008 } from "./parts/brazil2008/staging.ts";
import { SAMPLERS as SUZUKA_1989 } from "./parts/suzuka1989/staging.ts";
import { SAMPLERS as BAHRAIN_2020 } from "./parts/bahrain2020/staging.ts";
import { SAMPLERS as SUZUKA_1990 } from "./parts/suzuka1990/staging.ts";
import { SAMPLERS as ABU_DHABI_2021 } from "./parts/abuDhabi2021/staging.ts";

export const TOP_VIEWS: readonly TopViewSampler[] = [
  ...SUZUKA_1989,
  ...SUZUKA_1990,
  ...BRAZIL_2008,
  ...BAHRAIN_2020,
  ...ABU_DHABI_2021,
];
