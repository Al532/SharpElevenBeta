import type {
  EmbeddedPatternPayload,
  PlaybackOperationResult,
  PlaybackRuntime,
  PlaybackRuntimeState,
  PlaybackSettings,
  PracticePlaybackControllerOptions
} from '../types/contracts';

import { createPlaybackRuntime } from './playback-runtime.js';
import { createPracticePlaybackSessionAdapter } from './practice-playback-session-adapter.js';

type PracticePlaybackRuntimeOptions = PracticePlaybackControllerOptions & {
  applyEmbeddedPattern?: (payload: EmbeddedPatternPayload) => PlaybackOperationResult;
  applyEmbeddedPlaybackSettings?: (settings: PlaybackSettings) => unknown;
  getEmbeddedPlaybackState?: () => Partial<PlaybackRuntimeState>;
};

export function createPracticePlaybackRuntime({
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
  queuePerformanceCue,
  startPlayback,
  stopPlayback,
  togglePausePlayback
}: PracticePlaybackRuntimeOptions = {}): PlaybackRuntime {
  return createPlaybackRuntime({
    adapter: createPracticePlaybackSessionAdapter({
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
      queuePerformanceCue,
      startPlayback,
      stopPlayback,
      togglePausePlayback
    })
  });
}
