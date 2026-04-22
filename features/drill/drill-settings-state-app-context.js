// @ts-check

/**
 * Groups the live settings state/helper concerns before they are normalized by
 * `createDrillSettingsAppContextOptions`, so `app.js` no longer carries the
 * large settings persistence/runtime contract inline.
 *
 * @param {object} [options]
 * @param {Record<string, any>} [options.snapshotState]
 * @param {Record<string, any>} [options.snapshotHelpers]
 * @param {Record<string, any>} [options.loadApplierState]
 * @param {Record<string, any>} [options.loadApplierHelpers]
 * @param {Record<string, any>} [options.loadFinalizerState]
 * @param {Record<string, any>} [options.loadFinalizerHelpers]
 * @param {Record<string, any>} [options.resetterState]
 * @param {Record<string, any>} [options.resetterHelpers]
 * @returns {{
 *   snapshotState: Record<string, any>,
 *   snapshotHelpers: Record<string, any>,
 *   loadApplierState: Record<string, any>,
 *   loadApplierHelpers: Record<string, any>,
 *   loadFinalizerState: Record<string, any>,
 *   loadFinalizerHelpers: Record<string, any>,
 *   resetterState: Record<string, any>,
 *   resetterHelpers: Record<string, any>
 * }}
 */
export function createDrillSettingsStateAppContext({
  snapshotState = {},
  snapshotHelpers = {},
  loadApplierState = {},
  loadApplierHelpers = {},
  loadFinalizerState = {},
  loadFinalizerHelpers = {},
  resetterState = {},
  resetterHelpers = {}
} = {}) {
  return {
    snapshotState,
    snapshotHelpers,
    loadApplierState,
    loadApplierHelpers,
    loadFinalizerState,
    loadFinalizerHelpers,
    resetterState,
    resetterHelpers
  };
}
