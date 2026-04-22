import type {
  DirectPlaybackControllerOptions,
  EmbeddedPatternPayload,
  PlaybackOperationResult,
  PlaybackRuntimeState,
  PlaybackSettings
} from '../../core/types/contracts';

import { createDirectPlaybackSessionHost } from './drill-direct-session.js';

type DirectRuntimeAppOptions = {
  applyEmbeddedPattern?: (payload: Partial<EmbeddedPatternPayload>) => PlaybackOperationResult;
  applyEmbeddedPlaybackSettings?: (settings: PlaybackSettings) => unknown;
  getEmbeddedPlaybackState?: () => Partial<PlaybackRuntimeState> | null | undefined;
  playbackRuntime?: Record<string, any>;
  playbackState?: Record<string, any>;
  transportActions?: Record<string, any>;
};

export function createDirectDrillRuntimeAppContextOptions({
  applyEmbeddedPattern,
  applyEmbeddedPlaybackSettings,
  getEmbeddedPlaybackState,
  playbackRuntime = {},
  playbackState = {},
  transportActions = {}
}: DirectRuntimeAppOptions = {}): DirectPlaybackControllerOptions {
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
