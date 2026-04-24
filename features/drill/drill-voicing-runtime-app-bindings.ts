// @ts-check

/**
 * Groups the app-level bindings passed into the shared drill voicing runtime.
 *
 * @param {object} [options]
 * @returns {Record<string, any>}
 */
export function createDrillVoicingRuntimeAppBindings(options = {}) {
  return { ...options };
}
