// @ts-check

import { bindProgressionControls } from '../../progression-bindings.js';
import { createProgressionEditor } from '../../progression-editor.js';
import { createProgressionManager } from '../../progression-manager.js';

function getStatePropertyName(name) {
  if (!name || name.length <= 3) return '';
  return `${name.charAt(3).toLowerCase()}${name.slice(4)}`;
}

function createLiveStateProxy(bindings = {}) {
  const proxy = {};
  const propertyNames = new Set();

  for (const name of Object.keys(bindings)) {
    if (name.startsWith('get') || name.startsWith('set')) {
      propertyNames.add(getStatePropertyName(name));
    }
  }

  for (const propertyName of propertyNames) {
    if (!propertyName) continue;
    const getterName = `get${propertyName.charAt(0).toUpperCase()}${propertyName.slice(1)}`;
    const setterName = `set${propertyName.charAt(0).toUpperCase()}${propertyName.slice(1)}`;
    const getter = bindings[getterName];
    const setter = bindings[setterName];

    Object.defineProperty(proxy, propertyName, {
      enumerable: true,
      configurable: true,
      get: typeof getter === 'function' ? () => getter() : undefined,
      set: typeof setter === 'function' ? (value) => setter(value) : undefined
    });
  }

  return proxy;
}

/**
 * Creates the drill progression assembly from live root-app bindings. This
 * keeps the editor, manager, and control-binding contracts out of `app.js`
 * while preserving the same progression workflow surface.
 *
 * @param {object} [options]
 * @param {Record<string, any>} [options.dom]
 * @param {Record<string, any>} [options.editorState]
 * @param {Record<string, any>} [options.editorConstants]
 * @param {Record<string, any>} [options.editorHelpers]
 * @param {Record<string, any>} [options.managerState]
 * @param {Record<string, any>} [options.managerConstants]
 * @param {Record<string, any>} [options.managerHelpers]
 * @param {Record<string, any>} [options.controlsState]
 * @param {Record<string, any>} [options.controlsConstants]
 * @param {Record<string, any>} [options.controlsHelpers]
 */
export function createDrillProgressionRootAppAssembly({
  dom = {},
  editorState = {},
  editorConstants = {},
  editorHelpers = {},
  managerState = {},
  managerConstants = {},
  managerHelpers = {},
  controlsState = {},
  controlsConstants = {},
  controlsHelpers = {}
} = {}) {
  const progressionEditor = createProgressionEditor({
    dom,
    state: createLiveStateProxy(editorState),
    constants: editorConstants,
    helpers: editorHelpers
  });
  const progressionManager = createProgressionManager({
    dom,
    state: createLiveStateProxy(managerState),
    constants: managerConstants,
    helpers: {
      ...progressionEditor,
      ...managerHelpers
    }
  });

  bindProgressionControls({
    dom,
    constants: controlsConstants,
    state: createLiveStateProxy(controlsState),
    helpers: {
      ...progressionEditor,
      ...progressionManager,
      ...controlsHelpers
    }
  });

  return {
    ...progressionEditor,
    ...progressionManager
  };
}
