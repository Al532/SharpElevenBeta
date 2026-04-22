// @ts-check

/** @typedef {import('../../core/types/contracts').DirectPlaybackControllerOptions} DirectPlaybackControllerOptions */

import { createDirectPlaybackOptionsClient } from '../../core/playback/direct-playback-options-client.js';

/**
 * Creates the chart direct playback host resolver.
 * The published direct host options are always the runtime contract consumed by
 * chart playback. The iframe may still act as the fallback host, but only by
 * publishing the same direct controller options as the nominal same-page host.
 *
 * @param {{
 *   getTargetWindow?: () => Window | null,
 *   getPreferredTargetWindow?: () => Window | null,
 *   getFallbackTargetWindow?: () => Window | null,
 *   getHostFrame?: () => HTMLIFrameElement | null,
 *   preferredTimeoutMs?: number,
 *   timeoutMs?: number
 * }} [options]
 * @returns {{
 *   getDirectHostOptions: () => DirectPlaybackControllerOptions | null,
 *   ensureDirectHostOptions: () => Promise<DirectPlaybackControllerOptions | null>
 * }}
 */
export function createChartDirectPlaybackHostResolver({
  getTargetWindow,
  getPreferredTargetWindow,
  getFallbackTargetWindow,
  getHostFrame,
  preferredTimeoutMs = 250,
  timeoutMs = 10000
} = {}) {
  const preferredDirectOptionsClient = createDirectPlaybackOptionsClient({
    getTargetWindow: getPreferredTargetWindow,
    timeoutMs: preferredTimeoutMs
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

      if (getPreferredTargetWindow?.()) {
        const delayedPreferredOptions = await preferredDirectOptionsClient.ensureOptions().catch(() => null);
        if (delayedPreferredOptions) {
          return delayedPreferredOptions;
        }
      }

      const fallbackOptions = fallbackDirectOptionsClient.getOptions();
      if (fallbackOptions) {
        return fallbackOptions;
      }

      return fallbackDirectOptionsClient.ensureOptions().catch(() => null);
    }
  };
}
