// @ts-check

import { createDrillPianoMidiRuntimeRootAppAssembly } from './drill-piano-midi-runtime-root-app-assembly.js';

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
 * Creates the drill piano MIDI runtime assembly from live app bindings while
 * allowing runtime state wiring to be expressed as compact `refs`.
 *
 * @param {object} [options]
 * @param {Record<string, any>} [options.dom]
 * @param {Record<string, { get: () => any, set?: (value: any) => void }>} [options.runtimeStateRefs]
 * @param {Record<string, any>} [options.runtimeState]
 * @param {Record<string, any>} [options.runtimeHelpers]
 */
export function createDrillPianoMidiRuntimeDrillRootAppAssembly({
  dom = {},
  runtimeStateRefs = {},
  runtimeState = {},
  runtimeHelpers = {}
} = {}) {
  return createDrillPianoMidiRuntimeRootAppAssembly({
    dom,
    runtimeState: {
      ...createBindingsFromRefs(runtimeStateRefs),
      ...runtimeState
    },
    runtimeHelpers
  });
}
