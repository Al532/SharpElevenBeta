// @ts-check

/**
 * Groups the app-level drill settings concerns into the normalized settings
 * assembly input shape, so `app.js` no longer carries that large playback and
 * persistence contract inline.
 *
 * @param {object} [options]
 * @param {Record<string, any>} [options.defaults]
 * @param {Record<string, any>} [options.dom]
 * @param {Record<string, any>} [options.snapshotConstants]
 * @param {Record<string, any>} [options.snapshotState]
 * @param {Record<string, any>} [options.snapshotHelpers]
 * @param {Record<string, any>} [options.loadApplierConstants]
 * @param {Record<string, any>} [options.loadApplierState]
 * @param {Record<string, any>} [options.loadApplierHelpers]
 * @param {Record<string, any>} [options.loadFinalizerConstants]
 * @param {Record<string, any>} [options.loadFinalizerState]
 * @param {Record<string, any>} [options.loadFinalizerHelpers]
 * @param {Record<string, any>} [options.resetterState]
 * @param {Record<string, any>} [options.resetterHelpers]
 * @returns {{
 *   defaults: Record<string, any>,
 *   snapshot: {
 *     constants: Record<string, any>,
 *     dom: Record<string, any>,
 *     state: Record<string, any>,
 *     helpers: Record<string, any>
 *   },
 *   loadApplier: {
 *     constants: Record<string, any>,
 *     dom: Record<string, any>,
 *     state: Record<string, any>,
 *     helpers: Record<string, any>
 *   },
 *   loadFinalizer: {
 *     constants: Record<string, any>,
 *     dom: Record<string, any>,
 *     state: Record<string, any>,
 *     helpers: Record<string, any>
 *   },
 *   resetter: {
 *     dom: Record<string, any>,
 *     state: Record<string, any>,
 *     helpers: Record<string, any>
 *   }
 * }}
 */
export function createDrillSettingsAppContextOptions({
  defaults = {},
  dom = {},
  snapshotConstants = {},
  snapshotState = {},
  snapshotHelpers = {},
  loadApplierConstants = {},
  loadApplierState = {},
  loadApplierHelpers = {},
  loadFinalizerConstants = {},
  loadFinalizerState = {},
  loadFinalizerHelpers = {},
  resetterState = {},
  resetterHelpers = {}
} = {}) {
  return {
    defaults,
    snapshot: {
      constants: snapshotConstants,
      dom,
      state: snapshotState,
      helpers: snapshotHelpers
    },
    loadApplier: {
      constants: loadApplierConstants,
      dom,
      state: loadApplierState,
      helpers: loadApplierHelpers
    },
    loadFinalizer: {
      constants: loadFinalizerConstants,
      dom,
      state: loadFinalizerState,
      helpers: loadFinalizerHelpers
    },
    resetter: {
      dom,
      state: resetterState,
      helpers: resetterHelpers
    }
  };
}
