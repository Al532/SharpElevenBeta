// @ts-check

/**
 * Groups the app-level bindings consumed by the chart direct playback runtime
 * host.
 *
 * @param {object} [options]
 * @returns {Record<string, any>}
 */
export function createChartDirectPlaybackRuntimeHostBindings(options = {}) {
  return { ...options };
}
