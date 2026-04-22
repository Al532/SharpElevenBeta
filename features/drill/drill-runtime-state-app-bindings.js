// @ts-check

/**
 * Groups the app-level bindings consumed by the runtime-state assembly before
 * the shared runtime-state boundary.
 *
 * @param {object} [options]
 * @returns {Record<string, any>}
 */
export function createDrillRuntimeStateAppBindings(options = {}) {
  return { ...options };
}
