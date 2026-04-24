// @ts-check

/**
 * Groups the app-level bindings consumed by the drill settings assembly.
 *
 * @param {object} [options]
 * @param {Record<string, unknown>} [options.defaults]
 * @param {Record<string, unknown>} [options.snapshot]
 * @param {Record<string, unknown>} [options.loadApplier]
 * @param {Record<string, unknown>} [options.loadFinalizer]
 * @param {Record<string, unknown>} [options.resetter]
 * @returns {{
 *   defaults: Record<string, unknown>,
 *   snapshot: Record<string, unknown>,
 *   loadApplier: Record<string, unknown>,
 *   loadFinalizer: Record<string, unknown>,
 *   resetter: Record<string, unknown>
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
