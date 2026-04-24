// @ts-check

import {
  createDrillHarmonyDisplayHelpers,
  createDrillHarmonyLayoutHelpers,
  createDrillPreviewTimingHelpers
} from './drill-display-runtime.js';

/**
 * Creates the drill display/runtime helper assembly from live root-app
 * bindings. This keeps the harmony-display, preview-timing, and layout-helper
 * contracts out of `app.js` while preserving the same helper surfaces.
 *
 * @param {object} [options]
 * @param {Record<string, unknown>} [options.harmonyDisplay]
 * @param {Record<string, unknown>} [options.previewTiming]
 * @param {Record<string, unknown>} [options.harmonyLayout]
 * @returns {{
 *   harmonyDisplayHelpers: ReturnType<typeof createDrillHarmonyDisplayHelpers>,
 *   previewTimingHelpers: ReturnType<typeof createDrillPreviewTimingHelpers>,
 *   harmonyLayoutHelpers: ReturnType<typeof createDrillHarmonyLayoutHelpers>
 * }}
 */
export function createDrillDisplayRuntimeRootAppAssembly({
  harmonyDisplay = {},
  previewTiming = {},
  harmonyLayout = {}
} = {}) {
  return {
    harmonyDisplayHelpers: createDrillHarmonyDisplayHelpers(harmonyDisplay),
    previewTimingHelpers: createDrillPreviewTimingHelpers(previewTiming),
    harmonyLayoutHelpers: createDrillHarmonyLayoutHelpers(harmonyLayout)
  };
}
