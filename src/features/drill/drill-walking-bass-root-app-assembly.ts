// @ts-check

import { createWalkingBassGenerator } from './drill-walking-bass.js';
import { createDrillWalkingBassAppBindings } from './drill-walking-bass-app-bindings.js';

/**
 * Creates the drill walking bass generator from live root-app bindings.
 * This keeps the walking bass generator contract out of `app.js` while
 * preserving the existing app-owned binding seam.
 *
 * @param {object} [options]
 * @param {Record<string, unknown>} [options.constants]
 */
export function createDrillWalkingBassRootAppAssembly({
  constants = {}
} = {}) {
  return createWalkingBassGenerator(
    createDrillWalkingBassAppBindings({
      constants
    })
  );
}
