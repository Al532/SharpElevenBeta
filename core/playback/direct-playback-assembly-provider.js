// @ts-check

/** @typedef {import('../types/contracts').DirectPlaybackAssemblyProvider} DirectPlaybackAssemblyProvider */
/** @typedef {import('../types/contracts').DirectPlaybackControllerOptions} DirectPlaybackControllerOptions */

import { createPlaybackAssemblyProvider } from './playback-assembly-provider.js';
import { createDirectPlaybackAssembly } from './direct-playback-assembly.js';

/**
 * Creates a memoized provider for the direct playback assembly.
 *
 * @param {DirectPlaybackControllerOptions & {
 *   applyEmbeddedPattern?: (payload: import('../types/contracts').EmbeddedPatternPayload) => import('../types/contracts').PlaybackOperationResult,
 *   applyEmbeddedPlaybackSettings?: (settings: import('../types/contracts').PlaybackSettings) => unknown,
 *   getEmbeddedPlaybackState?: () => Partial<import('../types/contracts').PlaybackRuntimeState>
 * }} [options]
 * @returns {DirectPlaybackAssemblyProvider}
 */
export function createDirectPlaybackAssemblyProvider(options = {}) {
  return /** @type {DirectPlaybackAssemblyProvider} */ (
    createPlaybackAssemblyProvider({
      createAssembly() {
        return createDirectPlaybackAssembly(options);
      }
    })
  );
}
