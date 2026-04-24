// @ts-check

import { createCompingEngine } from './practice-arrangement-comping-engine.js';
import { createPracticeArrangementCompingEngineAppBindings } from './practice-arrangement-comping-engine-app-bindings.js';

/**
 * Creates the drill comping engine from live root-app bindings.
 * This keeps the comping runtime contract out of `app.js` while preserving
 * the current app-owned state and helper closures.
 *
 * @param {object} [options]
 * @param {Record<string, unknown>} [options.constants]
 * @param {Record<string, unknown>} [options.helpers]
 */
export function createPracticeArrangementCompingEngineRootAppAssembly({
  constants = {},
  helpers = {}
} = {}) {
  return createCompingEngine({
    ...createPracticeArrangementCompingEngineAppBindings({
      constants,
      helpers
    })
  });
}
