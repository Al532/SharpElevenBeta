// @ts-check

/**
 * Groups the app-level bindings consumed by the settings assembly before the
 * shared settings bindings normalization layer.
 *
 * @param {object} [options]
 * @returns {Record<string, any>}
 */
export function createDrillSettingsRuntimeAppBindings(options = {}) {
  return { ...options };
}
