// @ts-check

/** @typedef {import('../types/contracts').DirectPlaybackControllerOptions} DirectPlaybackControllerOptions */
/** @typedef {import('../types/contracts').DirectPlaybackRuntimeProvider} DirectPlaybackRuntimeProvider */

import { createPlaybackRuntimeProvider } from './playback-runtime-provider.js';
import { createDirectPlaybackRuntime } from './direct-playback-runtime.js';

/**
 * Creates a memoized provider for the direct in-page playback runtime.
 *
 * @param {DirectPlaybackControllerOptions & {
 *   applyEmbeddedPattern?: (payload: import('../types/contracts').EmbeddedPatternPayload) => import('../types/contracts').PlaybackOperationResult,
 *   applyEmbeddedPlaybackSettings?: (settings: import('../types/contracts').PlaybackSettings) => unknown,
 *   getEmbeddedPlaybackState?: () => Partial<import('../types/contracts').PlaybackRuntimeState>
 * }} [options]
 * @returns {DirectPlaybackRuntimeProvider}
 */
export function createDirectPlaybackRuntimeProvider(options = {}) {
  return /** @type {DirectPlaybackRuntimeProvider} */ (
    createPlaybackRuntimeProvider({
      createRuntime() {
        return createDirectPlaybackRuntime(options);
      }
    })
  );
}
