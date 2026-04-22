// @ts-check

/** @typedef {import('../types/contracts').EmbeddedPlaybackApi} EmbeddedPlaybackApi */
/** @typedef {import('../types/contracts').EmbeddedPlaybackAssembly} EmbeddedPlaybackAssembly */
/** @typedef {import('../types/contracts').EmbeddedPlaybackRuntimeState} EmbeddedPlaybackRuntimeState */
/** @typedef {import('../types/contracts').PlaybackRuntime} PlaybackRuntime */

import { createEmbeddedPlaybackApi } from './embedded-playback-api.js';
import { createPlaybackAssembly } from './playback-assembly.js';

/**
 * Materializes the embedded playback surface around an existing runtime.
 * This centralizes the shared "runtime -> controller -> embedded API" assembly
 * used by the embedded playback surface and keeps the legacy API shape explicit.
 *
 * @param {{
 *   playbackRuntime: PlaybackRuntime,
 *   applyEmbeddedPattern?: (payload: import('../types/contracts').EmbeddedPatternPayload) => import('../types/contracts').PlaybackOperationResult | Promise<import('../types/contracts').PlaybackOperationResult>,
 *   getPlaybackState?: () => EmbeddedPlaybackRuntimeState
 * }} options
 * @returns {EmbeddedPlaybackAssembly}
 */
export function createEmbeddedPlaybackAssembly({
  playbackRuntime,
  applyEmbeddedPattern,
  getPlaybackState
}) {
  if (!playbackRuntime || typeof playbackRuntime.ensurePlaybackController !== 'function') {
    throw new Error('A playback runtime is required.');
  }

  return /** @type {EmbeddedPlaybackAssembly} */ (/** @type {unknown} */ (
    createPlaybackAssembly({
      playbackRuntime,
      createExtensions({ playbackController }) {
        /** @type {EmbeddedPlaybackApi} */
        const embeddedApi = createEmbeddedPlaybackApi({
          playbackRuntime,
          playbackController,
          applyEmbeddedPattern,
          getPlaybackState
        });

        return {
          embeddedApi
        };
      }
    })
  ));
}
