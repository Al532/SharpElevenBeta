// @ts-check

/** @typedef {import('../types/contracts').DirectPlaybackAssembly} DirectPlaybackAssembly */
/** @typedef {import('../types/contracts').DirectPlaybackControllerOptions} DirectPlaybackControllerOptions */

import { createDirectPlaybackRuntimeProvider } from './direct-playback-runtime-provider.js';

/**
 * Creates the full direct playback assembly: runtime plus memoized controller.
 *
 * @param {DirectPlaybackControllerOptions & {
 *   applyEmbeddedPattern?: (payload: import('../types/contracts').EmbeddedPatternPayload) => import('../types/contracts').PlaybackOperationResult,
 *   applyEmbeddedPlaybackSettings?: (settings: import('../types/contracts').PlaybackSettings) => unknown,
 *   getEmbeddedPlaybackState?: () => Partial<import('../types/contracts').PlaybackRuntimeState>
 * }} [options]
 * @returns {DirectPlaybackAssembly}
 */
export function createDirectPlaybackAssembly(options = {}) {
  const playbackRuntime = createDirectPlaybackRuntimeProvider(options).getRuntime();
  return {
    playbackRuntime,
    playbackController: playbackRuntime.ensurePlaybackController()
  };
}
