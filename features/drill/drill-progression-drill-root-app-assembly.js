// @ts-check

import { createDrillProgressionRootAppAssembly } from './drill-progression-root-app-assembly.js';

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
 * Creates the drill progression assembly from live app bindings while letting
 * the editor/manager/control state wiring be expressed as compact `refs`.
 *
 * @param {object} [options]
 * @param {Record<string, any>} [options.dom]
 * @param {Record<string, { get: () => any, set?: (value: any) => void }>} [options.editorStateRefs]
 * @param {Record<string, any>} [options.editorState]
 * @param {Record<string, any>} [options.editorConstants]
 * @param {Record<string, any>} [options.editorHelpers]
 * @param {Record<string, { get: () => any, set?: (value: any) => void }>} [options.managerStateRefs]
 * @param {Record<string, any>} [options.managerState]
 * @param {Record<string, any>} [options.managerConstants]
 * @param {Record<string, any>} [options.managerHelpers]
 * @param {Record<string, { get: () => any, set?: (value: any) => void }>} [options.controlsStateRefs]
 * @param {Record<string, any>} [options.controlsState]
 * @param {Record<string, any>} [options.controlsConstants]
 * @param {Record<string, any>} [options.controlsHelpers]
 * @param {Record<string, any>} [options.domainState]
 * @param {Record<string, any>} [options.domainConstants]
 * @param {Record<string, any>} [options.domainHelpers]
 */
export function createDrillProgressionDrillRootAppAssembly({
  dom = {},
  editorStateRefs = {},
  editorState = {},
  editorConstants = {},
  editorHelpers = {},
  managerStateRefs = {},
  managerState = {},
  managerConstants = {},
  managerHelpers = {},
  controlsStateRefs = {},
  controlsState = {},
  controlsConstants = {},
  controlsHelpers = {},
  domainState = {},
  domainConstants = {},
  domainHelpers = {}
} = {}) {
  return createDrillProgressionRootAppAssembly({
    dom,
    editorState: {
      ...createBindingsFromRefs(editorStateRefs),
      ...editorState
    },
    editorConstants,
    editorHelpers,
    managerState: {
      ...createBindingsFromRefs(managerStateRefs),
      ...managerState
    },
    managerConstants,
    managerHelpers,
    controlsState: {
      ...createBindingsFromRefs(controlsStateRefs),
      ...controlsState
    },
    controlsConstants,
    controlsHelpers,
    domainState,
    domainConstants,
    domainHelpers
  });
}
