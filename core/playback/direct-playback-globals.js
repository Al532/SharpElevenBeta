// @ts-check

/** @typedef {import('../types/contracts').DirectPlaybackControllerOptions} DirectPlaybackControllerOptions */

import {
  DIRECT_PLAYBACK_OPTIONS_GLOBAL,
  DIRECT_PLAYBACK_READY_EVENT
} from './embedded-playback-identifiers.js';

/**
 * Publishes the current app-level direct playback controller options on the
 * window so future same-page consumers can reuse the direct runtime boundary.
 *
 * @param {{
 *   targetWindow?: Window | null,
 *   directPlaybackControllerOptions?: DirectPlaybackControllerOptions | null,
 *   readyEventName?: string
 * }} [options]
 * @returns {void}
 */
export function publishDirectPlaybackGlobals({
  targetWindow = window,
  directPlaybackControllerOptions = null,
  readyEventName = DIRECT_PLAYBACK_READY_EVENT
} = {}) {
  if (!targetWindow || !directPlaybackControllerOptions) return;
  targetWindow[DIRECT_PLAYBACK_OPTIONS_GLOBAL] = directPlaybackControllerOptions;
  targetWindow.dispatchEvent(new CustomEvent(readyEventName));
}

/**
 * @param {Window | null | undefined} [targetWindow]
 * @returns {DirectPlaybackControllerOptions | null}
 */
export function readDirectPlaybackGlobals(targetWindow = window) {
  return targetWindow?.[DIRECT_PLAYBACK_OPTIONS_GLOBAL] || null;
}
