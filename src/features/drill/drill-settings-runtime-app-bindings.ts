// @ts-check

/**
 * Groups the app-level bindings passed into the settings assembly before the
 * shared settings bindings normalization layer.
 *
 * @param {object} [options]
 * @returns {Record<string, unknown>}
 */
export function createDrillSettingsRuntimeAppBindings(options = {}) {
  return { ...options };
}
