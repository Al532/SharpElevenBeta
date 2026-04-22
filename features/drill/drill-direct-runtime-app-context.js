// @ts-check

import { createDirectPlaybackSessionHost } from './drill-direct-session.js';

/**
 * Creates the app-level direct playback controller options from grouped
 * runtime concerns. This mirrors the embedded runtime app context, but exposes
 * a `PracticeSessionSpec`-first boundary for the future chart direct runtime.
 *
 * @param {{
 *   applyEmbeddedPattern?: (payload: import('../../core/types/contracts').EmbeddedPatternPayload) => import('../../core/types/contracts').PlaybackOperationResult,
 *   applyEmbeddedPlaybackSettings?: (settings: import('../../core/types/contracts').PlaybackSettings) => unknown,
 *   getEmbeddedPlaybackState?: () => Partial<import('../../core/types/contracts').PlaybackRuntimeState> | null | undefined,
 *   playbackRuntime?: Record<string, any>,
 *   playbackState?: Record<string, any>,
 *   transportActions?: Record<string, any>
 * }} [options]
 * @returns {import('../../core/types/contracts').DirectPlaybackControllerOptions}
 */
export function createDirectDrillRuntimeAppContextOptions({
  applyEmbeddedPattern,
  applyEmbeddedPlaybackSettings,
  getEmbeddedPlaybackState,
  playbackRuntime = {},
  playbackState = {},
  transportActions = {}
} = {}) {
  const directSessionHost = createDirectPlaybackSessionHost({
    applyEmbeddedPattern,
    applyEmbeddedPlaybackSettings,
    getEmbeddedPlaybackState
  });

  return {
    loadDirectSession: directSessionHost.loadDirectSession,
    updateDirectPlaybackSettings: directSessionHost.updateDirectPlaybackSettings,
    getDirectPlaybackState: directSessionHost.getDirectPlaybackState,
    ensureWalkingBassGenerator: playbackRuntime.ensureWalkingBassGenerator,
    isPlaying: playbackState.getIsPlaying,
    getAudioContext: playbackRuntime.getAudioContext,
    noteFadeout: playbackRuntime.noteFadeout,
    stopActiveChordVoices: playbackRuntime.stopActiveChordVoices,
    rebuildPreparedCompingPlans: playbackRuntime.rebuildPreparedCompingPlans,
    buildPreparedBassPlan: playbackRuntime.buildPreparedBassPlan,
    getCurrentKey: playbackRuntime.getCurrentKey,
    preloadNearTermSamples: playbackRuntime.preloadNearTermSamples,
    validateCustomPattern: playbackRuntime.validateCustomPattern,
    startPlayback: transportActions.startPlayback,
    stopPlayback: transportActions.stopPlayback,
    togglePausePlayback: transportActions.togglePausePlayback
  };
}
