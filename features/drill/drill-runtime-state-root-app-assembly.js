// @ts-check

import { createDrillRuntimeStateAppAssembly } from './drill-runtime-state-app-assembly.js';
import { createDrillRuntimeStateAppBindings } from './drill-runtime-state-app-bindings.js';
import { createDrillRuntimeStateAppContextOptions } from './drill-runtime-state-app-context.js';

/**
 * Creates the full root-level runtime-state assembly from live app bindings.
 * This keeps the key-pool and session-analytics contracts out of `app.js`
 * while preserving the existing app-context/bindings layers.
 *
 * @param {object} [options]
 * @param {Record<string, any>} [options.keyPoolState]
 * @param {Record<string, any>} [options.sessionAnalyticsDom]
 * @param {Record<string, any>} [options.sessionAnalyticsState]
 * @param {Record<string, any>} [options.sessionAnalyticsHelpers]
 * @param {Record<string, any>} [options.sessionAnalyticsConstants]
 * @param {(() => number) | undefined} [options.sessionAnalyticsNow]
 */
export function createDrillRuntimeStateRootAppAssembly({
  keyPoolState = {},
  sessionAnalyticsDom = {},
  sessionAnalyticsState = {},
  sessionAnalyticsHelpers = {},
  sessionAnalyticsConstants = {},
  sessionAnalyticsNow
} = {}) {
  return createDrillRuntimeStateAppAssembly(
    createDrillRuntimeStateAppBindings(
      createDrillRuntimeStateAppContextOptions({
        keyPoolState,
        sessionAnalyticsDom,
        sessionAnalyticsState,
        sessionAnalyticsHelpers,
        sessionAnalyticsConstants,
        sessionAnalyticsNow
      })
    )
  );
}
