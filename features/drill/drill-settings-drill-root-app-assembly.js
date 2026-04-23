// @ts-check

import { createDrillSettingsRootAppAssembly } from './drill-settings-root-app-assembly.js';

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
 * Creates the drill settings assembly from live app bindings while allowing
 * large state sections to be expressed as `refs` instead of verbose inline
 * getter/setter maps inside `app.js`.
 *
 * @param {object} [options]
 * @param {Record<string, any>} [options.defaults]
 * @param {Record<string, any>} [options.dom]
 * @param {Record<string, any>} [options.snapshotConstants]
 * @param {Record<string, { get: () => any, set?: (value: any) => void }>} [options.snapshotStateRefs]
 * @param {Record<string, any>} [options.snapshotState]
 * @param {Record<string, any>} [options.snapshotHelpers]
 * @param {Record<string, any>} [options.loadApplierConstants]
 * @param {Record<string, { get: () => any, set?: (value: any) => void }>} [options.loadApplierStateRefs]
 * @param {Record<string, any>} [options.loadApplierState]
 * @param {Record<string, any>} [options.loadApplierHelpers]
 * @param {Record<string, any>} [options.loadFinalizerConstants]
 * @param {Record<string, { get: () => any, set?: (value: any) => void }>} [options.loadFinalizerStateRefs]
 * @param {Record<string, any>} [options.loadFinalizerState]
 * @param {Record<string, any>} [options.loadFinalizerHelpers]
 * @param {Record<string, { get: () => any, set?: (value: any) => void }>} [options.resetterStateRefs]
 * @param {Record<string, any>} [options.resetterState]
 * @param {Record<string, any>} [options.resetterHelpers]
 */
export function createDrillSettingsDrillRootAppAssembly({
  defaults = {},
  dom = {},
  snapshotConstants = {},
  snapshotStateRefs = {},
  snapshotState = {},
  snapshotHelpers = {},
  loadApplierConstants = {},
  loadApplierStateRefs = {},
  loadApplierState = {},
  loadApplierHelpers = {},
  loadFinalizerConstants = {},
  loadFinalizerStateRefs = {},
  loadFinalizerState = {},
  loadFinalizerHelpers = {},
  resetterStateRefs = {},
  resetterState = {},
  resetterHelpers = {}
} = {}) {
  return createDrillSettingsRootAppAssembly({
    defaults,
    dom,
    snapshotConstants,
    snapshotState: {
      ...createBindingsFromRefs(snapshotStateRefs),
      ...snapshotState
    },
    snapshotHelpers,
    loadApplierConstants,
    loadApplierState: {
      ...createBindingsFromRefs(loadApplierStateRefs),
      ...loadApplierState
    },
    loadApplierHelpers,
    loadFinalizerConstants,
    loadFinalizerState: {
      ...createBindingsFromRefs(loadFinalizerStateRefs),
      ...loadFinalizerState
    },
    loadFinalizerHelpers,
    resetterState: {
      ...createBindingsFromRefs(resetterStateRefs),
      ...resetterState
    },
    resetterHelpers
  });
}
