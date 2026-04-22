// @ts-check

import { createDrillPianoToolsAppBindings } from './drill-piano-tools-app-bindings.js';
import { createDrillPianoToolsAppFacade } from './drill-piano-tools.js';

/**
 * Creates the drill piano-tools facade from live root-app bindings.
 * This keeps the piano settings/runtime bridge out of `app.js` while
 * preserving the existing facade and app-binding seam.
 *
 * @param {object} [options]
 * @returns {Record<string, any>}
 */
export function createDrillPianoToolsRootAppFacade(options = {}) {
  return createDrillPianoToolsAppFacade(
    createDrillPianoToolsAppBindings(options)
  );
}
