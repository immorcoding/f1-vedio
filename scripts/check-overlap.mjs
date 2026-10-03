// Interpenetration check (ART-18). Run: npm run check:overlap
// Walks every frame of every shot registered in src/mv/top-views.ts and flags any two cars whose footprints (true
// length × width, times the drawn scale) intersect outside a declared contact window, or pass through each other
// inside one. Prints the closest approach per shot; exits 1 on any hit.
import { checkTopViews } from "../src/mv/overlap.ts";
import { TOP_VIEWS } from "../src/mv/top-views.ts";

const reports = checkTopViews(TOP_VIEWS, 1);
let bad = 0;
for (const r of reports) {
  const gap = Number.isFinite(r.minGap)
    ? `${r.minGap.toFixed(2)} m at frame ${r.minGapAt}`
    : "—";
  console.log(
    `${r.part} ${r.shot}: ${r.frames} frames, closest ${gap}${r.hits.length ? `, ${r.hits.length} HIT(S)` : ""}`,
  );
  for (const h of r.hits.slice(0, 8))
    console.log(
      `  frame ${h.frame}: ${h.a} × ${h.b} overlap ${(-h.gap).toFixed(2)} m`,
    );
  if (r.hits.length > 8) console.log(`  … ${r.hits.length - 8} more`);
  bad += r.hits.length;
}
if (bad) {
  console.log(`\n${bad} frame(s) with cars passing through each other`);
  process.exit(1);
}
console.log("\nNo interpenetration");
