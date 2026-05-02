import type {
  DirectPlaybackControllerOptions,
  EmbeddedPatternPayload,
  PlaybackOperationResult,
  PlaybackRuntimeState,
  PlaybackSettings
} from '../../core/types/contracts';

import { createDirectPracticePlaybackRuntimeAppContextOptions } from './practice-playback-direct-runtime-app-context.js';

type PracticePlaybackDirectRuntime = {
  ensureWalkingBassGenerator?: DirectPlaybackControllerOptions['ensureWalkingBassGenerator'];
  getAudioContext?: DirectPlaybackControllerOptions['getAudioContext'];
  noteFadeout?: DirectPlaybackControllerOptions['noteFadeout'];
  stopActiveChordVoices?: DirectPlaybackControllerOptions['stopActiveChordVoices'];
  rebuildPreparedCompingPlans?: DirectPlaybackControllerOptions['rebuildPreparedCompingPlans'];
  buildPreparedBassPlan?: DirectPlaybackControllerOptions['buildPreparedBassPlan'];
  getCurrentKey?: DirectPlaybackControllerOptions['getCurrentKey'];
  preloadNearTermSamples?: DirectPlaybackControllerOptions['preloadNearTermSamples'];
  queuePerformanceCue?: DirectPlaybackControllerOptions['queuePerformanceCue'];
  validateCustomPattern?: DirectPlaybackControllerOptions['validateCustomPattern'];
};

type PracticePlaybackDirectPlaybackState = {
  getIsPlaying?: DirectPlaybackControllerOptions['isPlaying'];
};

type PracticePlaybackDirectTransportActions = {
  startPlayback?: () => Promise<void> | void;
  stopPlayback?: () => void;
  togglePausePlayback?: () => void;
};

export function createPracticePlaybackDirectRuntimeAppAssembly({
  embedded = {},
  playbackRuntime = {},
  playbackState = {},
  transportActions = {}
}: {
  embedded?: {
    applyEmbeddedPattern?: (payload: Partial<EmbeddedPatternPayload>) => PlaybackOperationResult;
    applyEmbeddedPlaybackSettings?: (settings: PlaybackSettings) => unknown;
    getEmbeddedPlaybackState?: () => Partial<PlaybackRuntimeState> | null | undefined;
  };
  playbackRuntime?: PracticePlaybackDirectRuntime;
  playbackState?: PracticePlaybackDirectPlaybackState;
  transportActions?: PracticePlaybackDirectTransportActions;
} = {}): DirectPlaybackControllerOptions {
  return createDirectPracticePlaybackRuntimeAppContextOptions({
    applyEmbeddedPattern: embedded.applyEmbeddedPattern,
    applyEmbeddedPlaybackSettings: embedded.applyEmbeddedPlaybackSettings,
    getEmbeddedPlaybackState: embedded.getEmbeddedPlaybackState,
    playbackRuntime,
    playbackState,
    transportActions
  });
}
