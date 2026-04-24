
import { createDrillKeyPoolRuntime } from './drill-key-pool-runtime.js';
import { createDrillSessionAnalytics } from './drill-session-analytics.js';

type CreateDrillRuntimeStateAppAssemblyOptions = {
  keyPool?: {
    getEnabledKeys?: () => boolean[];
    getKeyPool?: () => number[];
    setKeyPool?: (value: number[]) => void;
  };
  sessionAnalytics?: {
    dom?: Record<string, unknown>;
    state?: Record<string, unknown>;
    helpers?: Record<string, unknown>;
    constants?: Record<string, unknown>;
    now?: () => number;
  };
};

/**
 * Creates small runtime-state assemblies used by the drill app from grouped
 * app bindings. This keeps lightweight stateful runtime wiring out of
 * `app.js` while preserving the same helper surfaces.
 *
 * @param {{
 *   keyPool?: {
 *     getEnabledKeys?: () => boolean[],
 *     getKeyPool?: () => number[],
 *     setKeyPool?: (value: number[]) => void
 *   },
 *   sessionAnalytics?: {
 *     dom?: Record<string, any>,
 *     state?: Record<string, any>,
 *     helpers?: Record<string, any>,
 *     constants?: Record<string, any>,
 *     now?: () => number
 *   }
 * }} [options]
 * @returns {{
 *   keyPoolRuntime: ReturnType<typeof createDrillKeyPoolRuntime>,
 *   sessionAnalytics: ReturnType<typeof createDrillSessionAnalytics>
 * }}
 */
export function createDrillRuntimeStateAppAssembly({
  keyPool = {},
  sessionAnalytics = {}
}: CreateDrillRuntimeStateAppAssemblyOptions = {}) {
  return {
    keyPoolRuntime: createDrillKeyPoolRuntime(keyPool),
    sessionAnalytics: createDrillSessionAnalytics({
      dom: sessionAnalytics.dom,
      state: sessionAnalytics.state,
      helpers: sessionAnalytics.helpers,
      constants: sessionAnalytics.constants,
      now: sessionAnalytics.now
    })
  };
}


