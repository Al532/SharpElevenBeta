// @ts-check

/** @typedef {import('../types/contracts').EmbeddedPatternPayload} EmbeddedPatternPayload */
/** @typedef {import('../types/contracts').DrillPlaybackControllerOptions} DrillPlaybackControllerOptions */
/** @typedef {import('../types/contracts').DrillPlaybackRuntimeProvider} DrillPlaybackRuntimeProvider */
/** @typedef {import('../types/contracts').PlaybackOperationResult} PlaybackOperationResult */
/** @typedef {import('../types/contracts').PlaybackRuntimeState} PlaybackRuntimeState */
/** @typedef {import('../types/contracts').PlaybackSettings} PlaybackSettings */

import { createDrillPlaybackRuntime } from './drill-playback-runtime.js';
import { createPlaybackRuntimeProvider } from './playback-runtime-provider.js';

/**
 * Creates a memoized provider for the Drill-owned playback runtime.
 *
 * @param {DrillPlaybackControllerOptions & {
 *   applyEmbeddedPattern?: (payload: EmbeddedPatternPayload) => PlaybackOperationResult,
 *   applyEmbeddedPlaybackSettings?: (settings: PlaybackSettings) => unknown,
 *   getEmbeddedPlaybackState?: () => Partial<PlaybackRuntimeState>
 * }} [options]
 * @returns {DrillPlaybackRuntimeProvider}
 */
export function createDrillPlaybackRuntimeProvider(options = {}) {
  return /** @type {DrillPlaybackRuntimeProvider} */ (
    createPlaybackRuntimeProvider({
      createRuntime() {
        return createDrillPlaybackRuntime(options);
      }
    })
  );
}
