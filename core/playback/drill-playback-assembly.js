// @ts-check

/** @typedef {import('../types/contracts').DrillPlaybackAssembly} DrillPlaybackAssembly */
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
 * @param {{
 *   applyEmbeddedPattern?: (payload: EmbeddedPatternPayload) => PlaybackOperationResult,
 *   applyEmbeddedPlaybackSettings?: (settings: PlaybackSettings) => unknown,
 *   getEmbeddedPlaybackState?: () => Partial<PlaybackRuntimeState>,
 *   ensureWalkingBassGenerator?: () => Promise<unknown>,
 *   isPlaying?: () => boolean,
 *   getAudioContext?: () => BaseAudioContext | null,
 *   noteFadeout?: number,
 *   stopActiveChordVoices?: (audioTime: number, fadeout: number) => void,
 *   rebuildPreparedCompingPlans?: (currentKey: number) => void,
 *   buildPreparedBassPlan?: () => void,
 *   getCurrentKey?: () => number,
 *   preloadNearTermSamples?: () => Promise<unknown>,
 *   validateCustomPattern?: () => boolean,
 *   startPlayback?: () => Promise<void>,
 *   stopPlayback?: () => void,
 *   togglePausePlayback?: () => void
 * }} [options]
 * @returns {DrillPlaybackAssembly}
 */
export function createDrillPlaybackAssembly(options = {}) {
  const playbackRuntime = createDrillPlaybackRuntimeProvider(options).getRuntime();
  return createPlaybackAssembly({ playbackRuntime });
}
