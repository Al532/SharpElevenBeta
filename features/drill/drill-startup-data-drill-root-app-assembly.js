// @ts-check

import { createDrillStartupDataRootAppAssembly } from './drill-startup-data-root-app-assembly.js';

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
 * Creates the drill startup-data assembly from live app bindings while
 * allowing startup state wiring to be passed via compact `refs`.
 *
 * @param {object} [options]
 * @param {Record<string, { get: () => any, set?: (value: any) => void }>} [options.stateRefs]
 * @param {Record<string, any>} [options.state]
 * @param {Record<string, any>} [options.welcomeStandards]
 * @param {Record<string, any>} [options.patternHelp]
 * @param {Record<string, any>} [options.defaultProgressions]
 */
export function createDrillStartupDataDrillRootAppAssembly({
  stateRefs = {},
  state = {},
  welcomeStandards = {},
  patternHelp = {},
  defaultProgressions = {}
} = {}) {
  return createDrillStartupDataRootAppAssembly({
    state: {
      ...createBindingsFromRefs(stateRefs),
      ...state
    },
    welcomeStandards,
    patternHelp,
    defaultProgressions
  });
}
