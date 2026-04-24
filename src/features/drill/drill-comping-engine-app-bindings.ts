// @ts-check
/** @typedef {{ constants?: Record<string, unknown>, helpers?: Record<string, unknown> }} DrillCompingEngineBindings */

/**
 * Groups the app-owned constants and helpers passed into the shared comping
 * engine while `app.js` keeps the live runtime state.
 *
 * @param {object} [options]
 * @param {DrillCompingEngineBindings} [options]
 * @returns {{ constants: Record<string, unknown>, helpers: Record<string, unknown> }}
 */
export function createDrillCompingEngineAppBindings({
  constants = {},
  helpers = {}
} = {}) {
  return {
    constants,
    helpers
  };
}
