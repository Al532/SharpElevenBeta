// @ts-check

import { createWalkingBassGenerator } from './practice-arrangement-walking-bass.js';
import { createPracticeArrangementWalkingBassAppBindings } from './practice-arrangement-walking-bass-app-bindings.js';

/**
 * Creates the drill walking bass generator from live root-app bindings.
 * This keeps the walking bass generator contract out of `app.js` while
 * preserving the existing app-owned binding seam.
 *
 * @param {object} [options]
 * @param {Record<string, unknown>} [options.constants]
 */
export function createPracticeArrangementWalkingBassRootAppAssembly({
  constants = {}
} = {}) {
  return createWalkingBassGenerator(
    createPracticeArrangementWalkingBassAppBindings({
      constants
    })
  );
}
