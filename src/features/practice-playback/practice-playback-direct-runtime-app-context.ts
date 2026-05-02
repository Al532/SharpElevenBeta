import type {
  DirectPlaybackControllerOptions,
  EmbeddedPatternPayload,
  PlaybackOperationResult,
  PlaybackRuntimeState,
  PlaybackSettings
} from '../../core/types/contracts';

import { createDirectPlaybackSessionHost } from '../../core/playback/direct-playback-session-host.js';

type PracticePlaybackDirectRuntime = Pick<
  DirectPlaybackControllerOptions,
  | 'ensureWalkingBassGenerator'
  | 'getAudioContext'
  | 'noteFadeout'
  | 'stopActiveChordVoices'
  | 'rebuildPreparedCompingPlans'
  | 'buildPreparedBassPlan'
  | 'getCurrentKey'
  | 'preloadNearTermSamples'
  | 'queuePerformanceCue'
  | 'validateCustomPattern'
>;

type PracticePlaybackDirectPlaybackState = {
  getIsPlaying?: DirectPlaybackControllerOptions['isPlaying'];
};

type PracticePlaybackDirectTransportActions = {
  startPlayback?: () => Promise<void> | void;
  stopPlayback?: () => void;
  togglePausePlayback?: () => void;
};

type DirectRuntimeAppOptions = {
  applyEmbeddedPattern?: (payload: Partial<EmbeddedPatternPayload>) => PlaybackOperationResult;
  applyEmbeddedPlaybackSettings?: (settings: PlaybackSettings) => unknown;
  getEmbeddedPlaybackState?: () => Partial<PlaybackRuntimeState> | null | undefined;
  playbackRuntime?: PracticePlaybackDirectRuntime;
  playbackState?: PracticePlaybackDirectPlaybackState;
  transportActions?: PracticePlaybackDirectTransportActions;
};

export function createDirectPracticePlaybackRuntimeAppContextOptions({
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
    queuePerformanceCue: playbackRuntime.queuePerformanceCue,
    validateCustomPattern: playbackRuntime.validateCustomPattern,
    startPlayback: transportActions.startPlayback
      ? async () => {
        await transportActions.startPlayback?.();
      }
      : undefined,
    stopPlayback: transportActions.stopPlayback,
    togglePausePlayback: transportActions.togglePausePlayback
  };
}
