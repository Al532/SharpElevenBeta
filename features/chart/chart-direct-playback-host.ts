import type { DirectPlaybackControllerOptions } from '../../core/types/contracts';

import { createDirectPlaybackOptionsClient } from '../../core/playback/direct-playback-options-client.js';

export function createChartDirectPlaybackHostResolver({
  getTargetWindow,
  getPreferredTargetWindow,
  getFallbackTargetWindow,
  getHostFrame,
  preferredTimeoutMs = 250,
  timeoutMs = 10000
}: {
  getTargetWindow?: () => Window | null;
  getPreferredTargetWindow?: () => Window | null;
  getFallbackTargetWindow?: () => Window | null;
  getHostFrame?: () => HTMLIFrameElement | null;
  preferredTimeoutMs?: number;
  timeoutMs?: number;
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
    getDirectHostOptions(): DirectPlaybackControllerOptions | null {
      return preferredDirectOptionsClient.getOptions()
        || fallbackDirectOptionsClient.getOptions();
    },
    async ensureDirectHostOptions(): Promise<DirectPlaybackControllerOptions | null> {
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
