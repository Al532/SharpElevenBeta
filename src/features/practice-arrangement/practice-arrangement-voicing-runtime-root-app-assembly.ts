// @ts-check

import { createPracticeArrangementVoicingRuntimeAppBindings } from './practice-arrangement-voicing-runtime-app-bindings.js';
import { createPracticeArrangementVoicingRuntime } from './practice-arrangement-voicing-runtime.js';

/**
 * Creates the drill voicing runtime from live root-app bindings.
 * This keeps the remaining voicing runtime contract out of `app.js` while
 * preserving the existing runtime factory and app-binding seam.
 *
 * @param {Parameters<typeof createPracticeArrangementVoicingRuntime>[0]} [options]
 * @returns {ReturnType<typeof createPracticeArrangementVoicingRuntime>}
 */
export function createPracticeArrangementVoicingRuntimeRootAppAssembly(options = {}) {
  return createPracticeArrangementVoicingRuntime(
    createPracticeArrangementVoicingRuntimeAppBindings(options)
  );
}
