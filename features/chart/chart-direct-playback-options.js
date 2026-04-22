// @ts-check

/** @typedef {import('../../core/types/contracts').DirectPlaybackControllerOptions} DirectPlaybackControllerOptions */
/** @typedef {import('../../core/types/contracts').PlaybackOperationResult} PlaybackOperationResult */
/** @typedef {import('../../core/types/contracts').PlaybackRuntimeState} PlaybackRuntimeState */
/** @typedef {import('../../core/types/contracts').PlaybackSettings} PlaybackSettings */

import { createChartPlaybackPayloadBuilder } from './chart-playback-bridge.js';
import { createChartDirectPlaybackHostResolver } from './chart-direct-playback-host.js';

/**
 * Creates chart-specific direct playback controller options backed by a target
 * window. The direct host is preferred when available, but the current
 * embedded API remains as a transitional fallback so the chart can move to the
 * direct bridge/provider boundary before the iframe host disappears entirely.
 *
 * @param {{
 *   getTargetWindow?: () => Window | null,
 *   getPreferredTargetWindow?: () => Window | null,
 *   getFallbackTargetWindow?: () => Window | null,
 *   getHostFrame?: () => HTMLIFrameElement | null,
 *   getTempo?: () => number,
 *   getCurrentChartTitle?: () => string,
 *   timeoutMs?: number
 * }} [options]
 * @returns {DirectPlaybackControllerOptions}
 */
export function createChartDirectPlaybackControllerOptions({
  getTargetWindow,
  getPreferredTargetWindow,
  getFallbackTargetWindow,
  getHostFrame,
  getTempo,
  getCurrentChartTitle,
  timeoutMs = 10000
} = {}) {
  const buildPatternPayload = createChartPlaybackPayloadBuilder({
    getTempo,
    getCurrentChartTitle
  });
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

      const embeddedApi = directPlaybackHost.getEmbeddedApi();
      if (!embeddedApi) {
        return {
          ok: false,
          errorMessage: 'Direct playback host unavailable.',
          state: null
        };
      }

      return embeddedApi.applyEmbeddedPattern(buildPatternPayload(sessionSpec, playbackSettings));
    },
    async updateDirectPlaybackSettings(playbackSettings = {}, sessionSpec = null) {
      const directHostOptions = await directPlaybackHost.ensureDirectHostOptions();
      if (typeof directHostOptions?.updateDirectPlaybackSettings === 'function') {
        return directHostOptions.updateDirectPlaybackSettings(playbackSettings, sessionSpec);
      }

      const embeddedApi = directPlaybackHost.getEmbeddedApi();
      if (!embeddedApi) {
        return {
          ok: false,
          errorMessage: 'Direct playback host unavailable.',
          state: null
        };
      }

      const payload = buildPatternPayload(sessionSpec, playbackSettings);
      return embeddedApi.applyEmbeddedPlaybackSettings({
        ...playbackSettings,
        tempo: payload.tempo,
        transposition: payload.transposition,
        repetitionsPerKey: payload.repetitionsPerKey,
        displayMode: payload.displayMode,
        harmonyDisplayMode: payload.harmonyDisplayMode,
        showBeatIndicator: payload.showBeatIndicator,
        hideCurrentHarmony: payload.hideCurrentHarmony,
        compingStyle: payload.compingStyle,
        drumsMode: payload.drumsMode,
        customMediumSwingBass: payload.customMediumSwingBass,
        masterVolume: payload.masterVolume,
        bassVolume: payload.bassVolume,
        stringsVolume: payload.stringsVolume,
        drumsVolume: payload.drumsVolume
      });
    },
    getDirectPlaybackState() {
      const directHostOptions = directPlaybackHost.getDirectHostOptions();
      if (typeof directHostOptions?.getDirectPlaybackState === 'function') {
        return /** @type {Partial<PlaybackRuntimeState> | null} */ (directHostOptions.getDirectPlaybackState() || null);
      }
      return directPlaybackHost.getEmbeddedApi()?.getPlaybackState() || null;
    },
    async startPlayback() {
      const directHostOptions = await directPlaybackHost.ensureDirectHostOptions();
      if (typeof directHostOptions?.startPlayback === 'function') {
        await directHostOptions.startPlayback();
        return;
      }
      const embeddedApi = directPlaybackHost.getEmbeddedApi();
      await embeddedApi?.startPlayback();
    },
    stopPlayback() {
      const directHostOptions = directPlaybackHost.getDirectHostOptions();
      if (typeof directHostOptions?.stopPlayback === 'function') {
        directHostOptions.stopPlayback();
        return;
      }
      directPlaybackHost.getEmbeddedApi()?.stopPlayback();
    },
    togglePausePlayback() {
      const directHostOptions = directPlaybackHost.getDirectHostOptions();
      if (typeof directHostOptions?.togglePausePlayback === 'function') {
        directHostOptions.togglePausePlayback();
        return;
      }
      directPlaybackHost.getEmbeddedApi()?.togglePausePlayback();
    }
  };
}
