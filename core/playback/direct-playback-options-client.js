// @ts-check

/** @typedef {import('../types/contracts').DirectPlaybackControllerOptions} DirectPlaybackControllerOptions */

import { readDirectPlaybackGlobals } from './direct-playback-globals.js';
import { DIRECT_PLAYBACK_READY_EVENT } from './embedded-playback-identifiers.js';
import { waitForDirectPlaybackOptions } from './direct-playback-ready.js';

/**
 * Creates a memoized client for direct playback controller options published on
 * a target window. This keeps readiness/event handling out of chart feature
 * code while the direct runtime host is still backed by a transitional iframe.
 *
 * @param {{
 *   getTargetWindow?: () => Window | null,
 *   getHostFrame?: () => HTMLIFrameElement | null,
 *   readyEventName?: string,
 *   timeoutMs?: number
 * }} [options]
 * @returns {{
 *   getOptions: () => DirectPlaybackControllerOptions | null,
 *   ensureOptions: () => Promise<DirectPlaybackControllerOptions>
 * }}
 */
export function createDirectPlaybackOptionsClient({
  getTargetWindow,
  getHostFrame,
  readyEventName = DIRECT_PLAYBACK_READY_EVENT,
  timeoutMs = 10000
} = {}) {
  /** @type {DirectPlaybackControllerOptions | null} */
  let cachedOptions = null;
  /** @type {Promise<DirectPlaybackControllerOptions> | null} */
  let pendingReadyPromise = null;

  /** @returns {DirectPlaybackControllerOptions | null} */
  function getOptions() {
    if (cachedOptions) return cachedOptions;
    const directPlaybackOptions = readDirectPlaybackGlobals(getTargetWindow?.() || null);
    if (directPlaybackOptions) {
      cachedOptions = directPlaybackOptions;
    }
    return cachedOptions;
  }

  /** @returns {Promise<DirectPlaybackControllerOptions>} */
  function ensureOptions() {
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
