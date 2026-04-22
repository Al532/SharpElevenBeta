// @ts-check

/**
 * Groups the app-level bindings consumed by the chart sheet-renderer factory.
 *
 * @param {object} [options]
 * @returns {Record<string, any>}
 */
export function createChartSheetRendererAppBindings(options = {}) {
  return { ...options };
}
