// @ts-check

/** @typedef {import('../../core/types/contracts').DirectPlaybackControllerOptions} DirectPlaybackControllerOptions */
/** @typedef {import('../../core/types/contracts').EmbeddedPlaybackApi} EmbeddedPlaybackApi */

import { createDirectPlaybackOptionsClient } from '../../core/playback/direct-playback-options-client.js';
import { resolveEmbeddedPlaybackApi } from '../../core/playback/embedded-playback-globals.js';

/**
 * Creates the transitional chart direct playback host resolver.
 * The published direct host options are preferred, but the current embedded
 * API remains available as an explicit fallback while the iframe runtime is
 * still acting as the temporary direct host.
 *
 * @param {{
 *   getTargetWindow?: () => Window | null,
 *   getPreferredTargetWindow?: () => Window | null,
 *   getFallbackTargetWindow?: () => Window | null,
 *   getHostFrame?: () => HTMLIFrameElement | null,
 *   timeoutMs?: number
 * }} [options]
 * @returns {{
 *   getDirectHostOptions: () => DirectPlaybackControllerOptions | null,
 *   ensureDirectHostOptions: () => Promise<DirectPlaybackControllerOptions | null>,
 *   getEmbeddedApi: () => EmbeddedPlaybackApi | null
 * }}
 */
export function createChartDirectPlaybackHostResolver({
  getTargetWindow,
  getPreferredTargetWindow,
  getFallbackTargetWindow,
  getHostFrame,
  timeoutMs = 10000
} = {}) {
  const preferredDirectOptionsClient = createDirectPlaybackOptionsClient({
    getTargetWindow: getPreferredTargetWindow,
    timeoutMs
  });
  const fallbackDirectOptionsClient = createDirectPlaybackOptionsClient({
    getTargetWindow: getFallbackTargetWindow || getTargetWindow,
    getHostFrame,
    timeoutMs
  });

  return {
    getDirectHostOptions() {
      return preferredDirectOptionsClient.getOptions()
        || fallbackDirectOptionsClient.getOptions();
    },
    async ensureDirectHostOptions() {
      const preferredOptions = preferredDirectOptionsClient.getOptions();
      if (preferredOptions) {
        return preferredOptions;
      }

      const fallbackOptions = fallbackDirectOptionsClient.getOptions();
      if (fallbackOptions) {
        return fallbackOptions;
      }

      return fallbackDirectOptionsClient.ensureOptions().catch(() => null);
    },
    getEmbeddedApi() {
      return resolveEmbeddedPlaybackApi(
        (getFallbackTargetWindow?.() || getTargetWindow?.() || null)
      );
    }
  };
}
