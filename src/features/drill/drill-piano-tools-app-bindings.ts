// @ts-check
/** @import { createDrillPianoToolsAppFacade } from './drill-piano-tools.js' */

/**
 * Groups the app-level bindings passed into the drill piano-tools facade.
 *
 * @param {Parameters<typeof createDrillPianoToolsAppFacade>[0]} [options]
 * @returns {Parameters<typeof createDrillPianoToolsAppFacade>[0]}
 */
export function createDrillPianoToolsAppBindings(options = {}) {
  return { ...options };
}
