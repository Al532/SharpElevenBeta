// @ts-check

/**
 * Groups the app-level bindings passed into the runtime-state assembly before
 * the shared runtime-state boundary.
 *
 * @param {object} [options]
 * @returns {Record<string, any>}
 */
export function createDrillRuntimeStateAppBindings(options = {}) {
  return { ...options };
}
