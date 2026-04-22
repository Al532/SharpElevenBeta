// @ts-check

/** @typedef {import('../types/contracts').EmbeddedPlaybackApi} EmbeddedPlaybackApi */
/** @typedef {import('../types/contracts').EmbeddedPlaybackGlobals} EmbeddedPlaybackGlobals */
/** @typedef {import('../types/contracts').PlaybackRuntime} PlaybackRuntime */
/** @typedef {import('../types/contracts').PlaybackSessionController} PlaybackSessionController */

/**
 * Centralizes publication of the legacy embedded playback globals.
 * This keeps backward compatibility while making the bridge surface explicit.
 *
 * @param {{
 *   targetWindow?: Window | null,
 *   embeddedApi?: EmbeddedPlaybackApi,
 *   playbackRuntime?: PlaybackRuntime | null,
 *   playbackController?: PlaybackSessionController | null,
 *   readyEventName?: string
 * }} [options]
 * @returns {void}
 */
export function publishEmbeddedPlaybackGlobals({
  targetWindow = window,
  embeddedApi,
  playbackRuntime = null,
  playbackController = null,
  readyEventName = 'jpt-drill-api-ready'
} = {}) {
  if (!targetWindow || !embeddedApi) return;

  targetWindow.__JPT_DRILL_API__ = embeddedApi;
  targetWindow.__JPT_PLAYBACK_RUNTIME__ = playbackRuntime || undefined;
  targetWindow.__JPT_PLAYBACK_SESSION_CONTROLLER__ = playbackController || undefined;
  targetWindow.dispatchEvent(new CustomEvent(readyEventName));
}

/**
 * @param {Window | null | undefined} [targetWindow]
 * @returns {EmbeddedPlaybackGlobals}
 */
export function readEmbeddedPlaybackGlobals(targetWindow = window) {
  return {
    embeddedApi: targetWindow?.__JPT_DRILL_API__ || null,
    playbackRuntime: targetWindow?.__JPT_PLAYBACK_RUNTIME__ || null,
    playbackController: targetWindow?.__JPT_PLAYBACK_SESSION_CONTROLLER__ || null
  };
}
