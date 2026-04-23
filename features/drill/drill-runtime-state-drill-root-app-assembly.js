// @ts-check

import { createDrillRuntimeStateRootAppAssembly } from './drill-runtime-state-root-app-assembly.js';

function createGetterName(name) {
  return `get${name.charAt(0).toUpperCase()}${name.slice(1)}`;
}

function createSetterName(name) {
  return `set${name.charAt(0).toUpperCase()}${name.slice(1)}`;
}

function createBindingsFromRefs(refs = {}) {
  const bindings = {};
  for (const [name, ref] of Object.entries(refs)) {
    if (!ref || typeof ref.get !== 'function') continue;
    bindings[createGetterName(name)] = () => ref.get();
    if (typeof ref.set === 'function') {
      bindings[createSetterName(name)] = (value) => ref.set(value);
    }
  }
  return bindings;
}

/**
 * Creates the runtime-state assembly from live root-app bindings while
 * allowing the key-pool/session-analytics state sections to be expressed as
 * compact `refs`.
 *
 * @param {object} [options]
 * @param {Record<string, { get: () => any, set?: (value: any) => void }>} [options.keyPoolStateRefs]
 * @param {Record<string, any>} [options.keyPoolState]
 * @param {Record<string, any>} [options.sessionAnalyticsDom]
 * @param {Record<string, { get: () => any, set?: (value: any) => void }>} [options.sessionAnalyticsStateRefs]
 * @param {Record<string, any>} [options.sessionAnalyticsState]
 * @param {Record<string, any>} [options.sessionAnalyticsHelpers]
 * @param {Record<string, any>} [options.sessionAnalyticsConstants]
 * @param {(() => number) | undefined} [options.sessionAnalyticsNow]
 */
export function createDrillRuntimeStateDrillRootAppAssembly({
  keyPoolStateRefs = {},
  keyPoolState = {},
  sessionAnalyticsDom = {},
  sessionAnalyticsStateRefs = {},
  sessionAnalyticsState = {},
  sessionAnalyticsHelpers = {},
  sessionAnalyticsConstants = {},
  sessionAnalyticsNow
} = {}) {
  return createDrillRuntimeStateRootAppAssembly({
    keyPoolState: {
      ...createBindingsFromRefs(keyPoolStateRefs),
      ...keyPoolState
    },
    sessionAnalyticsDom,
    sessionAnalyticsState: {
      ...createBindingsFromRefs(sessionAnalyticsStateRefs),
      ...sessionAnalyticsState
    },
    sessionAnalyticsHelpers,
    sessionAnalyticsConstants,
    sessionAnalyticsNow
  });
}
