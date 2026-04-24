// @ts-check
/** @import { createDrillVoicingRuntime } from './drill-voicing-runtime.js' */

/**
 * Groups the app-level bindings passed into the shared drill voicing runtime.
 *
 * @param {Parameters<typeof createDrillVoicingRuntime>[0]} [options]
 * @returns {Parameters<typeof createDrillVoicingRuntime>[0]}
 */
export function createDrillVoicingRuntimeAppBindings(options = {}) {
  return { ...options };
}
