import type {
  EmbeddedPlaybackApi,
  EmbeddedPlaybackApiClient
} from '../types/contracts';

import { resolveEmbeddedPlaybackApi } from './embedded-playback-globals.js';
import {
  LEGACY_DRILL_API_READY_EVENT,
  PLAYBACK_API_READY_EVENT
} from './embedded-playback-identifiers.js';
import { waitForEmbeddedPlaybackApi } from './embedded-playback-ready.js';

export function createEmbeddedPlaybackApiClient({
  getTargetWindow,
  getHostFrame,
  readyEventName = PLAYBACK_API_READY_EVENT,
  legacyReadyEventName = LEGACY_DRILL_API_READY_EVENT,
  timeoutMs = 10000
}: {
  getTargetWindow?: () => Window | null;
  getHostFrame?: () => HTMLIFrameElement | null;
  readyEventName?: string;
  legacyReadyEventName?: string | null;
  timeoutMs?: number;
} = {}): EmbeddedPlaybackApiClient {
  let cachedApi: EmbeddedPlaybackApi | null = null;
  let pendingReadyPromise: Promise<EmbeddedPlaybackApi> | null = null;

  function getApi(): EmbeddedPlaybackApi | null {
    if (cachedApi) return cachedApi;
    const embeddedApi = resolveEmbeddedPlaybackApi(getTargetWindow?.() || null);
    if (embeddedApi) {
      cachedApi = embeddedApi;
    }
    return cachedApi;
  }

  function ensureApi(): Promise<EmbeddedPlaybackApi> {
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
