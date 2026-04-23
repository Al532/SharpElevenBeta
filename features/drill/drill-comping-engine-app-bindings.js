// @ts-check

/**
 * Groups the app-owned constants and helpers passed into the shared comping
 * engine while `app.js` keeps the live runtime state.
 *
 * @param {object} [options]
 * @param {Record<string, any>} [options.constants]
 * @param {Record<string, any>} [options.helpers]
 * @returns {{
 *   constants: Record<string, any>,
 *   helpers: Record<string, any>
 * }}
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
