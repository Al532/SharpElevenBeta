// @ts-check

/**
 * Groups the app-level bindings consumed by the drill settings assembly.
 *
 * @param {object} [options]
 * @param {Record<string, any>} [options.defaults]
 * @param {Record<string, any>} [options.snapshot]
 * @param {Record<string, any>} [options.loadApplier]
 * @param {Record<string, any>} [options.loadFinalizer]
 * @param {Record<string, any>} [options.resetter]
 * @returns {{
 *   defaults: Record<string, any>,
 *   snapshot: Record<string, any>,
 *   loadApplier: Record<string, any>,
 *   loadFinalizer: Record<string, any>,
 *   resetter: Record<string, any>
 * }}
 */
export function createDrillSettingsAppBindings({
  defaults = {},
  snapshot = {},
  loadApplier = {},
  loadFinalizer = {},
  resetter = {}
} = {}) {
  return {
    defaults,
    snapshot,
    loadApplier,
    loadFinalizer,
    resetter
  };
}
