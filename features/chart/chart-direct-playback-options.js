// @ts-check

/** @typedef {import('../../core/types/contracts').DirectPlaybackControllerOptions} DirectPlaybackControllerOptions */
/** @typedef {import('../../core/types/contracts').PlaybackOperationResult} PlaybackOperationResult */
/** @typedef {import('../../core/types/contracts').PlaybackRuntimeState} PlaybackRuntimeState */
/** @typedef {import('../../core/types/contracts').PlaybackSettings} PlaybackSettings */

import { createChartDirectPlaybackHostResolver } from './chart-direct-playback-host.js';

/**
 * @returns {PlaybackOperationResult}
 */
function createUnavailableDirectPlaybackResult() {
  return {
    ok: false,
    errorMessage: 'Direct playback host unavailable.',
    state: null
  };
}

/**
 * Creates chart-specific direct playback controller options backed by a target
 * window. The chart always speaks the direct runtime contract now: the same
 * direct controller options are used whether the host lives on the current
 * page or in the temporary iframe fallback.
 *
 * @param {{
 *   getTargetWindow?: () => Window | null,
 *   getPreferredTargetWindow?: () => Window | null,
 *   getFallbackTargetWindow?: () => Window | null,
 *   getHostFrame?: () => HTMLIFrameElement | null,
 *   timeoutMs?: number
 * }} [options]
 * @returns {DirectPlaybackControllerOptions}
 */
export function createChartDirectPlaybackControllerOptions({
  getTargetWindow,
  getPreferredTargetWindow,
  getFallbackTargetWindow,
  getHostFrame,
  timeoutMs = 10000
} = {}) {
  const directPlaybackHost = createChartDirectPlaybackHostResolver({
    getTargetWindow,
    getPreferredTargetWindow,
    getFallbackTargetWindow,
    getHostFrame,
    timeoutMs
  });

  return {
    async loadDirectSession(sessionSpec, playbackSettings = {}) {
      const directHostOptions = await directPlaybackHost.ensureDirectHostOptions();
      if (typeof directHostOptions?.loadDirectSession === 'function') {
        return directHostOptions.loadDirectSession(sessionSpec, playbackSettings);
      }
      return createUnavailableDirectPlaybackResult();
    },
    async updateDirectPlaybackSettings(playbackSettings = {}, sessionSpec = null) {
      const directHostOptions = await directPlaybackHost.ensureDirectHostOptions();
      if (typeof directHostOptions?.updateDirectPlaybackSettings === 'function') {
        return directHostOptions.updateDirectPlaybackSettings(playbackSettings, sessionSpec);
      }
      return createUnavailableDirectPlaybackResult();
    },
    getDirectPlaybackState() {
      const directHostOptions = directPlaybackHost.getDirectHostOptions();
      if (typeof directHostOptions?.getDirectPlaybackState === 'function') {
        return /** @type {Partial<PlaybackRuntimeState> | null} */ (directHostOptions.getDirectPlaybackState() || null);
      }
      return null;
    },
    async startPlayback() {
      const directHostOptions = await directPlaybackHost.ensureDirectHostOptions();
      if (typeof directHostOptions?.startPlayback === 'function') {
        await directHostOptions.startPlayback();
        return;
      }
      throw new Error('Direct playback host unavailable.');
    },
    stopPlayback() {
      const directHostOptions = directPlaybackHost.getDirectHostOptions();
      if (typeof directHostOptions?.stopPlayback === 'function') {
        directHostOptions.stopPlayback();
        return;
      }
    },
    togglePausePlayback() {
      const directHostOptions = directPlaybackHost.getDirectHostOptions();
      if (typeof directHostOptions?.togglePausePlayback === 'function') {
        directHostOptions.togglePausePlayback();
        return;
      }
    }
  };
}
