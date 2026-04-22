// @ts-check

/** @typedef {import('../../core/types/contracts').EmbeddedPlaybackApi} EmbeddedPlaybackApi */
/** @typedef {import('../../core/types/contracts').EmbeddedPatternPayload} EmbeddedPatternPayload */
/** @typedef {import('../../core/types/contracts').EmbeddedPlaybackRuntimeState} EmbeddedPlaybackRuntimeState */
/** @typedef {import('../../core/types/contracts').PlaybackRuntime} PlaybackRuntime */
/** @typedef {import('../../core/types/contracts').PlaybackOperationResult} PlaybackOperationResult */
/** @typedef {import('../../core/types/contracts').PlaybackSessionController} PlaybackSessionController */

import { createPublishedEmbeddedPlaybackAssembly } from '../../core/playback/published-embedded-playback-assembly.js';

/**
 * @param {{
 *   playbackRuntime?: PlaybackRuntime,
 *   playbackController?: PlaybackSessionController,
 *   applyEmbeddedPattern?: (payload: EmbeddedPatternPayload) => PlaybackOperationResult,
 *   getPlaybackState?: () => EmbeddedPlaybackRuntimeState
 * }} [options]
 * @returns {EmbeddedPlaybackApi}
 */
export function bootstrapEmbeddedDrillApi({
  playbackRuntime,
  playbackController,
  applyEmbeddedPattern,
  getPlaybackState
} = {}) {
  const resolvedPlaybackRuntime = playbackRuntime || (playbackController
    ? {
        ensureReady: async () => undefined,
        ensurePlaybackController: () => playbackController,
        getRuntimeState: () => playbackController.getState().runtime
      }
    : null);

  if (!resolvedPlaybackRuntime) {
    throw new Error('A playback runtime or controller is required.');
  }

  return createPublishedEmbeddedPlaybackAssembly({
    playbackRuntime: resolvedPlaybackRuntime,
    applyEmbeddedPattern,
    getPlaybackState
  }).embeddedApi;
}
