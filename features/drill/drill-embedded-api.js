// @ts-check

/** @typedef {import('../../core/types/contracts').EmbeddedPlaybackApi} EmbeddedPlaybackApi */
/** @typedef {import('../../core/types/contracts').EmbeddedPatternPayload} EmbeddedPatternPayload */
/** @typedef {import('../../core/types/contracts').EmbeddedPlaybackRuntimeState} EmbeddedPlaybackRuntimeState */
/** @typedef {import('../../core/types/contracts').PlaybackRuntime} PlaybackRuntime */
/** @typedef {import('../../core/types/contracts').PlaybackOperationResult} PlaybackOperationResult */
/** @typedef {import('../../core/types/contracts').PlaybackSessionController} PlaybackSessionController */
/** @typedef {import('../../core/types/contracts').PlaybackSettings} PlaybackSettings */

import { createEmbeddedPlaybackApi } from '../../core/playback/embedded-playback-api.js';

/**
 * @param {{
 *   playbackRuntime?: PlaybackRuntime,
 *   playbackController?: PlaybackSessionController,
 *   applyEmbeddedPattern?: (payload: EmbeddedPatternPayload) => PlaybackOperationResult | Promise<PlaybackOperationResult>,
 *   getPlaybackState?: () => EmbeddedPlaybackRuntimeState
 * }} [options]
 * @returns {EmbeddedPlaybackApi}
 */
export function createEmbeddedDrillApi({
  playbackRuntime,
  playbackController,
  applyEmbeddedPattern,
  getPlaybackState
} = {}) {
  return createEmbeddedPlaybackApi({
    playbackRuntime,
    playbackController,
    applyEmbeddedPattern,
    getPlaybackState
  });
}

export const createEmbeddedPlaybackApiBridge = createEmbeddedDrillApi;
