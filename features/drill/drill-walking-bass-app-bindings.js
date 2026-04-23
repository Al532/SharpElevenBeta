// @ts-check

/**
 * Groups the app-level bindings passed into the drill walking bass generator.
 *
 * @param {object} [options]
 * @param {Record<string, any>} [options.constants]
 * @returns {{ constants: Record<string, any> }}
 */
export function createDrillWalkingBassAppBindings({
  constants = {}
} = {}) {
  return {
    constants
  };
}
