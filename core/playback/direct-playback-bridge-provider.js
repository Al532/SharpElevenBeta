// @ts-check

/** @typedef {import('../types/contracts').DirectPlaybackBridgeProvider} DirectPlaybackBridgeProvider */
/** @typedef {import('../types/contracts').DirectPlaybackControllerOptions} DirectPlaybackControllerOptions */

import { createRuntimePlaybackBridgeProvider } from './runtime-playback-bridge-provider.js';
import { createDirectPlaybackRuntimeProvider } from './direct-playback-runtime-provider.js';

/**
 * Creates the direct playback bridge provider used by chart playback when it
 * no longer needs the hidden iframe bridge. This currently delegates to the
 * in-page runtime-backed provider that originated in the Drill module.
 *
 * @param {DirectPlaybackControllerOptions} [options]
 * @returns {DirectPlaybackBridgeProvider}
 */
export function createDirectPlaybackBridgeProvider(options = {}) {
  return /** @type {DirectPlaybackBridgeProvider} */ (
    createRuntimePlaybackBridgeProvider({
      runtimeProvider: createDirectPlaybackRuntimeProvider(options)
    })
  );
}
