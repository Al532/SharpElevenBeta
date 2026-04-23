// @ts-check

import { createDrillSharedPlaybackRootAppAssembly } from './drill-shared-playback-root-app-assembly.js';
import { createDrillSharedPlaybackRootAppContext } from './drill-shared-playback-root-app-context.js';

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
 * Creates the drill shared playback runtime from live root-app bindings while
 * keeping the embedded/direct context construction out of `app.js`.
 *
 * @param {object} [options]
 * @param {Record<string, any>} [options.dom]
 * @param {Record<string, any>} [options.host]
 * @param {Record<string, { get: () => any, set?: (value: any) => void }>} [options.hostStateRefs]
 * @param {Record<string, any>} [options.patternUi]
 * @param {Record<string, any>} [options.normalization]
 * @param {Record<string, any>} [options.playbackSettings]
 * @param {Record<string, any>} [options.embeddedPlaybackState]
 * @param {Record<string, any>} [options.embeddedPlaybackRuntime]
 * @param {Record<string, any>} [options.embeddedTransportActions]
 * @param {Record<string, any>} [options.directPlaybackRuntime]
 * @param {Record<string, { get: () => any, set?: (value: any) => void }>} [options.directPlaybackRuntimeStateRefs]
 * @param {Record<string, any>} [options.directPlaybackState]
 * @param {Record<string, { get: () => any, set?: (value: any) => void }>} [options.directPlaybackStateRefs]
 * @param {Record<string, any>} [options.directTransportActions]
 */
export function createDrillSharedPlaybackDrillRootAppAssembly({
  dom = {},
  hostStateRefs = {},
  directPlaybackRuntimeStateRefs = {},
  directPlaybackStateRefs = {},
  ...rootBindings
} = {}) {
  const rootAppContext = createDrillSharedPlaybackRootAppContext({
    ...rootBindings,
    host: {
      ...(rootBindings.host || {}),
      state: {
        ...createBindingsFromRefs(hostStateRefs),
        ...(rootBindings.host?.state || {})
      }
    },
    directPlaybackRuntime: {
      ...(rootBindings.directPlaybackRuntime || {}),
      state: {
        ...createBindingsFromRefs(directPlaybackRuntimeStateRefs),
        ...(rootBindings.directPlaybackRuntime?.state || {})
      }
    },
    directPlaybackState: {
      ...createBindingsFromRefs(directPlaybackStateRefs),
      ...(rootBindings.directPlaybackState || {})
    }
  });
  return {
    rootAppContext,
    ...createDrillSharedPlaybackRootAppAssembly({
      dom,
      ...rootAppContext
    })
  };
}
