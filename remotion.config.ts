/**
 * Note: When using the Node.JS APIs, the config file
 * doesn't apply. Instead, pass options directly to the APIs.
 *
 * All configuration options: https://remotion.dev/docs/config
 */

import { Config } from "@remotion/cli/config";

Config.setRspack(true);
Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);

// WebGL effects (light leaks) need a GPU-backed renderer in headless Chrome.
Config.setChromiumOpenGlRenderer("angle");
// Renders are pinned to 8 logical CPUs via `npm run render` / `npm run still` (affinity FF, inherited by Chrome and ffmpeg).
// Inside that budget: 4 browser tabs, and 4 ffmpeg threads for encoding.
Config.setConcurrency(4);
Config.overrideFfmpegCommand(({ args }) => [...args.slice(0, -1), "-threads", "4", args[args.length - 1]]);
