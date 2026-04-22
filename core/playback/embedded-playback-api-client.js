// @ts-check

/** @typedef {import('../types/contracts').EmbeddedPlaybackApi} EmbeddedPlaybackApi */
/** @typedef {import('../types/contracts').EmbeddedPlaybackApiClient} EmbeddedPlaybackApiClient */

import { resolveEmbeddedPlaybackApi } from './embedded-playback-globals.js';
import {
  LEGACY_DRILL_API_READY_EVENT,
  PLAYBACK_API_READY_EVENT
} from './embedded-playback-identifiers.js';
import { waitForEmbeddedPlaybackApi } from './embedded-playback-ready.js';

/**
 * Legacy iframe bridge client for the embedded playback API.
 * This keeps the global/window lookup in one place while the runtime boundary
 * is being migrated toward a shared typed playback runtime.
 *
 * @param {{
 *   getTargetWindow?: () => Window | null,
 *   getHostFrame?: () => HTMLIFrameElement | null,
 *   readyEventName?: string,
 *   legacyReadyEventName?: string | null,
 *   timeoutMs?: number
 * }} [options]
 * @returns {EmbeddedPlaybackApiClient}
 */
export function createEmbeddedPlaybackApiClient({
  getTargetWindow,
  getHostFrame,
  readyEventName = PLAYBACK_API_READY_EVENT,
  legacyReadyEventName = LEGACY_DRILL_API_READY_EVENT,
  timeoutMs = 10000
} = {}) {
  /** @type {EmbeddedPlaybackApi | null} */
  let cachedApi = null;
  /** @type {Promise<EmbeddedPlaybackApi> | null} */
  let pendingReadyPromise = null;

  /** @returns {EmbeddedPlaybackApi | null} */
  function getApi() {
    if (cachedApi) return cachedApi;
    const embeddedApi = resolveEmbeddedPlaybackApi(getTargetWindow?.() || null);
    if (embeddedApi) {
      cachedApi = embeddedApi;
    }
    return cachedApi;
  }

  /** @returns {Promise<EmbeddedPlaybackApi>} */
  function ensureApi() {
    const existingApi = getApi();
    if (existingApi) return Promise.resolve(existingApi);
    if (pendingReadyPromise) return pendingReadyPromise;

    pendingReadyPromise = waitForEmbeddedPlaybackApi({
      getTargetWindow,
      getHostFrame,
      getEmbeddedApi: getApi,
      readyEventName,
      legacyReadyEventName,
      timeoutMs
    }).catch((error) => {
      pendingReadyPromise = null;
      throw error;
    });

    return pendingReadyPromise;
  }

  return {
    getApi,
    ensureApi
  };
}
