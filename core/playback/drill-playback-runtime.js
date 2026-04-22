// @ts-check

/** @typedef {import('../types/contracts').EmbeddedPatternPayload} EmbeddedPatternPayload */
/** @typedef {import('../types/contracts').PlaybackOperationResult} PlaybackOperationResult */
/** @typedef {import('../types/contracts').PlaybackRuntime} PlaybackRuntime */
/** @typedef {import('../types/contracts').PlaybackRuntimeState} PlaybackRuntimeState */
/** @typedef {import('../types/contracts').PlaybackSettings} PlaybackSettings */

import { createDrillPlaybackSessionAdapter } from './drill-playback-session-adapter.js';
import { createPlaybackRuntime } from './playback-runtime.js';

/**
 * Creates the shared playback runtime used by the in-page Drill experience.
 * This mirrors the chart-side embedded bridge assembly, but without iframe/API
 * lookup because Drill already owns the runtime directly.
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
 * @returns {PlaybackRuntime}
 */
export function createDrillPlaybackRuntime({
  applyEmbeddedPattern,
  applyEmbeddedPlaybackSettings,
  getEmbeddedPlaybackState,
  ensureWalkingBassGenerator,
  isPlaying,
  getAudioContext,
  noteFadeout,
  stopActiveChordVoices,
  rebuildPreparedCompingPlans,
  buildPreparedBassPlan,
  getCurrentKey,
  preloadNearTermSamples,
  validateCustomPattern,
  startPlayback,
  stopPlayback,
  togglePausePlayback
} = {}) {
  return createPlaybackRuntime({
    adapter: createDrillPlaybackSessionAdapter({
      applyEmbeddedPattern,
      applyEmbeddedPlaybackSettings,
      getEmbeddedPlaybackState,
      ensureWalkingBassGenerator,
      isPlaying,
      getAudioContext,
      noteFadeout,
      stopActiveChordVoices,
      rebuildPreparedCompingPlans,
      buildPreparedBassPlan,
      getCurrentKey,
      preloadNearTermSamples,
      validateCustomPattern,
      startPlayback,
      stopPlayback,
      togglePausePlayback
    })
  });
}
