
import { createDrillRuntimeStateAppAssembly } from './drill-runtime-state-app-assembly.js';
import { createDrillRuntimeStateAppBindings } from './drill-runtime-state-app-bindings.js';
import { createDrillRuntimeStateAppContextOptions } from './drill-runtime-state-app-context.js';

type CreateDrillRuntimeStateRootAppAssemblyOptions = {
  keyPoolState?: Record<string, unknown>;
  sessionAnalyticsDom?: Record<string, unknown>;
  sessionAnalyticsState?: Record<string, unknown>;
  sessionAnalyticsHelpers?: Record<string, unknown>;
  sessionAnalyticsConstants?: Record<string, unknown>;
  sessionAnalyticsNow?: () => number;
};

/**
 * Creates the runtime-state assembly from live root-app bindings.
 * This keeps the key-pool and session-analytics contracts out of `app.js`
 * while preserving the existing app-context/bindings layers.
 *
 * @param {object} [options]
 * @param {Record<string, unknown>} [options.keyPoolState]
 * @param {Record<string, unknown>} [options.sessionAnalyticsDom]
 * @param {Record<string, unknown>} [options.sessionAnalyticsState]
 * @param {Record<string, unknown>} [options.sessionAnalyticsHelpers]
 * @param {Record<string, unknown>} [options.sessionAnalyticsConstants]
 * @param {(() => number) | undefined} [options.sessionAnalyticsNow]
 */
export function createDrillRuntimeStateRootAppAssembly({
  keyPoolState = {},
  sessionAnalyticsDom = {},
  sessionAnalyticsState = {},
  sessionAnalyticsHelpers = {},
  sessionAnalyticsConstants = {},
  sessionAnalyticsNow
}: CreateDrillRuntimeStateRootAppAssemblyOptions = {}) {
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


