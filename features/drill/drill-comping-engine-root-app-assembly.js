// @ts-check

import { createCompingEngine } from '../../comping-engine.js';
import { createDrillCompingEngineAppBindings } from './drill-comping-engine-app-bindings.js';

/**
 * Creates the drill comping engine from live root-app bindings.
 * This keeps the comping runtime contract out of `app.js` while preserving
 * the current app-owned state and helper closures.
 *
 * @param {object} [options]
 * @param {Record<string, any>} [options.constants]
 * @param {Record<string, any>} [options.helpers]
 */
export function createDrillCompingEngineRootAppAssembly({
  constants = {},
  helpers = {}
} = {}) {
  return createCompingEngine({
    ...createDrillCompingEngineAppBindings({
      constants,
      helpers
    })
  });
}
