// @ts-check

/** @typedef {import('../types/contracts').EmbeddedPatternPayload} EmbeddedPatternPayload */
/** @typedef {import('../types/contracts').EmbeddedPlaybackBridgeOptions} EmbeddedPlaybackBridgeOptions */
/** @typedef {import('../types/contracts').EmbeddedPlaybackBridgeProvider} EmbeddedPlaybackBridgeProvider */
/** @typedef {import('../types/contracts').PlaybackSettings} PlaybackSettings */
/** @typedef {import('../types/contracts').PracticeSessionSpec} PracticeSessionSpec */

import { createEmbeddedPlaybackApiClient } from './embedded-playback-api-client.js';
import { createEmbeddedPlaybackRuntimeProvider } from './embedded-playback-runtime-provider.js';
import { createRuntimePlaybackBridgeProvider } from './runtime-playback-bridge-provider.js';

/**
 * Creates a memoized provider for the legacy embedded chart playback bridge.
 * This is the default bridge provider for chart playback until a different
 * runtime-backed implementation replaces the iframe/global bridge.
 * It intentionally composes: api client -> runtime provider -> bridge provider.
 *
 * @param {EmbeddedPlaybackBridgeOptions} options
 * @returns {EmbeddedPlaybackBridgeProvider}
 */
export function createEmbeddedPlaybackBridgeProvider({
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
  const runtimeProvider = createEmbeddedPlaybackRuntimeProvider({
    apiClient,
    buildPatternPayload
  });

  return /** @type {EmbeddedPlaybackBridgeProvider} */ (
    createRuntimePlaybackBridgeProvider({
      runtimeProvider,
      createExtensions() {
        return {
          apiClient
        };
      }
    })
  );
}
