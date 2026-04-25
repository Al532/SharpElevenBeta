import type { EmbeddedPlaybackApi } from '../types/contracts';

import { PLAYBACK_API_READY_EVENT } from './embedded-playback-identifiers.js';

export function waitForEmbeddedPlaybackApi({
  getTargetWindow,
  getHostFrame,
  getEmbeddedApi,
  readyEventName = PLAYBACK_API_READY_EVENT,
  timeoutMs = 10000
}: {
  getTargetWindow?: () => Window | null;
  getHostFrame?: () => HTMLIFrameElement | null;
  getEmbeddedApi?: () => EmbeddedPlaybackApi | null;
  readyEventName?: string;
  timeoutMs?: number;
} = {}): Promise<EmbeddedPlaybackApi> {
  return new Promise((resolve, reject) => {
    const frame = getHostFrame?.() || null;
    if (!frame) {
      reject(new Error('Missing playback bridge iframe.'));
      return;
    }

    const finish = () => {
      const embeddedApi = getEmbeddedApi?.() || null;
      if (embeddedApi) {
        resolve(embeddedApi);
        return true;
      }
      return false;
    };

    if (finish()) return;

    const onReady = () => {
      cleanup();
      if (finish()) return;
      reject(new Error('Playback bridge loaded without exposing an API.'));
    };

    const onLoad = () => {
      window.setTimeout(() => {
        const embeddedApi = getEmbeddedApi?.() || null;
        if (embeddedApi) {
          cleanup();
          resolve(embeddedApi);
        }
      }, 0);
    };

    const cleanup = () => {
      frame.removeEventListener('load', onLoad);
      getTargetWindow?.()?.removeEventListener?.(readyEventName, onReady);
    };

    frame.addEventListener('load', onLoad, { once: true });
    getTargetWindow?.()?.addEventListener?.(readyEventName, onReady, { once: true });

    window.setTimeout(() => {
      const embeddedApi = getEmbeddedApi?.() || null;
      if (embeddedApi) {
        cleanup();
        resolve(embeddedApi);
        return;
      }
      cleanup();
      reject(new Error('Timed out while waiting for the playback bridge.'));
    }, timeoutMs);
  });
}
