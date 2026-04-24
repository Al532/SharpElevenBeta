// @ts-check
/** @import { createPracticeArrangementVoicingRuntime } from './practice-arrangement-voicing-runtime.js' */

/**
 * Groups the app-level bindings passed into the shared drill voicing runtime.
 *
 * @param {Parameters<typeof createPracticeArrangementVoicingRuntime>[0]} [options]
 * @returns {Parameters<typeof createPracticeArrangementVoicingRuntime>[0]}
 */
export function createPracticeArrangementVoicingRuntimeAppBindings(options = {}) {
  return { ...options };
}
