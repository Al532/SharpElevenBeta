// @ts-check

/** @typedef {import('../types/contracts').EmbeddedPlaybackApi} EmbeddedPlaybackApi */

import {
  LEGACY_DRILL_API_READY_EVENT,
  PLAYBACK_API_READY_EVENT
} from './embedded-playback-identifiers.js';

/**
 * Waits for the legacy embedded playback bridge to expose its API.
 * Centralizing this keeps iframe/event readiness handling out of higher-level
 * bridge clients and makes the remaining legacy mechanism easier to swap later.
 *
 * @param {{
 *   getTargetWindow?: () => Window | null,
 *   getHostFrame?: () => HTMLIFrameElement | null,
 *   getEmbeddedApi?: () => EmbeddedPlaybackApi | null,
 *   readyEventName?: string,
 *   legacyReadyEventName?: string | null,
 *   timeoutMs?: number
 * }} [options]
 * @returns {Promise<EmbeddedPlaybackApi>}
 */
export function waitForEmbeddedPlaybackApi({
  getTargetWindow,
  getHostFrame,
  getEmbeddedApi,
  readyEventName = PLAYBACK_API_READY_EVENT,
  legacyReadyEventName = LEGACY_DRILL_API_READY_EVENT,
  timeoutMs = 10000
} = {}) {
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
      if (legacyReadyEventName && legacyReadyEventName !== readyEventName) {
        getTargetWindow?.()?.removeEventListener?.(legacyReadyEventName, onReady);
      }
    };

    frame.addEventListener('load', onLoad, { once: true });
    getTargetWindow?.()?.addEventListener?.(readyEventName, onReady, { once: true });
    if (legacyReadyEventName && legacyReadyEventName !== readyEventName) {
      getTargetWindow?.()?.addEventListener?.(legacyReadyEventName, onReady, { once: true });
    }

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
