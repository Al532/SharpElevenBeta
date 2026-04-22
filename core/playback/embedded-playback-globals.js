// @ts-check

/** @typedef {import('../types/contracts').EmbeddedPlaybackApi} EmbeddedPlaybackApi */
/** @typedef {import('../types/contracts').EmbeddedPlaybackGlobals} EmbeddedPlaybackGlobals */
/** @typedef {import('../types/contracts').PlaybackRuntime} PlaybackRuntime */
/** @typedef {import('../types/contracts').PlaybackSessionController} PlaybackSessionController */

import { createEmbeddedPlaybackApi } from './embedded-playback-api.js';
import {
  LEGACY_DRILL_API_GLOBAL,
  LEGACY_DRILL_API_READY_EVENT,
  PLAYBACK_API_GLOBAL,
  PLAYBACK_API_READY_EVENT,
  PLAYBACK_RUNTIME_GLOBAL,
  PLAYBACK_SESSION_CONTROLLER_GLOBAL
} from './embedded-playback-identifiers.js';

/**
 * Centralizes publication of the legacy embedded playback globals.
 * This keeps backward compatibility while making the bridge surface explicit.
 *
 * @param {{
 *   targetWindow?: Window | null,
 *   embeddedApi?: EmbeddedPlaybackApi,
 *   playbackRuntime?: PlaybackRuntime | null,
 *   playbackController?: PlaybackSessionController | null,
 *   readyEventName?: string,
 *   legacyReadyEventName?: string | null
 * }} [options]
 * @returns {void}
 */
export function publishEmbeddedPlaybackGlobals({
  targetWindow = window,
  embeddedApi,
  playbackRuntime = null,
  playbackController = null,
  readyEventName = PLAYBACK_API_READY_EVENT,
  legacyReadyEventName = LEGACY_DRILL_API_READY_EVENT
} = {}) {
  if (!targetWindow || !embeddedApi) return;

  targetWindow[PLAYBACK_API_GLOBAL] = embeddedApi;
  targetWindow[LEGACY_DRILL_API_GLOBAL] = embeddedApi;
  targetWindow[PLAYBACK_RUNTIME_GLOBAL] = playbackRuntime || undefined;
  targetWindow[PLAYBACK_SESSION_CONTROLLER_GLOBAL] = playbackController || undefined;
  targetWindow.dispatchEvent(new CustomEvent(readyEventName));
  if (legacyReadyEventName && legacyReadyEventName !== readyEventName) {
    targetWindow.dispatchEvent(new CustomEvent(legacyReadyEventName));
  }
}

/**
 * @param {Window | null | undefined} [targetWindow]
 * @returns {EmbeddedPlaybackGlobals}
 */
export function readEmbeddedPlaybackGlobals(targetWindow = window) {
  return {
    embeddedApi: targetWindow?.[PLAYBACK_API_GLOBAL] || targetWindow?.[LEGACY_DRILL_API_GLOBAL] || null,
    playbackRuntime: targetWindow?.[PLAYBACK_RUNTIME_GLOBAL] || null,
    playbackController: targetWindow?.[PLAYBACK_SESSION_CONTROLLER_GLOBAL] || null
  };
}

/**
 * Normalizes the legacy embedded playback globals into a callable API surface.
 * This makes chart playback resilient to partially published legacy globals as
 * long as a runtime/controller is available on the embedded side.
 *
 * @param {Window | null | undefined} [targetWindow]
 * @returns {EmbeddedPlaybackApi | null}
 */
export function resolveEmbeddedPlaybackApi(targetWindow = window) {
  const {
    embeddedApi,
    playbackRuntime,
    playbackController
  } = readEmbeddedPlaybackGlobals(targetWindow);

  if (!embeddedApi && !playbackRuntime && !playbackController) {
    return null;
  }

  const hasCallableApi =
    typeof embeddedApi?.applyEmbeddedPattern === 'function'
    && typeof embeddedApi?.applyEmbeddedPlaybackSettings === 'function'
    && typeof embeddedApi?.startPlayback === 'function'
    && typeof embeddedApi?.stopPlayback === 'function'
    && typeof embeddedApi?.togglePausePlayback === 'function';

  if (hasCallableApi && typeof embeddedApi?.getPlaybackState === 'function') {
    return embeddedApi;
  }

  if (hasCallableApi && !playbackRuntime && !playbackController) {
    return /** @type {EmbeddedPlaybackApi} */ ({
      ...embeddedApi,
      getPlaybackState:
        typeof embeddedApi?.getPlaybackState === 'function'
          ? embeddedApi.getPlaybackState.bind(embeddedApi)
          : () => null
    });
  }

  if (!playbackRuntime && !playbackController) {
    return null;
  }

  return createEmbeddedPlaybackApi({
    playbackRuntime: playbackRuntime || undefined,
    playbackController: playbackController || undefined,
    applyEmbeddedPattern:
      typeof embeddedApi?.applyEmbeddedPattern === 'function'
        ? embeddedApi.applyEmbeddedPattern.bind(embeddedApi)
        : () => ({
          ok: false,
          errorMessage: 'Playback bridge does not expose applyEmbeddedPattern.',
          state:
            typeof embeddedApi?.getPlaybackState === 'function'
              ? embeddedApi.getPlaybackState()
              : playbackRuntime?.getRuntimeState?.() || playbackController?.getState?.().runtime || null
        }),
    getPlaybackState:
      typeof embeddedApi?.getPlaybackState === 'function'
        ? embeddedApi.getPlaybackState.bind(embeddedApi)
        : undefined
  });
}
