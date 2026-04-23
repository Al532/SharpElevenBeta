// @ts-check

import { createDrillSettingsPersistenceRootAppAssembly } from './drill-settings-persistence-root-app-assembly.js';

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
 * Creates the drill settings-persistence assembly from live app bindings while
 * allowing small state sections to be expressed as compact `refs`.
 *
 * @param {object} [options]
 * @param {Record<string, any>} [options.dom]
 * @param {Record<string, any>} [options.constants]
 * @param {Record<string, any>} [options.helpers]
 * @param {Record<string, { get: () => any, set?: (value: any) => void }>} [options.stateRefs]
 * @param {Record<string, any>} [options.state]
 */
export function createDrillSettingsPersistenceDrillRootAppAssembly({
  dom = {},
  constants = {},
  helpers = {},
  stateRefs = {},
  state = {}
} = {}) {
  return createDrillSettingsPersistenceRootAppAssembly({
    dom,
    constants,
    helpers,
    state: {
      ...createBindingsFromRefs(stateRefs),
      ...state
    }
  });
}
