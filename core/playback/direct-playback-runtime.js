// @ts-check

/** @typedef {import('../types/contracts').DirectPlaybackControllerOptions} DirectPlaybackControllerOptions */
/** @typedef {import('../types/contracts').PlaybackRuntime} PlaybackRuntime */

import { createDrillPlaybackRuntime } from './drill-playback-runtime.js';

/**
 * Creates the direct in-page playback runtime used by chart playback when it
 * no longer needs the hidden iframe bridge. This currently delegates to the
 * runtime implementation that originated in the Drill module.
 *
 * @param {DirectPlaybackControllerOptions & {
 *   applyEmbeddedPattern?: (payload: import('../types/contracts').EmbeddedPatternPayload) => import('../types/contracts').PlaybackOperationResult,
 *   applyEmbeddedPlaybackSettings?: (settings: import('../types/contracts').PlaybackSettings) => unknown,
 *   getEmbeddedPlaybackState?: () => Partial<import('../types/contracts').PlaybackRuntimeState>
 * }} [options]
 * @returns {PlaybackRuntime}
 */
export function createDirectPlaybackRuntime(options = {}) {
  return createDrillPlaybackRuntime(options);
}
