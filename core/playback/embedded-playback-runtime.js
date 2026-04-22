// @ts-check

/** @typedef {import('../types/contracts').EmbeddedPatternPayload} EmbeddedPatternPayload */
/** @typedef {import('../types/contracts').EmbeddedPlaybackApiClient} EmbeddedPlaybackApiClient */
/** @typedef {import('../types/contracts').EmbeddedPlaybackRuntime} EmbeddedPlaybackRuntime */
/** @typedef {import('../types/contracts').PlaybackRuntime} PlaybackRuntime */
/** @typedef {import('../types/contracts').PlaybackSettings} PlaybackSettings */
/** @typedef {import('../types/contracts').PracticeSessionSpec} PracticeSessionSpec */

import { createEmbeddedPlaybackSessionAdapter } from './embedded-playback-session-adapter.js';
import { createPlaybackRuntime } from './playback-runtime.js';

/**
 * Composes the legacy embedded playback bridge into a single typed runtime.
 * This gives chart consumers a stable runtime boundary while the actual
 * implementation can later move away from the iframe/global API.
 *
 * @param {{
 *   apiClient: EmbeddedPlaybackApiClient,
 *   buildPatternPayload: (sessionSpec: PracticeSessionSpec | null, playbackSettings: PlaybackSettings) => EmbeddedPatternPayload
 * }} options
 * @returns {EmbeddedPlaybackRuntime}
 */
export function createEmbeddedPlaybackRuntime({
  apiClient,
  buildPatternPayload
}) {
  const playbackRuntime =
    /** @type {PlaybackRuntime} */ (
      createPlaybackRuntime({
        adapter: createEmbeddedPlaybackSessionAdapter({
          apiClient,
          buildPatternPayload
        }),
        ensureReady() {
          return apiClient.ensureApi();
        }
      })
    );

  return /** @type {EmbeddedPlaybackRuntime} */ (playbackRuntime);
}
