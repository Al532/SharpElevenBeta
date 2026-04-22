// @ts-check

/** @typedef {import('../../core/types/contracts').PlaybackSettings} PlaybackSettings */
/** @typedef {import('../../core/types/contracts').PlaybackRuntimeState} PlaybackRuntimeState */
/** @typedef {import('../../core/types/contracts').PlaybackOperationResult} PlaybackOperationResult */
/** @typedef {import('../../core/types/contracts').PlaybackRuntime} PlaybackRuntime */
/** @typedef {import('../../core/types/contracts').PlaybackSessionController} PlaybackSessionController */
/** @typedef {import('../../core/types/contracts').EmbeddedPatternPayload} EmbeddedPatternPayload */
/** @typedef {import('../../core/types/contracts').DrillPlaybackControllerOptions} DrillPlaybackControllerOptions */

import { createDrillPlaybackAssemblyProvider } from '../../core/playback/drill-playback-assembly-provider.js';
import { createDrillPlaybackRuntimeProvider } from '../../core/playback/drill-playback-runtime-provider.js';

/**
 * @param {DrillPlaybackControllerOptions & {
 *   applyEmbeddedPattern?: (payload: EmbeddedPatternPayload) => PlaybackOperationResult,
 *   applyEmbeddedPlaybackSettings?: (settings: PlaybackSettings) => unknown,
 *   getEmbeddedPlaybackState?: () => Partial<PlaybackRuntimeState>
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
  return createDrillPlaybackRuntimeProvider({
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
  }).getRuntime();
}

/**
 * @param {DrillPlaybackControllerOptions & {
 *   applyEmbeddedPattern?: (payload: EmbeddedPatternPayload) => PlaybackOperationResult,
 *   applyEmbeddedPlaybackSettings?: (settings: PlaybackSettings) => unknown,
 *   getEmbeddedPlaybackState?: () => Partial<PlaybackRuntimeState>
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
  return createDrillPlaybackAssemblyProvider({
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
  }).getAssembly().playbackController;
}

export const createDirectPlaybackRuntime = createDrillPlaybackRuntime;
export const createDirectPlaybackController = createDrillPlaybackController;
