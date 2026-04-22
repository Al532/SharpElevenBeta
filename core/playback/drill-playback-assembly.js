// @ts-check

/** @typedef {import('../types/contracts').DrillPlaybackAssembly} DrillPlaybackAssembly */
/** @typedef {import('../types/contracts').DrillPlaybackControllerOptions} DrillPlaybackControllerOptions */
/** @typedef {import('../types/contracts').EmbeddedPatternPayload} EmbeddedPatternPayload */
/** @typedef {import('../types/contracts').PlaybackOperationResult} PlaybackOperationResult */
/** @typedef {import('../types/contracts').PlaybackRuntimeState} PlaybackRuntimeState */
/** @typedef {import('../types/contracts').PlaybackSettings} PlaybackSettings */

import { createDrillPlaybackRuntimeProvider } from './drill-playback-runtime-provider.js';
import { createPlaybackAssembly } from './playback-assembly.js';

/**
 * Creates the full Drill playback assembly: runtime plus memoized controller.
 * This gives Drill the same kind of dedicated core-level factory that chart now
 * has for its embedded bridge.
 *
 * @param {DrillPlaybackControllerOptions & {
 *   applyEmbeddedPattern?: (payload: EmbeddedPatternPayload) => PlaybackOperationResult,
 *   applyEmbeddedPlaybackSettings?: (settings: PlaybackSettings) => unknown,
 *   getEmbeddedPlaybackState?: () => Partial<PlaybackRuntimeState>
 * }} [options]
 * @returns {DrillPlaybackAssembly}
 */
export function createDrillPlaybackAssembly(options = {}) {
  const playbackRuntime = createDrillPlaybackRuntimeProvider(options).getRuntime();
  return createPlaybackAssembly({ playbackRuntime });
}
