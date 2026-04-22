// @ts-check

/** @typedef {import('../types/contracts').EmbeddedPatternPayload} EmbeddedPatternPayload */
/** @typedef {import('../types/contracts').EmbeddedPlaybackBridgeProvider} EmbeddedPlaybackBridgeProvider */
/** @typedef {import('../types/contracts').PlaybackSettings} PlaybackSettings */
/** @typedef {import('../types/contracts').PracticeSessionSpec} PracticeSessionSpec */

import { createEmbeddedPlaybackApiClient } from './embedded-playback-api-client.js';
import { createEmbeddedPlaybackRuntimeProvider } from './embedded-playback-runtime-provider.js';
import { createPlaybackBridgeProvider } from './playback-bridge-provider.js';
import { createPlaybackAssembly } from './playback-assembly.js';

/**
 * Creates a memoized provider for the legacy embedded chart playback bridge.
 * This is the default bridge provider for chart playback until a different
 * runtime-backed implementation replaces the iframe/global bridge.
 * It intentionally composes: api client -> runtime provider -> bridge provider.
 *
 * @param {{
 *   getTargetWindow?: () => Window | null,
 *   getHostFrame?: () => HTMLIFrameElement | null,
 *   readyEventName?: string,
 *   timeoutMs?: number,
 *   buildPatternPayload: (sessionSpec: PracticeSessionSpec | null, playbackSettings: PlaybackSettings) => EmbeddedPatternPayload
 * }} options
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
    createPlaybackBridgeProvider({
      createBridge() {
        return /** @type {import('../types/contracts').EmbeddedPlaybackBridge} */ (
          createPlaybackAssembly({
            playbackRuntime: runtimeProvider.getRuntime(),
            createExtensions() {
              return {
                apiClient
              };
            }
          })
        );
      }
    })
  );
}
