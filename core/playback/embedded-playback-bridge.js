// @ts-check

/** @typedef {import('../types/contracts').EmbeddedPatternPayload} EmbeddedPatternPayload */
/** @typedef {import('../types/contracts').EmbeddedPlaybackBridgeOptions} EmbeddedPlaybackBridgeOptions */
/** @typedef {import('../types/contracts').EmbeddedPlaybackBridge} EmbeddedPlaybackBridge */
/** @typedef {import('../types/contracts').PlaybackSettings} PlaybackSettings */
/** @typedef {import('../types/contracts').PracticeSessionSpec} PracticeSessionSpec */

import { createEmbeddedPlaybackApiClient } from './embedded-playback-api-client.js';
import { createEmbeddedPlaybackRuntime } from './embedded-playback-runtime.js';
import { createPlaybackAssembly } from './playback-assembly.js';

/**
 * Creates the legacy embedded playback bridge used by chart playback.
 * Centralizing this assembly keeps the iframe/global bridge isolated behind a
 * single core factory while the runtime is being migrated.
 *
 * @param {EmbeddedPlaybackBridgeOptions} options
 * @returns {EmbeddedPlaybackBridge}
 */
export function createEmbeddedPlaybackBridge({
  getTargetWindow,
  getHostFrame,
  readyEventName,
  timeoutMs,
  buildPatternPayload
}) {
  const apiClient = createEmbeddedPlaybackApiClient({
    getTargetWindow,
    getHostFrame,
    readyEventName,
    timeoutMs
  });
  const playbackRuntime = createEmbeddedPlaybackRuntime({
    apiClient,
    buildPatternPayload
  });
  return createPlaybackAssembly({
    playbackRuntime,
    createExtensions() {
      return {
        apiClient
      };
    }
  });
}
