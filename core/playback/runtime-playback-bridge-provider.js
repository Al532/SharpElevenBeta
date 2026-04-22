// @ts-check

/** @typedef {import('../types/contracts').PlaybackBridge} PlaybackBridge */
/** @typedef {import('../types/contracts').PlaybackRuntimeProvider} PlaybackRuntimeProvider */
/** @typedef {import('../types/contracts').RuntimePlaybackBridgeProvider} RuntimePlaybackBridgeProvider */

import { createPlaybackAssembly } from './playback-assembly.js';
import { createPlaybackBridgeProvider } from './playback-bridge-provider.js';

/**
 * Creates a memoized bridge provider from a runtime provider.
 * This is the key seam that lets higher-level consumers swap the playback
 * backend by changing only the runtime provider implementation.
 *
 * @param {{
 *   runtimeProvider: PlaybackRuntimeProvider,
 *   createExtensions?: (bindings: import('../types/contracts').PlaybackRuntimeBindings) => Record<string, unknown>
 * }} options
 * @returns {RuntimePlaybackBridgeProvider}
 */
export function createRuntimePlaybackBridgeProvider({
  runtimeProvider,
  createExtensions
}) {
  if (!runtimeProvider || typeof runtimeProvider.getRuntime !== 'function') {
    throw new Error('A playback runtime provider is required.');
  }

  return /** @type {RuntimePlaybackBridgeProvider} */ (
    createPlaybackBridgeProvider({
      createBridge() {
        return /** @type {PlaybackBridge} */ (
          createPlaybackAssembly({
            playbackRuntime: runtimeProvider.getRuntime(),
            createExtensions
          })
        );
      }
    })
  );
}
