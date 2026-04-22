import type { DirectPlaybackControllerOptions } from '../types/contracts';

import { readDirectPlaybackGlobals } from './direct-playback-globals.js';
import { DIRECT_PLAYBACK_READY_EVENT } from './embedded-playback-identifiers.js';
import { waitForDirectPlaybackOptions } from './direct-playback-ready.js';

export function createDirectPlaybackOptionsClient({
  getTargetWindow,
  getHostFrame,
  readyEventName = DIRECT_PLAYBACK_READY_EVENT,
  timeoutMs = 10000
}: {
  getTargetWindow?: () => Window | null;
  getHostFrame?: () => HTMLIFrameElement | null;
  readyEventName?: string;
  timeoutMs?: number;
} = {}) {
  let cachedOptions: DirectPlaybackControllerOptions | null = null;
  let pendingReadyPromise: Promise<DirectPlaybackControllerOptions> | null = null;

  function getOptions(): DirectPlaybackControllerOptions | null {
    if (cachedOptions) return cachedOptions;
    const directPlaybackOptions = readDirectPlaybackGlobals(getTargetWindow?.() || null);
    if (directPlaybackOptions) {
      cachedOptions = directPlaybackOptions;
    }
    return cachedOptions;
  }

  function ensureOptions(): Promise<DirectPlaybackControllerOptions> {
    const existingOptions = getOptions();
    if (existingOptions) return Promise.resolve(existingOptions);
    if (pendingReadyPromise) return pendingReadyPromise;

    pendingReadyPromise = waitForDirectPlaybackOptions({
      getTargetWindow,
      getHostFrame,
      getDirectPlaybackOptions: getOptions,
      readyEventName,
      timeoutMs
    }).catch((error) => {
      pendingReadyPromise = null;
      throw error;
    });

    return pendingReadyPromise;
  }

  return {
    getOptions,
    ensureOptions
  };
}
