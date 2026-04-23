// @ts-check

import { createDrillUiBootstrapRootAppAssembly } from './drill-ui-bootstrap-root-app-assembly.js';

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
 * Creates the drill UI bootstrap assembly from live app bindings while
 * allowing screen/runtime state sections to be passed via compact `refs`.
 *
 * @param {object} [options]
 * @param {Record<string, any>} [options.screen]
 * @param {Record<string, any>} [options.screenDom]
 * @param {Record<string, { get: () => any, set?: (value: any) => void }>} [options.screenStateRefs]
 * @param {Record<string, any>} [options.screenState]
 * @param {Record<string, any>} [options.screenConstants]
 * @param {Record<string, any>} [options.screenHelpers]
 * @param {Record<string, any>} [options.harmonyDisplayObservers]
 * @param {Record<string, any>} [options.pianoControls]
 * @param {Record<string, any>} [options.runtimeControls]
 * @param {Record<string, any>} [options.runtimeControlsDom]
 * @param {Record<string, { get: () => any, set?: (value: any) => void }>} [options.runtimeControlsStateRefs]
 * @param {Record<string, any>} [options.runtimeControlsState]
 * @param {Record<string, any>} [options.runtimeControlsConstants]
 * @param {Record<string, any>} [options.runtimeControlsHelpers]
 */
export function createDrillUiBootstrapDrillRootAppAssembly({
  screen = {},
  screenDom = {},
  screenStateRefs = {},
  screenState = {},
  screenConstants = {},
  screenHelpers = {},
  harmonyDisplayObservers = {},
  pianoControls = {},
  runtimeControls = {},
  runtimeControlsDom = {},
  runtimeControlsStateRefs = {},
  runtimeControlsState = {},
  runtimeControlsConstants = {},
  runtimeControlsHelpers = {}
} = {}) {
  return createDrillUiBootstrapRootAppAssembly({
    screen,
    screenDom,
    screenState: {
      ...createBindingsFromRefs(screenStateRefs),
      ...screenState
    },
    screenConstants,
    screenHelpers,
    harmonyDisplayObservers,
    pianoControls,
    runtimeControls,
    runtimeControlsDom,
    runtimeControlsState: {
      ...createBindingsFromRefs(runtimeControlsStateRefs),
      ...runtimeControlsState
    },
    runtimeControlsConstants,
    runtimeControlsHelpers
  });
}
