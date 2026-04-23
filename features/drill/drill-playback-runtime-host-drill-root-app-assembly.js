// @ts-check

import { createDrillPlaybackRuntimeHostRootAppAssembly } from './drill-playback-runtime-host-root-app-assembly.js';

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
 * Creates the drill playback runtime host from live app bindings while keeping
 * the large root-level state/helper wiring out of `app.js`.
 *
 * @param {object} [options]
 * @param {Record<string, any>} [options.dom]
 * @param {Record<string, { get: () => any, set?: (value: any) => void }>} [options.runtimeStateRefs]
 * @param {Record<string, { get: () => any, set?: (value: any) => void }>} [options.audioStateRefs]
 * @param {Record<string, any>} [options.runtimeState]
 * @param {Record<string, any>} [options.audioState]
 * @param {Record<string, any>} [options.preloadState]
 * @param {Record<string, any>} [options.playbackConstants]
 * @param {Record<string, any>} [options.runtimeHelpers]
 */
export function createDrillPlaybackRuntimeHostDrillRootAppAssembly({
  dom = {},
  runtimeStateRefs = {},
  audioStateRefs = {},
  runtimeState = {},
  audioState = {},
  preloadState = {},
  playbackConstants = {},
  runtimeHelpers = {}
} = {}) {
  return createDrillPlaybackRuntimeHostRootAppAssembly({
    dom,
    runtimeState: {
      ...createBindingsFromRefs(runtimeStateRefs),
      ...runtimeState
    },
    audioState: {
      ...createBindingsFromRefs(audioStateRefs),
      ...audioState
    },
    preloadState,
    playbackConstants,
    runtimeHelpers
  });
}
