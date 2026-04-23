// @ts-check

/** @typedef {Record<string, any>} ChartBindings */
/** @typedef {(options?: ChartBindings) => ChartBindings} ChartBindingsFactory */

/** @type {ChartBindingsFactory} */
function createChartBindings(options = {}) {
  return { ...options };
}

/** @type {ChartBindingsFactory} */ export const createChartBarSelectionBindings = createChartBindings;
/** @type {ChartBindingsFactory} */ export const createChartDefaultLibraryBindings = createChartBindings;
/** @type {ChartBindingsFactory} */ export const createChartDirectPlaybackRuntimeHostBindings = createChartBindings;
/** @type {ChartBindingsFactory} */ export const createChartFixtureRenderBindings = createChartBindings;
/** @type {ChartBindingsFactory} */ export const createChartImportedLibraryBindings = createChartBindings;
/** @type {ChartBindingsFactory} */ export const createChartImportControlsBindings = createChartBindings;
/** @type {ChartBindingsFactory} */ export const createChartImportStatusBindings = createChartBindings;
/** @type {ChartBindingsFactory} */ export const createChartLayoutObserversBindings = createChartBindings;
/** @type {ChartBindingsFactory} */ export const createChartLibraryImportBindings = createChartBindings;
/** @type {ChartBindingsFactory} */ export const createChartMetaBindings = createChartBindings;
/** @type {ChartBindingsFactory} */ export const createChartMixerBindings = createChartBindings;
/** @type {ChartBindingsFactory} */ export const createChartNavigationBindings = createChartBindings;
/** @type {ChartBindingsFactory} */ export const createChartNavigationStateBindings = createChartBindings;
/** @type {ChartBindingsFactory} */ export const createChartOverlayControlsBindings = createChartBindings;
/** @type {ChartBindingsFactory} */ export const createChartOverlayShellBindings = createChartBindings;
/** @type {ChartBindingsFactory} */ export const createChartPopoverBindings = createChartBindings;
/** @type {ChartBindingsFactory} */ export const createChartRuntimeControlsAppBindings = createChartBindings;
/** @type {ChartBindingsFactory} */ export const createChartRuntimeControlsBindings = createChartBindings;
/** @type {ChartBindingsFactory} */ export const createChartScreenAppBindings = createChartBindings;
/** @type {ChartBindingsFactory} */ export const createChartScreenBindings = createChartBindings;
/** @type {ChartBindingsFactory} */ export const createChartSelectionRenderBindings = createChartBindings;
/** @type {ChartBindingsFactory} */ export const createChartSelectorBindings = createChartBindings;
/** @type {ChartBindingsFactory} */ export const createChartSheetRendererAppBindings = createChartBindings;
/** @type {ChartBindingsFactory} */ export const createChartSheetRendererBindings = createChartBindings;
/** @type {ChartBindingsFactory} */ export const createChartTransportBindings = createChartBindings;
