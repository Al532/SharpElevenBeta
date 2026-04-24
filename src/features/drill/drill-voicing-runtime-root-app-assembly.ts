// @ts-check

import { createDrillVoicingRuntimeAppBindings } from './drill-voicing-runtime-app-bindings.js';
import { createDrillVoicingRuntime } from './drill-voicing-runtime.js';

/**
 * Creates the drill voicing runtime from live root-app bindings.
 * This keeps the remaining voicing runtime contract out of `app.js` while
 * preserving the existing runtime factory and app-binding seam.
 *
 * @param {Parameters<typeof createDrillVoicingRuntime>[0]} [options]
 * @returns {ReturnType<typeof createDrillVoicingRuntime>}
 */
export function createDrillVoicingRuntimeRootAppAssembly(options = {}) {
  return createDrillVoicingRuntime(
    createDrillVoicingRuntimeAppBindings(options)
  );
}
