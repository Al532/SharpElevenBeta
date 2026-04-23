// @ts-check

/**
 * Groups the live app-owned settings defaults bindings into the settings app
 * context passed to the settings app assembly.
 *
 * @param {Record<string, any>} [options]
 * @returns {Record<string, any>}
 */
export function createDrillSettingsDefaultsAppContext(options = {}) {
  return { ...options };
}
