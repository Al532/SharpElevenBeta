// @ts-check

/**
 * Groups the app-level runtime-state concerns into the normalized assembly
 * input shape, so `app.js` no longer carries the key-pool and session
 * analytics contracts inline.
 *
 * @param {object} [options]
 * @param {Record<string, any>} [options.keyPoolState]
 * @param {Record<string, any>} [options.sessionAnalyticsDom]
 * @param {Record<string, any>} [options.sessionAnalyticsState]
 * @param {Record<string, any>} [options.sessionAnalyticsHelpers]
 * @param {Record<string, any>} [options.sessionAnalyticsConstants]
 * @param {(() => number) | undefined} [options.sessionAnalyticsNow]
 * @returns {{
 *   keyPool: Record<string, any>,
 *   sessionAnalytics: {
 *     dom: Record<string, any>,
 *     state: Record<string, any>,
 *     helpers: Record<string, any>,
 *     constants: Record<string, any>,
 *     now: (() => number) | undefined
 *   }
 * }}
 */
export function createDrillRuntimeStateAppContextOptions({
  keyPoolState = {},
  sessionAnalyticsDom = {},
  sessionAnalyticsState = {},
  sessionAnalyticsHelpers = {},
  sessionAnalyticsConstants = {},
  sessionAnalyticsNow
} = {}) {
  return {
    keyPool: keyPoolState,
    sessionAnalytics: {
      dom: sessionAnalyticsDom,
      state: sessionAnalyticsState,
      helpers: sessionAnalyticsHelpers,
      constants: sessionAnalyticsConstants,
      now: sessionAnalyticsNow
    }
  };
}
