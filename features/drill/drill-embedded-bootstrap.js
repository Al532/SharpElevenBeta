// @ts-check

/** @typedef {import('../../core/types/contracts').EmbeddedPlaybackApi} EmbeddedPlaybackApi */
/** @typedef {import('../../core/types/contracts').EmbeddedPatternPayload} EmbeddedPatternPayload */
/** @typedef {import('../../core/types/contracts').EmbeddedPlaybackRuntimeState} EmbeddedPlaybackRuntimeState */
/** @typedef {import('../../core/types/contracts').PlaybackRuntime} PlaybackRuntime */
/** @typedef {import('../../core/types/contracts').PlaybackOperationResult} PlaybackOperationResult */
/** @typedef {import('../../core/types/contracts').PlaybackSessionController} PlaybackSessionController */
/** @typedef {import('../../core/types/contracts').PublishedEmbeddedPlaybackAssemblyProvider} PublishedEmbeddedPlaybackAssemblyProvider */

import { bootstrapEmbeddedPlaybackApi } from '../../core/playback/embedded-playback-bootstrap.js';

/**
 * @param {{
 *   playbackRuntime?: PlaybackRuntime,
 *   playbackController?: PlaybackSessionController,
 *   applyEmbeddedPattern?: (payload: EmbeddedPatternPayload) => PlaybackOperationResult,
 *   getPlaybackState?: () => EmbeddedPlaybackRuntimeState,
 *   publishedPlaybackAssemblyProvider?: PublishedEmbeddedPlaybackAssemblyProvider | null
 * }} [options]
 * @returns {EmbeddedPlaybackApi}
 */
export function bootstrapEmbeddedDrillApi({
  playbackRuntime,
  playbackController,
  applyEmbeddedPattern,
  getPlaybackState,
  publishedPlaybackAssemblyProvider
} = {}) {
  return bootstrapEmbeddedPlaybackApi({
    playbackRuntime,
    playbackController,
    applyEmbeddedPattern,
    getPlaybackState,
    publishedPlaybackAssemblyProvider
  });
}

export const bootstrapEmbeddedPlaybackBridge = bootstrapEmbeddedDrillApi;
