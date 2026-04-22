// @ts-check

/** @typedef {import('../types/contracts').DrillPlaybackAssemblyProvider} DrillPlaybackAssemblyProvider */
/** @typedef {import('../types/contracts').DrillPlaybackControllerOptions} DrillPlaybackControllerOptions */
/** @typedef {import('../types/contracts').EmbeddedPatternPayload} EmbeddedPatternPayload */
/** @typedef {import('../types/contracts').PlaybackOperationResult} PlaybackOperationResult */
/** @typedef {import('../types/contracts').PlaybackRuntimeState} PlaybackRuntimeState */
/** @typedef {import('../types/contracts').PlaybackSettings} PlaybackSettings */

import { createDrillPlaybackAssembly } from './drill-playback-assembly.js';
import { createPlaybackAssemblyProvider } from './playback-assembly-provider.js';

/**
 * Creates a memoized provider for the Drill playback assembly.
 *
 * @param {DrillPlaybackControllerOptions & {
 *   applyEmbeddedPattern?: (payload: EmbeddedPatternPayload) => PlaybackOperationResult,
 *   applyEmbeddedPlaybackSettings?: (settings: PlaybackSettings) => unknown,
 *   getEmbeddedPlaybackState?: () => Partial<PlaybackRuntimeState>
 * }} [options]
 * @returns {DrillPlaybackAssemblyProvider}
 */
export function createDrillPlaybackAssemblyProvider(options = {}) {
  return /** @type {DrillPlaybackAssemblyProvider} */ (
    createPlaybackAssemblyProvider({
      createAssembly() {
        return createDrillPlaybackAssembly(options);
      }
    })
  );
}
