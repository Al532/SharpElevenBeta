// @ts-check

/** @typedef {import('../types/contracts').EmbeddedPatternPayload} EmbeddedPatternPayload */
/** @typedef {import('../types/contracts').EmbeddedPlaybackApiClient} EmbeddedPlaybackApiClient */
/** @typedef {import('../types/contracts').EmbeddedPlaybackRuntimeProvider} EmbeddedPlaybackRuntimeProvider */
/** @typedef {import('../types/contracts').PlaybackSettings} PlaybackSettings */
/** @typedef {import('../types/contracts').PracticeSessionSpec} PracticeSessionSpec */

import { createEmbeddedPlaybackRuntime } from './embedded-playback-runtime.js';
import { createPlaybackRuntimeProvider } from './playback-runtime-provider.js';

/**
 * Creates a memoized provider for the embedded playback runtime.
 *
 * @param {{
 *   apiClient: EmbeddedPlaybackApiClient,
 *   buildPatternPayload: (sessionSpec: PracticeSessionSpec | null, playbackSettings: PlaybackSettings) => EmbeddedPatternPayload
 * }} options
 * @returns {EmbeddedPlaybackRuntimeProvider}
 */
export function createEmbeddedPlaybackRuntimeProvider({
  apiClient,
  buildPatternPayload
}) {
  return /** @type {EmbeddedPlaybackRuntimeProvider} */ (
    createPlaybackRuntimeProvider({
      createRuntime() {
        return createEmbeddedPlaybackRuntime({
          apiClient,
          buildPatternPayload
        });
      }
    })
  );
}
