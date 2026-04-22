// @ts-check

/** @typedef {import('../../core/types/contracts').PlaybackSettings} PlaybackSettings */
/** @typedef {import('../../core/types/contracts').PlaybackRuntimeState} PlaybackRuntimeState */
/** @typedef {import('../../core/types/contracts').PlaybackOperationResult} PlaybackOperationResult */
/** @typedef {import('../../core/types/contracts').PlaybackRuntime} PlaybackRuntime */
/** @typedef {import('../../core/types/contracts').PlaybackSessionController} PlaybackSessionController */
/** @typedef {import('../../core/types/contracts').EmbeddedPatternPayload} EmbeddedPatternPayload */

import { createDrillPlaybackAssembly } from '../../core/playback/drill-playback-assembly.js';
import { createDrillPlaybackRuntime as createCoreDrillPlaybackRuntime } from '../../core/playback/drill-playback-runtime.js';

/**
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
  return createCoreDrillPlaybackRuntime({
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
  });
}

/**
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
 * @returns {PlaybackSessionController}
 */
export function createDrillPlaybackController({
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
  return createDrillPlaybackAssembly({
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
  }).playbackController;
}
